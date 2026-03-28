# Claw Config — Visual OpenClaw Config Editor

GUI tool for managing OpenClaw agents, tools, and policies. Fork-friendly with customizable paths and secure API key handling.

![Claw Config Screenshot](docs/screenshot.png)

## Features

- **Agent Management**: Full CRUD for OpenClaw agents (identity, model, tools, compaction)
- **Tool Policy Editor**: Visual editor for tool groups, profiles, and custom permissions
- **Skills Discovery**: Auto-discover and display skills from Claude Code and OpenClaw
- **Models & Providers**: Manage LLM backends and configurations
- **Context Budget Visualization**: See token usage at a glance
- **Boot Files Management**: Edit agent boot context files
- **Secure by Default**: API keys are masked in the UI (show last 4 characters only)
- **Atomic Writes**: All config changes use temp-file-then-rename pattern
- **Auto-Backup**: Timestamped backups before every write

## Quick Start

### 1. Fork & Clone

```bash
git clone https://github.com/YourUsername/claw-config.git
cd claw-config
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Paths

Copy `.env.example` to `.env` and customize for your system:

```bash
cp .env.example .env
```

Edit `.env` with your paths:

```env
OPENCLAW_HOME=C:\Users\YourName\.openclaw
OPENCLAW_CONFIG_PATH=C:\Users\YourName\.openclaw\openclaw.json
CLAUDE_SKILLS_PATH=C:\Users\YourName\.claude\skills
OPENCLAW_SKILLS_PATH=C:\Users\YourName\.openclaw\skills
```

**Windows users**: Use backslashes `\` in paths
**macOS/Linux users**: Use forward slashes `/` in paths

### 4. Run

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Architecture

```
claw-config/
├── src/
│   ├── client/          # React SPA (Vite)
│   │   ├── store/       # Zustand state management
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── types/       # TypeScript definitions
│   │   └── lib/         # Utility functions
│   └── server/          # Express API
│       ├── routes/      # API endpoints
│       └── lib/         # Backend logic
├── .env.example         # Template for user paths
└── package.json
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 19.x |
| Build | Vite | 6.x |
| Styling | Tailwind CSS | 4.x |
| State | Zustand | 5.x |
| Backend | Express | 4.x |
| Runtime | Node.js | 22+ |

## API Endpoints

```
GET  /api/config              → Full openclaw.json as JSON
PUT  /api/config              → Write config (auto-backups first)
POST /api/config/backup       → Manual backup trigger
GET  /api/discovery/tools     → Discover available tools
GET  /api/discovery/skills    → Discover Claude & OpenClaw skills
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_HOME` | — | OpenClaw installation directory |
| `OPENCLAW_CONFIG_PATH` | — | Path to openclaw.json |
| `CLAUDE_SKILLS_PATH` | — | Claude Code skills directory |
| `OPENCLAW_SKILLS_PATH` | — | OpenClaw skills directory |
| `SERVER_PORT` | 3001 | Express server port |
| `MASK_API_KEYS` | true | Mask API keys in UI |
| `MAX_BACKUPS` | 5 | Number of backup copies to keep |

### Customizing for Your Setup

1. **Different OpenClaw location**: Update `OPENCLAW_HOME` in `.env`
2. **Custom skills directories**: Update `*_SKILLS_PATH` variables
3. **Port conflict**: Change `SERVER_PORT`
4. **Disable API key masking**: Set `MASK_API_KEYS=false` (not recommended)

## Development

```bash
npm run dev          # Start dev server (frontend + backend concurrently)
npm run build        # Build for production
npm run start        # Serve production build
npm run preview      # Preview production build locally
```

## Security

- **API keys masked**: Only last 4 characters shown in UI
- **No plaintext secrets**: Keys stay in config files, never logged
- **Atomic writes**: Config changes use temp-file-then-rename
- **Automatic backups**: Timestamped backup before every write
- **Read-only discovery**: Skill/tool scanning never modifies files

## Contributing

Fork, customize paths in `.env`, test your changes, submit PR.

## License

MIT

## Credits

Built for OpenClaw. Inspired by the need for fork-friendly, path-configurable tooling.
