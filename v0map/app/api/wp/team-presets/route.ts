import { readWpResponse, wpError, wpFetch } from "@/lib/wp-api"

export async function GET() {
  try {
    const res = await wpFetch("/wp-json/v0map-npc/v1/team-presets")
    const payload = await readWpResponse(res)
    if (!res.ok) return wpError("WordPress team presets route failed", res.status, { payload })
    return Response.json({ ok: true, source: "wordpress", ...payload })
  } catch (error: any) {
    return wpError("Unable to load WordPress team presets", 500, { message: error?.message || String(error) })
  }
}
