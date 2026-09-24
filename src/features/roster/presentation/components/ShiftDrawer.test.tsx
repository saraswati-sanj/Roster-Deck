import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ShiftDrawer } from './ShiftDrawer'

describe('ShiftDrawer', () => {
  it('renders accessible shift form fields', () => {
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <ShiftDrawer
          roster={{
            ward: 'ICU',
            week: '2026-W41',
            version: 1,
            published: false,
            cells: [{ id: 'S1-2026-10-05', staffId: 'S1', date: '2026-10-05', shift: null, version: 1 }]
          }}
          staff={[{ id: 'S1', fullName: 'Priya S.', grade: 'SENIOR', icuCertExpiry: '2026-12-31', leaveDates: [] }]}
          dates={['2026-10-05']}
          selectedCellId="S1-2026-10-05"
          open
          onClose={() => undefined}
          onSaved={() => undefined}
          onConflict={() => undefined}
          onFailure={() => undefined}
        />
      </QueryClientProvider>
    )
    expect(screen.getByLabelText('Close drawer')).toBeInTheDocument()
    expect(screen.getByText('Live rule check')).toBeInTheDocument()
  })
})
