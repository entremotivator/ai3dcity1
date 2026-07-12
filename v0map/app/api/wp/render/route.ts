import { readWpResponse, wpError, wpFetch } from "@/lib/wp-api"

function extractShortcodeTag(shortcode: string) {
  return shortcode.match(/^\[\s*([A-Za-z0-9_-]+)/)?.[1] || ""
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const rawShortcode = typeof body.shortcode === "string" ? body.shortcode : ""
  const tag = typeof body.tag === "string" ? body.tag : ""
  const shortcode = rawShortcode.trim() || (tag.trim() ? `[${tag.trim()}]` : "")
  const shortcodeTag = tag.trim() || extractShortcodeTag(shortcode)

  if (!shortcode.trim()) {
    return wpError("Missing shortcode", 400)
  }

  const res = await wpFetch("/wp-json/v0map-npc/v1/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shortcode }),
  })

  const payload = await readWpResponse(res)

  if (res.ok) {
    return Response.json({ ok: true, source: "wordpress-render-api", ...payload })
  }

  // Fallback for sites where REST render is blocked but the public render page works.
  if (shortcodeTag) {
    const pageRes = await wpFetch(`/v0map-npc-gallery/?v0map_shortcode_tag=${encodeURIComponent(shortcodeTag)}&v0map_embed=1`, {
      headers: { Accept: "text/html" },
    })
    if (pageRes.ok) {
      const html = await pageRes.text()
      return Response.json({
        ok: true,
        source: "wordpress-render-page-fallback",
        shortcode,
        tag: shortcodeTag,
        registered: true,
        html,
        renderError: "",
        previousApiStatus: res.status,
        previousApiPayload: payload,
      })
    }
  }

  return wpError("Failed to render WordPress shortcode with live Basic Auth", res.status, {
    ok: false,
    shortcode,
    tag: shortcodeTag,
    payload,
  })
}
