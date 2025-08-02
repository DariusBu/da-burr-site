# Cells Rule - Multiplayer Cellular Automaton

A multiplayer cellular automaton game where players write JavaScript rules to control their cells and compete in a shared world.

## Features

- **Multiplayer Support**: Real-time multiplayer gameplay with WebSocket connections
- **User Persistence**: Users can return to their previous sessions
- **Rule-based Gameplay**: Write JavaScript functions to control cell behavior
- **Secure Sandbox**: Safe execution environment for user code
- **Real-time Updates**: Live game state synchronization across all players

## Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install server dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## How to Play

1. **Join the Game**: Enter your name when prompted (this will be saved for future sessions)
2. **Write Your Rule**: Use the code editor to write a JavaScript function named `decide`
3. **Update Your Rule**: Click "Update Rule" to apply your changes
4. **Watch Your Cells**: Your cells will spawn and follow your rule in the shared world

## Rule Function Format

Your rule function should:
- Be named `decide`
- Accept a `neighborhood` parameter (3x3 array representing surrounding cells)
- Return one of: `'up'`, `'down'`, `'left'`, `'right'`, or `'stay'`

Example:
```javascript
function decide(neighborhood) {
  // Move randomly
  const directions = ['up', 'down', 'left', 'right', 'stay'];
  return directions[Math.floor(Math.random() * directions.length)];
}
```

## Security

The game includes several security measures:
- Code length limits
- Dangerous pattern detection
- Sandboxed execution environment
- Limited API access

## Multiplayer Features

- **User Management**: Persistent user accounts with localStorage
- **Real-time Updates**: Live synchronization of game state
- **User List**: See all connected players
- **Connection Status**: Monitor your connection to the server
- **Automatic Reconnection**: Handles network interruptions gracefully

## Development

### Project Structure

```
cells_rule/
├── index.html          # Main game interface
├── cells_rule.js       # Game logic and rendering
├── rules.js           # Rule validation and execution
├── ws-client.js       # Multiplayer client
├── server.js          # WebSocket server
├── package.json       # Server dependencies
├── style.css          # Game styling
└── codemirror/        # Code editor library
```

### Running in Development

For development with auto-restart:
```bash
npm run dev
```

### Customization

- **Server Port**: Change the port in `server.js` (default: 8080)
- **Game Speed**: Adjust the update interval in `server.js` (default: 200ms)
- **Grid Size**: Modify the grid dimensions in both client and server files

## Troubleshooting

### Connection Issues
- Ensure the server is running on the correct port
- Check that your firewall allows WebSocket connections
- Verify the WebSocket URL in `ws-client.js`

### Rule Errors
- Check the browser console for error messages
- Ensure your rule function is named `decide`
- Verify your function returns a valid direction string

### Performance Issues
- Reduce the number of cells spawned per player
- Increase the update interval for slower gameplay
- Check server resources and client performance

## License

MIT License - see LICENSE file for details. 