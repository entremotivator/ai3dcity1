export type VoiceCommandAction =
  | "open_window"
  | "close_window"
  | "window_next"
  | "window_previous"
  | "window_wide"
  | "create_npc"
  | "summon_npc"
  | "move_npc"
  | "dance_npc"
  | "patrol_npcs"
  | "freeze_npcs"
  | "import_team"
  | "add_city_feature"
  | "project_open"
  | "project_task_add"
  | "project_task_complete"
  | "project_export"
  | "dictation_start"
  | "dictation_stop"
  | "dictation_note"
  | "wp_refresh"
  | "local_diagnostic"
  | "unknown"

export type ParsedVoiceCommand = {
  ok: boolean
  action: VoiceCommandAction
  raw: string
  confidence: number
  params: Record<string, string | number | boolean | null>
  safeToRun: boolean
  feedback: string
}

export const VOICE_COMMAND_GROUPS = [
  {
    id: "windows",
    title: "Live WordPress Windows",
    description: "Open, close, resize, and navigate one live styled shortcode iframe at a time.",
    examples: ["Brand GPT", "open AISC Missions", "next window", "previous window", "wide screen", "close window"],
  },
  {
    id: "npc-builder",
    title: "Voice NPC Builder",
    description: "Create new NPCs by voice and bind them to approved WordPress shortcode windows.",
    examples: ["create NPC named Revenue Coach", "create NPC named Mission Guide with shortcode aisc_missions", "NPC 4 come here"],
  },
  {
    id: "npc-movement",
    title: "NPC Movement + Yuka-Style Pathing",
    description: "Summon, follow, patrol, dance, freeze, and move NPCs around the 3D city with safe local targets.",
    examples: ["NPC 2 follow me", "move NPC 3 left", "send NPC 5 to project room", "NPC 7 patrol route", "freeze all NPCs", "dance all"],
  },
  {
    id: "city-builder",
    title: "3D City Builder",
    description: "Add city objects and rooms inside the 3D world without leaving the app.",
    examples: ["add automation lab", "add project board", "add voice gate", "add media studio", "add calendar room", "add Yuka path node"],
  },
  {
    id: "project-management",
    title: "Project Manager + Daily To-Do",
    description: "Open the project window, add checklist items, import habits, and export the board.",
    examples: ["open project manager", "add task test shortcode styling", "complete task 1", "import habit tracker", "export project board"],
  },
  {
    id: "dictation",
    title: "Live Dictation",
    description: "Capture spoken project notes until command mode is re-enabled.",
    examples: ["dictation mode", "take note check Brand GPT CSS", "command mode"],
  },
  {
    id: "wordpress-api",
    title: "WordPress API Diagnostics",
    description: "Trigger safe local WordPress API checks from the voice blob.",
    examples: ["refresh WordPress API", "npm ping", "npm features", "npm diagnostics", "npm suite"],
  },
] as const

function pickNpcId(text: string) {
  const direct = text.match(/(?:npc|agent|number)\s*(\d+)/i)
  return direct?.[1] ? Number(direct[1]) : null
}

function pickShortcode(text: string) {
  return text.match(/(?:shortcode|window|code)\s+\[?([A-Za-z0-9_-]+)\]?/i)?.[1] || text.match(/\[([A-Za-z0-9_-]+)\]/)?.[1] || null
}

function pickNpcName(text: string) {
  const match = text.match(/(?:create|add|make|new)\s+(?:a\s+)?(?:new\s+)?(?:npc|agent|avatar)\s+(?:named|called)?\s*([^,]+?)(?:\s+with\s+shortcode|\s+using\s+shortcode|\s+for\s+shortcode|$)/i)
  return (match?.[1] || "Voice NPC").replace(/\bwith\b.*$/i, "").trim()
}

export function parseVoiceCommandIntent(input: string): ParsedVoiceCommand {
  const raw = String(input || "").trim()
  const text = raw.toLowerCase()
  const npcId = pickNpcId(raw)
  const shortcode = pickShortcode(raw)

  const result = (action: VoiceCommandAction, confidence: number, feedback: string, params: Record<string, string | number | boolean | null> = {}): ParsedVoiceCommand => ({
    ok: action !== "unknown",
    action,
    raw,
    confidence,
    params,
    safeToRun: true,
    feedback,
  })

  if (!raw) return result("unknown", 0, "No command heard", {})
  if (/brand|bsp app|brand gpt|pin brand/.test(text)) return result("open_window", 0.95, "Open pinned Brand GPT", { shortcode: "bsp_app" })
  if (/close|exit|hide window|x window/.test(text)) return result("close_window", 0.9, "Close active shortcode window")
  if (/next/.test(text) && /window|shortcode|app|panel/.test(text)) return result("window_next", 0.9, "Open next shortcode window")
  if (/previous|back|last/.test(text) && /window|shortcode|app|panel/.test(text)) return result("window_previous", 0.9, "Open previous shortcode window")
  if (/wide|fullscreen|full screen|maximize|bigger/.test(text)) return result("window_wide", 0.88, "Make shortcode window wide")
  if (/(?:create|add|make|new)\b.*\b(?:npc|agent|avatar)\b/.test(text)) return result("create_npc", 0.92, "Create voice NPC", { name: pickNpcName(raw), shortcode })
  if (/come here|come to me|summon|bring|follow me|stay with me|walk with me/.test(text)) return result("summon_npc", 0.88, "Summon NPC to camera", { npcId, follow: /follow me|stay with me|walk with me/.test(text) })
  if (/move|send|walk/.test(text) && /npc|agent|project room|stage|left|right|forward|back/.test(text)) return result("move_npc", 0.84, "Move NPC to target", { npcId, direction: text.match(/left|right|forward|back|project room|stage/)?.[0] || "forward" })
  if (/dance|dancing|celebrate/.test(text)) return result("dance_npc", 0.86, "Dance NPCs", { npcId, all: /all|everybody|everyone/.test(text) })
  if (/patrol|guard route|walk route/.test(text)) return result("patrol_npcs", 0.86, "Start NPC patrol routing")
  if (/freeze|stop all npc|hold position/.test(text)) return result("freeze_npcs", 0.86, "Freeze NPCs in place")
  if (/import|load|bring in/.test(text) && /team|npc/.test(text)) return result("import_team", 0.88, "Import team preset", { size: text.includes("100") ? 100 : text.includes("50") ? 50 : 25 })
  if (/add|create|build|spawn/.test(text) && /(tower|skybridge|bridge|command pod|voice stage|api core|path node|yuka|project room|habit board|task kanban|voice router|project board|voice gate|automation lab|client portal|media studio|calendar room)/.test(text)) return result("add_city_feature", 0.9, "Add city feature", { feature: text.match(/automation lab|client portal|media studio|calendar room|project board|voice gate|skybridge|command pod|voice stage|api core|path node|habit board|task kanban|voice router|project room|tower|yuka/)?.[0] || "tower" })
  if (/open project|show project|project manager|daily todo|daily to do|checklist|habit tracker/.test(text) && !/add|create|import|complete|finish/.test(text)) return result("project_open", 0.88, "Open project manager")
  if (/^(add|create|make)\s+.*(task|todo|to do|checklist item)/.test(text)) return result("project_task_add", 0.84, "Add project task", { title: raw.replace(/^(add|create|make)\s+(a\s+)?(new\s+)?(daily\s+)?(to do|todo|task|checklist item)\s*/i, "").trim() })
  if (/(complete|finish|check off|done)\s+(task|todo|item)?\s*\d*/.test(text)) return result("project_task_complete", 0.82, "Complete project task", { index: Number(text.match(/\d+/)?.[0] || 1) })
  if (/export|download|save/.test(text) && /(project|board|tasks|habits|notes)/.test(text)) return result("project_export", 0.86, "Export project board")
  if (/dictation mode|start dictation|live dictation|dictate mode/.test(text)) return result("dictation_start", 0.9, "Start dictation mode")
  if (/command mode|stop dictation|voice command mode/.test(text)) return result("dictation_stop", 0.9, "Return to command mode")
  if (/^(take note|dictate|note to self|write down)/.test(text)) return result("dictation_note", 0.82, "Save dictated note", { note: raw.replace(/^(take note|dictate|note to self|write down)\s*/i, "") })
  if (/refresh|reload/.test(text) && /wordpress|api|shortcode|window/.test(text)) return result("wp_refresh", 0.8, "Refresh WordPress API")
  if (/npm|pnpm|terminal|command/.test(text)) return result("local_diagnostic", 0.75, "Run safe local diagnostic", { script: /feature/.test(text) ? "wp:features" : /suite/.test(text) ? "wp:suite" : /window/.test(text) ? "wp:windows" : /health|diagnostic/.test(text) ? "wp:diagnostics" : "wp:ping" })

  return result("unknown", 0.2, "No exact command match", {})
}
