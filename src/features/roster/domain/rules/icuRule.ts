import type { RosterCell, Staff, Violation } from '../entities'

export function checkIcuCertification(staff: Staff, cells: RosterCell[], ward: string): Violation[] {
  if (ward !== 'ICU') return []

  return cells
    .filter(c => c.staffId === staff.id && c.shift && c.shift !== 'L')
    .filter(c => !staff.icuCertExpiry || staff.icuCertExpiry <= c.date)
    .map(c => ({
      code: 'R4',
      severity: 'error' as const,
      staffId: staff.id,
      date: c.date,
      message: `${staff.fullName} is not ICU-certified for ${c.date}; certification expiry is ${staff.icuCertExpiry ?? 'missing'}.`
    }))
}
