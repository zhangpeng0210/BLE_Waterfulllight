import React from 'react';
import { Switch, View, Text } from '@ray-js/components';
import { navigateTo } from '@ray-js/api';
import { dpUtils } from '@/redux/index';
import dpCodes from '@/config/dpCodes';
import './index.module.less';
import { TimerData } from '@/types';
import locationTimerAPI from '../locationTimerAPI';
import { toFixed } from '@ray-js/panel-sdk/lib/utils';
import Strings from '@/i18n';

const LocationTimerView = prop => {
  //每项定时点击事件
  const handleScheduleItemCliked = (e, item) => {
    const { target } = e.origin;
    if (target.id === 'Switch') {
      // 阻止switch触发的事件
      return;
    }
    const url = `/pages/schedule/addTimer/index?selectedNumber=${item.orderNumber}`;
    navigateTo({
      url: url,
    });
  };

  //定时开启关闭事件
  const handleSwitchChangeEvent = (e, index) => {
    const isEnabled = e.value;
    let tempDataList = [...prop.dataList];
    let currentTimerData: TimerData = tempDataList[index];
    currentTimerData.isEnabled = isEnabled;
    if (isEnabled) {
      currentTimerData.byte4 = currentTimerData.byte4 | (1 << 1);
    } else {
      currentTimerData.byte4 = currentTimerData.byte4 & 253;
    }
    const timerDPStr =
      'aa0604' +
      toFixed(currentTimerData.byte1.toString(16), 2) +
      toFixed(currentTimerData.byte2.toString(16), 2) +
      toFixed(currentTimerData.byte3.toString(16), 2) +
      toFixed(currentTimerData.byte4.toString(16), 2) +
      'bb';
    dpUtils.putDpData({ [dpCodes.DIY]: timerDPStr });
    //设备属性也要同时修改
    locationTimerAPI.saveLocationTimerToDevice(tempDataList);
  };

  //渲染每个定时
  const renderItem = (timerData, index) => {
    if (!timerData) {
      return null;
    } else {
      return (
        <View
          className="timer-item-wrapper"
          onClick={e => {
            handleScheduleItemCliked(e, timerData);
          }}
          key={index}
        >
          <View className="item-left-wrapper">
            <View className="item-left-top-wrapper">
              <Text className="time-text">{timerData.timeStr}</Text>
              <View className="item-left-top-right-wrapper">
                <View className="AMOrPM-wrapper">{timerData.AMOrPMStr}</View>
                <View
                  className={
                    timerData.action == 1
                      ? 'action-wrapper  open-text'
                      : 'action-wrapper  close-text'
                  }
                >
                  {timerData.actionStr}
                </View>
              </View>
            </View>
            <Text className="week-text">{timerData.weekStr} </Text>
          </View>
          <Switch
            color="#3793ff"
            id="Switch"
            checked={timerData.isEnabled}
            onChange={e => {
              handleSwitchChangeEvent(e, index);
            }}
          />
          {/* {`${item}`} */}
          <View className="item-line-wrap"></View>
        </View>
      );
    }
  };

  return (
    <View className="locationTimer-view-wrapper">
      <View className="top-Tips-wrapper">{Strings.getLang('locationTimer_top_tips')}</View>
      {prop.dataList.map(renderItem)}
    </View>
  );
};

export default LocationTimerView;
