import { create } from "zustand"

import { View } from "@renderer/views"

export const useCurrentView = create<{
  setCurrentView: (view: string) => void,
  currentView: string
}>((set) => ({
  setCurrentView: (view) => set({ currentView: view }),
  currentView: 'Chat'
}))

export const useViewList = create<{
  setViewList: (view: View[]) => void,
  viewList: View[]
}>((set) => ({
  setViewList: (view) => set({ viewList: view }),
  viewList: []
}))
