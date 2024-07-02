import React, { useState, useEffect } from 'react';
import { View, Image, Text, Slider } from '@ray-js/components';
import { setNavigationBarTitle } from '@ray-js/api';
import { TYSdk } from '@ray-js/ray-panel-core';
import './diyList.module.less';
import deleteIcon from '../res/button_delete.png';
import editIcon from '../res/button_edit.png';
import nodataIcon from '../res/common_nodata.png';
import addIcon from '../res/icon-add.png';
import {
  showToast,
  navigateTo,
  showModal,
  navigateBack,
  hideMenuButton,
  showLoading,
  hideLoading,
  authorize,
  authorizeStatus,
} from '@ray-js/api';
import { utils } from '@ray-js/panel-sdk';
import { usePageEvent, getFileSystemManager, env } from '@ray-js/ray';
import { useSelector, actions, dpUtils, store } from '@/redux/index';
import dpCodes from '@/config/dpCodes';
import Strings from '@/i18n';
import { hooks } from '@ray-js/panel-sdk';
import { TyProgressBar } from '@ray-js/components-ty';
import { ConfigsForPId } from '../../config/pId';
import { winWidth } from '@ray-js/ray-panel-utils/lib/ratio';

const { toFixed, intToHighLow } = utils;
const { useDpState } = hooks;

const { parseJSON } = utils;
let timer: any;
let isNeedPush: boolean = false; //是否需要跳转
let isSendPoint: boolean = false; //是否是发点
let isCancelSend: boolean = false; //是否取消发送点

const DIYListView = () => {
  const { devId } = TYSdk.devInfo;
  const fileRoot = env.USER_DATA_PATH;
  const filePath = `${fileRoot}/diyList_${devId}`;
  const allKeysPath = `${filePath}/allKeysPath.text`;

  const [DIYList, setDIYList] = useState([]);
  //由于diy的功能点没有上报，不知道点的实际发送情况，当本地执行完发送点的命令后发送一个设备亮度的命令并设置一个是否是发点的参数isSendPoint，当收到亮度的上报后判断isSendPoint = true时说明设备已经完成了收点
  const [deviceBright, setDeviceBright] = useDpState(dpCodes.sceneBright);
  //亮度的校验码 +或者-
  const [checkCode, setCheckCode] = useState(-1);
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [workMode] = useDpState(dpCodes.workMode);
  const lightAmount =
    ConfigsForPId.getCanvasParameter().list * ConfigsForPId.getCanvasParameter().row;
  const selectedKey = useSelector(state => {
    return state.selectedData.selectedKey;
  });

  const fileManager = React.useRef(null);

  React.useEffect(() => {
    const getMenager = async () => {
      fileManager.current = await getFileSystemManager();
    };
    getMenager();

    return () => {
      // 清除定时器
      clearInterval(timer);
    };
  }, []);

  usePageEvent('onReady', () => {
    hideLoading();
  });

  usePageEvent('onLoad', () => {
    showLoading({ title: 'loading...' });
    hideMenuButton();
    console.log('1111111111111', filePath);
    getDIYList();
  });

  // onShow 生命周期
  usePageEvent('onShow', () => {
    getDIYList();
  });

  usePageEvent('onUnload', () => {
    store.dispatch(actions.common.updateSelectedData({}));
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
        enterToEditSmearView(selectedKey);
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
  }, [DIYList]);

  useEffect(() => {
    if (workMode != 'scene') {
      navigateBack({ delta: 10 });
    }
  }, [workMode]);

  setNavigationBarTitle({
    title: TYSdk.devInfo.name,
  });

  //获取DIY列表
  const getDIYList = () => {
    if (fileManager.current == null || fileManager.current == undefined) {
      return;
    }
    //获取allKey数组
    //查询allKeysPath是否存在
    fileManager.current.access({
      path: allKeysPath,
      success() {
        //allKeysPath存在
        //读取存储key的文件
        const { data } = fileManager.current.readFileSync({ filePath: allKeysPath });
        const allkeysArray = (parseJSON(data) as unknown) as Array<string>;
        let array = [];
        let count = 0;
        allkeysArray.map((key, index) => {
          fileManager.current.readFile({
            filePath: `${filePath}/${key}.text`,
            success(result) {
              const diyData = (parseJSON(result.data) as unknown) as object;
              console.log('diyData', diyData);
              array[index] = diyData;
              array[index].currentThumbImageIndex = 0;
              count += 1;
              if (count === allkeysArray.length) {
                setDIYList([...array]);
              }
            },
          });
        });
      },
      fail(err) {
        //allKeysPath不存在
        return;
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

  //申请相册权限
  const applyWriteScope = callBack => {
    authorize({
      scope: 'scope.writePhotosAlbum',
      success() {
        //查看写入相册的权限
        console.log('申请权限成功1-1');
        queryWriteScope(callBack);
      },
      fail: err => {
        //拒绝了相册权限
        hideLoading();
        showModal({ title: '删除DIY数据需要有相册写入权限' });
      },
    });
  };

  //2、查看相册写入权限
  const queryWriteScope = callBack => {
    authorizeStatus({
      scope: 'scope.writePhotosAlbum',
      success(params) {
        //有相册写入权限
        console.log('有相册写入权限2-1');
        //3、查看文件夹是否存在
        // folderIsExist(folderPath, callBack);
        callBack();
      },
      fail(err) {
        //没有相册写入权限
        ty.hideLoading();
        showModal({ title: '删除DIY数据需要有相册写入权限' });
      },
    });
  };

  //添加按钮点击事件
  const addButtonClicked = () => {
    if (DIYList.length >= 20) {
      showToast({
        title: Strings.formatValue('diy_count_max', 20),
        icon: 'none',
        mask: true,
      });
      return;
    }
    //新增
    exchangeDIYStatusBT(3, null, () => {
      const key = generateRandom();
      store.dispatch(actions.common.updateSelectedData({ selectedKey: key }));

      navigateTo({
        url: `/pages/diyList/smear/index?brightness=${deviceBright}&key=${key}`,
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
          applyWriteScope(() => {
            fileManager.current.removeSavedFile({
              filePath: `${filePath}/${item.key}.text`,
              success(params) {
                console.log('删除成功', params);
                let tempList = [...DIYList];
                tempList.splice(index, 1);
                setDIYList(tempList);

                if (tempList.length == 0) {
                  //移除allkeys的文件
                  fileManager.current.removeSavedFile({
                    filePath: allKeysPath,
                  });
                } else {
                  //重新写入allkeys
                  const allKeys = tempList.map((item, idx) => {
                    return item.key;
                  });
                  fileManager.current.writeFile({
                    filePath: allKeysPath,
                    data: JSON.stringify(allKeys),
                  });
                }
              },
              fail(error) {
                console.log('删除失败', error);
              },
            });
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
    if (progressValue < 90 || progressValue == 99) {
      //90%之后不允许取消
      isCancelSend = true;

      setShowProgress(false);
      setTimeout(() => {
        setProgressValue(0);
      }, 500);

      isSendPoint = false;

      setTimeout(() => {
        //清理屏幕
        clearScreenDP(254);
        //清除选中状态
        store.dispatch(actions.common.updateSelectedData({}));
      }, 500);
    }
  };

  //编辑按钮点击事件
  const editItemButtonClicked = item => {
    if (item.key == selectedKey) {
      //直接进入
      enterToEditSmearView(item.key);
      return;
    }
    isNeedPush = true;
    isSendPoint = true;
    isCancelSend = false;
    store.dispatch(actions.common.updateSelectedData({ selectedKey: item.key }));

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
    if (item.key == selectedKey) {
      return;
    }
    isNeedPush = false;
    isSendPoint = true;
    isCancelSend = false;
    setShowProgress(true);
    store.dispatch(actions.common.updateSelectedData({ selectedKey: item.key }));

    if (item.isDynamic) {
      //新增动态
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
    const speed = item === null ? 100 : item.speed;
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
    if (hue == 254) {
      hueHex = 'fe';
    } else if (hue == 255) {
      hueHex = 'ff';
    } else {
      hueHex = toFixed(Math.ceil(hue).toString(16), 2);
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

  //渲染单个item
  const renderItem = (item, index) => {
    if (!item) {
      return null;
    } else {
      const itemW = winWidth - 20 - 10;
      return (
        <View
          className="diyList-home-item"
          style={{
            height: itemW + 80,
            width: itemW,
            borderWidth: 4,
            borderStyle: selectedKey == item.key ? 'solid' : 'none',
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
          <View className="c-flex-center diyThumbImage-wrapper" style={{ height: itemW }}>
            <Image
              mode="aspectFit"
              src={
                item.isDynamic
                  ? item.dynamicData[item.currentThumbImageIndex].thumbImage
                  : item.thumbImage
              }
              style={{ width: itemW - 40, height: itemW - 40, margin: 20 }}
            ></Image>
          </View>
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
                height: '100%',
                width: '100%',
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
