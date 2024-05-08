import { useEffect, useState } from 'react'

const MATCH_MEDIA_QUERY_DARK_THEME = '(prefers-color-scheme: dark)'
const MATCH_MEDIA_QUERY_LIGHT_THEME = '(prefers-color-scheme: light)'

export const useThemeListener = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => {
    if (!('matchMedia' in window && 'addEventListener' in window.matchMedia(MATCH_MEDIA_QUERY_DARK_THEME))) {
      return
    }

    const lightThemeMatchMedia = window.matchMedia(MATCH_MEDIA_QUERY_LIGHT_THEME)
    const darkThemeMatchMedia = window.matchMedia(MATCH_MEDIA_QUERY_DARK_THEME)

    const updateThemeCallbackWrapper = (theme: 'light' | 'dark') => (ev: MediaQueryListEvent) => {
      if (ev.matches) {
        setIsDarkTheme(theme === 'dark')
      }
    }

    const updateThemeCallbackDark = updateThemeCallbackWrapper('dark')
    const updateThemeCallbackLight = updateThemeCallbackWrapper('light')

    lightThemeMatchMedia.addEventListener('change', updateThemeCallbackLight)
    darkThemeMatchMedia.addEventListener('change', updateThemeCallbackDark)

    return () => {
      lightThemeMatchMedia.removeEventListener('change', updateThemeCallbackLight)
      darkThemeMatchMedia.removeEventListener('change', updateThemeCallbackDark)
    }
  }, [isDarkTheme, setIsDarkTheme])

  return isDarkTheme
}
