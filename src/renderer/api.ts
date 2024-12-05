import useSWR from 'swr'

export interface Requester {
  
}

export const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Network error: ' + response.statusText)
  }
  return response.json()
}


