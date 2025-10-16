import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-400">FleetTrack</span>
            </Link>
            <button className="md:hidden p-2 rounded hover:bg-gray-700" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden md:flex items-center space-x-1">
              <NavLink to="/" end className={linkClass}>Home</NavLink>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/vehicles" className={linkClass}>Vehicles</NavLink>
              <NavLink to="/drivers" className={linkClass}>Drivers</NavLink>
              <NavLink to="/routes" className={linkClass}>Routes</NavLink>
              <NavLink to="/reports" className={linkClass}>Reports</NavLink>
            </div>
          </div>
          {open && (
            <div className="md:hidden pb-3 space-y-1">
              <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
              <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>Dashboard</NavLink>
              <NavLink to="/vehicles" className={linkClass} onClick={() => setOpen(false)}>Vehicles</NavLink>
              <NavLink to="/drivers" className={linkClass} onClick={() => setOpen(false)}>Drivers</NavLink>
              <NavLink to="/routes" className={linkClass} onClick={() => setOpen(false)}>Routes</NavLink>
              <NavLink to="/reports" className={linkClass} onClick={() => setOpen(false)}>Reports</NavLink>
            </div>
          )}
        </div>
      </nav>
      <main className="flex-1 overflow-auto"> 
        <Outlet />
      </main>
    </div>
  )
}

