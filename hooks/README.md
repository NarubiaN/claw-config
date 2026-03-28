# OpenClaw Hooks

This directory contains optional OpenClaw hooks that can be installed globally for ecosystem-wide availability.

## What are OpenClaw Hooks?

Hooks are Node.js modules that intercept and modify OpenClaw's behavior at specific trigger points (agent bootstrap, command execution, gateway startup, etc.). They run in the gateway process and can transform data, add context, or enforce policies.

## Installation

To make a hook available to **all agents** in your OpenClaw installation:

1. Copy the hook folder to OpenClaw's global hooks directory:
   ```bash
   cp -r hooks/your-hook-name ~/.openclaw/hooks/
   ```

2. Restart the gateway to register the hook:
   ```bash
   openclaw gateway restart
   ```

OpenClaw will automatically discover and register all hooks in `~/.openclaw/hooks/`.

## Hook Structure

Each hook folder must contain:
- `package.json` — Hook metadata (name, version, triggers)
- `handler.js` — Hook implementation (exports handler function)

Example `package.json`:
```json
{
  "name": "your-hook-name",
  "version": "1.0.0",
  "main": "handler.js",
  "openclaw": {
    "hook": {
      "triggers": ["agent:bootstrap"]
    }
  }
}
```

Example `handler.js`:
```javascript
export default async function handler(context, next) {
  // Modify context here
  console.log('Hook triggered:', context.trigger);

  // Continue to next hook
  return next();
}
```

## Available Hooks

Currently, no hooks are bundled with claw-config. You can add your own hooks here and they'll be included in the repository for easy distribution.

### Recommended Hooks

- **lean-boot**: Reduces agent bootstrap context size for faster initialization and lower token usage
- **session-memory**: Persists session state across restarts
- **command-logger**: Logs all agent commands for debugging

## Creating Custom Hooks

See OpenClaw documentation: https://docs.openclaw.ai/hooks

## Verification

After installing a hook, verify it's registered:

```bash
# Check gateway logs for hook registration
openclaw gateway logs | grep "Registered hook"

# Expected output:
# [hooks:loader] Registered hook: your-hook-name -> agent:bootstrap
```
