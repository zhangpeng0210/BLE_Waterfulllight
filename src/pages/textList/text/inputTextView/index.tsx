import { ScrollView, View, Input } from '@ray-js/components';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { viewWidth, winHeight, topBarHeight } from '@ray-js/ray-panel-utils/lib/ratio';
import TextPixel from '../../../../components/textPixel';
import './inputText.module.less';
import ColorSlider from '../../../../components/colorSlider';
import { utils } from '@ray-js/panel-sdk';
import { dpUtils } from '@/redux/index';
import dpCodes from '@/config/dpCodes';
import Strings from '@/i18n';

type Props = {
  inputText: any;
  colorH: any;
  endInputEvent: any;
};
const InputTextView = (prop: Props) => {
  const { intToHighLow, toFixed, hsv2rgb } = utils;
  const row = 16; //16行
  const piexlW = 5;
  const list = (viewWidth - 40) / piexlW; //列
  const [inputText, setInputText] = useState(prop.inputText);
  const [colorH, setColorH] = useState(prop.colorH); // 0 -360

  useEffect(() => {
    console.log('inputText', inputText);
  }, [inputText]);

  //发送文字到设备
  const sendTextDP = text => {
    const textArray = text.split('');

    var textStr = 'aadb79' + toFixed(Number(textArray.length).toString(16), 2);

    textArray.forEach((char, index) => {
      textStr = textStr + toFixed((index + 1).toString(16), 2); //
      textStr = textStr + toFixed(char.charCodeAt().toString(16), 2); //
      textStr = textStr + toFixed(Math.ceil(colorH / 2).toString(16), 2); //
    });
    textStr = textStr + 'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: textStr,
    });
  };

  //colorH转'rgb()'‘
  const colorh2rgbString = colorH => {
    const [r, g, b] = hsv2rgb(colorH, 100, 100);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <ScrollView className="pageContainer-wrapper">
      {/* <View
        className="color-bg-wrapper"
        style={{
          height: winHeight * 2 - 480 - topBarHeight * 2,
          background: `linear-gradient(to bottom,${colorh2rgbString(colorH)} , #212121)`,
          filter: 'blur(20rpx)',
        }}
        onClick={() => {
          prop.endInputEvent(inputText, colorH);
        }}
      ></View> */}
      <View
        className="diy-bg-wrapper"
        onClick={event => {
          event.origin.stopPropagation();
        }}
      >
        <TextPixel
          width={piexlW * list}
          height={piexlW * row}
          pixelSize={piexlW}
          showType={1}
          isPause={true}
          canvasId={'editTextPixel'}
          textColor={colorh2rgbString(colorH)}
          bgColor={'rgba(67,68,71,0.4)'}
          inputText={inputText}
        ></TextPixel>
      </View>

      {/* <ColorSlider
        bindchange={evt => {
          setColorH(Math.ceil(evt.detail.hue));
          prop.endInputEvent(inputText, Math.ceil(evt.detail.hue));
        }}
        value={(colorH / 360) * 100}
      ></ColorSlider> */}
      <Input
        className="input-wrapper"
        placeholder={Strings.getLang('text_input_placeholder')}
        type="text"
        maxLength={40}
        wechat-confirm-type="done"
        focus={true}
        value={inputText}
        onInput={e => {
          setInputText(e.value);

          setTimeout(() => {
            const char = e.value.replace(/[^\x00-\xff]/g, '');
            setInputText(char);
            if (char !== inputText) {
              sendTextDP(char);
              prop.endInputEvent(char, colorH);
            }
          }, 20);
        }}
        onBlur={e => {
          console.log('onBlur事件', e);
        }}
        onFocus={e => {
          console.log('onFocus事件', e);
        }}
        onConfirm={e => {
          console.log('onConfirm事件', e);
          prop.endInputEvent(inputText, colorH);
        }}
      />
    </ScrollView>
  );
};

export default InputTextView;
