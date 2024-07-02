import React from 'react';
import { View, Text, Icon, Switch } from '@ray-js/components';
import dpCodes from '@/config/dpCodes';
import { dpUtils, actions } from '@/redux/index';
import { utils } from '@ray-js/panel-sdk';
import Strings from '@/i18n';
import { store } from '@/redux';
import './setting.module.less';
import { hooks } from '@ray-js/panel-sdk';
import { TYSdk } from '@ray-js/ray-panel-core';
import { publishGroupDps, usePageEvent } from '@ray-js/ray';

const { toFixed } = utils;
const { useDpState } = hooks;

const SettingView = () => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const [dpState] = useDpState();
  const [groupCountdown, setGroupCountdown] = React.useState(store.getState().groupDPs['26']);

  usePageEvent('onShow', () => {
    handleGroupCountdownShow();
  });

  React.useEffect(() => {
    handleGroupCountdownShow();
  }, []);
  //处理群组的倒计时显示
  const handleGroupCountdownShow = () => {
    if (isGroup) {
      const residueCountdown = store.getState().groupDPs['26']; //剩余倒计时的时长(秒)
      if (residueCountdown == 0) {
        setGroupCountdown(residueCountdown);
      } else {
        ty.getStorage({
          key: 'GroupCountdownTimestamp',
          success(params) {
            const startTimestamp = Number(params.data); //开始倒计时的时间戳
            const nowTimstamp = Date.parse(Date()) / 1000; //现在的时间戳
            const difference = nowTimstamp - startTimestamp;
            if (difference >= residueCountdown) {
              setGroupCountdown(0);

              //关掉倒计时
              publishGroupDps({
                groupId: TYSdk.devInfo.groupId,
                dps: { '26': 0 },
                success(params) {
                  store.dispatch(actions.common.updateGroupDPs({ '26': 0 }));
                  //移除存储的倒计时开始时间戳
                  ty.removeStorage({ key: 'GroupCountdownTimestamp' });
                },
              });
            } else {
              //更新设备的倒计时
              publishGroupDps({
                groupId: TYSdk.devInfo.groupId,
                dps: { '26': residueCountdown - difference },
                success(params) {
                  //更新redux剩余倒计时时长
                  store.dispatch(
                    actions.common.updateGroupDPs({ '26': residueCountdown - difference })
                  );
                  //更新缓存的倒计时开始的时间戳
                  ty.setStorage({
                    key: 'GroupCountdownTimestamp',
                    data: JSON.stringify(nowTimstamp),
                  });
                },
              });

              setGroupCountdown(residueCountdown - difference);
            }
          },
        });
      }
    }
  };

  const jumpToSchedule = () => {
    ty.navigateTo({
      url: `/pages/schedule/index`,
    });
  };
  const jumpToCountdown = () => {
    ty.navigateTo({
      url: `/pages/countdown/index`,
    });
  };

  //发布红外开关功能点
  const publishInfraredDPsData = value => {
    dpUtils.putDpData({
      [dpCodes.infraredSwitch]: value,
    });
  };

  //渲染倒计时具体时间
  const renderCountDown = () => {
    return (
      <View className="item-wrapper" onClick={jumpToCountdown}>
        <Text>{Strings.getLang('setting_table_countDown')}</Text>
        <View className="item-wrapper countdown-wrapper">
          <Text>
            {isGroup
              ? `${toFixed(Math.floor(groupCountdown / 3600), 2)}:${toFixed(
                  Math.floor((groupCountdown % 3600) / 60),
                  2
                )}:${toFixed(Math.floor(groupCountdown % 60), 2)}`
              : `${toFixed(Math.floor(dpState['countdown'] / 3600), 2)}:${toFixed(
                  Math.floor((dpState['countdown'] % 3600) / 60),
                  2
                )}:00`}
          </Text>
          <Icon type="icon-right-copy" className="icon" color="#ffffff80" size={20}></Icon>
        </View>
      </View>
    );
  };

  //渲染红外开关
  const renderInfraredSwitch = () => {
    if (!isGroup) {
      return (
        <View className="item-wrapper">
          <Text>{Strings.getLang('setting_table_InfraredSwitch')}</Text>
          <Switch
            checked={dpState['ir_enable']}
            onChange={e => {
              //修改红外开关状态
              publishInfraredDPsData(e.value);
            }}
          ></Switch>
        </View>
      );
    }
  };

  //渲染清理缓存
  const renderClearStorage = () => {
    if (!isGroup) {
      return (
        <View
          className="item-wrapper"
          onClick={() => {
            ty.showModal({
              title: Strings.getLang('清理缓存'),
              content: Strings.getLang('确认删除所有的缓存吗'),
              cancelText: Strings.getLang('cancel'),
              confirmText: Strings.getLang('confirm'),

              success(params) {
                if (params.confirm) {
                  ty.clearStorage();
                  ty.showToast({ title: Strings.getLang('scene_delete_success') });
                }
              },
            });
          }}
        >
          <Text>{Strings.getLang('清理缓存')}</Text>
        </View>
      );
    }
  };

  return (
    <View className="setting-view-wrapper">
      <View className="item-wrapper" onClick={jumpToSchedule}>
        <Text>{Strings.getLang('setting_table_schedule')}</Text>
        <Icon type="icon-right-copy" className="icon" color="#ffffff80" size={20}></Icon>
      </View>
      {renderCountDown()}
      {renderInfraredSwitch()}
      {renderClearStorage()}
    </View>
  );
};

export default SettingView;
