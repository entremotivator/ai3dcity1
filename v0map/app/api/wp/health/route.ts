import { readWpResponse, wpFetch } from "@/lib/wp-api"

async function read(path: string) {
  try {
    const res = await wpFetch(path)
    const payload = await readWpResponse(res)
    return { ok: res.ok, status: res.status, path, payload }
  } catch (error) {
    return { ok: false, status: 0, path, payload: { message: error instanceof Error ? error.message : "Request failed" } }
  }
}

export async function GET() {
  const [pluginHealth, fapcPing, pluginPing, features] = await Promise.all([
    read("/wp-json/v0map-npc/v1/health"),
    read("/wp-json/fapc/v1/ping"),
    read("/wp-json/v0map-npc/v1/ping"),
    read("/wp-json/v0map-npc/v1/features?limit=8"),
  ])

  return Response.json({
    ok: pluginHealth.ok || fapcPing.ok || pluginPing.ok,
    source: "next-server-wordpress-health-proxy",
    status: {
      pluginHealth: pluginHealth.status,
      fapcPing: fapcPing.status,
      pluginPing: pluginPing.status,
      features: features.status,
    },
    health: pluginHealth.payload,
    ping: fapcPing.payload,
    pluginPing: pluginPing.payload,
    features: features.ok ? features.payload : { unavailable: true, payload: features.payload },
  })
}
