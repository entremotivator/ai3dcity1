# V23 Voice City NPC Builder Upgrade

This build extends the v22 live WordPress shortcode city into a fuller voice-controlled NPC operating system.

## New UI features

- Closable **City Voice Commands** tab.
- Floating voice blob keeps quick actions for Brand GPT, next window, NPC summon, dance, WordPress refresh, voice NPC creation, and Yuka path nodes.
- Live shortcode window still supports next, previous, close, widescreen, open page, edit WordPress, come here, and dance.
- Only one live WordPress shortcode iframe is opened at a time.

## New voice commands

Say commands like:

- `create NPC named Revenue Coach`
- `create NPC named Mission Guide with shortcode aisc_missions`
- `NPC 7 come here`
- `agent workflow chat come here`
- `dance all`
- `walk realistic`
- `scatter NPCs`
- `gather team`
- `send leadership to floor 2`
- `import team 25`
- `import team 50`
- `import team 100`
- `add AI tower`
- `add command pod`
- `add voice stage`
- `add skybridge`
- `add WordPress API core`
- `add Yuka path node`
- `wide screen`
- `close window`
- `refresh WordPress API`

## Voice-created NPCs

The app now parses voice commands and creates a new NPC in front of the player. The new NPC:

- gets a unique ID,
- uses `/models/avatar.glb`,
- receives a live WordPress shortcode window,
- is summoned in front of the user,
- opens its shortcode window immediately,
- can dance, roam, and be summoned again.

## Importable teams

New import files are included in `/public`:

- `/npc-team-25.import.json`
- `/npc-team-50.import.json`
- `/npc-team-100.import.json`

Each file maps NPC IDs to approved WordPress shortcode windows only.

## 3D city feature builder

Voice and button controls can add runtime 3D objects:

- AI tower
- Skybridge
- Command pod
- Voice stage
- WordPress API core
- Yuka-style path node

These spawn in front of the player on the current floor.

## Building complexity upgrade

`components/office-building.tsx` now includes:

- voice command decks on every floor,
- Yuka-style visible path network nodes and rails,
- extra WordPress API hologram billboards,
- existing command atrium, skybridges, server racks, elevator, ramps, rooftop deck.

## New WordPress plugin REST endpoints

- `/wp-json/v0map-npc/v1/voice-commands`
- `/wp-json/v0map-npc/v1/team-presets`

These expose voice command metadata and team preset information for live API sync.
