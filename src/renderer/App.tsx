import { useEffect, useState } from "react"
import { FluentProvider, webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components"
import { HomeFilled, ChatFilled, SettingsFilled } from "@fluentui/react-icons"

import { useThemeListener } from "./hooks/useThemeListener"
import { TitleBar } from "./components/Titlebar"
import { Sidebar, SidebarItem } from "./components/Siderbar"
import { ViewBox } from "./components/ViewBox"


export const getTheme = () => (useThemeListener() ? webDarkTheme : webLightTheme)

export const App = () => {
  const [theme, setTheme] = useState<Theme>(getTheme())
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {

  }, [theme])

  const useSiderbar = [
    { label: 'Messages', icon: <ChatFilled />, active: true },
    { spacer: true },
    { label: 'Settings', icon: <SettingsFilled /> },
  ]

  console.log(theme)

  return (
    <>
      <TitleBar title='Satori App for Desktop' />
      <FluentProvider theme={theme} style={{
        display: 'flex',
        height: 'calc(100vh - 44px)',
        width: '100%',
        backgroundColor: 'transparent',
      }}>
        <Sidebar>
          {useSiderbar.map((item, index) =>
            <SidebarItem key={index} active={item.active} icon={item.icon} label={item.label} spacer={item.spacer} />
          )}
        </Sidebar>
        <main>
          <ViewBox>
            Hello World
          </ViewBox>
          <ViewBox>
            Hello World2
          </ViewBox>
        </main>
      </FluentProvider>
    </>
  )
}
