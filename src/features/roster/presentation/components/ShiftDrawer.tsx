import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shiftFormSchema } from '../../domain/schemas'
import { previewCellChange } from '../../domain/usecases/updateCell'
import { rosterRepository } from '../../data/rosterRepository'
import { useRosterUiStore } from '../hooks/useRosterUiStore'
import type { Roster, Staff, ShiftValue } from '../../domain/entities'
import { ApiError } from '../../../../core/api/errors'

type FormValues = {
  staffId: string
  date: string
  shift: 'D' | 'E' | 'N' | 'L'
  overrideNote?: string
}

interface Props {
  roster: Roster
  staff: Staff[]
  dates: string[]
  selectedCellId: string | null
  open: boolean
  onClose: () => void
  onSaved: () => void
  onConflict: () => void
  onFailure: () => void
}

export function ShiftDrawer({ roster, staff, dates, selectedCellId, open, onClose, onSaved, onConflict, onFailure }: Props) {
  const queryClient = useQueryClient()
  const { setDirty, offline, anotherManager } = useRosterUiStore()
  const cell = roster.cells.find(item => item.id === selectedCellId)

  const selectedStaff = staff.find(person => person.id === cell?.staffId)
  const form = useForm<FormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      staffId: cell?.staffId ?? '',
      date: cell?.date ?? dates[0],
      shift: (cell?.shift === 'L' || cell?.shift === 'D' || cell?.shift === 'E' || cell?.shift === 'N') ? cell.shift : 'D',
      overrideNote: ''
    },
    mode: 'onBlur'
  })

  useEffect(() => {
    if (!cell) return
    form.reset({
      staffId: cell.staffId,
      date: cell.date,
      shift: (cell.shift === 'L' || cell.shift === 'D' || cell.shift === 'E' || cell.shift === 'N') ? cell.shift : 'D',
      overrideNote: ''
    })
    setDirty(false)
  }, [cell?.id, cell?.version])

  const watched = form.watch()
  const previewViolations = useMemo(() => {
    if (!watched.staffId || !watched.date || !watched.shift) return []
    const selected = staff.find(person => person.id === watched.staffId)
    if (!selected) return []
    return previewCellChange(
      roster,
      watched.staffId,
      watched.date,
      watched.shift as ShiftValue,
      [selected],
      rosterRequirement(roster.ward)
    )
  }, [watched.staffId, watched.date, watched.shift, roster, staff])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!cell) throw new Error('Cell not selected')
      if (offline) throw new ApiError('Offline simulation is enabled', 503)
      if (anotherManager) {
        const { simulateAnotherManager } = await import('../../data/fakeApi')
        simulateAnotherManager(roster.ward, roster.week, cell.id)
      }
      return rosterRepository.updateCell(
        roster.ward,
        roster.week,
        cell.id,
        values.shift,
        cell.version,
        crypto.randomUUID()
      )
    },
    onMutate: async (values) => {
      if (!cell) return
      const key = ['roster', roster.ward, roster.week]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Roster>(key)
      queryClient.setQueryData<Roster>(key, old => old ? ({
        ...old,
        cells: old.cells.map(item => item.id === cell.id ? { ...item, shift: values.shift } : item)
      }) : old)
      return { previous }
    },
    onError: (error, _values, context) => {
      queryClient.setQueryData(['roster', roster.ward, roster.week], context?.previous)
      if (error instanceof ApiError && error.status === 409) onConflict()
      else onFailure()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['roster', roster.ward, roster.week], data)
      setDirty(false)
      onSaved()
      onClose()
    }
  })

  if (!open) return null

  async function submit(values: FormValues) {
    const warnings = previewViolations.filter(v => v.severity === 'warning')
    if (warnings.length > 0 && (values.overrideNote ?? '').trim().length < 10) {
      form.setError('overrideNote', { message: 'Explain why this warning is acceptable (min 10 characters)' })
      return
    }
    await mutation.mutateAsync(values)
  }

  return (
    <div className="drawer-backdrop" role="presentation">
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="shift-drawer-title">
        <div className="drawer-header">
          <div>
            <h2 id="shift-drawer-title">Edit shift</h2>
            <p>Rules are checked before the write.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close drawer">×</button>
        </div>

        <form onSubmit={form.handleSubmit(submit)} className="drawer-form">
          <label>
            Staff
            <select {...form.register('staffId')} aria-describedby="staff-error">
              {staff.map(person => <option key={person.id} value={person.id}>{person.fullName} · {person.grade}</option>)}
            </select>
            {form.formState.errors.staffId && <span id="staff-error" className="field-error">{form.formState.errors.staffId.message}</span>}
          </label>

          <label>
            Date
            <select {...form.register('date')} aria-describedby="date-error">
              {dates.map(date => <option key={date} value={date}>{date}</option>)}
            </select>
            {form.formState.errors.date && <span id="date-error" className="field-error">{form.formState.errors.date.message}</span>}
          </label>

          <label>
            Shift
            <select {...form.register('shift')} aria-describedby="shift-error">
              <option value="D">Day · 07:00–15:00</option>
              <option value="E">Evening · 15:00–23:00</option>
              <option value="N">Night · 23:00–07:00</option>
              <option value="L">Leave</option>
            </select>
            {form.formState.errors.shift && <span id="shift-error" className="field-error">{form.formState.errors.shift.message}</span>}
          </label>

          <div className="rule-preview">
            <div className="rule-preview-title">Live rule check</div>
            {previewViolations.length === 0 ? (
              <div className="rule-ok">✓ No rule violations for this change</div>
            ) : previewViolations.map((violation, index) => (
              <div key={`${violation.code}-${index}`} className={`violation ${violation.severity}`}>
                <strong>{violation.code}</strong>
                <span>{violation.message}</span>
              </div>
            ))}
          </div>

          <label>
            Override note
            <textarea
              rows={3}
              placeholder="Required when saving with a warning"
              {...form.register('overrideNote')}
              onChange={e => {
                form.register('overrideNote').onChange(e)
                setDirty(e.target.value.length > 0)
              }}
            />
            {form.formState.errors.overrideNote && <span className="field-error">{form.formState.errors.overrideNote.message}</span>}
          </label>

          {selectedStaff?.leaveDates.length ? (
            <div className="small-note">Approved leave: {selectedStaff.leaveDates.join(', ')}</div>
          ) : null}

          <div className="drawer-actions">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button primary" disabled={mutation.isPending || roster.published}>
              {mutation.isPending ? 'Saving…' : 'Save shift'}
            </button>
          </div>

          {mutation.error && <div className="inline-error">{mutation.error instanceof Error ? mutation.error.message : 'Save failed'}</div>}
        </form>
      </aside>
    </div>
  )
}

function rosterRequirement(ward: Roster['ward']) {
  return rosterRequirementCache[ward]
}

const rosterRequirementCache = {
  ICU: { ward: 'ICU' as const, shifts: { D: { total: 4, seniors: 1 }, E: { total: 4, seniors: 1 }, N: { total: 3, seniors: 1 } } },
  WARD_A: { ward: 'WARD_A' as const, shifts: { D: { total: 3, seniors: 1 }, E: { total: 3, seniors: 1 }, N: { total: 2, seniors: 1 } } },
  WARD_B: { ward: 'WARD_B' as const, shifts: { D: { total: 3, seniors: 1 }, E: { total: 3, seniors: 1 }, N: { total: 2, seniors: 1 } } }
}
