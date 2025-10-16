// Configuration for API endpoints
const config = {
  // API Base URL - change this to point to your FastAPI backend
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  
  // WebSocket URL - automatically derived from API_BASE_URL
  WS_BASE_URL: (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace('http', 'ws'),
  
  // Default limits for API calls
  DEFAULT_TELEMETRY_LIMIT: 50,
  DEFAULT_ROUTE_LIMIT: 500,
  
  // Refresh intervals (in milliseconds)
  DATA_REFRESH_INTERVAL: 30000, // 30 seconds
  WEBSOCKET_RECONNECT_DELAY: 1000, // 1 second
  MAX_RECONNECT_ATTEMPTS: 5,
};

export default config;

