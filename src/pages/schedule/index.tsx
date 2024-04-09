import React, { useState } from 'react';
import { View } from '@ray-js/components';
import { setNavigationBarTitle } from '@ray-js/api';
import Strings from '@/i18n';
import { usePageEvent, bluetoothCapabilityIsSupport } from '@ray-js/ray';
import { TYSdk } from '@ray-js/ray-panel-core';

import Timing from './timing';
import LocationTimerView from './locationTimer';
import locationTimerAPI from './locationTimerAPI';

import './schedule.module.less';
import { TimerData } from '@/types';

const ScheduleView = () => {
  //蓝牙设备是否支持云端定时
  const [isSupportSchedule, setIsSupportSchedule] = useState(undefined);
  const [dataList, setDataList] = useState([]);

  usePageEvent('onShow', () => {
    if (isSupportSchedule != undefined && !isSupportSchedule) {
      locationTimerAPI.getLocationTimerList().then(listArray => {
        const array = listArray as Array<TimerData>;
        setDataList(array);
      });
    }
  });

  usePageEvent('onLoad', () => {
    ty.hideMenuButton();

    setNavigationBarTitle({
      title: Strings.getLang('setting_table_schedule'),
    });

    //查询蓝牙设备是否支持某个能力  capability 5定时 6、BT
    bluetoothCapabilityIsSupport({
      deviceId: TYSdk.devInfo.devId,
      capability: 5,
      success(params) {
        setIsSupportSchedule(params.isSupport);
        if (!params.isSupport) {
          locationTimerAPI.getLocationTimerList().then(listArray => {
            const array = listArray as Array<TimerData>;
            setDataList(array);
          });
        }
      },
      fail(params) {
        setIsSupportSchedule(false);
        locationTimerAPI.getLocationTimerList().then(listArray => {
          const array = listArray as Array<TimerData>;
          setDataList(array);
        });
      },
    });
  });

  const renderTiming = () => {
    if (isSupportSchedule == undefined) {
      return <LocationTimerView dataList={dataList}></LocationTimerView>;
      // return null;
    } else if (isSupportSchedule) {
      return <Timing></Timing>;
    } else {
      return <LocationTimerView dataList={dataList}></LocationTimerView>;
    }
  };
  return <View className="schedule-view-wrapper">{renderTiming()}</View>;
};

export default ScheduleView;
