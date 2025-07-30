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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = grid[y][x];
          if (cell) {
            ctx.fillStyle = randomColor(cell.ownerId);
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
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
  
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const current = grid[y][x];
          if (!current) continue;
  
          const rule = playerRules[current.ownerId];
          if (!rule) continue;
  
          const neighborhood = getNeighborhood(x, y);
          let action = "stay";
  
          try {
            action = rule(neighborhood);
          } catch (e) {
            console.warn("Error in rule:", e.message);
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
      const playerId = Math.random().toString(36).substring(2, 8);
      setPlayerRule(playerId, ruleSource);
  
      // Spawn player's cells
      for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        grid[y][x] = { ownerId: playerId, alive: true };
      }
    });
  
    resetGrid();
    setInterval(() => {
      updateGrid();
      drawGrid();
    }, 200);
  };
  