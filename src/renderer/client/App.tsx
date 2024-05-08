import { FluentProvider, webLightTheme, webDarkTheme, makeStyles, tokens, shorthands } from '@fluentui/react-components'

// import { Context } from "..";
import { NavBar } from './components/NavBar'
import { TitleBar } from './components/TitleBar'
import { useThemeListener } from './hooks/useThemeListener'

const useStyles = makeStyles({
  main: {
    backgroundColor: tokens.colorNeutralBackground1,
    // ...shorthands.border('1px', 'solid', tokens.colorNeutralBackgroundAlpha),
  },
})

export const App = () => {
  const styles = useStyles()
  const isDarkTheme = useThemeListener()

  return (
    <FluentProvider theme={isDarkTheme ? webDarkTheme : webLightTheme}>
      <TitleBar title='Satori App for Desktop' />
      <NavBar />
      <main className={styles.main}>
        <h1>Hello, world!</h1>
        <p>Welcome to satori app!</p>
      </main>
    </FluentProvider>
  )
}

// export function apply(ctx: Context) {
//   ctx.page({
//     $root: true,
//     path: '/',
//     component: App
//   })
// }
