import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rosterRepository } from '../../../roster/data/rosterRepository'
import { getStaffById } from '../../../roster/data/fakeApi'
import { swapRejectSchema } from '../../../roster/domain/schemas'
import type { SwapRequest } from '../../../roster/domain/entities'

export function SwapsPage() {
  const queryClient = useQueryClient()
  const { data: swaps = [], isLoading } = useQuery({ queryKey: ['swaps'], queryFn: rosterRepository.getSwaps })
  const [selected, setSelected] = useState<string[]>([])
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')

  const approve = useMutation({
    mutationFn: async (swap: SwapRequest) => rosterRepository.approveSwap(swap.id, crypto.randomUUID()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['swaps'] }),
    onError: error => setMessage(error instanceof Error ? error.message : 'Approve failed')
  })

  async function bulkApprove() {
    const targets = swaps.filter(swap => selected.includes(swap.id))
    await Promise.allSettled(targets.map(swap => approve.mutateAsync(swap)))
    setSelected([])
    queryClient.invalidateQueries({ queryKey: ['swaps'] })
  }

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rosterRepository.rejectSwap(id, reason),
    onSuccess: () => {
      setRejecting(null)
      setReason('')
      queryClient.invalidateQueries({ queryKey: ['swaps'] })
    },
    onError: error => setMessage(error instanceof Error ? error.message : 'Reject failed')
  })

  if (isLoading) return <div className="page-loading">Loading swap requests…</div>

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Swap requests</h1>
          <p>Approve or reject nurse-to-nurse shift swaps. Actions are idempotent.</p>
        </div>
        <button className="button primary" disabled={!selected.length} onClick={bulkApprove}>Approve selected ({selected.length})</button>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead><tr><th></th><th>From</th><th>To</th><th>Date</th><th>Shift</th><th>Actions</th></tr></thead>
          <tbody>
            {swaps.map(swap => (
              <tr key={swap.id}>
                <td><input type="checkbox" checked={selected.includes(swap.id)} onChange={e => setSelected(current => e.target.checked ? [...current, swap.id] : current.filter(id => id !== swap.id))} /></td>
                <td>{getStaffById(swap.fromStaffId)?.fullName ?? swap.fromStaffId}</td>
                <td>{getStaffById(swap.toStaffId)?.fullName ?? swap.toStaffId}</td>
                <td>{swap.date}</td>
                <td><span className={`mini-shift shift-${swap.shift}`}>{swap.shift}</span></td>
                <td className="action-row">
                  <button className="button small primary" onClick={() => approve.mutate(swap)}>Approve</button>
                  <button className="button small secondary" onClick={() => setRejecting(swap.id)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejecting && (
        <div className="modal-backdrop">
          <div className="modal card">
            <h2>Reject swap</h2>
            <label>
              Reason
              <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Give a clear reason (min 15 characters)" />
            </label>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setRejecting(null)}>Cancel</button>
              <button className="button primary" onClick={() => {
                const parsed = swapRejectSchema.safeParse({ reason })
                if (!parsed.success) {
                  setMessage(parsed.error.issues[0]?.message ?? 'Invalid reason')
                  return
                }
                reject.mutate({ id: rejecting, reason: parsed.data.reason })
              }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="toast" role="status">{message}<button onClick={() => setMessage('')}>×</button></div>}
    </section>
  )
}
