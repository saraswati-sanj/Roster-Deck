import { z } from 'zod'

export const viewParamsSchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/).default('2026-W41'),
  ward: z.enum(['ICU', 'WARD_A', 'WARD_B']).default('ICU'),
  role: z.enum(['ALL', 'SENIOR', 'JUNIOR']).default('ALL'),
  q: z.string().max(40).default('')
})

export type ViewParams = z.infer<typeof viewParamsSchema>

export function parseViewParams(search: string): ViewParams {
  const params = new URLSearchParams(search)
  return viewParamsSchema.parse({
    week: params.get('week') ?? undefined,
    ward: params.get('ward') ?? undefined,
    role: params.get('role') ?? undefined,
    q: params.get('q') ?? undefined
  })
}

export function toSearchParams(params: ViewParams): string {
  const search = new URLSearchParams()
  search.set('week', params.week)
  search.set('ward', params.ward)
  search.set('role', params.role)
  if (params.q) search.set('q', params.q)
  return `?${search.toString()}`
}
