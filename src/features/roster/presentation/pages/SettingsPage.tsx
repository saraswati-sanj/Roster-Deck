import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { wardSettingsSchema } from '../../domain/schemas'
import { rosterRepository } from '../../data/rosterRepository'
import type { WardCode } from '../../domain/entities'

export function SettingsPage() {
  const [ward, setWard] = useState<WardCode>('ICU')
  const [values, setValues] = useState(rosterRepository.getRequirement('ICU'))
  const [message, setMessage] = useState('')

  useEffect(() => {
    setValues(rosterRepository.getRequirement(ward))
    setMessage('')
  }, [ward])

  const mutation = useMutation({
    mutationFn: () => {
      const parsed = wardSettingsSchema.parse(values.shifts)
      return rosterRepository.updateRequirements(ward, { ward, shifts: parsed })
    },
    onSuccess: () => setMessage('Ward settings saved.')
  })

  function update(shift: 'D' | 'E' | 'N', field: 'total' | 'seniors', value: number) {
    setValues(current => ({
      ...current,
      shifts: {
        ...current.shifts,
        [shift]: { ...current.shifts[shift], [field]: value }
      }
    }))
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Ward settings</h1>
          <p>Staffing requirements are validated as cross-field values.</p>
        </div>
      </div>

      <div className="card settings-card">
        <label>
          Ward
          <select value={ward} onChange={e => setWard(e.target.value as WardCode)}>
            <option value="ICU">ICU</option>
            <option value="WARD_A">Ward A</option>
            <option value="WARD_B">Ward B</option>
          </select>
        </label>

        <div className="settings-table">
          <div className="settings-head"><span>Shift</span><span>Total nurses</span><span>Seniors</span></div>
          {(['D', 'E', 'N'] as const).map(shift => (
            <div className="settings-row" key={shift}>
              <strong>{shift}</strong>
              <input type="number" min="0" max="20" value={values.shifts[shift].total} onChange={e => update(shift, 'total', Number(e.target.value))} />
              <input type="number" min="0" max="20" value={values.shifts[shift].seniors} onChange={e => update(shift, 'seniors', Number(e.target.value))} />
            </div>
          ))}
        </div>

        {ward === 'ICU' && values.shifts.N.total < 1 && <div className="inline-error">ICU needs at least 1 nurse at night.</div>}

        <button
          className="button primary"
          onClick={() => {
            if (ward === 'ICU' && values.shifts.N.total < 1) {
              setMessage('ICU needs at least 1 nurse at night.')
              return
            }
            try { mutation.mutate() }
            catch (error) { setMessage(error instanceof Error ? error.message : 'Invalid settings') }
          }}
        >
          Save settings
        </button>
        {message && <div className="success-note">{message}</div>}
      </div>
    </section>
  )
}
