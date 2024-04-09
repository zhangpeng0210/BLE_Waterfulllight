import React from 'react';
import { View } from '@ray-js/components';
import './index.less';

type Props = {
  size?: number;
  style?: any;
  type: string;
  color: string;
};

const Icon = (props: Props) => {
  const { size = 24, style = {}, type = '', color = '' } = props;
  const className = `iconfont ${type}`;
  return (
    <View
      className={className}
      style={{
        ...style,
        color,
        fontSize: `${size}rpx`,
      }}
    />
  );
};

Icon.defaultProps = {
  size: 24,
  style: {},
};
export default Icon;
