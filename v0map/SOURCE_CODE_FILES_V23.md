# V24 Upgrade Added

- Realtime voice command mode + live dictation mode.
- Project Manager window with daily to-do checklist.
- Importable habit tracker and project board JSON files.
- Voice commands to add project room, habit board, task kanban, and voice router to the 3D city.
- Voice movement commands: move NPC left/right/forward/back, send NPC to project room, summon NPC and open its shortcode window.
- New WordPress REST routes and Next proxy routes for live voice options and project templates.

# Source Code Files Added or Updated in V23

Main updated files:

- `components/virtual-gallery.tsx` — voice NPC creation, team import buttons, closable City Voice Commands tab, dynamic 3D feature builder, safer summon/open-window flow.
- `components/office-building.tsx` — more complex 3D city/building features, voice command deck, Yuka-style path node network, hologram billboards.
- `components/npc.tsx` — already contains realistic walking, steering, summon, dance, floor routing, scatter, gather, and team movement methods.
- `public/npc-team-25.import.json` — importable 25-NPC team preset.
- `public/npc-team-50.import.json` — importable 50-NPC team preset.
- `public/npc-team-100.import.json` — importable 100-NPC team preset.
- `app/api/wp/voice-commands/route.ts` — server-side proxy to WordPress voice command metadata.
- `app/api/wp/team-presets/route.ts` — server-side proxy to WordPress team preset metadata.
- `wordpress-plugin/v0map-npc-gallery-wp-plugin/v0map-npc-gallery.php` — plugin v1.19.0 with voice commands and team preset REST endpoints.
- `package.json` — new scripts and Yuka dependency placeholder for expanded pathing workflows.

Run commands:

```bash
pnpm run wp:voice-commands
pnpm run wp:team-presets
pnpm run team:25
pnpm run team:50
pnpm run team:100
pnpm exec next dev -p 3006
```
