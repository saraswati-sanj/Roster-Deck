import type { RosterCell, Staff, Violation } from '../entities'

export function checkWeeklyHours(staff: Staff, cells: RosterCell[]): Violation[] {
  const hours = cells
    .filter(c => c.staffId === staff.id && c.shift && c.shift !== 'L')
    .length * 8

  if (hours > 48) {
    return [{
      code: 'R3',
      severity: 'error',
      staffId: staff.id,
      message: `${staff.fullName} is scheduled for ${hours}h this week, above the 48h limit.`
    }]
  }

  if (hours > 40) {
    return [{
      code: 'R3',
      severity: 'warning',
      staffId: staff.id,
      message: `${staff.fullName} is scheduled for ${hours}h this week, above 40h.`
    }]
  }

  return []
}
