import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useRosterUiStore } from '../features/roster/presentation/hooks/useRosterUiStore'

export function AppLayout() {
  const location = useLocation()
  const { offline, setOffline } = useRosterUiStore()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">RosterDesk</div>
          <div className="subtitle">Hospital shift roster</div>
        </div>
        <div className="topbar-actions">
          <span className="hospital-time">Hospital time · Asia/Kolkata</span>
          <button className={offline ? 'status-pill danger' : 'status-pill'} onClick={() => setOffline(!offline)}>
            {offline ? 'Offline simulation' : 'Online'}
          </button>
        </div>
      </header>

      <nav className="nav">
        <NavLink className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} to="/roster">Roster</NavLink>
        <NavLink className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} to="/swaps">Swap requests</NavLink>
        <NavLink className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} to="/publish">Publish week</NavLink>
        <NavLink className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} to="/settings">Ward settings</NavLink>
        <NavLink className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} to="/dev">Dev panel</NavLink>
      </nav>

      <main className="content">
        <div key={location.pathname} className="route-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
