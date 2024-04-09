/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Swiper, Image, Text, Slider, SwiperItem } from '@ray-js/components';
import { ConfigsForPId } from '../../../config/pId';
import Strings from '@/i18n';
import dpCodes from '@/config/dpCodes';
import { dpUtils, actions } from '@/redux/index';
import { utils } from '@ray-js/panel-sdk';
import * as animationType from '../../diyList/smear/module';
import { navigateBack, setNavigationBarTitle } from '@ray-js/api';
import { TYSdk } from '@ray-js/ray-panel-core';
import { hooks } from '@ray-js/panel-sdk';
import { publishGroupDps, usePageEvent } from '@ray-js/ray';
import { store } from '@/redux';

const { useDpState } = hooks;
const { rgb2hsv, toFixed } = utils;

import './sceneSourceGif.module.less';

const SceneSourceGif = () => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const pid = TYSdk.devInfo.state[dpCodes.pid];
  const { sceneNumbers, commonPId } = ConfigsForPId.getSceneNumbers(pid);

  usePageEvent('onLoad', () => {
    ty.hideMenuButton();

    let swiperItemArray = [];
    ty.getAppInfo({
      success(params) {
        const regionCode = params.regionCode;
        let realmName = ''; //域名
        console.log('当前所处的区域编码为：', regionCode);
        switch (regionCode) {
          case 'AY': //中国区
            realmName = 'https://hkminipanel.s3.ap-east-1.amazonaws.com';
            break;
          case 'AZ': //美国区
            realmName = 'https://minipanelline.s3.us-east-1.amazonaws.com';
            break;
          case 'EU': //欧洲区
            realmName = 'https://euminipanel.s3.eu-central-1.amazonaws.com';
            break;
          case 'IN': //印度区
            realmName = 'https://minipanelline.s3.us-east-1.amazonaws.com';
            break;
          case 'WE': //西欧区
            realmName = 'https://westeuminipanel.s3.eu-west-2.amazonaws.com';
            break;
          case 'UE': //美东区
            realmName = 'https://minipanelline.s3.us-east-1.amazonaws.com';
            break;
          default:
            realmName = 'https://minipanelline.s3.us-east-1.amazonaws.com';
            break;
        }

        sceneNumbers.forEach((number, index) => {
          let swiperItem = {
            src: `${realmName}/${commonPId * 1000 + commonPId}/${commonPId * 1000 +
              commonPId}_${number}.gif`,
            number: number,
          };
          console.log('swiperItem.src', swiperItem);
          swiperItemArray.push(swiperItem);
        });
        // swiperItemArray.reverse();
        setSwiperItemData(swiperItemArray);
        updateSceneNumberDP(swiperItemArray[0].number);
      },
    });
  });
  //速度
  const [speedValue, setSpeedValue] = isGroup
    ? useState(store.getState().groupDPs['103'])
    : useDpState(dpCodes.sceneSpeed);
  //亮度
  const [brightnessValue, setBrightnessValue] = isGroup
    ? useState(store.getState().groupDPs['105'])
    : useDpState(dpCodes.sceneBright);
  //swiper数据源
  const [swiperItemData, setSwiperItemData] = useState([]);
  //是否暂停
  const [isPause, setIsPause] = useState(false);
  const [workMode] = useDpState(dpCodes.workMode);

  setNavigationBarTitle({
    title: TYSdk.devInfo.name,
  });

  useEffect(() => {
    if (workMode != 'scene') {
      navigateBack();
    }
  }, [workMode]);

  //更新场景
  const updateSceneNumberDP = sceneNumber => {
    const sceneIdStr = '01' + toFixed(sceneNumber.toString(10), 2);
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { '25': sceneIdStr },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.sceneCode]: sceneIdStr,
      });
    }
  };

  //修改场景亮度
  const updateSceneBrightness = brightness => {
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { '105': brightness },
        success(params) {
          store.dispatch(actions.common.updateGroupDPs({ '105': brightness }));
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
        dps: { '103': speed },
        success(params) {
          store.dispatch(actions.common.updateGroupDPs({ '103': speed }));
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.sceneSpeed]: speed,
      });
    }
  };

  //暂停或播放
  const updatePauseStatus = isPause => {
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { '102': isPause },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.isPause]: isPause,
      });
    }
  };
  return (
    <View className="c-width-full scene-wrapper">
      <Swiper
        className="swiper"
        dataSource={swiperItemData}
        dotColor="#eee"
        dotActiveColor="rgb(55,147,255)"
        dots={true}
        onAfterChange={e => {
          const index = e.detail.current;
          updateSceneNumberDP(swiperItemData[index].number);
          setIsPause(false);
        }}
        style={{ width: '750rpx', height: '936rpx', background: '#000' }}
      >
        {swiperItemData.map((item, index) => {
          return (
            <SwiperItem key={index}>
              <View style={{ height: '936rpx', background: 'rgb(0,0,0)', position: 'relative' }}>
                <Image
                  className="image-wrapper"
                  mode="aspectFit"
                  src={animationType.common_default}
                  style={{ height: '100%', width: '100%' }}
                ></Image>
                <Image
                  className="image-wrapper"
                  mode="aspectFit"
                  src={item.src}
                  style={{
                    height: '80%',
                    width: '100%',
                    position: 'absolute',
                    left: 0,
                    top: '10%',
                  }}
                ></Image>
              </View>
            </SwiperItem>
          );
        })}
      </Swiper>
      {/* 渲染方向和速度view */}
      <View className="lamp-direction-speed-wraper">
        <View className="lamp-slider-wrap">
          <View>
            <Text>{Strings.getLang('scene_brightness')}</Text>
          </View>
          <Slider
            value={Number(brightnessValue)}
            max={100}
            min={20}
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

        <View className="lamp-slider-wrap">
          <View>
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
      </View>
    </View>
  );
};

export default SceneSourceGif;
