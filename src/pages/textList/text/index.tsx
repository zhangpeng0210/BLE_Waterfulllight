import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Slider, Image, Text, Switch, ScrollView, PageContainer } from '@ray-js/components';
import TextPixel from '../../../components/textPixel';
import ColorSlider from '../../../components/colorSlider';
import { viewWidth, winHeight, topBarHeight } from '@ray-js/ray-panel-utils/lib/ratio';
import './text.module.less';
import Strings from '@/i18n';
import * as imageSrcType from '../../diyList/smear/module';
import InputView from './inputTextView/index';
import { utils } from '@ray-js/panel-sdk';
import Gesture from '@ray-js/gesture';
import { TYSdk } from '@ray-js/ray-panel-core';
import { usePageEvent } from '@ray-js/ray';
import { dpUtils } from '@/redux/index';
import dpCodes from '@/config/dpCodes';
import { setNavigationBarTitle, getCurrentPages } from '@ray-js/api';
import { hooks } from '@ray-js/panel-sdk';
const { useDpState } = hooks;

const { parseJSON } = utils;

const row = 20; //16行
const piexlW = 4;

var currentGroupIndex = 0;
var textEidtProp;
const TextView = () => {
  ty.hideMenuButton();

  setNavigationBarTitle({
    title: TYSdk.devInfo.name,
  });

  const { intToHighLow, toFixed, rgb2hsv, hsv2rgb } = utils;
  const list = (viewWidth - 40) / piexlW; //列
  //动画选择
  const [animationIndex, setAnimationIndex] = useState(5);
  const [speed, setSpeed] = useState(20);
  const [isPause, setIsPause] = useState(false);
  const [isTextColor, setIsTextColor] = useState(true);
  const [textColorH, setTextColorH] = useState(0); //字体颜色hue 0-360

  const [isBgColor, setIsBgColor] = useState(false);
  const [bgColorH, setBgColorH] = useState(0); //背景颜色hue 0-360

  //是否展开文字输入
  const [isShowInput, setIsShowInput] = useState(false);
  const [isEditGradient, setIsEditGradient] = useState(false);
  const [showText, setShowText] = useState('');
  const [gradientColors, setGradientColors] = useState([
    [60, 0, 300],
    [300, 240, 180],
    [60, 120, 180],
  ]); //[[第一个选项的三个色hue],[第二个选项的三个色hue],[[第三个选项的三个色hue]]]
  const [colorGroupIndex, setColorGroupIndex] = useState(-1); //选中渐变色组的下标
  const [colorIndex, setColorIndex] = useState(0); //编辑时选中的第几个渐变色
  const [memberColors, setMemberColors] = useState([]);
  const [thumbImage, setThumbImage] = useState();
  const [isCapture, setIsCapture] = useState(false); //保存时复位截图
  const [workMode] = useDpState(dpCodes.workMode);

  const animationTypeMap = [
    { normal: imageSrcType.up_n, selected: imageSrcType.up_s, animationType: 'up', code: '00' },
    {
      normal: imageSrcType.down_n,
      selected: imageSrcType.down_s,
      animationType: 'down',
      code: '01',
    },
    {
      normal: imageSrcType.left_n,
      selected: imageSrcType.left_s,
      animationType: 'left',
      code: '02',
    },
    {
      normal: imageSrcType.right_n,
      selected: imageSrcType.right_s,
      animationType: 'right',
      code: '03',
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
  usePageEvent('onLoad', res => {
    textEidtProp = res;
    console.log('textEidtProp', textEidtProp);
    ty.getStorage({
      key: textEidtProp.key,
      success(params) {
        if (params.data != null) {
          //有数据
          const textData = (parseJSON(params.data) as unknown) as object;
          setAnimationIndex(textData.direction);
          setSpeed(textData.speed);
          setTextColorH(textData.textColorH);
          setIsBgColor(textData.isBgColor);
          setBgColorH(textData.bgColorH);
          setShowText(textData.text);
          setColorGroupIndex(textData.gradientIndex);
          if (textData.gradientIndex > -1 && textData.gradiends.lenght > 0) {
            let newGradients = [...gradientColors];
            newGradients[textData.gradientIndex] = textData.gradiends;
            setGradientColors(newGradients);
          }
        } else {
          //新增
          setTextParmterDP({});

          sendTextDP();
        }
      },
    });
  });

  useEffect(() => {
    updatePauseStatusDP(isPause);
  }, [isPause]);

  useEffect(() => {
    if (thumbImage !== undefined) {
      saveTextToStorage();
    }
  }, [thumbImage]);

  //hue 0-360转'rgb()'
  const hueToRGBString = (hue, a) => {
    const [r, g, b] = hsv2rgb(hue, 100, 100);
    return `rgba(${r},${g},${b},${a})`;
  };

  //根据选中渐变色拼接渐变色的字段
  const getGradientColorStr = () => {
    const colorHs = gradientColors[colorGroupIndex];
    return colorHs.map(colorH => {
      return hueToRGBString(colorH, 1);
    });
  };

  //发布功能点
  //设置文本参数
  //                方向 //亮度  //速度 //背景色
  //[0xaa,0xd3,0x04,0x01,0x02, 0x03,  0x04, 0x05,0xbb]
  const setTextParmterDP = params => {
    const animateStr =
      params.animationIndex == undefined
        ? animationTypeMap[animationIndex].code
        : animationTypeMap[params.animationIndex].code;
    const brightnessStr = toFixed(Number(textEidtProp.brightnessValue).toString(16), 2);
    const speedStr =
      params.speed == undefined
        ? toFixed(speed.toString(16), 2)
        : toFixed(params.speed.toString(16), 2);

    let bgColorStr =
      params.isBgColor != undefined
        ? toFixed(Math.ceil(params.bgColorH / 2).toString(16), 2)
        : 'fe';
    if (params.isBgColor == undefined) {
      if (isBgColor) {
        if (params.bgColorH == undefined) {
          bgColorStr = toFixed(Math.ceil(bgColorH / 2).toString(16), 2);
        } else {
          bgColorStr = toFixed(Math.ceil(params.bgColorH / 2).toString(16), 2);
        }
      } else {
        bgColorStr = 'fe';
      }
    } else {
      if (params.isBgColor) {
        if (params.bgColorH == undefined) {
          bgColorStr = toFixed(Math.ceil(bgColorH / 2).toString(16), 2);
        } else {
          bgColorStr = toFixed(Math.ceil(params.bgColorH / 2).toString(16), 2);
        }
      } else {
        bgColorStr = 'fe';
      }
    }
    let lengthStr = '05';
    let textColorStr = '';
    if (params.colorGroupIndex != undefined) {
      if (params.colorGroupIndex > -1) {
        //开了文本渐变
        lengthStr = '07';
        textColorStr =
          toFixed(Math.ceil(gradientColors[params.colorGroupIndex][0] / 2).toString(16), 2) +
          toFixed(Math.ceil(gradientColors[params.colorGroupIndex][1] / 2).toString(16), 2) +
          toFixed(Math.ceil(gradientColors[params.colorGroupIndex][2] / 2).toString(16), 2);
      } else {
        lengthStr = '05';
        textColorStr = toFixed(Math.ceil(params.textColorH / 2).toString(16), 2);
      }
    } else {
      if (colorGroupIndex > -1) {
        //开了文本渐变
        lengthStr = '07';
        textColorStr =
          toFixed(Math.ceil(gradientColors[colorGroupIndex][0] / 2).toString(16), 2) +
          toFixed(Math.ceil(gradientColors[colorGroupIndex][1] / 2).toString(16), 2) +
          toFixed(Math.ceil(gradientColors[colorGroupIndex][2] / 2).toString(16), 2);
      } else {
        lengthStr = '05';
        textColorStr = toFixed(Math.ceil(textColorH / 2).toString(16), 2);
      }
    }
    const textParmterDPStr =
      'aad3' + lengthStr + animateStr + brightnessStr + speedStr + bgColorStr + textColorStr + 'bb';
    console.log('111111111111111111', animateStr);
    dpUtils.putDpData({
      [dpCodes.DIY]: textParmterDPStr,
    });
  };

  //暂停或播放
  const updatePauseStatusDP = isPause => {
    dpUtils.putDpData({
      [dpCodes.isPause]: isPause,
    });
  };

  //发送空文文字到设备
  const sendTextDP = () => {
    var textStr = 'aadb7900000000bb';

    dpUtils.putDpData({
      [dpCodes.DIY]: textStr,
    });
  };

  //保存6个默认的文本内容到遥控器
  const saveDefaultTextDP = defaultNumber => {
    var saveDefaultStr = `aad902${toFixed(defaultNumber, 2)}02bb`;
    dpUtils.putDpData({
      [dpCodes.DIY]: saveDefaultStr,
    });
  };

  //保存当前播放的文本的key
  const saveCurrentTextKey = key => {
    let pages = getCurrentPages();
    let prePages = pages[pages.length - 2]; //上级页面
    prePages.setData({
      selectedKey: key,
    });
    ty.navigateBack();
  };

  //保存文本到缓存
  const saveTextToStorage = () => {
    var tempTextData = {
      key: textEidtProp.key,
      defaultThumbImage: thumbImage,
      speed: speed,
      direction: animationIndex,
      bgColorH: bgColorH,
      textColorH: textColorH,
      isBgColor: isBgColor,
      gradientIndex: colorGroupIndex,
      gradiends: colorGroupIndex > -1 ? gradientColors[colorGroupIndex] : [60, 0, 300],
      text: showText,
    };

    //保存单个文字效果
    ty.setStorage({
      key: textEidtProp.key,
      data: JSON.stringify(tempTextData),
      success(params) {
        ty.getStorage({
          key: `textList_${TYSdk.devInfo.devId}`,
          success(params) {
            let tempArray = (parseJSON(params.data) as unknown) as Array<string>;
            if (
              tempArray.some(key => {
                return textEidtProp.key === key;
              })
            ) {
              //编辑
              if (textEidtProp.defaultNumber !== undefined) {
                //是默认的文本
                saveDefaultTextDP(textEidtProp.defaultNumber);
              }
              ty.navigateBack();
            } else {
              tempArray.push(textEidtProp.key);
              ty.setStorage({
                key: `textList_${TYSdk.devInfo.devId}`,
                data: JSON.stringify(tempArray),
                success(params) {
                  saveCurrentTextKey(textEidtProp.key);
                },
              });
            }
          },
        });
      },
    });
  };

  //保存按钮点击事件
  const saveButtonClicked = () => {
    if (showText.length === 0) return ty.navigateBack();
    setIsCapture(true);
  };

  //渲染颜色开关蒙层 maskType = 1 字体颜色开关 maskType = 2 背景颜色开关
  const renderSwitchMaskView = maskType => {
    var className = '';
    if (maskType == 1) {
      className = 'textColor-maskView';
      if (!isTextColor) {
        return <View className={className}></View>;
      } else {
        return null;
      }
    } else {
      className = 'textBgColor-maskView';
      if (!isBgColor) {
        return <View className={className}></View>;
      } else {
        return null;
      }
    }
  };

  const renderInputView = () => {
    return (
      <InputView
        inputText={showText}
        colorH={textColorH}
        endInputEvent={(inputText, colorH) => {
          setIsShowInput(true);
          setShowText(inputText);
          setTextColorH(colorH);
        }}
      ></InputView>
    );
  };

  //渲染选中渐变色组的成员颜色
  const renderMemberColor = () => {
    return memberColors.map((hue, index) => {
      return (
        <View
          className={`color-wrapper ${index === colorIndex ? 'active' : ''}`}
          style={{ background: `${hueToRGBString(hue, 1)}` }}
          onClick={e => {
            setColorIndex(index);
          }}
          key={index}
        ></View>
      );
    });
  };
  //渲染渐变色数组
  const renderColorGroup = () => {
    return gradientColors.map((colors, index) => {
      return (
        <Gesture
          onDoubleTap={event => {
            setIsEditGradient(true);
            setColorIndex(0);
            setMemberColors(colors);

            currentGroupIndex = index;
          }}
          onSingleTap={event => {
            setColorGroupIndex(index);
            setGradientColors([...gradientColors]);
            setIsPause(false);

            setTextParmterDP({ colorGroupIndex: index, gradients: [...gradientColors] });
          }}
          key={index}
        >
          <View
            className={`gradient-wrapper ${index === colorGroupIndex ? 'active' : ''}`}
            style={{
              width: ((viewWidth - 80) / 3) * 2,
              background: `linear-gradient(to right, ${hueToRGBString(
                colors[0],
                1
              )}, ${hueToRGBString(colors[1], 1)},${hueToRGBString(colors[2], 1)})`,
            }}
          ></View>
        </Gesture>
      );
    });
  };

  //渲染编辑渐变色的视图
  const renderEditGradientView = () => {
    return (
      <View className="editGradient-mask-wrapper">
        <View className="editGradient-wrapper">
          <View className="rowItem-wrapper">
            <Text>{Strings.getLang('text_editGradientColors')}</Text>
          </View>
          <View className="rowItem-wrapper">{renderMemberColor()}</View>
          <View className="rowItem-wrapper colorSlider-wrapper">
            <ColorSlider
              value={(memberColors[colorIndex] / 360) * 100}
              bindchange={evt => {
                const hue = evt.detail.hue;
                let tempArray = [...memberColors];
                tempArray[colorIndex] = hue;
                setMemberColors([...tempArray]);
              }}
            ></ColorSlider>
          </View>
          <View className="rowItem-wrapper">
            <View
              className="button-wrapper cancel-wrapper"
              onClick={() => {
                setIsEditGradient(false);
              }}
            >
              {Strings.getLang('cancel')}
            </View>
            <View
              className="button-wrapper save-wrapper"
              onClick={() => {
                setIsEditGradient(false);
                let tempArray = [...gradientColors];
                tempArray[currentGroupIndex] = memberColors;
                setGradientColors([...tempArray]);
                if (currentGroupIndex == colorGroupIndex) {
                  setTextParmterDP({
                    colorGroupIndex: colorGroupIndex,
                    gradients: [...gradientColors],
                  });
                }
              }}
            >
              {Strings.getLang('save')}
            </View>
          </View>
        </View>
      </View>
    );
  };

  //渲染方向视图
  const renderAnimationView = () => {
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
                  setIsPause(false);
                  // updatePauseStatus(false);
                  setTimeout(() => {
                    setTextParmterDP({ animationIndex: index });
                  }, 50);
                  //展示静态
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
    <View>
      <ScrollView className="c-width-full" scrollY>
        <View className="diy-bg-wrapper">
          <TextPixel
            width={piexlW * list}
            height={piexlW * row}
            pixelSize={piexlW}
            showType={0}
            canvasId={'showTextPixel'}
            textColor={hueToRGBString(textColorH, 1)}
            bgColor={isBgColor ? hueToRGBString(bgColorH, 0.4) : 'rgb(28,30,33)'}
            gradient={colorGroupIndex > -1 ? getGradientColorStr() : []}
            animationType={animationTypeMap[animationIndex].animationType}
            interval={(100 - speed) * 5 + 100}
            isPause={isPause}
            inputText={showText}
            bindtouchCanvasEvent={() => {
              setIsShowInput(true);
            }}
            bindgetThumbImage={result => {
              setThumbImage(result.detail);
            }}
            isCapture={isCapture}
          ></TextPixel>
        </View>
        <View className="textColor-wrapper">
          <View className="item-wrapper">
            <Text> {Strings.getLang('text_eidt_textColor')}</Text>
            {/* <Switch
              checked={isTextColor}
              onChange={e => {
                setIsTextColor(e.value);
              }}
            ></Switch> */}
          </View>

          <ColorSlider
            bindchange={evt => {
              setTextColorH(Math.ceil(evt.detail.hue));
              setColorGroupIndex(-1);
              setIsPause(false);
              setTextParmterDP({ colorGroupIndex: -1, textColorH: Math.ceil(evt.detail.hue) });
            }}
            value={(textColorH / 360) * 100}
          ></ColorSlider>
          <View className="item-wrapper">{renderColorGroup()}</View>
          {renderSwitchMaskView(1)}
        </View>
        <View className="textColor-wrapper">
          <View className="item-wrapper">
            <Text>{Strings.getLang('text_edit_bgColor')}</Text>
            <Switch
              checked={isBgColor}
              onChange={e => {
                setIsBgColor(e.value);

                setTextParmterDP({ isBgColor: e.value });
              }}
            ></Switch>
          </View>
          <ColorSlider
            bindchange={evt => {
              setBgColorH(Math.ceil(evt.detail.hue));
              setIsPause(false);

              setTextParmterDP({ bgColorH: Math.ceil(evt.detail.hue) });
            }}
            value={(bgColorH / 360) * 100}
          ></ColorSlider>
          {renderSwitchMaskView(2)}
        </View>
        {renderAnimationView()}
        <View className="speed-wrapper">
          <View>
            <Text>{Strings.getLang('scene_speed')}</Text>
          </View>

          <View className="speedSelector-playOrPause-wrapper">
            <Slider
              value={speed}
              max={100}
              min={1}
              step={1}
              backgroundColor="#fff"
              onChange={val => {
                setSpeed(val.value);
                setIsPause(false);
                setTextParmterDP({ speed: val.value });
              }}
              style={{ height: '60rpx' }}
            ></Slider>
            <View
              className="pause-wrapper"
              onClick={() => {
                setIsPause(!isPause);
              }}
            >
              <Image
                className="playIcon"
                src={isPause ? imageSrcType.button_play : imageSrcType.button_pause}
                mode="aspectFit"
              ></Image>
            </View>
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
      </ScrollView>
      <PageContainer
        show={isShowInput}
        position="bottom"
        overlay={true}
        zIndex={999}
        overlayStyle={{
          background: `linear-gradient(to bottom,${hueToRGBString(textColorH, 1)} , #212121 ${(1 -
            220 / (winHeight - topBarHeight)) *
            100}%)`,
          filter: 'blur(20rpx)',
        }}
        onBeforeEnter={() => {
          setTextParmterDP({ animationIndex: 5 });
        }}
        onAfterLeave={() => {
          if (workMode != 'scene') {
            ty.navigateBack({ delta: 10 });
          } else {
            setTextParmterDP({ animationIndex: animationIndex });
            setIsShowInput(false);
          }
        }}
        onClickOverlay={() => {
          setIsShowInput(false);
        }}
      >
        {isShowInput ? renderInputView() : null}
      </PageContainer>
      {isEditGradient ? renderEditGradientView() : null}
    </View>
  );
};

export default TextView;
