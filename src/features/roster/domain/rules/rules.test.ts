import { describe, expect, it } from 'vitest'
import { checkRestRule } from './restRule'
import { checkWeeklyHours } from './weeklyHoursRule'
import { checkIcuCertification } from './icuRule'
import { checkCoverage } from './coverageRule'
import { validateRoster } from './validateRoster'
import type { Roster, Staff } from '../entities'
import { weekDates } from '../../../../core/time/hospitalTime'

const staff: Staff = {
  id: 'S1',
  fullName: 'Priya S.',
  grade: 'SENIOR',
  icuCertExpiry: '2026-12-31',
  leaveDates: []
}

describe('domain rules', () => {
  it('detects less than 11 hours rest across midnight', () => {
    const cells = [
      { id: '1', staffId: 'S1', date: '2026-10-13', shift: 'N' as const, version: 1 },
      { id: '2', staffId: 'S1', date: '2026-10-14', shift: 'D' as const, version: 1 }
    ]
    expect(checkRestRule(staff, cells)).toHaveLength(1)
  })

  it('detects a Sunday night followed by Monday day in the next week', () => {
    const cells = [
      { id: '1', staffId: 'S1', date: '2026-10-18', shift: 'N' as const, version: 1 },
      { id: '2', staffId: 'S1', date: '2026-10-19', shift: 'D' as const, version: 1 }
    ]
    expect(checkRestRule(staff, cells)).toHaveLength(1)
  })

  it('warns above 40 weekly hours and errors above 48', () => {
    const cells = Array.from({ length: 6 }, (_, i) => ({ id: String(i), staffId: 'S1', date: `2026-10-${String(5 + i).padStart(2, '0')}`, shift: 'D' as const, version: 1 }))
    expect(checkWeeklyHours(staff, cells)[0]?.severity).toBe('warning')

    const seven = [...cells, { id: '7', staffId: 'S1', date: '2026-10-11', shift: 'D' as const, version: 1 }]
    expect(checkWeeklyHours(staff, seven)[0]?.severity).toBe('error')
  })

  it('rejects an ICU shift when certification expires on the shift date', () => {
    const person = { ...staff, icuCertExpiry: '2026-10-10' }
    const cells = [{ id: '1', staffId: 'S1', date: '2026-10-10', shift: 'D' as const, version: 1 }]
    expect(checkIcuCertification(person, cells, 'ICU')).toHaveLength(1)
  })

  it('checks coverage including senior counts', () => {
    const requirement = {
      ward: 'ICU' as const,
      shifts: { D: { total: 1, seniors: 1 }, E: { total: 0, seniors: 0 }, N: { total: 0, seniors: 0 } }
    }
    const cells = [{ id: '1', staffId: 'S1', date: '2026-10-12', shift: 'D' as const, version: 1 }]
    expect(checkCoverage('ICU', ['2026-10-12'], cells, [staff], requirement)).toHaveLength(0)
  })

  it('returns structured validation results for a roster', () => {
    const roster: Roster = {
      ward: 'ICU',
      week: '2026-W41',
      version: 1,
      published: false,
      cells: []
    }
    const requirement = {
      ward: 'ICU' as const,
      shifts: { D: { total: 1, seniors: 1 }, E: { total: 0, seniors: 0 }, N: { total: 1, seniors: 0 } }
    }
    const result = validateRoster(roster, [staff], requirement)
    expect(result.length).toBeGreaterThan(0)
    expect(weekDates('2026-W41')).toHaveLength(7)
  })
})
