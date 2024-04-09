/* eslint-disable no-shadow */
import React, { useState, useEffect } from 'react';
import { View } from '@ray-js/components';
import { useDispatch } from 'react-redux';
import { useSelector, actions, dpUtils } from '@/redux/index';
import { HomeTab } from '@/types';
import dpCodes from '@/config/dpCodes';
import { useTopBarTheme, useSetTopBarTitle } from '@/hooks';
import SupportUtils from '@/utils/supportUtils';
import Strings from '../i18n';
import { hooks } from '@ray-js/panel-sdk';

import ControllerBar from './ControllerBar';
import DimmerView from './dimmer/index';
import SceneHomeView from './sceneHome/index';
import MusicView from './music/index';
import SettingView from './setting/index';
const { useDpState } = hooks;

import * as tabarIcon from './module';

import './index.module.less';
import { TYSdk } from '@ray-js/ray-panel-core';
import { publishGroupDps, usePageEvent, openOTAUpgrade, checkOTAUpgradeStatus } from '@ray-js/ray';

const { common: commonActions } = actions;

const Home = () => {
  usePageEvent('onShow', () => {
    ty.showMenuButton();
  });

  useTopBarTheme();
  useSetTopBarTitle();
  const [workMode] = useDpState(dpCodes.workMode);
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
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
  const [page, setPage] = useState(0);
  const dispatch = useDispatch();
  let tabBar = [
    {
      key: HomeTab.sceneHome.key,
      name: Strings.getLang(HomeTab.sceneHome.name),
      // top: 2,
      // icon: "icon-a-paintbrushpointedfill",
      icon: tabarIcon.scene_n,
      icon_s: tabarIcon.scene_s,
      hidden: !SupportUtils.isSupportDp(dpCodes.sceneSelectCode),
      work_mode: 'scene',
    },
    {
      key: HomeTab.music.key,
      name: Strings.getLang(HomeTab.music.name),
      // icon: "icon-music",
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
      // top: 2,
      // icon: "icon-a-paintbrushpointedfill",
      icon: tabarIcon.color_n,
      icon_s: tabarIcon.color_s,

      hidden: false,
      work_mode: 'colour',
    },
    {
      key: HomeTab.other.key,
      name: Strings.getLang(HomeTab.other.name),
      // icon: "icon-a-clockfill",
      icon: tabarIcon.setting_n,
      icon_s: tabarIcon.setting_s,
    },
  ];

  tabBar = tabBar.filter(i => {
    return !i.hidden;
  });

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
          dps: { '21': tabBarItem.work_mode },
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
    if (isGroup) return;
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
  }, []);

  useEffect(() => {
    if (isGroup) {
      publishGroupDps({
        groupId: devInfo.groupId,
        dps: { '20': power },
        complete() {},
        success(params) {
          // setGroupPower(groupPower);
        },
        fail(params) {},
      });
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
