import { getWpConfig, readWpResponse, wpError, wpFetch } from "@/lib/wp-api"

export async function GET() {
  const { wpUrl, user } = getWpConfig()
  const res = await wpFetch("/wp-json/fapc/v1/ping")
  const payload = await readWpResponse(res)

  if (!res.ok) {
    return wpError("Failed to ping WordPress REST route with server-side Basic Auth", res.status, {
      ok: false,
      status: res.status,
      route: "/wp-json/fapc/v1/ping",
      wpUrl,
      user,
      payload,
    })
  }

  return Response.json({
    ok: true,
    status: res.status,
    route: "/wp-json/fapc/v1/ping",
    wpUrl,
    user,
    payload,
  })
}
