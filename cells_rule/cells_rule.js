window.onload = function () {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const rows = 50;
    const cols = 50;
    const cellSize = canvas.width / cols;

    let grid = Array(rows).fill().map(() => Array(cols).fill(null));

    function resetGrid() {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          grid[y][x] = null;
        }
      }
    }

    function randomColor(id) {
      const seed = parseInt(id, 36);
      const hue = seed % 360;
      return `hsl(${hue}, 80%, 50%)`;
    }

    function drawGrid() {
      // Fill background white
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw cells
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y][x];
          if (cell) {
            ctx.fillStyle = randomColor(cell.ownerId);
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
      // Draw grid lines
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvas.width, y * cellSize);
        ctx.stroke();
      }
    }

    function getNeighborhood(x, y) {
      const n = [];
      for (let dy = -1; dy <= 1; dy++) {
        const row = [];
        for (let dx = -1; dx <= 1; dx++) {
          const nx = (x + dx + cols) % cols;
          const ny = (y + dy + rows) % rows;
          row.push(grid[ny][nx]);
        }
        n.push(row);
      }
      return n;
    }

    const directionOffsets = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
      stay: [0, 0],
    };

    function updateGrid() {
      const newGrid = Array(rows).fill().map(() => Array(cols).fill(null));
      let cellsProcessed = 0;
      let actionsTaken = { up: 0, down: 0, left: 0, right: 0, stay: 0 };

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const current = grid[y][x];
          if (!current) continue;

          const rule = playerRules[current.ownerId];
          if (!rule) {
            continue;
          }

          cellsProcessed++;
          const neighborhood = getNeighborhood(x, y);
          let action = 'stay';

          try {
            action = rule(neighborhood);
            actionsTaken[action] = (actionsTaken[action] || 0) + 1;
          } catch (error) {
            action = 'stay';
            actionsTaken.stay++;
          }

          const [dx, dy] = directionOffsets[action] || [0, 0];
          const nx = (x + dx + cols) % cols;
          const ny = (y + dy + rows) % rows;

          // Move if destination is empty
          if (!newGrid[ny][nx]) {
            newGrid[ny][nx] = { ...current };
          } else {
            // If collision, stay in place
            newGrid[y][x] = { ...current };
          }
        }
      }

      // Removed logging for cleaner output

      grid = newGrid;
    }

    const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
      lineNumbers: true,
      mode: "javascript",
      theme: "default",
      viewportMargin: Infinity,
    });

    document.getElementById("join-btn").addEventListener("click", () => {
      const ruleSource = editor.getValue();
      
      // Check if we have a multiplayer client and user
      if (window.multiplayerClient && window.multiplayerClient.userId) {
        const playerId = window.multiplayerClient.userId;
        
        // Try to set the player rule
        if (setPlayerRule(playerId, ruleSource)) {
          // Send rule update to server
          window.multiplayerClient.updateUserRule(ruleSource);
          
          // Spawn player's cells only if rule was successfully loaded
          for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * rows);
            grid[y][x] = { ownerId: playerId, alive: true };
          }
          
          // Update button text to show success
          const btn = document.getElementById("join-btn");
          btn.textContent = "Rule Updated!";
          btn.style.background = "#28a745";
          
          // Reset button after 2 seconds
          setTimeout(() => {
            btn.textContent = "Update Rule";
            btn.style.background = "#007bff";
          }, 2000);
        }
      } else {
        // Fallback to single player mode
        const playerId = Math.random().toString(36).substring(2, 8);
        
        if (setPlayerRule(playerId, ruleSource)) {
          for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * rows);
            grid[y][x] = { ownerId: playerId, alive: true };
          }
          
          const btn = document.getElementById("join-btn");
          btn.textContent = "Rule Loaded!";
          btn.style.background = "#28a745";
          
          setTimeout(() => {
            btn.textContent = "Update Rule";
            btn.style.background = "#007bff";
          }, 2000);
        }
      }
    });

    resetGrid();
    
    // Make setPlayerRule globally accessible for multiplayer
    window.setPlayerRule = setPlayerRule;
    
    // Function to update game from server state
    window.updateGameFromServer = function(serverGameState) {
      if (serverGameState && serverGameState.grid) {
        // Update local grid with server state
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (serverGameState.grid[y] && serverGameState.grid[y][x]) {
              grid[y][x] = serverGameState.grid[y][x];
            }
          }
        }
      }
    };
    
    setInterval(() => {
      updateGrid();
      drawGrid();
    }, 200);
  };
  