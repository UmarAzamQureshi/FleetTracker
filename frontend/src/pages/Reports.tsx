import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker,LayersControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../lib/api'
import type { GeoJSONFeature } from '../lib/api'

type StopInterval = {
  startIdx: number
  endIdx: number
  startTs: string
  endTs: string
  durationMins: number
  lat: number
  lng: number
}

function MapRefSetter({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap()
  useEffect(() => { onReady(map) }, [map, onReady])
  return null
}

export default function Reports() {
  const location = useLocation() as { state?: { deviceId?: string; start?: string; end?: string } }
  const deviceId = location.state?.deviceId || 'V001'
  const start = location.state?.start
  const end = location.state?.end

  const [coords, setCoords] = useState<[number, number][]>([])
  const [features, setFeatures] = useState<GeoJSONFeature[]>([])
  const [distanceKm, setDistanceKm] = useState(0)
  const [duration, setDuration] = useState('N/A')
  const [stops, setStops] = useState<StopInterval[]>([])
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await api.getDeviceRoute(deviceId, 5000)
      const s = start ? new Date(start).getTime() : -Infinity
      const e = end ? new Date(end).getTime() : Infinity
      const filtered = (res.features || []).filter(f => {
        const t = new Date(f.properties.ts).getTime()
        return t >= s && t <= e
      }) as GeoJSONFeature[]

      setFeatures(filtered)

      const points = filtered.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number])
      setCoords(points)

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
      setDistanceKm(Math.round(d * 100) / 100)

      if (filtered.length) {
        const firstTs = new Date(filtered[0].properties.ts).getTime()
        const lastTs = new Date(filtered[filtered.length - 1].properties.ts).getTime()
        const mins = Math.round((lastTs - firstTs) / 60000)
        setDuration(`${Math.floor(mins/60)}h ${mins%60}m`)
      } else {
        setDuration('N/A')
      }

      const stopIntervals: StopInterval[] = []
      let inStop = false
      let stopStartIdx = -1
      for (let i = 0; i < filtered.length; i++) {
        const spd = Math.round(filtered[i].properties.speed_kmh || 0)
        if (!inStop && spd <= 0) {
          inStop = true
          stopStartIdx = i
        } else if (inStop && spd > 0) {
          const startFeature = filtered[stopStartIdx]
          const endFeature = filtered[i]
          const startMs = new Date(startFeature.properties.ts).getTime()
          const endMs = new Date(endFeature.properties.ts).getTime()
          stopIntervals.push({
            startIdx: stopStartIdx,
            endIdx: i,
            startTs: startFeature.properties.ts,
            endTs: endFeature.properties.ts,
            durationMins: Math.max(0, Math.round((endMs - startMs) / 60000)),
            lat: startFeature.geometry.coordinates[1],
            lng: startFeature.geometry.coordinates[0],
          })
          inStop = false
          stopStartIdx = -1
        }
      }
      if (inStop && stopStartIdx >= 0) {
        const startFeature = filtered[stopStartIdx]
        const endFeature = filtered[filtered.length - 1]
        const startMs = new Date(startFeature.properties.ts).getTime()
        const endMs = new Date(endFeature.properties.ts).getTime()
        stopIntervals.push({
          startIdx: stopStartIdx,
          endIdx: filtered.length - 1,
          startTs: startFeature.properties.ts,
          endTs: endFeature.properties.ts,
          durationMins: Math.max(0, Math.round((endMs - startMs) / 60000)),
          lat: startFeature.geometry.coordinates[1],
          lng: startFeature.geometry.coordinates[0],
        })
      }
      setStops(stopIntervals)
    }
    load()
  }, [deviceId, start, end])

  const center = useMemo(() => (coords[0] ? coords[0] : [33.6844, 73.0479]) as [number, number], [coords])

  const segments = useMemo(() => {
    const segs: { color: string; pts: [number, number][] }[] = []
    if (!features.length) return segs
    let current: [number, number][] = []
    let moving = (features[0].properties.speed_kmh || 0) > 0
    for (let i = 0; i < features.length; i++) {
      const pt: [number, number] = [features[i].geometry.coordinates[1], features[i].geometry.coordinates[0]]
      const isMoving = (features[i].properties.speed_kmh || 0) > 0
      if (isMoving === moving) {
        current.push(pt)
      } else {
        if (current.length > 1) segs.push({ color: moving ? '#22c55e' : '#ef4444', pts: current })
        current = [pt]
        moving = isMoving
      }
    }
    if (current.length > 1) segs.push({ color: moving ? '#22c55e' : '#ef4444', pts: current })
    return segs
  }, [features])

  const startLabel = features[0]?.properties.ts
  const endLabel = features[features.length - 1]?.properties.ts

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Route Report</h2>
      <div className="text-sm text-gray-300">Device: <span className="font-semibold">{deviceId}</span>{start && end ? ` • ${start} → ${end}` : ''}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 report-map">
        <div className="lg:col-span-2 relative min-h-[320px] bg-gray-800 rounded">
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
            {segments.map((s, i) => (
              <Polyline key={i} positions={s.pts} color={s.color} />
            ))}
            {features.length > 0 && (
              <Marker position={[features[0].geometry.coordinates[1], features[0].geometry.coordinates[0]]}>
                <Popup>Start: {startLabel}</Popup>
              </Marker>
            )}
            {features.length > 1 && (
              <Marker position={[features[features.length - 1].geometry.coordinates[1], features[features.length - 1].geometry.coordinates[0]]}>
                <Popup>End: {endLabel}</Popup>
              </Marker>
            )}
            {stops.map((st, idx) => (
              <CircleMarker key={idx} center={[st.lat, st.lng]} radius={6} pathOptions={{ color: '#f59e0b' }}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">Stop</div>
                    <div>From: {st.startTs}</div>
                    <div>To: {st.endTs}</div>
                    <div>Duration: {st.durationMins} min</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div className="bg-gray-800 rounded p-4 space-y-3">
          <div>
            <div className="text-gray-400 text-sm">Distance Covered</div>
            <div className="text-3xl font-bold">{distanceKm} km</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Duration</div>
            <div className="text-xl font-semibold">{duration}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Stops</div>
            <ul className="text-sm text-gray-300 space-y-1 max-h-40 overflow-auto">
              {stops.map((st, i) => (
                <li key={i}>Stop {i+1}: {st.startTs} → {st.endTs} ({st.durationMins} min)</li>
              ))}
              {!stops.length && <li className="text-gray-500">No stops in range</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
