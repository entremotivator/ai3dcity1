import { EXACT_AGENT_ROSTER } from "./agent-roster"

export type LiveShortcodeTab = {
  title: string
  tag: string
  shortcode: string
  source?: "provided" | "history" | "v0map-wrapper"
  primaryLink?: string
}

export type LiveShortcodeWindow = {
  title: string
  team: string
  shortcode: string
  tag: string
  pinned?: boolean
  agentNo?: number
  category?: string
  primaryLink?: string
  tabs?: LiveShortcodeTab[]
  windowType?: "shortcode" | "link" | "hybrid" | "link-wrapper"
  shortcodeSource?: "provided" | "history" | "v0map-wrapper" | "none"
}

export const PINNED_BRAND_WINDOW: LiveShortcodeWindow = {
  title: "BrandGPT",
  team: "Operators",
  tag: "bsp_app",
  shortcode: "[bsp_app]",
  pinned: true,
  agentNo: 58,
  category: "Operators",
  primaryLink: "https://entremotivator.com/wp-admin/admin.php?page=brand-studio",
  tabs: [{ title: "BrandGPT", tag: "bsp_app", shortcode: "[bsp_app]" }],
  windowType: "hybrid",
}

export const LIVE_SHORTCODE_WINDOWS: LiveShortcodeWindow[] = EXACT_AGENT_ROSTER.map((agent) => {
  const hasShortcodes = agent.tags.length > 0
  const primaryTag = hasShortcodes ? agent.primaryTag : "v0map_agent_dashboard"
  const wrapperShortcode = agent.dashboardShortcode || `[v0map_agent_dashboard agent_no="${agent.no}"]`
  const wrapperTab: LiveShortcodeTab = {
    title: `${agent.title} Dashboard`,
    tag: "v0map_agent_dashboard",
    shortcode: wrapperShortcode,
    source: "v0map-wrapper",
    primaryLink: agent.primaryLink,
  }
  return {
    title: agent.title,
    team: agent.category,
    category: agent.category,
    agentNo: agent.no,
    tag: primaryTag,
    shortcode: hasShortcodes ? `[${primaryTag}]` : wrapperShortcode,
    primaryLink: agent.primaryLink,
    tabs: hasShortcodes ? agent.tabs.map((tab) => ({ ...tab, source: "provided" as const })) : [wrapperTab],
    pinned: primaryTag === PINNED_BRAND_WINDOW.tag || agent.no === PINNED_BRAND_WINDOW.agentNo,
    windowType: hasShortcodes && agent.primaryLink ? "hybrid" : hasShortcodes ? "shortcode" : "link-wrapper",
    shortcodeSource: hasShortcodes ? "provided" : "v0map-wrapper",
  }
})

export const LIVE_SHORTCODE_TAGS = Array.from(new Set(LIVE_SHORTCODE_WINDOWS.flatMap((item) => item.tabs?.length ? item.tabs.map((tab) => tab.tag) : item.tag ? [item.tag] : [])))

export function shortcodePageSlug(tag: string) {
  return `npc-live-${tag.toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "-")}`
}

export function pinBrandWindowFirst<T extends { tag?: string; agentNo?: number; pinned?: boolean }>(items: T[]): T[] {
  const pinned: T[] = []
  const rest: T[] = []
  for (const item of items) {
    if (String(item.tag || "") === PINNED_BRAND_WINDOW.tag || item.agentNo === PINNED_BRAND_WINDOW.agentNo || item.pinned) {
      pinned.push(item)
    } else {
      rest.push(item)
    }
  }
  return [...pinned.slice(0, 1), ...rest]
}
