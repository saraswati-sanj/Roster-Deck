import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { parseViewParams } from '../../../../core/url/searchParams'
import { formatDay, weekDates } from '../../../../core/time/hospitalTime'

import { useRosterQuery } from '../hooks/useRosterQuery'
import { useStaffSearch } from '../hooks/useStaffSearch'
import { useRosterUiStore } from '../hooks/useRosterUiStore'

import { getStaffById } from '../../data/fakeApi'
import type { ShiftCode } from '../../domain/entities'

import { ShiftDrawer } from '../components/ShiftDrawer'
import { Toast } from '../components/Toast'

export function RosterPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => {
    try {
      return parseViewParams(`?${searchParams.toString()}`)
    } catch {
      return parseViewParams('')
    }
  }, [searchParams])

  const {
    data: roster,
    isLoading,
    isFetching,
    error,
    refetch
  } = useRosterQuery(params.ward, params.week)

  const { data: staff = [] } = useStaffSearch(params.ward, params.q)

  const [toast, setToast] = useState<string | null>(null)

  const {
    drawerOpen,
    selectedCellId,
    setDrawer
  } = useRosterUiStore()

  const dates = weekDates(params.week)

  /*
   * Staff returned by the search API.
   * Search starts when the query contains at least 2 characters.
   */
  const visibleStaff = useMemo(() => {
    const source = params.q.trim().length >= 2 ? staff : []

    return source.filter(
      person =>
        params.role === 'ALL' ||
        person.grade === params.role
    )
  }, [params.q, params.role, staff])

  /*
   * When there is no search query, show the staff already
   * present in the current roster.
   */
  const fallbackStaff = useMemo(() => {
    if (!roster) {
      return []
    }

    const ids = new Set(
      roster.cells.map(cell => cell.staffId)
    )

    return Array.from(ids)
      .map(id => getStaffById(id))
      .filter(
        (person): person is NonNullable<typeof person> =>
          Boolean(person)
      )
      .filter(
        person =>
          params.role === 'ALL' ||
          person.grade === params.role
      )
  }, [roster, params.role])

  const rows =
    params.q.trim().length >= 2
      ? visibleStaff
      : fallbackStaff

  /*
   * Updates the URL search parameters.
   * The URL is the source of truth for view state.
   */
  function updateParam(
    name: string,
    value: string
  ) {
    const next = new URLSearchParams(searchParams)

    if (value) {
      next.set(name, value)
    } else {
      next.delete(name)
    }

    setSearchParams(next)
  }

  /*
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="page-loading">
        Loading roster…
      </div>
    )
  }

  /*
   * Error state
   */
  if (error || !roster) {
    return (
      <div className="card error-card">
        <strong>
          Could not load roster.
        </strong>

        <button onClick={() => refetch()}>
          Retry
        </button>
      </div>
    )
  }

  /*
   * Faster lookup for roster cells.
   */
  const cellMap = new Map(
    roster.cells.map(cell => [
      `${cell.staffId}-${cell.date}`,
      cell
    ])
  )

  return (
    <section>
      {/* PAGE HEADER */}
      <div className="page-heading">
        <div>
          <h1>Roster board</h1>

          <p>
            Plan shifts, review coverage and fix
            rule violations before publishing.
          </p>
        </div>

        <div className="heading-meta">
          {isFetching && (
            <span className="syncing">
              Syncing…
            </span>
          )}

          <span
            className={
              roster.published
                ? 'published-badge'
                : 'draft-badge'
            }
          >
            {roster.published
              ? 'Published · read-only'
              : 'Draft'}
          </span>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters card">
        <label>
          Week

          <input
            value={params.week}
            onChange={event =>
              updateParam(
                'week',
                event.target.value
              )
            }
            aria-label="Week"
          />
        </label>

        <label>
          Ward

          <select
            value={params.ward}
            onChange={event =>
              updateParam(
                'ward',
                event.target.value
              )
            }
          >
            <option value="ICU">
              ICU
            </option>

            <option value="WARD_A">
              Ward A
            </option>

            <option value="WARD_B">
              Ward B
            </option>
          </select>
        </label>

        <label>
          Role

          <select
            value={params.role}
            onChange={event =>
              updateParam(
                'role',
                event.target.value
              )
            }
          >
            <option value="ALL">
              All roles
            </option>

            <option value="SENIOR">
              Senior
            </option>

            <option value="JUNIOR">
              Junior
            </option>
          </select>
        </label>

        <label className="search-field">
          Staff search

          <input
            value={params.q}
            maxLength={40}
            placeholder="Type at least 2 characters"
            onChange={event =>
              updateParam(
                'q',
                event.target.value.trimStart()
              )
            }
          />
        </label>
      </div>

      {/* WEEKLY COVERAGE SUMMARY */}
      <div className="coverage-strip">
        {(['D', 'E', 'N'] as const).map(
          shift => {
            const count = roster.cells.filter(
              cell => cell.shift === shift
            ).length

            return (
              <div
                key={shift}
                className="coverage-card"
              >
                <span>{shift}</span>

                <strong>{count}</strong>

                <small>
                  assigned this week
                </small>
              </div>
            )
          }
        )}
      </div>

      {/* DAILY COVERAGE */}
      <div className="coverage-days card">
        <div className="coverage-days-title">
          Daily coverage
        </div>

        <div className="coverage-days-grid">
          {dates.map(date => (
            <div
              className="coverage-day"
              key={date}
            >
              <strong>
                {formatDay(date)}
              </strong>

              {(['D', 'E', 'N'] as const).map(
                shift => {
                  const assigned =
                    roster.cells.filter(
                      cell =>
                        cell.date === date &&
                        cell.shift === shift
                    ).length

                  const required = {
                    D: 4,
                    E: 4,
                    N: 3
                  }[shift]

                  return (
                    <span
                      key={shift}
                      className={
                        assigned < required
                          ? 'coverage-under'
                          : 'coverage-ok'
                      }
                    >
                      {shift}: {assigned}/
                      {required}
                    </span>
                  )
                }
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH MESSAGE */}
      {params.q.length === 1 && (
        <div className="hint">
          Staff search starts at 2 characters.
        </div>
      )}

      {params.q.length >= 2 &&
        rows.length === 0 && (
          <div className="empty-state card">
            No staff matched “{params.q}”.
          </div>
        )}

      {/* ROSTER TABLE */}
      <div className="roster-wrap card">
        <div className="roster-scroll">
          <table className="roster-table">
            <thead>
              <tr>
                <th className="sticky-name">
                  Staff
                </th>

                {dates.map(date => (
                  <th key={date}>
                    {formatDay(date)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map(person => (
                <tr key={person.id}>
                  <th className="sticky-name staff-name">
                    <span>
                      {person.fullName}
                    </span>

                    <small>
                      {person.grade === 'SENIOR'
                        ? 'Senior'
                        : 'Junior'}
                    </small>
                  </th>

                  {dates.map(date => {
                    const cell = cellMap.get(
                      `${person.id}-${date}`
                    )

                    return (
                      <td key={date}>
                        <button
                          className={`shift-cell ${
                            cell?.shift
                              ? `shift-${cell.shift}`
                              : 'shift-empty'
                          }`}
                          disabled={
                            roster.published
                          }
                          aria-label={`${person.fullName} ${date}`}
                          onClick={() =>
                            setDrawer(
                              true,
                              cell?.id ??
                                `${person.id}-${date}`
                            )
                          }
                        >
                          {cell?.shift ?? '—'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SHIFT DRAWER */}
      <ShiftDrawer
        roster={roster}
        staff={rows}
        dates={dates}
        selectedCellId={selectedCellId}
        open={drawerOpen}
        onClose={() =>
          setDrawer(false)
        }
        onSaved={() =>
          setToast('Shift saved')
        }
        onConflict={() =>
          setToast(
            'Roster changed. Review the conflict before saving again.'
          )
        }
        onFailure={() =>
          setToast(
            'Save failed. The optimistic change was rolled back.'
          )
        }
      />

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast}
          onClose={() =>
            setToast(null)
          }
        />
      )}
    </section>
  )
}    