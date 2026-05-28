class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimeout = null;
    this.isConnected = false;
  }

  getWebSocketUrl() {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (apiUrl) {
      // Replace /api at the end and change protocol from HTTP(S) to WS(S)
      return apiUrl.replace(/\/api$/, '').replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    }
    // Fallback to relative hostname
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const url = this.getWebSocketUrl();
    console.log(`🔌 Connecting to WebSocket Server at: ${url}`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket Connected');
        this.isConnected = true;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        // Send a quick ping to establish connection in server log
        this.send('ping', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const { event: eventName, payload } = JSON.parse(event.data);
          
          if (eventName === 'pong') return; // Heartbeat response

          console.log(`📩 WebSocket message received [${eventName}]:`, payload);

          if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).forEach((callback) => {
              try {
                callback(payload);
              } catch (err) {
                console.error(`Error in WebSocket listener for [${eventName}]:`, err);
              }
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message data:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed. Attempting reconnect in 5s...', event.reason);
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('❌ WebSocket error occurred:', err);
        this.ws.close();
      };
    } catch (error) {
      console.error('❌ WebSocket failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        this.connect();
      }, 5000);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect loop
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    console.log('🔌 WebSocket manually disconnected');
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Auto-connect if not connected
    if (!this.isConnected) {
      this.connect();
    }

    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  send(event, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    } else {
      console.warn('⚠️ Cannot send message. WebSocket is not open.');
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService();
export default websocketService;
