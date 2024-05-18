import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { FluentProvider, webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components"

import { useThemeListener } from "./hooks/use-theme-listener"
import { useCurrentPage } from "./hooks/globals"

import { TitleBar } from "./components/Titlebar"
import { Sidebar } from "./components/Siderbar"
import { ViewBox } from "./components/ViewBox"
import { SatoriDesktopColors } from "./components/color-provider"
import { Icon, IconNames } from "./components/Icon"
import { List, ListItem } from "./components/List"

const getTheme = () => (useThemeListener() ? webDarkTheme : webLightTheme)

export const App = () => {
  const [theme, setTheme] = useState<Theme>(getTheme())
  const [loading, setLoading] = useState<boolean>(true)
  const { setCurrentPage, currentPage } = useCurrentPage()

  const SidebarItem = useCallback(
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
        <Sidebar>
            <SidebarItem icon='chatFilled' label="Messaging" name="Chat"/>
            <SidebarItem icon='personFilled' label="Contact" name="Person"/>
            <Sidebar.Divider />
            <SidebarItem icon='personFilled' label="Settings" name="Settings"/>
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
