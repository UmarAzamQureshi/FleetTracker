import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { wsManager, telemetryUtils } from '../lib/api'
import type { GeoJSONFeature } from '../lib/api'

export type Vehicle = {
  id: string
  name: string
  status: 'moving' | 'idle' | 'stopped' | 'offline'
  speed: number
  fuel: number
  driver: string
  lat: number
  lng: number
}

type DataContextValue = {
  vehicles: Vehicle[]
  refresh: () => Promise<void>
}

const DataContext = createContext<DataContextValue>({ vehicles: [], refresh: async () => {} })

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const refresh = async () => {
    try {
      const geojson = await api.getAllTelemetry(100)
      const v = telemetryUtils.convertToVehicleData(geojson.features as GeoJSONFeature[])
      setVehicles(v)
    } catch (e) {
      console.error('Failed to fetch telemetry', e)
    }
  }

  useEffect(() => {
    refresh()

    wsManager.connect().catch(console.error)
    const unsubscribe = wsManager.onTelemetry(() => {
      // On new telemetry, refresh the list (simple approach)
      refresh()
    })
    return () => {
      unsubscribe()
      wsManager.disconnect()
    }
  }, [])

  const value = useMemo(() => ({ vehicles, refresh }), [vehicles])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  return useContext(DataContext)
}
