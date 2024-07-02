import { TYSdk } from '@ray-js/ray-panel-core';
import * as itemIcon from '../pages/sceneHome/module';
import dpCodes from '@/config/dpCodes';
import scenePiexlData_016 from '../res/scenePiexlData_016';
import * as imageSrcType from '../pages/diyList/smear/module';

import { store } from '@/redux';
import { DeviceInfoModel } from '@/types';

//根据不同的pid设置items
const getHomeItems = () => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const pid = TYSdk.devInfo.state[dpCodes.pid];
  const state = store.getState();
  // 使用类型断言来告诉 TypeScript 我们知道 devOrderInfo 的确切类型
  const devOrderInfo: DeviceInfoModel = state.devOrderInfo as DeviceInfoModel;

  let scenesList = [];
  let sceneAmount = 30;
  if (isGroup) {
    scenesList = [
      { itemType: 'gif', icon: itemIcon.homeItemIcon_gif_016 },
      { itemType: 'treeStar', icon: itemIcon.homeItemIcon_treeStar },
    ];
    sceneAmount = 25;
  } else {
    switch (pid) {
      case 0:
      case 16: //
        scenesList = [
          { itemType: 'diy', icon: itemIcon.homeItemIcon_diy },
          { itemType: 'text', icon: itemIcon.homeItemIcon_text },
          { itemType: 'gif', icon: itemIcon.homeItemIcon_gif_016 },
          { itemType: 'piexl', icon: itemIcon.homeItemIcon_piexl_016 },
          { itemType: 'treeStar', icon: itemIcon.homeItemIcon_treeStar },
        ];
        sceneAmount = 25;
        break;
      default:
        break;
    }
  }
  scenesList.push({ itemType: 'collection', icon: itemIcon.homeItemIcon_collection });
 
  if (devOrderInfo.sceneAmount > 0) {
    sceneAmount = devOrderInfo.sceneAmount;
  }

  return { scenesList, sceneAmount };
};

///根据不同pid配置画布的宽高和点的直径
const getCanvasParameter = () => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const pid = TYSdk.devInfo.state[dpCodes.pid];
  const state = store.getState();
  // 使用类型断言来告诉 TypeScript 我们知道 devOrderInfo 的确切类型
  const devOrderInfo: DeviceInfoModel = state.devOrderInfo as DeviceInfoModel;

  let staticAnimationTypeList = [
    {
      normal: imageSrcType.up_n,
      selected: imageSrcType.up_s,
      animationType: 'up',
      code: '00',
    },
    {
      normal: imageSrcType.down_n,
      selected: imageSrcType.down_s,
      animationType: 'down',
      code: '01',
    },
    {
      normal: imageSrcType.left_n,
      selected: imageSrcType.left_s,
      animationType: 'left',
      code: '02',
    },
    {
      normal: imageSrcType.right_n,
      selected: imageSrcType.right_s,
      animationType: 'right',
      code: '03',
    },
    {
      normal: imageSrcType.twinkle_n,
      selected: imageSrcType.twinkle_s,
      animationType: 'flash',
      code: '04',
    },
    {
      normal: imageSrcType.stop_n,
      selected: imageSrcType.stop_s,
      animationType: 'static',
      code: '05',
    },
    {
      normal: imageSrcType.cycleUp_n,
      selected: imageSrcType.cycleUp_s,
      animationType: 'up_loop',
      code: '06',
    },
    {
      normal: imageSrcType.cycleDown_n,
      selected: imageSrcType.cycleDown_s,
      animationType: 'down_loop',
      code: '07',
    },
    {
      normal: imageSrcType.cycleLeft_n,
      selected: imageSrcType.cycleLeft_s,
      animationType: 'left_loop',
      code: '08',
    },
    {
      normal: imageSrcType.cycleRight_n,
      selected: imageSrcType.cycleRight_s,
      animationType: 'right_loop',
      code: '09',
    },
    {
      normal: imageSrcType.breathe_n,
      selected: imageSrcType.breathe_s,
      animationType: 'breathe',
      code: '0A',
    },
  ];
  let dynamicAnimationTypeList = [
    {
      normal: imageSrcType.twinkle_n,
      selected: imageSrcType.twinkle_s,
      animationType: 'flash',
      code: '00',
    },
    {
      normal: imageSrcType.breathe_n,
      selected: imageSrcType.breathe_s,
      animationType: 'breathe',
      code: '01',
    },
  ];

  let row = 0; //行
  let list = 0; //列
  switch (pid) {
    case 16: //9 * 36
      row = 36;
      list = 9;
      break;
    default:
      row = 36;
      list = 9;
      break;
  }
  if (devOrderInfo.singleNum > 0 && devOrderInfo.columnNum > 0) {
    row = devOrderInfo.singleNum;
    list = devOrderInfo.columnNum;
  }

  return { row, list, dynamicAnimationTypeList, staticAnimationTypeList };
};

//根据不同PID和item的类型配置场景的展示数据
const getSceneNumbers = pid => {
  let sceneNumbers = [];
  let commonPId = 0;
  switch (pid) {
    case 0:
    case 16: //
      sceneNumbers = [1, 2, 4, 5, 8, 10, 11, 12, 13, 16];
      commonPId = 13;
      break;
    default:
      break;
  }
  return { sceneNumbers, commonPId };
};

//根据不同的pid获取像素画的数据
const getScenePiexlDataWithPId = pid => {
  switch (pid) {
    case 0:
    case 16: //9*36
      return { piexlData: scenePiexlData_016, list: 9, row: 36 };
    default:
      break;
  }
};

export const ConfigsForPId = {
  getHomeItems,
  getCanvasParameter,
  getSceneNumbers,
  getScenePiexlDataWithPId,
};
