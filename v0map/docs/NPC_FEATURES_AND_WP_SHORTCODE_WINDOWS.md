# NPC Features and WordPress Shortcode Windows

This document describes the longer NPC feature layer and the improved WordPress plugin bridge.

## NPC Feature Goals

The upgraded NPC system is meant to support:

- Individual avatar commands.
- Team commands.
- Floor commands.
- Rooftop commands.
- Importable teams.
- WordPress-powered NPC windows.
- Persistent local development sessions.
- Hybrid app + WordPress dashboards.

## Individual NPC Features

Each NPC can now carry:

- `team`
- `role`
- `skills`
- `floor`
- `status`
- `streamlitUrl`
- `tablePosition`
- `dialogue`

Each NPC row in the controls panel has:

- Active toggle.
- Team label.
- Role label.
- Skills label.
- Come button.
- App/window action.

## Group NPC Features

Supported group commands:

- Show All
- Hide All
- Call Meeting
- Make Call
- Break Call
- Scatter
- Gather
- Send to 1F
- Send to 2F
- Send to 3F
- Send to Roof

## Team NPC Features

Supported team commands:

- Select team.
- Call Team.
- Show Team.
- Hide Team.
- Team Apps.
- Team Here.

Default teams:

- Leadership
- Growth
- Operations
- Support

## Floor And Rooftop Features

The app includes:

- Floor Manager.
- 1F navigation.
- 2F navigation.
- 3F navigation.
- Roof navigation.
- Rooftop deck.
- Rooftop railings.
- Rooftop label.
- Sky dome visibility.

## WordPress Shortcode Window Features

The upgraded WordPress plugin can render WordPress shortcode output as NPC windows.

This lets WordPress content replace URL-only windows.

Use cases:

- Login windows.
- Member dashboard windows.
- Product grid windows.
- Appointment windows.
- CRM windows.
- LMS windows.
- Lead form windows.
- Calendar windows.

## WordPress Plugin Shortcodes

### Main app iframe

```text
[v0map_gallery]
```

### Launch button

```text
[v0map_npc_launcher]
```

### Single NPC shortcode window

```text
[v0map_npc_window title="Agent CRM" team="Operations" shortcode="[your_shortcode]"]
```

### Configured NPC windows dashboard

```text
[v0map_npc_windows]
```

### Registered shortcode dashboard

```text
[v0map_shortcode_dashboard]
```

## NPC Window Definition Format

Inside WordPress admin:

```text
Title|Team|[shortcode]
```

Example:

```text
Agent Login|Support|[wp_login_form]
Agent Products|Growth|[products limit="6"]
Agent Leads|Operations|[gravityform id="1" title="false"]
```

## Persistent Localhost Login / Session

When enabled in the WordPress plugin and app URL is localhost, the plugin appends:

- `v0map_wp`
- `v0map_wp_user`
- `v0map_wp_session`
- `v0map_wp_context`

It also stores a browser localStorage key:

```text
v0mapNpcGallerySession
```

This helps local demos keep the same app/session context after iframe refresh.

## Recommended Hybrid Setup

1. Run V0Map locally or deploy it.
2. Install the WordPress plugin.
3. Set App URL.
4. Add `[v0map_gallery]` to one page.
5. Add `[v0map_npc_windows]` to another page.
6. Configure NPC Window Shortcodes in WP admin.
7. Use WordPress shortcode dashboard to discover usable tags.

## Delivery Files

The full app zip now includes:

- Upgraded V0Map app.
- WordPress plugin source.
- Clean WordPress plugin zip.
- Long manuals.
- NPC team JSON samples.
- NPC shortcode windows documentation.
