import { readWpResponse, wpFetch } from "@/lib/wp-api"

async function safeJson(path: string) {
  try {
    const res = await wpFetch(path)
    const payload = await readWpResponse(res)
    return { ok: res.ok, status: res.status, path, payload }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      path,
      payload: { message: error instanceof Error ? error.message : "Request failed" },
    }
  }
}

function countArray(value: unknown) {
  if (Array.isArray(value)) return value.length
  if (value && typeof value === "object") {
    const record = value as Record<string, any>
    if (Array.isArray(record.items)) return record.items.length
    if (Array.isArray(record.data)) return record.data.length
    if (Array.isArray(record.results)) return record.results.length
    if (Array.isArray(record.menus)) return record.menus.length
    return Object.keys(record).length
  }
  return 0
}

function objectCount(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value as Record<string, unknown>).length : 0
}

function toArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === "object") {
    const record = value as Record<string, any>
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.data)) return record.data as T[]
    if (Array.isArray(record.results)) return record.results as T[]
    if (Array.isArray(record.menus)) return record.menus as T[]
    return Object.entries(record).map(([key, item]) =>
      item && typeof item === "object" ? ({ key, slug: key, ...(item as Record<string, any>) } as T) : ({ key, slug: key, value: item } as T),
    )
  }
  return []
}

function toObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {}
}

function stableId(prefix: string, item: any, index: number) {
  const raw =
    item?.stableKey ??
    item?.id ??
    item?.ID ??
    item?.wpId ??
    item?.databaseId ??
    item?.slug ??
    item?.key ??
    item?.file ??
    item?.link ??
    item?.sourceUrl ??
    item?.source_url ??
    item?.url ??
    item?.name ??
    item?.title?.rendered ??
    item?.title ??
    `fallback-${index}`
  return `${prefix}-${String(raw).replace(/[^a-zA-Z0-9_-]+/g, "_")}-${index}`
}

function withStableItems<T = any>(value: unknown, prefix: string): T[] {
  return toArray<any>(value).map((item: any, index: number) => {
    if (!item || typeof item !== "object") {
      return { value: item, id: `${prefix}-${index}`, stableKey: stableId(prefix, { value: item }, index) } as T
    }
    const fallback = item.id ?? item.ID ?? item.wpId ?? item.databaseId ?? item.slug ?? item.key
    return {
      ...item,
      id: fallback ?? `${prefix}-${index}`,
      wpId: item.wpId ?? item.ID ?? item.id ?? null,
      stableKey: stableId(prefix, item, index),
    } as T
  })
}

function normalizeSuitePayload(payload: any) {
  if (!payload || typeof payload !== "object") return payload
  const features = toObject(payload.features)
  const diagnostics = toObject(features.diagnostics)
  const theme = toObject(features.theme)
  return {
    ...payload,
    features: {
      ...features,
      windows: withStableItems(features.windows, "window"),
      shortcodes: withStableItems(features.shortcodes, "shortcode"),
      pages: withStableItems(features.pages, "page"),
      posts: withStableItems(features.posts, "post"),
      media: withStableItems(features.media, "media"),
      postTypes: withStableItems(features.postTypes || features.types, "post-type"),
      taxonomies: withStableItems(features.taxonomies, "taxonomy"),
      menus: withStableItems(features.menus, "menu"),
      featureGroups: withStableItems(features.featureGroups, "feature-group"),
      shortcodeProviders: withStableItems(features.shortcodeProviders, "provider"),
      plugins: withStableItems(features.plugins, "plugin"),
      sidebars: withStableItems(features.sidebars, "sidebar"),
      comments: withStableItems(features.comments, "comment"),
      dashboardPages: toObject(features.dashboardPages),
      customContent: toObject(features.customContent),
      theme: { ...theme, supports: toArray(theme.supports) },
      apiRoutes: features.apiRoutes || {},
      health: toObject(features.health),
      diagnostics: {
        ...diagnostics,
        matchedTags: withStableItems(diagnostics.matchedTags, "matched-tag"),
        missingTags: withStableItems(diagnostics.missingTags, "missing-tag"),
        repairHints: withStableItems(diagnostics.repairHints, "repair-hint"),
      },
      commandCenter: toObject(features.commandCenter),
    },
  }
}

function safeFeaturePayload(payload: any, fallback: Record<string, unknown> = {}) {
  return payload && typeof payload === "object" ? payload : fallback
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.max(1, Math.min(120, Number(url.searchParams.get("limit") || 30)))

  // Primary source: the V0Map plugin feature endpoint. This is the cleanest source because it knows the
  // approved shortcode roster, page render URLs, iframe settings, and plugin-created dashboard pages.
  const pluginFeatures = await safeJson(`/wp-json/v0map-npc/v1/feature-suite?limit=${limit}`)

  if (pluginFeatures.ok) {
    const payload: any = safeFeaturePayload(pluginFeatures.payload)
    return Response.json({
      ...normalizeSuitePayload(payload),
      ok: true,
      source: "next-server-proxy-wordpress-plugin-features",
      proxy: {
        route: "/api/wp/features",
        upstreamRoute: "/wp-json/v0map-npc/v1/feature-suite",
        pluginStatus: pluginFeatures.status,
        mode: "server-side-basic-auth",
        cache: "no-store",
      },
    })
  }

  // Fallback: aggregate core WP REST and V0Map endpoints directly through the Next server proxy.
  const [ping, windows, shortcodes, pages, posts, media, types, taxonomies, menus, usersMe, settings] = await Promise.all([
    safeJson("/wp-json/fapc/v1/ping"),
    safeJson("/wp-json/v0map-npc/v1/windows?render=0&random=0&limit=160"),
    safeJson("/wp-json/v0map-npc/v1/shortcodes?random=0&limit=300"),
    safeJson(`/wp-json/wp/v2/pages?per_page=${Math.min(limit, 100)}&status=publish&_fields=id,slug,link,title,modified,date,type,status`),
    safeJson(`/wp-json/wp/v2/posts?per_page=${Math.min(limit, 100)}&status=publish&_fields=id,slug,link,title,modified,date,type,status,excerpt`),
    safeJson(`/wp-json/wp/v2/media?per_page=${Math.min(limit, 100)}&_fields=id,link,source_url,title,media_type,mime_type,date,modified`),
    safeJson("/wp-json/wp/v2/types"),
    safeJson("/wp-json/wp/v2/taxonomies"),
    safeJson("/wp-json/wp/v2/menus?per_page=50"),
    safeJson("/wp-json/wp/v2/users/me"),
    safeJson("/wp-json/wp/v2/settings"),
  ])

  const winPayload: any = safeFeaturePayload(windows.payload)
  const scPayload: any = safeFeaturePayload(shortcodes.payload)

  return Response.json({
    ok: ping.ok || windows.ok || shortcodes.ok || pages.ok || posts.ok,
    source: "next-server-fallback-wordpress-rest-api-aggregate",
    proxy: {
      route: "/api/wp/features",
      pluginFeatureStatus: pluginFeatures.status,
      pluginFeatureError: pluginFeatures.payload,
      mode: "server-side-basic-auth",
      cache: "no-store",
    },
    connection: {
      ping: { ok: ping.ok, status: ping.status },
      windows: { ok: windows.ok, status: windows.status },
      shortcodes: { ok: shortcodes.ok, status: shortcodes.status },
      wpCore: {
        pages: pages.status,
        posts: posts.status,
        media: media.status,
        types: types.status,
        taxonomies: taxonomies.status,
        menus: menus.status,
        user: usersMe.status,
        settings: settings.status,
      },
    },
    metrics: {
      npcWindows: countArray(winPayload.windows),
      approvedShortcodes: countArray(scPayload.shortcodes),
      pages: countArray(pages.payload),
      posts: countArray(posts.payload),
      media: countArray(media.payload),
      customPostTypes: objectCount(types.payload),
      taxonomies: objectCount(taxonomies.payload),
      menus: countArray(menus.payload),
      matchedShortcodes: winPayload.metrics?.matched || 0,
      missingShortcodes: winPayload.metrics?.missing || 0,
    },
    site: {
      url: "https://entremotivator.com",
      name: settings.ok ? (settings.payload as any)?.title : "Entremotivator",
    },
    features: {
      windows: withStableItems(winPayload.windows, "window"),
      shortcodes: withStableItems(scPayload.shortcodes, "shortcode"),
      dashboardPages: winPayload.pages || scPayload.pages || {},
      pages: withStableItems(pages.payload, "page"),
      posts: withStableItems(posts.payload, "post"),
      media: withStableItems(media.payload, "media"),
      postTypes: withStableItems(types.payload, "post-type"),
      taxonomies: withStableItems(taxonomies.payload, "taxonomy"),
      menus: withStableItems(menus.payload, "menu"),
      currentUser: usersMe.payload,
      settings: settings.ok ? settings.payload : { unavailable: true, status: settings.status },
      health: {
        styledIframeRender: true,
        oneWindowAtATime: true,
        pinnedShortcode: "[bsp_app]",
        fallbackMode: true,
      },
    },
  })
}
