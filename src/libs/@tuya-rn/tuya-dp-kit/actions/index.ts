import { createAction } from '@reduxjs/toolkit';

import { CHANGE_DP, DEV_INFO_CHANGE, RESPONSE_UPDATE_DP } from '../actionTypes';
import { SendDpOption } from '../middlewares';

/**
 * devInfo变化的action的创建器
 *
 * 通常在初始化获得devInfo后使用
 */
export const devInfoChangeCreator = <T>() => createAction<T>(DEV_INFO_CHANGE);

/**
 * 收到设备上报的action的创建器
 *
 * 通常在监听mqtt上报状态时使用
 */
export const responseUpdateDpCreator = <T>() =>
  createAction<T>(RESPONSE_UPDATE_DP);

/**
 * 下发dp方法，提供了许多下发选项来满足各种功能，支持注入DpState类型
 *
 * `export const updateDp = updateDpCreator<Partial<DpState>>();`
 *
 * - 请在项目中全程使用dispatch(updateDp({ [dpCode]: dpValue }))来进行dp的下发
 */
export const updateDpCreator =
  <T>() =>
  (dpState: T, option?: SendDpOption) => {
    return {
      type: CHANGE_DP,
      payload: dpState,
      meta: option,
    };
  };
