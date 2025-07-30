const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const rows = 50;
const cols = 50;
const cellSize = canvas.width / cols;

// Each cell: {ownerId, alive: boolean}
let grid = Array(rows).fill().map(() => Array(cols).fill(null));

// Generate initial empty state
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

function countAliveNeighbors(x, y) {
  const offsets = [-1, 0, 1];
  const neighborCounts = {};
  let totalAlive = 0;

  for (let dy of offsets) {
    for (let dx of offsets) {
      if (dx === 0 && dy === 0) continue;
      const nx = (x + dx + cols) % cols;
      const ny = (y + dy + rows) % rows;
      const neighbor = grid[ny][nx];
      if (neighbor) {
        totalAlive++;
        neighborCounts[neighbor.ownerId] = (neighborCounts[neighbor.ownerId] || 0) + 1;
      }
    }
  }

  return { totalAlive, neighborCounts };
}

function updateGrid() {
  const newGrid = Array(rows).fill().map(() => Array(cols).fill(null));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const current = grid[y][x];
      const { totalAlive, neighborCounts } = countAliveNeighbors(x, y);

      // Decide which player "wins" the local neighborhood
      const topPlayer = Object.entries(neighborCounts).sort((a, b) => b[1] - a[1])[0];
      const winningId = topPlayer ? topPlayer[0] : null;
      const rule = playerRules[winningId];

      if (rule) {
        const willLive = rule(!!current, totalAlive);
        if (willLive) {
          newGrid[y][x] = { ownerId: winningId, alive: true };
        }
      }
    }
  }

  grid = newGrid;
}

document.getElementById("join-btn").addEventListener("click", () => {
  const ruleSource = document.getElementById("rule-input").value;
  const playerId = Math.random().toString(36).substring(2, 8);
  setPlayerRule(playerId, ruleSource);

  // Spawn some random cells for the new player
  for (let i = 0; i < 50; i++) {
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
