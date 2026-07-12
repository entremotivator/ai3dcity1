import { readWpResponse, wpError, wpFetch } from "@/lib/wp-api"

export async function GET() {
  try {
    const res = await wpFetch("/wp-json/v0map-npc/v1/live-voice-options")
    const payload = await readWpResponse(res)
    if (!res.ok) return wpError("WordPress live voice options route failed", res.status, { payload })
    return Response.json({ ok: true, source: "wordpress", ...payload })
  } catch (error: any) {
    return wpError("Unable to load live voice options", 500, { message: error?.message || String(error) })
  }
}
