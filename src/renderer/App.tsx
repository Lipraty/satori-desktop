import { createElement } from "react"
import { Avatar, BrandVariants, createDarkTheme, createLightTheme, FluentProvider, Theme } from "@fluentui/react-components"

import { useThemeListener } from "@renderer/hooks/use-theme-listener"
import { useCurrentView } from "@renderer/hooks/view-manager"
import { TitleBar } from "@renderer/components/Titlebar"
import { Sidebar } from "@renderer/components/Sidebar"
import { IconNames } from "@renderer/components/Icon"

import { views } from "./views"
import { getOS } from "./utils"

export const App = () => {
  const darkThemeStatus = useThemeListener()
  // const [loading, setLoading] = useState<boolean>(true)
  const { setCurrentView, currentView } = useCurrentView()
  const os = getOS()

  const koishiTheme: BrandVariants = {
    10: "#030205",
    20: "#181424",
    30: "#261F40",
    40: "#322958",
    50: "#3E3372",
    60: "#4A3D8C",
    70: "#5748A4",
    80: "#6756AC",
    90: "#7565B4",
    100: "#8474BC",
    110: "#9283C4",
    120: "#A092CC",
    130: "#AFA2D4",
    140: "#BDB2DB",
    150: "#CBC2E3",
    160: "#D9D2EB"
  };

  const lightTheme: Theme = {
    ...createLightTheme(koishiTheme),
  };

  const darkTheme: Theme = {
    ...createDarkTheme(koishiTheme),
  };

  // darkTheme.colorBrandForeground1 = koishiTheme[110];
  // darkTheme.colorBrandForeground2 = koishiTheme[120];

  const SidebarItem = ({ icon, label, name }: { icon: IconNames, label: string, name: string }) =>
    <Sidebar.Item icon={icon}
      label={label}
      active={currentView === name}
      onClick={() => {
        setCurrentView(name)
      }}
      key={name}
    />

  return (
    <>
      <FluentProvider theme={darkThemeStatus ? darkTheme : lightTheme} style={{
        display: 'flex',
        height: 'calc(100vh - 44px)',
        width: '100%',
        backgroundColor: 'transparent',
        paddingTop: '44px',
      }}>
        <TitleBar title='Satori App for Desktop' icon="assets/icons/icon.png" os={os}  />
        <Sidebar>
          {views.filter(view => !view.append).map((view) =>
            SidebarItem({ icon: view.icon as IconNames, label: view.name, name: view.name }))}
          <Sidebar.Divider />
          {views.filter(view => view.append).map((view) => (
            SidebarItem({ icon: view.icon as IconNames, label: view.name, name: view.name })
          ))}
          <Sidebar.Item>
            <Avatar name="Satori" badge={{
              status: 'available',
            }} image={{
              src: 'https://koishi.chat/logo.png'
            }} />
          </Sidebar.Item>
        </Sidebar>
        <main>
          {createElement(views.find((view) => view.name === currentView && view.component)!.component)}
        </main>
      </FluentProvider>
    </>
  )
}
