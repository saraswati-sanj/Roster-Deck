import type { RosterCell, Staff, Violation } from '../entities'

export function checkNightStreak(staff: Staff, cells: RosterCell[]): Violation[] {
  const nights = cells
    .filter(c => c.staffId === staff.id && c.shift === 'N')
    .sort((a, b) => a.date.localeCompare(b.date))

  let streak = 1
  const result: Violation[] = []

  for (let i = 1; i < nights.length; i++) {
    const previous = new Date(`${nights[i - 1].date}T00:00:00Z`)
    const current = new Date(`${nights[i].date}T00:00:00Z`)
    const diff = Math.round((current.getTime() - previous.getTime()) / 86_400_000)

    if (diff === 1) streak += 1
    else streak = 1

    if (streak > 3) {
      result.push({
        code: 'R6',
        severity: 'warning',
        staffId: staff.id,
        date: nights[i].date,
        message: `${staff.fullName} has more than 3 consecutive Night shifts.`
      })
      break
    }
  }

  return result
}
