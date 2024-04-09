import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, Image, Slider } from '@ray-js/components';
import { hideLoading, setNavigationBarTitle, showLoading } from '@ray-js/api';
import { TYSdk } from '@ray-js/ray-panel-core';
import './textList.module.less';
import * as textSceneIcon from './module';
import deleteIcon from '../res/button_delete.png';
import editIcon from '../res/button_edit.png';
import addIcon from '../res/icon-add.png';
import { showToast, navigateTo, showModal } from '@ray-js/api';
import { utils } from '@ray-js/panel-sdk';
import { usePageEvent } from 'ray';
import { dpUtils } from '@/redux/index';
import dpCodes from '@/config/dpCodes';
import Strings from '@/i18n';
import { getCurrentPages } from '@ray-js/api';
import { hooks } from '@ray-js/panel-sdk';
const { useDpState } = hooks;

const { hsv2rgb, toFixed } = utils;

const { parseJSON } = utils;

const TextListView = () => {
  const [textList, setTextList] = useState([]);
  const [currentKey, setCurrentKey] = useState('');
  const [textListKeys, setTextListKeys] = useState([]);
  const [brightnessValue, setBrightnessValue] = useDpState(dpCodes.sceneBright);
  const [workMode] = useDpState(dpCodes.workMode);

  usePageEvent('onLoad', () => {
    ty.hideMenuButton();

    getTextList(() => {});
  });

  // onShow 生命周期
  usePageEvent('onShow', () => {
    getTextList(tempArray => {
      const pages = getCurrentPages();
      const currPages = pages[pages.length - 1]; //当前页面
      const selectedKey = currPages.data.selectedKey;
      tempArray.forEach(item => {
        if (item.key === selectedKey) {
          setTextParmterDP(item);
        }
      });
      setCurrentKey(selectedKey);
    });
  });

  useEffect(() => {
    if (textList.length > 0) {
      //所有文本的keys
      const allKeys = textList.map(item => {
        return item.key;
      });
      setTextListKeys(allKeys);

      const pages = getCurrentPages();
      const currPages = pages[pages.length - 1]; //当前页面
      const selectedKey = currPages.data.selectedKey;
      if (selectedKey == undefined || selectedKey == '') {
        setCurrentKey(textList[0].key);
        setTextParmterDP(textList[0]);
      }
    }
  }, [textList]);

  useEffect(() => {
    if (textListKeys.length > 0) {
      ty.setStorage({
        key: `textList_${TYSdk.devInfo.devId}`,
        data: JSON.stringify(textListKeys),
      });
    }
  }, [textListKeys]);

  useEffect(() => {
    let pages = getCurrentPages();
    let currentPages = pages[pages.length - 1]; //当前页面
    currentPages.setData({
      selectedKey: currentKey,
    });
  }, [currentKey]);

  setNavigationBarTitle({
    title: TYSdk.devInfo.name,
  });

  useEffect(() => {
    if (workMode != 'scene') {
      ty.navigateBack({ delta: 10 });
    }
  }, [workMode]);

  //生成唯一key
  function generateRandom() {
    return Math.random()
      .toString(16)
      .slice(2);
  }

  //hue 0-360转'rgb()'
  const hueToRGBString = (color, a) => {
    if (typeof color == 'string') {
      return color;
    }
    const [r, g, b] = hsv2rgb(color, 100, 100);
    return `rgba(${r},${g},${b},${a})`;
  };

  //获取文本列表
  const getTextList = successBlock => {
    //获取listId数组
    let count = 0;
    ty.getStorage({
      key: `textList_${TYSdk.devInfo.devId}`,
      success(params) {
        let array = [];
        const tempArray = (parseJSON(params.data) as unknown) as Array<string>;
        if (tempArray != null && tempArray.length > 0) {
          tempArray.map((key, index) => {
            ty.getStorage({
              key: key,
              success(params) {
                const textData = (parseJSON(params.data) as unknown) as object;
                array[index] = textData;
                count += 1;
                if (count === tempArray.length) {
                  setTextList([...array]);
                  successBlock(array);
                }
              },
            });
          });
        } else {
          //空数据时，增加6个默认text效果
          setupDefaultText([], 1);
        }
      },
    });
  };

  //新增6个默认的文字效果
  const setupDefaultText = (list, number) => {
    var tempTextData = {
      key: '',
      defaultThumbImage: '',
      speed: 100,
      direction: 5,
      bgColorH: 0,
      textColorH: 0,
      isBgColor: false,
      gradiends: [60, 0, 300],
      text: 'Hello Fairy',
      gradientIndex: -1,
    };

    tempTextData.key = `text_${generateRandom()}_${TYSdk.devInfo.devId}`;
    tempTextData.defaultThumbImage = textSceneIcon[`text${number}`];
    switch (number) {
      case 1:
        tempTextData.gradiends = [300, 240, 180];
        tempTextData.text = 'Hello Fairy';
        tempTextData.gradientIndex = 1;
        break;
      case 2:
        tempTextData.gradiends = [60, 120, 180];
        tempTextData.text = 'Welcome';
        tempTextData.gradientIndex = 2;
        break;
      case 3:
        tempTextData.gradiends = [60, 0, 300];
        tempTextData.text = 'Merry Christmas';
        tempTextData.gradientIndex = 0;
        break;
      case 4:
        tempTextData.gradiends = [60, 0, 300];
        tempTextData.text = 'Happy New Year';
        tempTextData.gradientIndex = 0;
        break;
      case 5:
        tempTextData.gradiends = [300, 240, 180];
        tempTextData.text = 'Good Luck';
        tempTextData.gradientIndex = 1;
        break;
      case 6:
        tempTextData.gradiends = [60, 0, 300];
        tempTextData.text = 'Happy Birthday';
        tempTextData.gradientIndex = 0;
        break;
      default:
        break;
    }
    //保存单个文字效果
    ty.setStorage({
      key: tempTextData.key,
      data: JSON.stringify(tempTextData),
      success(params) {
        let tempTextList = [...list];
        tempTextList.push(tempTextData);
        if (number < 6) {
          setupDefaultText(tempTextList, number + 1);
        } else {
          setTextList(tempTextList);
        }
      },
    });
  };

  //添加按钮点击事件
  const addButtonClicked = () => {
    if (textList.length >= 20) {
      showToast({
        title: Strings.formatValue('diy_count_max', 20),
        icon: 'none',
        mask: true,
      });
      return;
    }
    //新增
    navigateTo({
      url: `/pages/textList/text/index?key=${generateRandom()}&brightnessValue=${brightnessValue}`,
    });
  };
  //删除按钮点击事件
  const deleteItemButtonClicked = (item, index) => {
    showModal({
      title: Strings.getLang('tips_title'),
      content: Strings.getLang('tips_content'),
      showCancel: true,
      cancelText: Strings.getLang('cancel'),
      confirmText: Strings.getLang('delete'),
      success(params) {
        if (params.confirm) {
          ty.removeStorage({
            key: item.key,
            success(params) {
              let tempTextList = [...textList];
              tempTextList.splice(index, 1);
              setTextList(tempTextList);
            },
          });
        }
      },
    });
  };

  //进入到编辑页面
  const enterToEditTextView = (item, index) => {
    let url;
    if (index < 6) {
      url = `/pages/textList/text/index?key=${
        item.key
      }&brightnessValue=${brightnessValue}&defaultNumber=${index + 1}`;
    } else {
      url = `/pages/textList/text/index?key=${item.key}&brightnessValue=${brightnessValue}`;
    }
    navigateTo({
      url: url,
    });
  };

  //编辑按钮点击事件
  const editItemButtonClicked = (item, index) => {
    setCurrentKey(item.key);
    setTextParmterDP(item);
    setTimeout(() => {
      enterToEditTextView(item, index);
    }, 100);
  };

  //选中item事件
  const didselectedItemEvent = (item, index) => {
    //设置选中
    setCurrentKey(item.key);

    setTextParmterDP(item);
  };

  //发布功能点
  //设置文本参数
  //                方向 //亮度  //速度 //背景色
  //[0xaa,0xd3,0x04,0x01,0x02, 0x03,  0x04, 0x05,0xbb]
  const setTextParmterDP = item => {
    const directions = ['04', '03', '02', '01', '05', '00'];
    const animateStr = item === null ? '00' : directions[item.direction];
    const brightnessStr = item === null ? '64' : toFixed(brightnessValue.toString(16), 2);
    const speedStr = item === null ? '64' : toFixed(item.speed.toString(16), 2);
    let bgColorStr = item === null ? 'fe' : toFixed(Math.ceil(item.bgColorH / 2).toString(16), 2);
    if (item.isBgColor) {
      bgColorStr = toFixed(Math.ceil(item.bgColorH / 2).toString(16), 2);
    } else {
      bgColorStr = 'fe';
    }
    let lengthStr = '05';
    let textColorStr = '';
    if (item.gradientIndex != -1) {
      //开了文本渐变
      lengthStr = '07';
      textColorStr =
        toFixed(Math.ceil(item.gradiends[0] / 2).toString(16), 2) +
        toFixed(Math.ceil(item.gradiends[1] / 2).toString(16), 2) +
        toFixed(Math.ceil(item.gradiends[2] / 2).toString(16), 2);
    } else {
      lengthStr = '05';
      textColorStr = toFixed(Math.ceil(item.textColorH / 2).toString(16), 2);
    }
    const textParmterDPStr =
      'aad3' + lengthStr + animateStr + brightnessStr + speedStr + bgColorStr + textColorStr + 'bb';

    dpUtils.putDpData({
      [dpCodes.DIY]: textParmterDPStr,
    });
    //发送文本内容
    setTimeout(() => {
      sendTextDP(item);
    }, 300);
  };

  //发送文字到设备
  const sendTextDP = item => {
    const textArray = item.text.split('');

    var textStr = 'aadb79' + toFixed(Number(textArray.length).toString(16), 2);

    textArray.forEach((char, index) => {
      textStr = textStr + toFixed((index + 1).toString(16), 2); //
      textStr = textStr + toFixed(char.charCodeAt().toString(16), 2); //
      textStr = textStr + toFixed(Math.ceil(item.textColorH / 2).toString(16), 2); //
    });
    textStr = textStr + 'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: textStr,
    });
  };

  //修改场景亮度
  const updateSceneBrightnessDP = brightness => {
    dpUtils.putDpData({
      [dpCodes.sceneBright]: brightness,
    });
  };

  //渲染一行的item
  const renderItemRow = (number, index) => {
    const leftItem = textList[number];
    const rightItem = textList[number + 1];
    return (
      <View key={number} className="c-flex-center diyList-home-row-wrapper">
        {leftItem && renderItem(leftItem, number)}
        {rightItem && renderItem(rightItem, number + 1)}
      </View>
    );
  };

  //渲染单个item
  const renderItem = (item, index) => {
    if (!item) {
      return null;
    } else {
      const itemW = ((375 - 20 - 10) / 2) * 2;
      const imageW = itemW - 40;
      const imageScale = 245 / 80;
      const imageH = imageW / imageScale;
      const itemH = imageH + 40 + 80;

      return (
        <View
          className="textList-home-item"
          style={{
            height: itemH,
            borderWidth: '4',
            borderStyle: currentKey == item.key ? 'solid' : 'none',
            borderColor: 'rgb(55, 147, 255)',
          }}
          onClick={event => {
            didselectedItemEvent(item, index);
          }}
          key={item.key}
        >
          <View className="textList-item-opration-wrapper">
            <View
              className="opration-wrapper"
              onClick={event => {
                if (index > 5) {
                  event.origin.stopPropagation();
                  deleteItemButtonClicked(item, index);
                }
              }}
            >
              {index > 5 ? (
                <Image
                  className="opration-delete-wrapper"
                  mode="aspectFit"
                  src={deleteIcon}
                ></Image>
              ) : null}
            </View>
            <View
              className="opration-wrapper"
              onClick={event => {
                event.origin.stopPropagation();
                editItemButtonClicked(item, index);
              }}
            >
              <Image className="opration-delete-wrapper" mode="aspectFit" src={editIcon}></Image>
            </View>
          </View>
          <View className="c-flex-center textThumbImage-wrapper" style={{ height: itemH - 80 }}>
            <Image
              mode="aspectFit"
              src={item.thumbImage ? item.thumbImage : item.defaultThumbImage}
              style={{
                height: imageH,
                width: imageW,
                background: item.isBgColor
                  ? `${hueToRGBString(item.bgColorH, 0.4)}`
                  : 'rgb(28,30,33)',
                margin: '0rpx 20rpx 20rpx',
              }}
            ></Image>
          </View>
        </View>
      );
    }
  };

  return (
    <View className="c-width-full textList-home-wrapper">
      <Slider
        value={brightnessValue}
        max={100}
        min={20}
        step={1}
        backgroundColor="#fff"
        onChange={val => {
          setBrightnessValue(val.value);
          //下发亮度
          updateSceneBrightnessDP(val.value);
        }}
        style={{ height: '80rpx' }}
      ></Slider>
      <View className="textList-home-itemBg-wrapper">
        {textList.map(renderItem)}

        {textList && textList.length > 0 && (
          <View className="button-add-wrapper" onClick={addButtonClicked}>
            <Image
              src={addIcon}
              style={{
                height: '36rpx',
                width: '36rpx',
              }}
            ></Image>
          </View>
        )}
      </View>
    </View>
  );
};

export default TextListView;
