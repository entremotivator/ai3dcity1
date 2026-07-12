# Start Here — V25

Install the updated WordPress plugin first, then run the Next app.

```bash
cd "/Users/donmenico/Downloads/v0map-main 4"
rm -rf node_modules .next package-lock.json pnpm-lock.yaml yarn.lock
pnpm install
pnpm exec next dev -p 3006
```

Test the new voice/project endpoints:

```bash
pnpm run voice:schema
pnpm run voice:parse "NPC 1 come here"
pnpm run wp:voice-suite
pnpm run wp:project-suite
pnpm run wp:npc-movement
pnpm run project:sprint
pnpm run habits:advanced
pnpm run npc:movement-playbook
```

Try these in the floating voice blob:

- `Brand GPT`
- `create NPC named Revenue Coach with shortcode aisc_dashboard`
- `NPC 2 follow me`
- `NPC 3 patrol route`
- `freeze all NPCs`
- `add automation lab`
- `add project board`
- `open project manager`
- `export project board`
