import * as React from 'react'
import './style.scss'

import { OS } from '@renderer/utils'

export interface TitleBarProps {
  title?: string;
  icon?: string;
  os?: OS;
}

export const TitleBar = ({
  title = 'Satori App for Desktop',
  os = OS.WINDOWS,
  icon
}: TitleBarProps) => {
  return (
    <header>
      {/* <MenuBar /> */}
      <div className='title-bar' style={
        os === OS.MAC ? {
          justifyContent: 'center',
        } : {}
      }>
        {icon && <img className='title-bar__icon' height={28} width={28} src={icon} />}
        <span className='title-bar__title'>{title}</span>
        <div style={{ flex: 1 }}></div>
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
