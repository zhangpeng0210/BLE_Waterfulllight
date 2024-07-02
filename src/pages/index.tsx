/* eslint-disable no-shadow */
import React, { useState, useEffect } from 'react';
import { View } from '@ray-js/components';
import { useDispatch } from 'react-redux';
import { useSelector, actions, dpUtils } from '@/redux/index';
import { HomeTab, DeviceInfoModel } from '@/types';
import dpCodes from '@/config/dpCodes';
import { useTopBarTheme, useSetTopBarTitle } from '@/hooks';
import SupportUtils from '@/utils/supportUtils';
import Strings from '../i18n';
import { hooks, utils } from '@ray-js/panel-sdk';

import ControllerBar from './ControllerBar';
import DimmerView from './dimmer/index';
import SceneHomeView from './sceneHome/index';
import MusicView from './music/index';
import SettingView from './setting/index';
import { TYSdk } from '@ray-js/ray-panel-core';
import {
  publishGroupDps,
  usePageEvent,
  openOTAUpgrade,
  checkOTAUpgradeStatus,
  getDevProperty,
  saveDevProperty,
} from '@ray-js/ray';

import * as tabarIcon from './module';

import './index.module.less';
const { useDpState } = hooks;
const { common: commonActions } = actions;

const Home = () => {
  usePageEvent('onShow', () => {
    ty.showMenuButton();
  });

  useTopBarTheme();
  useSetTopBarTitle();

  const { hexStringToNumber, parseJSON } = utils;
  const [deviceInfoModel] = useDpState(dpCodes.DIY); //因为命令请求的时候是通过功能点diy发送的，所以设备回复也是通过diy
  const [workMode] = useDpState(dpCodes.workMode);
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const { getDpIdByCode } = TYSdk.device;
  const { power, homeTab, devInfo } = useSelector(state => {
    if (isGroup) {
      return {
        power: state.groupDPs['20'],
        homeTab: state.panelState.homeTab,
        devInfo: state.devInfo,
      };
    } else {
      return {
        power: state.dpState[dpCodes.switch],
        homeTab: state.panelState.homeTab,
        devInfo: state.devInfo,
      };
    }
  });
  const { devId } = TYSdk.devInfo;
  const [page, setPage] = useState(0);
  const dispatch = useDispatch();
  let tabBar = [
    {
      key: HomeTab.sceneHome.key,
      name: Strings.getLang(HomeTab.sceneHome.name),
      icon: tabarIcon.scene_n,
      icon_s: tabarIcon.scene_s,
      hidden: !SupportUtils.isSupportDp(dpCodes.sceneSelectCode),
      work_mode: 'scene',
    },
    {
      key: HomeTab.music.key,
      name: Strings.getLang(HomeTab.music.name),
      icon: tabarIcon.music_n,
      icon_s: tabarIcon.music_s,

      hidden:
        !SupportUtils.isSupportDp(dpCodes.micMusicCode) &&
        !SupportUtils.isSupportDp(dpCodes.musicCode),
      work_mode: 'music',
    },
    {
      key: HomeTab.dimmer.key,
      name: Strings.getLang(HomeTab.dimmer.name),
      icon: tabarIcon.color_n,
      icon_s: tabarIcon.color_s,

      hidden: false,
      work_mode: 'colour',
    },
    {
      key: HomeTab.other.key,
      name: Strings.getLang(HomeTab.other.name),
      icon: tabarIcon.setting_n,
      icon_s: tabarIcon.setting_s,
    },
  ];

  tabBar = tabBar.filter(i => {
    return !i.hidden;
  });

  useEffect(() => {
    handlDeviceInfoHexData(deviceInfoModel);
  }, [deviceInfoModel]);

  //处理设备信息的二进制数据，转成Type - DeviceInfoModel
  const handlDeviceInfoHexData = hexStr => {
    if (hexStr == undefined || hexStr.length < 54 || hexStr.substr(2, 2) != '00') {
      return;
    }
    let bytes: number[] = [];
    for (let i = 0; i < hexStr.length; i++) {
      if (i % 2 == 0) {
        const byte = hexStringToNumber(hexStr.substr(i, 2))[0];
        bytes.push(byte);
      }
    }
    console.log('bytes = ', bytes);
    let deviceInfoModel: DeviceInfoModel = {};
    if (bytes.length > 27) {
      deviceInfoModel.diyType = bytes[29];
      deviceInfoModel.lightAmount = bytes[23] * 256 + bytes[24];
      deviceInfoModel.singleNum = bytes[27];
      deviceInfoModel.columnNum = deviceInfoModel.lightAmount / deviceInfoModel.singleNum;

      let subOrderAmount = bytes[30]; //子命令的个数
      let nextSubOrderIndex = 31; //子命令的开始下标

      for (let i = 0; i < subOrderAmount; i++) {
        // 子命令
        let subOrderCode = bytes[nextSubOrderIndex];

        switch (subOrderCode) {
          case 1: //子命令型号
            nextSubOrderIndex += 2;
            break;
          case 2: //是否支持循环
            nextSubOrderIndex += 1;
            break;
          case 3: //收藏里边的场景数量
            deviceInfoModel.sceneAmount = bytes[nextSubOrderIndex + 1];
            nextSubOrderIndex += 2;
            break;
          case 4: //开发者协议 最大区域总数 和 预设场景数量
            nextSubOrderIndex += 3;
            break;
          case 5: //预设场景的方向类型
            nextSubOrderIndex += 2;
            break;
          case 6: //功能标识
            nextSubOrderIndex += 5;
            break;
          case 7: //RGBDIY支持拍照功能 只有单图 保存在APP,和收藏循环功能
            nextSubOrderIndex += 1;
            break;
          case 8: //音乐来源
            nextSubOrderIndex += 2;
            break;
          default:
            break;
        }
      }
    }
    //存到redux里
    dispatch(commonActions.updateDevOrderInfo(deviceInfoModel));

    //把设备命令信息hex更新到设备的属性里
    saveDevProperty({
      devId: TYSdk.devInfo.devId,
      bizType: 0,
      propertyList: JSON.stringify([{ code: 'devOrderInfo', value: hexStr }]),
    });
  };

  const handleChangeTabBarClick = tabBarItem => {
    dispatch(
      commonActions.updatePanel({
        homeTab: tabBarItem.key,
      })
    );
    if (tabBarItem.work_mode !== undefined) {
      if (isGroup) {
        publishGroupDps({
          groupId: devInfo.groupId,
          dps: { [getDpIdByCode(dpCodes.workMode)]: tabBarItem.work_mode },
        });
      } else {
        dpUtils.putDpData({
          [dpCodes.workMode]: tabBarItem.work_mode,
        });
      }
    }
  };

  useEffect(() => {
    setPage(tabBar?.findIndex(i => i.key === homeTab));
  }, [homeTab]);

  useEffect(() => {
    dispatch(
      commonActions.updatePanel({
        homeTab: workMode,
      })
    );
  }, [workMode]);

  useEffect(() => {
    if (isGroup) {
      //群组，页面挂载的时候默认开机
      publishGroupDps({
        groupId: devInfo.groupId,
        dps: { [getDpIdByCode(dpCodes.powerCode)]: power },
        complete() {},
        success(params) {
          // setGroupPower(groupPower);
        },
        fail(params) {},
      });
    } else {
      //检测固件升级
      checkOTAUpgradeStatus({
        deviceId: TYSdk.devInfo.devId,
        complete() {
          console.log('OTA升级状态请求完成');
        },
        success(params) {
          console.log('OTA升级状态请求成功', params);
          if (params.status == 1) {
            ty.showModal({
              title: Strings.getLang('tips_title_OTA_1'),
              content: Strings.getLang('tips_content_OTA_1'),
              showCancel: true,
              cancelText: Strings.getLang('cancel'),
              confirmText: Strings.getLang('gotoOTA'),
              success(params) {
                if (params.confirm) {
                  openOTAUpgrade({ deviceId: TYSdk.devInfo.devId });
                }
              },
            });
          } else if (params.status == 2) {
            ty.showModal({
              title: Strings.getLang('tips_title_OTA_2'),
              content: Strings.getLang('tips_content_OTA_2'),
              showCancel: false,
              confirmText: Strings.getLang('lookOTA'),
              success(params) {
                if (params.confirm) {
                  openOTAUpgrade({ deviceId: TYSdk.devInfo.devId });
                }
              },
            });
          }
        },
        fail(params) {
          console.log('OTA升级状态请求失败');
        },
      });

      //先从设备获取设备命令信息
      getDevProperty({
        devId: TYSdk.devInfo.devId,
        bizType: 0,
        code: 'devOrderInfo',
      })
        .then(response => {
          console.log('response', response);
          if (response.length != 0) {
            let responseArray = (parseJSON(response) as unknown) as Array<object>;
            let devOrderInfoHex = responseArray[0]['value'];
            handlDeviceInfoHexData(devOrderInfoHex);
          }
          // 命令0x00请求设备信息
          // 挂载的时候请求设备信息
          dpUtils.putDpData({
            [dpCodes.DIY]: 'aa0000bb',
          });
        })
        .catch(error => {});
    }
  }, []);

  const handlePowerClick = () => {
    if (isGroup) {
      publishGroupDps({
        groupId: devInfo.groupId,
        dps: { '20': !power },
        complete() {},
        success(params) {
          // setGroupPower(!groupPower);
        },
        fail(params) {},
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.switch]: !power,
      });
    }
  };

  //渲染蒙层
  const renderMaskView = () => {
    if (!power) {
      return <View className="maskView"></View>;
    } else {
      return null;
    }
  };
  // homeTab = HomeTab.dimmer.key;
  return (
    <View className="c-width-full home-wrapper">
      {/* {homeTab === HomeTab.scene.key ? <SceneView /> : null} */}
      {homeTab === HomeTab.sceneHome.key ? <SceneHomeView /> : null}
      {homeTab === HomeTab.dimmer.key ? <DimmerView /> : null}
      {homeTab === HomeTab.music.key ? <MusicView /> : null}
      {homeTab === HomeTab.other.key ? <SettingView /> : null}
      <ControllerBar
        data={tabBar}
        power={power}
        active={page}
        onPress={handleChangeTabBarClick}
        handlePower={handlePowerClick}
      />
      {renderMaskView()}
    </View>
  );
};

export default Home;
