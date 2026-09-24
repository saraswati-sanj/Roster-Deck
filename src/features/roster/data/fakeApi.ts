import { ApiError } from '../../../core/api/errors'
import { addDays, weekDates } from '../../../core/time/hospitalTime'
import type { Roster, ShiftValue, Staff, SwapRequest, WardCode, WardRequirement } from '../domain/entities'

const wards: WardCode[] = ['ICU', 'WARD_A', 'WARD_B']

const requirements: Record<WardCode, WardRequirement> = {
  ICU: {
    ward: 'ICU',
    shifts: {
      D: { total: 4, seniors: 1 },
      E: { total: 4, seniors: 1 },
      N: { total: 3, seniors: 1 }
    }
  },
  WARD_A: {
    ward: 'WARD_A',
    shifts: {
      D: { total: 3, seniors: 1 },
      E: { total: 3, seniors: 1 },
      N: { total: 2, seniors: 1 }
    }
  },
  WARD_B: {
    ward: 'WARD_B',
    shifts: {
      D: { total: 3, seniors: 1 },
      E: { total: 3, seniors: 1 },
      N: { total: 2, seniors: 1 }
    }
  }
}

const staff: Staff[] = Array.from({ length: 60 }, (_, index) => {
  const ward = wards[index % wards.length]
  const senior = index % 5 === 0
  return {
    id: `S${String(index + 1).padStart(3, '0')}`,
    fullName: ['Sanjana Sharma', 'Varchas Uttaman', 'Anuvid Mishra', 'Pravin Singh', 'Amina Khatoon', 'Showrya shetty'][index % 6] + ` ${Math.floor(index / 6) + 1}`,
    grade: senior ? 'SENIOR' : 'JUNIOR',
    icuCertExpiry: ward === 'ICU' ? (index % 7 === 0 ? '2026-10-08' : '2026-12-31') : null,
    leaveDates: index % 11 === 0 ? ['2026-10-14'] : []
  }
})

type ServerState = {
  rosters: Map<string, Roster>
  cellVersions: Map<string, number>
  swaps: SwapRequest[]
  idempotency: Map<string, unknown>
}

const state: ServerState = {
  rosters: new Map(),
  cellVersions: new Map(),
  swaps: [
    { id: 'SW1', fromStaffId: 'S001', toStaffId: 'S002', date: '2026-10-13', shift: 'N', status: 'PENDING' },
    { id: 'SW2', fromStaffId: 'S003', toStaffId: 'S004', date: '2026-10-14', shift: 'D', status: 'PENDING' },
    { id: 'SW3', fromStaffId: 'S005', toStaffId: 'S006', date: '2026-10-15', shift: 'E', status: 'PENDING' },
    { id: 'SW4', fromStaffId: 'S007', toStaffId: 'S008', date: '2026-10-16', shift: 'D', status: 'PENDING' },
    { id: 'SW5', fromStaffId: 'S009', toStaffId: 'S010', date: '2026-10-17', shift: 'N', status: 'PENDING' }
  ],
  idempotency: new Map()
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(new DOMException('Request aborted', 'AbortError'))
    }, { once: true })
  })
}

function key(ward: WardCode, week: string) {
  return `${ward}:${week}`
}

function ensureRoster(ward: WardCode, week: string): Roster {
  const rosterKey = key(ward, week)
  const existing = state.rosters.get(rosterKey)
  if (existing) return structuredClone(existing)

  const dates = weekDates(week)
  const wardStaff = staff.filter(person => {
    const index = Number(person.id.slice(1))
    return wards[(index - 1) % wards.length] === ward
  })

  const cells = wardStaff.flatMap((person, personIndex) =>
    dates.map((date, dayIndex) => ({
      id: `${person.id}-${date}`,
      staffId: person.id,
      date,
      shift: ((personIndex + dayIndex) % 7 === 0 ? 'N' : ((personIndex + dayIndex) % 3 === 0 ? 'D' : null)) as ShiftValue,
      version: 1
    }))
  )

  const roster: Roster = { ward, week, version: 1, published: false, cells }
  state.rosters.set(rosterKey, roster)
  return structuredClone(roster)
}

function maybeFailWrite() {
  if (sessionStorage.getItem('rosterdesk-fail-next-write') === '1') {
    sessionStorage.removeItem('rosterdesk-fail-next-write')
    throw new ApiError('Simulated write failure', 500)
  }
  if (Math.random() < 0.15) throw new ApiError('Random simulated server failure', 500)
}

export async function getWards(): Promise<WardCode[]> {
  await delay(350)
  return wards
}

export async function getStaff(
  ward: WardCode,
  query: string,
  signal?: AbortSignal
): Promise<Staff[]> {
  const wait = Math.max(300, 1300 - query.length * 180)
  await delay(wait, signal)
  const normalized = query.trim().toLowerCase()
  return staff
    .filter(person => wards[(Number(person.id.slice(1)) - 1) % wards.length] === ward)
    .filter(person => !normalized || person.fullName.toLowerCase().includes(normalized))
    .slice(0, 30)
    .map(person => structuredClone(person))
}

export async function getRoster(ward: WardCode, week: string): Promise<Roster> {
  await delay(500 + Math.random() * 500)
  return ensureRoster(ward, week)
}

export async function updateCell(
  ward: WardCode,
  week: string,
  cellId: string,
  shift: ShiftValue,
  expectedVersion: number,
  idempotencyKey: string
): Promise<Roster> {
  if (state.idempotency.has(idempotencyKey)) {
    return structuredClone(state.idempotency.get(idempotencyKey) as Roster)
  }

  await delay(500 + Math.random() * 500)
  maybeFailWrite()

  const roster = ensureRoster(ward, week)
  const cell = roster.cells.find(item => item.id === cellId)
  if (!cell) throw new ApiError('Cell not found', 404)
  if (cell.version !== expectedVersion) {
    throw new ApiError('Roster changed by another manager', 409, { current: structuredClone(cell) })
  }

  cell.shift = shift
  cell.version += 1
  roster.version += 1
  state.rosters.set(key(ward, week), roster)
  state.idempotency.set(idempotencyKey, structuredClone(roster))
  return structuredClone(roster)
}

export async function getSwaps(): Promise<SwapRequest[]> {
  await delay(400)
  return structuredClone(state.swaps.filter(swap => swap.status === 'PENDING'))
}

export async function approveSwap(id: string, idempotencyKey: string): Promise<SwapRequest> {
  if (state.idempotency.has(idempotencyKey)) return structuredClone(state.idempotency.get(idempotencyKey) as SwapRequest)
  await delay(500)
  maybeFailWrite()
  const swap = state.swaps.find(item => item.id === id)
  if (!swap) throw new ApiError('Swap not found', 404)
  if (swap.status !== 'PENDING') return structuredClone(swap)
  swap.status = 'APPROVED'
  state.idempotency.set(idempotencyKey, structuredClone(swap))
  return structuredClone(swap)
}

export async function rejectSwap(id: string, reason: string): Promise<SwapRequest> {
  await delay(500)
  maybeFailWrite()
  const swap = state.swaps.find(item => item.id === id)
  if (!swap) throw new ApiError('Swap not found', 404)
  swap.status = 'REJECTED'
  swap.reason = reason
  return structuredClone(swap)
}

export async function publishRoster(ward: WardCode, week: string, expectedVersion: number, idempotencyKey: string): Promise<Roster> {
  if (state.idempotency.has(idempotencyKey)) return structuredClone(state.idempotency.get(idempotencyKey) as Roster)
  await delay(600)
  const roster = ensureRoster(ward, week)
  if (roster.version !== expectedVersion) throw new ApiError('Roster changed by another manager', 409, { current: roster })
  maybeFailWrite()
  roster.published = true
  state.rosters.set(key(ward, week), roster)
  state.idempotency.set(idempotencyKey, structuredClone(roster))
  return structuredClone(roster)
}

export async function updateRequirements(ward: WardCode, next: WardRequirement): Promise<WardRequirement> {
  await delay(450)
  requirements[ward] = structuredClone(next)
  return structuredClone(next)
}

export function getRequirement(ward: WardCode): WardRequirement {
  return structuredClone(requirements[ward])
}

export function getStaffById(id: string): Staff | undefined {
  return staff.find(person => person.id === id)
}

export function simulateAnotherManager(ward: WardCode, week: string, cellId: string) {
  const roster = ensureRoster(ward, week)
  const cell = roster.cells.find(item => item.id === cellId)
  if (!cell) return
  cell.shift = cell.shift === 'D' ? 'E' : 'D'
  cell.version += 1
  roster.version += 1
  state.rosters.set(key(ward, week), roster)
}

export function clearFakeApi() {
  state.rosters.clear()
  state.idempotency.clear()
  state.swaps.forEach(s => {
    s.status = 'PENDING'
    delete s.reason
  })
}
