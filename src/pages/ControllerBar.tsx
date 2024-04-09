/* eslint-disable react/destructuring-assignment */
import { View, Button, Image } from '@ray-js/components';
import React from 'react';
import Icon from '@/components/Iconfont';
import { Text } from '@ray-js/components';

import './ControllerBar.module.less';

type Props = {
  data: {
    name: string;
    path?: string;
    key: string;
    top?: number;
    icon?: string;
    icon_s?: string;
  }[];
  active: number;
  power: boolean;
  handlePower: any;
  onPress: any;
};

const ControllerBar = (props: Props) => {
  // const theme = useSelector(state => state.theme);
  const handleBarClick = label => {
    props?.onPress(label);
  };
  const handlePowerClick = () => {
    props?.handlePower();
  };

  const { active, power, data = [] } = props;
  console.log('comtrollerprops', props);
  return (
    <View className="controller-bar c-flex-around-center c-fixed c-bottom0">
      {power !== undefined && (
        <Button
          className="power-button"
          style={{ background: power ? '#efad67' : 'rgba(255,255,255,.2)' }}
          onClick={handlePowerClick}
        >
          <Icon type="icon-power" size={50} color="#fff" />
        </Button>
      )}

      {data.map((item, idx) => {
        const isActive = active === idx;
        const isSetting = item.key === 'other';
        const activeName = isActive ? '#fff' : '#6d6d6e';
        const className = `controller-bar-item ${activeName} ${isSetting ? 'setting-bar' : ''}`;
        return (
          <Button onClick={() => handleBarClick(item)} key={item.key} className={className}>
            {/* <Icon type={item.icon} size={40} color={activeName} /> */}
            <Image className="tabar-icon" src={isActive ? item.icon_s : item.icon}></Image>
            <Text style={{ color: activeName }}>{item.name}</Text>
          </Button>
        );
      })}
      {!power ? <View className="maskView2"></View> : null}
    </View>
  );
};

export default ControllerBar;
