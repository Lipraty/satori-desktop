import { useCallback, useState } from "react"
import { FluentProvider, webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components"

import { useThemeListener } from "@/renderer/hooks/use-theme-listener"
import { useCurrentPage } from "@/renderer/hooks/globals"

import { TitleBar } from "@/renderer/components/Titlebar"
import { Sidebar } from "@/renderer/components/Sidebar"
import { IconNames } from "@/renderer/components/Icon"

const getTheme = () => (useThemeListener() ? webDarkTheme : webLightTheme)

export const App = () => {
  const [theme, setTheme] = useState<Theme>(getTheme())
  const [loading, setLoading] = useState<boolean>(true)
  const { setCurrentPage, currentPage } = useCurrentPage()

  const SidebarItem = useCallback(
    ({ icon, label, name }: { icon: IconNames, label: string, name: string }) =>
      <Sidebar.Item icon={icon}
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
        <Sidebar>
            <SidebarItem key={'si1'} icon='Chat' label="Messaging" name="Chat"/>
            <SidebarItem key={'si2'} icon='Person' label="Contact" name="Person"/>
            <Sidebar.Divider />
            <SidebarItem key={'si3'} icon='Settings' label="Settings" name="Settings"/>
        </Sidebar>
        <main>
          
        </main>
      </FluentProvider>
    </>
  )
}
