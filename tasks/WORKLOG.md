# Work Log

## 2026-06-04 - UI clean-room PWA branch

- Branch: `codex/ui-cleanroom-map-pwa`
- Scope: frontend UI only. No Supabase, auth, storage, save flow, deployment, or production settings were changed.
- User direction: do not push to `main`; keep this work on the current branch for later restart.

### What changed

- Rebuilt the frontend direction around a responsive, map-first PWA layout.
- Kept MapLibre GL JS with GSI aerial tiles as the main map basis.
- Replaced the old AppShell/BottomNav-style UI with new mobile-first components.
- Added new page surfaces for:
  - `/` home
  - `/map` main map
  - `/records` records timeline
  - `/menu` menu/settings surface
- Added shared mobile/PWA components and map-screen components.
- Added local run scripts for setup, cleanup, verification, and screenshots.
- Updated `.gitignore` so generated and local-only files stay out of Git:
  - `.next/`
  - `.codex/`
  - `.npm-cache/`
  - `tmp/`

### Verification completed

- `npm run lint`
- `npm run build`
- `npm run ui:screenshot`
- `git diff --check`

Screenshots were generated locally under `tmp/ui-screenshots/`. That directory is intentionally ignored by Git.

### Current quality note

The UI is improved compared with the previous old business-app style, but it is not accepted as final quality yet. Continue from this branch and keep improving the visual design before moving to backend features.

### Next recommended work

1. Review `/`, `/map`, `/records`, and `/menu` in a restarted dev server.
2. Tighten mobile page density and typography.
3. Improve real map composition and field overlays on `/map`.
4. Replace placeholder field thumbnails with approved visual assets or live data paths.
5. Only after UI acceptance, continue to record flow, auth, storage, and Supabase integration.
