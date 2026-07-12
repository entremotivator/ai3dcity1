# V25 Voice City Command Center

The plugin now exposes REST metadata for voice-command groups, project-management templates, and NPC movement playbooks so the Next.js 3D city can keep its help panels and voice UI synchronized with WordPress.

Routes:

- `/wp-json/v0map-npc/v1/voice-command-suite`
- `/wp-json/v0map-npc/v1/project-manager-suite`
- `/wp-json/v0map-npc/v1/npc-movement-playbook`

The plugin does not expose WordPress Application Passwords. Next.js should continue to call these routes server-side.
