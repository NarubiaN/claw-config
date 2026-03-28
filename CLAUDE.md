# Claw Config — Project Protocol

## Identity
You are working on **claw-config**, a standalone visual config editor for OpenClaw. This is a fork-friendly tool that anyone can customize for their own OpenClaw installation.

## Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Frontend | React + TypeScript | 19.x | Modern, type-safe UI |
| Build | Vite | 6.x | Fast dev server, optimized builds |
| Styling | Tailwind CSS | 4.x | Utility-first, no custom CSS |
| State | Zustand | 5.x | Simple, minimal boilerplate |
| Backend | Express | 4.x | Mature, stable API server |
| Runtime | Node.js | 22+ | Latest LTS |

No database. No ORM. **The filesystem IS the database** — everything reads/writes `openclaw.json`.

## Architecture

```
claw-config/
├── src/
│   ├── client/          # React SPA (Vite + TypeScript)
│   │   ├── store/       # Zustand stores (state management)
│   │   ├── components/  # React components (Tailwind styled)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── types/       # TypeScript type definitions
│   │   └── lib/         # Client utilities
│   └── server/          # Express API (TypeScript)
│       ├── routes/      # API route handlers
│       └── lib/         # Server utilities
├── .env.example         # Template for user customization
├── .env                 # User's actual paths (gitignored)
└── package.json
```

## Conventions

**Naming**:
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Types/interfaces: `PascalCase`

**Patterns**:
- Functional React components only (no classes)
- Zustand for state (no Redux, no Context)
- Fetch API for HTTP (no axios)
- Tailwind only (no CSS modules, no styled-components)

**File Structure**:
- One component per file
- Co-locate types with components when small
- Shared types go in `src/client/types/` or `src/server/types/`

## Domains

| Domain | Owner | Paths | Responsibilities |
|--------|-------|-------|------------------|
| Frontend | pm-sonnet-ui | src/client/ | React components, Zustand stores, UI logic |
| Backend | pm-sonnet-api | src/server/ | Express routes, file I/O, validation |

## Contracts

### Frontend ↔ Backend

**API Endpoints**:
```
GET  /api/config              → { ...openclaw.json contents }
PUT  /api/config              → body: { ...new config }, response: { success: bool, backup?: string }
POST /api/config/backup       → response: { backup: string }
GET  /api/discovery/tools     → { groups: {...}, profiles: {...}, allTools: [...] }
GET  /api/discovery/skills    → { claude: [...], openclaw: [...] }
GET  /api/leanboot            → { agentRules: { [agentId]: string[] }, available: string[] }
PUT  /api/leanboot            → body: { agentRules: { [agentId]: string[] } }, response: { success: bool, hookPath: string }
```

**Error Format**:
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Backend ↔ Filesystem

**Config Read**:
- Path from `process.env.OPENCLAW_CONFIG_PATH`
- Parse JSON, validate schema
- Return parsed object or throw

**Config Write**:
- Backup current file first (timestamped)
- Write to temp file
- Rename temp → real (atomic)
- Return backup path

**Skills Discovery**:
- Read from `process.env.CLAUDE_SKILLS_PATH` and `process.env.OPENCLAW_SKILLS_PATH`
- Scan for SKILL.md files
- Return array of skill metadata

**Lean Boot Hook Write**:
- Path: `~/.openclaw/hooks/lean-boot/`
- Create directory if doesn't exist
- Write `handler.js` with agent-specific file stripping logic
- Write `HOOK.md` with metadata (name, description, events)
- Atomic write pattern (temp → rename)
- Return hook path for verification

## Lean Boot Feature

**Purpose**: Per-agent configuration of boot file stripping to reduce context size and token usage.

**Data Structure**:
```typescript
interface LeanBootConfig {
  agentRules: {
    [agentId: string]: string[];  // agentId → array of files to strip
  };
}

// Available boot files to strip
const STRIPPABLE_FILES = [
  'SOUL.md',
  'BOOTSTRAP.md',
  'IDENTITY.md',
  'AGENTS.md',
  'TOOLS.md',
  'USER.md',
  'HEARTBEAT.md',
  'MEMORY.md',
  'models.json',
  'auth-profiles.json'
];
```

**UI Flow**:
1. User navigates to "Lean Boot" page
2. UI fetches current config via `GET /api/leanboot`
3. User sees agent list with checkboxes for each strippable file
4. User toggles files to strip per agent
5. User clicks "Save" → `PUT /api/leanboot` with new config
6. Backend writes hook to `~/.openclaw/hooks/lean-boot/`
7. UI shows success message + reminder to restart gateway

**Hook Output** (`~/.openclaw/hooks/lean-boot/handler.js`):
```javascript
const AGENT_RULES = {
  'agent-id-1': ['SOUL.md', 'BOOTSTRAP.md'],
  'agent-id-2': ['TOOLS.md']
};

export default async (event) => {
  const agentId = event.context.agentId;
  const filesToStrip = AGENT_RULES[agentId] || [];

  event.context.bootstrapFiles = event.context.bootstrapFiles.filter(
    f => !filesToStrip.includes(f.name)
  );
};
```

**Validation**:
- Agent IDs must exist in openclaw.json
- File names must be in STRIPPABLE_FILES list
- Empty rules (no files stripped) are valid
- Hook directory creation requires write permissions

## Constraints

**Security**:
- API keys MUST be masked in UI (show last 4 chars only)
- No API keys in logs or error messages
- No shell execution from user input
- Validate all file paths (no `../` escapes)

**Performance**:
- Config writes must be atomic (temp-then-rename)
- Auto-backup before every write
- Keep max 5 backups (configurable via `MAX_BACKUPS` env var)

**Compatibility**:
- Windows: Use backslashes `\` in .env paths
- macOS/Linux: Use forward slashes `/` in .env paths
- Must work with any OpenClaw installation location
- Must handle missing skills directories gracefully

**Customization**:
- All paths configurable via `.env`
- `.env.example` must document all variables
- Default values for optional variables
- Clear error messages when required env vars missing

## Verification

**Build must pass**:
```bash
npm run build
# No TypeScript errors, no build failures
```

**Dev server must start**:
```bash
npm run dev
# Frontend on http://localhost:5173
# Backend on http://localhost:3001
# No runtime errors
```

**Config read/write works**:
- GET /api/config returns valid JSON
- PUT /api/config creates backup
- PUT /api/config updates file atomically

## Git Strategy

- Main branch: `main` (stable, ready to clone)
- Dev branch: `dev` (experiments, WIP)
- Tags: `v{major}.{minor}.{patch}` for releases
- **Local-only**: No remote until user explicitly creates GitHub repo

## Known Issues

None yet (freshly extracted).

## Quality Checklist

- [ ] All TypeScript files type-check (`npm run build` succeeds)
- [ ] .env.example has all variables documented
- [ ] README.md has clear setup instructions
- [ ] .gitignore excludes .env and node_modules
- [ ] API key masking works in UI
- [ ] Config writes are atomic (temp-then-rename)
- [ ] Backups are created before writes
- [ ] Error messages are clear and actionable
