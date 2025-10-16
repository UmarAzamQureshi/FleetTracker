// API service for Fleet Tracking Backend
// Connects to FastAPI backend endpoints

import config from './config';

const API_BASE_URL = config.API_BASE_URL;

// Types for API responses
export interface TelemetryData {
  device_id: string;
  ts: string; // ISO string
  lat: number;
  lon: number;
  alt?: number;
  speed_kmh?: number;
  heading?: number;
  fix?: string;
  sats?: number;
  hdop?: number;
}

export interface TelemetryResponse {
  status: string;
  id: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: number;
    device_id: string;
    ts: string;
    speed_kmh?: number;
    heading?: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
}

export interface GeoJSONResponse {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface WebSocketMessage {
  type: 'telemetry' | 'pong';
  id?: number;
  device_id?: string;
  ts?: string;
  lat?: number;
  lon?: number;
  alt?: number;
  speed_kmh?: number;
  heading?: number;
  fix?: string;
  sats?: number;
  hdop?: number;
  payload?: any;
}

// HTTP API functions
export const api = {
  // Ingest telemetry data
  async ingestTelemetry(telemetry: TelemetryData): Promise<TelemetryResponse> {
    const response = await fetch(`${API_BASE_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telemetry),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get route data for a specific device
  async getDeviceRoute(deviceId: string, limit: number = 500): Promise<GeoJSONResponse> {
    const response = await fetch(`${API_BASE_URL}/route/${deviceId}?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get all telemetry data as GeoJSON
  async getAllTelemetry(limit: number = 100): Promise<GeoJSONResponse> {
    const response = await fetch(`${API_BASE_URL}/telemetry/geojson?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// WebSocket connection manager
export class WebSocketManager {
  ws: WebSocket | null = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  reconnectDelay = 1000;
  listeners: Map<string, ((data: WebSocketMessage) => void)[]> = new Map();
  url: string;

  constructor(url: string = `${config.WS_BASE_URL}/ws`) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.notifyListeners('message', message);
          } catch (error) {
            console.warn('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.warn('WebSocket disconnected:', event.code, event.reason);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.warn('WebSocket error:', error);
          // Do not reject to avoid unhandled rejections; allow reconnect logic to proceed
        };
      } catch (error) {
        console.warn('WebSocket init failed:', error);
        // Soft-resolve to keep app running
        resolve();
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  onMessage(callback: (data: WebSocketMessage) => void): () => void {
    return this.addEventListener('message', callback);
  }

  onTelemetry(callback: (data: WebSocketMessage) => void): () => void {
    return this.addEventListener('telemetry', callback);
  }

  private addEventListener(event: string, callback: (data: WebSocketMessage) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(event: string, data: WebSocketMessage): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.warn('Error in WebSocket listener:', error);
        }
      });
    }

    if (data.type === 'telemetry' && event !== 'telemetry') {
      this.notifyListeners('telemetry', data);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => {
        this.connect().catch(() => {});
      }, delay);
    } else {
      console.warn('Max WebSocket reconnection attempts reached');
      this.notifyListeners('connection-lost', { type: 'pong' });
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

export const wsManager = new WebSocketManager();

export const telemetryUtils = {
  convertToVehicleData(features: GeoJSONFeature[]): any[] {
    const deviceMap = new Map<string, any>();

    features.forEach(feature => {
      const { device_id, speed_kmh } = feature.properties;
      const [lon, lat] = feature.geometry.coordinates;

      if (!deviceMap.has(device_id)) {
        deviceMap.set(device_id, {
          id: device_id,
          name: `Vehicle ${device_id}`,
          status: speed_kmh && speed_kmh > 0 ? 'moving' : 'idle',
          speed: Math.round(speed_kmh || 0),
          fuel: Math.floor(Math.random() * 100),
          driver: `Driver ${device_id}`,
          lat,
          lng: lon,
          lastUpdate: '1 min ago',
          distance: '0 km',
        });
      }

      const vehicle = deviceMap.get(device_id);
      vehicle.speed = Math.round(speed_kmh || 0);
      vehicle.status = speed_kmh && speed_kmh > 0 ? 'moving' : 'idle';
      vehicle.lat = lat;
      vehicle.lng = lon;
    });

    return Array.from(deviceMap.values());
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  formatTimestamp(ts: string): string {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  },
};

export default api;
