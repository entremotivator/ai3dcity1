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

function safeObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, any>) : {}
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.max(1, Math.min(160, Number(url.searchParams.get("limit") || 60)))

  const suite = await safeJson(`/wp-json/v0map-npc/v1/feature-suite?limit=${limit}`)
  if (suite.ok) {
    const payload = safeObject(suite.payload)
    return Response.json({
      ...normalizeSuitePayload(payload),
      ok: true,
      source: "next-server-proxy-wordpress-feature-suite",
      proxy: {
        route: "/api/wp/suite",
        pluginStatus: suite.status,
        mode: "server-side-basic-auth",
        cache: "no-store",
      },
    })
  }

  const [features, apiMap, health, windows, shortcodes, content, pages, posts, media, types, taxonomies, menus, settings, user, diagnostics, commandCenter] = await Promise.all([
    safeJson(`/wp-json/v0map-npc/v1/features?limit=${limit}`),
    safeJson("/wp-json/v0map-npc/v1/api-map"),
    safeJson("/wp-json/v0map-npc/v1/health"),
    safeJson(`/wp-json/v0map-npc/v1/windows?render=0&random=0&limit=${Math.min(limit, 160)}`),
    safeJson(`/wp-json/v0map-npc/v1/shortcodes?random=0&limit=300`),
    safeJson(`/wp-json/v0map-npc/v1/content?type=all&limit=${Math.min(limit, 60)}`),
    safeJson(`/wp-json/wp/v2/pages?per_page=${Math.min(limit, 100)}&status=publish&_fields=id,slug,link,title,modified,date,type,status`),
    safeJson(`/wp-json/wp/v2/posts?per_page=${Math.min(limit, 100)}&status=publish&_fields=id,slug,link,title,modified,date,type,status,excerpt`),
    safeJson(`/wp-json/wp/v2/media?per_page=${Math.min(limit, 100)}&_fields=id,link,source_url,title,media_type,mime_type,date,modified`),
    safeJson("/wp-json/wp/v2/types"),
    safeJson("/wp-json/wp/v2/taxonomies"),
    safeJson("/wp-json/wp/v2/menus?per_page=100"),
    safeJson("/wp-json/wp/v2/settings"),
    safeJson("/wp-json/wp/v2/users/me"),
    safeJson("/wp-json/v0map-npc/v1/diagnostics"),
    safeJson(`/wp-json/v0map-npc/v1/command-center?limit=${Math.min(limit, 160)}`),
  ])

  const featurePayload = safeObject(features.payload)
  const featureFeatures = safeObject(featurePayload.features)
  const winPayload = safeObject(windows.payload)
  const shortcodePayload = safeObject(shortcodes.payload)
  const contentPayload = safeObject(content.payload)

  return Response.json({
    ok: features.ok || health.ok || windows.ok || shortcodes.ok || pages.ok || posts.ok,
    source: "next-server-fallback-wordpress-suite-aggregate",
    proxy: {
      route: "/api/wp/suite",
      featureSuiteStatus: suite.status,
      featureSuiteError: suite.payload,
      mode: "server-side-basic-auth",
      cache: "no-store",
    },
    site: featurePayload.site || {
      url: "https://entremotivator.com",
      name: settings.ok ? (settings.payload as any)?.title : "Entremotivator",
      description: settings.ok ? (settings.payload as any)?.description : "",
    },
    plugin: featurePayload.plugin || { version: health.ok ? (health.payload as any)?.plugin?.version : "pending" },
    connection: {
      features: { ok: features.ok, status: features.status },
      apiMap: { ok: apiMap.ok, status: apiMap.status },
      health: { ok: health.ok, status: health.status },
      windows: { ok: windows.ok, status: windows.status },
      shortcodes: { ok: shortcodes.ok, status: shortcodes.status },
      core: {
        pages: pages.status,
        posts: posts.status,
        media: media.status,
        types: types.status,
        taxonomies: taxonomies.status,
        menus: menus.status,
        settings: settings.status,
        user: user.status,
        diagnostics: diagnostics.status,
        commandCenter: commandCenter.status,
      },
    },
    metrics: {
      ...(safeObject(featurePayload.metrics) as any),
      npcWindows: (featurePayload.metrics as any)?.npcWindows ?? countArray(winPayload.windows),
      approvedShortcodes: (featurePayload.metrics as any)?.approvedShortcodes ?? countArray(shortcodePayload.shortcodes),
      pages: ((featurePayload.metrics as any)?.pages ?? countArray(contentPayload.pages)) || countArray(pages.payload),
      posts: ((featurePayload.metrics as any)?.posts ?? countArray(contentPayload.posts)) || countArray(posts.payload),
      media: ((featurePayload.metrics as any)?.media ?? countArray(contentPayload.media)) || countArray(media.payload),
      customPostTypes: ((featurePayload.metrics as any)?.customPostTypes ?? objectCount(contentPayload.custom)) || objectCount(types.payload),
      taxonomies: (featurePayload.metrics as any)?.taxonomies ?? objectCount(taxonomies.payload),
      menus: (featurePayload.metrics as any)?.menus ?? countArray(menus.payload),
      apiRoutes: objectCount((apiMap.payload as any)?.routes),
    },
    features: {
      ...featureFeatures,
      windows: withStableItems(featureFeatures.windows || winPayload.windows, "window"),
      shortcodes: withStableItems(featureFeatures.shortcodes || shortcodePayload.shortcodes, "shortcode"),
      dashboardPages: toObject(featureFeatures.dashboardPages || winPayload.pages || shortcodePayload.pages),
      pages: withStableItems(featureFeatures.pages || contentPayload.pages || pages.payload, "page"),
      posts: withStableItems(featureFeatures.posts || contentPayload.posts || posts.payload, "post"),
      media: withStableItems(featureFeatures.media || contentPayload.media || media.payload, "media"),
      customContent: toObject(featureFeatures.customContent || contentPayload.custom),
      postTypes: withStableItems(featureFeatures.postTypes || types.payload, "post-type"),
      taxonomies: withStableItems(featureFeatures.taxonomies || taxonomies.payload, "taxonomy"),
      menus: withStableItems(featureFeatures.menus || menus.payload, "menu"),
      apiRoutes: featureFeatures.apiRoutes || (apiMap.payload as any)?.routes || {},
      currentUser: user.payload,
      settings: settings.ok ? settings.payload : { unavailable: true, status: settings.status },
      health: featureFeatures.health || (health.payload as any)?.checks || {},
      diagnostics: featureFeatures.diagnostics || (diagnostics.payload as any)?.diagnostics || {},
      commandCenter: featureFeatures.commandCenter || commandCenter.payload || {},
    },
  })
}
