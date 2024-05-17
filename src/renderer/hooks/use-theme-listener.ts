import { useSyncExternalStore } from 'react';

const MATCH_MEDIA_QUERY_LIGHT_THEME = '(prefers-color-scheme: light)';

let isDarkTheme = false;

const getIsDarkTheme = () => isDarkTheme;

const subscribe = (callback: () => void) => {
  const lightThemeMatchMedia = window.matchMedia(MATCH_MEDIA_QUERY_LIGHT_THEME);

  const updateThemeCallback = ()=>{
    isDarkTheme = !lightThemeMatchMedia.matches;
    callback();
  }
  lightThemeMatchMedia.addEventListener('change', updateThemeCallback);
  
  updateThemeCallback()
  return () => {
    lightThemeMatchMedia.removeEventListener('change', updateThemeCallback);
  };
};

export const useThemeListener = () => {
  return useSyncExternalStore(subscribe, getIsDarkTheme);
};