/* eslint-disable camelcase */
import { NumberUtils, RatioUtils } from '@ray-js/ray-panel-utils';
import { store } from '@/redux';
import Strings from '@/i18n';
import _ from 'lodash';
import base64 from 'base64-js';
import mode from '../res/mode.png';

import musicTansformRes from './music/index';

const { convertX, convertY } = RatioUtils;
export const cx = convertX;
export const cy = convertY;
export const MusicTansform = musicTansformRes;

export const getFaultStrings = (
  faultCode: string,
  faultValue: number,
  onlyPrior = true
): string => {
  const { devInfo } = store.getState();
  if (!faultValue) return '';
  const { label } = devInfo.schema[faultCode];
  const labels = [];
  for (let i = 0; i < label!.length; i++) {
    const value = label![i];
    const isExist = NumberUtils.getBitValue(faultValue, i);
    if (isExist) {
      labels.push(Strings.getDpLang(faultCode, value));
      if (onlyPrior) break;
    }
  }
  return onlyPrior ? labels[0] : labels.join(', ');
};

// 时间格式化
export const formatTime = (timestamp: string | number | undefined): string => {
  if (timestamp === undefined) {
    return '';
  }
  const date = new Date(Number(timestamp));
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hour = date.getHours();
  const min = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${min}:${second}`;
};

export const scaleNumber: (scale: number, value: number) => number = (scale, value) =>
  Number((value / Math.pow(10, scale)).toFixed(scale));

// 将 struct 类型数据转换成组件需要的
export const transformData = (
  type: string,
  dataSource: { [key: string]: any },
  value: { [key: string]: any }
): {
  key: number;
  dataSource: any;
  image: any;
  title_name: any;
  unit: any;
  param_value: any;
  min: number;
  max: number;
  step: number;
  maxlen: any;
}[] => {
  let res = [];
  if (type !== 'struct') return;
  const dataArr = Object.values(dataSource || {});
  const dataKey = Object.keys(dataSource || {});
  if (!dataSource || dataSource.length) return;
  res = dataArr.map((item, idx) => {
    const {
      defaultValue,
      name,
      typeSpec: { type: dpType, range, unit, min, max, scale, step, maxlen, typeDefaultValue },
    } = item;
    let insertValue = defaultValue ?? typeDefaultValue;
    if (value) {
      insertValue = value[dataKey[idx]];
    }
    return {
      key: dataKey[idx],
      type: dpType,
      dataSource: range,
      image: mode,
      title_name: dataKey[idx],
      unit,
      param_value: dpType === 'value' ? scaleNumber(scale, insertValue) : insertValue,
      min: scaleNumber(scale, min),
      max: scaleNumber(scale, max),
      step: scaleNumber(scale, step),
      maxlen,
    };
  });
  // eslint-disable-next-line consistent-return
  return res;
};

// 获取小数点的位置
export const getFloatLength = (num: number | string): number => {
  return num.toString().split('.')[1] ? num.toString().split('.')[1].length : 0;
};


export const base64ToRaw = (value: string) => {
  const bytes = base64.toByteArray(value);
  return Array.prototype.map
    .call(bytes, (x: number) => {
      return _.padStart(x.toString(16), 2, '0');
    })
    .join('');
}

export const rawToBase64 = (value: string) => {
  if (value.length % 2 !== 0) {
    return '';
  }
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i += 2) {
    bytes.push(parseInt(value.slice(i, i + 2), 16));
  }
  return base64.fromByteArray(new Uint8Array(bytes));
}