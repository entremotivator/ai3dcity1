# V28.6 — Bigger City: Full Outdoor District, Outdoor NPCs, Walk-Out Front Entrance

Everything from v28.5 is kept exactly as-is. This release expands the world AROUND
the existing office tower and puts NPCs outside the building for the first time.

## NEW: City District (`components/city-district.tsx`)

A full procedural downtown built around the tower — near-zero load cost
(shared low-poly geometries, deterministic seeded layout so the skyline is
identical every load):

- **640×640 ground** — grass base + 200×200 central concrete plaza
- **Road grid** — inner ring at ±105, outer ring at ±215, with sidewalks,
  dashed lane lines, and crosswalks at all four plaza entrances
- **45+ skyline buildings** with emissive lit-window canvas textures, rooftop
  AC units, antennas, and red beacons
- **6 named brand towers** with glowing crowns + name signs:
  ATM AGENCY TOWER · ENTREMOTIVATOR HQ · MATRIX CRM TOWER · AI BUILD A BOT ·
  AI TUBE STUDIOS · V0MAP LABS
- **Fountain Plaza** — glowing fountain, ringed benches (south of the tower)
- **Central Park** — 18 trees, pond, benches, lawn
- **Market Street** — 6 colorful vendor stalls with canopies
- **Street life** — 60+ street lamps, street trees, 14 parked cars, 3 billboards
  (THE ATM AGENCY / ENTREMOTIVATOR.COM / V0MAP CITY), and a glowing
  "WELCOME TO V0MAP CITY" gate arch on the south road
- **Distance fog** for skyline depth (starts at 230 units — interiors unaffected)

## NEW: Walk-out front entrance

The gallery's south wall (both wall layers) is now split into two segments plus
a lintel, leaving a real 10-unit-wide doorway at ground level. Walk out of the
main gallery straight onto the plaza — no teleport required.

- Player bounds expanded: ground level and flying mode now roam the full city
  (±290). Upper floors keep the original tight clamp so you can't walk off a
  floor plate.
- Movement raycast collision now actually works: it's rebuilt AFTER the scene
  is constructed (the old mount-time collection ran before anything existed and
  always found zero objects). Only meshes flagged `userData.solid` block the
  player — the outer building shell and city structures — so all previous
  indoor movement behavior is unchanged.

## NEW: 14 outdoor citizen NPCs (IDs 9001–9014)

New NPCs that live OUTSIDE — greeters, a street musician, tour guide, courier,
barista, skater, photographer, city planner, park ranger, picnic host, market
vendors, a reporter, and a night runner. Each is anchored to a home spot
(Fountain Plaza, North Plaza, East/West Promenades, Central Park, Market
Street, Downtown Crossing) and wanders around it with the full v28 walking
engine: turn-in-place, crowd separation, pauses, ambient gestures.

Engine upgrade (`npc.tsx`): NPCs now support `outdoor`, `homeCenter`, and
`wanderRange` — wander targets, boundary steering, and path waypoints are all
relative to the NPC's home anchor. Indoor NPCs keep identical defaults
(origin / 38-unit square), so nothing changes inside.

Guard rails so citizens never end up floating over the plaza:
- "Send ALL to floor" and "Gather ALL" skip outdoor citizens (explicit ids
  still work)
- Building meetings only pull indoor agents
- Summoned citizens walk to you, then naturally drift back home

All 14 citizens appear in the NPC Directory (press N), respond to gestures,
"come here", and voice commands like the rest of the roster.

## NEW: 5 outdoor destinations (voice + Rooms panel + teleport pads)

- `go to the fountain plaza` / `go outside`
- `go to central park`
- `go to market street`
- `go to downtown`
- `go to the city gate`

Each gets a glowing teleport pad, shows in the Rooms grid, and the teleport
toast now says "Outdoors — City District".

## Mini-map: automatic city view

When you're at ground level outside the building footprint, the mini-map
zooms out from the 50-unit building view to a 250-unit city view (building
outline, outdoor room dots, and citizen NPC dots all stay accurate), and zooms
back in when you go inside.

## Files changed

- `components/city-district.tsx` — NEW
- `components/level-features.tsx` — 5 outdoor ROOM_DESTINATIONS
- `components/npc.tsx` — outdoor anchor engine + citizen guard rails
- `components/virtual-gallery.tsx` — citizen roster, outdoor spawning, city
  build call, collision refresh, outdoor teleport toast
- `components/gallery.tsx` / `components/interior-walls.tsx` — front entrance
- `hooks/use-movement.tsx` — city bounds + working solid-mesh collision
- `components/mini-map-pro.tsx` — dynamic city zoom
