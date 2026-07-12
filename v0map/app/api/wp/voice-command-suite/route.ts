import { readWpResponse, wpError, wpFetch } from "@/lib/wp-api"

export async function GET() {
  try {
    const res = await wpFetch("/wp-json/v0map-npc/v1/voice-command-suite")
    const payload = await readWpResponse(res)
    if (!res.ok) return wpError("WordPress voice-command-suite route failed", res.status, { payload })
    return Response.json({ ok: true, source: "wordpress", ...payload })
  } catch (error: any) {
    return wpError("Unable to load voice-command-suite", 500, { message: error?.message || String(error) })
  }
}
