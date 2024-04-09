import Strings from '../../i18n';
import { View, Image, Switch, Text } from '@ray-js/components';
import React, { useState, useEffect } from 'react';
import { setNavigationBarTitle } from '@ray-js/api';
import { TYSdk } from '@ray-js/ray-panel-core';
import treeStar_follow from './scene_treeStar_follow.png';
import treeStar_static from './scene_treeStar_static.png';
import treeStar_close from './scene_treeStar_stop.png';
import './index.module.less';
import { hooks } from '@ray-js/panel-sdk';
import dpCodes from '@/config/dpCodes';
import { dpUtils, actions } from '@/redux/index';
import { store } from '@/redux';
import { publishGroupDps, usePageEvent } from '@ray-js/ray';

const TreeTopStar = () => {
  const isGroup = !(TYSdk.devInfo.groupId === undefined);
  const { groupDPs } = store.getState();
  const { useDpState } = hooks;
  const [dpState] = useDpState();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('static');
  const [lastStatus, setLastStatus] = useState('static');

  usePageEvent('onLoad', () => {
    ty.hideMenuButton();
  });

  setNavigationBarTitle({
    title: TYSdk.devInfo.name,
  });

  useEffect(() => {
    if (isGroup) {
      const treeStarStatus =
        groupDPs['110'] == undefined || groupDPs['110'] == '' ? 'static' : groupDPs['110'];
      if (treeStarStatus == 'static') {
        setIsOpen(true);
        setLastStatus('static');
        setStatus('static');
      } else if (treeStarStatus == 'follow') {
        setIsOpen(true);
        setLastStatus('follow');
        setStatus('follow');
      } else {
        setIsOpen(false);
        setStatus('');
      }
      updateTreeTopStarStatusDP(treeStarStatus);
    } else {
      const treeStarStatus = dpState[dpCodes.treeStarStatus];
      if (treeStarStatus == 'static') {
        setIsOpen(true);
        setLastStatus('static');
        setStatus('static');
      } else if (treeStarStatus == 'follow') {
        setIsOpen(true);
        setLastStatus('follow');
        setStatus('follow');
      } else {
        setIsOpen(false);
        setStatus('');
      }
    }
  }, [dpState]);

  //发送更改树顶星状态的DP
  const updateTreeTopStarStatusDP = status => {
    if (status == 'static') {
      setIsOpen(true);
      setLastStatus('static');
      setStatus('static');
    } else if (status == 'follow') {
      setIsOpen(true);
      setLastStatus('follow');
      setStatus('follow');
    } else {
      setIsOpen(false);
      setStatus('');
    }

    if (isGroup) {
      publishGroupDps({
        groupId: TYSdk.devInfo.groupId,
        dps: { '110': status },
        success(params) {
          store.dispatch(actions.common.updateGroupDPs({ '110': status }));
        },
      });
    } else {
      dpUtils.putDpData({
        [dpCodes.treeStarStatus]: status,
      });
    }
  };

  return (
    <View className="treeTopStar-wrapper">
      <View className="image-wrapper">
        <Image
          src={
            status == 'off'
              ? treeStar_close
              : status == 'follow'
              ? treeStar_follow
              : treeStar_static
          }
          mode="aspectFit"
          style={{
            height: '100%',
            width: '100%',
          }}
        ></Image>
      </View>
      <View className="opration-wrapper">
        <View className="left-opration-wrapper">
          <Switch
            checked={isOpen}
            onChange={e => {
              if (e.value) {
                updateTreeTopStarStatusDP(lastStatus);
              } else {
                updateTreeTopStarStatusDP('off');
              }
            }}
          ></Switch>
        </View>
        <View className="right-opration-wrapper">
          <View
            className="button-wrapper"
            onClick={() => {
              updateTreeTopStarStatusDP('follow');
            }}
            style={{
              background: status == 'follow' ? 'rgba(55, 147, 255,1)' : 'rgba(114, 114, 114,0.8)',
            }}
          >
            <Text>{Strings.getLang('treeTopStar_button_follow')}</Text>
          </View>
          <View
            className="button-wrapper"
            onClick={() => {
              updateTreeTopStarStatusDP('static');
            }}
            style={{
              background: status == 'static' ? 'rgba(55, 147, 255,1)' : 'rgba(114, 114, 114,0.8)',
            }}
          >
            <Text>{Strings.getLang('treeTopStar_button_static')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TreeTopStar;
