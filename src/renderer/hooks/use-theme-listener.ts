import { useSyncExternalStore } from 'react'

export type ThemeKey = 'system' | 'light' | 'dark'

const MATCH_MEDIA_QUERY_DARK_THEME = '(prefers-color-scheme: dark)'

let isDarkTheme = window.matchMedia(MATCH_MEDIA_QUERY_DARK_THEME).matches

const getDarkThemeSnapshot = () => {
  return isDarkTheme
}

const subscribe = (callback: () => void) => {
  const darkMatchMedia = window.matchMedia(MATCH_MEDIA_QUERY_DARK_THEME)

  darkMatchMedia.addEventListener('change', (ev) => {
    console.log('dark theme changed', ev.matches)
    updateTheme(ev.matches)
    callback()
  })
  return () => {
    darkMatchMedia.removeEventListener('change', callback)
  }
}

export const updateTheme = (isDark: boolean) => 
  isDarkTheme = isDark

export const useThemeListener = () => {
  return useSyncExternalStore(subscribe, getDarkThemeSnapshot)
}
