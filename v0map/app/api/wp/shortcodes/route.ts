import { readWpResponse, wpError, wpFetch } from "@/lib/wp-api"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const random = url.searchParams.get("random") !== "0" ? "1" : "0"
  const limit = url.searchParams.get("limit") || "160"
  const seed = url.searchParams.get("seed") || "v0map"
  const res = await wpFetch(`/wp-json/v0map-npc/v1/shortcodes?random=${random}&limit=${encodeURIComponent(limit)}&seed=${encodeURIComponent(seed)}`)
  const payload = await readWpResponse(res)

  if (!res.ok) {
    return wpError("Failed to pull WordPress shortcode list", res.status, { ok: false, payload })
  }

  return Response.json({ ok: true, ...payload })
}
