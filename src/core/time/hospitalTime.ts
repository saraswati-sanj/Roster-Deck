export const HOSPITAL_TIME_ZONE = 'Asia/Kolkata'

export function isoWeekToMonday(isoWeek: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(isoWeek)
  if (!match) return '2026-10-05'
  const year = Number(match[1])
  const week = Number(match[2])
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const day = jan4.getUTCDay() || 7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7)
  return monday.toISOString().slice(0, 10)
}

export function weekDates(isoWeek: string): string[] {
  const monday = isoWeekToMonday(isoWeek)
  const start = new Date(`${monday}T00:00:00Z`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    return date.toISOString().slice(0, 10)
  })
}

export function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC'
  }).format(new Date(`${date}T12:00:00Z`))
}

export function addDays(date: string, amount: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + amount)
  return d.toISOString().slice(0, 10)
}

export function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 3_600_000
}
