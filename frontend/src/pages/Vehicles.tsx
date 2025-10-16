import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../data/DataContext'

export default function Vehicles() {
  const { vehicles } = useData()
  const navigate = useNavigate()
  const [queryId, setQueryId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const filtered = useMemo(() => {
    return vehicles.filter(v => (queryId ? v.id.toLowerCase().includes(queryId.toLowerCase()) : true))
  }, [vehicles, queryId])

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Vehicle ID</label>
          <input className="bg-gray-700 px-3 py-2 rounded w-64" placeholder="e.g. V001" value={queryId} onChange={e => setQueryId(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Start</label>
          <input type="datetime-local" className="bg-gray-700 px-3 py-2 rounded" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">End</label>
          <input type="datetime-local" className="bg-gray-700 px-3 py-2 rounded" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Search</button>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-750 text-gray-300">
            <tr>
              <th className="p-3 text-left">Vehicle ID</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">Driver</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Speed</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-t border-gray-700">
                <td className="p-3 font-semibold">{v.id}</td>
                <td className="p-3">{v.name}</td>
                <td className="p-3">{v.driver}</td>
                <td className="p-3 capitalize">{v.status}</td>
                <td className="p-3">{v.speed} km/h</td>
                <td className="p-3">
                  <button
                    className="text-blue-400 hover:text-blue-300"
                    onClick={() => navigate('/reports', { state: { deviceId: v.id, start, end } })}
                  >
                    Generate Report
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
