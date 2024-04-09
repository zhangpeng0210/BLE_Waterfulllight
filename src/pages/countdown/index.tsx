/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { View, Text, Switch, PickerView } from '@ray-js/components';
import TyTimePicker from '@ray-js/components-ty-time-picker';
import Strings from '@/i18n';
import dpCodes from '@/config/dpCodes';
import { dpUtils, actions } from '@/redux/index';
import { store } from '@/redux';
import { setNavigationBarTitle } from '@ray-js/api';
import { TYSdk } from '@ray-js/ray-panel-core';
import { publishGroupDps } from '@ray-js/ray';

import './countdown.module.less';

const CountDownView = () => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);

  setNavigationBarTitle({
    title: Strings.getLang('countDown_title'),
  });
  const { dpState, groupDPs } = store.getState();

  let currentSecond = isGroup ? groupDPs['26'] : dpState['countdown'];
  const [time, setTime] = React.useState({
    hour: Math.floor(currentSecond / 3600),
    minute: Math.floor((currentSecond % 3600) / 60),
  });
  //是否开启倒计时
  const [isOpen, setIsOpen] = React.useState(currentSecond > 0);

  React.useEffect(() => {
    currentSecond = time.hour * 3600 + time.minute * 60;
    updateCountDownDP();
  }, [time, isOpen]);

  //保存群组倒计时的开始时间戳
  const saveGroupCountdownTimestamp = () => {
    const timeStamp = Date.parse(Date()) / 1000;
    ty.setStorage({
      key: 'GroupCountdownTimestamp',
      data: JSON.stringify(timeStamp),
      success(params) {},
    });
  };

  //更新倒计时
  const updateCountDownDP = () => {
    let scends = 0;
    if (isOpen) {
      scends = time.hour * 3600 + time.minute * 60;
    }
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { '26': scends },
        success(params) {
          store.dispatch(actions.common.updateGroupDPs({ '26': scends }));
          //记录群组的倒计时时间戳 秒级
          saveGroupCountdownTimestamp();
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.countdownCode]: scends,
      });
    }
  };
  const handleTimeChange = (value: { hour: number; minute: number }) => {
    setTime(value);
  };

  const range = ['巴西', '中国', '日本', '美国'];
  return (
    <View className="countdown-view-wrapper">
      <View className="item-wrapper">
        <Text>
          {Strings.getLang('countDown_title')}:{time.hour}
          {Strings.getLang('countDown_hour')}
          {time.minute}
          {Strings.getLang('countDown_minute')}
        </Text>
      </View>
      <View className="item-wrapper">
        <Text>{Strings.getLang('countDown_switch')} </Text>
        <Switch
          checked={isOpen}
          onChange={e => {
            setIsOpen(e.value);
          }}
        ></Switch>
      </View>
      <View className="picker-wrp">
        <View className="hour-num">{Strings.getLang('countDown_hour')}</View>
        <View className="min-num">{Strings.getLang('countDown_minute')}</View>
        <TyTimePicker
          style={{ width: '100%' }}
          indicatorStyle={{
            borderTop: '1px solid #ffffff60',
            borderBottom: '1px solid #ffffff60',
          }}
          is24Hour
          value={time}
          onChange={handleTimeChange}
          overlayStyle={{
            background:
              'linear-gradient(rgba(31,31,31,0.95),rgba(31,31,31,0.65)),linear-gradient(0deg,rgba(31,31,31,0.95),rgba(31,31,31,0.65));',
            backgroundSize: '100% 68px',
            backgroundPosition: 'top, bottom',
            backgroundRepeat: 'no-repeat',
          }}
          fontColor={'#fff'}
        />
      </View>
    </View>
  );
};

export default CountDownView;
