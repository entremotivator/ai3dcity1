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

function obj(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, any>) : {}
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.max(1, Math.min(160, Number(url.searchParams.get("limit") || 60)))
  const command = await safeJson(`/wp-json/v0map-npc/v1/command-center?limit=${limit}`)

  if (command.ok) {
    return Response.json({
      ...obj(command.payload),
      ok: true,
      source: "next-server-proxy-wordpress-command-center",
      proxy: { route: "/api/wp/command-center", status: command.status, cache: "no-store" },
    })
  }

  const suite = await safeJson(`/wp-json/v0map-npc/v1/feature-suite?limit=${limit}`)
  const payload = obj(suite.payload)
  const features = obj(payload.features)

  return Response.json({
    ok: suite.ok,
    source: "next-server-fallback-command-center-from-suite",
    proxy: {
      route: "/api/wp/command-center",
      pluginCommandStatus: command.status,
      pluginCommandError: command.payload,
      suiteStatus: suite.status,
      cache: "no-store",
    },
    site: payload.site || { url: "https://entremotivator.com", name: "Entremotivator" },
    plugin: payload.plugin || { version: "pending" },
    brand: obj(features.commandCenter).brand,
    operatorPanels: obj(features.commandCenter).operatorPanels || [],
    shortcodeGroups: features.shortcodeProviders || [],
    windows: features.windows || [],
    pages: features.dashboardPages || {},
  })
}
