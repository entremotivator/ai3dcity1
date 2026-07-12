# Live WordPress Shortcode NPC Connection

This build uses WordPress REST API + server-side Basic Auth from `.env.local`.

## Test the connection from Next.js

Run the app on port 3006, then open:

```txt
http://localhost:3006/api/wp/ping
```

That route calls the WordPress REST ping route server-side:

```txt
https://entremotivator.com/wp-json/fapc/v1/ping
```

## Main live routes

```txt
http://localhost:3006/api/wp/npc-windows?render=0&random=1&limit=30
http://localhost:3006/api/wp/shortcodes?random=1&limit=160
```

The 3D app now pulls the live shortcode list first, assigns unique shortcodes to NPCs, and renders only the selected NPC shortcode window. It does not open all shortcode iframes at once.

## Important

Do not commit `.env.local` to GitHub. It is server-side only and already covered by `.gitignore`.
