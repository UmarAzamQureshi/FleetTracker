declare const config: {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  DEFAULT_TELEMETRY_LIMIT?: number;
  DEFAULT_ROUTE_LIMIT?: number;
  DATA_REFRESH_INTERVAL?: number;
  WEBSOCKET_RECONNECT_DELAY?: number;
  MAX_RECONNECT_ATTEMPTS?: number;
};
export default config;
