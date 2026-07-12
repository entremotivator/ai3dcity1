# Live WordPress Shortcode Bridge v14

Install `v0map-npc-gallery-wp-plugin-v13-exact-live-shortcodes.zip` in WordPress, activate it, then run the Next app on port 3006.

The plugin exposes:

- `/wp-json/fapc/v1/ping`
- `/wp-json/v0map-npc/v1/shortcodes`
- `/wp-json/v0map-npc/v1/windows`
- `/wp-json/v0map-npc/v1/render`

The Next app uses WordPress Application Password Basic Auth only from server-side API routes. NPCs and wall displays use only the approved shortcode roster. Only the selected NPC window is rendered, so the app does not load all iframe panels at the same time.
