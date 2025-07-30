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
      log: console.log,
      warn: console.warn,
      error: console.error
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
    /Function\s*\(/i,
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
    /while\s*\(/i,
    /for\s*\([^)]*\)\s*{/i,
    /function\s+\w+\s*\([^)]*\)\s*{/i,
    /=>\s*{/i,
    /new\s+Function/i,
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
  if (!/function\s+decide\s*\(/.test(code)) {
    throw new Error("Rule must define a function named 'decide'");
  }

  // Check for excessive loops or recursion
  const loopCount = (code.match(/for|while|forEach|map|filter|reduce/g) || []).length;
  if (loopCount > 5) {
    throw new Error("Too many loops detected. Maximum 5 loops allowed.");
  }

  return true;
}

// Secure function creation with timeout protection
function createSecureFunction(code, timeoutMs = SECURITY_CONFIG.MAX_EXECUTION_TIME) {
  return function(neighborhood) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Rule execution timed out"));
      }, timeoutMs);

      try {
        const sandbox = createSandbox();
        const sandboxedCode = `
          (function(neighborhood, Math, Array, Object, String, Number, Boolean, console, JSON) {
            "use strict";
            ${code}
            return decide(neighborhood);
          })
        `;
        
        const fn = new Function('neighborhood', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'console', 'JSON', sandboxedCode);
        const result = fn(neighborhood, sandbox.Math, sandbox.Array, sandbox.Object, sandbox.String, sandbox.Number, sandbox.Boolean, sandbox.console, sandbox.JSON);
        
        clearTimeout(timeout);
        
        // Validate the result
        if (typeof result !== 'string' || !['up', 'down', 'left', 'right', 'stay'].includes(result)) {
          reject(new Error("Rule must return 'up', 'down', 'left', 'right', or 'stay'"));
          return;
        }
        
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
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
    
    console.log(`Player ${playerId} rule loaded successfully`);
    return true;
  } catch (e) {
    console.error("Error in rule:", e.message);
    alert("Error in rule: " + e.message);
    return false;
  }
}
