import { readWpResponse, wpFetch } from "@/lib/wp-api"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const type = url.searchParams.get("type") || "all"
  const limit = Math.max(1, Math.min(60, Number(url.searchParams.get("limit") || 20)))
  const res = await wpFetch(`/wp-json/v0map-npc/v1/content?type=${encodeURIComponent(type)}&limit=${limit}`)
  const payload = await readWpResponse(res)

  if (!res.ok) {
    return Response.json(
      {
        ok: false,
        source: "next-server-wordpress-content-proxy",
        status: res.status,
        payload,
      },
      { status: res.status },
    )
  }

  return Response.json({
    ...payload,
    source: "next-server-wordpress-content-proxy",
  })
}
