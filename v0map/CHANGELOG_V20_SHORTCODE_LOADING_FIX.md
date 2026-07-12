# V20 — Shortcode Loading Crash Fix

- Fixed `.slice is not a function` crash from `features.menus`.
- Added defensive WordPress REST payload normalization.
- Hardened the Next API proxy so menu/post-type/taxonomy objects become display-safe arrays.
- Preserved styled WordPress iframe loading instead of `srcDoc` rendering.
- Preserved pinned Brand GPT `[bsp_app]`.
- Preserved one active live window at a time.
