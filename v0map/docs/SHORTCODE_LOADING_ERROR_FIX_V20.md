# V20 Shortcode Loading Error Fix

This patch fixes the runtime crash:

```text
features.menus.slice is not a function
```

## Root cause

Some WordPress REST endpoints return objects instead of arrays. The 3D dashboard expected `features.menus` to always be an array and called `.slice()` directly. When WordPress returned a menu map/object, the UI crashed before shortcode windows could finish loading.

## Fixes added

- Added `asArray()` and `asObject()` helpers in the live 3D dashboard.
- Normalized WordPress feature payloads before storing them in React state.
- Normalized `menus`, `pages`, `posts`, `media`, `plugins`, `comments`, `featureGroups`, `shortcodeProviders`, `theme.supports`, and diagnostics arrays.
- Updated `/api/wp/features` and `/api/wp/suite` to return consistent array shapes even when WordPress core REST returns objects.
- Kept real styled iframe rendering for shortcodes.
- Kept one active shortcode window at a time.
- Kept pinned Brand GPT `[bsp_app]` window.

## Test routes

```bash
pnpm run wp:ping
pnpm run wp:suite
pnpm run wp:features
pnpm run wp:diagnostics
pnpm exec next dev -p 3006
```

Then open:

```text
http://localhost:3006
http://localhost:3006/api/wp/suite?limit=80
```
