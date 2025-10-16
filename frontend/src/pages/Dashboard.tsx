import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Truck, Navigation, AlertCircle, Fuel, Users } from 'lucide-react'
import { useData } from '../data/DataContext'
import api from '../lib/api'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

function MapRefSetter({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap()
  useEffect(() => { onReady(map) }, [map, onReady])
  return null
}

export default function Dashboard() {
  const { vehicles } = useData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const mapRef = useRef<L.Map | null>(null)

  const center = useMemo(() => {
    if (vehicles.length) return [vehicles[0].lat, vehicles[0].lng] as [number, number]
    return [33.6844, 73.0479] as [number, number]
  }, [vehicles])

  useEffect(() => {
    const load = async () => {
      if (!selectedId) return
      const res = await api.getDeviceRoute(selectedId, 500)
      const coords = res.features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number])
      setRouteCoords(coords)
      if (coords.length && mapRef.current) {
        mapRef.current.panTo(coords[coords.length - 1])
      }
    }
    load()
  }, [selectedId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'stopped': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => status.charAt(0).toUpperCase() + status.slice(1)

  const alerts = vehicles.slice(0, 3).map((v) => ({
    type: v.status === 'stopped' ? 'critical' : v.status === 'idle' ? 'warning' : 'info',
    message: `${v.id} - ${getStatusText(v.status)}`,
    time: 'Just now',
  }))

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden dashboard-map">
      <div className="relative md:flex-1 min-h-[300px] md:min-h-0 bg-gray-800">
        <MapContainer center={center} zoom={10} className="absolute inset-0">
          <MapRefSetter onReady={(m) => { mapRef.current = m }} />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Streets">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, and the GIS User Community" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {vehicles.map((v) => (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              eventHandlers={{
                click: () => {
                  setSelectedId(v.id)
                  if (mapRef.current) mapRef.current.panTo([v.lat, v.lng])
                },
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{v.name} ({v.id})</div>
                  <div>Status: {getStatusText(v.status)}</div>
                  <div>Speed: {v.speed} km/h</div>
                  <div>Driver: {v.driver}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {routeCoords.length > 1 && (
            <Polyline positions={routeCoords} color="#3b82f6" />
          )}
        </MapContainer>
      </div>

      <div className="w-full md:w-96 bg-gray-850 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Total Vehicles</div>
                <div className="text-2xl font-bold">{vehicles.length}</div>
              </div>
              <div className="bg-blue-600 rounded-full p-3">
                <Navigation className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Avg Fuel Level</div>
                <div className="text-2xl font-bold">
                  {vehicles.length ? Math.round(vehicles.reduce((s, v) => s + (v.fuel || 0), 0) / vehicles.length) : 0}%
                </div>
              </div>
              <div className="bg-green-600 rounded-full p-3">
                <Fuel className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
            Recent Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`bg-gray-800 rounded p-3 border-l-4 ${
                alert.type === 'critical' ? 'border-red-500' :
                alert.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
              }`}>
                <div className="text-xs text-gray-300">{alert.message}</div>
                <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center sticky top-0 bg-gray-850 py-2">
            <Truck className="w-4 h-4 mr-2" />
            All Vehicles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vehicles.map((v) => (
              <button key={v.id} onClick={() => setSelectedId(v.id)} className="text-left bg-gray-800 rounded-lg p-3 hover:bg-gray-750">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{v.name}</div>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(v.status)}`}></div>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {v.driver}
                  </div>
                  <div className="flex justify-between">
                    <span>Speed: {v.speed} km/h</span>
                    <span>Fuel: {v.fuel}%</span>
                  </div>
                  <div className="text-gray-500 capitalize">Status: {getStatusText(v.status)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
