import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { useData } from '../data/DataContext'

export default function Routes() {
  const { vehicles } = useData()
  const [inputId, setInputId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [points, setPoints] = useState<[number, number][]>([])
  const [loading, setLoading] = useState(false)
  const [lastTs, setLastTs] = useState<string>('')
  const [summaries, setSummaries] = useState<{ id: string; km: number }[]>([])

  useEffect(() => {
    if (!vehicles.length) return
    // initialize default selection
    if (!deviceId) {
      setDeviceId(vehicles[0].id)
      setInputId(vehicles[0].id)
    }
    // load summaries for all vehicles in parallel (limited points)
    (async () => {
      const results: { id: string; km: number }[] = []
      for (const v of vehicles) {
        try {
          const res = await api.getDeviceRoute(v.id, 150)
          const pts = res.features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number])
          let d = 0
          for (let i = 1; i < pts.length; i++) {
            const [lat1, lon1] = pts[i - 1]
            const [lat2, lon2] = pts[i]
            const R = 6371
            const dLat = (lat2 - lat1) * Math.PI / 180
            const dLon = (lon2 - lon1) * Math.PI / 180
            const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            d += R * c
          }
          results.push({ id: v.id, km: Math.round(d * 100) / 100 })
        } catch {}
      }
      setSummaries(results)
    })()
  }, [vehicles])

  const distanceKm = useMemo(() => {
    let d = 0
    for (let i = 1; i < points.length; i++) {
      const [lat1, lon1] = points[i - 1]
      const [lat2, lon2] = points[i]
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      d += R * c
    }
    return Math.round(d * 100) / 100
  }, [points])

  const targetKm = 50
  const progress = Math.min(100, Math.round((distanceKm / targetKm) * 100))
  const eta = useMemo(() => {
    const remaining = Math.max(0, targetKm - distanceKm)
    const hours = remaining / 40
    const mins = Math.round(hours * 60)
    return `${Math.floor(mins/60)}h ${mins%60}m`
  }, [distanceKm])

  useEffect(() => {
    const load = async () => {
      if (!deviceId) return
      setLoading(true)
      try {
        const res = await api.getDeviceRoute(deviceId, 300)
        setPoints(res.features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]]))
        const last = res.features[res.features.length - 1]
        setLastTs(last ? last.properties.ts : '')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [deviceId])

  const onSearch = () => {
    if (!inputId) return
    setDeviceId(inputId)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-gray-400 mb-1">Vehicle ID</label>
          <input
            list="vehicle-ids"
            className="bg-gray-700 px-3 py-2 rounded w-full"
            placeholder="Select or type an ID"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
          />
          <datalist id="vehicle-ids">
            {vehicles.map(v => (
              <option key={v.id} value={v.id} />
            ))}
          </datalist>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded" onClick={onSearch}>Search</button>
      </div>

      {/* Summaries for all vehicles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map(s => {
          const pct = Math.min(100, Math.round((s.km / targetKm) * 100))
          return (
            <button key={s.id} className="text-left bg-gray-800 rounded p-4 hover:bg-gray-750" onClick={() => { setDeviceId(s.id); setInputId(s.id) }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{s.id}</div>
                <div className="text-sm text-gray-400">{s.km} km</div>
              </div>
              <div className="w-full bg-gray-700 rounded h-2 overflow-hidden">
                <div className="bg-blue-600 h-2" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-1">Target: {targetKm} km</div>
            </button>
          )
        })}
        {!summaries.length && <div className="text-gray-500">No routes yet</div>}
      </div>

      {/* Detail for selected vehicle */}
      {loading ? (
        <div className="text-gray-400">Loading route…</div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-800 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{deviceId || '—'}</div>
              <div className="text-xl">{distanceKm} km</div>
            </div>
            <div className="w-full bg-gray-700 rounded h-3 overflow-hidden">
              <div className="bg-blue-600 h-3" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1">Target: {targetKm} km • Last point: {lastTs || '—'}</div>
          </div>
          <div className="bg-gray-800 rounded p-4">
            <div className="font-semibold mb-2">Route Points ({points.length})</div>
            <ol className="text-sm text-gray-300 space-y-1 max-h-64 overflow-auto">
              {points.map((p, i) => (
                <li key={i}>{p[0].toFixed(5)}, {p[1].toFixed(5)}</li>
              ))}
              {!points.length && <li className="text-gray-500">No points</li>}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
