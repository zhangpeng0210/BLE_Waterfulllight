/* eslint-disable no-console */
import { getOssUrl, getUiIdI18N } from '@/api';
import { Connect } from '@/components';
import { Text } from '@ray-js/components';
import { actions, store } from '@/redux';
import { ReduxState } from '@/redux/store';
import _ from 'lodash';
import { detailedDiff } from 'deep-object-diff';
import React, { Component } from 'react';
import { connect, Provider } from 'react-redux';
import { TYSdk } from '@ray-js/ray-panel-core';
import { Strings } from '@ray-js/ray-panel-i18n';
import String from '@/i18n';
import { Theme } from '@ray-js/ray-panel-theme';
import { JsonUtils } from '@ray-js/ray-panel-utils';
import { CloudConfig, Config, withConfig } from '@ray-js/ray-panel-standard-hoc';
import { LampApi } from '@/api';
import {
  subscribeDeviceRemoved,
  onDeviceRemoved,
  exitMiniProgram,
  registerDeviceListListener,
  onBLEConnectStatusChange,
  subscribeBLEConnectStatus,
  getBLEOnlineState,
} from '@ray-js/api';
import { onGroupDpDataChangeEvent, registerGroupChange } from '@ray-js/ray';
import { toFixed } from '@ray-js/panel-sdk/lib/utils';
import { dpUtils } from '@/redux/index';
import dpCodes from '@/config/dpCodes';

const { parseJSON } = JsonUtils;

interface Props {
  devInfo: any;
  // eslint-disable-next-line react/require-default-props
  extraInfo?: Record<string, any>;
  // eslint-disable-next-line react/require-default-props
  preload?: boolean;
}

interface State {
  isI18NLoaded: boolean;
}

interface ConnectedProps extends ReduxState {
  mapStateToProps: any;
}

const composeLayout = (Comp: React.ComponentType<any>) => {
  const ThemeContainer = connect((props: ReduxState) => ({ theme: props.theme }))(Theme);
  const { dispatch } = store;

  const onInit = (devInfo: any) => {
    try {
      getOssUrl().then(staticPrefix => dispatch(actions.common.initStaticPrefix(staticPrefix)));
      dispatch(actions.common.updateMiscConfig({ hasSwitch: !!devInfo.schema.switch }));
    } catch (error) {
      console.warn('onApplyConfig Failed :>> ', error);
    }
  };

  const onApplyConfig = (config: Config, devInfo: any, source: string) => {
    try {
      dispatch(actions.common.initIoTConfig(config.iot));
      const bicConfigMap: CloudConfig = _.get(TYSdk, 'devInfo.panelConfig.bic', []).reduce(
        (acc: CloudConfig, cur: CloudConfig['jump_url'] | CloudConfig['timer']) => ({
          ...acc,
          [cur!.code]: cur,
        }),
        {}
      );
      const showSchedule = !!bicConfigMap?.timer?.selected;
      dispatch(actions.common.initBicConfig(bicConfigMap));
      const { timestamp, ...dpFun } = config.dpFun || {};
      const funConfig = _.mapValues(dpFun, value => parseJSON(value));
      dispatch(actions.common.initFunConfig({ ...funConfig, raw: config.dpFun }));
      dispatch(actions.common.updateMiscConfig({ ...config.misc, showSchedule }));
      dispatch(actions.common.initializedConfig());
    } catch (error) {
      console.warn('onApplyConfig Failed :>> ', error);
    }
  };

  const NavigatorLayout: React.FC<Props> = p => {
    return (
      <Connect mapStateToProps={_.identity}>
        {({ mapStateToProps, ...props }: ConnectedProps) => {
          const { panelConfig } = props;
          if (Object.keys(props.devInfo.dps).length === 0) {
            return <Text>{Strings.getLang('hang')}</Text>;
          }
          const hasInit = panelConfig.initialized;
          return hasInit ? <Comp {...p} {...props} /> : null;
        }}
      </Connect>
    );
  };

  const NavigatorLayoutContainer = withConfig({
    onInit,
    onApplyConfig,
  })(NavigatorLayout);

  const TYDevice = TYSdk.device;
  const TYEvent = TYSdk.event;

  setTimeout(() => {
    TYEvent.on('deviceDataChange', data => {
      switch (data.type) {
        case 'dpData':
          dispatch(actions.common.responseUpdateDp(data.payload as any));
          break;
        default:
          dispatch(actions.common.deviceChange(data.payload as any));
          break;
      }
    });
  }, 10);

  //蓝牙连接成功后同步时间
  const updateCurrentTimestamp = () => {
    const timeStamp = Math.round(new Date().getTime() / 1000);

    const byte1 = toFixed(((timeStamp >> 24) & 0xff).toString(16), 2);
    const byte2 = toFixed(((timeStamp >> 16) & 0xff).toString(16), 2);
    const byte3 = toFixed(((timeStamp >> 8) & 0xff).toString(16), 2);
    const byte4 = toFixed((timeStamp & 0xff).toString(16), 2);

    const dpStr = 'aa0504' + byte1 + byte2 + byte3 + byte4 + 'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: dpStr,
    });
    console.log('dpStr', dpStr);
  };

  const initThingModel = devId => {
    updateCurrentTimestamp();

    try {
      registerDeviceListListener({
        deviceIdList: [devId],
        success: () => console.log('DeviceList调用成功'),
        fail: () => console.warn(' DeviceList调用失败'),
      });
    } catch (error) {
      console.error('registerDeviceListListener Failed :>> ', error);
    }

    // 订阅设备移除事件
    subscribeDeviceRemoved({
      deviceId: devId,
      success: () => {
        console.log('subscribeDeviceRemoved 调用成功');
        // 监听删除设备事件
        onDeviceRemoved(body => {
          console.log('OnDeviceRemoved 调用成功', body);
          // 退出小程序容器
          exitMiniProgram();
        });
      },
      fail: () => console.warn('subscribeDeviceRemoved 调用失败'),
    });

    getBLEOnlineState({
      deviceId: devId,
      success(params) {
        if (params.isOnline) {
        } else {
          ty.showModal({
            title: String.getLang('当前蓝牙设备未连接'),
            showCancel: false,
            confirmText: 'OK',
            success(params) {
              // 退出小程序容器
              exitMiniProgram();
            },
          });
        }
      },
    });

    try {
      //监听蓝牙设备的连接状态
      subscribeBLEConnectStatus({
        deviceId: devId,
        success(params) {
          console.log('监听蓝牙设备成功');
          onBLEConnectStatusChange(status => {
            if (status.status == 'CONNECTED') {
              updateCurrentTimestamp();
            }
          });
        },
      });
    } catch (error) {}
  };

  class PanelComponent extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        isI18NLoaded: false,
      };
    }

    onLaunch(object: any) {
      this.init();
    }

    onShow(object: any) {
      // console.log('app onShow: ', object);
    }

    onHide(object: any) {
      console.log('app onHide: ', object);
    }

    onError(object: any) {
      console.log('app onError: ', object);
    }

    onPageNotFound(object: any) {
      console.log('app onPageNotFound: ', object);
    }

    onUnhandledRejection(object: any) {}

    onThemeChange(object: any) {
      console.log('app onThemeChange', object);
    }

    globalData: 'I am global data';

    async initCloud() {
      // 获取本地数据
      const localData = await LampApi.fetchLocalConfig();
      if (localData && Object.keys(localData).length) {
        dispatch(actions.common.cloudChange(localData));
        // 同步数据
        LampApi.syncCloudConfig();
      } else {
        // 加载云端配置
        LampApi.fetchCloudConfig().then(cloudData => {
          if (cloudData && Object.keys(cloudData).length) {
            dispatch(actions.common.cloudChange(cloudData));
          }
        });
      }
    }
    init() {
      /**
       * 如果当前 ui 和 uiId 对应不上，则说明当前运行的为二级页面，
       * 因此需要针对二级页面单独拉取其 uiId 并合并至当前项目多语言中
       */
      const { props } = this;
      const ui = props?.devInfo?.ui?.split('_')[0];
      const isSubUiId = ui !== props?.devInfo?.uiId;
      const isI18NLoaded = !isSubUiId;
      this.setState({ isI18NLoaded });

      if (props && props.devInfo && props.devInfo.devId) {
        TYDevice.setDeviceInfo(props.devInfo);
        TYDevice.getDeviceInfo().then(data => {
          console.log('initAPP getDeviceInfo', data);
          const isGroup = data.groupId !== undefined;
          if (isGroup) {
            registerGroupChange({
              groupIdList: [data.groupId],
              success(params) {},
            });
            onGroupDpDataChangeEvent(params => {
              if (params['dps'] !== undefined) {
                dispatch(actions.common.updateGroupDPs(params['dps']));
              }
            });

            dispatch(actions.common.updateGroupDPs(data.dps));
          }
          dispatch(actions.common.devInfoChange(data));
          dispatch(
            actions.common.updatePanel({
              homeTab: data.state.work_mode,
            })
          );
          data.devId && initThingModel(data.devId);
        });
      } else if (props.preload) {
        // do something
      } else {
        TYDevice.getDeviceInfo()
          .then(data => {
            dispatch(actions.common.devInfoChange(data));
            dispatch(
              actions.common.updatePanel({
                homeTab: data.state.work_mode,
              })
            );
            data.devId && initThingModel(data.devId);
          })
          .catch((e: Error) => {
            console.warn(e);
          });
      }

      if (isI18NLoaded) {
        return;
      }
      this.applySubUiIDAddedI18N();
    }

    /**
     * 比对当前 pid 多语言和当前使用的二级页面的 uiId 多语言，
     * 将二级页面 uiId 多语言多出的字段合并进去，
     * 将和 pid 多语言有冲突多语言字段给予警告提示
     */
    applySubUiIDAddedI18N() {
      const { devInfo } = this.props;
      console.warn('检测到当前项目为二级页面开始获取当前项目 UIID 多语言');
      getUiIdI18N(devInfo.uiId).then(data => {
        console.log('多语言获取成功：', data);
        const diff = detailedDiff(TYSdk.native.lang, data) as {
          added: Record<string, unknown>;
          updated: Record<string, unknown>;
          deleted: Record<string, unknown>;
        };
        Strings.applyStrings(diff.added);
        console.warn('当前二级页面 uiId 多语言有以下字段与 pid 多语言冲突，请注意!', diff.updated);
        this.setState({ isI18NLoaded: true });
      });
    }

    render() {
      const { devInfo, extraInfo } = this.props;
      const { isI18NLoaded } = this.state;
      return (
        <Provider store={store}>
          <ThemeContainer>
            {isI18NLoaded && (
              <NavigatorLayoutContainer devInfo={devInfo} extraInfo={extraInfo} {...this.props} />
            )}
          </ThemeContainer>
        </Provider>
      );
    }
  }
  return PanelComponent;
};

export default composeLayout;
