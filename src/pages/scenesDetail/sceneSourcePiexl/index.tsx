import React, { useState, useEffect, useMemo } from 'react';
import propTypes from 'prop-types';
import { View, Swiper, Image, Text, Slider, SwiperItem } from '@ray-js/components';
import DiySmear from '../../../components/diySmear';
import { usePageEvent } from 'ray';

import Strings from '@/i18n';
import dpCodes from '@/config/dpCodes';
import { dpUtils } from '@/redux/index';
import { utils } from '@ray-js/panel-sdk';
import * as imageSrcType from '../../diyList/smear/module';
import { setNavigationBarTitle } from '@ray-js/api';
import { TYSdk } from '@ray-js/ray-panel-core';
import { ConfigsForPId } from '../../../config/pId';
import { winWidth } from '@ray-js/ray-panel-utils/lib/ratio';

const { toFixed } = utils;
import { hooks } from '@ray-js/panel-sdk';
const { useDpState } = hooks;

import './sceneSourcePiexl.module.less';
let renderArray = [];

const EMPTY_ARRAY = [];

const animationTypeMap = [
  {
    normal: imageSrcType.cycleUp_n,
    selected: imageSrcType.cycleUp_s,
    animationType: 'up_loop',
    code: '06',
  },
  {
    normal: imageSrcType.cycleDown_n,
    selected: imageSrcType.cycleDown_s,
    animationType: 'down_loop',
    code: '07',
  },
  {
    normal: imageSrcType.cycleLeft_n,
    selected: imageSrcType.cycleLeft_s,
    animationType: 'left_loop',
    code: '08',
  },
  {
    normal: imageSrcType.cycleRight_n,
    selected: imageSrcType.cycleRight_s,
    animationType: 'right_loop',
    code: '09',
  },
  {
    normal: imageSrcType.twinkle_n,
    selected: imageSrcType.twinkle_s,
    animationType: 'flash',
    code: '04',
  },
  {
    normal: imageSrcType.stop_n,
    selected: imageSrcType.stop_s,
    animationType: 'static',
    code: '05',
  },
];

const SceneSourcePiexl = () => {
  const [swiperCurrent, setSwiperCurrent] = React.useState(-1);
  const pid = TYSdk.devInfo.state[dpCodes.pid];
  const { piexlData, list, row } = ConfigsForPId.getScenePiexlDataWithPId(pid);

  usePageEvent('onLoad', () => {
    ty.hideMenuButton();
    renderArray = [];
    piexlData.forEach((item, idx) => {
      const renderItem = {
        box: [],
        isDynamic: false,
        speed: 100,
        isPause: false,
        animationType: 'static',
        sceneId: item.form.subSceneId,
      };
      let box = [];
      const piexlArray = item.dotList;

      if (piexlArray.length > 1) {
        //动态多图
        piexlArray.forEach((thumbData, index) => {
          renderItem.isDynamic = true;
          thumbData.forEach(rgbaArray => {
            box = [];
            const oldRow = Math.floor(index / row);
            const oldList = index % row;
            const newRow = oldList;
            const newList = oldRow;
            const newIdx = newRow * list + newList;
            const [r, g, b, a] = thumbData[newIdx];
            box.push({ fillStyle: `rgba(${r},${g},${b},${a})` });
            renderItem.box.push({ box: box });
          });
        });
        renderItem.box = box;
      } else {
        //静态 单图
        const thumbData = piexlArray[0];
        thumbData.forEach((rgba, index) => {
          //以下是为了修改横纵方向数据
          const oldRow = Math.floor(index / row);
          const oldList = index % row;
          const newRow = oldList;
          const newList = oldRow;
          const newIdx = newRow * list + newList;
          const [r, g, b, a] = thumbData[newIdx];
          box.push({ fillStyle: `rgba(${r},${g},${b},${a})` });
        });

        renderItem.box = box;
      }
      renderArray.push(renderItem);
    });
    setSwiperItemData([...renderArray]);
    if (renderArray.length > 0) {
      setIsDynamic(renderArray[0].isDynamic);
    }
    updateSceneNumber(0);
  });

  const piexlW = (winWidth - 20) / Math.max(row, list);
  //速度
  const [speedValue, setSpeedValue] = useDpState(dpCodes.sceneSpeed);
  //亮度
  const [brightnessValue, setBrightnessValue] = useDpState(dpCodes.sceneBright);
  //动画选择
  const [animationIndex, setAnimationIndex] = useState(5);
  //swiper数据源
  const [swiperItemData, setSwiperItemData] = useState(renderArray);

  //是否是动态
  const [isDynamic, setIsDynamic] = useState(true);
  const [workMode] = useDpState(dpCodes.workMode);

  useEffect(() => {
    updateSceneDirection(animationIndex);
  }, [animationIndex]);
  useEffect(() => {
    renderArray.forEach(swiperItem => {
      swiperItem.speed = speedValue; //
    });
    setSwiperItemData([...renderArray]);
  }, [speedValue]);

  setNavigationBarTitle({
    title: TYSdk.devInfo.name,
  });
  useEffect(() => {
    if (workMode != 'scene') {
      ty.navigateBack();
    }
  }, [workMode]);

  //更新场景
  const updateSceneNumber = index => {
    setSwiperCurrent(index);
    const sceneIdStr = '00' + toFixed(renderArray[index].sceneId.toString(10), 2);
    dpUtils.putDpData({
      [dpCodes.sceneCode]: sceneIdStr,
    });
  };

  //修改场景亮度
  const updateSceneBrightness = brightness => {
    //修改亮度时自动取消暂停
    renderArray.forEach(swiperItem => {
      swiperItem.isPause = false;
    });
    setSwiperItemData([...renderArray]);

    dpUtils.putDpData({
      [dpCodes.sceneBright]: brightness,
    });
  };
  //修改场景速度
  const updateSceneSpeed = speed => {
    //修改速度时自动取消暂停
    renderArray.forEach(swiperItem => {
      swiperItem.isPause = false;
    });
    setSwiperItemData([...renderArray]);
    // updatePauseStatus(false);
    dpUtils.putDpData({
      [dpCodes.sceneSpeed]: speed,
    });
  };
  //修改场景方向
  const updateSceneDirection = index => {
    //修改方向时自动取消暂停
    renderArray.forEach(swiperItem => {
      swiperItem.isPause = false;
    });
    setSwiperItemData([...renderArray]);
    // updatePauseStatus(false);

    dpUtils.putDpData({
      [dpCodes.sceneDirection]: animationTypeMap[index].animationType,
    });
  };

  //暂停或播放
  const updatePauseStatus = isPause => {
    dpUtils.putDpData({
      [dpCodes.isPause]: isPause,
    });
  };

  //渲染方向视图
  const renderDerictionView = () => {
    const lineMaxCount = 6; //当行最大个数
    const itemW = ((375 - 20 - lineMaxCount * 20) / lineMaxCount) * 2;
    return (
      <View className="direction-wrapper">
        <Text style={{ paddingLeft: '20rpx' }}>{Strings.getLang('scene_direction')}</Text>
        <View className="direction-item-wrapper">
          {animationTypeMap.map((item, index) => {
            return (
              <View
                className={'direction-item'}
                onClick={() => {
                  setAnimationIndex(index);
                  renderArray.forEach(swiperItem => {
                    swiperItem.animationType = animationTypeMap[index].animationType; //
                  });
                  setSwiperItemData([...renderArray]);

                  //下发方向
                  updateSceneDirection(index);
                }}
                key={index}
                style={{ width: itemW, height: itemW }}
              >
                <Image src={animationIndex === index ? item.selected : item.normal}></Image>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="c-width-full scene-wrapper">
      <Swiper
        className="swiper"
        dataSource={swiperItemData}
        dotColor="#eee"
        dotActiveColor="rgb(55,147,255)"
        dots={true}
        style={{ height: '820rpx' }}
        onAfterChange={e => {
          const index = e.detail.current;
          updateSceneNumber(index);
        }}
        onChange={e => {
          const index = e.detail.current;
          renderArray.forEach(swiperItem => {
            swiperItem.isPause = false;
          });

          setSwiperItemData([...renderArray]);
          setIsDynamic(renderArray[index].isDynamic);
        }}
      >
        {swiperItemData.map((item, index) => {
          return (
            <SwiperItem key={index}>
              <View className="c-width-full diy-wrapper">
                <DiySmear
                  key={'diy-smear'}
                  pixelData={item.isDynamic ? EMPTY_ARRAY : item.box}
                  dynamicData={item.isDynamic ? item.box : EMPTY_ARRAY}
                  isDynamic={item.isDynamic}
                  width={piexlW * list}
                  height={piexlW * row}
                  pixelSize={piexlW}
                  showType={0}
                  elementWidth={'750rpx'}
                  elementHeight={'750rpx'}
                  elementPadding={'10px'}
                  pixelColor={'rgb(67,68,71)'}
                  canvasId={`previewDIY${index}`}
                  animationType={item.animationType}
                  isCurrentSwiperItem={index === swiperCurrent}
                  interval={(100 - item.speed) * 5 + 300}
                  isPause={item.isPause}
                ></DiySmear>
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
              // setBrightnessValue(val.value);
              //下发亮度
              updateSceneBrightness(val.value);
            }}
          ></Slider>
        </View>

        {renderDerictionView()}

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
                renderArray.forEach(swiperItem => {
                  swiperItem.speed = val.value; //
                });
                setSwiperItemData([...renderArray]);

                //下发速度
                updateSceneSpeed(val.value);
              }}
            ></Slider>
            <View
              className="pause-wrapper"
              onClick={() => {
                let isPause = false;
                renderArray.forEach(swiperItem => {
                  swiperItem.isPause = !swiperItem.isPause;
                  isPause = swiperItem.isPause;
                });

                setSwiperItemData([...renderArray]);
                updatePauseStatus(isPause);
              }}
            >
              <Image
                className="playIcon"
                src={
                  swiperItemData.length === 0 || swiperItemData[0].isPause
                    ? imageSrcType.button_play
                    : imageSrcType.button_pause
                }
                mode="aspectFit"
              ></Image>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SceneSourcePiexl;

SceneSourcePiexl.propTypes = {
  location: propTypes.object,
};
