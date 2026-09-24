import type { Staff, Roster } from '../domain/entities'
import type { StaffDTO, RosterDTO } from './dto'

export const mapStaff = (dto: StaffDTO): Staff => ({
  id: dto.staff_id,
  fullName: dto.full_name,
  grade: dto.grade,
  icuCertExpiry: dto.icu_cert_expiry,
  leaveDates: dto.leave_dates
})

export const mapRoster = (dto: RosterDTO): Roster => ({
  ward: dto.ward_code,
  week: dto.iso_week,
  version: dto.version,
  published: dto.published,
  cells: dto.cells.map(cell => ({
    id: cell.cell_id,
    staffId: cell.staff_id,
    date: cell.date,
    shift: cell.shift,
    version: cell.version
  }))
})
