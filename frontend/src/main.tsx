import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './style.css'
import AppLayout from './pages/AppLayout'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Routes from './pages/Routes'
import Reports from './pages/Reports'
import { DataProvider } from './data/DataContext'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'vehicles', element: <Vehicles /> },
      { path: 'drivers', element: <Drivers /> },
      { path: 'routes', element: <Routes /> },
      { path: 'reports', element: <Reports /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  </React.StrictMode>,
)
