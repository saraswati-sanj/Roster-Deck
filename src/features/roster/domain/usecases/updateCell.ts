import type { Roster, ShiftValue } from '../entities'
import { validateRoster } from '../rules/validateRoster'

export function previewCellChange(
  roster: Roster,
  staffId: string,
  date: string,
  shift: ShiftValue,
  staff: Parameters<typeof validateRoster>[1],
  requirement: Parameters<typeof validateRoster>[2]
) {
  const nextCells = roster.cells.map(cell =>
    cell.staffId === staffId && cell.date === date
      ? { ...cell, shift }
      : cell
  )

  return validateRoster({ ...roster, cells: nextCells }, staff, requirement)
}
