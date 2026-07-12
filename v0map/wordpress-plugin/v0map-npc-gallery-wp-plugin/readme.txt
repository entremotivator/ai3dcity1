=== V0Map NPC Gallery ===
Contributors: v0map
Tags: iframe, gallery, ai, npc, wordpress-rest, threejs, shortcode
Requires at least: 6.0
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.24.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Embed the upgraded V0Map NPC Gallery app inside WordPress with admin settings, exact live shortcode-powered NPC windows, auto-created dashboard pages, live REST API auth sync to the localhost 3D world, team import guidance, localhost session persistence, and fullscreen launch controls.

== Description ==

V0Map NPC Gallery is a WordPress bridge plugin for the upgraded V0Map app. It does not replace the Next.js app. Instead, it lets you embed the running or deployed app inside WordPress pages using shortcodes.

The upgraded V0Map app includes:

* NPC teams.
* Importable team JSON files.
* Floor manager controls.
* Rooftop navigation.
* Realistic sky visuals.
* Per-avatar Come buttons.
* Group commands for teams and all NPCs.
* Live WordPress shortcode windows powered by REST API/Application Password authentication.

The WordPress plugin includes:

* Admin settings page.
* Configurable app URL.
* Configurable iframe height.
* Optional toolbar.
* Optional open-full-app button.
* Refresh button.
* Main embed shortcode.
* Launcher shortcode.
* NPC shortcode-window shortcode.
* NPC windows dashboard shortcode.
* WordPress shortcode discovery dashboard.
* Live NPC connection dashboard.
* Auto-created WordPress pages for the gallery, NPC windows, live connection, shortcode dashboard, and API auth dashboard.
* Existing public live shortcode page detection for each configured NPC window.
* REST API endpoints for authenticated NPC shortcode window sync, registered-shortcode discovery, random unique NPC assignment, and `/wp-json/fapc/v1/ping` Basic Auth testing.
* Default `entremotivator.com` app domain.
* Auth sync and NPC sync context for `http://localhost:3006`.
* Persistent localhost session metadata for local app embeds.
* Longer usage documentation.

== Installation ==

1. Upload the `v0map-npc-gallery` folder to `/wp-content/plugins/`.
2. Activate `V0Map NPC Gallery` in WordPress.
3. Go to `V0Map NPC` in the WordPress admin menu.
4. Set your app URL.
5. Add `[v0map_gallery]` to any page.

For local development, the app URL is usually:

`http://localhost:3000`

For production, the plugin now defaults to:

`https://entremotivator.com`

== Shortcodes ==

Main embed:

`[v0map_gallery]`

Custom height:

`[v0map_gallery height="900"]`

Custom URL:

`[v0map_gallery url="https://your-domain.example"]`

Hide toolbar:

`[v0map_gallery toolbar="0"]`

Launcher button:

`[v0map_npc_launcher]`

Custom launcher label:

`[v0map_npc_launcher label="Open AI Gallery"]`

Single NPC window:

`[v0map_npc_window title="Agent Dashboard" team="WordPress" shortcode="[your_shortcode]"]`

Configured NPC window dashboard:

`[v0map_npc_windows]`

Detected WordPress shortcode dashboard:

`[v0map_shortcode_dashboard]`

Render detected shortcode previews:

`[v0map_shortcode_dashboard render="1"]`

Live connection dashboard:

`[v0map_npc_live_dashboard]`

API auth dashboard:

`[v0map_npc_api_dashboard]`

Configured NPC windows for the included shortcode list:

`[v0map_npc_windows]`

== Frequently Asked Questions ==

= Does this plugin include the whole app? =

No. This plugin embeds the app by URL. The full app zip is packaged separately.

= Can I use localhost? =

Yes, during development. Visitors on other machines will not be able to access your local app unless it is exposed or deployed.

= Can I import NPC teams from WordPress? =

Team import happens inside the V0Map app's NPC Controls panel. The plugin documents and embeds the app; the app handles team JSON import.

= Can WordPress shortcodes become NPC windows? =

Yes. Use the NPC Window Shortcodes setting or the `[v0map_npc_window]` shortcode. This renders WordPress shortcode output inside NPC-style cards instead of URL-only iframe windows.

= What does persistent localhost session mean? =

When enabled, localhost embeds get WordPress session metadata appended to the app URL and stored in browser localStorage. This helps local development flows keep a stable app/session context while refreshing.

= Are all requested NPCs available as WordPress shortcodes? =

Yes. Version 1.2.0 preloads every shortcode from the requested list as an NPC window line. Each line uses `Title|Team|[shortcode]`, so `[v0map_npc_windows]` can render the whole WordPress NPC command dashboard.

= What does the live connection dashboard show? =

It shows app connectivity, localhost world connectivity, registered shortcode counts, configured NPC window counts, missing shortcode handlers, auth sync status, the synced WordPress user id, and the default domain.

= Does the localhost app display real WordPress shortcode output? =

Yes. Version 1.3.0 adds authenticated REST endpoints that return the configured NPC windows with rendered WordPress shortcode HTML. The app stores the bridge token, calls the WordPress API, and opens matching shortcode windows when an NPC is clicked.

= Which pages are created automatically? =

The plugin creates pages for the main gallery, NPC shortcode windows, live connection dashboard, shortcode dashboard, and API auth dashboard.

= Why is the iframe blank? =

Check that the app URL is reachable from the browser viewing the WordPress page.

= Why does WordPress block fullscreen? =

Enable fullscreen in the plugin settings and confirm your browser allows iframe fullscreen.

== Changelog ==

= 1.24.0 =

* Synced with V0Map app v28.
* NPC gesture voice-command metadata: wave, nod, point, cheer, clap, think, salute (single NPC or crowd).
* Named room navigation metadata: lobby, cafe, boardroom, focus pods, arcade lounge, media wall, rooftop garden, helipad.
* Live in-app editable NPC directory metadata (voice: "open NPC directory").
* App-side stability fixes: realistic NPC walking with turn-in-place and crowd separation, pointer-lock/movement fixes (no more frozen movement after minimizing the voice command window), and no more full-scene rebuilds on NPC edits.

= 1.0.0 =

* Initial WordPress plugin package.
* Added admin settings page.
* Added `[v0map_gallery]` shortcode.
* Added `[v0map_npc_launcher]` shortcode.
* Added frontend toolbar and refresh action.
* Added documentation for team import and floor controls.

= 1.1.0 =

* Added exact live shortcode-powered NPC windows.
* Added `[v0map_npc_window]`.
* Added `[v0map_npc_windows]`.
* Added `[v0map_shortcode_dashboard]`.
* Added admin detected-shortcode dashboard.
* Added localhost session persistence option.
* Added better NPC window frontend CSS and JS.

= 1.2.0 =

* Set the default public domain to `https://entremotivator.com`.
* Added `Localhost World URL` for `http://localhost:3000` auth sync.
* Added auth sync, NPC sync, and live connection settings.
* Added `[v0map_npc_live_dashboard]`.
* Preloaded the requested shortcode list as NPC windows.
* Added live app/local-world connection badges and dashboard metrics.
* Added iframe `postMessage` sync payloads for the 3D world.

= 1.3.0 =

* Added auto-created WordPress dashboard pages.
* Added `[v0map_npc_api_dashboard]`.
* Added authenticated REST API routes under `/wp-json/v0map-npc/v1/`.
* Added signed bridge tokens for localhost-to-WordPress API sync.
* Added rendered shortcode window payloads for the 3D app.
* Added CORS headers for localhost and the configured app/domain.
* Updated the app to open real WordPress shortcode output for matching NPCs.

= 1.4.0 =

* Allows authenticated WordPress Application Password REST requests to access the NPC window API.
* Matches the Next.js server-side Basic Auth sync pattern for `Entremotivator`.
* Keeps browser JavaScript away from the WordPress Application Password.

= 1.5.0 =

* Replaced the default NPC roster so it starts with the requested live AISC shortcode list.
* Added the extra live shortcodes for 3D room, Ultimate Member, V0Map, Youzify, Give, SliceWP, purchase, and download dashboards.
* Returns public page and page-edit URLs in the NPC API payload.
* Migrates older saved NPC window rosters to the new v1.5 live shortcode roster.

= 1.6.0 =

* Stops creating one WordPress page per shortcode.
* Treats WordPress as the source of truth for existing shortcodes and pages.
* Detects existing `npc-live-*` pages when they already exist.
* Keeps the app focused on pulling/rendering live WordPress shortcode content for each NPC.

= 1.7.0 =

* Prevents one broken shortcode from returning a WordPress API 500 for every NPC window.
* Wraps shortcode rendering with per-window error handling.
* Supports the app rendering shortcode HTML as in-app windows instead of URL iframe windows.

= 1.8.0 =

* Adds frontend shortcode rendering on the existing `v0map-npc-gallery` page.
* Lets the Next app recover from REST render 500 errors by pulling rendered shortcode HTML from that page.
* Keeps NPC windows as rendered shortcode HTML, not page URL iframe windows.


== 1.14.0 ==
* Pinned Brand GPT shortcode window using [bsp_app].
* Next.js viewer now loads real WordPress render pages instead of srcDoc HTML, preserving shortcode CSS/JS styling.
* Added full-assets render URL flag for shortcode iframe pages.


== Version 1.16.0 Live API Suite Plus ==
* Adds /wp-json/v0map-npc/v1/features for full WordPress API feature sync.
* Adds /wp-json/v0map-npc/v1/health for Basic Auth connection checks.
* Adds /wp-json/v0map-npc/v1/content for pages, posts, media, and custom post type pulls.
* Keeps [bsp_app] pinned as the Brand GPT window and keeps real styled shortcode iframe rendering.

== Version 1.16.0 API Suite Plus ==

* Adds `/wp-json/v0map-npc/v1/diagnostics` for readiness scoring, missing shortcode checks, iframe/cookie checks, and repair hints.
* Adds `/wp-json/v0map-npc/v1/command-center` for pinned Brand GPT, operator panels, shortcode groups, and dashboard links.
* Adds `/wp-json/v0map-npc/v1/search` for shortcode/content search.
* Adds `/wp-json/v0map-npc/v1/render-url` so Next.js can request one styled WordPress iframe URL for any approved shortcode tag.
* Extends the feature suite with diagnostics and command-center payloads.

== V25 Voice City Command Center ==
Adds synchronized REST metadata for realtime voice commands, project manager imports, advanced habit tracking, NPC movement playbooks, and 3D city feature-builder commands.

New REST routes:
* /wp-json/v0map-npc/v1/voice-command-suite
* /wp-json/v0map-npc/v1/project-manager-suite
* /wp-json/v0map-npc/v1/npc-movement-playbook
