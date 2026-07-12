# V0Map NPC Gallery WordPress Plugin Guide

This plugin lets WordPress display the upgraded V0Map NPC Gallery app and also turn WordPress shortcodes into NPC-style windows.

It is designed as a bridge:

- WordPress handles publishing, pages, dashboards, shortcodes, and site placement.
- The V0Map app handles the 3D room, NPC teams, rooftop, floor manager, and Streamlit agent interfaces.
- The plugin connects those worlds with iframe embeds, shortcode windows, live bridge metrics, auth sync, NPC sync, and local session persistence.

## Package Contents

```text
v0map-npc-gallery/
  v0map-npc-gallery.php
  readme.txt
  uninstall.php
  assets/
    v0map-npc-gallery.css
    v0map-npc-gallery.js
  docs/
    PLUGIN_GUIDE.md
```

## What This Plugin Does

- Adds a WordPress admin page named `V0Map NPC`.
- Stores the V0Map app URL in WordPress options.
- Provides a configurable iframe embed.
- Provides a launcher button shortcode.
- Provides NPC-style WordPress shortcode windows.
- Provides a dashboard that renders configured NPC windows.
- Provides a dashboard that lists registered WordPress shortcodes.
- Provides a live connection dashboard for app, localhost world, auth sync, NPC sync, and shortcode health.
- Creates WordPress pages for each dashboard automatically.
- Provides authenticated REST endpoints for the app to pull real rendered WordPress shortcode windows.
- Defaults the public domain to `https://entremotivator.com`.
- Syncs WordPress auth context to `http://localhost:3000` during local 3D world development.
- Adds toolbar buttons for open and refresh.
- Adds persistent localhost session context for local V0Map development.

## What This Plugin Does Not Do

- It does not run the Next.js app inside PHP.
- It does not replace `npm run dev`.
- It does not host Streamlit apps.
- It does not store V0Map NPC movement state in WordPress.

## New In 1.1.0

The plugin now supports two content modes:

- URL/app mode: embed the V0Map app by URL.
- NPC shortcode-window mode: render WordPress shortcodes as NPC windows.

Use URL/app mode when the content lives outside WordPress.

Use shortcode-window mode when the content is already inside WordPress.

## New In 1.2.0

The plugin now treats the requested WordPress shortcode list as the default NPC roster.

Each configured NPC window has:

- A visible NPC title.
- A team/category.
- A shortcode payload.
- A live/missing status badge based on whether WordPress has registered the shortcode handler.
- A minimize/expand control.
- A live dashboard metrics connection.

The default app URL is now:

```text
https://entremotivator.com
```

The default localhost world URL is:

```text
http://localhost:3000
```

The plugin syncs WordPress context into the local 3D world using:

- Query parameters on the iframe URL.
- Browser localStorage key `v0mapNpcGallerySession`.
- `postMessage` payloads after iframe load.

## New In 1.3.0

The plugin now creates full WordPress dashboard pages and exposes an authenticated API for the app.

Auto-created pages:

- `V0Map NPC Gallery` with `[v0map_gallery height="900"]`
- `NPC Shortcode Windows` with `[v0map_npc_windows]`
- `NPC Live Connection Dashboard` with `[v0map_npc_live_dashboard]`
- `WordPress Shortcode Dashboard` with `[v0map_shortcode_dashboard limit="120"]`
- `NPC API Auth Dashboard` with `[v0map_npc_api_dashboard]`
- Existing public `npc-live-*` pages are detected when they already exist.

REST API routes:

```text
/wp-json/v0map-npc/v1/auth
/wp-json/v0map-npc/v1/windows
/wp-json/v0map-npc/v1/window/{id}
/wp-json/v0map-npc/v1/render
```

The app receives:

- REST base URL
- windows endpoint URL
- WordPress REST nonce
- bridge user id
- bridge expiry
- signed bridge token
- page URLs
- rendered shortcode HTML for each NPC window
- server-side Application Password access through the Next.js `/api/wp/*` routes
- public live page URL and page-edit URL for every NPC shortcode window
- fallback links to existing WordPress pages when the custom render endpoint is not active

When the app is opened from the WordPress plugin, clicking NPC #1 opens the first WordPress shortcode NPC window, NPC #2 opens the second, and so on.

## Live Dashboard

Use:

```text
[v0map_npc_live_dashboard]
```

This dashboard shows:

- App connection status.
- Localhost world connection status.
- Configured NPC shortcode window count.
- Registered WordPress shortcode count.
- Missing shortcode handler count.
- Auth sync status.
- Synced WordPress user id.
- Default domain.

Show only metrics without the long window list:

```text
[v0map_npc_live_dashboard show_windows="0"]
```

## API Auth Dashboard

Use:

```text
[v0map_npc_api_dashboard]
```

This page shows:

- REST endpoint URLs.
- current bridge user id.
- token expiry.
- token status preview.
- created dashboard page links.
- API auth required setting.

## Basic Setup

1. Install and activate the plugin.
2. Open WordPress admin.
3. Go to `V0Map NPC`.
4. Set `App URL`.
5. Configure `NPC Window Shortcodes`.
6. Save settings.
7. Add one of the shortcodes to a page.

## Main App Embed

```text
[v0map_gallery]
```

Custom height:

```text
[v0map_gallery height="900"]
```

Custom URL:

```text
[v0map_gallery url="https://gallery.yoursite.com"]
```

Hide toolbar:

```text
[v0map_gallery toolbar="0"]
```

Hide open button:

```text
[v0map_gallery open_button="0"]
```

## Launcher Shortcode

```text
[v0map_npc_launcher]
```

Custom label:

```text
[v0map_npc_launcher label="Launch AI Gallery"]
```

## Single NPC Shortcode Window

Use this when you want one WordPress shortcode to appear as an NPC window.

```text
[v0map_npc_window title="Agent CRM" team="Operations" shortcode="[your_shortcode]"]
```

You can also wrap content:

```text
[v0map_npc_window title="Agent Login" team="Support"]
[wp_login_form]
[/v0map_npc_window]
```

## Configured NPC Windows Dashboard

Use this to render all windows configured in the admin page.

```text
[v0map_npc_windows]
```

Version 1.2.0 loads the requested shortcode roster by default, including:

```text
[wp_caption]
[caption]
[gallery]
[playlist]
[audio]
[video]
[embed]
[aisc_hub]
[aisc_missions]
[aisc_channels]
[aisc_tools]
[aisc_discussions]
[aisc_ai_guide]
[aisc_resources]
[aisc_leaderboard]
[aisc_showcases]
[aisc_events]
[aisc_ai_arbitrage]
[aisc_dashboard]
[aisc_login]
[aisc_register]
[aisc_forgot_password]
[agent_workflow_chat]
[agent_workflow_form]
[agent_workflow_status]
[vg_display_admin_page]
[vg_display_logout_link]
[vg_display_logout_url]
[vg_display_login_url]
[vg_display_edit_link]
[vg_display_edit_url]
[wp_frontend_admin_login_form]
[download_now]
[download_now_page]
[em3d_dashboard_iframe]
[em3d_command_directory]
[em3d_operator_floor]
[em3d_command_room]
[fluentform]
[fluentform_info]
[ff_get]
[ff_entry]
[gcva_calendar]
[geomap_pro]
[mintmrm]
[mintmail_preview_page]
[optin_confirmation]
[preference_page]
[unsubscribe_confirmation]
[mec-booking]
[mec-ticket-variations]
[MEC_dc]
[MEC_fes_form]
[MEC_fes_list]
[mec-hourly-schedule]
[MEC_login]
[mec-only-booked-users]
[MEC_profile]
[MEC_search_bar]
[MEC_taxonomy_category]
[MEC_userevents]
[rvip_v40_phone_cta]
[rvip_v40_agent_phone_directory]
[seedance_video_generator]
[svgen_token_balance]
[svgen_token_store]
[svgen_pricing_table]
[wbcom_admin_setting_header]
[activity-listing]
[groups-listing]
[members-listing]
[notifications-listing]
[slicewp_affiliate_registration]
[slicewp_affiliate_login]
[slicewp_affiliate_account]
[slicewp_affiliate_reset_password]
[slicewp_affiliate_id]
[slicewp_affiliate_url]
[slicewp_creative]
[threever]
```

The admin setting uses this format:

```text
Title|Team|[shortcode]
```

Example:

```text
Agent Leads|Operations|[gravityform id="1" title="false"]
Agent Store|Growth|[products limit="6"]
Agent Login|Support|[wp_login_form]
Agent Calendar|Operations|[events_calendar]
```

## WordPress Shortcode Dashboard

Use this to list registered shortcodes:

```text
[v0map_shortcode_dashboard]
```

Render previews:

```text
[v0map_shortcode_dashboard render="1"]
```

Use preview rendering carefully. Some shortcodes submit forms, load maps, require logged-in users, or expect specific page context.

## Replacing URL Windows With Shortcode Windows

Old flow:

```text
Open a URL in an iframe.
```

New flow:

```text
Render WordPress shortcode output as an NPC window.
```

Good shortcode-window use cases:

- Login form
- CRM dashboard snippet
- Appointment form
- Ecommerce product grid
- LMS course list
- Membership portal widget
- Lead capture form
- Internal admin-style dashboard

Good URL iframe use cases:

- V0Map app
- Streamlit app
- external analytics dashboard
- separate hosted tool

## Persistent Localhost Login / Session

Enable `Persistent Localhost Session` in plugin settings.

When the app URL is:

```text
http://localhost:3000
```

the plugin appends session context:

- `v0map_wp`
- `v0map_wp_user`
- `v0map_wp_session`
- `v0map_wp_context`

The frontend script also stores:

```text
v0mapNpcGallerySession
```

in browser localStorage.

This helps local development by preserving a stable browser/app context during refresh.

For production, use HTTPS and a deployed app URL.

## Auth Sync To Localhost World

Enable:

- `Auth Sync`
- `NPC Sync`
- `Persistent Localhost Session`

The plugin sends WordPress context to the local world through the iframe URL and through `postMessage`.

The upgraded app stores this context in:

```text
v0mapNpcGallerySession
```

That lets the localhost world know:

- Which WordPress user is active.
- Which public domain is attached.
- Whether auth sync is on.
- Whether NPC sync is on.
- How many NPC shortcode windows are configured.

## App To WordPress API Sync

The app reads the bridge context from:

```text
v0mapNpcGallerySession
```

Then it requests:

```text
/wp-json/v0map-npc/v1/windows?render=1&user=...&expires=...&token=...
```

WordPress validates the token against the site salt and returns:

- site/domain metadata
- dashboard page URLs
- connection metrics
- every configured NPC shortcode window
- rendered HTML from `do_shortcode`

The app displays this inside `WP Dashboards` and maps matching NPC ids to rendered shortcode windows.

If one shortcode fails, the API returns an error panel for that one NPC window instead of returning a 500 for the entire route.

The existing `v0map-npc-gallery` page can also render one shortcode at a time for the Next app:

```text
https://entremotivator.com/v0map-npc-gallery/?v0map_shortcode_tag=aisc_hub&v0map_embed=1
```

The Next app fetches that HTML server-side as a fallback when the REST render endpoint returns 500. The NPC window still displays rendered shortcode HTML inside the app; it does not iframe the page URL as the main content.

## Next.js Application Password Sync

For local development, the app also supports server-side WordPress Basic Auth through `.env.local`:

```text
WP_URL=https://entremotivator.com
WP_USER=Entremotivator
WP_APP_PASSWORD=2qeW Qvum BJ0e b1mh wteD uimV
WP_BASIC_AUTH=RW50cmVtb3RpdmF0b3I6MnFlV1F2dW1CSjBlYjFtaHd0ZUR1aW1W
```

The Next.js routes are:

```text
/api/wp/ping
/api/wp/pages
/api/wp/npc-windows
/api/wp/render
```

Use:

```text
npm run dev:3006
```

Then open:

```text
http://localhost:3006
```

The Application Password stays on the server. Browser JavaScript calls the local Next API routes instead of sending the password to the client.

## Emergency Iframe Cookie Fix

The full app package includes a second WordPress plugin:

```text
wp-iframe-cookie-fix.zip
```

Install and activate it only when you need WordPress auth cookies to work inside trusted HTTPS iframes. It adds:

- `FORCE_SSL_ADMIN`
- `Content-Security-Policy: frame-ancestors`
- `SameSite=None; Secure` for WordPress auth cookies

Also add this above `That's all, stop editing` in `wp-config.php`:

```php
define('FORCE_SSL_ADMIN', true);
define('COOKIEPATH', '/');
define('SITECOOKIEPATH', '/');
```

Only for subdomains such as `app.entremotivator.com` and `www.entremotivator.com`:

```php
define('COOKIE_DOMAIN', '.entremotivator.com');
```

Do not use `.localhost` for cookies. The strongest setup is still public shortcode pages plus REST API sync, not iframing `wp-admin` from localhost.

## Admin Settings

### App URL

The URL where the V0Map app is running.

### Iframe Height

Recommended:

- `720` for normal pages.
- `850` for immersive pages.
- `1000` for full dashboard pages.

### Display Title

Shown in the embed toolbar.

### Display Description

Shown under the title.

### Show Toolbar

Turns the app embed toolbar on/off.

### Show Open Button

Adds an Open Full App link.

### Allow Fullscreen

Adds iframe fullscreen permission.

### Persistent Localhost Session

Adds local session context for localhost development.

### NPC Window Shortcodes

Defines WordPress shortcode windows.

Format:

```text
Title|Team|[shortcode]
```

## Suggested WordPress Pages

### Full App Page

```text
[v0map_gallery height="900"]
```

### NPC WordPress Dashboard Page

```text
[v0map_npc_windows]
```

### Shortcode Discovery Page

```text
[v0map_shortcode_dashboard]
```

### Launch Page

```text
[v0map_npc_launcher label="Enter AI Society"]
```

## Troubleshooting

### Blank iframe

Open the app URL directly in the same browser.

If it does not load directly, it will not load inside the iframe.

### Localhost works for me but not visitors

`localhost` means the visitor's own computer. Deploy the app publicly for visitors.

### I keep seeing login prompts locally

Enable Persistent Localhost Session.

Also make sure WordPress and the V0Map app are opened in the same browser profile.

### Shortcode does not render in a window

Test the shortcode directly in a normal WordPress page.

Some plugin shortcodes need scripts, user permissions, or a specific post context.

### Too many shortcodes in dashboard

That is normal. WordPress core, plugins, and themes may register shortcodes.

Copy the shortcodes you need into the NPC Window Shortcodes setting.

### Browser blocks iframe

Check `X-Frame-Options` and `Content-Security-Policy` headers on the app host.

### Mixed content warning

If WordPress uses HTTPS, the app URL should also use HTTPS.

## Security Notes

Only administrators can change plugin settings.

The plugin sanitizes:

- URLs
- text settings
- textarea window definitions
- iframe height
- checkbox values

Shortcode output is rendered by WordPress via `do_shortcode`, so only configure shortcodes you trust.

## Version

Plugin version: `1.8.0`

Best used for:

- WordPress app embedding
- local V0Map demos
- client preview portals
- internal dashboards
- shortcode-powered NPC panels
- app + WordPress hybrid experiences

== Version 1.16.0 API Suite Plus ==

* Adds `/wp-json/v0map-npc/v1/diagnostics` for readiness scoring, missing shortcode checks, iframe/cookie checks, and repair hints.
* Adds `/wp-json/v0map-npc/v1/command-center` for pinned Brand GPT, operator panels, shortcode groups, and dashboard links.
* Adds `/wp-json/v0map-npc/v1/search` for shortcode/content search.
* Adds `/wp-json/v0map-npc/v1/render-url` so Next.js can request one styled WordPress iframe URL for any approved shortcode tag.
* Extends the feature suite with diagnostics and command-center payloads.
