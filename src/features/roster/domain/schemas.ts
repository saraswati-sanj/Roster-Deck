import { z } from 'zod'

const repeatedCharacters = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length >= 2 && new Set(trimmed).size === 1
}

export const shiftFormSchema = z.object({
  staffId: z.string().min(1, 'Select a nurse from this ward'),
  date: z.string().min(1, 'Date is required'),
  shift: z.enum(['D', 'E', 'N', 'L']),
  overrideNote: z.string().optional()
})

export const swapRejectSchema = z.object({
  reason: z.string()
    .trim()
    .min(15, 'Give a clear reason (min 15 characters)')
    .max(300, 'Reason must be 300 characters or less')
    .refine(value => !repeatedCharacters(value), 'Reason cannot be only repeated characters')
})

export const unpublishSchema = z.object({
  reason: z.string().trim().min(20, 'Unpublishing needs a reason (min 20 characters)')
})

export const wardSettingsSchema = z.object({
  D: z.object({ total: z.number().int().min(0).max(20), seniors: z.number().int().min(0).max(20) }),
  E: z.object({ total: z.number().int().min(0).max(20), seniors: z.number().int().min(0).max(20) }),
  N: z.object({ total: z.number().int().min(0).max(20), seniors: z.number().int().min(0).max(20) })
}).superRefine((value, ctx) => {
  for (const shift of ['D', 'E', 'N'] as const) {
    if (value[shift].seniors > value[shift].total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [shift, 'seniors'],
        message: `Seniors cannot exceed total (${value[shift].total})`
      })
    }
  }
})
