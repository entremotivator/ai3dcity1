# V0Map Upgraded NPC App Manual

This package is the upgraded version of the original app. The goal was to keep the existing app intact while making the NPC system more useful, more visible, and easier to control.

## Main Upgrade Summary

The app now has:

- Richer NPC metadata for every default avatar.
- Team-based NPC organization.
- Importable NPC team files.
- A floor manager.
- Roof navigation.
- Better sky visuals.
- Per-avatar Come buttons.
- Group commands.
- Fixed upper-floor navigation support.
- A sample JSON import file.
- A longer usage guide.

## What Stayed The Same

The app still uses the same core Next.js project, the same 3D room/gallery experience, the same exhibit layout, the same NPC GLB loading path, and the same existing Streamlit URLs.

The upgrade is focused on the NPC control layer, navigation, and environmental polish.

## Important Files

### Main App

`components/virtual-gallery.tsx`

This is the main app screen. It wires together:

- The Three.js scene.
- NPC data.
- NPC teams.
- Floor navigation.
- Rooftop navigation.
- Sky dome.
- NPC controls.
- Streamlit iframe windows.

### NPC Logic

`components/npc.tsx`

This controls:

- NPC movement.
- Individual Come Here behavior.
- Group movement.
- Team movement support.
- Send-to-floor behavior.
- Scatter and gather behavior.
- Meeting/table behavior.

### NPC Controls UI

`components/npc-controls.tsx`

This contains:

- Floor Manager.
- Team selector.
- Team commands.
- Import Teams button.
- Per-NPC Come button.
- Show/hide toggles.
- Default and custom NPC sections.

### Building / Rooftop

`components/office-building.tsx`

This controls:

- Floor layout.
- Elevator structure.
- Rooftop deck.
- Rooftop label.
- Rooftop rails.
- Collision objects.

### Movement

`hooks/use-movement.tsx`

This controls player movement and was updated so upper floors and rooftop navigation do not snap the player back to the ground floor.

### Sample Team Import

`public/npc-teams.sample.json`

This is the simple team import example.

### Extended Team Import

`public/npc-teams.extended.sample.json`

This is the longer template with teams, roles, skills, floors, and statuses.

## Running The App

From the project folder:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

If the page appears unstyled after running a production build, stop and restart the dev server. This project can stale its dev chunks after `next build`.

## Controls

### Player

- `W`, `A`, `S`, `D`: Move.
- Arrow keys: Move.
- Mouse: Look around.
- `F`: Toggle flying mode.
- `Space`: Fly up when flying mode is enabled.
- `Shift`: Fly down when flying mode is enabled.
- `Q`: Quick fly up.
- `Z`: Quick fly down.
- `R`: Reset height.
- `E`: Interact with nearby NPCs.
- `M`: Open exhibit menu.
- `H`: Toggle controls help.
- `J`: Toggle joystick controls.

### Floor Manager

Open NPC Controls and use the Floor Manager buttons:

- `1F`
- `2F`
- `3F`
- `Roof`

These move the player directly to the selected level.

### NPC Floor Commands

The Send NPCs to Floor section lets you send NPCs to:

- `1F`
- `2F`
- `3F`
- `Roof`

When a team is selected, Team Here sends that team to the currently selected/current floor.

## NPC Teams

Default teams:

- Leadership
- Growth
- Operations
- Support

Each default NPC now has:

- Team
- Role
- Skills
- Floor
- Status

Example:

```text
Agent CEO
Team: Leadership
Role: CEO
Skills: strategy, funding, launch
```

## Team Commands

Open `Show NPC Controls`, then use the NPC Teams panel.

### Call Team

Calls every NPC in the selected team to the player.

### Team Apps

Opens Streamlit apps for active NPCs in the selected team.

### Show Team / Hide Team

Activates or deactivates the selected team.

### Team Here

Moves the selected team to the current floor.

## Individual NPC Commands

Each NPC row now has a `Come` button.

Use it to call one avatar directly to your current position.

This is separate from Call Meeting and Team commands.

## Group Commands

### Show All

Activates all NPCs.

### Remove All

Hides all NPCs.

### Call Meeting

Calls active NPCs into a meeting formation.

### Make Call

Sends NPCs to their table/call positions.

### Break

Returns NPCs back to roaming.

### Open Apps

Opens Streamlit app iframes for active NPCs.

### Scatter

Spreads active NPCs around their current area.

### Gather

Collects active NPCs together on the current floor.

## Importing Teams

Open NPC Controls and click `Import Teams`.

Choose a `.json` file. The app accepts two formats.

### Format 1: Team Records

```json
{
  "teams": [
    {
      "name": "Leadership",
      "npcIds": [1, 5, 9],
      "skills": ["strategy", "funding"],
      "roles": {
        "1": "Executive Lead",
        "5": "Funding Lead"
      }
    }
  ]
}
```

### Format 2: NPC Records

```json
{
  "npcs": [
    {
      "id": 1,
      "team": "Leadership",
      "role": "Executive Lead",
      "skills": ["strategy", "decisions"],
      "floor": 0,
      "status": "Ready"
    }
  ]
}
```

Floor numbers:

- `0`: 1F
- `1`: 2F
- `2`: 3F
- `3`: Roof

## Rooftop

The rooftop is a new navigable sky deck.

It includes:

- A roof floor.
- Railings.
- A visible rooftop label.
- A helipad-style marker.
- Better access from the Floor Manager.

The realistic sky is most visible from the rooftop.

## Sky Upgrade

The scene now includes:

- Sky dome.
- Gradient horizon.
- Sun.
- Cloud sprites.
- Better outdoor feel when viewing from the roof.

## Custom NPC Notes

Default NPCs are now the first 24 agents.

Only IDs above 24 are treated as custom NPCs.

This prevents agents 11-24 from being incorrectly handled as custom/removable NPCs.

## Troubleshooting

### I See Too Many NPCs

Old browser localStorage may contain duplicate custom NPCs from earlier builds. The upgraded loader filters default IDs out of custom storage.

If needed, clear site data for `localhost:3000`.

### App Looks Unstyled

Restart the dev server.

```bash
npm run dev
```

### NPCs Are Not Moving To Floors

Make sure they are active. Hidden NPCs do not respond to movement commands.

### I Cannot Reach The Roof By Walking

Use the Floor Manager `Roof` button. Flying mode also supports higher vertical range now.

### Team Import Does Nothing

Check that the JSON uses either:

- `teams`
- `npcs`

and that NPC IDs match the app's default NPC IDs.

## Included Sample Files

- `public/npc-teams.sample.json`
- `public/npc-teams.extended.sample.json`
- `NPC_TEAMS_AND_NAVIGATION_GUIDE.md`
- `UPGRADED_APP_MANUAL.md`

## Recommended Test Checklist

1. Start the app.
2. Open NPC Controls.
3. Confirm All NPCs shows the expected count.
4. Click Roof in Floor Manager.
5. Confirm rooftop/sky view.
6. Select Leadership team.
7. Click Call Team.
8. Click Team Here.
9. Click Come on one NPC row.
10. Import `public/npc-teams.extended.sample.json`.
11. Confirm team names/roles still display.
12. Run Scatter and Gather.

## Package Notes

The full zip includes dependencies and build output because the request was for a full app zip.

For a smaller source-only package later, remove:

- `node_modules`
- `.next`
- `__MACOSX`

Then zip the remaining project.
