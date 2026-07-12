# V26 Exact Agent Roster + R3F Speed Build

This build loads the exact 68-agent roster supplied by D Hudson. Each agent can open a live WordPress dashboard window. Agents with multiple shortcodes render those shortcodes as tabs. Agents without a shortcode open the provided primary dashboard link in a full-window iframe.

## Main upgrades

- 68 exact agents across Operators, Managers, Content Creators, Personal Agents, and Unsupervised Agents.
- Every popup/avatar chat window supports Close, Previous, Next, Wide, and Full Screen.
- Shortcode agents use the real styled WordPress render URL instead of stripped HTML.
- Multi-shortcode agents show tabs under the main live window.
- Link-only agents still open as full dashboard windows.
- Floor navigation dock: 1F, 2F, 3F, Roof.
- Voice floor commands: go to floor 1, go to floor 2, go to floor 3, go to roof.
- Minimize/restore Realtime Voice Agent.
- R3F speed mode for 60+ NPCs: capped pixel ratio, reduced shadows, disabled double rendering, and lighter postprocessing.
- `exact-agent-roster-68.import.json` can be used as an importable team/source file.

## Suggested voice commands

- BrandGPT
- NPC 1 come here
- NPC 12 come here
- go to floor 2
- go to roof
- wide screen
- next window
- previous window
- close window
- dance all
- refresh WordPress API

## WordPress plugin behavior

The companion plugin exposes the exact roster through `/wp-json/v0map-npc/v1/windows` and migrates saved options to the v26 roster on version change.
