/* eslint-disable @typescript-eslint/no-explicit-any */
import { TYSdk } from '@ray-js/ray-panel-core';
import { api } from '@/api';
import { getSystemInfo, syncTimerTask } from '@ray-js/api';

/**
 *
 * @param category 'schedule'
 * @param loops '0111111' 周日 -- 周六
 * @param actions {time: '11:11', dps:{1:true}}
 * @param status 0：关闭；1：开启；2：删除。
 */
const addTimer = (loops: string, actions: any, status: number, aliasName = '') => {
  const bizType = TYSdk.devInfo.groupId ? 1 : 0;
  const bizId = TYSdk.devInfo.groupId || TYSdk.devInfo.devId;
  const postData = {
    bizType,
    bizId,
    loops,
    category: 'schedule',
    status,
    actions,
    isAppPush: false,
    aliasName,
  };
  // console.log('添加定时 postData: ', JSON.parse(JSON.stringify(postData)));
  return api('tuya.m.clock.dps.add', postData, '1.0');
};

const updateTimer = (
  id: number,
  loops: string,
  actions: any,
  status: number,
  aliasName = ''
) => {
  const bizType = TYSdk.devInfo.groupId ? 1 : 0;
  const bizId = TYSdk.devInfo.groupId || TYSdk.devInfo.devId;
  const postData = {
    bizType,
    bizId,
    loops,
    id,
    status,
    actions,
    isAppPush: false,
    aliasName,
  };
  return api('tuya.m.clock.dps.update', postData);
};

const changeTimerStatus = (ids: number | number[], status?: number) => {
  let idArr = ids;
  if (!Array.isArray(ids)) {
    idArr = [ids];
  }
  const bizType = TYSdk.devInfo.groupId ? 1 : 0;
  const bizId = TYSdk.devInfo.groupId || TYSdk.devInfo.devId;
  const postData = {
    bizType,
    bizId,
    ids: idArr.join(','),
    status,
  };
  return api('tuya.m.clock.batch.status.update', postData);
};

const getTimerList = () => {
  const bizType = TYSdk.devInfo.groupId ? 1 : 0;
  const bizId = TYSdk.devInfo.groupId || TYSdk.devInfo.devId;
  const postData = {
    category: 'schedule',
    bizId,
    bizType,
  };
  return api('tuya.m.clock.dps.list', postData);
};

export const TimerApi = {
  getTimerList,
  changeTimerStatus,
  updateTimer,
  addTimer,
};
