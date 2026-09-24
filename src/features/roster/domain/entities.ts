export type WardCode = 'ICU' | 'WARD_A' | 'WARD_B'
export type Grade = 'SENIOR' | 'JUNIOR'
export type ShiftCode = 'D' | 'E' | 'N' | 'L'
export type ShiftValue = ShiftCode | null
export type Severity = 'error' | 'warning'

export interface Staff {
  id: string
  fullName: string
  grade: Grade
  icuCertExpiry: string | null
  leaveDates: string[]
}

export interface RosterCell {
  id: string
  staffId: string
  date: string
  shift: ShiftValue
  version: number
}

export interface Roster {
  ward: WardCode
  week: string
  version: number
  published: boolean
  cells: RosterCell[]
}

export interface WardRequirement {
  ward: WardCode
  shifts: Record<'D' | 'E' | 'N', { total: number; seniors: number }>
}

export interface Violation {
  code: string
  severity: Severity
  staffId?: string
  date?: string
  message: string
}

export interface SwapRequest {
  id: string
  fromStaffId: string
  toStaffId: string
  date: string
  shift: ShiftCode
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason?: string
}
