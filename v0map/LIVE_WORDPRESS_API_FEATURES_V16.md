# V0Map v16 — Live WordPress API Features

This build expands the NPC shortcode window system so the 3D Next.js app pulls richer live WordPress data from server-side REST API routes.

## New Next.js API routes

- `/api/wp/ping` — tests Application Password / Basic Auth through `/wp-json/fapc/v1/ping`.
- `/api/wp/shortcodes?random=1&limit=160` — pulls approved shortcode metadata.
- `/api/wp/npc-windows?render=0&random=1&limit=30` — pulls unique NPC window assignments.
- `/api/wp/render` — server-side shortcode render fallback.
- `/api/wp/features` — pulls WordPress pages, posts, media, post types, menus, user/settings status, shortcode metrics, and NPC window metadata.

## UI upgrades

- The dashboard now shows a live WordPress API feature panel.
- Metrics include NPC windows, approved shortcodes, pages, posts, media, post types, and menus.
- Recent pages and posts are displayed as clickable WordPress links.
- `[bsp_app]` stays pinned as the Brand GPT / Brand UI window.
- Shortcode windows still open as real WordPress iframe pages so plugin CSS/JS loads correctly.

## Run

```bash
cd "/Users/donmenico/Downloads/v0map-main 4"
rm -rf node_modules .next package-lock.json pnpm-lock.yaml yarn.lock
pnpm install
pnpm run wp:ping
pnpm exec next dev -p 3006
```

Then test:

```bash
open http://localhost:3006/api/wp/features
open http://localhost:3006
```
