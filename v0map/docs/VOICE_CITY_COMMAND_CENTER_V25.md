# V25 Voice City Command Center

This upgrade expands the realtime voice, NPC, shortcode, and project management system.

## What is new

- Voice command schema API: `/api/voice/command-schema`
- Voice command parser API: `/api/voice/parse?q=NPC%201%20come%20here`
- WordPress voice command suite proxy: `/api/wp/voice-command-suite`
- WordPress project manager suite proxy: `/api/wp/project-manager-suite`
- WordPress NPC movement playbook proxy: `/api/wp/npc-movement-playbook`
- Project JSON export from the live Project Manager window
- Voice command history in the floating voice blob
- Auto-open windows toggle for summon/follow actions
- New voice-built city objects:
  - project board wall
  - voice command gate
  - automation lab
  - client portal room
  - media studio
  - calendar command room
- New NPC movement commands:
  - `NPC 2 follow me`
  - `NPC 3 patrol route`
  - `freeze all NPCs`
  - `send NPC 5 to project room`

## New import files

- `/voice-command-center.import.json`
- `/project-sprint-30-day.import.json`
- `/habit-tracker-advanced.import.json`
- `/npc-movement-playbook.import.json`

## Safety model

Browser voice recognition runs inside the browser. WordPress Application Password credentials stay server-side in the Next.js API routes. Local terminal-style commands remain allow-listed to safe diagnostic scripts only.
