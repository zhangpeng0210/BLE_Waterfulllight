/* eslint-disable */
// @ts-nocheck
import dpCodes from './dpCodes';
import _get from 'lodash/get';
import { TYSdk } from '@ray-js/ray-panel-core';

/**
 * 功能支持工具类
 */
// interface ISupportUtils {
//   isSupportWhite: (isForce?: boolean) => boolean; // 支持白光
//   isSupportBright: (isForce?: boolean) => boolean; // 支持白光亮度
//   isSupportTemp: (isForce?: boolean) => boolean; // 支持色温
//   isSupportColour: (isForce?: boolean) => boolean; // 支持彩光
//   isSupportScene: (isForce?: boolean) => boolean; // 支持场景
//   isSupportCountdown: (isForce?: boolean) => boolean; // 支持倒计时
//   isSupportMusic: (isForce?: boolean) => boolean; // 支持音乐
//   isSupportRhythm: (isForce?: boolean) => boolean; // 支持生物节律
//   isGroupDevice: () => boolean;
//   isZigbeeDevice: () => boolean;
//   isSignMeshDivice: () => boolean;
//   isWifiDivice: () => boolean;
//   hasCapability: (id: number) => boolean;
// }

const cache: any = {};

const {
  brightCode,
  temperatureCode,
  colourCode,
  workModeCode,
  sceneCode,
  countdownCode,
  musicCode,
  rhythmCode,
} = dpCodes;

const supportDp = (code: string) => {
  const { schema } = TYSdk.devInfo;
  return !!schema[code];
};

const supportWorkMode = (code: string) => {
  const { schema } = TYSdk.devInfo;
  const workModeRange: string[] = _get(schema[workModeCode], 'range') || [];
  return workModeRange.includes(code);
};

const isSupportByDpAndWorkMode = (
  code: string,
  dpCode: string,
  workmode: string,
  isForce: boolean
) => {
  if (!isForce) {
    if (cache[code]) {
      return cache[code];
    }
  }
  // 是否存在相关dp
  const isDpSupport = supportDp(dpCode);
  const isInWorkMode = supportWorkMode(workmode);
  // 没有相关dp支持
  let isSupport = false;
  if (isDpSupport && isInWorkMode) {
    // if (cloudSupport !== false) {
    isSupport = true;
    // }
  }
  cache[code] = isSupport;
  return isSupport;
};

const isSupportByDp = (code: string, dpCode: string, isForce: boolean) => {
  if (!isForce) {
    if (cache[code]) {
      return cache[code];
    }
  }
  // 是否存在相关dp
  const isDpSupport = supportDp(dpCode);
  // 没有相关dp支持
  let isSupport = false;
  if (isDpSupport) {
    // if (cloudSupport !== false) {
    isSupport = true;
    // }
  }
  cache[code] = isSupport;
  return isSupport;
};

const SupportUtils = {
  isGroupDevice() {
    return !!TYSdk.devInfo.groupId;
  },
  isSupportBright(isForce: boolean = false) {
    return isSupportByDpAndWorkMode('isSupportBright', brightCode, 'white', isForce);
  },
  isSupportTemp(isForce: boolean = false) {
    return isSupportByDpAndWorkMode('isSupportTemp', temperatureCode, 'white', isForce);
  },
  isSupportColour(isForce: boolean = false) {
    return isSupportByDpAndWorkMode('isSupportColour', colourCode, 'colour', isForce);
  },
  isSupportScene(isForce: boolean = false) {
    return isSupportByDpAndWorkMode('isSupportScene', sceneCode, 'scene', isForce);
  },
  isSupportMusic(isForce: boolean = false) {
    return isSupportByDpAndWorkMode('isSupportMusic', musicCode, 'music', isForce);
  },
  isSupportCountdown(isForce: boolean = false) {
    return isSupportByDp('isSupportCountdown', countdownCode, isForce);
  },
  isSupportRhythm(isForce: boolean = false) {
    return isSupportByDp('isSupportRhythm', rhythmCode, isForce);
  },
  isSupportWhite(isForce: boolean = false) {
    const code = 'isSupportWhite';
    if (!isForce) {
      if (cache[code]) {
        return cache[code];
      }
    }
    // 是否存在相关dp
    const isSupportBright = this.isSupportBright(true);
    const isSupportTemp = this.isSupportTemp(true);

    let isSupport = false;
    if (isSupportBright || isSupportTemp) {
      // 有相关dp支持，但云端未开启不支持该功能
      // if (cloudSupport !== false) {
      isSupport = true;
      // }
    }
    cache[code] = isSupport;
    return cache[code];
  },
  isSupportWorkMode(code: string) {
    return supportWorkMode(code);
  },
  isSupportDp(dpCode: string, isForce: boolean = false) {
    const code = `isSupport_${dpCode}`;
    if (!isForce) {
      if (cache[code]) {
        return cache[code];
      }
    }
    const isSupportDp = supportDp(dpCode);
    let isSupport = false;
    if (isSupportDp) {
      // 有相关dp支持，但云端未开启不支持该功能
      // if (cloudSupport !== false) {
      isSupport = true;
      // }
    }
    cache[code] = isSupport;
    return cache[code];
  },
  hasCapability(id: number) {
    return (TYSdk.devInfo.capability & (1 << id)) > 0;
  },
  isZigbeeDevice() {
    return this.hasCapability(12);
  },
  isSignMeshDevice() {
    return this.hasCapability(15);
  },
  isWifiDevice() {
    return this.hasCapability(1);
  },
};

export default SupportUtils;
