import React from 'react';
import 'ray';
import { RayAppWrapper } from '@ray-js/ray-panel-wrapper';
import composeLayout from './composeLayout';
class App extends React.Component {
  componentDidMount() {
    console.info('app did mount ');
  }

  render() {
    // eslint-disable-next-line react/prop-types
    return this.props.children;
  }
}

export default RayAppWrapper(composeLayout(App));
