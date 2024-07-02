import { updateDpCreator } from '@/libs/@tuya-rn/tuya-dp-kit';
import { createAction } from 'redux-actions';
import { DpState } from '../reducers/common';

/**
 * actions
 */
const devInfoChange = createAction('DEV_INFO_CHANGE');
const deviceChange = createAction('_DEVICECHANGED_');
const responseUpdateDp = createAction('RESPONSE_UPDATE_DP');
const changeDp = createAction('CHANGE_DP');
const updateDp = updateDpCreator<Partial<DpState>>();

const cloudChange = createAction('CLOUD_CHANGE');

const updatePanel = createAction('UPDATE_PANEL');
const initStaticPrefix = createAction('INIT_STATIC_PREFIX');
const initIoTConfig = createAction('INIT_IOT_CONFIG');
const initFunConfig = createAction('INIT_FUN_CONFIG');
const initBicConfig = createAction('INIT_BIC_CONFIG');
const updateMiscConfig = createAction('UPDATE_MISC_CONFIG');
const initializedConfig = createAction('INITIALIZED_CONFIG');
const updateAppTheme = createAction('UPDATE_APP_THEME_COLOR');
const consoleChange = createAction('CONSOLECHNAGE');
const clearConsole = createAction('CLEARCONSOLE');
//群组dp更新
const updateGroupDPs = createAction('UPDATA_GROUP_DPS');
//设备的命令0x00的信息
const updateDevOrderInfo = createAction('UPDATA_DEV_ORDERINFO');
//选中某个场景id或者diy的key
const updateSelectedData = createAction('UPDATE_SELECTEDDATA');

// 弹出事件弹框
const toggleShowModel = createAction('TOGGLE_SHOW_MODEL');

export const actions = {
  devInfoChange,
  deviceChange,
  responseUpdateDp,
  changeDp,
  updateDp,
  updatePanel,
  cloudChange,
  initStaticPrefix,
  initIoTConfig,
  initFunConfig,
  initBicConfig,
  updateMiscConfig,
  initializedConfig,
  updateAppTheme,
  consoleChange,
  clearConsole,
  toggleShowModel,
  updateGroupDPs,
  updateDevOrderInfo,
  updateSelectedData,
};
