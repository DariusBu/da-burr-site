// Multiplayer WebSocket Client for Cells Rule
class MultiplayerClient {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.userName = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.serverUrl = 'wss://your-app-name.herokuapp.com'; // Replace 'your-app-name' with your actual Heroku app name
    
    // User management
    this.users = new Map(); // userId -> userData
    this.currentUser = null;
    
    // Game state
    this.gameState = {
      grid: null,
      players: new Map(),
      lastUpdate: 0
    };
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Handle page visibility changes for reconnection
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isConnected) {
        this.connect();
      }
    });

    // Handle beforeunload to notify server
    window.addEventListener('beforeunload', () => {
      if (this.socket && this.isConnected) {
        this.socket.close();
      }
    });
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.socket = new WebSocket(this.serverUrl);
      this.setupSocketHandlers();
    } catch (error) {
      console.error('Failed to connect to server:', error);
      this.handleReconnect();
    }
  }

  setupSocketHandlers() {
    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('Connected');
      
      // Send user info if we have it
      if (this.userId && this.userName) {
        this.sendMessage('user:join', {
          userId: this.userId,
          userName: this.userName
        });
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      this.updateConnectionStatus('Disconnected');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateConnectionStatus('Error');
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.updateConnectionStatus(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.updateConnectionStatus('Connection failed');
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'user:joined':
        this.handleUserJoined(message.data);
        break;
      case 'user:left':
        this.handleUserLeft(message.data);
        break;
      case 'user:list':
        this.handleUserList(message.data);
        break;
      case 'game:state':
        this.handleGameState(message.data);
        break;
      case 'rule:update':
        this.handleRuleUpdate(message.data);
        break;
      case 'error':
        this.handleError(message.data);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  handleUserJoined(data) {
    const { userId, userName, userData } = data;
    this.users.set(userId, { userName, ...userData });
    this.updateUserList();
    
    if (userId === this.userId) {
      this.currentUser = { userId, userName, ...userData };
      this.updateUserInfo();
    }
  }

  handleUserLeft(data) {
    const { userId } = data;
    this.users.delete(userId);
    this.updateUserList();
  }

  handleUserList(data) {
    this.users.clear();
    data.users.forEach(user => {
      this.users.set(user.userId, user);
    });
    this.updateUserList();
  }

  handleGameState(data) {
    this.gameState = data;
    this.updateGameDisplay();
  }

  handleRuleUpdate(data) {
    const { userId, ruleSource } = data;
    // Update the rule in the local game
    if (window.setPlayerRule) {
      window.setPlayerRule(userId, ruleSource);
    }
  }

  handleError(data) {
    console.error('Server error:', data.message);
    this.showError(data.message);
  }

  sendMessage(type, data) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }

  // User management methods
  createUser(userName) {
    this.userName = userName;
    this.userId = this.generateUserId();
    
    // Store user info in localStorage for persistence
    localStorage.setItem('cellsRule_userId', this.userId);
    localStorage.setItem('cellsRule_userName', this.userName);
    
    if (this.isConnected) {
      this.sendMessage('user:join', {
        userId: this.userId,
        userName: this.userName
      });
    }
    
    return this.userId;
  }

  loadUser() {
    const userId = localStorage.getItem('cellsRule_userId');
    const userName = localStorage.getItem('cellsRule_userName');
    
    if (userId && userName) {
      this.userId = userId;
      this.userName = userName;
      this.currentUser = { userId, userName };
      
      if (this.isConnected) {
        this.sendMessage('user:join', {
          userId: this.userId,
          userName: this.userName
        });
      }
      
      return true;
    }
    
    return false;
  }

  updateUserRule(ruleSource) {
    if (this.userId && this.isConnected) {
      this.sendMessage('rule:update', {
        userId: this.userId,
        ruleSource: ruleSource
      });
    }
  }

  // UI update methods
  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `status ${status.toLowerCase().replace(/\s+/g, '-')}`;
    }
  }

  updateUserList() {
    const userListElement = document.getElementById('user-list');
    if (!userListElement) return;

    userListElement.innerHTML = '';
    
    this.users.forEach((user, userId) => {
      const userElement = document.createElement('div');
      userElement.className = 'user-item';
      userElement.innerHTML = `
        <span class="user-name">${user.userName}</span>
        <span class="user-status ${user.online ? 'online' : 'offline'}"></span>
      `;
      userListElement.appendChild(userElement);
    });
  }

  updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement && this.currentUser) {
      userInfoElement.innerHTML = `
        <div class="current-user">
          <span class="user-name">${this.currentUser.userName}</span>
          <span class="user-id">ID: ${this.currentUser.userId}</span>
        </div>
      `;
    }
  }

  updateGameDisplay() {
    // This will be called by the main game to update the display
    if (window.updateGameFromServer) {
      window.updateGameFromServer(this.gameState);
    }
  }

  showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  }

  // Utility methods
  generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

// Global multiplayer client instance
window.multiplayerClient = new MultiplayerClient();

// Initialize connection when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Try to load existing user
  if (!window.multiplayerClient.loadUser()) {
    // Show user creation dialog
    showUserCreationDialog();
  } else {
    // Connect to server
    window.multiplayerClient.connect();
  }
});

// User creation dialog
function showUserCreationDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'user-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h2>Welcome to Cells Rule!</h2>
      <p>Enter your name to join the game:</p>
      <input type="text" id="user-name-input" placeholder="Your name" maxlength="20">
      <button id="join-game-btn">Join Game</button>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  const nameInput = dialog.querySelector('#user-name-input');
  const joinBtn = dialog.querySelector('#join-game-btn');
  
  nameInput.focus();
  
  joinBtn.addEventListener('click', () => {
    const userName = nameInput.value.trim();
    if (userName.length > 0) {
      window.multiplayerClient.createUser(userName);
      window.multiplayerClient.connect();
      dialog.remove();
    }
  });
  
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinBtn.click();
    }
  });
}
