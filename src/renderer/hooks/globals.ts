import { create } from "zustand";

export const useCurrentPage = create<{
  setCurrentPage: (page: string)=>void,
  currentPage: string
}>((set)=>({
  setCurrentPage: (page)=>set({currentPage: page}),
  currentPage: 'Chat'
}))