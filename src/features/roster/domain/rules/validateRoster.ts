import type { Roster, Staff, Violation, WardRequirement } from '../entities'
import { checkRestRule } from './restRule'
import { checkWeeklyHours } from './weeklyHoursRule'
import { checkIcuCertification } from './icuRule'
import { checkLeave } from './leaveRule'
import { checkNightStreak } from './nightRule'
import { checkCoverage } from './coverageRule'
import { weekDates } from '../../../../core/time/hospitalTime'

export function validateRoster(
  roster: Roster,
  staff: Staff[],
  requirement: WardRequirement
): Violation[] {
  const violations: Violation[] = []

  for (const person of staff) {
    violations.push(...checkRestRule(person, roster.cells))
    violations.push(...checkWeeklyHours(person, roster.cells))
    violations.push(...checkIcuCertification(person, roster.cells, roster.ward))
    violations.push(...checkLeave(person, roster.cells))
    violations.push(...checkNightStreak(person, roster.cells))
  }

  // R1: at most one non-leave shift per nurse per calendar day.
  for (const date of weekDates(roster.week)) {
    for (const person of staff) {
      const shifts = roster.cells.filter(c => c.staffId === person.id && c.date === date && c.shift && c.shift !== 'L')
      if (shifts.length > 1) {
        violations.push({
          code: 'R1',
          severity: 'error',
          staffId: person.id,
          date,
          message: `${person.fullName} has more than one shift on ${date}.`
        })
      }
    }
  }

violations.push(
  ...checkCoverage(
    roster.ward,
    weekDates(roster.week),
    roster.cells,
    staff,
    requirement
  ).map(v => ({
    ...v,
    severity: 'warning' as const
  }))
)
  return violations
}
