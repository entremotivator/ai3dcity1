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

function asObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, any>) : {}
}

function countArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}

export async function GET() {
  const [diagnostics, health, windows, shortcodes, suite] = await Promise.all([
    safeJson("/wp-json/v0map-npc/v1/diagnostics"),
    safeJson("/wp-json/v0map-npc/v1/health"),
    safeJson("/wp-json/v0map-npc/v1/windows?render=0&limit=200"),
    safeJson("/wp-json/v0map-npc/v1/shortcodes?limit=300"),
    safeJson("/wp-json/v0map-npc/v1/feature-suite?limit=80"),
  ])

  if (diagnostics.ok) {
    return Response.json({
      ...asObject(diagnostics.payload),
      ok: true,
      source: "next-server-proxy-wordpress-diagnostics",
      proxy: { route: "/api/wp/diagnostics", status: diagnostics.status, cache: "no-store" },
    })
  }

  const winPayload = asObject(windows.payload)
  const shortcodePayload = asObject(shortcodes.payload)
  const healthPayload = asObject(health.payload)
  const suitePayload = asObject(suite.payload)
  const featureDiagnostics = asObject(asObject(suitePayload.features).diagnostics)

  return Response.json({
    ok: health.ok || windows.ok || shortcodes.ok || suite.ok,
    source: "next-server-fallback-diagnostics-aggregate",
    proxy: {
      route: "/api/wp/diagnostics",
      pluginDiagnosticsStatus: diagnostics.status,
      pluginDiagnosticsError: diagnostics.payload,
      cache: "no-store",
    },
    site: suitePayload.site || { url: "https://entremotivator.com", name: "Entremotivator" },
    plugin: suitePayload.plugin || healthPayload.plugin || { version: "pending" },
    connection: {
      diagnostics: { ok: diagnostics.ok, status: diagnostics.status },
      health: { ok: health.ok, status: health.status },
      windows: { ok: windows.ok, status: windows.status },
      shortcodes: { ok: shortcodes.ok, status: shortcodes.status },
      suite: { ok: suite.ok, status: suite.status },
    },
    metrics: {
      windows: countArray(winPayload.windows),
      shortcodes: countArray(shortcodePayload.shortcodes),
      matchedShortcodes: asObject(shortcodePayload.metrics).matched || asObject(suitePayload.metrics).matchedShortcodes || 0,
      missingShortcodes: asObject(shortcodePayload.metrics).missing || asObject(suitePayload.metrics).missingShortcodes || 0,
    },
    diagnostics: {
      ...featureDiagnostics,
      mode: featureDiagnostics.mode || "fallback-wordpress-api-check",
      repairHints: featureDiagnostics.repairHints || [
        "Install and activate the v0map plugin v19 or newer.",
        "Confirm .env.local has WP_URL, WP_USER, and WP_APP_PASSWORD set server-side only.",
        "Run pnpm run wp:ping before opening the 3D world.",
      ],
    },
  })
}
