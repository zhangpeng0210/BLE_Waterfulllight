/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { TYSdk } from '@ray-js/ray-panel-core';
import { onDpDataChange as onDpDataChangeRes, publishDps } from '@ray-js/api';

export const getDpIdByCode = (dpCode: string) => {
  const { devInfo = {} } = TYSdk;
  const { schema = {} } = devInfo;
  if (typeof dpCode === 'string') {
    if (!schema[dpCode]) {
      return null;
    }
    return schema[dpCode].id;
  }
  return null;
};

export const onDpDataChange = (cb: (res: any) => void) => {
  onDpDataChangeRes(rest => {
    cb(rest);
  });
};

export const putDpData = (dps: { [dp: string]: any }) => {
  const { devInfo = {} } = TYSdk;
  const dpIds = {};
  dps && Object.keys(dps).forEach(i => {
    const code = getDpIdByCode(i);
    code && (dpIds[code] = dps[i]);
  });
  console.log('%c下发dps => ', 'color:#ffb900', dpIds);
  publishDps({
    deviceId: devInfo.devId,
    dps: dpIds,
    mode: 2,
    pipelines: [],
    options: {},
  });
};

export default putDpData;
