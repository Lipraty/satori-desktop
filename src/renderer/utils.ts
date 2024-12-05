export const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Network error: ' + response.statusText)
  }
  return response.json()
}

export const getOS = () => {
  const platform = window.navigator.platform.toLowerCase()
  if (platform.includes('win')) {
    return OS.WINDOWS
  } else if (platform.includes('mac')) {
    return OS.MAC
  } else {
    return OS.LINUX
  }
}

export enum OS {
  WINDOWS = 'windows',
  MAC = 'mac',
  LINUX = 'linux',
}
