# NPC Teams, Floor Manager, and Rooftop Navigation

This build keeps the original app layout and experience, while adding stronger NPC controls and navigation.

## What Changed

- All default NPCs now get team metadata, roles, skills, floor assignments, and status.
- NPC Controls now include a Floor Manager with buttons for 1F, 2F, 3F, and Roof.
- Each NPC row has a Come button so you can call that avatar directly to your current position.
- Team commands are available from the NPC Controls panel:
  - Call Team
  - Team Apps
  - Show Team / Hide Team
  - Team Here
- Group commands are wired:
  - Show All / Remove All
  - Call Meeting
  - Make Call / Break
  - Scatter
  - Gather
  - Send NPCs to Floor
- Team JSON import is supported from the NPC Controls panel.
- Navigation now supports upper floors and rooftop access.
- The rooftop has a dedicated sky deck and the scene uses a more realistic sky dome with sun and clouds.
- The existing controller toast runtime issue was fixed in the active gallery file.

## Team Import Format

Use `public/npc-teams.sample.json` as the reference file. The importer accepts this shape:

```json
{
  "teams": [
    {
      "name": "Leadership",
      "npcIds": [1, 5, 9],
      "skills": ["strategy", "funding"],
      "roles": {
        "1": "Executive Lead"
      }
    }
  ]
}
```

It also accepts direct NPC records:

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

## How To Use

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000`.
3. Click `Show NPC Controls`.
4. Use `Floor Manager` to jump between floors or go to the roof.
5. Use `NPC Teams` to control a whole team.
6. Use each avatar's `Come` button to call one NPC to you.
7. Import a JSON team file with `Import Teams`.

## Sample Teams Included

- Leadership
- Growth
- Operations
- Support

The sample file is available at:

`public/npc-teams.sample.json`
