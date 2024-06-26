import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Slider, Image, PageContainer, Icon } from '@ray-js/components';
import {
  usePageEvent,
  getFileSystemManager,
  env,
  authorize,
  authorizeStatus,
  showModal,
} from '@ray-js/ray';
import Strings from '@/i18n';
import { utils } from '@ray-js/panel-sdk';
const { parseJSON } = utils;
import { ConfigsForPId } from '../../../config/pId';

import DiySmear from '../../../components/diySmear';
import SmearModalView from './smearModalView/index';
import './smear.module.less';
import * as imageSrcType from './module';

import dpCodes from '@/config/dpCodes';
import { dpUtils } from '@/redux/index';
import { TYSdk } from '@ray-js/ray-panel-core';
import { hideLoading } from '@ray-js/api';
import { hooks } from '@ray-js/panel-sdk';
const { useDpState } = hooks;

const { hex2hsv, hsv2rgb, toFixed, intToHighLow } = utils;

var piexlArray = []; //page-container内部组件传回来的值，静态
var dynamicArray = []; //page-container内部组件传回来的值，动态
var props;
var thumbDataIndex = 0;

const SmearView = () => {
  const { devId } = TYSdk.devInfo;
  const fileRoot = env.USER_DATA_PATH;
  const folderPath = `${fileRoot}/diyList_${devId}`;
  const allKeysPath = `${folderPath}/allKeysPath.text`;

  const {
    row,
    list,
    dynamicAnimationTypeList,
    staticAnimationTypeList,
  } = ConfigsForPId.getCanvasParameter();

  const fileManager = React.useRef(null);

  React.useEffect(() => {
    const getMenager = async () => {
      fileManager.current = await getFileSystemManager();
    };
    getMenager().then(() => {
      const path = `${folderPath}/${props.key}.text`;
      console.log('1111111111111111', fileManager.current);

      fileManager.current.access({
        path: path,
        success() {
          //存在、是编辑
          setIsAdd(false);

          const { data } = fileManager.current.readFileSync({ filePath: path });
          const diyData = (parseJSON(data) as unknown) as any;
          if (diyData.isDynamic) {
            setIsDynamic(true);

            const thumbDataArray = diyData.dynamicData.map(thumbData => {
              thumbData.box = thumbData.box.map(hue => {
                let piexl = { fillStyle: '' };
                if (hue == 254) {
                  piexl.fillStyle = 'rgb(67,68,71)';
                } else {
                  const [r, g, b] = hsv2rgb(hue * 2, 100, 100);
                  piexl.fillStyle = `rgb(${r},${g},${b})`;
                }
                return piexl;
              });
              return thumbData;
            });
            setDynamicData(thumbDataArray);
            console.log('diyData.direction', diyData.direction);
            if (diyData.direction > 1) {
              setDynamicAnimationIndex(0);
            } else {
              setDynamicAnimationIndex(diyData.direction);
            }
            setSpeed(diyData.speed);
          } else {
            setIsDynamic(false);

            const piexlArray = diyData.piexlData.map(hue => {
              let piexl = { fillStyle: '' };
              if (hue == 254) {
                piexl.fillStyle = 'rgb(67,68,71)';
              } else {
                const [r, g, b] = hsv2rgb(hue * 2, 100, 100);
                piexl.fillStyle = `rgb(${r},${g},${b})`;
              }
              return piexl;
            });
            setPiexlData(piexlArray);
            setStaticAnimationIndex(diyData.direction);
            setSpeed(diyData.speed);
            setStaticThumbImage(diyData.thumbImage);
          }
          setIsPause(false);
        },
        fail(error) {
          //不存在
          //没数据 是新增
          setIsAdd(true);
          //展示静态
          exchangeStatus({ status: 1 });
        },
      });
    });
  }, []);

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
        showModal({ title: '保存DIY数据需要有相册写入权限' });
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
        folderIsExist(folderPath, callBack);
      },
      fail(err) {
        //没有相册写入权限
        ty.hideLoading();
        showModal({ title: '请开启”智能生活“的相册权限' });
      },
    });
  };

  //判断文件夹是否存在，如果不存在则新建
  const folderIsExist = (path, callBack) => {
    fileManager.current.access({
      path: path,
      success: () => {
        //3-1 文件夹已经存在
        console.log('~/diyList文件夹存在3-1');
        callBack();
      },
      fail: err => {
        //3-2文件夹不存在就新建
        console.log('~/diyList文件夹不存在3-2', err);

        //新建diyList的文件夹
        fileManager.current.mkdir({
          dirPath: folderPath,
          success(params) {
            //新建文件夹成功
            callBack();
          },
          fail(err) {
            hideLoading();
            showModal({ title: `创建diy列表失败，请稍后重试` });
          },
        });
      },
    });
  };

  // 写入文件 type = 1、写单个DIY的数据 2、保存keys
  const writeDataToFile = (type, jsonStr, path) => {
    fileManager.current.writeFile({
      filePath: path,
      data: jsonStr,
      success: () => {
        if (type == 1) {
          //保存单个DIY数据成功
          //读取存储key的文件
          fileManager.current.access({
            path: allKeysPath,
            success() {
              //allKeysPath存在
              //读取存储key的文件
              const { data } = fileManager.current.readFileSync({ filePath: allKeysPath });
              let allkeysArray = (parseJSON(data) as unknown) as Array<string>;

              console.log('所有key的数组为', allkeysArray);

              if (allkeysArray.includes(props.key)) {
                //包含key，是编辑
                ty.hideLoading();
                ty.navigateBack();
              } else {
                //不包含，把key加进allkeysArray并存储
                console.log('需要添加的key为', props.key);
                allkeysArray.push(props.key);
                console.log('不包含，需要存储的新的allkeys', allkeysArray);
                writeDataToFile(2, JSON.stringify(allkeysArray), allKeysPath);
              }
            },
            fail(err) {
              const newAllkeys = [props.key];
              console.log('allKeysPath不存在，新建', newAllkeys);
              writeDataToFile(2, JSON.stringify(newAllkeys), allKeysPath);
            },
          });
        } else {
          //保存所有的keys成功
          console.log('保存所有的keys成功', jsonStr);

          ty.hideLoading();

          ty.navigateBack();
        }
      },
      fail: err => {
        ty.hideLoading();
        let tipTitle = '';
        if (type == 2) {
          tipTitle = 'allkeys写入文件失败';
        } else {
          tipTitle = 'diyData写入文件失败';
        }
        console.log(err, path);
        showModal({ title: `${tipTitle}，请稍后重试` });
      },
    });
  };

  usePageEvent('onLoad', res => {
    ty.hideMenuButton();
    props = res;
    piexlArray = [];
    dynamicArray = [];
    getNavgationH;
  });
  const piexlW = (375 - 40) / Math.max(row, list);
  //静态的数据
  const [piexlData, setPiexlData] = React.useState([]);
  //动态的数据
  const [dynamicData, setDynamicData] = React.useState([]);
  //静态动画选择
  const [staticAnimationIndex, setStaticAnimationIndex] = useState(5);
  //动态动画选择
  const [dynamicAnimationIndex, setDynamicAnimationIndex] = useState(0);
  //是否展开DIY涂抹
  const [isShowModal, setIsShowModal] = useState(false);

  const [speed, setSpeed] = useState(100);
  const [isPause, setIsPause] = useState(false);
  const [navgationViewH, setNavgationViewH] = useState(0);
  const [isDynamic, setIsDynamic] = useState(false);
  const [isFirst, setIsFirst] = useState(true);
  const [staticThumbImage, setStaticThumbImage] = useState();
  const [isAdd, setIsAdd] = useState(true);
  const [isUpload, setIsUpload] = useState(false);
  const [workMode] = useDpState(dpCodes.workMode);

  const getNavgationH = useMemo(() => {
    return ty.getSystemInfo({
      success: params => {
        setNavgationViewH((params.statusBarHeight + 44) * 2);
      },
    });
  }, []);

  //刷新展示数据
  const refrshShowPiexlData = piexlData => {
    if (isDynamic) {
      dynamicArray = piexlData;
    } else {
      piexlArray = piexlData;
    }
  };

  //暂停或播放
  const updatePauseStatus = isPause => {
    dpUtils.putDpData({
      [dpCodes.isPause]: isPause,
    });
  };

  //切换DIY类型按钮点击事件
  const exchangeDIYTypeButtonClicked = event => {
    const itemId = event.origin.currentTarget.id;
    setIsPause(false);
    updatePauseStatus(false);

    if (itemId === '1') {
      setIsDynamic(false);
      setPiexlData([...piexlArray]);
      setTimeout(() => {
        //展示静态
        exchangeStatus({ status: 1 });
      }, 50);
    } else {
      setTimeout(() => {
        //展示动态
        exchangeStatus({ status: 2 });
      }, 50);

      if (dynamicData.length === 0) {
        //创建一个默认的
        let thumbData = {
          box: [],
          thumbImage: undefined,
        };
        dynamicArray.push(thumbData);
      }

      setDynamicData([...dynamicArray]);

      setIsDynamic(true);
    }
  };

  //rgb字符串转hex
  const rgb2hex1 = sRGB => {
    return sRGB.replace(/^rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)$/, function($0, $1, $2, $3) {
      return (
        '#' +
        ('0' + (+$1).toString(16)).slice(-2) +
        ('0' + (+$2).toString(16)).slice(-2) +
        ('0' + (+$3).toString(16)).slice(-2)
      );
    });
  };

  //校验DIY是否画有点数据
  const checkIsHavePiexl = () => {
    if (piexlData.length === 0 && dynamicData.length === 0) {
      return false;
    }
    if (isDynamic) {
      return dynamicData.some(thumbData => {
        return thumbData.box.some(item => {
          const rgbStr = item.fillStyle;
          return rgbStr !== '#eee' && rgbStr !== 'rgb(67,68,71)';
        });
      });
    } else {
      return piexlData.some(item => {
        const rgbStr = item.fillStyle;
        return rgbStr !== '#eee' && rgbStr !== 'rgb(67,68,71)';
      });
    }
  };

  //保存按钮点击事件
  const saveButtonClicked = () => {
    if (!checkIsHavePiexl()) {
      //返回
      ty.navigateBack();

      return;
    }
    ty.showLoading({ title: 'loading...' });

    let diyData = {
      isDynamic: isDynamic,
      direction: isDynamic ? dynamicAnimationIndex : staticAnimationIndex,
      speed: speed,
      piexlData: piexlData.map(item => {
        const rgbStr = item.fillStyle;
        var hue;
        if (rgbStr === '#eee' || rgbStr === 'rgb(67,68,71)') {
          hue = 254;
        } else if (rgbStr === 'rgb(255,255,255)') {
          hue = 255;
        } else {
          const [h, s, v] = hex2hsv(rgb2hex1(rgbStr));
          hue = Math.ceil(h / 2);
        }
        return hue;
      }),
      dynamicData: dynamicData.map(thumbData => {
        thumbData.box = thumbData.box.map(item => {
          const rgbStr = item.fillStyle;
          var hue;
          if (rgbStr === '#eee' || rgbStr === 'rgb(67,68,71)') {
            hue = 254;
          } else if (rgbStr === 'rgb(255,255,255)') {
            hue = 255;
          } else {
            const [h, s, v] = hex2hsv(rgb2hex1(rgbStr));
            hue = Math.ceil(h / 2);
          }
          return hue;
        });
        return thumbData;
      }),
      thumbImage: staticThumbImage,
      key: props.key,
    };
    //先保存单个DIY数据
    //1、先申请相册权限
    applyWriteScope(() => {
      //最后能走到回调的说明相册读写权限有了、diyList也已经有了
      const diyPath = `${folderPath}/${props.key}.text`;

      writeDataToFile(1, JSON.stringify(diyData), diyPath);
    });
  };

  //修改场景速度
  const updateSceneSpeed = speed => {
    dpUtils.putDpData({
      [dpCodes.sceneSpeed]: speed,
    });
  };

  //发布功能点
  //切换状态  0、编辑 1、展示静态 2、展示动态 3、新增DIY静态 4、保存静态 5、新建动态
  //                模式//亮度//速度 //状态
  //[0xaa,0xd0,0x04,0x01,0x02, 0x03,0x04,0xbb]
  const exchangeStatus = params => {
    let animateStr = '';
    if (params.animationIdx !== undefined) {
      animateStr = staticAnimationTypeList[params.animationIdx].code;
    } else {
      animateStr = staticAnimationTypeList[staticAnimationIndex].code;
    }
    let speedStr = '';
    if (params.speed !== undefined) {
      speedStr = toFixed(params.speed.toString(16), 2);
    } else {
      speedStr = toFixed(speed.toString(16), 2);
    }
    let diyStr =
      'aad004' +
      animateStr +
      toFixed(Number(props.brightness).toString(16), 2) +
      speedStr +
      toFixed(params.status.toString(16), 2) +
      'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: diyStr,
    });

    if (params.status === 2) {
      setTimeout(() => {
        let animateStr = '';
        if (params.animationIdx !== undefined) {
          animateStr = dynamicAnimationTypeList[params.animationIdx].code;
        } else {
          animateStr = dynamicAnimationTypeList[dynamicAnimationIndex].code;
        }
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
  const eidtThumbImageData = (number, opreation) => {
    let thumbDataStr =
      'aad702' + toFixed(number.toString(16), 2) + toFixed(opreation.toString(16), 2) + 'bb';
    dpUtils.putDpData({
      [dpCodes.DIY]: thumbDataStr,
    });
  };

  //渲染导航栏中间部分
  const renderNavigationCenter = () => {
    if (isAdd) {
      return (
        <View className="canvas-navigation-icon-wrapper">
          <View
            className="icon-wrapper"
            style={{ background: isDynamic ? '#404040' : 'rgb(55,147,255)' }}
            id="1"
            onClick={e => {
              exchangeDIYTypeButtonClicked(e);
            }}
          >
            <Image className="icon" src={imageSrcType.button_static}></Image>
          </View>
          <View
            className="icon-wrapper"
            style={{ background: isDynamic ? 'rgb(55,147,255)' : '#404040' }}
            id="2"
            onClick={e => {
              exchangeDIYTypeButtonClicked(e);
            }}
          >
            <Image className="icon" src={imageSrcType.button_dynamic}></Image>
          </View>
        </View>
      );
    } else {
      return <Text style={{ color: '#fff' }}>{TYSdk.devInfo.name}</Text>;
    }
  };

  //渲染自定义导航栏
  const renderNavigationView = () => {
    return (
      <View className="navigationView-wrapper" style={{ height: navgationViewH }}>
        <View
          className="backIcon-wrapper"
          onClick={() => {
            ty.navigateBack();
          }}
        >
          <Icon type="icon-left" size={30} color="#fff" />
        </View>
        <View className="navigationCenter-wrapper" style={{ width: (375 - 50 * 2) * 2 }}>
          {renderNavigationCenter()}
        </View>
      </View>
    );
  };

  //渲染动态时候方向视图
  const renderDynamicAnimationView = () => {
    const lineMaxCount = 6; //当行最大个数
    const itemW = ((375 - 20 - lineMaxCount * 20) / lineMaxCount) * 2;
    return (
      <View className="direction-wrapper">
        <Text style={{ paddingLeft: '20rpx' }}>{Strings.getLang('scene_direction')}</Text>
        <View className="direction-item-wrapper">
          {dynamicAnimationTypeList.map((item, index) => {
            return (
              <View
                className={'direction-item'}
                onClick={() => {
                  setDynamicAnimationIndex(index);
                  setIsPause(false);
                  updatePauseStatus(false);
                  setTimeout(() => {
                    exchangeStatus({ status: 2, animationIdx: index });
                  }, 50);
                }}
                key={index}
                style={{ width: itemW, height: itemW }}
              >
                <Image src={dynamicAnimationIndex === index ? item.selected : item.normal}></Image>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  //渲染静态时候方向视图
  const renderStaticAnimationView = () => {
    const lineMaxCount = 6; //当行最大个数
    const itemW = ((375 - 20 - lineMaxCount * 20) / lineMaxCount) * 2;
    return (
      <View className="direction-wrapper">
        <Text style={{ paddingLeft: '20rpx' }}>{Strings.getLang('scene_direction')}</Text>
        <View className="direction-item-wrapper">
          {staticAnimationTypeList.map((item, index) => {
            return (
              <View
                className={'direction-item'}
                onClick={() => {
                  setStaticAnimationIndex(index);
                  setIsPause(false);
                  updatePauseStatus(false);
                  setTimeout(() => {
                    exchangeStatus({ status: 1, animationIdx: index });
                  }, 50);
                  //展示静态
                }}
                key={index}
                style={{ width: itemW, height: itemW }}
              >
                <Image src={staticAnimationIndex === index ? item.selected : item.normal}></Image>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  //渲染弹窗
  const renderModalView = () => {
    return (
      <SmearModalView
        refrshShowPiexlData={refrshShowPiexlData}
        piexlData={piexlData}
        dynamicData={dynamicData}
        isDynamic={isDynamic}
        refreshThumbDataIndex={index => {
          thumbDataIndex = index;
        }}
        getStaticThumbImage={thumb => {
          setStaticThumbImage(thumb);
        }}
        removeModalViewEvent={() => {
          setIsShowModal(false);
        }}
        refreshDynamicIndex={() => {}}
      ></SmearModalView>
    );
  };

  return (
    <View className="c-width-full ">
      {/* 渲染导航栏 */}
      {renderNavigationView()}
      <View className="diy-wrapper" style={{ paddingTop: navgationViewH + 20 }}>
        <DiySmear
          pixelData={piexlData}
          dynamicData={dynamicData}
          width={piexlW * list}
          height={piexlW * row}
          pixelSize={piexlW}
          showType={0}
          canvasId={'smear'}
          pixelColor={'rgb(67,68,71)'}
          animationType={
            isDynamic
              ? dynamicAnimationTypeList[dynamicAnimationIndex].animationType
              : staticAnimationTypeList[staticAnimationIndex].animationType
          }
          interval={(100 - speed) * 7 + 100}
          isPause={isPause}
          isDynamic={isDynamic}
          isCurrentSwiperItem={true}
          bindtouchCanvasEvent={() => {
            setIsShowModal(true);
          }}
        ></DiySmear>
        {/* 方向 */}
        {isDynamic ? renderDynamicAnimationView() : renderStaticAnimationView()}
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
                updatePauseStatus(false);

                setTimeout(() => {
                  updateSceneSpeed(val.value);
                }, 50);
              }}
            ></Slider>
            <View
              className="pause-wrapper"
              onClick={() => {
                updatePauseStatus(!isPause);
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
      </View>

      <PageContainer
        show={isShowModal}
        position="bottom"
        overlay={true}
        zIndex={999}
        overlayStyle={{
          background: `linear-gradient(to bottom,#fff, #212121 10%)`,
          filter: 'blur(20rpx)',
        }}
        onBeforeEnter={() => {
          setIsPause(true);
          //编辑
          exchangeStatus({ status: 0 });

          if (isDynamic) {
            setTimeout(() => {
              console.log('isFirst', isFirst);
              if (isAdd) {
                if (isFirst) {
                  //新增动态第一张
                  eidtThumbImageData(1, 0);
                  setIsFirst(false);
                } else {
                  //编辑动态第一张
                  eidtThumbImageData(1, 1);
                }
              } else {
                //编辑动态第一张
                eidtThumbImageData(1, 1);
              }
            }, 100);
          }
        }}
        onAfterLeave={() => {
          if (workMode != 'scene') {
            ty.navigateBack({ delta: 10 });
          } else {
            setIsPause(false);

            setIsShowModal(false);
            if (isDynamic) {
              setDynamicData([...dynamicArray]);
              //保存动态当前张
              eidtThumbImageData(thumbDataIndex + 1, 2);
              setTimeout(() => {
                //展示动态
                exchangeStatus({ status: 2 });
              }, 100);
            } else {
              setPiexlData([...piexlArray]);
              //展示静态
              setTimeout(() => {
                exchangeStatus({ status: 1 });
              }, 100);
            }
          }
        }}
        onClickOverlay={() => {
          setIsShowModal(false);
        }}
      >
        {isShowModal ? renderModalView() : null}
      </PageContainer>
    </View>
  );
};

export default SmearView;
