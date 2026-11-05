/**
 * Real-time Collaboration Engine with Peer-to-Peer WebSockets and BroadcastChannel fallback
 * Allows users across different browser tabs, windows, or remote WebSocket relays
 * to synchronize album edits, notes, boards, and active presence in real time.
 */

export class CollaborationEngine {
  constructor(options = {}) {
    this.user = options.user || { username: 'guest', artistName: 'Guest' };
    this.channelName = options.channelName || 'tracker_collab_room';
    this.wsUrl = options.wsUrl || 'wss://echo.websocket.events'; // standard public testing relay or custom WS URL
    this.onPeerUpdate = options.onPeerUpdate || (() => {});
    this.onRemoteAction = options.onRemoteAction || (() => {});

    this.activePeers = new Map(); // username -> { username, artistName, lastSeen, cursor, activeTab }
    this.socket = null;
    this.broadcastChannel = null;
    this.heartbeatTimer = null;
    this.isConnected = false;
    this.reconnectTimer = null;

    this.initBroadcastChannel();
    this.initWebSocket();
    this.startHeartbeat();
  }

  updateUser(newUser) {
    this.user = newUser || { username: 'guest', artistName: 'Guest' };
    this.broadcastPresence();
  }

  initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(this.channelName);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or restricted:', err);
      }
    }
  }

  initWebSocket() {
    // If running in browser, connect to websocket for cross-device/network synchronization
    try {
      if (typeof window !== 'undefined' && 'WebSocket' in window) {
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
          this.isConnected = true;
          this.broadcastPresence();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data._trackER_collab) {
              this.handleIncomingMessage(data);
            }
          } catch (e) {
            // Not a JSON message or unrelated WS traffic
          }
        };

        this.socket.onerror = () => {
          // Graceful fallback to BroadcastChannel
          this.isConnected = false;
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          // Auto-reconnect after 8s
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.initWebSocket();
          }, 8000);
        };
      }
    } catch (e) {
      console.warn('WebSocket connection error:', e);
    }
  }

  handleIncomingMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.senderId === this.getSessionId()) return; // Ignore own echoes

    if (msg.type === 'PRESENCE') {
      const peer = {
        username: msg.username,
        artistName: msg.artistName,
        isAdmin: !!msg.isAdmin,
        lastSeen: Date.now(),
        avatar: msg.avatar
      };
      this.activePeers.set(msg.username, peer);
      this.notifyPeerList();
    } else if (msg.type === 'ACTION') {
      this.onRemoteAction(msg.action, msg.payload, msg.sender);
    }
  }

  getSessionId() {
    if (!this._sessionId) {
      this._sessionId = Math.random().toString(36).substring(2, 9);
    }
    return this._sessionId;
  }

  broadcastPresence() {
    const payload = {
      _trackER_collab: true,
      type: 'PRESENCE',
      senderId: this.getSessionId(),
      username: this.user.username || 'guest',
      artistName: this.user.artistName || this.user.username || 'Guest',
      isAdmin: !!this.user.isAdmin,
      timestamp: Date.now()
    };
    this.send(payload);
  }

  broadcastAction(actionName, payloadData) {
    const msg = {
      _trackER_collab: true,
      type: 'ACTION',
      senderId: this.getSessionId(),
      sender: this.user.username || 'guest',
      action: actionName,
      payload: payloadData,
      timestamp: Date.now()
    };
    this.send(msg);
  }

  send(data) {
    // 1. Send via BroadcastChannel (local tabs / windows)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch (e) {}
    }

    // 2. Send via WebSocket (cross-machine)
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (e) {}
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.broadcastPresence();

      // Prune inactive peers older than 15s
      const now = Date.now();
      let changed = false;
      for (const [key, peer] of this.activePeers.entries()) {
        if (now - peer.lastSeen > 15000) {
          this.activePeers.delete(key);
          changed = true;
        }
      }
      if (changed) {
        this.notifyPeerList();
      }
    }, 4000);
  }

  notifyPeerList() {
    const list = Array.from(this.activePeers.values());
    this.onPeerUpdate(list);
  }

  destroy() {
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.reconnectTimer);
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
    }
    if (this.socket) {
      try { this.socket.close(); } catch (e) {}
    }
  }
}

