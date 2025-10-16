# fastapi_app.py
import asyncio
import json
from datetime import datetime
from typing import List

import asyncpg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.middleware.cors import CORSMiddleware
import secrets, uuid
from datetime import timezone
from fastapi import Depends, Header, HTTPException




# ------------------------
# Config
# ------------------------
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:umar@localhost:5432/TrackingManager"
)

app = FastAPI(title="Tracker Ingest + WebSocket")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------------
# WebSocket Manager
# ------------------------
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active:
            self.active.remove(websocket)

    async def broadcast(self, message: dict):
        data = json.dumps(message, default=str)
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for d in dead:
            self.disconnect(d)

manager = ConnectionManager()

# ------------------------
# Database Pools
# ------------------------
# asyncpg pool (for inserts/async queries)
@app.on_event("startup")
async def startup():
    app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    async with app.state.pool.acquire() as conn:
        # Ensure PostGIS & devices table exist
        await conn.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS devices (
              device_id  TEXT PRIMARY KEY,
              user_id    TEXT NOT NULL,
              api_key    TEXT NOT NULL UNIQUE,
              label      TEXT,
              last_seen  TIMESTAMPTZ,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_devices_user_id ON devices(user_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_telemetry_device_ts ON telemetry(device_id, ts DESC);")


@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

# SQLAlchemy (for sync GeoJSON query)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ------------------------
# Schemas
# ------------------------
class Telemetry(BaseModel):
    device_id: str
    ts: datetime
    lat: float
    lon: float
    alt: float = None
    speed_kmh: float = None
    heading: float = None
    fix: str = None
    sats: int = None
    hdop: float = None



class DeviceRegister(BaseModel):
    user_id: str
    device_id: str | None = None
    label: str | None = None

class PhoneTelemetry(BaseModel):
    ts: datetime | None = None
    lat: float
    lon: float
    alt: float | None = None
    speed_kmh: float | None = None
    heading: float | None = None
    fix: str | None = None
    sats: int | None = None
    hdop: float | None = None


# ------------------------
# Auth dependency (API key -> device)
# ------------------------
async def require_device(x_api_key: str = Header(...)):
    pool = app.state.pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT device_id, user_id FROM devices WHERE api_key=$1",
            x_api_key,
        )
    if not row:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return {"device_id": row["device_id"], "user_id": row["user_id"]}


# ------------------------
# Endpoints
# ------------------------

# Ingest telemetry
@app.post("/ingest")
async def ingest(payload: Telemetry):
    sql = """
    INSERT INTO telemetry (device_id, ts, lat, lon, alt, speed_kmh, heading, fix, sats, hdop, geom)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            ST_SetSRID(ST_MakePoint($4, $3), 4326))
    RETURNING id;
    """
    pool = app.state.pool
    async with pool.acquire() as conn:
        rec = await conn.fetchrow(
            sql,
            payload.device_id,
            payload.ts,
            payload.lat,
            payload.lon,
            payload.alt,
            payload.speed_kmh,
            payload.heading,
            payload.fix,
            payload.sats,
            payload.hdop,
        )
        inserted_id = rec["id"]

    message = {
        "type": "telemetry",
        "id": inserted_id,
        "device_id": payload.device_id,
        "ts": payload.ts.isoformat(),
        "lat": payload.lat,
        "lon": payload.lon,
        "alt": payload.alt,
        "speed_kmh": payload.speed_kmh,
        "heading": payload.heading,
        "fix": payload.fix,
        "sats": payload.sats,
        "hdop": payload.hdop,
    }

    await manager.broadcast(message)
    return JSONResponse({"status": "ok", "id": inserted_id})


# Route as GeoJSON (per device)
@app.get("/route/{device_id}")
async def route(device_id: str, limit: int = 500):
    sql = """
    SELECT id, device_id, ts, lat, lon, speed_kmh, heading
    FROM telemetry
    WHERE device_id = $1
    ORDER BY ts DESC
    LIMIT $2;
    """
    pool = app.state.pool
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, device_id, limit)

    features = []
    for r in reversed(rows):  # chronological order
        features.append({
            "type": "Feature",
            "properties": {
                "id": r["id"],
                "device_id": r["device_id"],
                "ts": r["ts"].isoformat(),
                "speed_kmh": r["speed_kmh"],
                "heading": r["heading"]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [r["lon"], r["lat"]]
            }
        })
    return {"type": "FeatureCollection", "features": features}


@app.post("/devices/register")
async def register_device(req: DeviceRegister):
    device_id = req.device_id or f"phone_{uuid.uuid4().hex[:12]}"
    api_key = secrets.token_urlsafe(32)
    pool = app.state.pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT api_key FROM devices WHERE device_id=$1", device_id)
        if row:
            # Keep existing key on re-register (or change logic to rotate if you want)
            api_key = row["api_key"]
            await conn.execute(
                "UPDATE devices SET user_id=$2, label=$3, last_seen=NOW() WHERE device_id=$1",
                device_id, req.user_id, req.label
            )
        else:
            # First-time insert
            await conn.execute("""
                INSERT INTO devices(device_id, user_id, api_key, label, last_seen)
                VALUES ($1,$2,$3,$4,NOW());
            """, device_id, req.user_id, api_key, req.label)

    return {"device_id": device_id, "api_key": api_key}


@app.post("/phone/ingest")
async def ingest_phone(payload: PhoneTelemetry, ctx=Depends(require_device)):
    device_id = ctx["device_id"]
    ts = payload.ts or datetime.now(timezone.utc)

    sql = """
    INSERT INTO telemetry (device_id, ts, lat, lon, alt, speed_kmh, heading, fix, sats, hdop, geom)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, ST_SetSRID(ST_MakePoint($4,$3),4326))
    RETURNING id;
    """
    pool = app.state.pool
    async with pool.acquire() as conn:
        rec = await conn.fetchrow(
            sql, device_id, ts, payload.lat, payload.lon, payload.alt,
            payload.speed_kmh, payload.heading, payload.fix, payload.sats, payload.hdop
        )
        await conn.execute("UPDATE devices SET last_seen=NOW() WHERE device_id=$1", device_id)

    inserted_id = rec["id"]
    await manager.broadcast({
        "type": "telemetry",
        "id": inserted_id,
        "device_id": device_id,
        "ts": ts.isoformat(),
        "lat": payload.lat, "lon": payload.lon,
        "alt": payload.alt, "speed_kmh": payload.speed_kmh,
        "heading": payload.heading, "fix": payload.fix,
        "sats": payload.sats, "hdop": payload.hdop,
    })
    return {"status": "ok", "id": inserted_id}


# Telemetry GeoJSON (all devices, limited)
@app.get("/telemetry/geojson")
def get_telemetry_geojson(limit: int = 100):
    session = SessionLocal()
    sql = text("""
        SELECT jsonb_build_object(
            'type',     'FeatureCollection',
            'features', jsonb_agg(feature)
        )
        FROM (
          SELECT jsonb_build_object(
            'type',       'Feature',
            'geometry',   ST_AsGeoJSON(geom)::jsonb,
            'properties', jsonb_build_object(
                'id', id,
                'device_id', device_id,
                'ts', ts,
                'speed_kmh', speed_kmh,
                'heading', heading
            )
          ) AS feature
          FROM telemetry
          ORDER BY ts DESC
          LIMIT :limit
        ) features;
    """)
    result = session.execute(sql, {"limit": limit}).scalar()
    session.close()
    return JSONResponse(content=result)


# WebSocket for live updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            await websocket.send_text(json.dumps({"type": "pong", "payload": msg}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# ------------------------
# Static frontend
# ------------------------
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# ------------------------
# Run
# ------------------------
if __name__ == "__main__":
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=8000, reload=True)
