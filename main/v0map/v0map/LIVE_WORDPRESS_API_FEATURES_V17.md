# Live WordPress API Features v17

This build turns the 3D NPC dashboard into a richer WordPress API console while keeping the live styled shortcode windows.

## New Next API routes

- `/api/wp/ping` — server-side Basic Auth ping.
- `/api/wp/health` — plugin health, routes, iframe/cookie status, auth state.
- `/api/wp/features?limit=40` — full WordPress feature payload from the plugin endpoint, with core REST fallback.
- `/api/wp/content?type=all&limit=20` — pages, posts, media, and custom post type content.
- `/api/wp/npc-windows?render=0&random=1&limit=30` — one unique shortcode per NPC.
- `/api/wp/render` — server-side shortcode render fallback when needed.

## New WordPress REST routes

- `/wp-json/v0map-npc/v1/features`
- `/wp-json/v0map-npc/v1/health`
- `/wp-json/v0map-npc/v1/content`
- Existing routes are still active: `/windows`, `/shortcodes`, `/render`, `/ping`, and `/wp-json/fapc/v1/ping`.

## UI improvements

- Rich WordPress API feature panel.
- Live counts for matched/missing shortcodes.
- Feature-group cards by shortcode family/team.
- Latest WordPress pages/posts/media pulled through REST.
- Plugin dashboard link.
- Pinned Brand GPT window for `[bsp_app]`.
- Real styled iframe loading for shortcodes; no stripped `srcDoc` display.
- One active shortcode window at a time.

## Security

The app reads WordPress Application Passwords only from `.env.local` on the Next server. The browser calls local `/api/wp/*` routes and never receives the Application Password.
