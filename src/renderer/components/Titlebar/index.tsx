import { useCallback, useState } from 'react';
import { Switch } from '@fluentui/react-components';

import { OS } from '@renderer/utils'
import { updateTheme, useThemeListener } from '@renderer/hooks/use-theme-listener';
import './style.scss'

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
  // const darkThemeStatus = useThemeListener()
  // const [theme, setTheme] = useState(false)
  // const onThemeChange = useCallback(() => {
  //   setTheme(!theme)
  //   updateTheme(!theme)
  // }, [setTheme])

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
        paddingRight: '137px',
        display: 'flex',
        flexDirection: 'row-reverse',
        flexWrap: 'nowrap',
        alignItems: 'center',
      }}>
        {/* <Switch
        label={'11'}
        labelPosition='before'
        checked={theme}
        onChange={onThemeChange}
        /> */}
      </div>
    </header>
  );
}

const MenuBar = () => {
  return (
    <div className='menu-bar'></div>
  )
}
