const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server
const server = http.createServer((req, res) => {
  // Serve static files
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game state
const gameState = {
  users: new Map(), // userId -> userData
  grid: Array(50).fill().map(() => Array(50).fill(null)),
  playerRules: new Map(), // userId -> rule function
  lastUpdate: Date.now()
};

// Broadcast to all connected clients
function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Send to specific client
function sendToClient(client, message) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// Update game state
function updateGameState() {
  // Update grid based on player rules
  const newGrid = Array(50).fill().map(() => Array(50).fill(null));
  
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      const current = gameState.grid[y][x];
      if (!current) continue;

      const rule = gameState.playerRules.get(current.ownerId);
      if (!rule) {
        newGrid[y][x] = current;
        continue;
      }

      // Get neighborhood
      const neighborhood = [];
      for (let dy = -1; dy <= 1; dy++) {
        const row = [];
        for (let dx = -1; dx <= 1; dx++) {
          const nx = (x + dx + 50) % 50;
          const ny = (y + dy + 50) % 50;
          row.push(gameState.grid[ny][nx]);
        }
        neighborhood.push(row);
      }

              // Execute rule (rule is stored as source code, need to evaluate it)
        try {
          // Create a simple sandbox for rule execution
          const sandbox = {
            Math: Math,
            Array: Array,
            Object: Object,
            String: String,
            Number: Number,
            Boolean: Boolean,
            console: { log: () => {}, warn: () => {}, error: () => {} },
            JSON: JSON
          };
          
          // Evaluate the rule function
          let decideFunction;
          (function(Math, Array, Object, String, Number, Boolean, console, JSON) {
            "use strict";
            eval(rule + '\ndecideFunction = decide;');
          })(sandbox.Math, sandbox.Array, sandbox.Object, sandbox.String, sandbox.Number, sandbox.Boolean, sandbox.console, sandbox.JSON);
          
          const action = decideFunction(neighborhood);
          const directionOffsets = {
            up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], stay: [0, 0]
          };
          
          const [dx, dy] = directionOffsets[action] || [0, 0];
          const nx = (x + dx + 50) % 50;
          const ny = (y + dy + 50) % 50;

          if (!newGrid[ny][nx]) {
            newGrid[ny][nx] = { ...current };
          } else {
            newGrid[y][x] = { ...current };
          }
        } catch (error) {
          newGrid[y][x] = current;
        }
    }
  }

  gameState.grid = newGrid;
  gameState.lastUpdate = Date.now();
}

// Game update loop
setInterval(updateGameState, 200);

// Broadcast game state
setInterval(() => {
  broadcast({
    type: 'game:state',
    data: {
      grid: gameState.grid,
      lastUpdate: gameState.lastUpdate
    }
  });
}, 200);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  let userId = null;
  let userName = null;

  // Send current user list to new client
  const userList = Array.from(gameState.users.entries()).map(([id, user]) => ({
    userId: id,
    userName: user.userName,
    online: true
  }));
  
  sendToClient(ws, {
    type: 'user:list',
    data: { users: userList }
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'user:join':
          userId = data.data.userId;
          userName = data.data.userName;
          
          // Store user data
          gameState.users.set(userId, {
            userName: userName,
            connectedAt: Date.now(),
            lastSeen: Date.now()
          });
          
          // Notify all clients about new user
          broadcast({
            type: 'user:joined',
            data: {
              userId: userId,
              userName: userName,
              userData: {
                connectedAt: Date.now(),
                lastSeen: Date.now()
              }
            }
          });
          
          console.log(`User ${userName} (${userId}) joined`);
          break;

        case 'rule:update':
          const { userId: ruleUserId, ruleSource } = data.data;
          
          // Store the rule source (in a real implementation, you'd validate and execute it)
          gameState.playerRules.set(ruleUserId, ruleSource);
          
          // Broadcast rule update to all clients
          broadcast({
            type: 'rule:update',
            data: {
              userId: ruleUserId,
              ruleSource: ruleSource
            }
          });
          
          console.log(`Rule updated for user ${ruleUserId}`);
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      sendToClient(ws, {
        type: 'error',
        data: { message: 'Invalid message format' }
      });
    }
  });

  ws.on('close', () => {
    if (userId) {
      // Remove user from active users
      gameState.users.delete(userId);
      gameState.playerRules.delete(userId);
      
      // Notify all clients about user leaving
      broadcast({
        type: 'user:left',
        data: { userId: userId }
      });
      
      console.log(`User ${userName} (${userId}) disconnected`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
}); 