# V0Map Full Delivery Manual

This folder is the full upgraded V0Map NPC Gallery application package.

It includes the original 3D gallery app plus upgraded NPC teams, floor management, rooftop navigation, better sky visuals, importable teams, and WordPress plugin bridge files.

## Package Purpose

This package is meant to be a complete handoff bundle:

- Run locally with Next.js.
- Test NPC teams and room navigation.
- Use JSON files to import or reassign teams.
- Embed the running app inside WordPress using the included WordPress plugin bridge.
- Keep all major setup instructions in one place.

## Primary App

The app is a Next.js/Three.js experience.

Main entry:

```text
app/page.tsx
components/virtual-gallery.tsx
```

Core NPC files:

```text
components/npc.tsx
components/npc-controls.tsx
components/custom-npc-manager.tsx
```

Building and movement:

```text
components/office-building.tsx
hooks/use-movement.tsx
```

Team templates:

```text
public/npc-teams.sample.json
public/npc-teams.extended.sample.json
```

WordPress bridge:

```text
wordpress-plugin/
```

## Quick Start

From inside this folder:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If you just ran `npm run build`, restart the dev server before testing in-browser.

## Production Build

```bash
npm run build
```

Then:

```bash
npm run start
```

## Major Upgrades Included

### NPC Teams

NPCs now have team metadata.

Default team groups:

- Leadership
- Growth
- Operations
- Support

Each NPC can have:

- Team
- Role
- Skills
- Floor assignment
- Status

### Team Import

Open the app, then:

1. Click `Show NPC Controls`.
2. Find `Import Teams`.
3. Choose a JSON file.

Sample files:

```text
public/npc-teams.sample.json
public/npc-teams.extended.sample.json
```

### Individual Come Button

Every NPC row has a `Come` button.

Use this when you want one avatar to walk directly to the player.

### Team Commands

The NPC team panel supports:

- Call Team
- Team Apps
- Show Team
- Hide Team
- Team Here

### Group Commands

The global NPC controls support:

- Show All
- Remove All
- Call Meeting
- Make Call
- Break
- Open Apps
- Scatter
- Gather
- Send NPCs to Floor

### Floor Manager

The Floor Manager can move the player to:

- 1F
- 2F
- 3F
- Roof

### Rooftop

The app now has rooftop access with:

- Rooftop deck
- Railings
- Rooftop label
- Helipad-style marker
- Better view of the sky dome

### Better Sky

The scene now has:

- Gradient sky dome
- Sun
- Cloud sprites
- Better horizon color

## Navigation Notes

The old movement behavior pinned walking mode to the ground floor. The upgraded movement logic preserves floor height so the player can stay on upper floors after navigation.

Flying mode also allows higher vertical movement for roof access.

## WordPress Plugin Bridge

The package includes a WordPress plugin bridge in:

```text
wordpress-plugin/
```

That plugin lets a WordPress site embed the running V0Map app with shortcodes.

Use it when:

- You want a WordPress page to show the 3D gallery.
- You want a launch button.
- You want an admin setting for the app URL.

The WordPress plugin does not replace the Next.js app. It embeds the app by URL.

## WordPress Shortcodes

After installing the plugin in WordPress:

```text
[v0map_gallery]
```

Custom height:

```text
[v0map_gallery height="900"]
```

Launcher:

```text
[v0map_npc_launcher]
```

## Suggested Demo Script

Use this flow when presenting the app:

1. Start the app.
2. Open the gallery.
3. Click `Show NPC Controls`.
4. Show the Floor Manager.
5. Jump to the Roof.
6. Point out the sky dome, sun, and clouds.
7. Select `Leadership`.
8. Click `Call Team`.
9. Click one NPC's `Come` button.
10. Click `Scatter`.
11. Click `Gather`.
12. Import the extended team sample.
13. Open Team Apps.
14. Show the WordPress plugin option for embedding.

## Troubleshooting

### Too Many NPCs

Clear site data for `localhost:3000` if old duplicated custom NPCs are stored from a previous build.

The upgraded loader filters out default IDs from custom storage.

### App Looks Unstyled

Restart the dev server.

```bash
npm run dev
```

### WordPress Iframe Is Blank

Open the app URL directly in the same browser.

If it does not load directly, it will not load inside WordPress.

### Localhost Does Not Work For Visitors

Deploy the app publicly and update the WordPress plugin App URL.

### Mixed Content Warning

If WordPress is HTTPS, the app URL should also be HTTPS.

## Files Added For Better Handoff

```text
UPGRADED_APP_MANUAL.md
NPC_TEAMS_AND_NAVIGATION_GUIDE.md
docs/FULL_DELIVERY_MANUAL_LONG.md
public/npc-teams.sample.json
public/npc-teams.extended.sample.json
wordpress-plugin/
```

## Recommended Zip Contents

This full zip intentionally includes the whole app folder. It may be large because the source package includes dependencies and build artifacts.

For a smaller source-only zip, remove:

```text
node_modules
.next
__MACOSX
```

Then zip the remaining folder.

## Final Checklist

- Run `npm run build`.
- Restart `npm run dev` after build if testing locally.
- Open `http://localhost:3000`.
- Confirm `Show NPC Controls` opens.
- Confirm Floor Manager is visible.
- Confirm Roof navigation works.
- Confirm each NPC row has Come.
- Confirm team commands are visible.
- Confirm import JSON samples exist.
- Confirm WordPress plugin folder exists.
