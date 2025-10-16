# FleetTracker — Real‑Time Vehicle Tracking (FastAPI + React + Leaflet)

A modern, full‑stack fleet tracking simulator and API showcasing real‑time GPS telemetry ingestion, WebSocket broadcasting, map rendering, and a headless ingest simulator.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=000)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

### 📸 Screenshots

![Screenshot 1](images/1.png)

![Screenshot 2](images/2.png)

![Screenshot 3](images/3.png)

![Screenshot 4](images/4.png)

![Screenshot 5](images/5.png)


### ✨ What you get
- Real‑time telemetry ingestion via FastAPI
- Live WebSocket updates to connected clients
- GeoJSON route retrieval per device
- A React + Leaflet frontend (Vite + Tailwind ready)
- A Python simulator that “drives” cars across real coordinates


### 📦 Project structure
```
car-tracker-sim/
  backend/                # FastAPI app (ingest, websocket, GeoJSON, static)
    fastapi_app.py
    requirements.txt
    static/               # Minimal HTML pages for quick testing
  simulator/              # Synthetic GPS data generator
    simulator.py
  docker-compose.yml      # (optional) container orchestration
frontend/                 # React + Vite + Tailwind + Leaflet UI
  src/pages/*.tsx         # Dashboard and pages
  lib/api.ts              # API helpers
  package.json
```


### 🧭 Architecture overview
- FastAPI exposes REST endpoints for telemetry ingest and retrieval and a `/ws` WebSocket for live updates. Incoming points are broadcast to all connected clients.
- PostgreSQL + PostGIS are assumed by the backend (see `DATABASE_URL` in `backend/fastapi_app.py`). The app ensures extensions/tables on startup.
- The React app consumes REST + WebSocket to render moving vehicles on a Leaflet map.
- A headless simulator posts synthetic GPS points to the ingest endpoint at intervals.


### 🔌 Key endpoints (FastAPI)
- `POST /ingest` — Ingests telemetry `{ device_id, ts, lat, lon, ... }`
- `GET  /route/{device_id}` — Latest points as GeoJSON FeatureCollection
- `GET  /telemetry/geojson?limit=100` — Global, recent telemetry as GeoJSON
- `WS   /ws` — Real‑time broadcast of new points
- `POST /devices/register` — Simple device registration, returns API key
- `POST /phone/ingest` — Ingest tied to an API key (Header: `x-api-key`)


### ⚙️ Prerequisites
- Python 3.10+
- Node 18+
- PostgreSQL 14+ with PostGIS extension

Create a database and set `DATABASE_URL` (defaults to `postgresql://postgres:umar@localhost:5432/TrackingManager`).

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```


### 🚀 Backend — run FastAPI
From `car-tracker-sim/backend`:
```bash
python -m venv .venv && . .venv/Scripts/activate  # Windows PowerShell
pip install -r requirements.txt
# Ensure DATABASE_URL is set in your env if you want a non-default connection
uvicorn fastapi_app:app --reload --host 0.0.0.0 --port 8000
```
Static pages available at `http://localhost:8000/`.


### 🗺️ Frontend — run the React app
From `frontend`:
```bash
npm install
npm run dev
```
Visit `http://localhost:5173`.


### 🚗 Simulator — stream fake cars
From `car-tracker-sim/simulator` (ensure backend is running):
```bash
pip install -r requirements.txt  # if present, otherwise: pip install requests
python simulator.py
```
This starts two simulated cars posting telemetry every 3 seconds to `POST /ingest`.


### 🧪 Quick test without frontend
- Open two browser tabs:
  - `http://localhost:8000/` (static testing page)
  - `ws://localhost:8000/ws` (use any WS client)
- Start the simulator. You should see live messages flowing.


### 🔒 Configuration
- `DATABASE_URL` — Postgres connection string
- CORS: `allow_origins=["*"]` in `fastapi_app.py` (adjust for production)


### 📊 Data model (simplified)
- `devices(device_id, user_id, api_key, label, last_seen)`
- `telemetry(id, device_id, ts, lat, lon, alt, speed_kmh, heading, fix, sats, hdop, geom)`

Indexes are created on startup for fast lookups.


### 🛠️ Development tips
- Keep the backend running with `--reload` for hot reloading
- Use the static `live-map.html` for quick map sanity checks
- For production, serve the built `frontend/dist` behind a reverse proxy


### 🤝 Contributing
PRs welcome! Please create feature branches and open a clear, scoped pull request.


### 📄 License
MIT
