# WordPress API Feature Suite v19

This build turns the 3D NPC world into a live WordPress API command surface. It keeps the 3D avatars, names, images, and room UI while pulling shortcode windows, content, menus, media, theme details, plugin summaries, health checks, and command-center data from WordPress REST routes.

## Main rules

- `[bsp_app]` is pinned as the Brand GPT / Brand UI window.
- Live shortcode windows load as real WordPress iframe pages, not `srcDoc` HTML.
- One active shortcode iframe opens at a time.
- Application Password credentials stay server-side inside `.env.local`.
- NPC windows use the approved WordPress shortcode list and live plugin REST data.

## Next.js routes

- `/api/wp/ping` — verifies WordPress Application Password REST access.
- `/api/wp/health` — pulls plugin health and iframe/cookie checks.
- `/api/wp/suite?limit=80` — full feature suite aggregation.
- `/api/wp/diagnostics` — readiness score, missing shortcode checks, duplicates, and repair hints.
- `/api/wp/command-center?limit=60` — pinned Brand GPT, operator panels, shortcode groups, and dashboard links.
- `/api/wp/search?q=aisc&limit=20` — searches shortcode inventory and WordPress content.
- `/api/wp/render-url?tag=bsp_app` — returns the styled iframe URL for a shortcode.
- `/api/wp/npc-windows?render=0&random=1&limit=30` — pulls unique live NPC shortcode windows.
- `/api/wp/shortcodes?limit=300` — pulls approved shortcode inventory.

## WordPress plugin routes

- `/wp-json/fapc/v1/ping`
- `/wp-json/v0map-npc/v1/ping`
- `/wp-json/v0map-npc/v1/health`
- `/wp-json/v0map-npc/v1/features`
- `/wp-json/v0map-npc/v1/feature-suite`
- `/wp-json/v0map-npc/v1/diagnostics`
- `/wp-json/v0map-npc/v1/command-center`
- `/wp-json/v0map-npc/v1/search`
- `/wp-json/v0map-npc/v1/render-url`
- `/wp-json/v0map-npc/v1/api-map`
- `/wp-json/v0map-npc/v1/windows`
- `/wp-json/v0map-npc/v1/shortcodes`
- `/wp-json/v0map-npc/v1/content`

## Local tests

```bash
pnpm run wp:ping
pnpm run wp:health
pnpm run wp:suite
pnpm run wp:diagnostics
pnpm run wp:command
pnpm run wp:render-url bsp_app
pnpm run wp:search aisc
```

## Styling fix

The live shortcode iframe must load the WordPress URL returned by `liveUrl`. Do not render shortcode HTML with `srcDoc`, because that strips or breaks many plugin styles, scripts, cookies, login forms, and dynamic assets.
