# V22 Voice + NPC Window Upgrade

This build upgrades the 3D WordPress shortcode dashboard with a stronger app-style window system and realtime voice controls.

## Added

- Live shortcode window header with **Previous**, **Next**, **Wide/Normal**, **Come Here**, **Dance**, **Edit WP**, **Open Page**, and **X Close** controls.
- Menu strip below the active shortcode iframe so WordPress tools can be switched without closing the main window.
- Widescreen shortcode mode for full-dashboard viewing.
- Floating realtime voice agent blob with quick command buttons.
- Browser speech recognition commands:
  - `Brand GPT`
  - `next window`
  - `previous window`
  - `close window`
  - `wide screen`
  - `NPC 3 come here`
  - `dance all`
  - `refresh WordPress API`
  - `npm ping` / `npm features` / `npm suite`
- NPC summon mode: the requested NPC appears in front of the player and its live shortcode window opens.
- NPC dance mode with procedural fallback animation.
- More complex building details: command atrium, API server racks, skybridges, glow rings, and command pods.
- New safe local command API: `/api/local/command`. It only runs whitelisted scripts such as `wp:ping`, `wp:features`, `wp:suite`, and `wp:diagnostics`.

## Safety

The local command bridge does **not** run arbitrary terminal commands. It only accepts a small allowlist of package scripts used for WordPress API diagnostics.
