import { useRosterUiStore } from '../hooks/useRosterUiStore'
import { useSearchParams } from 'react-router-dom'
import { useRosterQuery } from '../hooks/useRosterQuery'
import { simulateAnotherManager } from '../../data/fakeApi'
import { useQueryClient } from '@tanstack/react-query'

export function DevPanel() {
  const store = useRosterUiStore()
  const [params] = useSearchParams()
  const ward = (params.get('ward') as 'ICU' | 'WARD_A' | 'WARD_B') || 'ICU'
  const week = params.get('week') || '2026-W41'
  const queryClient = useQueryClient()
  const { data } = useRosterQuery(ward, week)

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Developer panel</h1>
          <p>These controls intentionally make the fake API behave badly so concurrency handling can be reviewed.</p>
        </div>
      </div>

      <div className="card dev-grid">
        <label className="toggle-row">
          <span>
            <strong>Simulate offline</strong>
            <small>Writes fail with a 503-style error.</small>
          </span>
          <input type="checkbox" checked={store.offline} onChange={e => store.setOffline(e.target.checked)} />
        </label>

        <label className="toggle-row">
          <span>
            <strong>Another manager edits a random cell</strong>
            <small>Useful for reproducing a 409 version conflict.</small>
          </span>
          <input type="checkbox" checked={store.anotherManager} onChange={e => store.setAnotherManager(e.target.checked)} />
        </label>

        <label className="toggle-row">
          <span>
            <strong>Fail next write</strong>
            <small>One write fails so the optimistic rollback can be tested.</small>
          </span>
          <input type="checkbox" checked={store.failNextWrite} onChange={e => store.setFailNextWrite(e.target.checked)} />
        </label>

        <button
          className="button secondary"
          onClick={() => {
            const cell = data?.cells[0]
            if (cell) {
              simulateAnotherManager(ward, week, cell.id)
              queryClient.invalidateQueries({ queryKey: ['roster', ward, week] })
            }
          }}
        >
          Edit first cell as another manager
        </button>
      </div>
    </section>
  )
}
