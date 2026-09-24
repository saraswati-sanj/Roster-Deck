import type { RosterCell, Staff, Violation } from '../entities'

export function checkLeave(staff: Staff, cells: RosterCell[]): Violation[] {
  return cells
    .filter(c => c.staffId === staff.id && c.shift && c.shift !== 'L' && staff.leaveDates.includes(c.date))
    .map(c => ({
      code: 'R5',
      severity: 'error' as const,
      staffId: staff.id,
      date: c.date,
      message: `${staff.fullName} has approved leave on ${c.date}.`
    }))
}
