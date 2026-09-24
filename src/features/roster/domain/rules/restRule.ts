import { addDays, hoursBetween } from '../../../../core/time/hospitalTime'
import type { RosterCell, Staff, Violation } from '../entities'

const startHour: Record<string, number> = { D: 7, E: 15, N: 23 }
const duration: Record<string, number> = { D: 8, E: 8, N: 8 }

function interval(date: string, shift: string): { start: Date; end: Date } {
  const start = new Date(`${date}T${String(startHour[shift]).padStart(2, '0')}:00:00+05:30`)
  const end = new Date(start.getTime() + duration[shift] * 3_600_000)
  return { start, end }
}

export function checkRestRule(staff: Staff, cells: RosterCell[]): Violation[] {
  const shifts = cells
    .filter(c => c.staffId === staff.id && c.shift && c.shift !== 'L')
    .sort((a, b) => a.date.localeCompare(b.date))

  const violations: Violation[] = []
  for (let i = 0; i < shifts.length - 1; i++) {
    const current = shifts[i]
    const next = shifts[i + 1]
    const currentInterval = interval(current.date, current.shift!)
    const nextInterval = interval(next.date, next.shift!)
    const rest = hoursBetween(currentInterval.end, nextInterval.start)

    if (rest < 11) {
      violations.push({
        code: 'R2',
        severity: 'error',
        staffId: staff.id,
        date: next.date,
        message: `${staff.fullName} has only ${Math.max(0, rest).toFixed(0)}h rest between ${current.shift} (${current.date}) and ${next.shift} (${next.date}).`
      })
    }
  }

  return violations
}
