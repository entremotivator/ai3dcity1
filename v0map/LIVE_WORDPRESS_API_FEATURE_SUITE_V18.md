# V18 Live WordPress API Feature Suite

This build expands the live WordPress connection beyond shortcode windows.

## Next.js API proxy routes

- `/api/wp/ping` — tests the WordPress Application Password ping route.
- `/api/wp/health` — pulls plugin health and connection checks.
- `/api/wp/features` — backward-compatible features proxy, now using the feature suite when available.
- `/api/wp/suite?limit=60` — full WordPress feature suite proxy.
- `/api/wp/api-map` — lists the V0Map REST routes and core WordPress REST routes.
- `/api/wp/content?type=all&limit=20` — pulls pages, posts, media, and custom post type samples.
- `/api/wp/npc-windows?render=0&random=1&limit=30` — pulls unique shortcode windows for NPCs.
- `/api/wp/shortcodes?random=1&limit=160` — pulls the approved shortcode roster.
- `/api/wp/render` — server-side shortcode render fallback.

## WordPress plugin REST routes

- `/wp-json/fapc/v1/ping`
- `/wp-json/v0map-npc/v1/ping`
- `/wp-json/v0map-npc/v1/health`
- `/wp-json/v0map-npc/v1/features`
- `/wp-json/v0map-npc/v1/feature-suite`
- `/wp-json/v0map-npc/v1/api-map`
- `/wp-json/v0map-npc/v1/windows`
- `/wp-json/v0map-npc/v1/shortcodes`
- `/wp-json/v0map-npc/v1/render`
- `/wp-json/v0map-npc/v1/content`

## New feature pulls

The 3D UI now pulls and displays:

- Shortcode windows and shortcode provider groups
- Matched/missing shortcode health
- Pages, posts, media, and custom post type samples
- Menus with menu item counts and locations
- Active plugins and plugin versions
- Current theme name, version, template, and theme supports
- Public REST post types and taxonomies
- Sidebars/widgets metadata
- Recent approved comments
- V0Map REST route map and WordPress core route map

## Important render rule

Live shortcode windows use the real WordPress styled render page iframe, not `srcDoc`. This preserves plugin CSS, JavaScript, forms, login screens, and shortcode assets.

## Commands

```bash
pnpm run wp:ping
pnpm run wp:health
pnpm run wp:suite
pnpm run wp:api-map
pnpm run wp:features
pnpm run wp:content
pnpm run wp:windows
```
