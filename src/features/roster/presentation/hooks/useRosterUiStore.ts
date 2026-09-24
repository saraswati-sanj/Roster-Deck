import { create } from 'zustand'

interface RosterUiState {
  drawerOpen: boolean
  selectedCellId: string | null
  offline: boolean
  anotherManager: boolean
  failNextWrite: boolean
  dirty: boolean
  setDrawer: (open: boolean, cellId?: string | null) => void
  setOffline: (value: boolean) => void
  setAnotherManager: (value: boolean) => void
  setFailNextWrite: (value: boolean) => void
  setDirty: (value: boolean) => void
}

export const useRosterUiStore = create<RosterUiState>((set) => ({
  drawerOpen: false,
  selectedCellId: null,
  offline: false,
  anotherManager: false,
  failNextWrite: false,
  dirty: false,
  setDrawer: (open, cellId = null) => set({ drawerOpen: open, selectedCellId: cellId }),
  setOffline: (value) => set({ offline: value }),
  setAnotherManager: (value) => set({ anotherManager: value }),
  setFailNextWrite: (value) => {
    if (value) sessionStorage.setItem('rosterdesk-fail-next-write', '1')
    else sessionStorage.removeItem('rosterdesk-fail-next-write')
    set({ failNextWrite: value })
  },
  setDirty: (value) => set({ dirty: value })
}))
