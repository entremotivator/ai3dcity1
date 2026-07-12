# WordPress API Setup for V18

Install the bundled WordPress plugin first, then set your local Next.js `.env.local`.

```env
WP_URL=https://entremotivator.com
WP_USER=Entremotivator
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
WP_BASIC_AUTH=
```

The Application Password is only used server-side by the Next.js API routes. Do not expose it in client components or commit it to GitHub.

Run:

```bash
rm -rf node_modules .next package-lock.json pnpm-lock.yaml yarn.lock
pnpm install
pnpm exec next dev -p 3006
```

Test:

```bash
pnpm run wp:ping
pnpm run wp:suite
pnpm run wp:api-map
```
