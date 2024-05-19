import { createContextState } from 'foxact/create-context-state'
import { SidebarItemProps } from '@/renderer/components/Sidebar'
import React, { useCallback } from 'react'

export interface PageContext extends SidebarItemProps {
  component?: React.ReactElement
}

const [PageProvider, usePage, useSetPage] = createContextState<PageContext>({})

export const useTogglePage = (page: PageContext) => {
  const setPage = useSetPage()
  return useCallback(() => setPage(page), [setPage, page])
}

export { PageProvider, usePage, useSetPage }
