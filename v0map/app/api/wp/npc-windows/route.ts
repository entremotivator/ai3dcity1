import { readWpResponse, wpFetch } from "@/lib/wp-api"
import { LIVE_SHORTCODE_WINDOWS, PINNED_BRAND_WINDOW, pinBrandWindowFirst, shortcodePageSlug } from "@/lib/wp-shortcodes"

type WindowPayload = {
  id: string
  index: number
  npcId: number
  title: string
  team: string
  shortcode: string
  tag: string
  registered: boolean
  html: string
  renderError?: string
  pageUrl?: string
  pageEditUrl?: string
  editUrl?: string
  dashboardUrl?: string
  liveUrl?: string
  wordpressUrl?: string
}

type LoadResult = {
  source: string
  note: string
  windows: WindowPayload[]
  pages?: unknown
  connection: {
    pingOk: boolean
    pingStatus: number
    windowsStatus?: number
    shortcodesStatus?: number
    message: string
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const render = url.searchParams.get("render") === "1"
  const random = url.searchParams.get("random") !== "0"
  const limit = Math.max(1, Math.min(160, Number(url.searchParams.get("limit") || 60)))
  const seed = url.searchParams.get("seed") || String(new Date().toISOString().slice(0, 10))

  const meta = await loadWindowMetadata({ random, limit, seed })
  const assigned = assignWindowsToNpcSlots(meta.windows, limit, seed)
  const windows = render ? await renderWindows(assigned) : assigned.map((windowItem) => ({ ...windowItem, html: "" }))

  return Response.json({
    source: meta.source,
    note: meta.note,
    site: "https://entremotivator.com",
    connection: meta.connection,
    assignment: {
      random,
      seed,
      mode: "unique-shortcodes-per-npc",
      activeDisplayMode: "one-at-a-time",
      styleMode: "live-wordpress-page-iframe",
      pinnedWindow: `[${PINNED_BRAND_WINDOW.tag}]`,
    },
    windows,
    metrics: {
      windows: windows.length,
      uniqueTags: new Set(windows.map((item) => item.tag).filter(Boolean)).size,
      registered: windows.filter((item) => item.registered).length,
      rendered: windows.filter((item) => item.html).length,
      errors: windows.filter((item) => item.renderError).length,
    },
    pages: meta.pages || {},
  })
}

async function loadWindowMetadata(options: { random: boolean; limit: number; seed: string }): Promise<LoadResult> {
  const pingRes = await wpFetch("/wp-json/fapc/v1/ping")
  const pingOk = pingRes.ok
  const connection = {
    pingOk,
    pingStatus: pingRes.status,
    message: pingOk
      ? "Basic Auth ping route connected. Pulling live WordPress shortcode windows."
      : `Basic Auth ping failed with HTTP ${pingRes.status}. Trying V0Map windows route, then local fallback.`,
  }

  const windowsPath = `/wp-json/v0map-npc/v1/windows?render=0&random=${options.random ? "1" : "0"}&limit=${options.limit}&seed=${encodeURIComponent(options.seed)}`
  const apiRes = await wpFetch(windowsPath)

  if (apiRes.ok) {
    const payload = await apiRes.json()
    return {
      source: "wordpress-v0map-api",
      note: "Pulled live shortcode window metadata from the V0Map WordPress API. Rendering happens one selected window at a time.",
      windows: pinBrandWindowFirst(uniqueWindows(Array.isArray(payload.windows) ? payload.windows.map(normalizeApiWindow) : [])),
      pages: payload.pages,
      connection: {
        ...connection,
        windowsStatus: apiRes.status,
        message: pingOk ? "Connected to WordPress ping and V0Map windows API." : "V0Map windows API connected, but ping route did not confirm.",
      },
    }
  }

  const shortcodesRes = await wpFetch(`/wp-json/v0map-npc/v1/shortcodes?random=${options.random ? "1" : "0"}&limit=${options.limit}&seed=${encodeURIComponent(options.seed)}`)
  if (shortcodesRes.ok) {
    const payload = await shortcodesRes.json()
    const shortcodes = Array.isArray(payload.shortcodes) ? payload.shortcodes : []
    return {
      source: "wordpress-shortcodes-api",
      note: "Pulled the live registered shortcode list from WordPress and assigned one unique shortcode per NPC.",
      windows: pinBrandWindowFirst(uniqueWindows(shortcodes.map(normalizeShortcodeWindow))),
      pages: payload.pages,
      connection: {
        ...connection,
        windowsStatus: apiRes.status,
        shortcodesStatus: shortcodesRes.status,
        message: "Connected through the WordPress shortcode list API.",
      },
    }
  }

  return {
    source: "local-shortcode-roster",
    note: "WordPress API did not connect, so the local shortcode roster is assigned uniquely. No Streamlit URLs are used.",
    windows: stableShuffle(
      LIVE_SHORTCODE_WINDOWS.map((windowItem, index) => {
        const slug = shortcodePageSlug(windowItem.tag)
        return {
          id: `npc-window-${index + 1}`,
          index,
          npcId: index + 1,
          title: windowItem.title,
          team: windowItem.team,
          shortcode: windowItem.shortcode,
          tag: windowItem.tag,
          registered: false,
          html: "",
          pageUrl: `https://entremotivator.com/${slug}/`,
          pageEditUrl: "",
          editUrl: "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
          dashboardUrl: "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
          liveUrl: `https://entremotivator.com/v0map-npc-gallery/?v0map_shortcode_tag=${encodeURIComponent(windowItem.tag)}&v0map_embed=1`,
          wordpressUrl: `https://entremotivator.com/v0map-npc-gallery/?v0map_shortcode_tag=${encodeURIComponent(windowItem.tag)}&v0map_embed=1`,
        }
      }),
      options.seed,
    ),
    connection: {
      ...connection,
      windowsStatus: apiRes.status,
      shortcodesStatus: shortcodesRes.status,
      message: `WordPress live API fallback used local roster. Ping ${pingRes.status}, windows ${apiRes.status}, shortcodes ${shortcodesRes.status}.`,
    },
  }
}

function uniqueWindows(windows: WindowPayload[]) {
  const seen = new Set<string>()
  const unique: WindowPayload[] = []
  for (const windowItem of windows) {
    const key = windowItem.tag || windowItem.shortcode || windowItem.id
    if (!key || seen.has(key)) continue
    seen.add(key)
    unique.push(windowItem)
  }
  return unique
}

function assignWindowsToNpcSlots(windows: WindowPayload[], limit: number, seed: string) {
  const unique = pinBrandWindowFirst(uniqueWindows(windows))
  const [pinned, ...unpinned] = unique
  const shuffledRest = stableShuffle(unpinned, seed)
  const shuffled = pinBrandWindowFirst([pinned, ...shuffledRest].filter(Boolean) as WindowPayload[]).slice(0, limit)
  return shuffled.map((windowItem, index) => ({
    ...windowItem,
    id: `npc-window-${index + 1}-${windowItem.tag || index}`,
    index,
    npcId: index + 1,
  }))
}

async function renderWindows(windows: WindowPayload[]) {
  const rendered: WindowPayload[] = []
  for (const windowItem of windows) {
    rendered.push(await renderWindow(windowItem))
  }
  return rendered
}

async function renderWindow(windowItem: WindowPayload): Promise<WindowPayload> {
  const res = await wpFetch("/wp-json/v0map-npc/v1/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shortcode: windowItem.shortcode || `[${windowItem.tag}]` }),
  })

  if (!res.ok) {
    const pageRendered = await renderWindowThroughPage(windowItem)
    if (pageRendered) {
      return {
        ...windowItem,
        registered: true,
        html: pageRendered,
        renderError: "",
      }
    }

    const payload = await readWpResponse(res)
    return {
      ...windowItem,
      html: renderErrorHtml(windowItem, `WordPress render API returned ${res.status}`),
      renderError: typeof payload?.message === "string" ? payload.message : `WordPress render API returned ${res.status}`,
    }
  }

  const payload = await res.json()
  return {
    ...windowItem,
    registered: Boolean(payload.registered),
    html: payload.html || renderEmptyHtml(windowItem),
    renderError: payload.renderError || "",
  }
}

async function renderWindowThroughPage(windowItem: WindowPayload) {
  const res = await wpFetch(
    `/v0map-npc-gallery/?v0map_shortcode_tag=${encodeURIComponent(windowItem.tag)}&v0map_embed=1`,
    {
      headers: {
        Accept: "text/html",
      },
    },
  )

  if (!res.ok) {
    return ""
  }

  return res.text()
}

function normalizeApiWindow(windowItem: any): WindowPayload {
  const tag = String(windowItem.tag || extractShortcodeTag(String(windowItem.shortcode || "")))
  const slug = shortcodePageSlug(tag)
  const liveUrl = windowItem.liveUrl || windowItem.wordpressUrl || windowItem.pageUrl || `https://entremotivator.com/v0map-npc-gallery/?v0map_shortcode_tag=${encodeURIComponent(tag)}&v0map_embed=1`

  return {
    id: String(windowItem.id || `npc-window-${Number(windowItem.index || 0) + 1}`),
    index: Number(windowItem.index || 0),
    npcId: Number(windowItem.npcId || Number(windowItem.index || 0) + 1),
    title: String(windowItem.title || `NPC ${tag}`),
    team: String(windowItem.team || "WordPress"),
    shortcode: String(windowItem.shortcode || `[${tag}]`),
    tag,
    registered: Boolean(windowItem.registered),
    html: windowItem.html || "",
    renderError: windowItem.renderError || "",
    pageUrl: windowItem.pageUrl || `https://entremotivator.com/${slug}/`,
    pageEditUrl: windowItem.pageEditUrl || "",
    editUrl: windowItem.editUrl || "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
    dashboardUrl: windowItem.dashboardUrl || "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
    liveUrl,
    wordpressUrl: liveUrl,
  }
}

function normalizeShortcodeWindow(item: any, index: number): WindowPayload {
  const tag = String(item.tag || extractShortcodeTag(String(item.shortcode || "")))
  const title = String(item.title || tag.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()))
  const shortcode = String(item.shortcode || `[${tag}]`)
  const liveUrl = item.liveUrl || item.wordpressUrl || item.pageUrl || `https://entremotivator.com/v0map-npc-gallery/?v0map_shortcode_tag=${encodeURIComponent(tag)}&v0map_embed=1`

  return {
    id: String(item.id || `npc-window-${index + 1}`),
    index,
    npcId: index + 1,
    title,
    team: String(item.team || "WordPress Shortcodes"),
    shortcode,
    tag,
    registered: Boolean(item.registered),
    html: "",
    renderError: "",
    pageUrl: item.pageUrl || liveUrl,
    pageEditUrl: item.pageEditUrl || "",
    editUrl: item.editUrl || "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
    dashboardUrl: item.dashboardUrl || "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
    liveUrl,
    wordpressUrl: liveUrl,
  }
}

function extractShortcodeTag(shortcode: string) {
  return shortcode.match(/^\[\s*([A-Za-z0-9_-]+)/)?.[1] || ""
}

function stableShuffle<T>(items: T[], seed: string) {
  const arr = [...items]
  let state = hashSeed(seed || "v0map") || 1
  for (let i = arr.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function hashSeed(seed: string) {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function renderEmptyHtml(windowItem: WindowPayload) {
  return `<div style="font-family:system-ui;padding:18px"><h2>${escapeHtml(windowItem.title)}</h2><p>WordPress shortcode <code>[${escapeHtml(windowItem.tag)}]</code> returned no visible HTML.</p></div>`
}

function renderErrorHtml(windowItem: WindowPayload, message: string) {
  return `<div style="font-family:system-ui;padding:18px;border-left:4px solid #dc2626;background:#fff7f7;color:#7f1d1d"><h2>${escapeHtml(windowItem.title)}</h2><p>${escapeHtml(message)}</p><code>[${escapeHtml(windowItem.tag)}]</code></div>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
