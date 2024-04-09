import React from 'react';
import { View, Image, ScrollView, Text, Progress } from '@ray-js/components';
import Strings from '@/i18n';
import { LampStyleSlider } from '@ray-js/components-ty-lamp';
import Gesture from '@ray-js/gesture';

import DiySmear from '../../../../components/diySmear';
import { viewWidth, winWidth } from '@ray-js/ray-panel-utils/lib/ratio';
import './modal.module.less';
import { ConfigsForPId } from '../../../../config/pId';

import dpCodes from '@/config/dpCodes';
import { dpUtils } from '@/redux/index';
import { utils } from '@ray-js/panel-sdk';
import * as imageSrcType from '../module';
import { hooks } from '@ray-js/panel-sdk';
import { usePageEvent } from '@ray-js/ray';

const { useDpState } = hooks;

const { intToHighLow, toFixed, hex2hsv, hsv2rgb } = utils;
type Props = {
  dynamicData: any;
  piexlData: any;
  isDynamic: boolean;
  refrshShowPiexlData: any;
  refreshThumbDataIndex: any;
  getStaticThumbImage: any;
  removeModalViewEvent: any;
  refreshDynamicIndex: any;
};
let isSendPoint: boolean = false; //是否是发点
let isCancelSend: boolean = false; //是否取消发送点

//发点定时器
let piexlTimer: any;
let sendPiexlArray = []; //需要发送的点的集合{index: color}

const SmearModalView = (props: Props) => {
  const row = ConfigsForPId.getCanvasParameter().row; //20行
  const list = ConfigsForPId.getCanvasParameter().list; //20列
  const piexlW = (winWidth - 20) / Math.max(row, list);
  const colorItemW = (375 - 40 - 7 * 15) / 8;
  const [thumbDataIndex, setThumbDataIndex] = React.useState(0);
  //动图少于4张时的布局宽度
  const [thumbImageItemW, setThumbImageItemW] = React.useState(0);
  //动图大于等于4张时，使用scrollView时item的宽度
  const [scrollViewItemW, setScrollViewItemW] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(200);
  const [piexlData, setPiexlData] = React.useState(
    props.isDynamic ? props.dynamicData[thumbDataIndex].box : props.piexlData
  );
  var dynamicArrays = props.dynamicData;
  const [dynamicDatas, setDynamicDatas] = React.useState(props.dynamicData);
  const [selectedHue, setSelectedHue] = React.useState(0); //0-360 颜色slider选中的颜色
  const [defaultColorIndex, setDefaultColorIndex] = React.useState(-1); //默认颜色下标
  const defaultColorMap = [0, 24, 60, 120, 180, 240, 300, 510]; // 0-360 510为白色
  const [opration, setOpration] = React.useState(1); //1、画笔 2、油漆桶 3、橡皮擦 4、吸色器
  const [showProgress, setShowProgress] = React.useState(false);
  const [progressValue, setProgressValue] = React.useState(0);
  //亮度的校验码 +或者-
  const [checkCode, setCheckCode] = React.useState(-1);
  const [deviceBright, setDeviceBright] = useDpState(dpCodes.sceneBright);
  usePageEvent('onHide', () => {
    clearInterval(piexlTimer);
  });

  React.useEffect(() => {
    return () => {
      // 清除定时器
      clearInterval(piexlTimer);
    };
  }, []);

  React.useMemo(() => {
    return ty.getSystemInfo({
      success: params => {
        setThumbImageItemW((params.screenWidth - 20 * 2 - 10 * 4) / 5);
        setScrollViewItemW((params.screenWidth - 20 - 20 * 2 - 10 * 4) / 5);
      },
    });
  }, []);

  React.useEffect(() => {
    if (isSendPoint) {
      isSendPoint = false;
      setProgressValue(0);
      setShowProgress(false); //移除进度条

      eidtThumbImageDataDP(dynamicArrays.length - 1 + 1, 2);
      //6、页面刷新
      setPiexlData([...dynamicArrays[dynamicArrays.length - 1].box]);
      setDynamicDatas([...dynamicArrays]);
      setThumbDataIndex(dynamicArrays.length - 1);
      setTimeout(() => {
        setScrollLeft(scrollLeft + 200);
      }, 30);

      props.refreshDynamicIndex(dynamicArrays.length - 1);
      //7、新增的这一张处于编辑状态
      setTimeout(() => {
        ty.showToast({
          title: Strings.getLang('已复制并创建新图层'),
          icon: 'none',
          duration: 1500,
        });
        eidtThumbImageDataDP(dynamicArrays.length - 1 + 1, 1);
      }, 100);
    }
  }, [deviceBright]);

  React.useEffect(() => {
    clearInterval(piexlTimer);

    piexlTimer = setInterval(() => {
      if (sendPiexlArray.length > 0) {
        const lenghtStr = 30 * 3 + 1;

        let bytes =
          'aada' + //固定 开头和命令
          toFixed(lenghtStr.toString(16), 2) + //长度
          '00'; //第几张
        const tempArray = [...sendPiexlArray];
        sendPiexlArray = [];
        publishPiexlsDP(bytes, tempArray, 0, () => {});
      }
    }, 200);
  }, []);

  //涂抹时发点,替换原来的一点一发
  const publishPiexlsDP = (bytesStr, piexlArray, index, successBlock) => {
    const { number, color } = piexlArray[index];
    const high = intToHighLow(number)[0].toString(16); //高八位
    const low = intToHighLow(number)[1].toString(16); //低八位

    let sendPointStr =
      bytesStr +
      toFixed(high, 2) + //高8位
      toFixed(low, 2); //低8位
    var hue;
    if (color === '#eee' || color === 'rgb(67,68,71)') {
      hue = 254;
    } else if (color === 'rgb(255,255,255)') {
      hue = 255;
    } else {
      let [h] = hex2hsv(rgb2hex1(color));
      hue = Math.ceil(h / 2);
    }
    sendPointStr = sendPointStr + toFixed(hue.toString(16), 2); //颜色hue
    const count = 30;
    if ((index + 1) % count === 0) {
      //满30个 发点
      sendPointStr = sendPointStr + 'bb';
      setTimeout(() => {
        dpUtils.putDpData({
          [dpCodes.DIY]: sendPointStr,
        });
        if (index == piexlArray.length - 1) {
          successBlock();
        } else {
          const lenghtStr = 30 * 3 + 1;
          let bytes =
            'aada' + //固定 开头和命令
            toFixed(lenghtStr.toString(16), 2) + //长度
            '00'; //第几张
          publishPiexlsDP(bytes, piexlArray, index + 1, successBlock);
        }
      }, 300);
    } else if (index === piexlArray.length - 1) {
      //最后一个
      sendPointStr = sendPointStr + 'bb';
      setTimeout(() => {
        dpUtils.putDpData({
          [dpCodes.DIY]: sendPointStr,
        });
        successBlock();
      }, 300);
    } else {
      publishPiexlsDP(sendPointStr, piexlArray, index + 1, successBlock);
    }
  };

  //rgb字符串转hex
  const rgb2hex1 = sRGB => {
    console.log('sRGB', sRGB);
    return sRGB.replace(/^rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)$/, function($0, $1, $2, $3) {
      return (
        '#' +
        ('0' + (+$1).toString(16)).slice(-2) +
        ('0' + (+$2).toString(16)).slice(-2) +
        ('0' + (+$3).toString(16)).slice(-2)
      );
    });
  };
  //发布单个点
  const publishOnePiexlDP = (index, color) => {
    var hue;
    if (color === '#eee' || color === 'rgb(67,68,71)') {
      hue = 254;
    } else if (color === 'rgb(255,255,255)') {
      hue = 255;
    } else {
      let [h] = hex2hsv(rgb2hex1(color));
      hue = Math.ceil(h / 2);
    }

    const piexlStr =
      'aad103' +
      toFixed(intToHighLow(index)[0].toString(16), 2) +
      toFixed(intToHighLow(index)[1].toString(16), 2) +
      toFixed(hue.toString(16), 2) +
      'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: piexlStr,
    });
  };

  //hue 0-360转'rgb()'
  const hueToRGBString = hue => {
    if (hue === 510) {
      return `rgba(${255},${255},${255})`;
    }
    if (hue === 46) {
      return `rgba(${255},${207},${139})`;
    }
    const [r, g, b] = hsv2rgb(hue, 100, 100);
    return `rgba(${r},${g},${b})`;
  };

  //下发同一颜色
  const publishSameHueDP = hue => {
    let hueHex = '';
    if (hue == 508) {
      hueHex = 'fe';
    } else if (hue == 510) {
      hueHex = 'ff';
    } else {
      hueHex = toFixed(Math.ceil(hue / 2).toString(16), 2);
    }
    const sameHueStr = 'aad601' + hueHex + 'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: sameHueStr,
    });
  };

  //处理复制图层时的取消事件
  const handleCancelEvent = () => {
    if (progressValue < 90) {
      //90%之后不允许取消
      setShowProgress(false);
      isCancelSend = true;
      setProgressValue(0);
      isSendPoint = false;

      //先删除设备新建的那一帧
      eidtThumbImageDataDP(dynamicArrays.length - 1 + 1, 3);
      //删除刚加入的本地数据
      dynamicArrays.pop();
      setTimeout(() => {
        //再把当前的变成编辑状态
        eidtThumbImageDataDP(thumbDataIndex + 1, 1);
      }, 50);
    }
  };

  //发布功能点
  //编辑动态多图时，新增、删减、保存某一张图下发命令（加减号 2张图之间切换）
  //number 序号
  //opreation 0、新增 1、编辑 2、保存 3、删除
  const eidtThumbImageDataDP = (number, opreation) => {
    let thumbDataStr =
      'aad702' + toFixed(number.toString(16), 2) + toFixed(opreation.toString(16), 2) + 'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: thumbDataStr,
    });
  };

  //发送点数据
  const sendPointToDeviceDP = (bytesStr, piexlData, number, successBlock) => {
    if (isCancelSend) {
      return;
    }
    const hue = piexlData[number];
    let sendPointStr =
      bytesStr +
      toFixed(intToHighLow(number)[0].toString(16), 2) + //高8位
      toFixed(intToHighLow(number)[1].toString(16), 2) + //低8位
      toFixed(hue.toString(16), 2); //颜色hue

    if ((number + 1) % 30 === 0) {
      //满30个 发点
      sendPointStr = sendPointStr + 'bb';
      setTimeout(() => {
        dpUtils.putDpData({
          [dpCodes.DIY]: sendPointStr,
        });
        setProgressValue(Math.floor((number / 400) * 100));

        if (number == piexlData.length - 1) {
          successBlock();
        } else {
          let bytes =
            'aada' + //固定 开头和命令
            toFixed((91).toString(16), 2) + //长度  50 * 3
            toFixed(thumbDataIndex.toString(16), 2); //第几张
          sendPointToDeviceDP(bytes, piexlData, number + 1, successBlock);
        }
      }, 300);
    } else if (number === piexlData.length - 1) {
      //最后一个
      sendPointStr = sendPointStr + 'bb';
      setTimeout(() => {
        dpUtils.putDpData({
          [dpCodes.DIY]: sendPointStr,
        });
        setProgressValue(Math.floor((number / 400) * 100));
        successBlock();
      }, 300);
    } else {
      sendPointToDeviceDP(sendPointStr, piexlData, number + 1, successBlock);
    }
  };

  //点发送完之后给设备发送一个和当前亮度值相差1的亮度，设备上报亮度值之后说明点发送完成
  const sendBrightToDevice = () => {
    let tempBright = Number(deviceBright);

    if (tempBright <= 1) {
      tempBright = tempBright + 1;
    } else if (tempBright >= 100) {
      tempBright = tempBright - 1;
    } else {
      tempBright = tempBright + checkCode;
      setCheckCode(-checkCode);
    }
    dpUtils.putDpData({
      [dpCodes.sceneBright]: tempBright,
    });
  };

  //加号点击事件
  const addViewClicked = () => {
    //先保存
    setPiexlData([...dynamicArrays[thumbDataIndex].box]);
    eidtThumbImageDataDP(thumbDataIndex + 1, 2);
    setTimeout(() => {
      let newThumbImage = {
        box: [],
        thumbImage: '',
      };
      dynamicArrays.push(newThumbImage);
      setPiexlData([...dynamicArrays[dynamicArrays.length - 1].box]);
      setDynamicDatas([...dynamicArrays]);

      setThumbDataIndex(dynamicArrays.length - 1);
      props.refreshThumbDataIndex(dynamicArrays.length - 1);

      //新增
      eidtThumbImageDataDP(dynamicArrays.length - 1 + 1, 0);
      setTimeout(() => {
        setScrollLeft(scrollLeft + 200);
      }, 30);
    }, 100);
  };

  //减号点击事件
  const cutdownViewClicked = () => {
    //先删除
    eidtThumbImageDataDP(thumbDataIndex + 1, 3);

    dynamicArrays.splice(thumbDataIndex, 1);

    setPiexlData([...dynamicArrays[dynamicArrays.length - 1].box]);
    setDynamicDatas([...dynamicArrays]);
    setThumbDataIndex(dynamicArrays.length - 1);
    props.refreshThumbDataIndex(dynamicArrays.length - 1);

    setTimeout(() => {
      //在编辑
      eidtThumbImageDataDP(dynamicArrays.length - 1 + 1, 1);
    }, 100);
  };

  //缩略图点击事件
  const thumbImageViewClicked = index => {
    if (thumbDataIndex !== index) {
      setDynamicDatas([...dynamicArrays]);
      setPiexlData([...dynamicArrays[thumbDataIndex].box]);
      //先保存
      eidtThumbImageDataDP(thumbDataIndex + 1, 2);

      setTimeout(() => {
        setPiexlData([...dynamicArrays[index].box]);
        setDynamicDatas([...dynamicArrays]);
        setThumbDataIndex(index);

        //在编辑
        eidtThumbImageDataDP(index + 1, 1);

        props.refreshThumbDataIndex(index);
      }, 100);
    }
  };

  //长按缩略图事件
  const thumbImageLongPressEvent = index => {
    if (dynamicDatas.length < 8) {
      setShowProgress(true);
      isSendPoint = true;

      const thumbData = dynamicArrays[index];
      //1、设备保存当前帧
      eidtThumbImageDataDP(thumbDataIndex + 1, 2);

      setTimeout(() => {
        //2、本地复制当前长按的这一帧
        let newThumbData = { box: thumbData.box, thumbImage: thumbData.thumbImage };
        dynamicArrays.push(newThumbData);

        //3、设备新增一帧
        eidtThumbImageDataDP(dynamicArrays.length - 1 + 1, 0);
        //4、把复制的一帧的点数据下发给设备
        const bytes =
          'aada' + //固定 开头和命令
          toFixed((91).toString(16), 2) + //长度  30 * 3 + 1
          '00'; //第几张

        const hueArray = newThumbData.box.map(item => {
          const rgbStr = item.fillStyle;
          var hue;
          if (rgbStr === '#eee' || rgbStr === 'rgb(67,68,71)') {
            hue = 254;
          } else if (rgbStr === 'rgb(255,255,255)') {
            hue = 255;
          } else {
            const [h] = hex2hsv(rgb2hex1(rgbStr));
            hue = Math.ceil(h / 2);
          }
          return hue;
        });

        sendPointToDeviceDP(bytes, hueArray, 0, () => {
          //5、点发完了，该保存了
          setTimeout(() => {
            sendBrightToDevice(); //调节亮度,执行这个命令并接收到上报之后说明点已经发完
          }, 100);
        });
      }, 100);
    }
  };

  //渲染缩略图
  const renderThumbImage = () => {
    if (dynamicDatas.length < 4) {
      return (
        <View
          className="dynamicThumbImage-wrapper"
          style={{ justifyContent: dynamicDatas.length < 3 ? 'flex-start' : 'space-evenly' }}
        >
          {dynamicDatas.map((thumbData, index) => {
            return (
              <Gesture
                onLongTap={() => {
                  thumbImageLongPressEvent(index);
                }}
                onSingleTap={() => {
                  thumbImageViewClicked(index);
                }}
                key={index}
              >
                <View
                  className="thumbImageItem"
                  style={{
                    width: thumbImageItemW * 2,
                    height: thumbImageItemW * 2,
                    borderWidth: index === thumbDataIndex ? 4 : 2,
                    borderColor:
                      index === thumbDataIndex ? 'rgba(55,147,255,0.5)' : 'rgba(76,94,115,0.5)',
                  }}
                  key={index}
                >
                  {/* <Image
                    className="opration-icon"
                    src={thumbData.thumbImage}
                    style={{ width: thumbImageItemW * 2 - 20, height: thumbImageItemW * 2 - 20 }}
                  ></Image> */}
                  <DiySmear
                    pixelData={thumbData.box}
                    width={((thumbImageItemW - 2 * 2) / Math.max(list, row)) * list}
                    height={((thumbImageItemW - 2 * 2) / Math.max(list, row)) * row}
                    pixelSize={(thumbImageItemW - 2 * 2) / Math.max(list, row)}
                    elementWidth={`${(thumbImageItemW - 5) * 2}rpx`}
                    elementHeight={`${(thumbImageItemW - 5) * 2}rpx`}
                    elementPadding={'1px'}
                    showType={0}
                    pixelColor={'rgb(67,68,71)'}
                    canvasId={`thumb_${index}`}
                    isDynamic={false} //涂抹的时候都是只传单帧过去，不存在动态一说
                  ></DiySmear>
                </View>
              </Gesture>
            );
          })}
          {dynamicDatas.length === 1 ? renderAddIcon(true) : renderAddIcon(false)}
          {dynamicDatas.length !== 1 ? renderDeleteIcon() : null}
        </View>
      );
    } else {
      return (
        <View className="dynamicThumbImage-wrapper">
          <ScrollView
            className="scroll-view-wrapper"
            scrollX
            scrollLeft={scrollLeft}
            style={{
              width:
                dynamicDatas.length === 8
                  ? (scrollViewItemW * 4 + 30 + 20) * 2
                  : (scrollViewItemW * 3 + 20 + 20) * 2,
              height: scrollViewItemW * 2 + 10,
              marginRight: 20,
            }}
          >
            {dynamicDatas.map((thumbData, index) => {
              return (
                <View
                  className="scrollview-thumbImageItem"
                  style={{
                    width: scrollViewItemW * 2,
                    height: scrollViewItemW * 2,
                    marginRight: index === dynamicArrays.length - 1 ? 0 : 20,
                    borderWidth: index === thumbDataIndex ? 4 : 2,
                    borderColor:
                      index === thumbDataIndex ? 'rgba(55,147,255,0.5)' : 'rgba(76,94,115,0.5)',
                  }}
                  key={index}
                  // id={`id${index}`}
                >
                  <Gesture
                    onLongTap={() => {
                      thumbImageLongPressEvent(index);
                    }}
                    onSingleTap={() => {
                      thumbImageViewClicked(index);
                    }}
                  >
                    <DiySmear
                      pixelData={thumbData.box}
                      width={((scrollViewItemW - 2 * 2) / Math.max(list, row)) * list}
                      height={((scrollViewItemW - 2 * 2) / Math.max(list, row)) * row}
                      pixelSize={(scrollViewItemW - 2 * 2) / Math.max(list, row)}
                      elementWidth={`${(scrollViewItemW - 5) * 2}rpx`}
                      elementHeight={`${(scrollViewItemW - 5) * 2}rpx`}
                      elementPadding={'2px'}
                      showType={0}
                      animationType={'static'}
                      pixelColor={'rgb(67,68,71)'}
                      canvasId={`thumb_${index}`}
                      isDynamic={false} //涂抹的时候都是只传单帧过去，不存在动态一说
                    ></DiySmear>
                  </Gesture>
                </View>
              );
            })}
          </ScrollView>

          {dynamicDatas.length === 8 ? null : renderAddIcon(false, true)}
          {renderDeleteIcon(true)}
        </View>
      );
    }
  };

  //渲染➕加号
  const renderAddIcon = (isLast: boolean, isScrollView: boolean = false) => {
    return (
      <View
        className="thumbImageItem"
        style={{
          width: isScrollView ? scrollViewItemW * 2 : thumbImageItemW * 2,
          height: isScrollView ? scrollViewItemW * 2 : thumbImageItemW * 2,
          marginRight: isLast ? 0 : 20,
        }}
        onClick={() => {
          addViewClicked();
        }}
      >
        <Image
          className="opration-icon"
          src={imageSrcType.button_add}
          style={{ width: scrollViewItemW * 2 - 10, height: scrollViewItemW * 2 - 10 }}
        ></Image>
      </View>
    );
  };

  //渲染➖减号
  const renderDeleteIcon = (isScrollView: boolean = false) => {
    return (
      <View
        className="thumbImageItem"
        style={{
          width: isScrollView ? scrollViewItemW * 2 : thumbImageItemW * 2,
          height: isScrollView ? scrollViewItemW * 2 : thumbImageItemW * 2,
          marginRight: 0,
        }}
        onClick={() => {
          cutdownViewClicked();
        }}
      >
        <Image
          className="opration-icon"
          src={imageSrcType.button_delete}
          style={{ width: scrollViewItemW * 2 - 10, height: scrollViewItemW * 2 - 10 }}
        ></Image>
      </View>
    );
  };

  //渲染进度条
  const renderProgressView = () => {
    return (
      <View className="progress-mask-wrap">
        <View className="progress-content-wrap">
          <View className="progressValue-wrap">
            <Text>{Strings.getLang('diy_upload')}</Text>
            <Text>{progressValue}%</Text>
          </View>
          <Progress
            percent={progressValue}
            strokeWidth={8}
            activeColor="rgb(46,143,255)"
            backgroundColor="#eee"
            borderRadius={4}
          ></Progress>
          <View
            className="progress-cancel-wrap"
            onClick={() => {
              //取消按钮点击处理
              handleCancelEvent();
            }}
          >
            <Text style={{ lineHeight: '40px' }}>{Strings.getLang('cancel')}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="c-width-full modal-wrapper">
      <View className="sureButton-wrapper">
        <Text className="tilte">DIY</Text>
        <Text
          className="tilte sureTitle"
          onClick={() => {
            props.removeModalViewEvent();
          }}
        >
          {Strings.getLang('confirm')}
        </Text>
      </View>

      <DiySmear
        pixelData={piexlData}
        width={piexlW * list}
        height={piexlW * row}
        pixelSize={piexlW}
        elementWidth={'750rpx'}
        elementHeight={'750rpx'}
        elementPadding={'10px'}
        showType={1}
        pixelColor={'rgb(67,68,71)'}
        selectedColorHue={selectedHue}
        canvasId={'smearModal'}
        isDynamic={false} //涂抹的时候都是只传单帧过去，不存在动态一说
        bindclearCavasEvent={() => {
          //清除画板
          publishSameHueDP(508);
          setPiexlData([]);
        }}
        bindoprationChanged={e => {
          setOpration(e.detail);
        }}
        bindsmearChanged={result => {
          if (props.isDynamic) {
            dynamicArrays[thumbDataIndex].box = result.detail.box;
            props.refrshShowPiexlData(dynamicArrays);
          } else {
            props.refrshShowPiexlData(result.detail.box);
          }
          if (result.detail.idx === -1) {
            //-1初始化时候回调，其余为画到的某个点的下标
          } else {
            // publishOnePiexlDP(result.detail.idx, result.detail.box[result.detail.idx].fillStyle);
            let isHave: boolean = false;
            sendPiexlArray.forEach((piexl, index) => {
              if (piexl.number == result.detail.idx) {
                isHave = true;
                sendPiexlArray[index] = {
                  number: result.detail.idx,
                  color: result.detail.box[result.detail.idx].fillStyle,
                };
                return;
              }
            });
            if (!isHave) {
              sendPiexlArray.push({
                number: result.detail.idx,
                color: result.detail.box[result.detail.idx].fillStyle,
              });
            }
          }
        }}
        bindgetThumbImage={result => {
          if (props.isDynamic) {
            //获取的图片为
            // dynamicArrays[thumbDataIndex].thumbImage = result.detail;

            setDynamicDatas([...dynamicArrays]);
          } else {
            props.getStaticThumbImage(result.detail);
          }
        }}
        bindgetEyedropperColor={e => {
          let hue = 0;
          if (e.detail === 'rgb(255,255,255)') {
            hue = 255 * 2;
          } else {
            const [h] = hex2hsv(rgb2hex1(e.detail));
            hue = Math.ceil(h);
          }
          setSelectedHue(hue);
          setDefaultColorIndex(-1);
        }}
      ></DiySmear>
      {props.isDynamic ? renderThumbImage() : null}
      <View className="colorSlider-wrapper">
        {/* <LampColorSlider
          trackStyle={{
            height: '25px',
            width: `${viewWidth - 40}px`,
          }}
          thumbStyle={{ height: '29px', background: hueToRGBString(selectedHue) }}
          value={selectedHue}
          onTouchEnd={hueValue => {
            setDefaultColorIndex(-1);

            setSelectedHue(hueValue);

            if (opration === 2) {
              publishSameHueDP(hueValue);
            }
          }}
        ></LampColorSlider> */}
        <LampStyleSlider
          trackStyle={{
            height: '50rpx',
            width: `${(375 - 40) * 2}rpx`,
            borderRadius: '20rpx',
            background: `linear-gradient(to right,${hueToRGBString(0)},${hueToRGBString(
              36
            )},${hueToRGBString(72)},${hueToRGBString(108)},${hueToRGBString(144)},${hueToRGBString(
              180
            )},${hueToRGBString(216)},${hueToRGBString(252)},${hueToRGBString(
              288
            )},${hueToRGBString(324)},${hueToRGBString(360)} 97%,#fff 97%, #fff 100%)`,
          }}
          rangeOffset={20}
          thumbStyle={{ height: '58rpx', width: '30rpx', borderRadius: '15rpx' }}
          value={selectedHue}
          min={0}
          max={370}
          onTouchEnd={hueValue => {
            setDefaultColorIndex(-1);
            if (hueValue > 360) {
              setSelectedHue(510);
            } else {
              setSelectedHue(hueValue);
            }

            if (opration === 2) {
              publishSameHueDP(hueValue);
            }
          }}
        ></LampStyleSlider>

        <View className="defaultColor-wrapper">
          {defaultColorMap.map((hue, index) => {
            return (
              <View
                className={`mode-item`}
                onClick={() => {
                  setDefaultColorIndex(index);
                  setSelectedHue(defaultColorMap[index]);
                  if (opration === 2) {
                    if (hue == 46) {
                      publishSameHueDP(253 * 2);
                    } else {
                      publishSameHueDP(hue);
                    }
                    if (hue === selectedHue) {
                      let box = [];
                      for (let i = 0; i < 400; i++) {
                        box.push({ fillStyle: hueToRGBString(hue) });
                      }
                      setPiexlData([...box]);
                    }
                  }
                }}
                key={index}
                style={{
                  background: hueToRGBString(hue),
                  width: defaultColorIndex == index ? (colorItemW + 2) * 2 : colorItemW * 2,
                  height: defaultColorIndex == index ? (colorItemW + 2) * 2 : colorItemW * 2,
                  borderWidth: '4',
                  borderColor: '#fff',
                  borderStyle: defaultColorIndex == index ? 'solid' : 'none',
                }}
              ></View>
            );
          })}
        </View>
      </View>
      {showProgress ? renderProgressView() : null}
    </View>
  );
};

export default SmearModalView;
