import React, { useState } from 'react';
import { View, Image, PageContainer } from '@ray-js/components';
import { TYSdk } from '@ray-js/ray-panel-core';
import { navigateTo } from '@ray-js/api';
import { ConfigsForPId } from '../../config/pId';
import LoopCollection from './sceneCollection';

import './sceneHome.module.less';

const SceneHomeView = () => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const [isShowCollection, setIsShowCollection] = useState(false);

  let scenesList = ConfigsForPId.getHomeItems().scenesList;
  //item点击事件
  const handleItemClick = (sceneItem, e?) => {
    const { origin } = e || {};
    if (origin) {
      origin.stopPropagation();
    }
    var url = '';
    switch (sceneItem.itemType) {
      case 'diy':
        url = '/pages/diyList/index?brightness=100';
        break;
      case 'text':
        url = '/pages/textList/index';
        break;
      case 'treeStar':
        url = '/pages/treeTopStar/index';
        break;
      case 'gif':
        url = '/pages/scenesDetail/sceneSourceGif/index';
        break;
      case 'piexl':
        url = '/pages/scenesDetail/sceneSourcePiexl/index';
        break;
      case 'collection':
        setIsShowCollection(true);
        break;
      default:
        break;
    }
    // 将场景Id传入
    navigateTo({
      url: url,
    });
  };
  //渲染单个item
  const renderSceneItem = (sceneItem, index) => {
    if (!sceneItem) {
      return null;
    } else {
      const itemW = ((375 - 20 - 10) / 2) * 2;
      return (
        <View
          className="scene-home-item-wrapper"
          // style={itemStyle}
          onClick={e => {
            handleItemClick(sceneItem, e);
          }}
          key={index}
          style={{ width: `${itemW}rpx`, height: `${itemW}rpx` }}
        >
          <Image className="image-wrapper" mode="aspectFill" src={sceneItem.icon}></Image>
        </View>
      );
    }
  };

  //渲染收藏的弹窗
  const renderModalView = () => {
    return (
      <LoopCollection
        removeModalViewEvent={() => {
          setIsShowCollection(false);
        }}
      ></LoopCollection>
    );
  };

  return (
    <View className="c-width-full scene-home-wrapper">
      {scenesList.map(renderSceneItem)}
      <PageContainer
        show={isShowCollection}
        position="bottom"
        overlay={true}
        zIndex={999}
        onBeforeEnter={() => {}}
        onAfterLeave={() => {}}
        onClickOverlay={() => {
          setIsShowCollection(false);
        }}
      >
        {isShowCollection ? renderModalView() : null}
      </PageContainer>
    </View>
  );
};

export default SceneHomeView;
