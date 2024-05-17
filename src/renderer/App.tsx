import { useEffect, useState } from "react"
import { FluentProvider, webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components"

import { useThemeListener } from "./hooks/useThemeListener"
import { TitleBar } from "./components/Titlebar"
import { Sidebar, SidebarItem } from "./components/Siderbar"
import { ViewBox } from "./components/ViewBox"
import { List, ListItem } from "./components/List"

export const getTheme = () => (useThemeListener() ? webDarkTheme : webLightTheme)

export const App = () => {
  const [theme] = useState<Theme>(getTheme())

  useEffect(() => {

  }, [theme])

  const useSiderbar = [
    { label: 'Messages', icon: 'Chat', active: true },
    { label: 'Contact', icon: 'Person'},
    { spacer: true },
    { label: 'Servers', icon: 'Apps' },
    { label: 'Settings', icon: 'Settings' },
  ]

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
          <ViewBox fixed width="260px">
            <List line="two" style={{
              margin: '0 -12px',
            }}>
              <ListItem selected title="Shigma" avatar subtitle="你说的对，但是《原神》是由米哈游自主研发的一款全新开放世界冒险游戏。游戏发生在一个被称作「提瓦特」的幻想世界，在这里，被神选中的人将被授予「神之眼」，导引元素之力。你将扮演一位名为「旅行者」的神秘角色在自由的旅行中邂逅性格各异、能力独特的同伴们，和他们一起击败强敌，找回失散的亲人——同时，逐步发掘「原神」的真相。" />
            </List>
          </ViewBox>
          <ViewBox>
            Hello World2
          </ViewBox>
        </main>
      </FluentProvider>
    </>
  )
}
