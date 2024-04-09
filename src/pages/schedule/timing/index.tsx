/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, Image, Text, Modal, Switch } from '@ray-js/components';
import TyTimePicker from '@ray-js/components-ty-time-picker';
import Strings from '@/i18n';
import { getSystemInfoSync } from '@ray-js/api';
import dayjs from 'dayjs';
import { dpUtils, useSelector } from '@/redux';
import { TYSdk } from '@ray-js/ray-panel-core';
import {
  showLoading,
  hideLoading,
  showToast,
  showModal as showModalApi,
  addGroupTimer,
  addSingleTimer,
} from '@ray-js/api';

import { TimerApi } from './api_timer';
import Res from '../res';

const TimingView = () => {
  const isGroup = TYSdk.devInfo.groupId !== undefined;
  const systemInfoRef = useRef(getSystemInfoSync());
  const { is24Hour } = systemInfoRef.current;
  const { switch_led } = useSelector(state => state.dpState);

  const weekList = useMemo(() => {
    return [
      Strings.getLang('sun'),
      Strings.getLang('mon'),
      Strings.getLang('tue'),
      Strings.getLang('wed'),
      Strings.getLang('thu'),
      Strings.getLang('fri'),
      Strings.getLang('sat'),
    ];
  }, []);
  const [dataList, setDataList] = useState([]);
  // 选择的星期
  const [checkedWeeks, setCheckedWeek] = useState([]);
  // 是否开关灯
  const [currentType, setTypeCurrent] = useState(0);
  // 是否展示弹层
  const [showModal, setShowModal] = useState(false);
  // 选中的日期picker数据
  const now = dayjs();
  const [currentTimePicker, setCurrentTimerPicker] = useState({
    hour: now.hour(),
    minute: now.minute(),
  });
  // 当前操作的定时数据
  const [currentTime, setCurrentTime] = useState(null);
  // 标题数据
  const [title, setTitle] = useState(Strings.getLang('addTiming'));

  const fetchTimerList = () => {
    showLoading({
      title: '',
    });
    TimerApi.getTimerList()
      .then(res => {
        res?.timers && setDataList(res?.timers);
        setTimeout(() => {
          hideLoading();
        }, 300);
      })
      .catch(() => {
        hideLoading();
      });
  };

  const hanldeCancel = () => {
    setShowModal(false);
  };
  const getTime = (currentTimePicker): string => {
    const { hour, minute } = currentTimePicker;
    // hh:mm
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };
  const switchId = TYSdk.device.getDpIdByCode(dpUtils.dpCodes.switchCode);
  // const sceneSelectId = TYSdk.device.getDpIdByCode(dpUtils.dpCodes.sceneSelectCode);
  const handleSave = () => {
    // 编辑模式
    const isEditMode = !!currentTime;
    const loops = weekList.map(i => {
      return checkedWeeks.includes(i) ? 1 : 0;
    });

    const switchOpenstatus = 1;

    const dps = {};

    dps[switchId] = !isOff;

    const actions = {
      time: getTime(currentTimePicker),
      dps,
    };
    // 编辑模式
    if (isEditMode) {
      TimerApi.updateTimer(currentTime?.id, loops.join(''), actions, switchOpenstatus).then(res => {
        setShowModal(false);
        fetchTimerList();
      });
      return;
    }
    // 新增模式
    // 如果新增云端定时超过30个定时，则提示
    const MAX_CLOUD_TIMER_COUNT = 30;
    if (dataList.length >= MAX_CLOUD_TIMER_COUNT) {
      showToast({
        title: Strings.formatValue('timer_count_maxium', `${MAX_CLOUD_TIMER_COUNT}`),
        icon: 'error',
        mask: true,
      });
      return;
    }
    // TimerApi.addTimer(loops.join(''), actions, switchOpenstatus).then(_ => {
    //   setShowModal(false);
    //   fetchTimerList();
    // });
    const requestParams = {
      bizId: isGroup ? TYSdk.devInfo.groupId : TYSdk.devInfo.devId,
      bizType: isGroup ? '1' : '0',
      loops: loops.join(''),
      status: switchOpenstatus,
      actionsArray: JSON.stringify([actions]),
      actions: actions,
      aliasName: '',
      category: 'schedule',
      isAppPush: false,
    };
    console.log('requestParams', requestParams);
    addSingleTimer(requestParams)
      .then(response => {
        console.log('response', response);
        setShowModal(false);
        fetchTimerList();
      })
      .catch();
  };
  const resetModalData = () => {
    setTitle(Strings.getLang('addTiming'));
    setCheckedWeek([]);
    setTypeCurrent(0);
    setCurrentTime(null);
    handleSetCurrnetPickerTime();
  };
  const hanldeAdd = () => {
    setShowModal(!showModal);
    resetModalData();
    return;
  };

  const handlePickerChange = (value: { hour: number; minute: number }) => {
    setCurrentTimerPicker(value);
  };

  const handleSwitchChange = (e, item) => {
    const closeStatus = 0;
    TimerApi.changeTimerStatus(item.id, closeStatus)
      .then(() => {
        fetchTimerList();
        setShowModal(false);
      })
      .catch(() => {
        showToast({
          title: Strings.getLang('operationFail'),
          icon: 'error',
          mask: true,
        });
      });
  };
  const handleEditTime = (index: number, e) => {
    const { target } = e.origin;
    if (target.id === 'Switch') {
      // 阻止switch触发的事件
      return;
    }
    const currentItem = (dataList[index] as unknown) as object;
    if (!currentItem) {
      return;
    }
    setTitle(Strings.getLang('editTiming'));
    setCurrentTime({
      ...currentItem,
      index,
    });
    setShowModal(true);
    return;
  };
  const isEdit = title === Strings.getLang('editTiming');

  const getWeekTextByLoop = (loops = '0000000') => {
    let weekText = '';
    if (loops === '0000000') {
      weekText = Strings.getLang('once');
    } else if (loops === '1111111') {
      weekText = Strings.getLang('everyday');
    } else {
      weekText = loops
        .split('')
        .map((i, idx) => {
          if (i === '1') {
            return weekList[idx];
          }
          return '';
        })
        .filter(i => i)
        .join(',');
    }
    return weekText;
  };
  const renderList = list => {
    if (!list || !list.length) {
      return (
        <View className="no-data-wrapper">
          <Image src={Res.noData} className="no-data-image" />
          <Text>{Strings.getLang('noData')}</Text>
          <View onClick={hanldeAdd} className="add-text-button">
            {Strings.getLang('addText')}
          </View>
        </View>
      );
    }
    const is12Hour = !is24Hour;
    return list.map((item, index) => {
      const { time = '', loops = '0000000', status } = item;
      const [hour, minute] = time.split(':');
      const ampmTxt = is12Hour ? (hour > 12 ? Strings.getLang('PM') : Strings.getLang('AM')) : '';
      const timeText = is12Hour ? `${hour > 12 ? hour - 12 : hour}:${minute}` : `${hour}:${minute}`;
      const weekText = getWeekTextByLoop(loops);

      const parsedDps = typeof item.dps === 'string' ? JSON.parse(item.dps) : item.dps;
      const switchPower = parsedDps[switchId];
      const lightStatus = !switchPower
        ? `${Strings.getLang('turnOff')}`
        : `${Strings.getLang('turnOn')}`;

      const switchChecked = !!status;
      return (
        <View key={index} className="time-item-wrapper" onClick={e => handleEditTime(index, e)}>
          <View className="time-item-left">
            <View className="flex" style={{}}>
              <Text
                className="time-item-text gray"
                style={{
                  position: 'relative',
                  bottom: '-10rpx',
                }}
              >
                {ampmTxt}
              </Text>
              <Text
                className="time-item-text white"
                style={{
                  position: 'relative',
                  bottom: '-10rpx',
                }}
              >
                {timeText}
              </Text>
            </View>
            <View>
              <Text className="time-item-text gray">{weekText}</Text>
            </View>
            <View>
              <Text className="time-item-text gray">{lightStatus}</Text>
            </View>
          </View>

          <View className="time-item-right">
            <Switch
              color="#efad67"
              id="Switch"
              checked={switchChecked}
              onChange={e => {
                handleSwitchChange(e, item);
              }}
            />
          </View>
        </View>
      );
    });
  };

  const handleSetCurrnetPickerTime = (date?: { hour: number; minute: number }) => {
    let hour = 0;
    let minute = 0;
    if (date) {
      hour = date.hour;
      minute = date.minute;
    } else {
      const now = dayjs();
      hour = now.hour();
      minute = now.minute();
    }

    setCurrentTimerPicker({ hour, minute });
  };

  useEffect(() => {
    handleSetCurrnetPickerTime();
  }, [is24Hour]);

  useEffect(() => {
    fetchTimerList();
  }, [switch_led]);

  useEffect(() => {
    // 定时编辑数据恢复
    if (!currentTime) {
      return;
    }
    const { time = '00:00', loops = '0000000', dps } = currentTime;
    const date = {
      hour: +time.split(':')[0],
      minute: +time.split(':')[1],
    };

    handleSetCurrnetPickerTime(date);

    if (loops === '0000000') {
      setCheckedWeek([]);
    } else if (loops) {
      const weekCheckedList = loops
        .split('')
        .map((i, idx) => {
          if (i === '1') {
            return weekList[idx];
          }
          return '';
        })
        .filter(i => i);
      setCheckedWeek(weekCheckedList);
    }

    const parsedDps = typeof dps === 'string' ? JSON.parse(dps) : dps;

    const switchPower = parsedDps[switchId];
    if (!switchPower) {
      setTypeCurrent(0);
    } else {
      setTypeCurrent(1);
    }
  }, [currentTime]);

  const handleCheckWeek = i => {
    const checkedWeeksRes = checkedWeeks;
    checkedWeeksRes.includes(i)
      ? checkedWeeksRes.splice(checkedWeeksRes.indexOf(i), 1)
      : checkedWeeksRes.push(i);
    setCheckedWeek([...checkedWeeksRes]);
  };

  const handleDelete = () => {
    const cloudTimeHandler = () => {
      TimerApi.changeTimerStatus(currentTime.id, 2)
        .then(() => {
          fetchTimerList();
          setShowModal(false);
          // @ts-ignore
          showToast({
            title: Strings.getLang('scene_delete_success'),
            icon: 'success',
            mask: true,
          });
        })
        .catch(() => {
          showToast({
            title: Strings.getLang('scene_delete_failed'),
            icon: 'error',
            mask: true,
          });
        });
    };

    showModalApi({
      title: Strings.getLang('delete'),
      content: Strings.getLang('deleteTip'),
      showCancel: true,
      cancelText: Strings.getLang('cancel'),
      cancelColor: 'rgba(0, 0, 0 .5)',
      confirmText: Strings.getLang('confirm'),
      confirmColor: '#FF9E50',
      success: ({ confirm }) => {
        if (confirm) {
          // TODO: 删除定时数据
          // if (isSupportLocalTime) {
          //   localTimeHandler();
          //   return;
          // }
          cloudTimeHandler();
        }
      },
    });
  };

  const handlePickerTypeChange = e => {
    setTypeCurrent(+e.value);
  };
  const range = [Strings.getLang('turnOff'), Strings.getLang('turnOn')];
  const isOff = currentType === 0; // 0=>关闭, 1=>开启
  return (
    <View className="timing-view-wrapper">
      {isGroup ? (
        <View className="remind-tip-wrapper">
          <Text>{Strings.getLang('group_schedule_tips')}</Text>
        </View>
      ) : null}

      <ScrollView scrollY className="timing-view-scroll">
        {renderList(dataList)}
        {dataList && dataList.length > 0 && (
          <View className="button-add-wrapper" onClick={hanldeAdd}>
            <Image
              src={Res.iconAdd}
              style={{
                height: '36rpx',
                width: '36rpx',
              }}
            ></Image>
          </View>
        )}
      </ScrollView>

      <Modal show={showModal} position="top" overlay={true}>
        <View
          style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#3b3b3c',
          }}
        >
          {/* 顶部操作区 */}
          <View className="timing-view-handler">
            <Text
              style={{
                fontSize: '32rpx',
              }}
              onClick={hanldeCancel}
            >
              {Strings.getLang('cancel')}
            </Text>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: '34rpx',
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: '32rpx',
                color: '#FF9E50',
              }}
              onClick={handleSave}
            >
              {Strings.getLang('save')}
            </Text>
          </View>
          <ScrollView scrollY style={{ width: '100vw', height: '100vh', paddingBottom: '104rpx' }}>
            {/* 内容区 */}
            <View>
              <View className="c-content-center">
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
              <View className="weeks-view">
                {weekList.map(week => {
                  const activeClass = (checkedWeeks || []).includes(week) ? 'active' : '';
                  return (
                    <Text
                      onClick={() => {
                        handleCheckWeek(week);
                      }}
                      key={week}
                      className={`week-item ${activeClass}`}
                    >
                      {week}
                    </Text>
                  );
                })}
              </View>
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
            {isEdit && (
              <Text
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DA3737',
                  width: '750rpx',
                  height: '90rpx',
                  backgroundColor: '#434344',
                  marginTop: '32rpx',
                  marginBottom: '48rpx',
                }}
                onClick={handleDelete}
              >
                {Strings.getLang('delete')}
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default TimingView;
