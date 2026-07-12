import { readWpResponse, wpFetch } from "@/lib/wp-api"

async function safeJson(path: string) {
  try {
    const res = await wpFetch(path)
    const payload = await readWpResponse(res)
    return { ok: res.ok, status: res.status, path, payload }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      path,
      payload: { message: error instanceof Error ? error.message : "Request failed" },
    }
  }
}

function obj(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, any>) : {}
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get("q") || ""
  const limit = Math.max(1, Math.min(60, Number(url.searchParams.get("limit") || 20)))
  const plugin = await safeJson(`/wp-json/v0map-npc/v1/search?q=${encodeURIComponent(q)}&limit=${limit}`)

  if (plugin.ok) {
    return Response.json({
      ...obj(plugin.payload),
      ok: true,
      source: "next-server-proxy-wordpress-search",
      proxy: { route: "/api/wp/search", status: plugin.status, cache: "no-store" },
    })
  }

  const [coreSearch, pages, posts, media] = await Promise.all([
    safeJson(`/wp-json/wp/v2/search?search=${encodeURIComponent(q)}&per_page=${limit}`),
    safeJson(`/wp-json/wp/v2/pages?search=${encodeURIComponent(q)}&per_page=${limit}&_fields=id,slug,link,title,type,modified`),
    safeJson(`/wp-json/wp/v2/posts?search=${encodeURIComponent(q)}&per_page=${limit}&_fields=id,slug,link,title,type,modified,excerpt`),
    safeJson(`/wp-json/wp/v2/media?search=${encodeURIComponent(q)}&per_page=${limit}&_fields=id,link,source_url,title,media_type,mime_type,modified`),
  ])

  return Response.json({
    ok: coreSearch.ok || pages.ok || posts.ok || media.ok,
    source: "next-server-fallback-wordpress-core-search",
    query: q,
    limit,
    proxy: { route: "/api/wp/search", pluginStatus: plugin.status, pluginError: plugin.payload, cache: "no-store" },
    matches: {
      core: coreSearch.ok ? coreSearch.payload : [],
      pages: pages.ok ? pages.payload : [],
      posts: posts.ok ? posts.payload : [],
      media: media.ok ? media.payload : [],
    },
  })
}
