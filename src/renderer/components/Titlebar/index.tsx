import * as React from 'react'
import './style.scss'

import { OS } from '@shared/types'

export interface TitleBarProps {
  title?: string;
  os?: OS;
}

export const TitleBar = ({
  title = 'Satori App for Desktop',
  os = OS.WINDOWS
}: TitleBarProps) => {
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
