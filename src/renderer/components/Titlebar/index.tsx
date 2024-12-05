import { useCallback, useState } from 'react'
import { Button } from '@fluentui/react-components'

import { OS } from '@renderer/utils'
import { updateTheme, useThemeListener } from '@renderer/hooks/use-theme-listener'

import { Icon } from '../Icon'

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
  const darkThemeStatus = useThemeListener()
  const [theme, setTheme] = useState(darkThemeStatus)
  const onThemeChange = useCallback(() => {
    setTheme(!theme)
    updateTheme(!theme)
  }, [setTheme, updateTheme, theme])

  return (
    <header>
      {/* <MenuBar /> */}
      <div className='title-bar' style={
        os === OS.MAC ? {
          justifyContent: 'center',
        } : {}
      }>
        {icon && <img className='title-bar__icon' height={28} width={28} src={icon} style={
          os === OS.MAC ? {
            marginRight: 10,
          } : {}
        } />}
        <span className='title-bar__title'>{title}</span>
      </div>
      <Icon className='title-bar__themer' sized='24' name={theme ? 'WeatherMoon' : 'WeatherSunny'} style={
        os === OS.MAC ? {
          right: 10,
        } : {}
      }/>
    </header>
  );
}

const MenuBar = () => {
  return (
    <div className='menu-bar'></div>
  )
}
