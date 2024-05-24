import { useCallback, useState } from "react"
import { Avatar, FluentProvider, webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components"

import { useThemeListener } from "@renderer/hooks/use-theme-listener"
import { useCurrentView } from "@renderer/hooks/view-manager"
import { TitleBar } from "@renderer/components/Titlebar"
import { Sidebar } from "@renderer/components/Sidebar"
import { IconNames } from "@renderer/components/Icon"

import { views } from "./views"

const getTheme = () => (useThemeListener() ? webDarkTheme : webLightTheme)

export const App = () => {
  const [theme, setTheme] = useState<Theme>(getTheme())
  const [loading, setLoading] = useState<boolean>(true)
  const { setCurrentView, currentView } = useCurrentView()

  const SidebarItem = useCallback(
    ({ icon, label, name }: { icon: IconNames, label: string, name: string }) =>
      <Sidebar.Item icon={icon}
        label={label}
        active={currentView === name}
        onClick={() => {
          setCurrentView(name)
        }}
      />
    , [currentView])

  return (
    <>
      <TitleBar title='Satori App for Desktop' icon="assets/icons/icon.png" />
      <FluentProvider theme={theme} style={{
        display: 'flex',
        height: 'calc(100vh - 44px)',
        width: '100%',
        backgroundColor: 'transparent',
      }}>
        <Sidebar>
          {views.filter(view => !view.append).map((view) => (
            <SidebarItem key={`sidebar-${view.name}`} icon={view.icon as IconNames} label={view.name} name={view.name} />
          ))}
          <Sidebar.Divider />
          {views.filter(view => view.append).map((view) => (
            <SidebarItem key={`sidebar-${view.name}`} icon={view.icon as IconNames} label={view.name} name={view.name} />
          ))}
          <Sidebar.Item>
            <Avatar name="Satori" badge={{
              status: 'available',
            }} image={{
              src: 'https://koishi.chat/logo.png'
            }}/>
          </Sidebar.Item>
        </Sidebar>
        <main>
          {views.find((view) => view.name === currentView && view.component)?.component}
        </main>
      </FluentProvider>
    </>
  )
}
