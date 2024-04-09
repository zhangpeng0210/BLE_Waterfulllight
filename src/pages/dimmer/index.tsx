import React, { useState, useEffect } from 'react';
import { View, Text, Slider } from '@ray-js/components';
import './dimmer.module.less';
import dpCodes from '@/config/dpCodes';
import { actions, dpUtils } from '@/redux/index';
import { utils } from '@ray-js/panel-sdk';
const { toFixed, hexStringToNumber, hsv2rgb } = utils;
import Strings from '@/i18n';
import { LampRectPickerColor } from '@ray-js/components-ty-lamp';
import { viewWidth } from '@ray-js/ray-panel-utils/lib/ratio';
import { hooks } from '@ray-js/panel-sdk';
import { publishGroupDps } from '@ray-js/ray';
import { TYSdk } from '@ray-js/ray-panel-core';
import { store } from '@/redux';

const { useDpState } = hooks;

const DimmerView = () => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const { groupDPs } = store.getState();
  const favoriteColorList = [
    { h: 0, s: 0, v: 1000 },
    { h: 18, s: 455, v: 1000 },
    { h: 0, s: 1000, v: 1000 },
    { h: 120, s: 1000, v: 1000 },
    { h: 240, s: 1000, v: 1000 },
  ];
  const [activeFavoriteColorIndex, setActiveFavoriteColorIndex] = useState(-1);
  //把十六进制的HSV值转换成h、s、v对应的值
  const formatHSVHexStrToHSVValue = hex => {
    const h = hexStringToNumber(hex.substr(0, 4))[0] * 256 + hexStringToNumber(hex.substr(0, 4))[1];
    const s = hexStringToNumber(hex.substr(4, 4))[0] * 256 + hexStringToNumber(hex.substr(4, 4))[1];
    const v = hexStringToNumber(hex.substr(8, 4))[0] * 256 + hexStringToNumber(hex.substr(8, 4))[1];

    return { h, s, v }; //360 1000 1000
  };
  const [colorDataHex] = useDpState(dpCodes.colourCode);
  const [hsvValue, setHsvValue] = useState({ h: 360, s: 1000, v: 1000 }); //360  1000 1000
  const [rgbBrightnessValue, setRgbBrightnessValue] = useState(1000); //亮度 0-1000

  useEffect(() => {
    if (colorDataHex !== undefined) {
      const hsv = formatHSVHexStrToHSVValue(colorDataHex);
      if (hsv.h === 18 && hsv.s === 956) {
        //暖白
        setHsvValue({ h: 18, s: 455, v: hsv.v });
      } else {
        setHsvValue(hsv);
      }
      setRgbBrightnessValue(hsv.v);
    }
  }, [colorDataHex]);

  useEffect(() => {
    if (isGroup) {
      const groupColorHEX =
        groupDPs[24] === undefined || groupDPs[24] == '0' ? '016803e803e8' : groupDPs[24];

      const hsv = formatHSVHexStrToHSVValue(groupColorHEX);
      if (hsv.h === 18 && hsv.s === 956) {
        //暖白
        setHsvValue({ h: 18, s: 455, v: hsv.v });
      } else {
        setHsvValue(hsv);
      }
      setRgbBrightnessValue(hsv.v);

      publishColorDPs(hsv.h, hsv.s, hsv.v);
    }
  }, []);

  const onTouchEnd = evt => {
    setActiveFavoriteColorIndex(-1);

    setHsvValue({ h: evt.h, s: evt.s, v: rgbBrightnessValue });
    publishColorDPs(evt.h, evt.s, rgbBrightnessValue);
  };
  //选中预设的颜色
  const handleSetActiveColor = index => () => {
    setActiveFavoriteColorIndex(index);

    const activeColor = favoriteColorList[index];
    setHsvValue(activeColor);
    if (index === 1) {
      publishColorDPs(18, 956, rgbBrightnessValue);
    } else {
      publishColorDPs(activeColor.h, activeColor.s, rgbBrightnessValue);
    }
  };
  const formatHSVValueToColorString = hsv => {
    const [r, g, b] = hsv2rgb(hsv.h, hsv.s / 10, 100);
    return `rgb(${r}, ${g}, ${b})`;
  };

  //亮度调节
  const handleSetRgbBrightnessValue = e => {
    setRgbBrightnessValue(e.value);

    if (activeFavoriteColorIndex === 1) {
      publishColorDPs(18, 956, e.value);
    } else {
      publishColorDPs(hsvValue.h, hsvValue.s, e.value);
    }
  };

  //发布功能点
  const publishColorDPs = (h, s, v) => {
    //下发亮度时，使用选中颜色的H和S，用亮度条的数值代替选中颜色的V
    const hsvStr =
      toFixed(Math.ceil(h).toString(16), 4) +
      toFixed(Math.ceil(s).toString(16), 4) +
      toFixed(Math.ceil(v).toString(16), 4);
    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { '24': hsvStr },
        success(params) {
          store.dispatch(actions.common.updateGroupDPs({ 24: hsvStr }));
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.colourCode]: hsvStr,
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
  return (
    <View className="c-width-full dimmer-wrapper">
      <View className="favorite-color-list">{renderFavoriteColor()}</View>
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

      <View className="lamp-slider-wrap">
        <View>
          <Text>{Strings.getLang('scene_brightness')}</Text>
        </View>
        <Slider
          value={rgbBrightnessValue}
          activeColor={`linear-gradient(to right, ${formatHSVValueToColorString(hsvValue)}, white)`}
          backgroundColor="#fff"
          min={10}
          max={1000}
          onChange={handleSetRgbBrightnessValue}
        ></Slider>
      </View>
    </View>
  );
};

export default DimmerView;
