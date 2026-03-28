# Claw Config
## Status: active
## Goal: GUI tool for managing OpenClaw agents, tools, and policies

## Sub-goals:
- [x] Extract config-gui from openclaw unified project
- [x] Add .env-based path customization
- [x] Create comprehensive README with setup guide
- [ ] Add screenshots to README
- [ ] Test on fresh install (no OpenClaw yet)
- [ ] Publish to GitHub as public repo

## Milestones:
- [x] M1: Extraction complete — test: files copied, .env.example created, README written
- [ ] M2: GitHub-ready — test: git init, all commits made, ready to push
- [ ] M3: First external fork — test: someone else successfully runs it
- [ ] M4: Community feedback incorporated — test: >=3 issues closed, >=1 PR merged

## Kill Criteria: None (user specified)

## Location: C:\Users\narub\Documents\Agents\Projects\claw-config\

## Dependencies:
- Node.js 22+
- npm
- OpenClaw installation (for config to manage)

## Agents:
- Claude: Opus (architect), Sonnet (implementation)
- OpenClaw: None

## Decisions:
- 2026-03-28: Extracted from openclaw/config-gui/ as standalone fork-friendly repo
- 2026-03-28: .env-based path customization for cross-platform support
- 2026-03-28: Keep original tech stack (React 19, Vite 6, Express 4, Tailwind 4, Zustand 5)

## Log:
- 2026-03-28: Project extracted from openclaw, .env.example + README.md created, ready for git init
