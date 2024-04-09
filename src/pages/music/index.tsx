import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Slider, Image } from '@ray-js/components';
import './music.module.less';
import mode1 from './res/music_mode_1@3x.png';
import mode1Active from './res/music_mode_1_active@3x.png';
import mode2 from './res/music_mode_2@3x.png';
import mode2Active from './res/music_mode_2_active@3x.png';
import mode3 from './res/music_mode_3@3x.png';
import mode3Active from './res/music_mode_3_active@3x.png';
import mode4 from './res/music_mode_4@3x.png';
import mode4Active from './res/music_mode_4_active@3x.png';
import dpCodes from '@/config/dpCodes';
import { dpUtils, actions } from '@/redux/index';
import { utils } from '@ray-js/panel-sdk';
import Strings from '@/i18n';
import { LampRectPickerColor } from '@ray-js/components-ty-lamp';
import { viewWidth } from '@ray-js/ray-panel-utils/lib/ratio';
import { hooks } from '@ray-js/panel-sdk';
const { useDpState } = hooks;
import { publishGroupDps } from '@ray-js/ray';
import { TYSdk } from '@ray-js/ray-panel-core';
import { store } from '@/redux';

const { hsv2rgb, toFixed, hexStringToNumber } = utils;

const ModeImageMap = [
  {
    mode: mode1,
    active: mode1Active,
    name: 'music_mode_1',
    modeType: 1,
  },
  {
    mode: mode2,
    active: mode2Active,
    name: 'music_mode_2',
    modeType: 2,
  },
  {
    mode: mode3,
    active: mode3Active,
    name: 'music_mode_3',
    modeType: 3,
  },
  {
    mode: mode4,
    active: mode4Active,
    name: 'music_mode_4',
    modeType: 4,
  },
];

const MusicView = () => {
  const [musicDataHex] = useDpState(dpCodes.micMusicCode);
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const { groupDPs } = store.getState();

  const favoriteColorList = [
    { h: 0, s: 0, v: 1000 },
    { h: 18, s: 455, v: 1000 },
    { h: 0, s: 1000, v: 1000 },
    { h: 120, s: 1000, v: 1000 },
    { h: 240, s: 1000, v: 1000 },
  ];
  //预设颜色，本质还是颜色
  const [activeFavoriteColorIndex, setActiveFavoriteColorIndex] = useState(-1);

  const formatHSVHexStrToHSVValue = hex => {
    /*/
     * /hex 模式 灵敏度 亮度 自动开关  h    s 
             0   00  0000    0   0000 0000
    */
    const h = hexStringToNumber(hex.substr(8, 4))[0] * 256 + hexStringToNumber(hex.substr(8, 4))[1];
    const s =
      hexStringToNumber(hex.substr(12, 4))[0] * 256 + hexStringToNumber(hex.substr(12, 4))[1];
    const v = hexStringToNumber(hex.substr(3, 4))[0] * 256 + hexStringToNumber(hex.substr(3, 4))[1];
    //灵敏度
    const ensitivity = hexStringToNumber(hex.substr(1, 2))[0];
    //是否开启自动(开关)
    const autoIsOpen = hex.substr(7, 1) == 1;
    //音乐模式(能量1、节奏2、频道3、律动4)下标
    const activeMusicMode = hex.substr(0, 1) - 1;
    return { h, s, v, ensitivity, autoIsOpen, activeMusicMode }; //360 1000 1000
  };

  const [hsvValue, setHsvValue] = useState({ h: 360, s: 1000, v: 1000 }); //360  1000 1000
  const [brightnessValue, setBrightnessValue] = useState(1000); //亮度 0-1000
  //灵敏度
  const [sensitivityValue, setSensitivityValue] = useState(90);
  //是否开启自动(开关)
  const [autoIsOpen, setAutoIsOpen] = useState(false);
  //音乐模式(能量1、节奏2、频道3、律动4)
  const [activeMusicMode, setActiveMusicMode] = useState(0);

  useEffect(() => {
    if (musicDataHex !== undefined && musicDataHex != '' && musicDataHex != '0') {
      const musicData = formatHSVHexStrToHSVValue(musicDataHex);
      if (musicData.h === 18 && musicData.s === 956) {
        //暖白
        setHsvValue({ h: 18, s: 455, v: musicData.v });
      } else {
        setHsvValue(musicData);
      }
      setBrightnessValue(musicData.v);
      setSensitivityValue(musicData.ensitivity);
      setAutoIsOpen(musicData.autoIsOpen);
      setActiveMusicMode(musicData.activeMusicMode);
    }
  }, [musicDataHex]);

  useEffect(() => {
    if (isGroup) {
      const groupMusicHEX =
        groupDPs['101'] === undefined || groupDPs['101'] == '0' || groupDPs['101'] == ''
          ? '15a03e80016803e803e8'
          : groupDPs['101'];
      const musicData = formatHSVHexStrToHSVValue(groupMusicHEX);
      if (musicData.h === 18 && musicData.s === 956) {
        //暖白
        setHsvValue({ h: 18, s: 455, v: musicData.v });
      } else {
        setHsvValue(musicData);
      }
      setBrightnessValue(musicData.v);
      setSensitivityValue(musicData.ensitivity);
      setAutoIsOpen(musicData.autoIsOpen);
      setActiveMusicMode(musicData.activeMusicMode);

      console.log('groupMusicData', musicData);
      publishColorDPs(
        musicData.activeMusicMode == undefined ? 0 : musicData.activeMusicMode,
        musicData.ensitivity,
        musicData.v,
        musicData.autoIsOpen,
        musicData
      );
    }
  }, []);

  const onTouchEnd = evt => {
    setHsvValue({ h: evt.h, s: evt.s, v: brightnessValue });
    setActiveFavoriteColorIndex(-1);
    //颜色
    publishColorDPs(null, null, null, null, evt);
  };

  const formatHSVValueToColorString = hsv => {
    const [r, g, b] = hsv2rgb(hsv.h, hsv.s / 10, 100);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleSetActiveColor = index => () => {
    setActiveFavoriteColorIndex(index);
    const activeColor = favoriteColorList[index];
    setHsvValue(activeColor);
    //颜色
    if (index === 1) {
      publishColorDPs(null, null, null, null, { h: 18, s: 956 });
    } else {
      publishColorDPs(null, null, null, null, activeColor);
    }
  };

  //发布功能点
  const publishColorDPs = (modeIndex?, sensitivity?, brightness?, isAuto?, hsv?) => {
    //模式;
    const modeType =
      modeIndex === null
        ? ModeImageMap[activeMusicMode].modeType
        : ModeImageMap[modeIndex].modeType;

    //灵敏度
    sensitivity = sensitivity === null ? sensitivityValue : sensitivity;
    //亮度
    brightness = brightness === null ? brightnessValue : brightness;
    //是否自动
    isAuto = isAuto === null ? autoIsOpen : isAuto;
    //颜色
    if (activeFavoriteColorIndex === 1) {
      hsv = { h: 18, s: 956 };
    } else {
      hsv = hsv === null ? hsvValue : hsv;
    }

    const hsvStr =
      toFixed(Math.ceil(hsv.h).toString(16), 4) +
      toFixed(Math.ceil(hsv.s).toString(16), 4) +
      toFixed(brightness.toString(16), 4);

    const musicDP =
      modeType +
      toFixed(sensitivity.toString(16), 2) +
      toFixed(brightness.toString(16), 4) +
      (isAuto === true ? 1 : 0) +
      hsvStr;
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { '101': musicDP },
        success(params) {
          store.dispatch(actions.common.updateGroupDPs({ '101': musicDP }));
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.micMusicCode]: musicDP,
      });
    }
  };

  const renderFavoriteColor = () => {
    return favoriteColorList.map((item, index) => {
      return (
        <View
          className={`color ${index === activeFavoriteColorIndex ? 'active' : ''}`}
          key={index}
          style={{ background: formatHSVValueToColorString(item) }}
          onClick={handleSetActiveColor(index)}
        ></View>
      );
    });
  };

  //渲染蒙层
  const renderMaskView = () => {
    if (activeMusicMode === 0 || autoIsOpen) {
      return <View className="maskView"></View>;
    } else {
      return null;
    }
  };

  return (
    <View className="c-width-full dimmer-wrapper">
      <View className="favorite-color-list">
        {renderFavoriteColor()}
        <Switch
          checked={autoIsOpen}
          // disabled={activeMusicMode===0}
          onChange={e => {
            setAutoIsOpen(e.value);
            //是否自动
            publishColorDPs(null, null, null, e.value, null);
          }}
          style={{ zIndex: activeMusicMode === 0 ? 99 : 101 }}
        ></Switch>
        <Text style={{ color: 'white', fontSize: 24 }}>AUTO</Text>
      </View>
      <View className="color-disk-wrap">
        <LampRectPickerColor
          hs={{ h: hsvValue.h, s: hsvValue.s }}
          rectWidth={viewWidth - 40 * 2}
          rectHeight={200}
          thumbRadius={12}
          containerStyle={{
            borderRadius: '10px',
          }}
          onTouchEnd={onTouchEnd}
        />
      </View>

      {renderMaskView()}

      <View className="lamp-mode-list-wrp">
        {ModeImageMap.map((item, index) => {
          const isActive = activeMusicMode === index;
          return (
            <View
              className={`mode-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveMusicMode(index);
                //模式
                publishColorDPs(index, null, null, null, null);
              }}
              key={index}
            >
              <Image src={isActive ? item.active : item.mode}></Image>
              <Text>{Strings.getLang(item.name)}</Text>
            </View>
          );
        })}
      </View>
      <View className="lamp-slider-wrap">
        <View>
          <Text>{Strings.getLang('scene_brightness')}</Text>
        </View>
        <Slider
          value={brightnessValue}
          activeColor={`linear-gradient(to right, ${formatHSVValueToColorString(hsvValue)}, white)`}
          backgroundColor="#fff"
          min={10}
          max={1000}
          onChange={val => {
            setBrightnessValue(val.value);
            //亮度
            publishColorDPs(null, null, val.value, null, null);
          }}
        ></Slider>
      </View>
      <View className="lamp-slider-wrap">
        <View>
          <Text>{Strings.getLang('music_sensitivity')}</Text>
        </View>
        <Slider
          activeColor="rgb(41,143,224)"
          backgroundColor="#fff"
          blockColor="rgb(41,143,224)"
          value={sensitivityValue}
          onChange={e => {
            console.log(e.value);
            setSensitivityValue(e.value);
            //灵敏度
            publishColorDPs(null, e.value, null, null, null);
          }}
        ></Slider>
      </View>
    </View>
  );
};

export default MusicView;
