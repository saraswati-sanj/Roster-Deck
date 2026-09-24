import type { Roster, ShiftValue, Staff, SwapRequest, WardCode, WardRequirement } from '../domain/entities'
import {
  getRequirement,
  getRoster,
  getStaff,
  getWards,
  getSwaps,
  updateCell,
  approveSwap,
  rejectSwap,
  publishRoster,
  updateRequirements
} from './fakeApi'

export const rosterRepository = {
  getWards,
  getStaff,
  getRoster,
  updateCell,
  getRequirement,
  updateRequirements,
  getSwaps,
  approveSwap,
  rejectSwap,
  publishRoster
}

export type RosterRepository = typeof rosterRepository
export type { Roster, ShiftValue, Staff, SwapRequest, WardCode, WardRequirement }
