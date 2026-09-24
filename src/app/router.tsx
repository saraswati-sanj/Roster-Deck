import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { RosterPage } from '../features/roster/presentation/pages/RosterPage'
import { SwapsPage } from '../features/swaps/presentation/pages/SwapsPage'
import { SettingsPage } from '../features/roster/presentation/pages/SettingsPage'
import { DevPanel } from '../features/roster/presentation/components/DevPanel'
import { lazy, Suspense } from 'react'

const PublishPage = lazy(() => import('../features/publish/presentation/pages/PublishPage'))

function PublishRoute() {
  return (
    <Suspense fallback={<div className="page-loading">Loading publish review…</div>}>
      <PublishPage />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <div className="error-page">Something went wrong. Please refresh the page.</div>,
    children: [
      { index: true, element: <Navigate to="/roster" replace /> },
      { path: 'roster', element: <RosterPage /> },
      { path: 'swaps', element: <SwapsPage /> },
      { path: 'publish', element: <PublishRoute /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'dev', element: <DevPanel /> }
    ]
  }
])
