import React, { useState, useMemo, useRef } from 'react';
import { View, Image, Text } from '@ray-js/components';
import TyTimePicker from '@ray-js/components-ty-time-picker';
import Strings from '@/i18n';
import { getSystemInfoSync, setNavigationBarTitle, navigateBack } from '@ray-js/api';
import { usePageEvent } from '@ray-js/ray';
import dayjs from 'dayjs';
import { dpUtils } from '@/redux/index';
import dpCodes from '@/config/dpCodes';

import Res from '../res';
import './addTimer.module.less';
import { TimerData } from '@/types';
import locationTimerAPI from '../locationTimerAPI';
import { toFixed } from '@ray-js/panel-sdk/lib/utils';

const AddTimerView = () => {
  const [dataList, setDataList] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(0);
  const systemInfoRef = useRef(getSystemInfoSync());
  const { is24Hour } = systemInfoRef.current;
  // 选中的日期picker数据
  const now = dayjs();
  const [currentTimePicker, setCurrentTimerPicker] = useState({
    hour: now.hour(),
    minute: now.minute(),
  });
  const weekList = useMemo(() => {
    return [
      Strings.getLang('mon'),
      Strings.getLang('tue'),
      Strings.getLang('wed'),
      Strings.getLang('thu'),
      Strings.getLang('fri'),
      Strings.getLang('sat'),
      Strings.getLang('sun'),
    ];
  }, []);
  // 选择的星期
  const [checkedWeeks, setCheckedWeek] = useState([]);
  // 是否开关灯
  const [currentType, setTypeCurrent] = useState(0);
  const isOff = currentType === 0; // 0=>关闭, 1=>开启

  usePageEvent('onLoad', prop => {
    ty.hideMenuButton();
    setCurrentNumber(prop.selectedNumber);

    getCurrentTimerData(prop.selectedNumber);

    setNavigationBarTitle({ title: Strings.getLang('editTiming') });
  });

  const getCurrentTimerData = number => {
    locationTimerAPI.getLocationTimerList().then(array => {
      const listArray = array as Array<TimerData>;
      setDataList(listArray);

      const currentTimerData = listArray[number];

      console.log('currentTimerData', currentTimerData);

      setCurrentTimerPicker({ hour: currentTimerData.hour, minute: currentTimerData.minute });
      setTypeCurrent(currentTimerData.action);

      setCheckedWeek(currentTimerData.weekArray);
    });
  };

  //保存按钮点击事件
  const saveButtonClicked = () => {
    let byte1 = 0;
    if (checkedWeeks.length == 0) {
      byte1 = 0;
    } else {
      byte1 = byte1 | 1;
      for (let week = 1; week < 8; week++) {
        if (checkedWeeks.includes(weekList[week - 1])) {
          byte1 = byte1 | (1 << week); //1是bit的是否重复位, 周几就是1左移几位
        }
      }
    }
    const byte2 = currentTimePicker.hour;
    const byte3 = currentTimePicker.minute;

    let byte4 = 0;
    byte4 = byte4 | currentType; //bit1 开1、关0灯
    byte4 = byte4 | (1 << 1); //bit2定时任务开启
    byte4 = byte4 | (0 << 2); //bit3预留位
    byte4 = byte4 | (1 << 3); //bit4 1 有定时任务 0 没有定时任务
    byte4 = byte4 | (currentNumber << 4); //bit5 - bit7

    let tempDataList = [...dataList];
    const timerDPStr =
      'aa0604' +
      toFixed(byte1.toString(16), 2) +
      toFixed(byte2.toString(16), 2) +
      toFixed(byte3.toString(16), 2) +
      toFixed(byte4.toString(16), 2) +
      'bb';
    dpUtils.putDpData({ [dpCodes.DIY]: timerDPStr });
    tempDataList[currentNumber].byte1 = byte1;
    tempDataList[currentNumber].byte2 = byte2;
    tempDataList[currentNumber].byte3 = byte3;
    tempDataList[currentNumber].byte4 = byte4;

    //设备属性也要同时修改
    locationTimerAPI.saveLocationTimerToDevice(tempDataList).then(() => {
      navigateBack();
    });
  };
  //时间选择器滚动事件
  const handlePickerChange = (value: { hour: number; minute: number }) => {
    setCurrentTimerPicker(value);
  };
  //选中周几事件
  const handleCheckWeekEvent = week => {
    const checkedWeeksRes = checkedWeeks;
    checkedWeeksRes.includes(week)
      ? checkedWeeksRes.splice(checkedWeeksRes.indexOf(week), 1)
      : checkedWeeksRes.push(week);
    setCheckedWeek([...checkedWeeksRes]);
  };

  return (
    <View className="addTimer-wrapper">
      <View className="pickerView-wrapper">
        <TyTimePicker
          bgColor="#3b3b3c"
          fontColor="#fff"
          is24Hour={!!is24Hour}
          value={currentTimePicker}
          onChange={handlePickerChange}
          amText={Strings.getLang('AM')}
          pmText={Strings.getLang('PM')}
        />
      </View>

      <View className="weeks-view-wrapper">
        {weekList.map(week => {
          const activeClass = (checkedWeeks || []).includes(week) ? 'active' : '';
          return (
            <View
              onClick={() => {
                handleCheckWeekEvent(week);
              }}
              key={week}
              className={`week-item ${activeClass}`}
            >
              {week}
            </View>
          );
        })}
      </View>
      <View
        className="action-view"
        onClick={() => {
          ty.showActionSheet({
            itemList: [Strings.getLang('turnOff'), Strings.getLang('turnOn')],
            alertText: Strings.getLang('schedule_actionsheet_title'),
            success(result) {
              console.log('选中的下标为', result.tapIndex);
              setTypeCurrent(result.tapIndex);
            },
          });
        }}
      >
        <Text className="action-view-text">{Strings.getLang('action')}</Text>
        <View className="action-handle">
          <Text>{isOff ? Strings.getLang('turnOff') : Strings.getLang('turnOn')}</Text>
          <Image className="action-handle-text" src={Res.arrow} />
        </View>
      </View>
      <View
        className="bottom-saveButton-wrapper"
        onClick={() => {
          saveButtonClicked();
        }}
      >
        <Text>{Strings.getLang('save')}</Text>
      </View>
    </View>
  );
};

export default AddTimerView;
