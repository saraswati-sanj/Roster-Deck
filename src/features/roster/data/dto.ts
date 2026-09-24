export interface StaffDTO {
  staff_id: string
  full_name: string
  grade: 'SENIOR' | 'JUNIOR'
  icu_cert_expiry: string | null
  leave_dates: string[]
}

export interface RosterCellDTO {
  cell_id: string
  staff_id: string
  date: string
  shift: 'D' | 'E' | 'N' | 'L' | null
  version: number
}

export interface RosterDTO {
  ward_code: 'ICU' | 'WARD_A' | 'WARD_B'
  iso_week: string
  version: number
  published: boolean
  cells: RosterCellDTO[]
}
