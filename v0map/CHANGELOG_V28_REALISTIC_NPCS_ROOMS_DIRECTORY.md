# V28 — Realistic NPC Walking, Glitch Fixes, Rooms, Gestures, Live NPC Directory

## Critical bug fixes (root causes, not patches)

### 1. Frozen movement after minimizing the voice command window — FIXED
Three separate root causes were found and fixed:

- **Pointer-lock stealing on UI clicks.** A window-level click listener re-locked the
  pointer on ANY click — including the minimized "Voice Commands" button, panels, and
  forms. This fought the UI, threw `pointer lock exited too recently` browser errors,
  and left input in a broken state. Pointer lock now only engages when you click the
  actual 3D canvas.
- **Re-lock was permanently blocked after unlock.** Unlocking (Esc, opening a window,
  minimizing panels) flipped `isControlsEnabled` to false, and that same flag gated the
  `lock()` call — so once you unlocked, you could never lock again. Re-locking is now
  always allowed on a canvas click.
- **Movement now works without pointer lock.** WASD/arrows/joysticks run every frame
  regardless of lock state; only mouse-look requires pointer lock. Minimize anything —
  you keep walking.

### 2. Full-scene rebuild glitches — FIXED
The scene-setup effect depended on handler identities (`handleClick`, `handleKeyDown`,
`handleMovement`, …) and on `npcData`. Every pointer-lock change, flying-mode toggle,
voice window interaction, or NPC edit created new handler identities → the effect
re-ran → **the entire 3D world was torn down and rebuilt** (model reloads, NPC resets,
visible freezes). Fixes:

- Scene setup now mounts **once**. Event listeners are stable wrappers that read the
  latest handlers through a ref.
- All handlers read live state through refs (`flyingModeRef`, `isControlsEnabledRef`)
  instead of capturing stale state.
- NPC edits go through a new `NPCManager.syncNPCs()` diff: update-in-place / add /
  remove — never dispose-and-rebuild. `handleAddNPC`, `handleRemoveNPC`, and
  voice-created NPCs all use it now.

### 3. WASD never worked — FIXED
The key map used lowercase `"w"/"a"/"s"/"d"` which can never match `event.code`
(`"KeyW"`). New standard FPS layout: **WASD move + strafe, Q/E rotate, arrows move**.
Keyboard input is also ignored while typing in any form field.

### 4. NPC teleport / spaz glitches after tab switch — FIXED
Frame delta is now clamped to 100 ms in both the render loop and every NPC update, so
returning from a background tab no longer applies seconds of physics in one frame.

### 5. Misc
- Flying max height raised 40 → 82 so `flyUp` can actually reach the rooftop.
- Pointer-lock detection now checks the renderer canvas (it previously compared against
  the wrong element and always reported unlocked).

## Realistic NPC walking upgrades
- **Turn-in-place:** NPCs facing the wrong way rotate first, then walk — no more
  sideways moonwalk gliding.
- **Crowd separation steering:** NPCs steer away from neighbors within 1.5 units on the
  same floor; no more clipping through each other.
- **Ambient gestures:** while paused looking around, NPCs occasionally think, nod, or
  wave on their own.

## NEW: NPC gesture system
Seven procedural gestures, each facing the player: **wave, nod, point, cheer, clap,
think, salute**. Crowd gestures stagger 120 ms per NPC so they look organic.
- Voice: `NPC 3 wave`, `cheer all`, `everyone salute`, `nod all`
- UI: gesture row in the voice command panel + "Wave All" quick button
- API: `NPCManager.gestureNPCs(ids, type, duration)`

## NEW: Level & room features on every floor
Procedural themed rooms with signs and glowing teleport pads (`level-features.tsx`):

| Floor | Rooms |
|---|---|
| 1 | Lobby & Reception (desk, rug, planters) · Cafe Corner (counter, stools, espresso machine) |
| 2 | Boardroom (8-seat table, whiteboard, wall screen) · Focus Pods (3 glowing dome pods) |
| 3 | Arcade Lounge (4 neon cabinets, sofa, neon bar) · Media Wall (screening wall, sofas) |
| Roof | Rooftop Garden (planters, benches, string lights) · Helipad (H-circle, beacons) |

- Voice: `go to the lobby`, `take me to the boardroom`, `go to the arcade`,
  `go to the rooftop garden`, `go to the helipad`, …
- UI: Rooms grid in the voice command panel — one tap teleports you there.

## NEW: Live in-app NPC Directory editor
Press **N**, say **"open NPC directory"**, or tap the panel button.

- Edit EVERY field live: name, color (picker), role, team, floor, walk speed slider,
  3D model URL, WP shortcode tag, status, bio, dialogue lines.
- Add, duplicate, and remove NPCs — they spawn/despawn instantly in the world.
- Search + team filter, Summon and Wave buttons per NPC.
- Import / Export directory JSON.
- **Auto-persists to localStorage** (`v0map-npc-directory-v28`) and reloads your edits
  on the next visit. One-click Reset to defaults.
- All edits stream into the running scene via `syncNPCs` — zero reloads.

## WordPress plugin 1.24.0
- Voice-command-suite REST metadata now includes `npc-gestures`, `room-navigation`,
  and `npc-directory` groups.
- Version bump + readme changelog.

## Controls (updated)
- **WASD / Arrows** — move & strafe · **Q/E** — rotate · **Mouse** — look (click canvas)
- **N** — NPC Directory · **F** — fly · **R** — reset height · **PageUp/PageDown or Z** — fly up/down
- **H** — controls · **J** — joysticks · **M** — menu · **Esc** — release mouse

---

# V28.2 — Group Actions, Yuka Paths, Textures, Roof Portals

## NPC group actions (big new button grid + voice)
15-button "Group Actions" panel: **Circle Me, Grid Up, Two Rows, V Form, Orbit Me,
Patrol Floor, Figure 8, Guard Rooms, Gather All, Scatter, Dance All, Cheer All,
Freeze, Unfreeze, Stop Routes.** Voice: "circle up", "grid formation", "orbit me",
"patrol the floor", "figure eight", "guard the rooms", "freeze all NPCs", "unfreeze",
"stop routes".

## Yuka-style patrol routes with visible paths
New `NPCManager.startPatrolRoute()` — NPCs walk waypoint loops (staggered along the
route so crowds spread out), advancing node-to-node on arrival. Routes draw **glowing
path lines + node spheres** in the world (`drawPath`/`clearPaths`). Orbit Me = ring
route around you; Patrol Floor = rectangle sweep; Figure 8 = twin tangent rings.
Freeze/statue mode per-NPC (`setFrozen`) fully halts movement while keeping idle anim.

## Better textures (procedural, zero downloads)
New `lib/procedural-textures.ts` canvas generators, cached and applied to the building:
- Floor 1: polished **tile** with grout + sheen
- Floor 2: warm **wood planks** with grain and staggered joints
- Floor 3: woven **carpet** with fleck pattern
- Rooftop: weathered **concrete** with cracks, stains, expansion joints
- Ceilings: acoustic **tile grid** · Room walls: **brushed panels** tinted per room color

## 5 rooftop door portals → localhost:3001-3005 (same tab)
Five glowing door frames along the roof's back edge, labeled PORT 3001-3005, each with
a step pad and colored panel. **Clicking a portal navigates THIS tab**
(`window.location.href`) — no new tab — to `http://localhost:3001` … `3005`. Also
available as 5 buttons in the panel and by voice: "portal 3002", "open port 3001".
Portal clicks work both pointer-locked (crosshair raycast from screen center — also
fixes NPC clicks while locked) and unlocked (cursor raycast), and hits anywhere on the
door resolve via ancestor userData traversal.

---

# V28.3 — 5 Floors, 10 Walk-Through Portals, Pro MiniMap, Xbox Mouse Mode, UI Settings

## Building: 5 floors + rooftop (was 3)
- **Floor 4 — AI Lab**: server racks with glowing strips, hologram core, Podcast
  Studio (mics, ON AIR sign). **Floor 5 — Command Deck**: Trading Floor (ticker
  wall, desk rows with monitors), Training Dojo (mats, targets, gong).
- Rooftop now at y=100. Everything auto-adapted: stairs/elevator/labels, NPC
  distribution across floors, floor voice nav ("go floor 5", "go rooftop"),
  fly-mode ceiling, movement bounds, directory floor picker, per-floor textures
  (tile / wood / carpet / teal tile / green carpet).

## 10 portals, WALK-THROUGH activation
- Back row 3001-3005, front row 3006-3010 on the roof.
- **Walk through a doorway — no click needed** — and this tab navigates to
  `http://localhost:300X` (position saved first). Clicking still works, plus 10
  panel buttons and voice ("portal 3007", "open port 2").

## MiniMapPro: floor tabs + layer features
- Tabs for **Auto / 1F-5F / Roof** with live NPC counts per floor and a ● marker
  on your floor. Auto mode follows you between floors.
- Layer toggles: **NPCs / Rooms / Portals / Labels**. NPCs one floor away show as
  dim ghosts; frozen NPCs get an ice ring.
- **Tap a room dot or portal square on the map to teleport/enter.**
- Expandable, and collapsible to a small "Map" pill.

## Xbox controller: RSB mouse mode + mini keyboard
- Press **RSB** (right stick click): an on-screen cursor appears. **Right stick
  moves it, A (or RT) clicks** any button/tab/input, **Y opens a mini QWERTY
  keyboard** (types into whatever input you clicked — works with React inputs),
  **B or RSB exits**. Walking input is suspended while in mouse mode so the
  camera doesn't fight the cursor.

## UI Settings: hide each or all buttons
- New ⚙ panel with a switch for every HUD element: voice panel (and each of its
  sections individually), quick command dock, minimap, joysticks, flying
  controls, controller badge. **Hide ALL / Show ALL** one-tap. Persisted.
- A small ⚙ pill stays in the corner so you can always restore the UI.
- Voice: "open settings", "hide ui", "show ui", "mouse mode".

## Collapsible sections (iPad + controller friendly)
- Rooms / Gestures / Group Actions / Portals sections each collapse with a tap;
  the voice panel scrolls when tall. Big hit targets throughout for touch and
  the virtual cursor.

---

# V28.4 — Top-Anchored Shortcode Windows, Xbox Scrolling, Floor Control Fix

- **WP shortcode windows pinned to the TOP of the full screen.** Opening any live
  shortcode window now renders it as a fixed, full-width top sheet (header +
  tabs + iframe + shortcode menu) instead of being buried down the dashboard
  scroll. Widescreen mode fills the whole screen from the top; normal mode is a
  top drop-sheet with rounded bottom.
- **Xbox mouse mode scrolling shortcut.** Hold **LB / RB** (or **D-pad up/down**)
  to scroll whatever scrollable panel is under the virtual cursor — voice panel,
  NPC directory, UI settings, or the WP shortcode sheet — with page-scroll
  fallback. Badge updated with the hint.
- **Floor control in NPC settings now shows ALL floors.** The Navigate and
  Send-to-Floor grids were hardcoded to `[0,1,2,3]` from the 3-floor era; they
  now derive from `ROOFTOP_FLOOR` and show **1F 2F 3F 4F 5F Roof**. Also fixed
  `handleSendToFloor` capping the stored floor below the rooftop.

---

# V28.5 — Bigger World, Living NPCs, More Group Actions

## 6 new rooms (every floor now has 3 themed rooms; total 15 + roof)
- **F1 Innovation Showcase** — pedestals with glowing octahedron/torus-knot exhibits
- **F2 Library** — 3 shelf units with 60+ colored books, reading table + lamp
- **F3 Music Stage** — stage platform, speaker stacks, spotlight bar with 4 colored lights
- **F4 Data Observatory** — wireframe holographic globe with twin orbit rings
- **F5 War Room** — round strategy table, glowing holo column, 6 chairs facing center
- **Roof Sky Bar** — glowing counter, stools, umbrella
All are teleport destinations (panel buttons, minimap dots, voice: "go to the war
room", "go to the sky bar") and NPCs guard/tour them.

## NPC social encounters (ambient life)
Every 10-24 seconds, two nearby wandering NPCs on the same floor walk to meet in
the middle, face each other, and exchange greetings — wave/wave, wave/nod,
nod/think, or a double salute — then part ways. The building now feels inhabited
without any input.

## 6 more group actions (21-button grid)
- **Floor Tour** — Yuka route through every room on your current floor (path drawn)
- **Conga 💃** — winding dance-walk route through the rooms + a loop around you
- **Stadium Wave** — cheer ripples across all NPCs left-to-right 🌊
- **Flash Mob** — everyone rushes to circle you, then a synchronized dance party
- **Call Meeting** — all NPCs assemble in a ring at the nearest meeting room
  (boardroom / war room / lobby)
Voice: "floor tour", "conga line", "stadium wave", "flash mob", "call a meeting".

## Help panel rewritten (H)
All current bindings documented: WASD+QE, N directory, portals walk-through,
⚙ UI settings, and the full RSB mouse-mode cheat sheet (move/click/scroll/type).
