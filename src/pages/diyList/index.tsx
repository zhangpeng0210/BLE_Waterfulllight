import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Text, Slider } from '@ray-js/components';
import { setNavigationBarTitle } from '@ray-js/api';
import { TYSdk } from '@ray-js/ray-panel-core';
import './diyList.module.less';
import deleteIcon from '../res/button_delete.png';
import editIcon from '../res/button_edit.png';
import nodataIcon from '../res/common_nodata.png';
import addIcon from '../res/icon-add.png';
import { showToast, navigateTo, showModal, navigateBack } from '@ray-js/api';
import { utils } from '@ray-js/panel-sdk';
import { usePageEvent } from '@ray-js/ray';
import { dpUtils } from '@/redux/index';
import dpCodes from '@/config/dpCodes';
import Strings from '@/i18n';
import { hooks } from '@ray-js/panel-sdk';
import { getCurrentPages } from '@ray-js/api';
import { TyProgressBar } from '@ray-js/components-ty';
import { ConfigsForPId } from '../../config/pId';
import DiySmear from '../../components/diySmear';
import { winWidth } from '@ray-js/ray-panel-utils/lib/ratio';

const { toFixed, intToHighLow } = utils;
const { useDpState } = hooks;

const { parseJSON } = utils;
let timer: any;
let isNeedPush: boolean = false; //是否需要跳转
let isSendPoint: boolean = false; //是否是发点
let isCancelSend: boolean = false; //是否取消发送点

const DIYListView = () => {
  const [DIYList, setDIYList] = useState([]);
  const [currentKey, setCurrentKey] = useState('');
  const [DIYListKeys, setDIYListKeys] = useState([]);
  //由于diy的功能点没有上报，不知道点的实际发送情况，当本地执行完发送点的命令后发送一个设备亮度的命令并设置一个是否是发点的参数isSendPoint，当收到亮度的上报后判断isSendPoint = true时说明设备已经完成了收点
  const [deviceBright, setDeviceBright] = useDpState(dpCodes.sceneBright);
  //亮度的校验码 +或者-
  const [checkCode, setCheckCode] = useState(-1);
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [workMode] = useDpState(dpCodes.workMode);
  const lightAmount =
    ConfigsForPId.getCanvasParameter().list * ConfigsForPId.getCanvasParameter().row;
  const {
    list,
    row,
    dynamicAnimationTypeList,
    staticAnimationTypeList,
  } = ConfigsForPId.getCanvasParameter();
  const [isShowDetail, setIsShowDetail] = useState(false);

  usePageEvent('onReady', () => {
    ty.hideLoading();
    setTimeout(() => {
      setIsShowDetail(true);
    }, 100);
  });

  usePageEvent('onLoad', () => {
    ty.showLoading({ title: 'loading...' });
    ty.hideMenuButton();
    getDIYList();
  });

  // onShow 生命周期
  usePageEvent('onShow', () => {
    const pages = getCurrentPages();
    const currPages = pages[pages.length - 1]; //当前页面
    const selectedKey = currPages.data.selectedKey;
    const isSave = currPages.data.isSave;
    if (selectedKey === undefined && isSave === undefined) {
      setCurrentKey('');
    } else {
      setCurrentKey(selectedKey);
    }
    getDIYList();
  });

  usePageEvent('onHide', () => {
    clearInterval(timer);
  });

  useEffect(() => {
    if (isSendPoint) {
      setShowProgress(false);
      isSendPoint = false;
      setProgressValue(0);
      if (isNeedPush) {
        isNeedPush = false;
        enterToEditSmearView(currentKey);
      }
    }
  }, [deviceBright]);

  useEffect(() => {
    // 清除定时器
    clearInterval(timer);

    if (DIYList.length > 0) {
      timer = setInterval(() => {
        // timerUpdate();
      }, 300);
    }

    if (DIYList.length > 0) {
      //所有文本的keys
      const allKeys = DIYList.map(item => {
        return item.key;
      });
      setDIYListKeys(allKeys);
    } else {
      setDIYListKeys([]);
    }
  }, [DIYList]);

  useEffect(() => {
    if (DIYListKeys.length > 0) {
      ty.setStorage({
        key: `DIYList_${TYSdk.devInfo.devId}`,
        data: JSON.stringify(DIYListKeys),
      });
    } else {
      ty.removeStorage({ key: `DIYList_${TYSdk.devInfo.devId}` });
    }
  }, [DIYListKeys]);

  useEffect(() => {
    let pages = getCurrentPages();
    let currentPages = pages[pages.length - 1]; //当前页面
    currentPages.setData({
      selectedKey: currentKey,
    });
  }, [currentKey]);

  useEffect(() => {
    return () => {
      // 清除定时器
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (workMode != 'scene') {
      ty.navigateBack({ delta: 10 });
    }
  }, [workMode]);

  setNavigationBarTitle({
    title: TYSdk.devInfo.name,
  });

  //获取DIY列表
  const getDIYList = () => {
    //获取allKey数组
    let count = 0;
    ty.getStorage({
      key: `DIYList_${TYSdk.devInfo.devId}`,
      success(params) {
        let array = [];
        const tempArray = (parseJSON(params.data) as unknown) as Array<string>;

        if (tempArray != null) {
          tempArray.map((key, index) => {
            ty.getStorage({
              key: key,
              success(params) {
                const diyData = (parseJSON(params.data) as unknown) as object;
                array[index] = diyData;
                array[index].currentThumbImageIndex = 0;
                count += 1;
                if (count === tempArray.length) {
                  setDIYList([...array]);
                }
              },
            });
          });
        }
      },
    });
  };

  //生成唯一key
  function generateRandom() {
    return Math.random()
      .toString(16)
      .slice(2);
  }

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
    updateSceneBrightnessBT(tempBright);
  };

  //添加按钮点击事件
  const addButtonClicked = () => {
    if (DIYList.length >= 6) {
      showToast({
        title: Strings.formatValue('diy_count_max', 6),
        icon: 'none',
        mask: true,
      });
      return;
    }
    //新增
    exchangeDIYStatusBT(3, null, () => {
      navigateTo({
        url: `/pages/diyList/smear/index?brightness=${deviceBright}&key=${generateRandom()}`,
      });
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
              let tempDIYList = [...DIYList];
              tempDIYList.splice(index, 1);
              setDIYList(tempDIYList);
            },
          });
        }
      },
    });
  };

  //定时器 修改动态缩略图应该显示第几张
  const timerUpdate = () => {
    let tempDiyList = [];
    DIYList.map((item, index) => {
      if (item.isDynamic) {
        if (item.currentThumbImageIndex < item.dynamicData.length - 1) {
          item.currentThumbImageIndex += 1;
        } else {
          item.currentThumbImageIndex = 0;
        }
      }
      tempDiyList.push(item);
    });
    setDIYList([...tempDiyList]);
  };

  //进入到编辑页面
  const enterToEditSmearView = key => {
    setTimeout(() => {
      navigateTo({
        url: `/pages/diyList/smear/index?brightness=${deviceBright}&key=${key}`,
      });
    }, 100);
  };

  //处理复制图层时的取消事件
  const handleCancelEvent = () => {
    if (progressValue < 90) {
      //90%之后不允许取消
      isCancelSend = true;

      setShowProgress(false);
      setTimeout(() => {
        setProgressValue(0);
      }, 500);

      isSendPoint = false;

      setTimeout(() => {
        //清理屏幕
        clearScreenDP(508);
        //清除选中状态
        setCurrentKey(null);
      }, 500);
    }
  };

  //编辑按钮点击事件
  const editItemButtonClicked = item => {
    if (item.key == currentKey) {
      //直接进入
      enterToEditSmearView(item.key);

      return;
    }
    isNeedPush = true;
    isSendPoint = true;
    isCancelSend = false;

    setCurrentKey(item.key);
    setShowProgress(true);
    if (item.isDynamic) {
      //新增
      exchangeDIYStatusBT(3, item, () => {
        //编辑动态多图
        editDynamicThumbData(0, item, () => {
          //展示动态
          exchangeDIYStatusBT(2, item, () => {
            //给设备发送亮度，收到设备上报后 说明设备收完了点数据
            sendBrightToDevice();
          });
        });
      });
    } else {
      //新增静态
      exchangeDIYStatusBT(3, item, () => {});
      //发送点
      let bytes =
        'aada' + //固定 开头和命令
        toFixed((91).toString(16), 2) + //长度  50 * 3
        '00'; //第几张
      sendPointToDeviceBT(bytes, 0, item.piexlData, 0, lightAmount, () => {
        //点发完了，该保存了
        setTimeout(() => {
          exchangeDIYStatusBT(4, item, () => {
            //给设备发送亮度，收到设备上报后 说明设备收完了点数据
            sendBrightToDevice();
          });
        }, 300);
      });
    }
  };

  //选中item事件
  const didselectedItemEvent = item => {
    if (item.key == currentKey) {
      return;
    }
    isNeedPush = false;
    isSendPoint = true;
    isCancelSend = false;
    setShowProgress(true);
    //设置选中
    setCurrentKey(item.key);

    if (item.isDynamic) {
      //新增静态
      exchangeDIYStatusBT(3, item, () => {
        //编辑动态多图
        editDynamicThumbData(0, item, () => {
          //展示动态
          exchangeDIYStatusBT(2, item, () => {
            //给设备发送亮度，收到设备上报后 说明设备收完了点数据
            sendBrightToDevice();
          });
        });
      });
    } else {
      //新增静态
      exchangeDIYStatusBT(3, item, () => {
        //发送点
        let bytes =
          'aada' + //固定 开头和命令
          toFixed((91).toString(16), 2) + //长度  50 * 3
          '00'; //第几张
        sendPointToDeviceBT(bytes, 0, item.piexlData, 0, lightAmount, () => {
          //点发完了，该保存了
          setTimeout(() => {
            exchangeDIYStatusBT(4, item, () => {
              //给设备发送亮度，收到设备上报后 说明设备收完了点数据
              sendBrightToDevice();
            });
          }, 300);
        });
      });
    }
  };

  //动态时下发每帧数据
  const editDynamicThumbData = (thumbDataIndex, item, successCallback) => {
    if (isCancelSend) {
      return;
    }

    const currentArray = item.dynamicData[thumbDataIndex].box;
    //新增一帧
    eidtThumbImageDataBT(thumbDataIndex + 1, 0);
    //发送当前帧点
    let bytes =
      'aada' + //固定 开头和命令
      toFixed((91).toString(16), 2) + //长度  50 * 3
      toFixed(thumbDataIndex.toString(16), 2); //第几张

    sendPointToDeviceBT(
      bytes,
      thumbDataIndex,
      currentArray,
      0,
      item.dynamicData.length * lightAmount,
      () => {
        setTimeout(() => {
          //保存当前帧
          eidtThumbImageDataBT(thumbDataIndex + 1, 2);
          setTimeout(() => {
            if (thumbDataIndex < item.dynamicData.length - 1) {
              //新增下一帧
              editDynamicThumbData(thumbDataIndex + 1, item, successCallback);
            } else {
              successCallback();
            }
          }, 300);
        }, 300);
      }
    );
  };

  //发布功能点
  //切换状态  0、编辑 1、展示静态 2、展示动态 3、新增DIY静态 4、保存静态 5、新建动态
  //                模式//亮度//速度 //状态
  //[0xaa,0xd0,0x04,0x01,0x02, 0x03,0x04,0xbb]
  const exchangeDIYStatusBT = (status, item, successCallback) => {
    const directions = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A'];
    const animateStr = item === null ? '05' : directions[item.direction];
    const speed = item === null ? '100' : item.speed;
    let diyStr =
      'aad004' +
      animateStr +
      toFixed(Number(deviceBright).toString(16), 2) +
      toFixed(speed.toString(16), 2) +
      toFixed(status.toString(16), 2) +
      'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: diyStr,
    });
    successCallback();

    if (status === 2) {
      setTimeout(() => {
        let dynamicAnimateStr = '';
        const directions = ['01', '00'];
        const animateStr = item === null ? '05' : directions[item.direction];
        updateDynamicAnimationTypeDP(animateStr);
      }, 50);
    }
  };

  //展示动态后，添加动态的动画效果命令
  const updateDynamicAnimationTypeDP = animateStr => {
    let diyStr = 'aadc01' + animateStr + 'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: diyStr,
    });
  };

  //编辑动态多图时，新增、删减、保存某一张图下发命令（加减号 2张图之间切换）
  //number 序号
  //opreation 0、新增 1、编辑 2、保存 3、删除
  const eidtThumbImageDataBT = (number, opreation) => {
    let thumbDataStr =
      'aad702' + toFixed(number.toString(16), 2) + toFixed(opreation.toString(16), 2) + 'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: thumbDataStr,
    });
  };

  //清理屏幕
  const clearScreenDP = hue => {
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

  //发送点数据
  const sendPointToDeviceBT = (
    bytesStr,
    thumbDataIndex,
    piexlData,
    number,
    allPixelCount,
    successBlock
  ) => {
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
      //满35个 发点
      sendPointStr = sendPointStr + 'bb';
      setTimeout(() => {
        dpUtils.putDpData({
          [dpCodes.DIY]: sendPointStr,
        });
        setProgressValue(
          Math.floor(((thumbDataIndex * lightAmount + number) / allPixelCount) * 100)
        );

        if (number == piexlData.length - 1) {
          successBlock();
        } else {
          let bytes =
            'aada' + //固定 开头和命令
            toFixed((91).toString(16), 2) + //长度  50 * 3
            toFixed(thumbDataIndex.toString(16), 2); //第几张
          sendPointToDeviceBT(
            bytes,
            thumbDataIndex,
            piexlData,
            number + 1,
            allPixelCount,
            successBlock
          );
        }
      }, 300);
    } else if (number === piexlData.length - 1) {
      //最后一个
      sendPointStr = sendPointStr + 'bb';
      setTimeout(() => {
        dpUtils.putDpData({
          [dpCodes.DIY]: sendPointStr,
        });
        setProgressValue(
          Math.floor(((thumbDataIndex * lightAmount + number) / allPixelCount) * 100)
        );

        successBlock();
      }, 300);
    } else {
      sendPointToDeviceBT(
        sendPointStr,
        thumbDataIndex,
        piexlData,
        number + 1,
        allPixelCount,
        successBlock
      );
    }
  };

  //修改场景亮度
  const updateSceneBrightnessBT = brightness => {
    dpUtils.putDpData({
      [dpCodes.sceneBright]: brightness,
    });
  };

  //渲染空数据
  const renderNodataView = () => {
    if (DIYList.length === 0) {
      return (
        <View className="diyList-nodata-wrapper" style={{ height: '500rpx' }}>
          <Image className="nodataIcon" src={nodataIcon}></Image>
          <Text style={{ textAlign: 'center' }}>{Strings.getLang('diyList_noData_remind')}</Text>
          <View className="addButton-wrapper" onClick={addButtonClicked}>
            <Text>{Strings.getLang('diyList_button_create')}</Text>
          </View>
        </View>
      );
    } else {
      return null;
    }
  };

  //渲染item里边的canvas
  const renderCanvasForItem = (item, index) => {
    const itemW = (winWidth - 20 - 10) / 2;
    const isHave = item.row != undefined;
    const piexlW =
      (itemW - 10 - 6) / (isHave ? Math.max(item.row, item.list) : Math.max(row, list));

    return (
      <View className="c-flex-center diyThumbImage-wrapper">
        <DiySmear
          pixelData={DIYList[index].staticFillStyles}
          dynamicData={DIYList[index].dynamicFillStyles}
          width={item.list == undefined ? piexlW * list : piexlW * item.list}
          height={item.row == undefined ? piexlW * row : piexlW * item.row}
          pixelSize={piexlW}
          elementWidth={`${itemW - 10}px`}
          elementHeight={`${itemW - 10}px`}
          showType={0}
          elementPadding={'3px'}
          pixelColor={'rgb(67,68,71)'}
          canvasId={`thumb_${index}`}
          isDynamic={DIYList[index].isDynamic}
          interval={600}
          isCurrentSwiperItem={true}
          selectedRGBColor={'rgb(67,68,71)'}
          animationType={
            DIYList[index].isDynamic
              ? dynamicAnimationTypeList[DIYList[index].direction].animationType
              : staticAnimationTypeList[DIYList[index].direction].animationType
          }
          isPause={false}
        ></DiySmear>
      </View>
    );
  };

  //渲染单个item
  const renderItem = (item, index) => {
    if (!item) {
      return null;
    } else {
      const itemW = (winWidth - 20 - 10) / 2;
      return (
        <View
          className="diyList-home-item"
          style={{
            height: `${itemW + 40}px`,
            width: `${itemW}px`,
            borderWidth: '2px',
            borderStyle: currentKey == item.key ? 'solid' : 'none',
            borderColor: 'rgb(55, 147, 255)',
          }}
          onClick={event => {
            didselectedItemEvent(item);
          }}
          key={item.key}
        >
          <View className="diyList-item-opration-wrapper">
            <View
              className="opration-wrapper"
              onClick={event => {
                event.origin.stopPropagation();
                deleteItemButtonClicked(item, index);
              }}
            >
              <Image className="opration-delete-wrapper" mode="aspectFit" src={deleteIcon}></Image>
            </View>
            <View
              className="opration-wrapper"
              onClick={event => {
                event.origin.stopPropagation();
                editItemButtonClicked(item);
              }}
            >
              <Image className="opration-delete-wrapper" mode="aspectFit" src={editIcon}></Image>
            </View>
          </View>
          {isShowDetail ? renderCanvasForItem(item, index) : null}
        </View>
      );
    }
  };

  //渲染进度条
  const renderProgressView = () => {
    return (
      <View className="progress-mask-wrap">
        <View className="progress-content-wrap" style={{ background: '#2d2d38' }}>
          <View className="progressValue-wrap" style={{ color: '#e6e6e6' }}>
            <Text>{Strings.getLang('diy_upload')}</Text>
            <Text>{progressValue}%</Text>
          </View>
          <TyProgressBar percent={progressValue} height="4px" />
          <View
            className="progress-cancel-wrap"
            onClick={() => {
              handleCancelEvent();
            }}
            style={{ color: '#e6e6e6' }}
          >
            <Text style={{ lineHeight: '40px', fontSize: '26rpx' }}>
              {Strings.getLang('cancel')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="c-width-full diyList-home-wrapper">
      <View className="slider-wrapper">
        <Slider
          value={Number(deviceBright)}
          max={100}
          min={20}
          step={1}
          backgroundColor="#fff"
          style={{ height: '80rpx' }}
          onChange={val => {
            setDeviceBright(val.value); //下发亮度
            updateSceneBrightnessBT(val.value);
          }}
        ></Slider>
      </View>
      <View className="diyList-home-itemBg-wrapper">
        {DIYList.map(renderItem)}
        {renderNodataView()}
        {DIYList && DIYList.length > 0 && (
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
      {showProgress ? renderProgressView() : null}
    </View>
  );
};

export default DIYListView;
