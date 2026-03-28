# Changelog

## 2026-03-28

### What changed
- **Extracted from openclaw unified project** as standalone repo
- Added `.env.example` with customizable path templates
- Created comprehensive `README.md` with setup guide
- Added `INDEX.md` project index card
- Added `CLAUDE.md` protocol file with tech stack and contracts
- Enhanced `.gitignore` for Node.js + TypeScript project

### Features
- Full React+TypeScript GUI for OpenClaw config management
- Agent CRUD (identity, model, tools, compaction)
- Tool policy editor (groups, profiles, custom permissions)
- Skills/tools autodiscovery from Claude and OpenClaw directories
- Models & providers management
- Context budget visualization
- Boot files editor
- API key masking in UI (show last 4 characters only)
- Atomic config writes with temp-file-then-rename pattern
- Automatic backups before every write (configurable max count)

### Tech Stack
- Frontend: React 19 + TypeScript + Vite 6 + Tailwind 4 + Zustand 5
- Backend: Express 4 + TypeScript
- Runtime: Node.js 22+

### Git
- `6922871` Initial commit: extracted from openclaw/config-gui/
- `v0.1-extracted` tag: baseline extraction snapshot
- `dev` branch created for experiments

### Decisions
- Keep original tech stack (proven, stable, no migration churn)
- `.env`-based customization (fork-friendly, cross-platform)
- No remote origin yet (user adds when ready to publish)

### Next
- Add screenshots to README
- Test on fresh install (no OpenClaw pre-installed)
- Create GitHub repo and push when ready
