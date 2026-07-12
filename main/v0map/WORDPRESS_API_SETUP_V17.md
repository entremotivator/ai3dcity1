# V0Map WordPress API Setup v17

1. Install and activate `v0map-npc-gallery-wp-plugin-v16-live-api-suite.zip` in WordPress.
2. In the Next app folder, copy `.env.local.example` to `.env.local`.
3. Paste the WordPress Application Password you generated for the `Entremotivator` user.
4. Run:

```bash
pnpm install
pnpm exec next dev -p 3006
```

5. Test the API proxy routes:

```bash
pnpm run wp:ping
pnpm run wp:health
pnpm run wp:features
pnpm run wp:content
```

The 3D app now uses the Next server as the API proxy. The browser does not receive the Application Password. Styled shortcode windows still load as real WordPress iframe pages so CSS, JavaScript, login forms, and plugin layouts remain intact.
