import { readWpResponse, wpError, wpFetch } from "@/lib/wp-api"

export async function GET() {
  const res = await wpFetch("/wp-json/v0map-npc/v1/api-map")
  const payload = await readWpResponse(res)

  if (!res.ok) {
    return wpError("Failed to pull WordPress V0Map API map", res.status, { ok: false, payload })
  }

  return Response.json({ ok: true, source: "next-server-wordpress-api-map-proxy", ...payload })
}
