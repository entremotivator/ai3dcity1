# V0Map Live WordPress Shortcode Fix v14

This build uses only the requested live WordPress shortcode roster. It no longer pulls random registered shortcodes or legacy Streamlit/agent tags.

## Required `.env.local`

```env
WP_URL=https://entremotivator.com
WP_USER=Entremotivator
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
WP_BASIC_AUTH=
```

The Basic Auth secret is used only in server-side Next.js API routes under `/api/wp/*`.

## Test

```bash
pnpm run wp:ping
pnpm exec next dev -p 3006
open http://localhost:3006/api/wp/ping
open "http://localhost:3006/api/wp/npc-windows?render=0&random=1&limit=24"
```

## Behavior

- Uses only 90 approved WordPress shortcode tags.
- Assigns each NPC one unique shortcode per sync.
- Opens only one live shortcode render window at a time.
- Uses `/wp-json/fapc/v1/ping` to verify server-side Basic Auth.
- Uses `/wp-json/v0map-npc/v1/windows` and `/wp-json/v0map-npc/v1/render` for live WordPress shortcode metadata and rendering.
- Includes iframe cookie/header fixes from `wp-iframe-cookie-fix` inside the V0Map plugin.
