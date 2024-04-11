import * as React from 'react';
import './style.scss'

export enum OS {
  WINDOWS = 'windows',
  MAC = 'mac',
  LINUX = 'linux',
}

export interface TitleBarProps {
  title?: string;
  os?: OS;
}

export const TitleBar: React.FC<TitleBarProps> = (props) => {
  const {
    title = 'Satori App for Desktop',
    os = OS.WINDOWS
  } = props;
  return (
    <div className='title-bar'>
      {os === OS.MAC ? <div style={{ flex: 1 }}></div> : undefined}
      <span>{title}</span>
      <div style={{ flex: 1 }}></div>
      {os === OS.WINDOWS ? <div style={{ width: '138px'}}></div> : undefined}
    </div>
  );
}

