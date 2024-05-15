import * as React from 'react'
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

export const TitleBar = (props: TitleBarProps) => {
  const {
    title = 'Satori App for Desktop',
    os = OS.WINDOWS
  } = props;
  return (
    <header>
      <MenuBar />
      <div className='title-bar'>
        {os === OS.MAC ? <div className='title-bar__macbox'></div> : undefined}
        <span className='title-bar__title'>{title}</span>
        <div style={{ flex: 1 }}></div>
        {os === OS.WINDOWS ? <div className='title-bar__windowsbox'></div> : undefined}
      </div>
      {/* <div className='navigation'></div> */}
      <div style={{
        flex: 1,
        minWidth: '137px',
      }}></div>
    </header>
  );
}

const MenuBar = () => {
  return (
    <div className='menu-bar'></div>
  )
}
