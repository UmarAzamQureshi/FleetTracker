import { useMemo, useState } from 'react'
import { useData } from '../data/DataContext'

export default function Drivers() {
  const { vehicles } = useData()
  const [query, setQuery] = useState('')

  const drivers = useMemo(() => {
    const map = new Map<string, { name: string; ids: string[]; active: number }>()
    vehicles.forEach(v => {
      const key = v.driver || 'Unknown'
      const entry = map.get(key) || { name: key, ids: [], active: 0 }
      if (!entry.ids.includes(v.id)) entry.ids.push(v.id)
      if (v.status === 'moving' || v.status === 'idle') entry.active++
      map.set(key, entry)
    })
    let list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.ids.some(id => id.toLowerCase().includes(q)))
    }
    return list
  }, [vehicles, query])

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Search Driver or Vehicle ID</label>
          <input
            className="bg-gray-700 px-3 py-2 rounded w-72"
            placeholder="e.g. John or V001"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((d) => (
          <div key={d.name} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-lg">{d.name}</div>
              <span className="text-xs text-gray-400">{d.active} active</span>
            </div>
            <div className="text-sm text-gray-300">
              <div className="text-gray-400 text-xs mb-1">Vehicles</div>
              <div className="flex flex-wrap gap-2">
                {d.ids.map(id => (
                  <span key={id} className="px-2 py-1 rounded bg-gray-700 text-xs">{id}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {!drivers.length && (
          <div className="text-gray-500">No drivers found</div>
        )}
      </div>
    </div>
  )
}
