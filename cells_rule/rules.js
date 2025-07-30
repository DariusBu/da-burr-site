// Map of playerId to rule function
const playerRules = {};

// Parse and store a new rule for a player
function setPlayerRule(playerId, ruleSource) {
  try {
    const fn = new Function("self", "aliveNeighbors", ruleSource);
    playerRules[playerId] = fn;
  } catch (e) {
    alert("Error in rule syntax: " + e.message);
  }
}
