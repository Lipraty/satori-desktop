import { useEffect, useState } from "react"
import { FluentProvider, webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components"

import { useThemeListener } from "./hooks/useThemeListener"
import { TitleBar } from "./components/Titlebar"
import { Sidebar } from "./components/Siderbar"
import { ViewBox } from "./components/ViewBox"
import { SatoriDesktopColors } from "./components/color-provider"

export const getTheme = () => (useThemeListener() ? webDarkTheme : webLightTheme)

export const App = () => {
  const [theme, setTheme] = useState<Theme>(getTheme())
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {

  }, [theme])

  const useSiderbar = [
    { label: 'Messages', icon: 'Chat', active: true },
    { label: 'Contact', icon: 'Person'},
    { spacer: true },
    { label: 'Settings', icon: 'Settings' },
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
        <SatoriDesktopColors>
          <Sidebar>
            {useSiderbar.map((item, index) =>
              <Sidebar.Item key={index} active={item.active} icon={item.icon} label={item.label} spacer={item.spacer} />
            )}
          </Sidebar>
          <main>
            <ViewBox fixed width="260px">
              Hello World
            </ViewBox>
            <ViewBox>
              Hello World2
            </ViewBox>
          </main>
        </SatoriDesktopColors>
      </FluentProvider>
    </>
  )
}
