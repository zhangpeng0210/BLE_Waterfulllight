import { View, Text, Image, Switch, Slider } from '@ray-js/components';
import React, { useState, useEffect } from 'react';
import { ConfigsForPId } from '../../../config/pId';
import collectIcon_n from './button_collect_n@2x.png';
import collectIcon_s from './button_collect_s@2x.png';
import cancelIcon from './common_button_cancel_white@2x.png';
import { hooks } from '@ray-js/panel-sdk';
import dpCodes from '@/config/dpCodes';
import { dpUtils, actions } from '@/redux/index';
import { utils } from '@ray-js/panel-sdk';
import Strings from '@/i18n';
import { store } from '@/redux';
import { TYSdk } from '@ray-js/ray-panel-core';
import { publishGroupDps } from '@ray-js/ray';
import * as animationType from '../../diyList/smear/module';
import SupportUtils from '@/utils/supportUtils';

import './module.less';

const LoopCollection = props => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const { toFixed, hexStringToBinString, strToHexString } = utils;
  const { useDpState } = hooks;
  const { getDpIdByCode } = TYSdk.device;
  const { groupDPs } = store.getState();
  const lineMaxCount = 7; //单行最大个数
  const itemW = ((375 - 20 - lineMaxCount * 15) / lineMaxCount) * 2;
  const sceneAmount = ConfigsForPId.getHomeItems().sceneAmount;
  const [dpState] = useDpState();
  const [currentIndex, setCurrentIndex] = useState(-1);
  //速度
  const [speedValue, setSpeedValue] = useState(70);
  //亮度
  const [brightnessValue, setBrightnessValue] = useState(70);
  //循环时间间隔
  const [loopTimeValue, setLoopTimeValue] = useState(60);
  //是否暂停
  const [isPause, setIsPause] = useState(false);
  //是否开启循环
  const [isLoop, setIsLoop] = useState(false);
  //循环的场景数据
  const [sceneNumberArray, setSceneNumberArray] = useState([]);

  //单设备连接时初始化数据
  useEffect(() => {
    if (isGroup) {
      const groupLoopNumbersDataHEX =
        groupDPs[getDpIdByCode(dpCodes.loopNumbers)] === undefined ||
        groupDPs[getDpIdByCode(dpCodes.loopNumbers)] == '' ||
        String(groupDPs[getDpIdByCode(dpCodes.loopNumbers)]).length < 16
          ? '0000000000000000'
          : groupDPs[getDpIdByCode(dpCodes.loopNumbers)];

      changeSceneLoopNumberData(groupLoopNumbersDataHEX);
      const groupIsLoop =
        groupDPs[getDpIdByCode(dpCodes.isLoop)] == '' ||
        groupDPs[getDpIdByCode(dpCodes.isLoop)] === undefined ||
        groupDPs[dpCodes.loopNumbers].includes('\u0000');
      groupLoopNumbersDataHEX == '0000000000000000'
        ? false
        : groupDPs[getDpIdByCode(dpCodes.isLoop)];
      setIsLoop(groupIsLoop);
      if (groupIsLoop) {
        updateIsLoopStatusDP(true);
      }
      const groupSpeed =
        groupDPs[getDpIdByCode(dpCodes.sceneSpeed)] == 0 ||
        groupDPs[getDpIdByCode(dpCodes.sceneSpeed)] === undefined
          ? 100
          : groupDPs[getDpIdByCode(dpCodes.sceneSpeed)];
      setSpeedValue(groupSpeed);

      const groupBrightness =
        groupDPs[getDpIdByCode(dpCodes.sceneBright)] == 0 ||
        groupDPs[getDpIdByCode(dpCodes.sceneBright)] === undefined
          ? 100
          : groupDPs[getDpIdByCode(dpCodes.sceneBright)];
      setBrightnessValue(groupBrightness);

      const groupLoopTimer =
        groupDPs[getDpIdByCode(dpCodes.loopTimer)] == 0 ||
        groupDPs[getDpIdByCode(dpCodes.loopTimer)] === undefined
          ? 60
          : groupDPs[getDpIdByCode(dpCodes.loopTimer)];
      setLoopTimeValue(groupLoopTimer);

      const groupIsPause =
        groupDPs[getDpIdByCode(dpCodes.isPause)] == '' ||
        groupDPs[getDpIdByCode(dpCodes.isPause)] === undefined
          ? false
          : groupDPs[getDpIdByCode(dpCodes.isPause)];
      setIsPause(groupIsPause);
    } else {
      //收藏的场景数据
      let tempLoopData;
      if (dpState[dpCodes.loopNumbers] == undefined || dpState[dpCodes.loopNumbers] == '') {
        tempLoopData = '0000000000000000';
      } else if (String(dpState[dpCodes.loopNumbers]).includes('\u0000')) {
        tempLoopData = String(dpState[dpCodes.loopNumbers]).replace(/\u0000/g, '00');
      } else {
        tempLoopData = dpState[dpCodes.loopNumbers];
      }
      changeSceneLoopNumberData(tempLoopData);
      //是否开启循环
      setIsLoop(dpState[dpCodes.isLoop]);
      //是否暂停
      setIsPause(dpState[dpCodes.isPause]);
      //速度
      setSpeedValue(dpState[dpCodes.sceneSpeed]);
      //亮度
      setBrightnessValue(dpState[dpCodes.sceneBright]);
      //循环间隔
      setLoopTimeValue(dpState[dpCodes.loopTimer]);
    }
  }, [dpState]);

  useEffect(() => {
    if (currentIndex > -1) {
      changeSceneDP();
    }
  }, [currentIndex]);

  //把收藏场景的数据转成数组
  const changeSceneLoopNumberData = loopNumbersData => {
    const bitArray = hexStringToBinString(String(loopNumbersData));
    let tempArray = [];
    for (let i = 0; i < bitArray.length; i++) {
      if (i % 8 == 0) {
        const sceneNumber8 = {
          number: i + 1,
          isCollect: bitArray[i + 7] == '1',
          isSelected: false,
        };
        tempArray.push(sceneNumber8);
        const sceneNumber7 = {
          number: i + 2,
          isCollect: bitArray[i + 6] == '1',
          isSelected: false,
        };
        tempArray.push(sceneNumber7);
        const sceneNumber6 = {
          number: i + 3,
          isCollect: bitArray[i + 5] == '1',
          isSelected: false,
        };
        tempArray.push(sceneNumber6);
        const sceneNumber5 = {
          number: i + 4,
          isCollect: bitArray[i + 4] == '1',
          isSelected: false,
        };
        tempArray.push(sceneNumber5);
        const sceneNumber4 = {
          number: i + 5,
          isCollect: bitArray[i + 3] == '1',
          isSelected: false,
        };
        tempArray.push(sceneNumber4);
        const sceneNumber3 = {
          number: i + 6,
          isCollect: bitArray[i + 2] == '1',
          isSelected: false,
        };
        tempArray.push(sceneNumber3);
        const sceneNumber2 = {
          number: i + 7,
          isCollect: bitArray[i + 1] == '1',
          isSelected: false,
        };
        tempArray.push(sceneNumber2);
        const sceneNumber1 = {
          number: i + 8,
          isCollect: bitArray[i + 0] == '1',
          isSelected: false,
        };
        tempArray.push(sceneNumber1);
      }
    }
    //删除用于补位的
    tempArray.splice(sceneAmount, tempArray.length - sceneAmount);

    setSceneNumberArray(tempArray);
  };

  //下发是否开启循环的DP
  const updateIsLoopStatusDP = status => {
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { [getDpIdByCode(dpCodes.isLoop)]: status },
        success(params) {
          store.dispatch(
            actions.common.updateGroupDPs({ [getDpIdByCode(dpCodes.isLoop)]: status })
          );
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.isLoop]: status,
      });
    }
  };

  //下发切换场景DP
  const changeSceneDP = () => {
    let number;
    if (sceneNumberArray.length > 0) {
      number = sceneNumberArray[currentIndex].number;
    } else {
      number = 1;
    }
    const sceneDataStr = '01' + toFixed(number.toString(10), 2);
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { [getDpIdByCode(dpCodes.sceneCode)]: sceneDataStr },
        success(params) {
          store.dispatch(
            actions.common.updateGroupDPs({ [getDpIdByCode(dpCodes.sceneCode)]: sceneDataStr })
          );
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.sceneCode]: sceneDataStr,
      });
    }
  };

  //下发更新收藏数据的DP
  const updateCollectListDP = listArray => {
    let collectedNumberStr = '';
    let tempNumbers = [];
    listArray.map(item => {
      if (item.isCollect) {
        tempNumbers.push('1');
      } else {
        tempNumbers.push('0');
      }
    });
    const covering = 64 - listArray.length;

    for (let i = 0; i < covering; i++) {
      tempNumbers.push('0');
    }
    //每8个元素翻转后组成一个byte
    let byte = '';
    for (let i = 0; i < tempNumbers.length; i++) {
      if (i % 8 == 0) {
        byte = '';
        byte += String(tempNumbers[i + 7]);
        byte += String(tempNumbers[i + 6]);
        byte += String(tempNumbers[i + 5]);
        byte += String(tempNumbers[i + 4]);
        byte += String(tempNumbers[i + 3]);
        byte += String(tempNumbers[i + 2]);
        byte += String(tempNumbers[i + 1]);
        byte += String(tempNumbers[i + 0]);
        collectedNumberStr += strToHexString(byte);
      }
    }
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { [getDpIdByCode(dpCodes.loopNumbers)]: collectedNumberStr },
        success(params) {
          store.dispatch(
            actions.common.updateGroupDPs({
              [getDpIdByCode(dpCodes.loopNumbers)]: collectedNumberStr,
            })
          );
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.loopNumbers]: collectedNumberStr,
      });
    }
  };

  //修改场景亮度
  const updateSceneBrightness = brightness => {
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { [getDpIdByCode(dpCodes.sceneBright)]: brightness },
        success(params) {
          store.dispatch(
            actions.common.updateGroupDPs({ [getDpIdByCode(dpCodes.sceneBright)]: brightness })
          );
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.sceneBright]: brightness,
      });
    }
  };
  //修改场景速度
  const updateSceneSpeed = speed => {
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { [getDpIdByCode(dpCodes.sceneSpeed)]: speed },
        success(params) {
          store.dispatch(
            actions.common.updateGroupDPs({ [getDpIdByCode(dpCodes.sceneSpeed)]: speed })
          );
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.sceneSpeed]: speed,
      });
    }
  };

  //修改循环时间间隔
  const updateLoopTimerDP = loopTimer => {
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { [getDpIdByCode(dpCodes.loopTimer)]: loopTimer },
        success(params) {
          store.dispatch(
            actions.common.updateGroupDPs({ [getDpIdByCode(dpCodes.loopTimer)]: loopTimer })
          );
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.loopTimer]: loopTimer,
      });
    }
  };

  //暂停或播放
  const updatePauseStatus = isPause => {
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { [getDpIdByCode(dpCodes.isPause)]: isPause },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.isPause]: isPause,
      });
    }
  };
  //关闭循环的提示
  const closeTheLoopTips = () => {
    ty.showModal({
      title: Strings.getLang('loop_tips_title'),
      content: Strings.getLang('loop_tips_content'),
      cancelText: Strings.getLang('cancel'),
      confirmText: Strings.getLang('loop_tips_close'),

      success(params) {
        if (params.confirm) {
          setIsLoop(false);
          updateIsLoopStatusDP(false);
          setIsPause(false);
        }
      },
    });
  };

  //收藏按钮点击事件
  const collectionButtonClicked = () => {
    if (currentIndex < 0) {
      return;
    }
    let tempArray = [...sceneNumberArray];
    tempArray[currentIndex].isCollect = !tempArray[currentIndex].isCollect;

    setSceneNumberArray(tempArray);
    updateCollectListDP(tempArray);
  };

  //渲染场景序号
  const renderSceneNumberView = () => {
    return (
      <View
        className="sceneNumber-item-wrapper"
        style={{ maxHeight: `${(itemW + 20) * 4 + itemW / 2 + 20}rpx` }}
      >
        {sceneNumberArray.map((item, index) => {
          return (
            <View
              className={'sceneNumber-item'}
              key={index}
              style={{
                width: itemW,
                height: itemW,
                borderColor: currentIndex == index ? 'rgb(55, 147, 255)' : 'rgb(112, 112, 112);',
              }}
              onClick={() => {
                if (isLoop) {
                  return closeTheLoopTips();
                }
                setCurrentIndex(index);
                setIsPause(false);
              }}
            >
              {renderSceneNumberIsCollect(item)}

              <Text>{index + 1}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  //渲染场景序号是否被收藏
  const renderSceneNumberIsCollect = item => {
    if (item.isCollect) {
      return <View className="selected-icon"></View>;
    } else {
      return null;
    }
  };

  //渲染tipsContent
  const renderTipsContent = () => {
    if (!isGroup && !SupportUtils.isSupportDp(dpCodes.isLoop)) {
      return null;
    } else {
      return <Text style={{ marginTop: '20rpx' }}>{Strings.getLang('loop_content_remind')}</Text>;
    }
  };

  //渲染循环操作视图
  const renderLoopOprationView = () => {
    if (!isGroup && !SupportUtils.isSupportDp(dpCodes.isLoop)) {
      return null;
    } else {
      return (
        <View className="opration-wrapper">
          <View
            className="opration-left-wrapper"
            onClick={() => {
              if (isLoop) {
                return closeTheLoopTips();
              }
              collectionButtonClicked();
            }}
          >
            <Text>{Strings.getLang('loop_title_collect')}</Text>
            <Image
              src={
                sceneNumberArray.length > 0 &&
                currentIndex > -1 &&
                sceneNumberArray[currentIndex].isCollect
                  ? collectIcon_s
                  : collectIcon_n
              }
              mode="aspectFit"
              style={{ marginLeft: '40rpx', width: '40rpx', height: '40rpx' }}
            ></Image>
          </View>
          <View className="opration-right-wrapper">
            <Text style={{ marginRight: '40rpx' }}>{Strings.getLang('loop_title_loop')}</Text>
            <Switch
              checked={isLoop}
              onChange={e => {
                setIsLoop(e.value);
                updateIsLoopStatusDP(e.value);
                setIsPause(false);
              }}
            ></Switch>
          </View>
        </View>
      );
    }
  };

  //渲染循环间隔的视图
  const renderLoopTimeView = () => {
    if (!isGroup && !SupportUtils.isSupportDp(dpCodes.isLoop)) {
      return null;
    } else {
      return (
        <View className="lamp-slider-wrap">
          <View className="titleType-wrapper">
            <Text>{Strings.getLang('loop_title_timer')}</Text>
            <Text>{`${Math.ceil(Number(loopTimeValue) / 60)}min`}</Text>
          </View>
          <Slider
            value={Math.ceil(Number(loopTimeValue) / 60)}
            max={5}
            min={1}
            step={1}
            backgroundColor="#fff"
            onChange={val => {
              setLoopTimeValue(val.value * 60);
              setIsPause(false);

              updateLoopTimerDP(val.value * 60);
            }}
          ></Slider>
        </View>
      );
    }
  };

  return (
    <View className="c-width-full collection-wrapper">
      <Text style={{ marginTop: '20rpx' }}>{Strings.getLang('loop_title_more')}</Text>
      {renderTipsContent()}
      <View
        className="close-button-wrapper"
        onClick={() => {
          props.removeModalViewEvent();
        }}
      >
        <Image src={cancelIcon} mode="aspectFit" style={{ width: '50%', height: '50%' }}></Image>
      </View>

      {renderLoopOprationView()}
      {renderSceneNumberView()}

      <View className="lamp-direction-speed-wraper">
        <View className="lamp-slider-wrap">
          <View className="titleType-wrapper">
            <Text>{Strings.getLang('scene_speed')}</Text>
          </View>
          <View className="speedSelector-playOrPause-wrapper">
            <Slider
              value={Number(speedValue)}
              max={100}
              min={1}
              step={1}
              backgroundColor="#fff"
              onChange={val => {
                setSpeedValue(val.value);
                setIsPause(false);
                //下发速度
                updateSceneSpeed(val.value);
              }}
            ></Slider>
            <View
              className="pause-wrapper"
              onClick={() => {
                setIsPause(!isPause);
                updatePauseStatus(!isPause);
              }}
            >
              <Image
                className="playIcon"
                src={isPause ? animationType.button_play : animationType.button_pause}
                mode="aspectFit"
              ></Image>
            </View>
          </View>
        </View>
        <View className="lamp-slider-wrap">
          <View className="titleType-wrapper">
            <Text>{Strings.getLang('scene_brightness')}</Text>
            <Text>{`${brightnessValue}%`}</Text>
          </View>
          <Slider
            value={brightnessValue}
            max={100}
            min={1}
            step={1}
            backgroundColor="#fff"
            onChange={val => {
              setBrightnessValue(val.value);
              //下发亮度
              updateSceneBrightness(val.value);
              setIsPause(false);
            }}
          ></Slider>
        </View>
        {renderLoopTimeView()}
      </View>
    </View>
  );
};

export default LoopCollection;
