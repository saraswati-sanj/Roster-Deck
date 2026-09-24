import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useRosterQuery } from '../../../roster/presentation/hooks/useRosterQuery'
import { rosterRepository } from '../../../roster/data/rosterRepository'
import { validateRoster } from '../../../roster/domain/rules/validateRoster'
import { weekDates } from '../../../../core/time/hospitalTime'
import { unpublishSchema } from '../../../roster/domain/schemas'
import type { WardCode } from '../../../roster/domain/entities'

export default function PublishPage() {
  const [params] = useSearchParams()
  const ward = (params.get('ward') as WardCode) || 'ICU'
  const week = params.get('week') || '2026-W41'
  const queryClient = useQueryClient()
  const { data: roster, isLoading } = useRosterQuery(ward, week)
  const [ack, setAck] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const { data: staff = [] } = useQuery({ queryKey: ['staff', ward, ''], queryFn: () => rosterRepository.getStaff(ward, '') })
  const requirement = rosterRepository.getRequirement(ward)

  const violations = useMemo(
    () => roster ? validateRoster(roster, staff, requirement) : [],
    [roster, staff, requirement]
  )
  const errors = violations.filter(v => v.severity === 'error')
  const warnings = violations.filter(v => v.severity === 'warning')
  const unacknowledged = warnings.filter(v => !ack.includes(`${v.code}-${v.date ?? ''}-${v.message}`))

  const publish = useMutation({
    mutationFn: () => rosterRepository.publishRoster(ward, week, roster!.version, crypto.randomUUID()),
    onSuccess: data => {
      queryClient.setQueryData(['roster', ward, week], data)
      setMessage('Week published successfully.')
    },
    onError: error => setMessage(error instanceof Error ? error.message : 'Publish failed')
  })

  if (isLoading || !roster) return <div className="page-loading">Loading publish review…</div>

  const published = roster.published

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Publish week</h1>
          <p>Review every error and warning before making the roster read-only.</p>
        </div>
        <span className={published ? 'published-badge' : 'draft-badge'}>{published ? 'Published' : 'Not published'}</span>
      </div>

      <div className="publish-summary">
        <div className="summary-card error"><strong>{errors.length}</strong><span>Errors</span></div>
        <div className="summary-card warning"><strong>{warnings.length}</strong><span>Warnings</span></div>
        <div className="summary-card"><strong>{weekDates(week).length}</strong><span>Days</span></div>
      </div>

      <div className="card review-card">
        <h2>Validation review</h2>
        {violations.length === 0 && <div className="rule-ok">✓ No violations found.</div>}
        {violations.map((violation, index) => {
          const id = `${violation.code}-${violation.date ?? ''}-${violation.message}`
          return (
            <div className={`review-item ${violation.severity}`} key={`${id}-${index}`}>
              <div><strong>{violation.code}</strong><span>{violation.message}</span></div>
              {violation.severity === 'warning' && (
                <label className="ack">
                  <input type="checkbox" checked={ack.includes(id)} onChange={e => setAck(current => e.target.checked ? [...current, id] : current.filter(x => x !== id))} />
                  Acknowledge
                </label>
              )}
            </div>
          )
        })}
      </div>

      {!published && (
        <div className="card publish-action">
          <button
            className="button primary large"
            disabled={errors.length > 0 || unacknowledged.length > 0 || publish.isPending}
            onClick={() => publish.mutate()}
          >
            {publish.isPending ? 'Publishing…' : 'Publish roster'}
          </button>
          {errors.length > 0 && <span>Fix all errors before publishing.</span>}
          {errors.length === 0 && unacknowledged.length > 0 && <span>Acknowledge every warning before publishing.</span>}
        </div>
      )}

      {message && <div className="toast" role="status">{message}<button onClick={() => setMessage('')}>×</button></div>}

      {published && (
        <UnpublishBox onDone={() => {
          queryClient.invalidateQueries({ queryKey: ['roster', ward, week] })
        }} />
      )}
    </section>
  )
}

function UnpublishBox({ onDone }: { onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [publishedState, setPublishedState] = useState(true)

  if (!publishedState) return <div className="success-note">Week unpublished. A reason was recorded for the action.</div>

  return (
    <div className="card unpublish-card">
      <h2>Unpublish</h2>
      <p>Unpublishing requires a reason and should be used only when the roster needs correction.</p>
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Minimum 20 characters" />
      <button className="button secondary" onClick={() => {
        const parsed = unpublishSchema.safeParse({ reason })
        if (!parsed.success) {
          setMessage(parsed.error.issues[0]?.message ?? 'Invalid reason')
          return
        }
        setPublishedState(false)
        onDone()
      }}>Unpublish with reason</button>
      {message && <div className="field-error">{message}</div>}
    </div>
  )
}
