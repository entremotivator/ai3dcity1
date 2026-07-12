import { readWpResponse, wpFetch } from "@/lib/wp-api"
const WORDPRESS_SHORTCODE_RENDER_BASE = "https://entremotivator.com/v0map-npc-gallery/"

function shortcodeRenderUrl(tag: string) {
  return `${WORDPRESS_SHORTCODE_RENDER_BASE}?v0map_shortcode_tag=${encodeURIComponent(tag)}&v0map_embed=1&v0map_full_assets=1`
}

function cleanTag(tag: string) {
  return tag.replace(/^\[/, "").replace(/\]$/, "").trim()
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tag = cleanTag(url.searchParams.get("tag") || "bsp_app")
  const shortcode = url.searchParams.get("shortcode") || `[${tag}]`

  try {
    const res = await wpFetch(`/wp-json/v0map-npc/v1/render-url?tag=${encodeURIComponent(tag)}&shortcode=${encodeURIComponent(shortcode)}`)
    const payload = await readWpResponse(res)
    if (res.ok) {
      return Response.json({
        ...(payload && typeof payload === "object" ? payload : {}),
        ok: true,
        source: "next-server-proxy-wordpress-render-url",
        proxy: { route: "/api/wp/render-url", status: res.status, cache: "no-store" },
      })
    }
  } catch {}

  return Response.json({
    ok: true,
    source: "next-local-render-url-fallback",
    tag,
    shortcode,
    registered: false,
    renderMode: "styled-wordpress-iframe-url",
    liveUrl: shortcodeRenderUrl(tag),
    wordpressUrl: shortcodeRenderUrl(tag),
    instructions: "Load liveUrl in an iframe. Do not use srcDoc for live WordPress plugin shortcodes.",
  })
}
