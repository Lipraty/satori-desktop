export const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Network error: ' + response.statusText)
  }
  return response.json()
}

export enum OS {
  WINDOWS = 'windows',
  MAC = 'mac',
  LINUX = 'linux',
}
