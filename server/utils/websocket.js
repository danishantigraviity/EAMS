const { WebSocketServer, WebSocket } = require('ws');

let wss = null;

const init = (server) => {
  wss = new WebSocketServer({ server });

  console.log('🔌 WebSocket Server initialized and attached to HTTP server.');

  wss.on('connection', (ws) => {
    console.log('🔌 WebSocket client connected');

    // Keep connection alive
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        console.log('📩 Received WebSocket message:', parsed);
        if (parsed.event === 'ping') {
          ws.send(JSON.stringify({ event: 'pong' }));
        }
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err.message);
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err.message);
    });
  });

  // Heartbeat check every 30s
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('🔌 Terminating unresponsive WebSocket client');
        try {
          return ws.terminate();
        } catch (err) {
          console.error('❌ Failed to terminate client socket:', err.message);
          return;
        }
      }
      try {
        ws.isAlive = false;
        ws.ping();
      } catch (err) {
        console.error('❌ Failed to ping client socket, terminating:', err.message);
        try {
          ws.terminate();
        } catch (termErr) {}
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
};

const broadcast = (event, payload = {}) => {
  if (!wss) {
    console.warn('⚠️ WebSocket server not initialized. Cannot broadcast.');
    return;
  }

  const message = JSON.stringify({ event, payload });
  let clientCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        clientCount++;
      } catch (err) {
        console.error(`❌ Failed to send WebSocket message to client:`, err.message);
      }
    }
  });

  console.log(`📢 Broadcasted [${event}] to ${clientCount} WebSocket clients.`);
};

module.exports = {
  init,
  broadcast,
};
