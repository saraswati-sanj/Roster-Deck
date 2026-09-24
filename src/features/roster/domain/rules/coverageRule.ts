import type { RosterCell, Staff, Violation, WardRequirement } from '../entities'

export function checkCoverage(
  ward: string,
  dates: string[],
  cells: RosterCell[],
  staff: Staff[],
  requirement: WardRequirement
): Violation[] {
  const result: Violation[] = []

  for (const date of dates) {
    for (const shift of ['D', 'E', 'N'] as const) {
      const assigned = cells.filter(c => c.date === date && c.shift === shift)
      const seniors = assigned.filter(c => staff.find(s => s.id === c.staffId)?.grade === 'SENIOR')
      const needed = requirement.shifts[shift]

      if (assigned.length < needed.total || seniors.length < needed.seniors) {
        result.push({
          code: 'R7',
          severity: 'warning',
          date,
          message: `${date} ${shift} coverage is ${assigned.length}/${needed.total} staff and ${seniors.length}/${needed.seniors} seniors.`
        })
      }
    }
  }

  return result
}
