# V24 Realtime Voice + Project Manager Upgrade

This build expands the 3D WordPress NPC city with realtime voice command mode, live dictation mode, a real project-management window, importable daily checklist data, importable habit tracker data, and new voice movement commands.

## New voice modes

- **Command mode** controls NPCs, shortcode windows, city features, and safe local WordPress diagnostic scripts.
- **Dictation mode** saves spoken notes into the Project Manager window until you say `command mode`.

## New project window

Open it with:

- `open project manager`
- `show checklist`
- `habit tracker`
- The Projects button in the floating voice blob

The window includes:

- Daily to-do list
- Project checklist
- Habit tracker
- Live dictation notes
- Wide/normal mode
- Import buttons for project board and habit tracker JSON

## New import files

- `/public/project-management.import.json`
- `/public/habit-tracker.import.json`

## New city features

Voice commands can add:

- Project Management Room
- Habit Tracker Board
- Daily Task Kanban
- Realtime Voice Router

## New NPC movement commands

Examples:

- `NPC 1 come here`
- `move NPC 2 left`
- `move NPC 3 forward`
- `send NPC 4 to project room`
- `dance all`

## New REST/API routes

Next.js proxy routes:

- `/api/wp/live-voice-options`
- `/api/wp/project-templates`

WordPress plugin routes:

- `/wp-json/v0map-npc/v1/live-voice-options`
- `/wp-json/v0map-npc/v1/project-templates`

## New scripts

- `pnpm run wp:live-voice`
- `pnpm run wp:project-templates`
- `pnpm run project:import`
- `pnpm run habits:import`
