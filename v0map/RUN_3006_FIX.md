# Run V0Map on port 3006

This package includes the pnpm v11 Sharp build approval fix in `pnpm-workspace.yaml` using `allowBuilds: sharp: true`. Use:

```bash
cd /Users/donmenico/Downloads/v0map-main\ 4
rm -rf node_modules .next package-lock.json pnpm-lock.yaml yarn.lock
pnpm install
pnpm exec next dev -p 3006
```

Or use the shortcut:

```bash
pnpm run fresh:3006
```

If your Mac still shows an approval prompt, run this once:

```bash
pnpm approve-builds sharp
pnpm install
pnpm exec next dev -p 3006
```

NPC windows and wall displays now point to WordPress live shortcode render URLs, not local Streamlit app URLs. NPC #1 / Agent CEO opens `[bsp_app]`.

## Live WordPress REST test

After the dev server starts, test the exact server-side Basic Auth bridge:

```bash
pnpm run wp:ping
```

Then open:

```txt
http://localhost:3006/api/wp/ping
http://localhost:3006/api/wp/npc-windows?render=0&random=1&limit=30
```

The app now assigns random unique WordPress shortcodes to NPC slots and renders only the selected NPC window at a time.
