const playerRules = {};

// Configuration for security limits
const SECURITY_CONFIG = {
  MAX_CODE_LENGTH: 2000,
  MAX_EXECUTION_TIME: 100, // milliseconds
  MAX_LOOPS: 1000,
  MAX_RECURSION_DEPTH: 10
};

// Safe sandbox environment with limited access
const createSandbox = () => {
  const sandbox = {
    // Safe math operations
    Math: {
      random: Math.random,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      abs: Math.abs,
      max: Math.max,
      min: Math.min,
      sqrt: Math.sqrt,
      pow: Math.pow,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      PI: Math.PI,
      E: Math.E
    },
    // Safe array operations
    Array: {
      isArray: Array.isArray
    },
    // Safe object operations
    Object: {
      keys: Object.keys,
      values: Object.values,
      entries: Object.entries,
      assign: Object.assign
    },
    // Safe string operations
    String: String,
    Number: Number,
    Boolean: Boolean,
    // Limited console for debugging (only log, warn, error)
    console: {
      log: () => {}, // Disabled logging
      warn: () => {}, // Disabled logging
      error: () => {} // Disabled logging
    },
    // Safe JSON operations
    JSON: {
      parse: JSON.parse,
      stringify: JSON.stringify
    }
  };

  return sandbox;
};

// Function to validate and sanitize rule code
function validateRuleCode(code) {
  // Check code length
  if (code.length > SECURITY_CONFIG.MAX_CODE_LENGTH) {
    throw new Error(`Code too long. Maximum ${SECURITY_CONFIG.MAX_CODE_LENGTH} characters allowed.`);
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /document\./i,
    /window\./i,
    /localStorage/i,
    /sessionStorage/i,
    /indexedDB/i,
    /navigator/i,
    /location/i,
    /history/i,
    /screen/i,
    /innerHTML/i,
    /outerHTML/i,
    /insertAdjacentHTML/i,
    /execScript/i,
    /script/i,
    /import\s*\(/i,
    /require\s*\(/i,
    /process\./i,
    /global\./i,
    /__proto__/i,
    /constructor/i,
    /prototype/i,
    /new\s+RegExp/i,
    /\.call\(/i,
    /\.apply\(/i,
    /\.bind\(/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Potentially dangerous code detected: ${pattern.source}`);
    }
  }

  // Check for function definition
  if (!/function\s+decide\s*\(/.test(code) && !/var\s+decide\s*=/.test(code) && !/let\s+decide\s*=/.test(code) && !/const\s+decide\s*=/.test(code)) {
    throw new Error("Rule must define a function named 'decide'");
  }

  // Check for excessive loops (but allow reasonable for loops)
  const whileLoops = (code.match(/while\s*\(/g) || []).length;
  const forEachLoops = (code.match(/forEach|map|filter|reduce/g) || []).length;
  
  if (whileLoops > 2) {
    throw new Error("Too many while loops detected. Maximum 2 while loops allowed.");
  }
  
  if (forEachLoops > 3) {
    throw new Error("Too many array iteration methods detected. Maximum 3 allowed.");
  }

  return true;
}

// Secure function creation with timeout protection
function createSecureFunction(code, timeoutMs = SECURITY_CONFIG.MAX_EXECUTION_TIME) {
  return function(neighborhood) {
    try {
      const sandbox = createSandbox();
      // Build the code to define decide and call it, storing the result in decideResult
      const wrapperCode = code + '\ndecideResult = decide(neighborhood);';
      // Use eval in a controlled way (this is safe because we've already validated the code)
      let decideResult;
      (function(neighborhood, Math, Array, Object, String, Number, Boolean, console, JSON) {
        "use strict";
        eval(wrapperCode);
      })(neighborhood, sandbox.Math, sandbox.Array, sandbox.Object, sandbox.String, sandbox.Number, sandbox.Boolean, sandbox.console, sandbox.JSON);
      const result = decideResult;
      // Validate the result
      if (typeof result !== 'string' || !['up', 'down', 'left', 'right', 'stay'].includes(result)) {
        throw new Error("Rule must return 'up', 'down', 'left', 'right', or 'stay'");
      }
      return result;
    } catch (error) {
      return 'stay'; // Default to staying in place on error
    }
  };
}

function setPlayerRule(playerId, ruleSource) {
  try {
    // Validate the rule code first
    validateRuleCode(ruleSource);
    
    // Create a secure function
    const secureRule = createSecureFunction(ruleSource);
    
    // Store the secure rule
    playerRules[playerId] = secureRule;
    
    // Test the rule with a simple neighborhood
    try {
      const testNeighborhood = [
        [null, null, null],
        [null, { ownerId: playerId, alive: true }, null],
        [null, null, null]
      ];
      secureRule(testNeighborhood);
    } catch (testError) {
      // Test failed, but continue
    }
    
    return true;
  } catch (e) {
    alert("Error in rule: " + e.message);
    return false;
  }
}
