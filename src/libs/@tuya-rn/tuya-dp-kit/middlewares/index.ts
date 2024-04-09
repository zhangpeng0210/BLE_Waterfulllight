/* eslint-disable @typescript-eslint/no-explicit-any */
import DpTransform, { DpMap } from '../libs/tuya-dp-transform';
import {
  isEqual,
  debounce as lodashDebounce,
  throttle as lodashThrottle,
} from 'lodash';
import { compose, Dispatch, Middleware } from 'redux';

import { CHANGE_DP, DEV_INFO_CHANGE, RESPONSE_UPDATE_DP } from '../actionTypes';
import { isPlainObject, logger } from '../utils';

type DpValue = string | number | boolean;

type CustomRawDpMap = {
  parser?: (dpValue: string) => any;
  formatter?: (parsedDpValye: any) => string;
};

type EnhancedDpMap = DpMap | CustomRawDpMap;

export type SendDpOption<DpState = any> = {
  /**
   * 立即触发state更新
   */
  readonly immediate?: boolean;
  /**
   * 多个dp是否按对象里的顺序下发(可以确保固件收到的顺序)
   */
  readonly ordered?: boolean;
  /**
   * 重复值不下发
   *
   * 与当前`dpState`进行比较，重复值检出不下发
   */
  readonly checkRepeat?: boolean;
  /**
   * 过滤过时的下发引起的上报
   *
   * 比如：Slider通常同时受控于用户滑动、点击以及dp上报值，这就可能造成：短时间内连续滑动触发多次下发，后续接收到多次上报后Slider会出现抖动。
   *
   * 建议和`immediate`一起使用
   */
  readonly filterExpired?: boolean;
  /**
   * 下发dp的过时时间
   */
  // readonly expiredTime?: number;
  /**
   * 延迟下发
   */
  readonly delay?: number;
  /**
   * 下发节流 (与防抖冲突)
   */
  readonly throttle?: number;
  /**
   * 下发防抖 (与节流冲突)
   */
  readonly debounce?: number;
  /**
   * dp解析与反解析 (配合dispatch和selector单独使用的情况)
   */
  readonly rawDpMap?: Partial<Record<keyof DpState, EnhancedDpMap>>;
  /**
   * 当上报匹配了下发时的钩子
   *
   * 比如下发了temp: 20后设备同样上报了temp: 20，将触发这个钩子
   *
   * 需要filterExpired开启后才能起效
   */
  readonly onResponseMatched?: (
    /**
     * dpValue
     */
    dpValue: any,
    /**
     * dpCode
     */
    dpCode: string
  ) => any;
};

export type DpKitMiddlewareMap<DpState = any, RootState = any> = {
  /**
   * 下发dp方法 避免与其他库的耦合
   *
   * RN面板开发为TYSdk.device.putDeviceData
   */
  readonly putDeviceData: (dpState: Record<string, any>) => void;
  /**
   * dp解析规则
   *
   * 协议规则参考tuya-dp-transform
   *
   * 当然 你也可以使用自定义的规则
   */
  readonly rawDpMap?: Partial<Record<keyof DpState, EnhancedDpMap>>;
  /**
   * dp下发选项
   */
  readonly sendDpOption?: SendDpOption<DpState>;
  /**
   * 下发dp前的钩子
   */
  readonly onBeforeSendDp?: (
    /**
     * 当次下发的dp
     */
    dpState: Partial<DpState>,
    { getState, dispatch }: { getState: () => RootState; dispatch: Dispatch }
  ) => any;
  /**
   * 下发dp前的钩子
   */
  readonly onAfterSendDp?: (
    /**
     * 当次下发的dp
     */
    dpState: Partial<DpState>,
    { getState, dispatch }: { getState: () => RootState; dispatch: Dispatch }
  ) => any;
  /**
   * 监听到dp上报后的钩子（在store状态变化之前）
   */
  readonly onResponseDp?: (
    /**
     * 当次上报的dp
     */
    dpState: Partial<DpState>,
    { getState, dispatch }: { getState: () => RootState; dispatch: Dispatch }
  ) => any;
  /**
   * 初始化dp的钩子（由DevInfoChange引发，在store状态变化之前）
   */
  readonly onInitializeDp?: (
    /**
     * 初始化的dp
     */
    dpState: DpState,
    { getState, dispatch }: { getState: () => RootState; dispatch: Dispatch }
  ) => any;
};

type DpQueueMapItem = {
  queue: {
    readonly value: DpValue;
  }[];
  onResponseMatched: (
    /**
     * dpValue
     */
    dpValue: any,
    /**
     * dpCode
     */
    dpCode: string
  ) => any;
};

/**
 * 默认初始配置
 */
const defaultSendDpOption = {
  immediate: false,
  ordered: false,
  checkRepeat: false,
  filterExpired: false,
  // expiredTime: 6000,
  throttle: 0,
  debounce: 0,
  delay: 0,
} as SendDpOption;

/**
 *
 * @param config - 配置项
 * @returns dp kit 中间件
 */
export const createDpKitMiddleware: <
  DpState = Record<string, any>,
  RootState = any
  >(
  config: DpKitMiddlewareMap<DpState, RootState>
) => Middleware<any, RootState> = (
  {
    putDeviceData,
    rawDpMap = {},
    sendDpOption,
    onBeforeSendDp,
    onAfterSendDp,
    onResponseDp,
    onInitializeDp,
  } = { putDeviceData: null }
) => {
    if (!putDeviceData || typeof putDeviceData !== 'function') {
      throw new Error('未传入putDeviceData或putDeviceData不是一个函数');
    }

    if (rawDpMap && !isPlainObject(rawDpMap)) {
      throw new Error('rawDpMap不是正确类型');
    }

    /**
     * raw dp协议配置entries
     */
    const rawDpMapEntries = Object.entries<EnhancedDpMap>(rawDpMap);

    /**
     * dp下发选项 会影响所有的action
     */
    const {
      immediate: defaultImmediate,
      ordered: defaultOrdered,
      checkRepeat: defaultCheckRepeat,
      filterExpired: defaultFilterExpired,
      // expiredTime: defaultExpiredTime,
      delay: defaultDelay,
      throttle: defaultThrottle,
      debounce: defaultDebounce,
    } = {
      ...defaultSendDpOption,
      ...sendDpOption,
    };

    const throttleMap = new Map();

    const debounceMap = new Map();

    const dpQueueMap = new Map<string, DpQueueMapItem>();

    /**
     *
     * @param dpStateOrigin 转换前的dpState
     * @returns 转换后的dpState
     */
    const parseRawDpState = (dpStateOrigin) => {
      const dpStateParsed = {};

      rawDpMapEntries.forEach(([key, dpMap]) => {
        if (Object.prototype.hasOwnProperty.call(dpStateOrigin, key)) {
          if ((dpMap as CustomRawDpMap)?.parser) {
            dpStateParsed[key] = (dpMap as CustomRawDpMap).parser(
              dpStateOrigin[key]
            );
          } else {
            dpStateParsed[key] = DpTransform.parse(
              dpStateOrigin[key],
              dpMap as DpMap
            );
          }
          logger(
            `已转换raw类型dp: ${key}
          ${dpStateOrigin[key]}
          =>
          ${JSON.stringify(dpStateParsed[key])}`
          );
        }
      });
      return { ...dpStateOrigin, ...dpStateParsed };
    };

    /**
     * 根据dp-transform格式化dp
     * @param dpStateOrigin 格式化前的dpState
     * @returns 格式化后的dpState
     */
    const formatRawDpState = (
      dpStateOrigin,
      entries: [string, EnhancedDpMap][]
    ) => {
      const dpStateFormatted = {};

      entries.forEach(([key, dpMap]) => {
        if (Object.prototype.hasOwnProperty.call(dpStateOrigin, key)) {
          if ((dpMap as CustomRawDpMap)?.formatter) {
            dpStateFormatted[key] = (dpMap as CustomRawDpMap).formatter(
              dpStateOrigin[key]
            );
          } else {
            dpStateFormatted[key] = DpTransform.format(
              dpStateOrigin[key],
              dpMap as DpMap
            );
          }
        }
      });
      return { ...dpStateOrigin, ...dpStateFormatted };
    };

    /**
     *
     * @param dpState dpState
     * @param getState getState
     * @param checkRepeat 是否校验重复值
     * @returns 过滤后的dpState
     */
    const filterRepeat = (dpState, getState, checkRepeat: boolean) => {
      if (checkRepeat) {
        const dpStateCurrent = getState().dpState;
        return Object.keys(dpState)
          .filter((key) => {
            if (isEqual(dpStateCurrent[key], dpState[key])) {
              logger(
                `dp值重复，已过滤 => ${key}: ${typeof dpState[key] === 'object'
                  ? JSON.stringify(dpState[key])
                  : dpState[key]
                }`
              );
              return false;
            }
            return true;
          })
          .reduce((newDpState, key) => {
            newDpState[key] = dpState[key];
            return newDpState;
          }, {});
      }
      return dpState;
    };

    /**
     *
     * @param dpState dpState
     * @param ordered 是否按顺序下发
     */
    const sendDp = (dpState, ordered) => {
      if (ordered) {
        logger(`dp会被依次下发 ${JSON.stringify(dpState)}`);
        Object.entries(dpState).forEach(([key, value]) => {
          putDeviceData?.({ [key]: value });
        });
      } else {
        putDeviceData?.(dpState);
      }
    };

    /**
     * 根据dpMap转换生成新的action
     * @param action 原始action
     * @returns 转换后的action
     */
    const makeNewDevInfoChangeAction = (action) => {
      const { state: dpState } = action.payload;
      const dpStateParsed = parseRawDpState(dpState);

      /**
       * 直接修改payload可以让logger里打印转换后的值，但还不确定直接修改对象是否会造成引用问题
       */
      action.payload.state = dpStateParsed;
      return action;
    };

    /**
     * 根据dpMap转换生成新的action
     * @param action 原始action
     * @returns 转换后的action
     */
    const makeNewResponseUpdateDpAction = (action) => {
      const { payload: dpState } = action;
      const dpStateParsed = parseRawDpState(dpState);
      action.payload = dpStateParsed;
      return action;
    };

    /**
     * 根据下发队列进行过滤，丢掉过时的下发引起的上报
     * @param action 原始action
     * @returns 过滤后的action
     */
    const filterByDpQueue = (action) => {
      const { payload: dpState, meta = {} } = action;

      if (meta.doNotFilterByQueue) return action;

      const newDpState = {};
      const dpEntries = Object.entries<DpValue>(dpState);

      dpEntries.forEach(([dpKey, dpValue]) => {
        const dpQueueMapItem = dpQueueMap.get(dpKey);
        if (!dpQueueMapItem || dpQueueMapItem?.queue.length === 0) {
          // 未创建队列或队列为空
          newDpState[dpKey] = dpValue;
        } else {
          const { queue, onResponseMatched } = dpQueueMapItem;
          const existIndex = queue.findIndex(({ value }) => value === dpValue);
          if (existIndex === 0) {
            // 匹配队列首位 过时下发引起的上报
            onResponseMatched?.(dpValue, dpKey as any);
            if (queue.length === 1) {
              newDpState[dpKey] = dpValue;
            } else {
              logger(`该上报dp匹配了下发队列中的值，忽略\n${dpKey}: ${dpValue}`);
            }
            queue.shift();
          } else {
            // i. 上报值不在队列中 (-1)
            // ii. 上报值不在队列首位 (>0)
            newDpState[dpKey] = dpValue;
            dpQueueMapItem.queue = [];
          }
        }
      });

      action.payload = newDpState;

      return action;
    };

    return ({ dispatch, getState }) =>
      (next) =>
        (action) => {
          switch (action.type) {
            case DEV_INFO_CHANGE: {
              onInitializeDp?.(action.payload.state, { getState, dispatch });
              return next(makeNewDevInfoChangeAction(action));
            }
            case RESPONSE_UPDATE_DP: {
              onResponseDp?.(action.payload, { getState, dispatch });

              return compose(
                next,
                makeNewResponseUpdateDpAction,
                filterByDpQueue
              )(action);
            }
            case CHANGE_DP: {
              const dpState = action.payload as {
                readonly [dpCode: string]: any;
              };

              const option = (action.meta ?? {}) as SendDpOption;

              const {
                immediate = defaultImmediate,
                ordered = defaultOrdered,
                checkRepeat = defaultCheckRepeat,
                filterExpired = defaultFilterExpired,
                // TODO 过时时间
                // expiredTime = defaultExpiredTime,
                delay = defaultDelay,
                throttle = defaultThrottle,
                debounce = defaultDebounce,
                rawDpMap: independentRawDpMap,
                onResponseMatched,
              } = option;

              const dpStateFiltered = filterRepeat(dpState, getState, checkRepeat);
              const dpStateFormatted = formatRawDpState(
                dpStateFiltered,
                independentRawDpMap
                  ? Object.entries<EnhancedDpMap>(independentRawDpMap)
                  : rawDpMapEntries
              );

              const dpEntries = Object.entries<DpValue>(dpStateFormatted);

              if (dpEntries.length > 0) {
                const handler = () => {
                  /**
                   * 将下发的dp记录到队列
                   */
                  if (filterExpired) {
                    dpEntries.forEach(([dpKey, dpValue]) => {
                      if (!dpQueueMap.has(dpKey)) {
                        dpQueueMap.set(dpKey, { queue: [], onResponseMatched });
                      }
                      const { queue } = dpQueueMap.get(dpKey);
                      queue.push({ value: dpValue });
                    });
                  }

                  if (delay && typeof delay === 'number') {
                    logger(
                      `${JSON.stringify(dpStateFormatted)}将在${delay}ms后下发`
                    );
                    setTimeout(() => {
                      onBeforeSendDp?.(dpState as any, { getState, dispatch });

                      sendDp(dpStateFormatted, ordered);

                      onAfterSendDp?.(dpState as any, { getState, dispatch });
                    }, delay);
                  } else {
                    onBeforeSendDp?.(dpState as any, { getState, dispatch });

                    sendDp(dpStateFormatted, ordered);

                    onAfterSendDp?.(dpState as any, { getState, dispatch });
                  }

                  /**
                   * 立即触发state更新
                   */
                  if (immediate) {
                    logger(
                      `${JSON.stringify(dpStateFormatted)}将被立即更新到store`
                    );
                    return dispatch({
                      type: RESPONSE_UPDATE_DP,
                      payload: dpStateFormatted,
                      meta: { doNotFilterByQueue: true },
                    });
                  }
                  return next(action);
                };

                /**
                 * 下发节流
                 */
                if (throttle && typeof throttle === 'number') {
                  logger(`该下发指令会存在一个${throttle}ms的节流`);
                  const throttleKey = Object.keys(dpState).join('@');
                  if (!throttleMap.has(throttleKey)) {
                    throttleMap.set(
                      throttleKey,
                      lodashThrottle((f) => f(), throttle, { trailing: false })
                    );
                  }
                  const throttleHandler = throttleMap.get(throttleKey);
                  return throttleHandler?.(handler);
                }

                /**
                 * 下发防抖
                 */
                if (debounce && typeof debounce === 'number') {
                  logger(`该下发指令会存在一个${debounce}ms的防抖`);
                  const debounceKey = Object.keys(dpState).join('@');
                  if (!debounceMap.has(debounceKey)) {
                    debounceMap.set(
                      debounceKey,
                      lodashDebounce((f) => f(), debounce)
                    );
                  }
                  const debounceHandler = debounceMap.get(debounceKey);
                  return debounceHandler?.(handler);
                }

                return handler();
              }
              break;
            }
            default:
              break;
          }
          return next(action);
        };
  };
