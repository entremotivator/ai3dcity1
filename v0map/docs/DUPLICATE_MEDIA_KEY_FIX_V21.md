# V21 Duplicate WordPress Media Key Fix

This patch fixes the React warning:

`Encountered two children with the same key, wp-media-undefined`

## What changed

- WordPress media cards no longer use `item.id` alone for React keys.
- Added `stableWpKey(prefix, item, index)` in `components/virtual-gallery.tsx`.
- Added fallback key sources: `id`, `ID`, `wpId`, `databaseId`, `slug`, `key`, `file`, `link`, `sourceUrl`, `source_url`, `url`, `name`, `team`, title, and final index.
- Added `withStableWpItems()` to normalize pages, posts, media, menus, plugins, comments, feature groups, sidebars, post types, and taxonomies before rendering.
- Hardened `/api/wp/suite` and `/api/wp/features` so WordPress REST payloads receive `stableKey` and fallback `id` values server-side.
- Updated the WordPress plugin media payload to include `id`, `ID`, `wpId`, `databaseId`, `source_url`, `media_type`, `mime_type`, and `stableKey`.

## Result

The media grid can now render WordPress media items even when a plugin, REST fallback, or grouped API response does not include a normal numeric `id`.
