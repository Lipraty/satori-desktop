import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { FluentProvider, webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components"

import { useThemeListener } from "./hooks/use-theme-listener"
import { TitleBar } from "./components/Titlebar"
import { Sidebar } from "./components/Siderbar"
import { ViewBox } from "./components/ViewBox"
import { SatoriDesktopColors } from "./components/color-provider"
import { useCurrentPage } from "./hooks/globals"
import { Icon, IconNames } from "./components/Icon"

export const getTheme = () => (useThemeListener() ? webDarkTheme : webLightTheme)

export const App = () => {
  const [theme, setTheme] = useState<Theme>(getTheme())
  const [loading, setLoading] = useState<boolean>(true)
  const { setCurrentPage, currentPage } = useCurrentPage()

  useEffect(() => {

  }, [theme])

  const SBItem = useCallback(
    ({ icon, label, name }: { icon: IconNames, label: string, name: string }) =>
      <Sidebar.Item icon={<Icon name={icon} />}
        label={label}
        active={currentPage === name}
        onClick={()=>{
          setCurrentPage(name)
        }}
        />
    , [currentPage])

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
            <SBItem icon='chatFilled' label="Messaging" name="Chat"/>
            <SBItem icon='personFilled' label="Contact" name="Person"/>
            <Sidebar.Divider />
            <SBItem icon='personFilled' label="Settings" name="Settings"/>
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
