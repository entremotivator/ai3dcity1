import { readWpResponse, wpError, wpFetch } from "@/lib/wp-api"

export async function GET() {
  try {
    const res = await wpFetch("/wp-json/v0map-npc/v1/project-manager-suite")
    const payload = await readWpResponse(res)
    if (!res.ok) return wpError("WordPress project-manager-suite route failed", res.status, { payload })
    return Response.json({ ok: true, source: "wordpress", ...payload })
  } catch (error: any) {
    return wpError("Unable to load project-manager-suite", 500, { message: error?.message || String(error) })
  }
}
