import { getDevProperty, saveDevProperty } from '@ray-js/ray';
import { TYSdk } from '@ray-js/ray-panel-core';
import { TimerData } from '../../types/index';
import { utils } from '@ray-js/panel-sdk';
import { getSystemInfoSync } from '@ray-js/api';
import Strings from '../../i18n';
import dayjs from 'dayjs';

const { toFixed, hexStringToNumber, parseJSON, hexStringToBinString } = utils;

const weekList = [
  Strings.getLang('mon'),
  Strings.getLang('tue'),
  Strings.getLang('wed'),
  Strings.getLang('thu'),
  Strings.getLang('fri'),
  Strings.getLang('sat'),
  Strings.getLang('sun'),
];

//将16进制的定时数据转换成具体的定时数据
const timerHexTransformToDetailData = item => {
  const { is24Hour } = getSystemInfoSync();

  const byte1: string = item.substr(0, 2);
  const byte2: string = item.substr(2, 2);
  const byte3: string = item.substr(4, 2);
  const byte4: string = item.substr(6, 2);

  const onceDate: string = item.length > 8 ? item.substr(8, 12) : '';

  let detailData: TimerData = {
    byte1: parseInt(byte1, 16),
    byte2: parseInt(byte2, 16),
    byte3: parseInt(byte3, 16),
    byte4: parseInt(byte4, 16),
  };

  const byte1Array = toFixed(hexStringToBinString(byte1), 8).split('');
  detailData.weekStr = '';
  detailData.weekArray = [];

  if (byte1Array[7] == '1') {
    //是重复任务
    //为了显示好看，detailData.weekStr按周一 -周日显示，所以bitIndex从倒数第二位开始
    for (let bitIndex = 6; bitIndex >= 0; bitIndex--) {
      const weekIndex = 6 - bitIndex;
      if (byte1Array[bitIndex] == '1') {
        detailData.weekStr += weekList[weekIndex] + ' ';
        detailData.weekArray.push(weekList[weekIndex]);
      }
    }
  } else {
    detailData.weekStr = Strings.getLang('once');
  }
  const hour: number = parseInt(byte2, 16);
  detailData.hour = hour;
  const minute: number = parseInt(byte3, 16);
  detailData.minute = minute;

  let hourStr = '';
  const minuteStr = toFixed(minute, 2);
  let AMOrPM = '';

  if (is24Hour) {
    hourStr = toFixed(hour, 2);
  } else {
    AMOrPM = hour >= 12 ? 'PM' : 'AM';
    if (hour <= 12) {
      hourStr = toFixed(hour, 2);
    } else {
      hourStr = toFixed(hour - 12, 2);
    }
  }
  detailData.timeStr = hourStr + ':' + minuteStr;
  detailData.AMOrPMStr = AMOrPM;
  //开灯还是灭灯
  detailData.action = parseInt(byte4, 16) & 0x01;
  detailData.actionStr = detailData.action == 1 ? 'on' : 'off';
  //定时任务的序号
  detailData.orderNumber = (parseInt(byte4, 16) & 112) >> 4; //112的2进制为0111 0000

  //该定时任务是否开启
  const isEnabled = (parseInt(byte4, 16) & 0x02) == 2;
  if (isEnabled && detailData.weekArray.length == 0) {
    const nowDate = parseInt(dayjs().format('YYYYMMDDHHmm'), 10);
    //判断当前时间与单次不循环任务的创建时间
    const detailTime = parseInt(onceDate, 10);
    if (detailTime > nowDate) {
      detailData.isEnabled = true;
    } else {
      detailData.isEnabled = false;
    }
  } else {
    detailData.isEnabled = isEnabled;
  }
  return detailData;
};

//没有定时数据时，设置几个默认的定时时间，但是定时都是关闭状态
const setupDefaultTimer = () => {
  let defaultTimerList = [];
  const getByte4 = number => {
    let byte4 = 0;
    byte4 = byte4 | (number == 0 || number == 2 ? 1 : 0); //bit1 1 开灯 0 关灯
    byte4 = byte4 & 253; //bit2 1 任务开启 0 任务关闭
    byte4 = byte4 & 251; //bit3 预留
    byte4 = byte4 | (1 << 3); //bit4 1 有定时任务 0 没有定时任务
    byte4 = byte4 | (number << 4); //bit5 - bit7

    return byte4;
  };

  //根据序号添加8个默认的定时任务
  for (let number = 0; number < 8; number++) {
    const byte4 = toFixed(getByte4(number).toString(16), 2);
    switch (number) {
      case 0: //18:00
        defaultTimerList.push('ff1200' + byte4);
        break;
      case 1: //00:00
        defaultTimerList.push('ff0000' + byte4);
        break;
      case 2: //19:00
        defaultTimerList.push('ff1300' + byte4);
        break;
      case 3: //23:00
        defaultTimerList.push('ff1700' + byte4);
        break;
      default:
        defaultTimerList.push('000000' + byte4);
        break;
    }
  }
  return defaultTimerList;
};

export default {
  //获取本地列表
  async getLocationTimerList() {
    return new Promise((resolve, reject) => {
      getDevProperty({
        devId: TYSdk.devInfo.devId,
        bizType: 0,
        code: 'scheduleList',
      })
        .then(response => {
          if (response.length == 0) {
            const defaultTimerHexList = setupDefaultTimer();
            saveDevProperty({
              devId: TYSdk.devInfo.devId,
              bizType: 0,
              propertyList: JSON.stringify([
                { code: 'scheduleList', value: defaultTimerHexList.join(',') },
              ]),
            })
              .then(() => {
                resolve(
                  defaultTimerHexList.map(item => {
                    return timerHexTransformToDetailData(item);
                  })
                );
              })
              .catch(error => {
                reject(error);
              });
          } else {
            let responseArray = (parseJSON(response) as unknown) as Array<object>;
            let tempDataList = responseArray[0]['value'].split(',');
            resolve(
              tempDataList.map((item, index) => {
                const timerData: TimerData = timerHexTransformToDetailData(item);
                return timerData;
              })
            );
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  },

  //保存本地定时到设备属性
  async saveLocationTimerToDevice(timerDataList: Array<TimerData>) {
    return new Promise((resolve, reject) => {
      const timerHexList = timerDataList.map(timerData => {
        let detailTimeStr = ''; //单次定时时候的具体时间YYYYMMDDHHmm
        if ((timerData.byte1 & 1) == 0) {
          //单次
          let currentDate = dayjs();
          const currentHour = currentDate.hour();
          const currentMinute = currentDate.minute();
          //
          if (
            timerData.byte2 > currentHour ||
            (timerData.byte2 == currentHour && timerData.byte3 > currentMinute)
          ) {
            //选中的时间大于现在的时间，设置定时的具体时间为今天
            const newDate = currentDate.set('hour', timerData.byte2).set('minute', timerData.byte3);
            detailTimeStr = newDate.format('YYYYMMDDHHmm');
          } else {
            //设置定时的具体时间为明天这个时刻
            const newDate = currentDate
              .set('hour', timerData.byte2)
              .set('minute', timerData.byte3)
              .add(1, 'day');
            detailTimeStr = newDate.format('YYYYMMDDHHmm');
          }
        }
        return (
          toFixed(timerData.byte1.toString(16), 2) +
          toFixed(timerData.byte2.toString(16), 2) +
          toFixed(timerData.byte3.toString(16), 2) +
          toFixed(timerData.byte4.toString(16), 2) +
          detailTimeStr
        );
      });
      saveDevProperty({
        devId: TYSdk.devInfo.devId,
        bizType: 0,
        propertyList: JSON.stringify([{ code: 'scheduleList', value: timerHexList.join(',') }]),
      })
        .then(() => {
          resolve(true);
        })
        .catch(error => {
          reject(error);
        });
    });
  },
};
