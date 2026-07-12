"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { PointerLockControls } from "three-stdlib"
import { Gallery } from "./gallery"
import { InfoCard } from "./info-card"
import { useMovement } from "@/hooks/use-movement"
import { IframeMenu } from "./iframe-menu"
import { type NPCData, NPCManager, type GestureType, GESTURE_TYPES } from "./npc"
import { buildLevelFeatures, ROOM_DESTINATIONS, PORTAL_DESTINATIONS, PORTAL_TRIGGER_RADIUS } from "./level-features"
import { buildCityDistrict, OUTDOOR_SPOTS } from "./city-district"
import { NpcDirectoryEditor } from "./npc-directory-editor"
import { MiniMapPro } from "./mini-map-pro"
import { VirtualCursor } from "./virtual-cursor"
import { UiSettingsPanel, type UiPrefs, DEFAULT_UI_PREFS, loadUiPrefs, saveUiPrefs } from "./ui-settings"
import { toast } from "react-hot-toast"
import { Joystick, RotationJoystick } from "./joystick"
import { NPCControls } from "./npc-controls"
import { X, Database, RefreshCw, ChevronLeft, ChevronRight, Maximize2, Minimize2, Mic, MicOff, Bot, Terminal, Sparkles, PlusCircle, Users, Map, Wand2, PanelRightClose, PanelRightOpen, Download, Building2, ClipboardList, CheckSquare2, ListTodo, Radio, Volume2, MessageSquareText, CalendarCheck, Target } from "lucide-react"
// Add these imports at the top of the file
import { preloadModels, AVAILABLE_MODELS } from "./preload-models"
import { preloadAnimations } from "./animation-manager"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass"
import { ExhibitHoverEffect } from "./exhibit-hover-effect"
import { ExhibitTooltip } from "./exhibit-tooltip"
import { InteriorWalls } from "./interior-walls"
import { FlyingModeControl } from "./flying-mode-control"
import { DebugOverlay } from "./debug-overlay"
// Add these imports at the top of the file
import { GamepadController } from "./gamepad-controller"
// Add this import at the top of the file
import { ControllerStatus } from "./controller-status"
import { OfficeBuilding, FLOOR_HEIGHT, TOTAL_FLOORS, ROOFTOP_FLOOR } from "./office-building"
import { LIVE_SHORTCODE_WINDOWS, PINNED_BRAND_WINDOW, type LiveShortcodeWindow } from "@/lib/wp-shortcodes"

// Add this function to handle model loading errors
const handleModelLoadingError = (error: any, modelName: string) => {
  console.error(`Error loading model ${modelName}:`, error)
  toast.error(`Failed to load model ${modelName}. Using fallback.`)
}

// Add table positions array - Extended to 30 positions
const TABLE_POSITIONS = [
  { position: [15, 0, 15], rotation: [0, -Math.PI / 4, 0] },
  { position: [15, 0, 5], rotation: [0, -Math.PI / 4, 0] },
  { position: [15, 0, -5], rotation: [0, -Math.PI / 4, 0] },
  { position: [15, 0, -15], rotation: [0, -Math.PI / 4, 0] },
  { position: [-15, 0, 15], rotation: [0, Math.PI / 4, 0] },
  { position: [-15, 0, 5], rotation: [0, Math.PI / 4, 0] },
  { position: [-15, 0, -5], rotation: [0, Math.PI / 4, 0] },
  { position: [-15, 0, -15], rotation: [0, Math.PI / 4, 0] },
  { position: [0, 0, 20], rotation: [0, 0, 0] },
  { position: [0, 0, -20], rotation: [0, Math.PI, 0] },
  // Additional 20 positions for 30 NPCs
  { position: [20, 0, 10], rotation: [0, -Math.PI / 4, 0] },
  { position: [20, 0, 0], rotation: [0, -Math.PI / 4, 0] },
  { position: [20, 0, -10], rotation: [0, -Math.PI / 4, 0] },
  { position: [-20, 0, 10], rotation: [0, Math.PI / 4, 0] },
  { position: [-20, 0, 0], rotation: [0, Math.PI / 4, 0] },
  { position: [-20, 0, -10], rotation: [0, Math.PI / 4, 0] },
  { position: [10, 0, 20], rotation: [0, 0, 0] },
  { position: [-10, 0, 20], rotation: [0, 0, 0] },
  { position: [10, 0, -20], rotation: [0, Math.PI, 0] },
  { position: [-10, 0, -20], rotation: [0, Math.PI, 0] },
  { position: [22, 0, 15], rotation: [0, -Math.PI / 4, 0] },
  { position: [22, 0, -15], rotation: [0, -Math.PI / 4, 0] },
  { position: [-22, 0, 15], rotation: [0, Math.PI / 4, 0] },
  { position: [-22, 0, -15], rotation: [0, Math.PI / 4, 0] },
  { position: [5, 0, 22], rotation: [0, 0, 0] },
  { position: [-5, 0, 22], rotation: [0, 0, 0] },
  { position: [5, 0, -22], rotation: [0, Math.PI, 0] },
  { position: [-5, 0, -22], rotation: [0, Math.PI, 0] },
  { position: [18, 0, 18], rotation: [0, -Math.PI / 4, 0] },
  { position: [-18, 0, 18], rotation: [0, Math.PI / 4, 0] },
]

const getFloorBaseY = (floor: number) => Math.max(0, Math.min(floor, ROOFTOP_FLOOR) * FLOOR_HEIGHT)

// NPC Data - exact 68-agent roster mapped to live WordPress shortcode windows and dashboard links.
// Uses real shortcodes when supplied; agents without shortcodes open their primary WordPress dashboard link.
const WORDPRESS_SHORTCODE_RENDER_BASE = "https://entremotivator.com/v0map-npc-gallery/"
const LOCAL_SHORTCODE_WINDOWS = LIVE_SHORTCODE_WINDOWS

const shortcodeRenderUrl = (tag: string, shortcode?: string) => {
  if (!tag) return WORDPRESS_SHORTCODE_RENDER_BASE
  const query = new URLSearchParams({
    v0map_shortcode_tag: tag,
    v0map_embed: "1",
    v0map_full_assets: "1",
  })
  const trimmedShortcode = (shortcode || "").trim()
  if (trimmedShortcode && trimmedShortcode !== `[${tag}]`) {
    query.set("v0map_shortcode", trimmedShortcode)
  }
  return `${WORDPRESS_SHORTCODE_RENDER_BASE}?${query.toString()}`
}

const agentFallbackUrl = (item?: Pick<LiveShortcodeWindow, "tag" | "primaryLink" | "shortcode">) => {
  if (!item) return WORDPRESS_SHORTCODE_RENDER_BASE
  return item.shortcode && item.tag ? shortcodeRenderUrl(item.tag, item.shortcode) : (item.primaryLink || WORDPRESS_SHORTCODE_RENDER_BASE)
}

const shortcodeWindowForIndex = (index: number) =>
  LOCAL_SHORTCODE_WINDOWS[index % Math.max(LOCAL_SHORTCODE_WINDOWS.length, 1)]

const shortcodeWindowForNpc = (npc: Pick<NPCData, "id" | "name">) =>
  shortcodeWindowForIndex(Math.max(0, npc.id - 1))

const getNpcShortcodeTag = (npc: Pick<NPCData, "id" | "name">) =>
  shortcodeWindowForNpc(npc)?.tag ||
  npc.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

const applyShortcodeRosterToNpc = (npc: NPCData, index: number): NPCData => {
  const windowItem = shortcodeWindowForIndex(index)
  const hasRealShortcode = Boolean(windowItem?.shortcode || (windowItem?.tabs?.length || 0) > 0)
  const tag = hasRealShortcode ? (windowItem?.tag || getNpcShortcodeTag(npc)) : ""
  const shortcode = hasRealShortcode ? (windowItem?.shortcode || (tag ? `[${tag}]` : "")) : ""
  const wordpressUrl = hasRealShortcode ? shortcodeRenderUrl(tag, shortcode) : agentFallbackUrl(windowItem)

  return {
    ...npc,
    name: windowItem?.title || npc.name,
    team: windowItem?.team || npc.team || "WordPress Agents",
    role: windowItem?.windowType === "link" ? "Dashboard Link Agent" : "Shortcode Dashboard Agent",
    shortcodeTag: tag,
    shortcode,
    wordpressUrl,
    liveUrl: wordpressUrl,
    streamlitUrl: wordpressUrl,
    features: ["Wide/fullscreen window", "Shortcode tabs", "Come here", "Dance", "Floor routing", "Voice open"],
    commands: [
      `${windowItem?.title || npc.name} come here`,
      `open ${windowItem?.title || npc.name}`,
      `wide screen`,
      `go floor ${(index % TOTAL_FLOORS) + 1}`,
    ],
    dialogue: [
      shortcode ? `Live WordPress shortcode: ${shortcode}` : `Live WordPress dashboard link: ${windowItem?.primaryLink || "pending"}`,
      windowItem?.tabs?.length ? `This agent has ${windowItem.tabs.length} shortcode tabs inside one window.` : "This NPC opens one live WordPress window at a time.",
      "Say my name, say come here, or open my dashboard window in wide mode.",
    ],
  }
}

const attachNpcShortcodeWindow = (npc: NPCData): NPCData => {
  const windowItem = shortcodeWindowForNpc(npc)
  const shortcodeTag = npc.shortcodeTag || windowItem?.tag || getNpcShortcodeTag(npc)
  const shortcode = npc.shortcode || windowItem?.shortcode || (shortcodeTag ? `[${shortcodeTag}]` : "")
  const wordpressUrl = npc.wordpressUrl || agentFallbackUrl(windowItem)

  return {
    ...npc,
    shortcodeTag,
    shortcode,
    wordpressUrl,
    liveUrl: wordpressUrl,
    streamlitUrl: wordpressUrl,
  }
}

const DEFAULT_NPC_DATA: NPCData[] = LIVE_SHORTCODE_WINDOWS.map((item, index) => {
  const floorIndex = index % TOTAL_FLOORS
  const floorY = getFloorBaseY(floorIndex) + 1
  const ring = Math.floor(index / TOTAL_FLOORS)
  const angle = ((index % 16) / 16) * Math.PI * 2
  const radius = 8 + (ring % 5) * 4
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const targetAngle = angle + 0.55
  return {
    id: index + 1,
    name: item.title,
    model: ["professor", "scientist", "guide", "engineer", "analyst", "philosopher", "designer", "linguist", "gamer", "futurist"][index % 10],
    color: ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#9C27B0", "#FF9800", "#E91E63", "#00BCD4", "#8BC34A", "#3F51B5"][index % 10],
    streamlitUrl: agentFallbackUrl(item),
    shortcodeTag: item.shortcode ? item.tag : "",
    shortcode: item.shortcode,
    wordpressUrl: agentFallbackUrl(item),
    liveUrl: agentFallbackUrl(item),
    position: new THREE.Vector3(x, floorY, z),
    targetPosition: new THREE.Vector3(Math.cos(targetAngle) * (radius + 2), floorY, Math.sin(targetAngle) * (radius + 2)),
    speed: 0.36 + (index % 6) * 0.035,
    rotationSpeed: 1.35 + (index % 5) * 0.12,
    interactionRadius: 6,
    dialogue: [
      item.shortcode ? `I open ${item.shortcode} live from WordPress.` : `I open my WordPress dashboard link live: ${item.primaryLink || "pending"}.`,
      item.tabs?.length ? `I have ${item.tabs.length} tabs in my window.` : "I open as one live app window.",
      "Use Next, X Close, Wide, Full, or voice commands to control me.",
    ],
    tablePosition: new THREE.Vector3(x, getFloorBaseY(floorIndex), z),
    team: item.team,
    role: item.windowType === "link" ? "Link Dashboard Agent" : "Shortcode Agent",
    skills: [item.category || item.team, item.windowType || "shortcode", "WordPress API"].filter(Boolean) as string[],
    features: ["live-wordpress", "fullscreen-window", "voice-command", "floor-routing"],
    commands: [`open ${item.title}`, `${item.title} come here`, `NPC ${index + 1} come here`],
    floor: floorIndex,
    status: "Ready",
  }
})

const DEFAULT_NPC_COUNT = DEFAULT_NPC_DATA.length

const NPC_TEAM_PRESETS = [
  { name: "Leadership", ids: [1, 5, 9, 13, 23], skills: ["strategy", "funding", "launch"] },
  { name: "Growth", ids: [2, 4, 11, 12, 14, 16, 21, 22], skills: ["content", "sales", "web"] },
  { name: "Operations", ids: [7, 10, 15, 18, 20, 24], skills: ["metrics", "health", "booking"] },
  { name: "Support", ids: [3, 6, 8, 17, 19], skills: ["coaching", "research", "voice"] },
]

const getNPCFeatureProfile = (npc: NPCData, index: number) => {
  const team = NPC_TEAM_PRESETS.find((preset) => preset.ids.includes(npc.id)) || NPC_TEAM_PRESETS[index % NPC_TEAM_PRESETS.length]
  const roleFromName = npc.name.replace(/^Agent\s+/i, "").replace(/\s+Agent$/i, "")

  return {
    team: team.name,
    role: roleFromName || "AI Specialist",
    skills: team.skills,
    floor: index < 8 ? 0 : index < 16 ? 1 : 2,
    status: "Roaming",
  }
}

const addNPCFeatures = (npcs: NPCData[]): NPCData[] =>
  npcs.map((npc, index) => {
    const profile = getNPCFeatureProfile(npc, index)
    return {
      ...npc,
      team: npc.team || profile.team,
      role: npc.role || profile.role,
      skills: npc.skills || profile.skills,
      floor: typeof npc.floor === "number" ? npc.floor : profile.floor,
      status: npc.status || profile.status,
    }
  })

// Function to replace all NPCs with GLB models
const replaceAllNPCsWithGLBModels = (npcs: NPCData[]): NPCData[] => {
  // Make a copy of the NPCs array
  const updatedNPCs = [...npcs]

  // Replace all NPCs with GLB models
  for (let i = 0; i < updatedNPCs.length; i++) {
    // Use the corresponding model from AVAILABLE_MODELS
    // If we have more NPCs than models, cycle through the models
    const modelIndex = i % AVAILABLE_MODELS.length

    // Store the original color for fallback
    const originalColor = updatedNPCs[i].color

    updatedNPCs[i] = {
      ...updatedNPCs[i],
      model: "glb",
      glbUrl: AVAILABLE_MODELS[modelIndex].url,
      // Keep the original color for fallback
      color: originalColor,
    }
  }

  return updatedNPCs
}

// ── v28.6: outdoor city citizens ─────────────────────────────────────────────
// New NPCs that live OUTSIDE the building in the expanded city district: they
// wander the fountain plaza, promenades, central park, market street, and
// downtown crossing. IDs start at 9001 so they never collide with roster or
// custom/imported NPC IDs. All existing indoor NPCs are untouched.
const OUTDOOR_CITIZEN_SEEDS = [
  { name: "Plaza Greeter Maya", role: "City Greeter", spot: 0, lines: ["Welcome to V0Map City! The fountain plaza is my favorite spot.", "The tower entrance is right behind me — walk through the front doors.", "Say 'go to central park' and the city takes you there."] },
  { name: "Street Musician Rico", role: "Street Performer", spot: 0, lines: ["I play by the fountain every day.", "The acoustics between these towers are unreal.", "Tips accepted in good vibes only."] },
  { name: "Tour Guide Zola", role: "City Tour Guide", spot: 1, lines: ["North Plaza tour starts here — see the brand towers light up.", "ATM Agency Tower and EntreMotivator HQ anchor the skyline.", "Ask me about Market Street or Downtown Crossing."] },
  { name: "Courier Dash", role: "City Courier", spot: 1, lines: ["Packages don't deliver themselves!", "Fastest route downtown is straight up this promenade.", "I know every crosswalk in this city."] },
  { name: "Barista Remy", role: "Cart Barista", spot: 2, lines: ["Fresh espresso on the East Promenade!", "The indoor Cafe Corner is great too, but I get the sunshine.", "One oat latte, coming right up."] },
  { name: "Skater Theo", role: "Plaza Skater", spot: 2, lines: ["This plaza is the smoothest concrete in the city.", "Watch this line — fountain gap to the promenade!", "The night lights here are epic."] },
  { name: "Photographer Lux", role: "City Photographer", spot: 3, lines: ["The West Promenade has the best golden-hour skyline shots.", "I'm shooting the billboard reflections today.", "Want a portrait with the tower behind you?"] },
  { name: "City Planner Omar", role: "Urban Planner", spot: 3, lines: ["Every block here was laid out on a clean road grid.", "We kept the plaza open so the tower can breathe.", "Next phase: a skyline monorail. Maybe v29."] },
  { name: "Park Ranger Cole", role: "Park Ranger", spot: 4, lines: ["Central Park has eighteen trees and one very calm pond.", "Benches are on the north lawn if you need a break.", "Please don't feed the procedural ducks."] },
  { name: "Picnic Host Nia", role: "Community Host", spot: 4, lines: ["We host EntreMotivator community picnics right here.", "The pond view beats any conference room.", "Grab a bench — the wifi somehow reaches out here."] },
  { name: "Market Vendor Ivy", role: "Market Vendor", spot: 5, lines: ["Six stalls, all local, all colorful — welcome to Market Street!", "The amber canopy is mine. Best produce in the city.", "Voice tip: say 'go to market street' from anywhere."] },
  { name: "Food Cart Chef Nina", role: "Street Chef", spot: 5, lines: ["Today's special: skyline tacos.", "The lunch rush from the tower keeps me busy.", "Market Street never sleeps... well, it's procedural, so literally never."] },
  { name: "News Anchor Ava", role: "City Reporter", spot: 6, lines: ["Reporting live from Downtown Crossing!", "Breaking: the city just got a whole lot bigger.", "Six brand towers, forty-plus buildings, and counting."] },
  { name: "Night Runner Kai", role: "City Jogger", spot: 6, lines: ["Downtown loop is exactly my cardio route.", "The tower beacons make great pace markers.", "Race you to the city gate!"] },
]

const CITIZEN_COLORS = ["#22d3ee", "#f472b6", "#fbbf24", "#4ade80", "#818cf8", "#fb7185", "#38bdf8", "#a3e635", "#f59e0b", "#c084fc", "#34d399", "#f87171", "#60a5fa", "#facc15"]

const createOutdoorCitizenNPCs = (): NPCData[] =>
  OUTDOOR_CITIZEN_SEEDS.map((seed, index) => {
    const spot = OUTDOOR_SPOTS[seed.spot % OUTDOOR_SPOTS.length]
    const angle = (index / OUTDOOR_CITIZEN_SEEDS.length) * Math.PI * 2
    const radius = 5 + (index % 4) * 3
    const x = spot.x + Math.cos(angle) * radius
    const z = spot.z + Math.sin(angle) * radius
    return {
      id: 9001 + index,
      name: seed.name,
      model: "glb",
      glbUrl: AVAILABLE_MODELS[(index + 3) % AVAILABLE_MODELS.length].url,
      color: CITIZEN_COLORS[index % CITIZEN_COLORS.length],
      streamlitUrl: "https://entremotivator.com/",
      liveUrl: "https://entremotivator.com/",
      wordpressUrl: "https://entremotivator.com/",
      shortcodeTag: "",
      position: new THREE.Vector3(x, 1, z),
      targetPosition: new THREE.Vector3(spot.x + Math.cos(angle + 0.9) * (radius + 4), 1, spot.z + Math.sin(angle + 0.9) * (radius + 4)),
      speed: 0.34 + (index % 5) * 0.04,
      rotationSpeed: 1.3 + (index % 4) * 0.15,
      interactionRadius: 6,
      dialogue: seed.lines,
      tablePosition: new THREE.Vector3(x, 0, z),
      team: "City",
      role: seed.role,
      skills: ["city-life", spot.label.toLowerCase(), "outdoor"],
      features: ["outdoor", "city-district", "voice-command"],
      commands: [`${seed.name} come here`, `NPC ${9001 + index} wave`],
      bio: `${seed.role} who lives outdoors at ${spot.label} in the expanded V0Map city district.`,
      floor: 0,
      status: "Outdoors",
      outdoor: true,
      homeCenter: { x: spot.x, z: spot.z },
      wanderRange: spot.range,
    }
  })

const createDefaultNPCs = () => [
  ...replaceAllNPCsWithGLBModels(addNPCFeatures(DEFAULT_NPC_DATA.map(applyShortcodeRosterToNpc).map(attachNpcShortcodeWindow))),
  ...createOutdoorCitizenNPCs(),
]


type DynamicCityFeature = {
  id: string
  kind: "tower" | "skybridge" | "command-pod" | "voice-stage" | "api-core" | "path-node" | "project-room" | "habit-board" | "task-kanban" | "voice-router" | "project-board" | "voice-gate" | "automation-lab" | "client-portal" | "media-studio" | "calendar-room"
  label: string
  position: { x: number; y: number; z: number }
  color: number
  createdBy: "voice" | "button" | "import"
}

const CITY_FEATURE_BLUEPRINTS: Record<DynamicCityFeature["kind"], { label: string; color: number; scale: [number, number, number] }> = {
  tower: { label: "AI Tower", color: 0x4f46e5, scale: [3.5, 12, 3.5] },
  skybridge: { label: "Skybridge", color: 0x0ea5e9, scale: [18, 1, 3] },
  "command-pod": { label: "Command Pod", color: 0x22c55e, scale: [6, 3, 6] },
  "voice-stage": { label: "Voice Stage", color: 0xf97316, scale: [8, 1.2, 8] },
  "api-core": { label: "WordPress API Core", color: 0xec4899, scale: [5, 5, 5] },
  "path-node": { label: "Yuka Path Node", color: 0xfacc15, scale: [2, 2, 2] },
  "project-room": { label: "Project Management Room", color: 0x14b8a6, scale: [12, 4, 10] },
  "habit-board": { label: "Habit Tracker Board", color: 0x84cc16, scale: [10, 3, 1] },
  "task-kanban": { label: "Daily Task Kanban", color: 0xf59e0b, scale: [11, 3.2, 1] },
  "voice-router": { label: "Realtime Voice Router", color: 0x8b5cf6, scale: [4, 6, 4] },
  "project-board": { label: "Project Board Wall", color: 0x06b6d4, scale: [12, 4, 1.2] },
  "voice-gate": { label: "Voice Command Gate", color: 0xa855f7, scale: [7, 5, 2] },
  "automation-lab": { label: "Automation Lab", color: 0x22c55e, scale: [14, 5, 10] },
  "client-portal": { label: "Client Portal Room", color: 0xf43f5e, scale: [12, 4.5, 9] },
  "media-studio": { label: "Media Studio", color: 0xf97316, scale: [13, 4.5, 9] },
  "calendar-room": { label: "Calendar Command Room", color: 0x38bdf8, scale: [11, 4, 8] },
}

const TEAM_TEMPLATE_FILES = [
  { label: "25 NPC Team", size: 25, file: "/npc-team-25.import.json" },
  { label: "50 NPC Team", size: 50, file: "/npc-team-50.import.json" },
  { label: "100 NPC Team", size: 100, file: "/npc-team-100.import.json" },
]

type ProjectTask = {
  id: string
  title: string
  status: "todo" | "doing" | "done"
  priority: "low" | "normal" | "high"
  source: "voice" | "manual" | "import"
}

type HabitItem = {
  id: string
  name: string
  streak: number
  target: number
  doneToday: boolean
  source: "voice" | "manual" | "import"
}

type DictationNote = {
  id: string
  text: string
  createdAt: string
  source: "dictation" | "command"
}

type VoiceCommandHistoryItem = {
  id: string
  text: string
  mode: "command" | "dictation"
  action: string
  createdAt: string
}

const DEFAULT_PROJECT_TASKS: ProjectTask[] = [
  { id: "task-api-connection", title: "Confirm WordPress REST ping and shortcode window route", status: "todo", priority: "high", source: "import" },
  { id: "task-brand-window", title: "Open Brand GPT [bsp_app] and confirm styled iframe loads", status: "todo", priority: "high", source: "import" },
  { id: "task-npc-voice", title: "Test voice command: NPC 1 come here", status: "todo", priority: "normal", source: "import" },
  { id: "task-team-import", title: "Import 25/50/100 NPC team and verify assignments", status: "todo", priority: "normal", source: "import" },
  { id: "task-realtime-dictation", title: "Use live dictation to create one project note", status: "todo", priority: "normal", source: "import" },
  { id: "task-city-builder", title: "Add project board, automation lab, and voice gate to the 3D city", status: "todo", priority: "normal", source: "import" },
  { id: "task-npc-follow", title: "Test NPC follow me, patrol route, and freeze all movement commands", status: "todo", priority: "normal", source: "import" },
]

const DEFAULT_HABITS: HabitItem[] = [
  { id: "habit-api-check", name: "Daily WordPress API health check", streak: 0, target: 7, doneToday: false, source: "import" },
  { id: "habit-brand-gpt", name: "Open Brand GPT and review project pipeline", streak: 0, target: 7, doneToday: false, source: "import" },
  { id: "habit-voice-test", name: "Run one realtime voice NPC command", streak: 0, target: 7, doneToday: false, source: "import" },
  { id: "habit-dictation-note", name: "Dictate one project note", streak: 0, target: 7, doneToday: false, source: "import" },
  { id: "habit-city-feature", name: "Add one new voice-built city feature", streak: 0, target: 7, doneToday: false, source: "import" },
]

const PROJECT_IMPORT_FILES = [
  { label: "Project board", file: "/project-management.import.json" },
  { label: "Habit tracker", file: "/habit-tracker.import.json" },
]

const CITY_VOICE_COMMANDS = [
  "Brand GPT",
  "open NPC directory",
  "go to the lobby",
  "take me to the boardroom",
  "go to the arcade",
  "go to the rooftop garden",
  "NPC 3 wave",
  "cheer all",
  "everyone salute",
  "NPC 5 point",
  "circle up",
  "grid formation",
  "orbit me",
  "patrol the floor",
  "figure eight",
  "guard the rooms",
  "floor tour",
  "conga line",
  "stadium wave",
  "flash mob",
  "call a meeting",
  "go to the war room",
  "go to the sky bar",
  "go to the library",
  "go to the music stage",
  "freeze all NPCs",
  "unfreeze",
  "stop routes",
  "portal 3001",
  "open port 3003",
  "create NPC named Revenue Coach",
  "create NPC named Mission Guide with shortcode aisc_missions",
  "NPC 7 come here",
  "agent workflow chat come here",
  "dance all",
  "walk realistic",
  "scatter NPCs",
  "gather team",
  "send leadership to floor 2",
  "import team 25",
  "import team 50",
  "import team 100",
  "add AI tower",
  "add command pod",
  "add voice stage",
  "add skybridge",
  "add WordPress API core",
  "add Yuka path node",
  "add project room",
  "add habit board",
  "add task kanban",
  "open project manager",
  "add task test WordPress API",
  "complete task 1",
  "import habit tracker",
  "dictation mode",
  "command mode",
  "take note review Brand GPT styling",
  "move NPC 2 left",
  "move NPC 4 forward",
  "send NPC 5 to project room",
  "NPC 2 follow me",
  "NPC 3 patrol route",
  "freeze all NPCs",
  "add project board",
  "add voice gate",
  "add automation lab",
  "add client portal",
  "add media studio",
  "add calendar room",
  "export project board",
  "wide screen",
  "close window",
  "refresh WordPress API",
]

const toTitleCaseFromTag = (value: string) =>
  value
    .replace(/[\[\]]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const parseNpcNameFromVoice = (command: string) => {
  const match = command.match(/(?:create|add|make|new)\s+(?:a\s+)?(?:new\s+)?(?:npc|agent|avatar)\s+(?:named|called)?\s*([^,]+?)(?:\s+with\s+shortcode|\s+using\s+shortcode|\s+for\s+shortcode|$)/i)
  return (match?.[1] || "Voice NPC").replace(/\bwith\b.*$/i, "").trim()
}

const parseShortcodeTagFromVoice = (command: string, fallbackIndex = 0) => {
  const allowedTags = new Set(LIVE_SHORTCODE_WINDOWS.flatMap((windowItem) => windowItem.tabs?.map((tab) => tab.tag) || [windowItem.tag]).filter(Boolean))
  const explicit = command.match(/(?:shortcode|code|window)\s+\[?([A-Za-z0-9_-]+)\]?/i)?.[1]
  if (explicit && allowedTags.has(explicit)) return explicit
  const bracket = command.match(/\[([A-Za-z0-9_-]+)\]/)?.[1]
  if (bracket && allowedTags.has(bracket)) return bracket
  const matched = LIVE_SHORTCODE_WINDOWS.find((windowItem) => {
    const titleHit = command.toLowerCase().includes(windowItem.title.toLowerCase())
    const tagHit = windowItem.tag ? command.toLowerCase().includes(windowItem.tag.toLowerCase()) : false
    const tabHit = windowItem.tabs?.some((tab) => command.toLowerCase().includes(tab.tag.toLowerCase()))
    return titleHit || tagHit || tabHit
  })
  return matched?.tag || shortcodeWindowForIndex(fallbackIndex)?.tag || PINNED_BRAND_WINDOW.tag
}

const createRealisticSky = (scene: THREE.Scene) => {
  const skyGeometry = new THREE.SphereGeometry(480, 48, 24)
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x4aa3ff) },
      horizonColor: { value: new THREE.Color(0xd9f2ff) },
      sunsetColor: { value: new THREE.Color(0xffc27a) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 sunsetColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float skyMix = smoothstep(-0.08, 0.85, h);
        vec3 base = mix(horizonColor, topColor, skyMix);
        float sunset = smoothstep(0.05, 0.55, 1.0 - abs(normalize(vWorldPosition).x + 0.35));
        base = mix(base, sunsetColor, sunset * (1.0 - skyMix) * 0.35);
        gl_FragColor = vec4(base, 1.0);
      }
    `,
  })

  const sky = new THREE.Mesh(skyGeometry, skyMaterial)
  sky.name = "realistic-sky-dome"
  scene.add(sky)

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(9, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }),
  )
  sun.position.set(-140, 155, -220)
  sun.name = "sun"
  scene.add(sun)

  const cloudTexture = (() => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext("2d")
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 64, 10, 128, 64, 120)
      gradient.addColorStop(0, "rgba(255,255,255,0.82)")
      gradient.addColorStop(0.45, "rgba(255,255,255,0.58)")
      gradient.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(88, 70, 58, 25, 0, 0, Math.PI * 2)
      ctx.ellipse(130, 55, 65, 32, 0, 0, Math.PI * 2)
      ctx.ellipse(178, 70, 56, 24, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  })()

  for (let i = 0; i < 18; i++) {
    const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, opacity: 0.42 }))
    const angle = (i / 18) * Math.PI * 2
    const radius = 150 + (i % 4) * 34
    cloud.position.set(Math.cos(angle) * radius, 95 + (i % 5) * 8, Math.sin(angle) * radius)
    cloud.scale.set(58 + (i % 3) * 18, 24 + (i % 2) * 10, 1)
    cloud.name = "sky-cloud"
    scene.add(cloud)
  }
}

// Exact agent wall displays - tied to the 68-agent roster, shortcode tabs, and dashboard link fallbacks.
const GALLERY_ITEMS = LIVE_SHORTCODE_WINDOWS.slice(0, 36).map((item, index) => {
  const floor = index % TOTAL_FLOORS
  const row = Math.floor(index / 6)
  const col = index % 6
  const side = row % 4
  const offset = (col - 2.5) * 8
  const floorY = getFloorBaseY(floor) + 3
  const base = { x: 0, y: floorY, z: 0 }
  const position =
    side === 0
      ? { x: offset, y: floorY, z: -29 }
      : side === 1
        ? { x: 29, y: floorY, z: offset }
        : side === 2
          ? { x: -offset, y: floorY, z: 29 }
          : { x: -29, y: floorY, z: -offset }
  const rotation =
    side === 0
      ? { x: 0, y: 0, z: 0 }
      : side === 1
        ? { x: 0, y: -Math.PI / 2, z: 0 }
        : side === 2
          ? { x: 0, y: Math.PI, z: 0 }
          : { x: 0, y: Math.PI / 2, z: 0 }

  return {
    title: `${item.agentNo || index + 1}. ${item.title}`,
    description: item.shortcode ? `${item.category || item.team} · ${item.tabs?.length || 1} shortcode tab(s)` : `${item.category || item.team} · dashboard link window`,
    streamlitUrl: agentFallbackUrl(item),
    imageUrl: index % 5 === 0 ? "/gallery-displays/agent-ceo.png" : index % 5 === 1 ? "/gallery-displays/agent-marketer.png" : index % 5 === 2 ? "/gallery-displays/agent-analyst.png" : index % 5 === 3 ? "/gallery-displays/agent-designer.png" : "/gallery-displays/agent-support.png",
    position,
    rotation,
    agentNo: item.agentNo,
    category: item.category,
  }
})

const LIVE_GALLERY_ITEMS = GALLERY_ITEMS.map((item, index) => {
  const windowItem = shortcodeWindowForIndex(index)
  const hasRealShortcode = Boolean(windowItem?.shortcode || (windowItem?.tabs?.length || 0) > 0)
  const shortcodeTag = hasRealShortcode ? (windowItem?.tag || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")) : ""
  const shortcode = hasRealShortcode ? (windowItem?.shortcode || (shortcodeTag ? `[${shortcodeTag}]` : "")) : ""
  const wordpressUrl = hasRealShortcode ? shortcodeRenderUrl(shortcodeTag, shortcode) : agentFallbackUrl(windowItem)
  return {
    ...item,
    title: windowItem?.title || item.title,
    description: hasRealShortcode
      ? `Live WordPress shortcode ${shortcode} pulled from entremotivator.com`
      : `Live WordPress dashboard link pulled from entremotivator.com`,
    shortcodeTag,
    shortcode,
    wordpressUrl,
    liveUrl: wordpressUrl,
    streamlitUrl: wordpressUrl,
  }
})

// Helper function to convert Vector3 objects to/from JSON
const serializeVector3 = (vector: THREE.Vector3) => {
  return { x: vector.x, y: vector.y, z: vector.z }
}

const deserializeVector3 = (obj: { x: number; y: number; z: number }) => {
  return new THREE.Vector3(obj.x, obj.y, obj.z)
}

// Helper function to serialize NPCData for localStorage
const serializeNPCData = (npc: NPCData) => {
  return {
    ...npc,
    position: serializeVector3(npc.position),
    targetPosition: serializeVector3(npc.targetPosition),
    tablePosition: npc.tablePosition ? serializeVector3(npc.tablePosition) : undefined,
  }
}

const deserializeNPCData = (data: any): NPCData => {
  return {
    ...data,
    position: deserializeVector3(data.position),
    targetPosition: deserializeVector3(data.targetPosition || data.position),
    tablePosition: data.tablePosition ? deserializeVector3(data.tablePosition) : undefined,
  }
}

// Define collision objects outside of the component
const collisionObjectsRef = { current: [] as THREE.Object3D[] }

type WordPressBridgeContext = {
  type?: string
  session?: string
  appUrl?: string
  worldUrl?: string
  site?: string
  domain?: string
  user?: string | number
  restBase?: string
  windowsUrl?: string
  bridgeToken?: string
  bridgeExpires?: string | number
  restNonce?: string
  authSync?: boolean
  npcSync?: boolean
  context?: {
    api?: {
      restBase?: string
      windowsUrl?: string
      token?: string
      expires?: number
      nonce?: string
      user?: number
    }
    pages?: Record<string, { title: string; url: string; shortcode: string }>
  }
}

type WordPressNpcWindow = {
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
  apiSource?: string
  postType?: string
  modified?: string
  agentNo?: number
  category?: string
  primaryLink?: string
  tabs?: Array<{ title: string; tag: string; shortcode: string; liveUrl?: string; source?: string; primaryLink?: string }>
  windowType?: "shortcode" | "link" | "hybrid" | "link-wrapper"
  shortcodeSource?: "provided" | "history" | "v0map-wrapper" | "none"
  isWrapper?: boolean
}

type WordPressApiFeatures = {
  ok?: boolean
  source?: string
  connection?: Record<string, any>
  metrics?: {
    npcWindows?: number
    approvedShortcodes?: number
    pages?: number
    posts?: number
    media?: number
    customPostTypes?: number
    menus?: number
    taxonomies?: number
    matchedShortcodes?: number
    missingShortcodes?: number
    registeredShortcodes?: number
    featureGroups?: number
    activePlugins?: number
    totalPlugins?: number
    apiRoutes?: number
    themeSupports?: number
    diagnosticReadinessScore?: number
  }
  site?: {
    url?: string
    name?: string
    description?: string
    language?: string
    timezone?: string
    adminUrl?: string
  }
  plugin?: {
    name?: string
    version?: string
    dashboardUrl?: string
    settings?: Record<string, any>
  }
  features?: {
    pages?: any[]
    posts?: any[]
    media?: any[]
    shortcodes?: any[]
    windows?: any[]
    currentUser?: any
    settings?: any
    types?: Record<string, any>
    postTypes?: any[] | Record<string, any>
    taxonomies?: any[] | Record<string, any>
    menus?: any[]
    dashboardPages?: Record<string, any>
    featureGroups?: any[]
    shortcodeProviders?: any[]
    customContent?: Record<string, any>
    theme?: Record<string, any>
    plugins?: any[]
    sidebars?: any[]
    comments?: any[]
    apiRoutes?: Record<string, any> | any[]
    health?: Record<string, any>
    diagnostics?: Record<string, any>
    commandCenter?: Record<string, any>
  }
}

const localWordPressWindowFromNpc = (npc: NPCData, index = npc.id - 1): WordPressNpcWindow => {
  const windowItem = shortcodeWindowForIndex(index)
  const hasRealShortcode = Boolean(npc.shortcode || windowItem?.shortcode || (windowItem?.tabs?.length || 0) > 0)
  const shortcodeTag = hasRealShortcode ? (npc.shortcodeTag || windowItem?.tag || getNpcShortcodeTag(npc)) : ""
  const shortcode = hasRealShortcode ? (npc.shortcode || windowItem?.shortcode || (shortcodeTag ? `[${shortcodeTag}]` : "")) : ""
  const pageUrl = shortcode ? shortcodeRenderUrl(shortcodeTag, shortcode) : (windowItem?.primaryLink || npc.wordpressUrl || WORDPRESS_SHORTCODE_RENDER_BASE)
  const tabs = hasRealShortcode ? (windowItem?.tabs || []).map((tab) => ({ ...tab, liveUrl: shortcodeRenderUrl(tab.tag, tab.shortcode) })) : []

  return {
    id: `npc-window-${npc.id}`,
    index,
    npcId: npc.id,
    title: npc.name,
    team: npc.team || windowItem?.team || "WordPress Dashboard",
    shortcode,
    tag: shortcodeTag,
    registered: Boolean(shortcode),
    html: "",
    pageUrl,
    pageEditUrl: "",
    editUrl: "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
    dashboardUrl: windowItem?.primaryLink || "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
    liveUrl: pageUrl,
    wordpressUrl: pageUrl,
    primaryLink: windowItem?.primaryLink,
    tabs,
    agentNo: windowItem?.agentNo,
    category: windowItem?.category,
    windowType: windowItem?.windowType,
    shortcodeSource: windowItem?.shortcodeSource,
    isWrapper: windowItem?.tag === "v0map_agent_dashboard" || windowItem?.windowType === "link-wrapper",
  }
}

const localPinnedBrandWindow = (): WordPressNpcWindow => {
  const pageUrl = shortcodeRenderUrl(PINNED_BRAND_WINDOW.tag, PINNED_BRAND_WINDOW.shortcode)
  return {
    id: "npc-window-pinned-brand-gpt",
    index: 0,
    npcId: PINNED_BRAND_WINDOW.agentNo || 58,
    title: PINNED_BRAND_WINDOW.title,
    team: PINNED_BRAND_WINDOW.team,
    shortcode: PINNED_BRAND_WINDOW.shortcode,
    tag: PINNED_BRAND_WINDOW.tag,
    registered: true,
    html: "",
    pageUrl,
    pageEditUrl: "",
    editUrl: "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
    dashboardUrl: PINNED_BRAND_WINDOW.primaryLink || "https://entremotivator.com/wp-admin/admin.php?page=v0map-npc-gallery",
    liveUrl: pageUrl,
    wordpressUrl: pageUrl,
    primaryLink: PINNED_BRAND_WINDOW.primaryLink,
    tabs: PINNED_BRAND_WINDOW.tabs?.map((tab) => ({ ...tab, liveUrl: shortcodeRenderUrl(tab.tag, tab.shortcode) })) || [],
    agentNo: PINNED_BRAND_WINDOW.agentNo,
    category: PINNED_BRAND_WINDOW.category,
    windowType: PINNED_BRAND_WINDOW.windowType,
  }
}

const wordpressFrameSrc = (windowItem: WordPressNpcWindow) => {
  if (windowItem.liveUrl || windowItem.wordpressUrl || windowItem.pageUrl) {
    return windowItem.liveUrl || windowItem.wordpressUrl || windowItem.pageUrl || ""
  }
  if (windowItem.shortcode && windowItem.tag) return shortcodeRenderUrl(windowItem.tag, windowItem.shortcode)
  if (windowItem.primaryLink) return windowItem.primaryLink
  return windowItem.dashboardUrl || WORDPRESS_SHORTCODE_RENDER_BASE
}

const isDashboardWrapperWindow = (windowItem?: Pick<WordPressNpcWindow, "tag" | "windowType" | "shortcodeSource"> | null) =>
  Boolean(windowItem && (windowItem.windowType === "link-wrapper" || windowItem.shortcodeSource === "v0map-wrapper" || windowItem.tag === "v0map_agent_dashboard"))

const windowCodeLabel = (windowItem?: Pick<WordPressNpcWindow, "tag" | "shortcode" | "windowType" | "shortcodeSource" | "primaryLink"> | null) => {
  if (!windowItem) return "WordPress window"
  if (isDashboardWrapperWindow(windowItem)) return "V0Map dashboard wrapper"
  if (windowItem.shortcode && windowItem.tag) return `[${windowItem.tag}]`
  if (windowItem.primaryLink) return "Dashboard link"
  return "WordPress window"
}

const asArray = <T = any,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === "object") {
    const record = value as Record<string, any>
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.data)) return record.data as T[]
    if (Array.isArray(record.results)) return record.results as T[]
    if (Array.isArray(record.menus)) return record.menus as T[]
    return Object.entries(record).map(([key, item]) =>
      item && typeof item === "object" ? ({ key, slug: key, ...(item as Record<string, any>) } as T) : ({ key, slug: key, value: item } as T),
    )
  }
  return []
}

const asObject = (value: unknown): Record<string, any> => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>
  return {}
}

const stableWpKey = (prefix: string, item: any, index: number) => {
  const raw =
    item?.stableKey ??
    item?.id ??
    item?.ID ??
    item?.wpId ??
    item?.databaseId ??
    item?.slug ??
    item?.key ??
    item?.file ??
    item?.link ??
    item?.sourceUrl ??
    item?.source_url ??
    item?.url ??
    item?.name ??
    item?.team ??
    item?.title?.rendered ??
    item?.title ??
    `fallback-${index}`

  return `${prefix}-${String(raw).replace(/[^a-zA-Z0-9_-]+/g, "_")}-${index}`
}

const withStableWpItems = <T = any,>(value: unknown, prefix: string): T[] =>
  asArray<any>(value).map((item: any, index: number) => {
    if (!item || typeof item !== "object") {
      return { value: item, stableKey: stableWpKey(prefix, { value: item }, index), id: `${prefix}-${index}` } as T
    }

    const normalized = { ...item }
    const fallbackId = normalized.id ?? normalized.ID ?? normalized.wpId ?? normalized.databaseId ?? normalized.slug ?? normalized.key

    return {
      ...normalized,
      id: fallbackId ?? `${prefix}-${index}`,
      stableKey: stableWpKey(prefix, normalized, index),
    } as T
  })

const normalizeWordPressFeaturePayload = (payload: any): WordPressApiFeatures => {
  const normalized: WordPressApiFeatures = payload && typeof payload === "object" ? { ...payload } : { ok: false, features: {} }
  const features = asObject(normalized.features)

  normalized.features = {
    ...features,
    pages: withStableWpItems(features.pages, "wp-page"),
    posts: withStableWpItems(features.posts, "wp-post"),
    media: withStableWpItems(features.media, "wp-media"),
    shortcodes: asArray(features.shortcodes),
    windows: asArray(features.windows),
    postTypes: withStableWpItems(features.postTypes || features.types, "wp-type"),
    taxonomies: withStableWpItems(features.taxonomies, "wp-taxonomy"),
    menus: withStableWpItems(features.menus, "wp-menu"),
    featureGroups: withStableWpItems(features.featureGroups, "wp-feature-group"),
    shortcodeProviders: withStableWpItems(features.shortcodeProviders, "wp-provider"),
    plugins: withStableWpItems(features.plugins, "wp-plugin"),
    sidebars: withStableWpItems(features.sidebars, "wp-sidebar"),
    comments: withStableWpItems(features.comments, "wp-comment"),
    dashboardPages: asObject(features.dashboardPages),
    customContent: asObject(features.customContent),
    theme: {
      ...asObject(features.theme),
      supports: asArray(asObject(features.theme).supports),
    },
    apiRoutes: features.apiRoutes || {},
    health: asObject(features.health),
    diagnostics: {
      ...asObject(features.diagnostics),
      matchedTags: asArray(asObject(features.diagnostics).matchedTags),
      missingTags: asArray(asObject(features.diagnostics).missingTags),
      repairHints: asArray(asObject(features.diagnostics).repairHints),
    },
    commandCenter: asObject(features.commandCenter),
  }

  return normalized
}

export default function VirtualGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<PointerLockControls | null>(null)
  const [selectedItem, setSelectedItem] = useState<(typeof LIVE_GALLERY_ITEMS)[0] | null>(null)
  const [selectedNPC, setSelectedNPC] = useState<NPCData | null>(null)
  const keysRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    KeyQ: false, // Rotate left
    KeyE: false, // Rotate right
    Space: false, // Added for flying up
    ShiftLeft: false, // Added for flying down
  })
  const moveJoystickRef = useRef({ x: 0, y: 0 })
  const rotateJoystickRef = useRef({ x: 0, y: 0 })
  const mouseRef = useRef({ x: 0, y: 0 })
  const isPointerLocked = useRef(false)
  const [isIframeMenuOpen, setIsIframeMenuOpen] = useState(false)
  const [isControlsEnabled, setIsControlsEnabled] = useState(true)
  // Ref mirror of isControlsEnabled so event handlers stay referentially stable.
  // (Previously, every pointer-lock change created new handler identities, which
  // re-ran the scene-setup effect and REBUILT THE ENTIRE 3D SCENE — the source of
  // the "glitches / can't move after clicking UI like the minimized voice window" bug.)
  const isControlsEnabledRef = useRef(true)
  const [showNpcDirectory, setShowNpcDirectory] = useState(false)
  // One-shot guard so a walk-through portal fires navigation exactly once
  const portalTriggeredRef = useRef(false)
  // UI visibility preferences (per-element hide toggles, persisted)
  const [uiPrefs, setUiPrefs] = useState<UiPrefs>(DEFAULT_UI_PREFS)
  const [showUiSettings, setShowUiSettings] = useState(false)
  // Xbox virtual mouse mode (RSB toggles; right stick moves cursor, A clicks, Y keyboard)
  const [virtualMouseMode, setVirtualMouseMode] = useState(false)
  const virtualMouseModeRef = useRef(false)
  virtualMouseModeRef.current = virtualMouseMode
  // Collapsible voice-panel sections (iPad friendly)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Load saved UI prefs once on mount, persist on every change afterwards
  useEffect(() => {
    setUiPrefs(loadUiPrefs())
  }, [])
  const handleUiPrefsChange = useCallback((next: UiPrefs) => {
    setUiPrefs(next)
    saveUiPrefs(next)
  }, [])
  const npcManagerRef = useRef<NPCManager | null>(null)
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const lastUpdateTimeRef = useRef<number>(0)
  const [showControls, setShowControls] = useState(false)
  const spritesRef = useRef<THREE.Sprite[]>([])
  const [showJoysticks, setShowJoysticks] = useState(true)
  const [npcData, setNpcData] = useState<NPCData[]>(createDefaultNPCs())
  // Ref mirror of npcData used by the one-time scene setup + live sync effect,
  // so editing NPCs never tears down and rebuilds the whole 3D scene.
  const npcDataRef = useRef<NPCData[]>([])
  // Skip the first live-sync pass right after the scene effect creates the NPCs itself
  const skipNextNpcSyncRef = useRef(true)
  // Keep the mirror current on every render (runs before effects)
  npcDataRef.current = npcData
  const [activeNpcs, setActiveNpcs] = useState<Set<number>>(new Set())
  const [isMeetingActive, setIsMeetingActive] = useState(false)
  const [isAtTables, setIsAtTables] = useState(false) // State for tracking if NPCs are at tables
  const [debugInfo, setDebugInfo] = useState({
    fps: 0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { y: 0 },
    pitch: { x: 0 },
  })
  const framesRef = useRef(0)
  const lastFpsTimeRef = useRef(0)
  // Live WordPress shortcode panels render one selected window at a time.
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [animationsLoaded, setAnimationsLoaded] = useState(false)
  const composerRef = useRef<EffectComposer | null>(null)
  const wallsRef = useRef<THREE.Object3D[]>([])
  const tablesRef = useRef<THREE.Group[]>([])
  // Add these state variables inside the VirtualGallery component
  const [externalControllerActive, setExternalControllerActive] = useState(false)
  const [controllerButtonMap, setControllerButtonMap] = useState<Record<number, string>>({})

  // Add a ref for the hover effect:
  const exhibitHoverEffectRef = useRef<ExhibitHoverEffect | null>(null)

  const [tooltipInfo, setTooltipInfo] = useState<{ title: string; description: string } | null>(null)
  const [wordpressBridge, setWordpressBridge] = useState<WordPressBridgeContext | null>(null)
  const [wordpressWindows, setWordpressWindows] = useState<WordPressNpcWindow[]>([])
  const [wordpressPages, setWordpressPages] = useState<Record<string, { title: string; url: string; shortcode: string; edit?: string }>>({})
  const [wordpressApiStatus, setWordpressApiStatus] = useState<"idle" | "loading" | "connected" | "error">("idle")
  const [wordpressApiError, setWordpressApiError] = useState("")
  const [showWordpressDashboard, setShowWordpressDashboard] = useState(false)
  const [selectedWordpressWindow, setSelectedWordpressWindow] = useState<WordPressNpcWindow | null>(null)
  const [isWordpressWindowLoading, setIsWordpressWindowLoading] = useState(false)
  const [wordpressFeatures, setWordpressFeatures] = useState<WordPressApiFeatures | null>(null)
  const [wordpressFeatureStatus, setWordpressFeatureStatus] = useState<"idle" | "loading" | "connected" | "error">("idle")
  const shortcodeSeedRef = useRef(`v0map-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const [isShortcodeWidescreen, setIsShortcodeWidescreen] = useState(false)
  const [voiceAgentActive, setVoiceAgentActive] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [voiceStatus, setVoiceStatus] = useState("Voice agent idle")
  const [lastVoiceCommand, setLastVoiceCommand] = useState("")
  const [lastNpmCommandResult, setLastNpmCommandResult] = useState("")
  const voiceRecognitionRef = useRef<any>(null)
  const [showVoiceCommandTab, setShowVoiceCommandTab] = useState(true)
  const [dynamicCityFeatures, setDynamicCityFeatures] = useState<DynamicCityFeature[]>([])
  const cityFeatureGroupRef = useRef<THREE.Group | null>(null)
  const [voiceCreatedNpcCount, setVoiceCreatedNpcCount] = useState(0)
  const [liveVoiceMode, setLiveVoiceMode] = useState<"command" | "dictation">("command")
  const liveVoiceModeRef = useRef<"command" | "dictation">("command")
  const [showProjectWindow, setShowProjectWindow] = useState(false)
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>(DEFAULT_PROJECT_TASKS)
  const [habitItems, setHabitItems] = useState<HabitItem[]>(DEFAULT_HABITS)
  const [dictationNotes, setDictationNotes] = useState<DictationNote[]>([])
  const [projectWindowWide, setProjectWindowWide] = useState(false)
  const [npcMovementMode, setNpcMovementMode] = useState<"realistic" | "dance" | "patrol" | "summon">("realistic")
  const [voiceCommandHistory, setVoiceCommandHistory] = useState<VoiceCommandHistoryItem[]>([])
  const [voiceWakeWord, setVoiceWakeWord] = useState("city")
  const [voiceAutoOpenWindows, setVoiceAutoOpenWindows] = useState(true)
  const [voiceAgentMinimized, setVoiceAgentMinimized] = useState(false)
  const [currentFloor, setCurrentFloor] = useState(0)
  const [r3fSpeedMode, setR3fSpeedMode] = useState(true)

  // Add flying mode state
  const [flyingMode, setFlyingMode] = useState(false)
  const flyingModeRef = useRef(false)
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null)
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null)

  // Update refs when flying mode changes
  useEffect(() => {
    flyingModeRef.current = flyingMode
  }, [flyingMode])

  useEffect(() => {
    liveVoiceModeRef.current = liveVoiceMode
  }, [liveVoiceMode])


  useEffect(() => {
    if (!sceneRef.current) return

    if (cityFeatureGroupRef.current) {
      sceneRef.current.remove(cityFeatureGroupRef.current)
      cityFeatureGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose?.()
          const material = child.material as THREE.Material | THREE.Material[]
          if (Array.isArray(material)) material.forEach((item) => item.dispose())
          else material?.dispose?.()
        }
      })
    }

    const group = new THREE.Group()
    group.name = "voice-built-city-features"

    dynamicCityFeatures.forEach((feature) => {
      const blueprint = CITY_FEATURE_BLUEPRINTS[feature.kind]
      const material = new THREE.MeshStandardMaterial({
        color: feature.color || blueprint.color,
        roughness: 0.38,
        metalness: 0.28,
        emissive: feature.kind === "api-core" ? new THREE.Color(0x4c0519) : new THREE.Color(0x000000),
        emissiveIntensity: feature.kind === "api-core" ? 0.5 : 0,
      })

      let mesh: THREE.Mesh
      if (feature.kind === "voice-stage") {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(blueprint.scale[0] / 2, blueprint.scale[0] / 2, blueprint.scale[1], 32), material)
      } else if (["habit-board", "task-kanban"].includes(feature.kind)) {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(...blueprint.scale), material)
        mesh.rotation.y = Math.PI / 8
      } else if (feature.kind === "api-core" || feature.kind === "voice-router") {
        mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(blueprint.scale[0] / 2, 1), material)
      } else if (feature.kind === "path-node") {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(blueprint.scale[0] / 2, 18, 18), material)
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(...blueprint.scale), material)
      }

      mesh.position.set(feature.position.x, feature.position.y + blueprint.scale[1] / 2, feature.position.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { type: "voice-city-feature", featureKind: feature.kind, featureId: feature.id }
      group.add(mesh)

      if (["path-node", "api-core", "voice-stage", "voice-router", "habit-board", "task-kanban"].includes(feature.kind)) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(blueprint.scale[0] * 0.65, blueprint.scale[0] * 0.82, 32),
          new THREE.MeshBasicMaterial({ color: feature.color || blueprint.color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }),
        )
        ring.rotation.x = -Math.PI / 2
        ring.position.set(feature.position.x, feature.position.y + 0.08, feature.position.z)
        group.add(ring)
      }
    })

    sceneRef.current.add(group)
    cityFeatureGroupRef.current = group

    return () => {
      sceneRef.current?.remove(group)
    }
  }, [dynamicCityFeatures])

  // Store WordPress bridge context from query params or plugin postMessage sync.
  useEffect(() => {
    if (typeof window === "undefined") return

    const saveBridgeContext = (payload: WordPressBridgeContext) => {
      const normalized: WordPressBridgeContext = {
        ...payload,
        restBase: payload.restBase || payload.context?.api?.restBase,
        windowsUrl: payload.windowsUrl || payload.context?.api?.windowsUrl,
        bridgeToken: payload.bridgeToken || payload.context?.api?.token,
        bridgeExpires: payload.bridgeExpires || payload.context?.api?.expires,
        restNonce: payload.restNonce || payload.context?.api?.nonce,
        user: payload.user || payload.context?.api?.user,
      }

      try {
        localStorage.setItem(
          "v0mapNpcGallerySession",
          JSON.stringify({
            ...normalized,
            receivedAt: Date.now(),
          }),
        )
      } catch (error) {
        console.error("Failed to save WordPress bridge context:", error)
      }

      setWordpressBridge(normalized)
    }

    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get("v0map_wp") === "1") {
        const rawContext = params.get("v0map_wp_context")
        let context: any = {}

        if (rawContext) {
          try {
            context = JSON.parse(decodeURIComponent(rawContext))
          } catch {
            context = { rawContext }
          }
        }

        saveBridgeContext({
          type: "query",
          user: params.get("v0map_wp_user") || "0",
          session: params.get("v0map_wp_session") || "",
          domain: params.get("v0map_domain") || context.domain || "",
          restBase: params.get("v0map_rest_base") ? decodeURIComponent(params.get("v0map_rest_base") || "") : "",
          restNonce: params.get("v0map_rest_nonce") || "",
          bridgeToken: params.get("v0map_bridge_token") || "",
          bridgeExpires: params.get("v0map_bridge_expires") || "",
          authSync: params.get("v0map_auth_sync") === "1",
          npcSync: params.get("v0map_npc_sync") === "1",
          context,
        })
      } else {
        const saved = localStorage.getItem("v0mapNpcGallerySession")
        if (saved) {
          saveBridgeContext(JSON.parse(saved))
        }
      }
    } catch (error) {
      console.error("Failed to read WordPress bridge query context:", error)
    }

    const handleBridgeMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.type !== "v0map:wp-auth-sync") return
      saveBridgeContext({
        type: "postMessage",
        appUrl: data.appUrl,
        worldUrl: data.worldUrl,
        domain: data.domain,
        user: data.user,
        restBase: data.restBase,
        windowsUrl: data.windowsUrl,
        bridgeToken: data.bridgeToken,
        bridgeExpires: data.bridgeExpires,
        restNonce: data.restNonce,
        authSync: data.authSync,
        npcSync: data.npcSync,
      })
    }

    window.addEventListener("message", handleBridgeMessage)
    return () => window.removeEventListener("message", handleBridgeMessage)
  }, [])

  const fetchWordpressWindows = useCallback(async () => {
    const windowsUrl = wordpressBridge?.windowsUrl || wordpressBridge?.context?.api?.windowsUrl
    const restBase = wordpressBridge?.restBase || wordpressBridge?.context?.api?.restBase
    const token = wordpressBridge?.bridgeToken || wordpressBridge?.context?.api?.token
    const expires = wordpressBridge?.bridgeExpires || wordpressBridge?.context?.api?.expires
    const user = wordpressBridge?.user || wordpressBridge?.context?.api?.user
    const restNonce = wordpressBridge?.restNonce || wordpressBridge?.context?.api?.nonce
    const endpoint = windowsUrl || (restBase ? `${restBase.replace(/\/$/, "")}/windows` : "/api/wp/npc-windows")
    const usesLocalProxy = endpoint.startsWith("/api/")

    if (!endpoint) return

    try {
      setWordpressApiStatus("loading")
      setWordpressApiError("")

      const url = new URL(endpoint, window.location.origin)
      url.searchParams.set("render", "0")
      url.searchParams.set("random", "0")
      url.searchParams.set("limit", String(Math.max(npcData.length, DEFAULT_NPC_COUNT, 68)))
      url.searchParams.set("seed", shortcodeSeedRef.current)
      if (!usesLocalProxy && token && expires && user) {
        url.searchParams.set("token", String(token))
        url.searchParams.set("expires", String(expires))
        url.searchParams.set("user", String(user))
      }

      const response = await fetch(url.toString(), {
        credentials: "include",
        headers: !usesLocalProxy && restNonce ? { "X-WP-Nonce": String(restNonce) } : undefined,
      })

      if (!response.ok) {
        throw new Error(`WordPress API returned ${response.status}`)
      }

      const payload = await response.json()
      const syncedWindows = Array.isArray(payload.windows) ? payload.windows : []
      setWordpressWindows((syncedWindows.length > 0 ? syncedWindows : npcData.map(localWordPressWindowFromNpc)).map((windowItem: any, index: number) => ({
        ...windowItem,
        index,
        windowType: windowItem.windowType || (windowItem.tag === "v0map_agent_dashboard" ? "link-wrapper" : windowItem.shortcode ? "shortcode" : "link"),
        shortcodeSource: windowItem.shortcodeSource || (windowItem.tag === "v0map_agent_dashboard" ? "v0map-wrapper" : windowItem.shortcode ? "provided" : "none"),
        isWrapper: windowItem.isWrapper || windowItem.tag === "v0map_agent_dashboard",
        tabs: asArray(windowItem.tabs).map((tab: any) => ({ ...tab, liveUrl: tab.liveUrl || shortcodeRenderUrl(tab.tag, tab.shortcode) })),
      })))
      setWordpressPages(payload.pages || wordpressBridge?.context?.pages || {})
      setWordpressApiStatus("connected")
    } catch (error) {
      const message = error instanceof Error ? error.message : "WordPress API connection failed"
      setWordpressApiError(message)
      setWordpressWindows(npcData.map(localWordPressWindowFromNpc))
      setWordpressApiStatus("error")
    }
  }, [wordpressBridge, npcData])


  const fetchWordpressFeatures = useCallback(async () => {
    try {
      setWordpressFeatureStatus("loading")
      const response = await fetch("/api/wp/suite?limit=80", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || `WordPress features returned ${response.status}`)
      }
      const normalizedPayload = normalizeWordPressFeaturePayload(payload)
      setWordpressFeatures(normalizedPayload)
      const featureWindows = normalizedPayload.features?.windows || []
      if (featureWindows.length > 0) {
        setWordpressWindows(featureWindows)
      }
      if (normalizedPayload.features?.dashboardPages && typeof normalizedPayload.features.dashboardPages === "object") {
        setWordpressPages(normalizedPayload.features.dashboardPages)
      }
      setWordpressFeatureStatus(normalizedPayload.ok ? "connected" : "error")
    } catch (error) {
      console.error("Failed to pull WordPress API features:", error)
      setWordpressFeatureStatus("error")
    }
  }, [])

  const selectWordpressWindow = useCallback(async (windowItem: WordPressNpcWindow | null) => {
    if (!windowItem) {
      setSelectedWordpressWindow(null)
      setIsWordpressWindowLoading(false)
      return
    }

    // Important: do NOT render shortcode HTML through srcDoc here.
    // Loading the real WordPress render page preserves plugin/theme CSS, scripts, login state, and shortcode assets.
    setShowWordpressDashboard(true)
    setIsWordpressWindowLoading(true)
    const frameSrc = wordpressFrameSrc(windowItem)
    setSelectedWordpressWindow({
      ...windowItem,
      liveUrl: frameSrc,
      wordpressUrl: frameSrc,
    })
  }, [])

  const shortcodeMenuWindows = useCallback(() => {
    const liveWindows = wordpressWindows.length >= DEFAULT_NPC_COUNT ? wordpressWindows : LOCAL_SHORTCODE_WINDOWS.map((item, index) => ({
      id: `local-shortcode-window-${item.tag}-${index}`,
      index,
      npcId: index + 1,
      title: item.title,
      team: item.team,
      shortcode: item.shortcode,
      tag: item.tag,
      registered: Boolean(item.shortcode),
      html: "",
      liveUrl: agentFallbackUrl(item),
      wordpressUrl: agentFallbackUrl(item),
      pageUrl: agentFallbackUrl(item),
      primaryLink: item.primaryLink,
      tabs: item.tabs?.map((tab) => ({ ...tab, liveUrl: shortcodeRenderUrl(tab.tag, tab.shortcode) })) || [],
      agentNo: item.agentNo,
      category: item.category,
      windowType: item.windowType,
      shortcodeSource: item.shortcodeSource,
      isWrapper: item.tag === "v0map_agent_dashboard" || item.windowType === "link-wrapper",
    }))

    const seen = new Set<string>()
    return liveWindows.filter((windowItem) => {
      const key = windowItem.agentNo ? `agent-${windowItem.agentNo}` : (windowItem.tag || windowItem.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [wordpressWindows])

  const selectedWindowIndex = useCallback(() => {
    if (!selectedWordpressWindow) return -1
    const windows = shortcodeMenuWindows()
    const byId = windows.findIndex((windowItem) => windowItem.id === selectedWordpressWindow.id || (windowItem.agentNo && windowItem.agentNo === selectedWordpressWindow.agentNo))
    if (byId !== -1) return byId
    return windows.findIndex((windowItem) => windowItem.tag === selectedWordpressWindow.tag && !isDashboardWrapperWindow(windowItem))
  }, [selectedWordpressWindow, shortcodeMenuWindows])

  const selectWindowByOffset = useCallback((offset: number) => {
    const windows = shortcodeMenuWindows()
    if (windows.length === 0) return
    const currentIndex = selectedWindowIndex()
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + offset + windows.length) % windows.length
    selectWordpressWindow(windows[nextIndex])
  }, [shortcodeMenuWindows, selectedWindowIndex, selectWordpressWindow])

  const closeWordpressWindow = useCallback(() => {
    setSelectedWordpressWindow(null)
    setIsWordpressWindowLoading(false)
    setIsShortcodeWidescreen(false)
  }, [])

  const findWordpressWindowByText = useCallback((query: string) => {
    const normalized = query.toLowerCase().replace(/[^a-z0-9_]+/g, " ").trim()
    const compact = normalized.replace(/\s+/g, "_")
    return shortcodeMenuWindows().find((windowItem) => {
      const haystack = `${windowItem.title} ${windowItem.team} ${windowItem.category || ""} ${windowItem.tag} ${windowItem.shortcode} ${windowItem.primaryLink || ""}`.toLowerCase()
      return haystack.includes(normalized) || haystack.includes(compact) || (windowItem.tag ? compact.includes(windowItem.tag.toLowerCase()) : false)
    })
  }, [shortcodeMenuWindows])

  const runLocalNpmCommand = useCallback(async (script: string) => {
    try {
      setLastNpmCommandResult(`Running ${script}...`)
      const response = await fetch("/api/local/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      })
      const payload = await response.json()
      const message = payload.ok ? `Finished ${script}` : `Blocked/failed ${script}: ${payload.error || payload.stderr || "unknown error"}`
      setLastNpmCommandResult(message)
      if (payload.ok) toast.success(message)
      else toast.error(message)
      return payload
    } catch (error) {
      const message = `Local command failed: ${error instanceof Error ? error.message : "unknown error"}`
      setLastNpmCommandResult(message)
      toast.error(message)
      return { ok: false, error: message }
    }
  }, [])

  useEffect(() => {
    fetchWordpressWindows()
    fetchWordpressFeatures()
    const interval = window.setInterval(() => {
      fetchWordpressWindows()
      fetchWordpressFeatures()
    }, 60000)
    return () => window.clearInterval(interval)
  }, [fetchWordpressWindows, fetchWordpressFeatures])

  // Load custom NPCs from localStorage on initial render
  useEffect(() => {
    try {
      const savedNPCs = localStorage.getItem("customNPCs")
      if (savedNPCs) {
        const parsedNPCs = JSON.parse(savedNPCs)
        const deserializedNPCs = parsedNPCs
          .map(deserializeNPCData)
          .filter((npc: NPCData) => npc.id > DEFAULT_NPC_COUNT)

        // Apply GLB models to custom NPCs as well
        const customNPCsWithGLB = deserializedNPCs.map((npc, index) => ({
          ...npc,
          model: "glb",
          glbUrl: AVAILABLE_MODELS[(index + DEFAULT_NPC_DATA.length) % AVAILABLE_MODELS.length].url,
        }))

        if (customNPCsWithGLB.length === 0) {
          localStorage.removeItem("customNPCs")
        }

        setNpcData([...createDefaultNPCs(), ...addNPCFeatures(customNPCsWithGLB.map((npc, index) => applyShortcodeRosterToNpc(npc, DEFAULT_NPC_COUNT + index)).map(attachNpcShortcodeWindow))])
      }
    } catch (error) {
      console.error("Failed to load custom NPCs:", error)
    }
  }, [])

  // Save custom NPCs to localStorage whenever they change
  useEffect(() => {
    try {
      // Only save custom NPCs.
      const customNPCs = npcData.filter((npc) => npc.id > DEFAULT_NPC_COUNT)
      if (customNPCs.length > 0) {
        const serializedNPCs = customNPCs.map(serializeNPCData)
        localStorage.setItem("customNPCs", JSON.stringify(serializedNPCs))
      }
    } catch (error) {
      console.error("Failed to save custom NPCs:", error)
    }
  }, [npcData])

  // Add this useEffect to preload models and animations
  useEffect(() => {
    // Preload models and animations when the component mounts
    const loadAssets = async () => {
      try {
        // First preload models
        const modelsSuccess = await preloadModels()
        setModelsLoaded(true)

        if (modelsSuccess) {
          toast.success("3D models preloaded successfully")
        } else {
          toast.error("Some models failed to load. Using fallbacks where needed.")
        }

        // Then preload animations
        try {
          const animationsSuccess = await preloadAnimations()

          if (animationsSuccess) {
            toast.success("Animations loaded successfully")
          } else {
            toast("Using simplified animations as fallback")
          }
        } catch (animError) {
          console.error("Animation loading error:", animError)
          toast("Using simplified animations as fallback")
        }

        // Always set animations as loaded, even if there was an error
        setAnimationsLoaded(true)
      } catch (error) {
        console.error("Error in preloading assets:", error)
        setModelsLoaded(true)
        setAnimationsLoaded(true)
        toast.error("Failed to preload assets. Using fallbacks.")
      }
    }

    loadAssets()
  }, [])

  // Pass the scene to the movement hook for collision detection
  const { move, yawObject, savePosition, loadPosition, refreshCollisionObjects } = useMovement(
    cameraRef,
    keysRef,
    moveJoystickRef,
    rotateJoystickRef,
    mouseRef,
    sceneRef,
    flyingModeRef,
  )

  // Toggle flying mode (stable — reads/writes via functional update + ref, so
  // pressing F no longer changes handler identities and rebuilds the scene)
  const toggleFlyingMode = useCallback(() => {
    setFlyingMode((prev) => {
      toast.success(prev ? "Flying mode disabled" : "Flying mode enabled. Use Space to fly up, Shift to fly down")
      return !prev
    })
  }, [])

  // Fly straight up
  const flyUp = useCallback(() => {
    if (flyingModeRef.current && yawObject.current) {
      const newPosition = yawObject.current.position.clone()
      newPosition.y += 5 // Move up by 5 units

      // Enforce maximum height (82 allows rooftop navigation, matches use-movement bounds)
      const maxHeight = ROOFTOP_FLOOR * 20 + 22
      if (newPosition.y > maxHeight) {
        newPosition.y = maxHeight
      }

      yawObject.current.position.copy(newPosition)
      toast.success("Flying up!")
    }
  }, [yawObject])

  // Fly straight down
  const flyDown = useCallback(() => {
    if (flyingModeRef.current && yawObject.current) {
      const newPosition = yawObject.current.position.clone()
      newPosition.y -= 5 // Move down by 5 units

      // Enforce minimum height
      const minHeight = 1.7 // Standard player height
      if (newPosition.y < minHeight) {
        newPosition.y = minHeight
      }

      yawObject.current.position.copy(newPosition)
      toast.success("Flying down!")
    }
  }, [yawObject])

  // Reset height to ground level
  const resetHeight = useCallback(() => {
    if (flyingModeRef.current && yawObject.current) {
      const newPosition = yawObject.current.position.clone()
      newPosition.y = 1.7 // Reset to standard player height
      yawObject.current.position.copy(newPosition)
      toast.success("Height reset to ground level")
    }
  }, [yawObject])

  // Add this function inside the VirtualGallery component
  const handleControllerConnect = useCallback((connected: boolean) => {
    setExternalControllerActive(connected)
    if (connected) {
      toast.success("Game controller connected! You can now use your controller to navigate.")
    } else {
      toast("Game controller disconnected.")
    }
  }, [])

  // Add this function inside the VirtualGallery component
  const handleControllerButtonPress = useCallback(
    (buttonIndex: number, pressed: boolean) => {
      if (!pressed) return

      // RSB (right stick click) toggles Xbox virtual mouse mode: right stick
      // moves an on-screen cursor, A clicks UI, Y opens the mini keyboard.
      if (buttonIndex === 11) {
        setVirtualMouseMode((prev) => {
          toast.success(prev ? "Mouse mode off — back to walking" : "🎮 Mouse mode ON — stick moves cursor, A clicks, Y keyboard, B exits")
          return !prev
        })
        return
      }
      // While mouse mode is active, the VirtualCursor component owns the gamepad —
      // don't also fire the in-world actions for the same button presses.
      if (virtualMouseModeRef.current) return

      // Map controller buttons to actions
      // Button mapping may vary by controller, so we'll handle common mappings
      switch (buttonIndex) {
        case 0: // A button or bottom button
          // Interact with objects (similar to click)
          if (controlsRef.current && !isPointerLocked.current && isControlsEnabledRef.current) {
            try {
              controlsRef.current.lock()
            } catch (error) {
              console.error("Failed to lock pointer:", error)
            }
          }
          break
        case 1: // B button or right button
          // Exit pointer lock (similar to ESC)
          if (controlsRef.current && isPointerLocked.current) {
            controlsRef.current.unlock()
          }
          break
        case 2: // X button or left button
          // Toggle flying mode
          toggleFlyingMode()
          break
        case 3: // Y button or top button
          // Open menu (similar to M key)
          setIsIframeMenuOpen(true)
          break
        case 4: // Left shoulder
          // Fly down (in flying mode)
          if (flyingModeRef.current) flyDown()
          break
        case 5: // Right shoulder
          // Fly up (in flying mode)
          if (flyingModeRef.current) flyUp()
          break
        case 8: // Menu/Start button
          // Toggle controls visibility
          setShowControls((prev) => !prev)
          break
        case 9: // Options/Select button
          // Toggle joysticks visibility
          setShowJoysticks((prev) => !prev)
          break
        default:
          break
      }
    },
    [flyDown, flyUp, toggleFlyingMode],
  )

  const handleMovement = useCallback(() => {
    // Movement now always runs: WASD/arrows/joysticks work even when the pointer
    // isn't locked (e.g. right after minimizing the voice command window).
    // Mouse-look remains gated by pointer lock inside handleMouseMove.
    move()

    // Update sprite orientations to always face camera
    spritesRef.current.forEach((sprite) => {
      if (sprite.userData.rotation !== undefined && cameraRef.current) {
        // Get the camera's rotation
        const cameraRotation = cameraRef.current.rotation.y

        // Calculate the sprite's rotation to face the camera
        const spriteRotation = sprite.userData.rotation

        // Apply rotation to make sprite face camera
        sprite.quaternion.setFromEuler(new THREE.Euler(0, cameraRotation + spriteRotation, 0))
      }
    })

    // Update debug info
    framesRef.current++
    const time = performance.now()
    if (time >= lastFpsTimeRef.current + 1000) {
      setDebugInfo((prev) => ({
        ...prev,
        fps: framesRef.current,
        position: {
          x: Number.parseFloat(yawObject.current.position.x.toFixed(2)),
          y: Number.parseFloat(yawObject.current.position.y.toFixed(2)),
          z: Number.parseFloat(yawObject.current.position.z.toFixed(2)),
        },
        rotation: { y: Number.parseFloat(yawObject.current.rotation.y.toFixed(2)) },
        pitch: { x: Number.parseFloat(cameraRef.current?.rotation.x.toFixed(2) || "0") },
      }))
      const detectedFloor = Math.max(0, Math.min(ROOFTOP_FLOOR, Math.round((yawObject.current.position.y - 1.7) / FLOOR_HEIGHT)))
      setCurrentFloor((prev) => (prev === detectedFloor ? prev : detectedFloor))
      framesRef.current = 0
      lastFpsTimeRef.current = time
    }

    // Update post-processing effects
    if (composerRef.current && cameraRef.current && sceneRef.current) {
      try {
        composerRef.current.render()
      } catch (error) {
        console.error("Error in composer rendering:", error)
        // Fallback to standard renderer
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }
      }
    }
  }, [move, cameraRef])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Never hijack keys while the user is typing in a form field (NPC directory, forms, etc.)
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        return
      }

      const key = event.code as keyof typeof keysRef.current
      if (key in keysRef.current) {
        keysRef.current[key] = true
      }

      // Press 'M' to open the iframe menu
      if (event.code === "KeyM") {
        setIsIframeMenuOpen(true)
      }

      // Press 'H' to toggle controls visibility
      if (event.code === "KeyH") {
        setShowControls((prev) => !prev)
      }

      // Press 'J' to toggle joysticks visibility
      if (event.code === "KeyJ") {
        setShowJoysticks((prev) => !prev)
      }

      // Press 'Escape' to exit pointer lock
      if (event.code === "Escape" && controlsRef.current) {
        controlsRef.current.unlock()
      }

      // Add 'F' key to toggle flying mode
      if (event.code === "KeyF") {
        toggleFlyingMode()
      }

      // Add 'N' key to open the live NPC Directory editor
      if (event.code === "KeyN") {
        setShowNpcDirectory((prev) => !prev)
      }

      // Add 'R' key to reset height when in flying mode
      if (event.code === "KeyR" && flyingModeRef.current) {
        resetHeight()
      }

      // Add 'PageUp' for quick fly up (Q now rotates)
      if (event.code === "PageUp" && flyingModeRef.current) {
        flyUp()
      }

      // Add 'PageDown' / 'Z' for quick fly down
      if ((event.code === "PageDown" || event.code === "KeyZ") && flyingModeRef.current) {
        flyDown()
      }
    },
    [toggleFlyingMode, resetHeight, flyUp, flyDown],
  )

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.code as keyof typeof keysRef.current
    if (key in keysRef.current) {
      keysRef.current[key] = false
    }
  }, [])

  const handleNPCInteraction = useCallback(
    (npc: NPCData) => {
      const wordpressWindow = wordpressWindows.find((windowItem) => windowItem.npcId === npc.id) || localWordPressWindowFromNpc(npc)
      if (wordpressWindow) {
        selectWordpressWindow(wordpressWindow)
        if (controlsRef.current) {
          controlsRef.current.unlock()
        }
        savePosition()
        return
      }

      setSelectedNPC(npc)
      if (controlsRef.current) {
        controlsRef.current.unlock()
      }
      // Save position when interacting with NPCs
      savePosition()
    },
    [savePosition, wordpressWindows, selectWordpressWindow],
  )

  const handleInteraction = useCallback(
    (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return

      // While pointer-locked the cursor is hidden and event.clientX is frozen —
      // raycast from the screen-center crosshair instead of the stale cursor.
      const mouse = isPointerLocked.current
        ? new THREE.Vector2(0, 0)
        : new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
          )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, cameraRef.current)
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true)

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object

        // Walk up the ancestor chain so hits on child meshes of grouped objects
        // (portals, props) still resolve their userData
        let interactive: THREE.Object3D | null = clickedObject
        while (interactive && (!interactive.userData || !interactive.userData.type)) {
          interactive = interactive.parent
        }
        const data = interactive?.userData

        // Rooftop door portal → navigate THIS tab to localhost:300X (no new tab)
        if (data && data.type === "portal" && typeof data.url === "string") {
          savePosition()
          toast.success(`Entering ${data.label || data.url}…`)
          if (controlsRef.current) {
            try { controlsRef.current.unlock() } catch {}
          }
          window.location.href = data.url
          return
        }

        // Check if clicked on an exhibit
        if (clickedObject.userData && clickedObject.userData.type === "exhibit") {
          setSelectedItem(clickedObject.userData.item)
          if (controlsRef.current) {
            controlsRef.current.unlock()
          }
          // Save position when interacting with exhibits
          savePosition()
        }

        // Check if clicked on an NPC
        if (clickedObject.userData && clickedObject.userData.type === "npc") {
          const npcId = clickedObject.userData.npcId
          const npc = npcData.find((n) => n.id === npcId)
          if (npc) {
            handleNPCInteraction(npc)
          }
        }
      }
    },
    [savePosition, npcData, handleNPCInteraction],
  )

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return

      // CRITICAL FIX: only capture the pointer when the click landed on the 3D canvas itself.
      // Previously ANY click on the page (including the minimized Voice Commands button,
      // panels, forms) instantly re-locked the pointer, which fought with the UI, threw
      // "pointer lock exited too recently" errors, and made movement feel frozen/glitchy.
      const clickedCanvas = rendererRef.current?.domElement && event.target === rendererRef.current.domElement
      if (!clickedCanvas) return

      if (!isPointerLocked.current) {
        // Second fix: re-locking is now ALWAYS allowed on a canvas click. Previously,
        // unlocking (Esc / opening a window / minimizing the voice panel) flipped
        // isControlsEnabled to false, which then blocked this very lock() call —
        // leaving the player permanently unable to move again.
        try {
          controlsRef.current?.lock()
        } catch (error) {
          console.error("Failed to lock pointer:", error)
          toast.error("Failed to lock pointer. You can still interact with the gallery.")
          // Fallback behavior: allow interaction without pointer lock
          handleInteraction(event)
        }
        return
      }

      handleInteraction(event)
    },
    [handleInteraction],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isPointerLocked.current && isControlsEnabledRef.current) {
        // Clamp per-event deltas: browsers can fire one massive movementX/Y burst
        // right after locking, which snapped the camera wildly (looked like a glitch)
        const clampedX = Math.max(-60, Math.min(60, event.movementX))
        const clampedY = Math.max(-60, Math.min(60, event.movementY))
        mouseRef.current.x += clampedX * 0.003
        mouseRef.current.y += clampedY * 0.003
      } else if (exhibitHoverEffectRef.current) {
        // Update hover effect when not in pointer lock mode
        exhibitHoverEffectRef.current.update(event.clientX, event.clientY, window.innerWidth, window.innerHeight)
      }
    },
    [],
  )

  const handlePointerLockChange = useCallback(() => {
    isPointerLocked.current = document.pointerLockElement === containerRef.current || document.pointerLockElement === rendererRef.current?.domElement
    isControlsEnabledRef.current = isPointerLocked.current
    setIsControlsEnabled(isPointerLocked.current)
  }, [])

  const handlePointerLockError = useCallback((event: Event) => {
    console.error("Pointer lock error:", event)
    toast.error("Pointer lock failed. You can still interact with the gallery using alternative controls.")
    isControlsEnabledRef.current = true
    setIsControlsEnabled(true) // Enable alternative controls
  }, [])

  const handleResize = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return
    cameraRef.current.aspect = window.innerWidth / window.innerHeight
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    if (composerRef.current) {
      composerRef.current.setSize(window.innerWidth, window.innerHeight)
    }
  }, [])

  // Handle NPC toggling
  const handleToggleNpc = useCallback((id: number) => {
    if (npcManagerRef.current) {
      npcManagerRef.current.toggleNPC(id)
      setActiveNpcs(npcManagerRef.current.getActiveNPCIds())
    }
  }, [])

  // Handle toggling all NPCs
  const handleToggleAllNpcs = useCallback(
    (active: boolean) => {
      if (npcManagerRef.current) {
        npcManagerRef.current.setAllNPCs(active)
        setActiveNpcs(active ? new Set(npcData.map((npc) => npc.id)) : new Set())
      }
    },
    [npcData],
  )

  // Handle calling a meeting
  const handleToggleMeeting = useCallback(() => {
    if (npcManagerRef.current) {
      const isInMeeting = npcManagerRef.current.toggleMeeting()
      setIsMeetingActive(isInMeeting)
      if (isInMeeting) {
        toast.success("Meeting called! NPCs are gathering in the center.")
      } else {
        toast.success("Meeting dismissed.")
      }
      return isInMeeting
    }
    return false
  }, [])

  // Open one active NPC WordPress shortcode window at a time instead of loading many iframes.
  const handleOpenAllStreamlit = useCallback(() => {
    const activeNpcIds = Array.from(activeNpcs)
    const activeNpcList = npcData.filter((npc) => activeNpcIds.includes(npc.id))

    if (activeNpcList.length === 0) {
      toast.error("No NPCs are active. Please activate NPCs first.")
      return
    }

    const activeWordPressWindows = wordpressWindows.filter((windowItem) => activeNpcIds.includes(windowItem.npcId))
    const windowToOpen = activeWordPressWindows[0] || localWordPressWindowFromNpc(activeNpcList[0])
    selectWordpressWindow(windowToOpen)
    toast.success(`Opened one live WordPress window: ${windowCodeLabel(windowToOpen)}`)
  }, [activeNpcs, npcData, wordpressWindows, selectWordpressWindow])

  // Call or summon one NPC, then optionally open that NPC's live WordPress shortcode window.
  const handleCallNPC = useCallback(
    (id: number, options: { openWindow?: boolean; instant?: boolean } = {}) => {
      if (!npcManagerRef.current || !yawObject.current) return

      const targetPosition = options.instant
        ? npcManagerRef.current.summonNPC(id, yawObject.current)
        : npcManagerRef.current.callNPC(id, yawObject.current)

      if (targetPosition) {
        const npc = npcData.find((npc) => npc.id === id)
        if (npc) {
          toast.success(`${options.instant ? "Summoned" : "Called"} ${npc.name} in front of you`)
          if (options.openWindow) {
            const windowItem = wordpressWindows.find((item) => item.npcId === id) || localWordPressWindowFromNpc(npc)
            selectWordpressWindow(windowItem)
          }
        }
      } else {
        toast.error("Failed to call NPC. Make sure it's active.")
      }
    },
    [npcData, wordpressWindows, selectWordpressWindow, yawObject],
  )

  const handleDanceNPCs = useCallback((ids: number[] = []) => {
    if (!npcManagerRef.current) return
    const count = npcManagerRef.current.danceNPCs(ids, 10)
    toast.success(`${count} NPC${count === 1 ? " is" : "s are"} dancing`)
  }, [])

  // ── NPC gestures (wave, nod, point, cheer, clap, think, salute) ─────────
  const handleGestureNPCs = useCallback((ids: number[], type: GestureType, duration = 3.5) => {
    const count = npcManagerRef.current?.gestureNPCs(ids, type, duration) ?? 0
    if (count > 0) {
      toast.success(ids.length === 0 ? `All NPCs: ${type}!` : `NPC ${ids.join(", ")}: ${type}!`)
    }
    return count
  }, [])

  // ── Named room navigation (level features: lobby, boardroom, arcade, garden…) ──
  const handleNavigateToRoom = useCallback((roomId: string) => {
    const room = ROOM_DESTINATIONS.find((item) => item.id === roomId)
    if (!room || !yawObject.current) return false
    yawObject.current.position.set(room.position.x, room.position.y + 1.7, room.position.z)
    savePosition()
    const isOutdoorRoom = room.floor === 0 && (Math.abs(room.position.x) > 50 || Math.abs(room.position.z) > 50)
    toast.success(`Teleported to ${room.name} (${isOutdoorRoom ? "Outdoors — City District" : room.floor === ROOFTOP_FLOOR ? "Rooftop" : `Floor ${room.floor + 1}`})`)
    return true
  }, [savePosition, yawObject])

  // ── Rooftop portals: same-tab navigation to localhost:3001-3005 ──────────
  const handleEnterPortal = useCallback((port: number) => {
    const destination = PORTAL_DESTINATIONS.find((item) => item.port === port)
    if (!destination) return
    savePosition()
    toast.success(`Entering ${destination.label}…`)
    window.location.href = destination.url
  }, [savePosition])

  // ── NPC group actions: formations + Yuka-style patrol routes ─────────────
  const getPlayerGroundAnchor = useCallback(() => {
    const y = yawObject.current ? Math.max(0, Math.round((yawObject.current.position.y - 1.7) / FLOOR_HEIGHT) * FLOOR_HEIGHT) : 0
    const x = yawObject.current?.position.x ?? 0
    const z = yawObject.current?.position.z ?? 0
    return new THREE.Vector3(x, y, z)
  }, [yawObject])

  const buildRingPoints = useCallback((center: THREE.Vector3, radius: number, count: number) => {
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2
      return new THREE.Vector3(center.x + Math.cos(angle) * radius, center.y, center.z + Math.sin(angle) * radius)
    })
  }, [])

  const handleGroupAction = useCallback((action: string) => {
    const manager = npcManagerRef.current
    if (!manager) return
    const anchor = getPlayerGroundAnchor()
    const visibleCount = Math.max(1, manager.getActiveNPCIds().size)

    switch (action) {
      case "circle": {
        const count = manager.sendToFormation(buildRingPoints(anchor, 6, Math.min(visibleCount, 24)))
        toast.success(`${count} NPCs circling you`)
        break
      }
      case "grid": {
        const cols = Math.ceil(Math.sqrt(visibleCount))
        const points: THREE.Vector3[] = []
        for (let i = 0; i < visibleCount; i++) {
          const row = Math.floor(i / cols)
          const col = i % cols
          points.push(new THREE.Vector3(anchor.x - (cols - 1) + col * 2, anchor.y, anchor.z + 4 + row * 2))
        }
        const count = manager.sendToFormation(points)
        toast.success(`${count} NPCs in grid formation`)
        break
      }
      case "rows": {
        const perRow = Math.ceil(visibleCount / 2)
        const points: THREE.Vector3[] = []
        for (let i = 0; i < visibleCount; i++) {
          const row = Math.floor(i / perRow)
          const col = i % perRow
          points.push(new THREE.Vector3(anchor.x - perRow + col * 2, anchor.y, anchor.z + 5 + row * 2.5))
        }
        const count = manager.sendToFormation(points)
        toast.success(`${count} NPCs lined up in two rows`)
        break
      }
      case "vee": {
        const points: THREE.Vector3[] = []
        for (let i = 0; i < visibleCount; i++) {
          const side = i % 2 === 0 ? 1 : -1
          const depth = Math.ceil((i + 1) / 2)
          points.push(new THREE.Vector3(anchor.x + side * depth * 1.6, anchor.y, anchor.z + 4 + depth * 1.8))
        }
        const count = manager.sendToFormation(points)
        toast.success(`${count} NPCs in V formation`)
        break
      }
      case "orbit": {
        // Yuka-style loop: ring route around the player with visible path
        manager.clearPaths()
        const count = manager.startPatrolRoute([], buildRingPoints(anchor, 8, 12), true, 0x22d3ee)
        toast.success(`${count} NPCs orbiting you on a Yuka path`)
        break
      }
      case "patrol-floor": {
        // Rectangle loop around the current floor with visible path
        manager.clearPaths()
        const half = 22
        const points = [
          new THREE.Vector3(anchor.x === 0 ? -half : -half, anchor.y, -half),
          new THREE.Vector3(half, anchor.y, -half),
          new THREE.Vector3(half, anchor.y, half),
          new THREE.Vector3(-half, anchor.y, half),
        ]
        const count = manager.startPatrolRoute([], points, true, 0xa3e635)
        toast.success(`${count} NPCs patrolling this floor on a Yuka route`)
        break
      }
      case "figure-eight": {
        // Two tangent rings — classic Yuka waypoint demo path
        manager.clearPaths()
        const left = buildRingPoints(new THREE.Vector3(anchor.x - 7, anchor.y, anchor.z), 6, 8)
        const right = buildRingPoints(new THREE.Vector3(anchor.x + 7, anchor.y, anchor.z), 6, 8).reverse()
        const count = manager.startPatrolRoute([], [...left, ...right], true, 0xf472b6)
        toast.success(`${count} NPCs running a figure-eight route`)
        break
      }
      case "guard-rooms": {
        // Post NPCs at every named room across all floors
        const points = ROOM_DESTINATIONS.map((room) => new THREE.Vector3(room.position.x, room.position.y, room.position.z))
        const count = manager.sendToFormation(points)
        toast.success(`${count} NPCs posted to guard the rooms`)
        break
      }
      case "floor-tour": {
        // Yuka route through every named room on the player's current floor
        manager.clearPaths()
        const currentFloor = Math.round(anchor.y / FLOOR_HEIGHT)
        const roomPoints = ROOM_DESTINATIONS.filter((room) => room.floor === currentFloor).map(
          (room) => new THREE.Vector3(room.position.x, room.position.y, room.position.z),
        )
        if (roomPoints.length < 2) {
          toast.error("Not enough rooms on this floor for a tour")
          break
        }
        const count = manager.startPatrolRoute([], roomPoints, true, 0xfbbf24)
        toast.success(`${count} NPCs touring every room on this floor`)
        break
      }
      case "conga": {
        // Winding conga route: rooms on this floor + a loop around the player
        manager.clearPaths()
        const currentFloor = Math.round(anchor.y / FLOOR_HEIGHT)
        const roomPoints = ROOM_DESTINATIONS.filter((room) => room.floor === currentFloor).map(
          (room) => new THREE.Vector3(room.position.x, room.position.y, room.position.z),
        )
        const route = [...roomPoints, ...buildRingPoints(anchor, 5, 4)]
        if (route.length < 3) {
          toast.error("Not enough waypoints for a conga line here")
          break
        }
        const count = manager.startPatrolRoute([], route, true, 0xf472b6)
        manager.danceNPCs([], 30)
        toast.success(`${count} NPCs conga-lining through the floor 💃`)
        break
      }
      case "stadium-wave": {
        // Cheer rippling across all NPCs, sorted left-to-right — a stadium wave
        const snapshot = manager.getSnapshot().filter((npc) => npc.visible).sort((a, b) => a.x - b.x)
        snapshot.forEach((npc, index) => {
          setTimeout(() => manager.gestureNPCs([npc.id], "cheer", 1.6), index * 140)
        })
        toast.success(`Stadium wave across ${snapshot.length} NPCs! 🌊`)
        break
      }
      case "flash-mob": {
        // Everyone rushes to circle the player, then dances
        manager.sendToFormation(buildRingPoints(anchor, 5, Math.min(visibleCount, 20)))
        setTimeout(() => manager.danceNPCs([], 15), 3200)
        toast.success("Flash mob incoming — dance party in 3 seconds 🕺")
        break
      }
      case "meeting": {
        // Summon everyone to the nearest boardroom-style room
        const meetingRooms = ROOM_DESTINATIONS.filter((room) => ["boardroom", "war-room", "lobby"].includes(room.id))
        const nearest = meetingRooms.reduce((best, room) => {
          const distBest = Math.abs(best.position.y - anchor.y)
          const distRoom = Math.abs(room.position.y - anchor.y)
          return distRoom < distBest ? room : best
        }, meetingRooms[0])
        const center = new THREE.Vector3(nearest.position.x, nearest.position.y, nearest.position.z)
        const count = manager.sendToFormation(buildRingPoints(center, 4, Math.min(visibleCount, 16)))
        toast.success(`${count} NPCs heading to ${nearest.name} for a meeting`)
        break
      }
      case "stop-routes": {
        const count = manager.stopPatrols()
        manager.clearPaths()
        toast.success(count > 0 ? `Stopped ${count} patrol routes` : "Patrol routes cleared")
        break
      }
      case "freeze": {
        const count = manager.freezeNPCs(true)
        toast.success(`Froze ${count} NPCs`)
        break
      }
      case "unfreeze": {
        const count = manager.freezeNPCs(false)
        toast.success(`Unfroze ${count} NPCs`)
        break
      }
      default:
        break
    }
  }, [getPlayerGroundAnchor, buildRingPoints])


  const getNPCIdsForTeam = useCallback(
    (team: string) => npcData.filter((npc) => npc.team === team).map((npc) => npc.id),
    [npcData],
  )

  const handleCallTeam = useCallback(
    (team: string) => {
      if (!npcManagerRef.current || !yawObject.current) return
      const ids = getNPCIdsForTeam(team)
      const called = npcManagerRef.current.callNPCs(ids, yawObject.current)
      toast.success(`Called ${called.length} ${team} NPCs to you`)
    },
    [getNPCIdsForTeam, yawObject],
  )

  const handleToggleTeam = useCallback(
    (team: string, active: boolean) => {
      if (!npcManagerRef.current) return
      const ids = getNPCIdsForTeam(team)
      npcManagerRef.current.setNPCsActive(ids, active)
      setActiveNpcs(npcManagerRef.current.getActiveNPCIds())
      toast.success(`${active ? "Showing" : "Hiding"} ${team} team`)
    },
    [getNPCIdsForTeam],
  )

  const handleOpenTeamApps = useCallback(
    (team: string) => {
      const teamApps = npcData.filter((npc) => npc.team === team && activeNpcs.has(npc.id))
      if (teamApps.length === 0) {
        toast.error(`No active NPCs in ${team}`)
        return
      }

      const teamWindows = teamApps.map((npc, index) => wordpressWindows.find((windowItem) => windowItem.npcId === npc.id) || localWordPressWindowFromNpc(npc, index))
      const windowToOpen = teamWindows[0] || null
      selectWordpressWindow(windowToOpen)
      if (windowToOpen) {
        toast.success(`Opened one ${team} window: ${windowCodeLabel(windowToOpen)}`)
      }
    },
    [activeNpcs, npcData, wordpressWindows, selectWordpressWindow],
  )

  const handleScatterNPCs = useCallback(() => {
    if (!npcManagerRef.current) return
    const count = npcManagerRef.current.scatterNPCs()
    toast.success(`Scattered ${count} active NPCs`)
  }, [])

  const handleGatherNPCs = useCallback(() => {
    if (!npcManagerRef.current || !yawObject.current) return
    const floorBaseY = getFloorBaseY(Math.round((yawObject.current.position.y - 1.7) / FLOOR_HEIGHT))
    const count = npcManagerRef.current.gatherNPCs([], new THREE.Vector3(0, floorBaseY, 0))
    toast.success(`Gathered ${count} NPCs on this floor`)
  }, [yawObject])

  const handleSendToFloor = useCallback((floor: number, team?: string) => {
    if (!npcManagerRef.current) return
    const ids = team ? getNPCIdsForTeam(team) : []
    const count = npcManagerRef.current.sendNPCsToFloor(ids, floor)
    setNpcData((prev) =>
      prev.map((npc) => (!team || npc.team === team ? { ...npc, floor: Math.min(floor, ROOFTOP_FLOOR), status: floor === ROOFTOP_FLOOR ? "On rooftop" : `On ${floor + 1}F` } : npc)),
    )
    toast.success(`Sent ${count} NPCs to ${floor === ROOFTOP_FLOOR ? "the rooftop" : `${floor + 1}F`}`)
  }, [getNPCIdsForTeam])

  const handleNavigateToFloor = useCallback(
    (floor: number) => {
      if (!yawObject.current) return
      const floorBaseY = getFloorBaseY(floor)
      const z = floor === ROOFTOP_FLOOR ? 4 : 22
      yawObject.current.position.set(0, floorBaseY + 1.7, z)
      setCurrentFloor(floor)
      if (cameraRef.current) cameraRef.current.position.copy(yawObject.current.position)
      savePosition()
      toast.success(`Moved to ${floor === ROOFTOP_FLOOR ? "Rooftop" : `${floor + 1}F`}`)
    },
    [savePosition, yawObject],
  )

  const extractNpcIdFromCommand = useCallback((command: string) => {
    const direct = command.match(/(?:npc|agent|number)\s*(\d+)/i)
    if (direct?.[1]) return Number(direct[1])

    if (/brand|bsp|gpt|ceo/i.test(command)) return 1

    const matchedNpc = npcData.find((npc) => command.toLowerCase().includes(npc.name.toLowerCase()))
    return matchedNpc?.id || selectedWordpressWindow?.npcId || 1
  }, [npcData, selectedWordpressWindow])


  const createVoiceNPC = useCallback((command: string) => {
    const nextId = Math.max(0, ...npcData.map((npc) => npc.id)) + 1
    const name = parseNpcNameFromVoice(command) || `Voice NPC ${nextId}`
    const shortcodeTag = parseShortcodeTagFromVoice(command, nextId - 1)
    const matchedWindow = LIVE_SHORTCODE_WINDOWS.find((windowItem) =>
      windowItem.tag === shortcodeTag || windowItem.tabs?.some((tab) => tab.tag === shortcodeTag),
    ) || shortcodeWindowForIndex(nextId - 1)
    const shortcodeValue = matchedWindow?.tag === "v0map_agent_dashboard"
      ? `[v0map_agent_dashboard agent_no="${matchedWindow.agentNo || nextId}"]`
      : `[${shortcodeTag}]`
    const cameraObject = yawObject.current
    const basePosition = cameraObject
      ? cameraObject.position.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, cameraObject.rotation.y, 0))).multiplyScalar(4))
      : new THREE.Vector3(0, 0, 6)
    basePosition.y = cameraObject ? Math.max(0, cameraObject.position.y - 1.7) : 0

    const newNpc = attachNpcShortcodeWindow({
      id: nextId,
      name,
      model: "glb",
      glbUrl: "/models/avatar.glb",
      color: ["#22c55e", "#06b6d4", "#a855f7", "#f97316", "#ef4444"][nextId % 5],
      streamlitUrl: shortcodeRenderUrl(shortcodeTag, shortcodeValue),
      shortcodeTag,
      shortcode: shortcodeValue,
      wordpressUrl: shortcodeRenderUrl(shortcodeTag, shortcodeValue),
      liveUrl: shortcodeRenderUrl(shortcodeTag, shortcodeValue),
      position: basePosition.clone(),
      targetPosition: basePosition.clone().add(new THREE.Vector3((nextId % 3) - 1, 0, 2 + (nextId % 4))),
      speed: 0.75,
      rotationSpeed: 2.2,
      interactionRadius: 6,
      team: "Voice Created",
      role: toTitleCaseFromTag(shortcodeTag),
      skills: ["voice-created", shortcodeTag === "v0map_agent_dashboard" ? "v0map-dashboard-wrapper" : "wordpress-shortcode", "live-window"],
      features: ["Come here", "Open shortcode", "Dance", "Roam", "Team import ready"],
      commands: [
        `${name} come here`,
        `${name} dance`,
        `open ${shortcodeTag}`,
      ],
      dialogue: [
        shortcodeTag === "v0map_agent_dashboard"
          ? "I was created by voice and connected to the real V0Map dashboard wrapper shortcode."
          : `I was created by voice and connected to [${shortcodeTag}].`,
        "Say come here to summon me and open my live WordPress window.",
      ],
      floor: Math.max(0, Math.round(basePosition.y / FLOOR_HEIGHT)),
      status: "Voice created",
      priority: "high",
    })

    const enrichedNpc = addNPCFeatures([newNpc])[0]
    const nextNpcData = [...npcData, enrichedNpc]
    skipNextNpcSyncRef.current = true
    setNpcData(nextNpcData)

    if (npcManagerRef.current && sceneRef.current) {
      // Live diff: spawns just the new NPC — no dispose/rebuild, no model reloads
      npcManagerRef.current.syncNPCs(nextNpcData)
      setActiveNpcs(npcManagerRef.current.getActiveNPCIds())
      if (yawObject.current) {
        npcManagerRef.current.summonNPC(nextId, yawObject.current)
      }
    }

    setVoiceCreatedNpcCount((count) => count + 1)
    selectWordpressWindow(localWordPressWindowFromNpc(enrichedNpc, nextId - 1))
    toast.success(`Created ${name} with ${shortcodeTag === "v0map_agent_dashboard" ? "V0Map dashboard wrapper" : `[${shortcodeTag}]`}`)
  }, [npcData, yawObject, selectWordpressWindow])

  const handleImportTeamPreset = useCallback(async (size: 25 | 50 | 100) => {
    const preset = TEAM_TEMPLATE_FILES.find((item) => item.size === size)
    if (!preset) return
    try {
      const response = await fetch(preset.file)
      if (!response.ok) throw new Error(`Unable to load ${preset.file}`)
      const payload = await response.json()
      const teamAssignments: Array<{ name: string; members: Array<number | string>; skills?: string[]; roles?: Record<string, string> }> = []
      const npcAssignments = Array.isArray(payload?.npcs) ? payload.npcs : []

      if (Array.isArray(payload?.teams)) {
        payload.teams.forEach((team: any) => teamAssignments.push({ name: team.name, members: team.npcIds || team.ids || team.members || [], skills: team.skills, roles: team.roles }))
      }

      setNpcData((prev) =>
        prev.map((npc) => {
          const direct = npcAssignments.find((item: any) => item.id === npc.id || item.name === npc.name)
          const assignedTeam = teamAssignments.find((team) =>
            team.members.some((member) => member === npc.id || member === npc.name || member === String(npc.id)),
          )

          if (!direct && !assignedTeam) return npc

          return {
            ...npc,
            team: direct?.team || assignedTeam?.name || npc.team,
            role: direct?.role || assignedTeam?.roles?.[String(npc.id)] || npc.role,
            skills: direct?.skills || assignedTeam?.skills || npc.skills,
            floor: typeof direct?.floor === "number" ? direct.floor : npc.floor,
            status: direct?.status || `Imported ${size} team`,
          }
        }),
      )
      toast.success(`Imported ${size} NPC team template`)
    } catch (error: any) {
      toast.error(error?.message || `Failed to import ${size} NPC team template`)
    }
  }, [])

  const addDynamicCityFeature = useCallback((kind: DynamicCityFeature["kind"], createdBy: DynamicCityFeature["createdBy"] = "button") => {
    const cameraObject = yawObject.current
    const blueprint = CITY_FEATURE_BLUEPRINTS[kind]
    const forward = cameraObject
      ? new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, cameraObject.rotation.y, 0)))
      : new THREE.Vector3(0, 0, -1)
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraObject?.rotation.y || 0)
    const base = cameraObject ? cameraObject.position.clone() : new THREE.Vector3(0, 1.7, 20)
    const offset = dynamicCityFeatures.length % 2 === 0 ? right.multiplyScalar(4) : right.multiplyScalar(-4)
    const target = base.add(forward.multiplyScalar(9 + (dynamicCityFeatures.length % 4) * 2)).add(offset)
    const floorY = Math.max(0, Math.round((target.y - 1.7) / FLOOR_HEIGHT) * FLOOR_HEIGHT)

    const feature: DynamicCityFeature = {
      id: `${kind}-${Date.now()}-${dynamicCityFeatures.length}`,
      kind,
      label: blueprint.label,
      position: { x: target.x, y: floorY, z: target.z },
      color: blueprint.color,
      createdBy,
    }

    setDynamicCityFeatures((prev) => [...prev, feature])
    toast.success(`Added ${blueprint.label} to the 3D city`)
  }, [dynamicCityFeatures.length, yawObject])

  const recordVoiceCommand = useCallback((text: string, action = "heard") => {
    const clean = text.trim()
    if (!clean) return
    setVoiceCommandHistory((prev) => [
      {
        id: `voice-history-${Date.now()}-${prev.length}`,
        text: clean,
        action,
        mode: liveVoiceModeRef.current,
        createdAt: new Date().toLocaleTimeString(),
      },
      ...prev,
    ].slice(0, 25))
  }, [])

  const addDictationNote = useCallback((text: string, source: "dictation" | "command" = "dictation") => {
    const clean = text.replace(/^(take note|dictate|note to self|write down)\s*/i, "").trim()
    if (!clean) return
    setDictationNotes((prev) => [
      { id: `note-${Date.now()}-${prev.length}`, text: clean, createdAt: new Date().toLocaleString(), source },
      ...prev,
    ].slice(0, 40))
    setShowProjectWindow(true)
    setVoiceStatus(`Dictated note saved: ${clean}`)
    toast.success("Dictation saved to Project Manager")
  }, [])

  const addProjectTaskFromVoice = useCallback((command: string) => {
    const title = command
      .replace(/^(add|create|make)\s+(a\s+)?(new\s+)?(daily\s+)?(to do|todo|task|checklist item)\s*/i, "")
      .replace(/^called\s+/i, "")
      .trim() || "New voice task"
    setProjectTasks((prev) => [
      ...prev,
      { id: `task-${Date.now()}-${prev.length}`, title, status: "todo", priority: /urgent|high|critical/i.test(command) ? "high" : "normal", source: "voice" },
    ])
    setShowProjectWindow(true)
    toast.success(`Added task: ${title}`)
  }, [])

  const toggleProjectTaskByVoice = useCallback((command: string) => {
    const match = command.match(/(?:complete|finish|check off|done)\s+(?:task|todo|item)?\s*(\d+)?/i)
    if (!match) return false
    const index = Math.max(0, Number(match[1] || 1) - 1)
    setProjectTasks((prev) => prev.map((task, taskIndex) => taskIndex === index ? { ...task, status: task.status === "done" ? "todo" : "done" } : task))
    setShowProjectWindow(true)
    toast.success(`Updated task ${index + 1}`)
    return true
  }, [])

  const importProjectTemplate = useCallback(async (kind: "project" | "habit") => {
    const file = kind === "habit" ? "/habit-tracker.import.json" : "/project-management.import.json"
    try {
      const response = await fetch(file)
      if (!response.ok) throw new Error(`Unable to load ${file}`)
      const payload = await response.json()
      if (Array.isArray(payload?.tasks)) {
        setProjectTasks(payload.tasks.map((task: any, index: number) => ({
          id: task.id || `import-task-${index}`,
          title: task.title || task.name || `Imported task ${index + 1}`,
          status: task.status === "done" || task.done ? "done" : task.status === "doing" ? "doing" : "todo",
          priority: task.priority || "normal",
          source: "import",
        })))
      }
      if (Array.isArray(payload?.habits)) {
        setHabitItems(payload.habits.map((habit: any, index: number) => ({
          id: habit.id || `import-habit-${index}`,
          name: habit.name || habit.title || `Imported habit ${index + 1}`,
          streak: Number(habit.streak || 0),
          target: Number(habit.target || 7),
          doneToday: Boolean(habit.doneToday || habit.done),
          source: "import",
        })))
      }
      setShowProjectWindow(true)
      toast.success(kind === "habit" ? "Habit tracker imported" : "Project board imported")
    } catch (error: any) {
      toast.error(error?.message || "Import failed")
    }
  }, [])

  const exportProjectBoard = useCallback(() => {
    if (typeof window === "undefined") return
    const payload = {
      exportedAt: new Date().toISOString(),
      tasks: projectTasks,
      habits: habitItems,
      notes: dictationNotes,
      voiceCommandHistory,
      npcMovementMode,
      dynamicCityFeatures,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `v0map-project-board-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success("Exported project board JSON")
  }, [dictationNotes, dynamicCityFeatures, habitItems, npcMovementMode, projectTasks, voiceCommandHistory])

  const moveNpcByVoiceCommand = useCallback((command: string) => {
    if (!/(move|send|walk)\s+/.test(command.toLowerCase())) return false
    const npcId = extractNpcIdFromCommand(command)
    const cameraObject = yawObject.current
    const currentNpc = npcData.find((npc) => npc.id === npcId)
    if (!currentNpc) return false

    const base = currentNpc.position?.clone?.() || new THREE.Vector3(0, 0, 0)
    const forward = cameraObject
      ? new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, cameraObject.rotation.y, 0)))
      : new THREE.Vector3(0, 0, -1)
    const right = cameraObject
      ? new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraObject.rotation.y)
      : new THREE.Vector3(1, 0, 0)
    let offset = new THREE.Vector3(0, 0, -6)
    if (/left/.test(command.toLowerCase())) offset = right.clone().multiplyScalar(-6)
    if (/right/.test(command.toLowerCase())) offset = right.clone().multiplyScalar(6)
    if (/back|behind/.test(command.toLowerCase())) offset = forward.clone().multiplyScalar(-6)
    if (/front|forward|ahead/.test(command.toLowerCase())) offset = forward.clone().multiplyScalar(8)
    if (/project room|task room|manager/.test(command.toLowerCase())) offset = new THREE.Vector3(8, 0, -8).sub(base.clone().setY(0))
    if (/stage/.test(command.toLowerCase())) offset = new THREE.Vector3(-8, 0, -8).sub(base.clone().setY(0))

    const target = base.clone().add(offset)
    target.y = Math.max(0, currentNpc.floor ? currentNpc.floor * FLOOR_HEIGHT + 1 : base.y)
    npcManagerRef.current?.sendNPCToPosition(npcId, target)
    setNpcData((prev) => prev.map((npc) => npc.id === npcId ? { ...npc, targetPosition: target.clone(), status: "Voice moved with Yuka-style path target" } : npc))
    setNpcMovementMode("realistic")
    toast.success(`Moved ${currentNpc.name}`)
    return true
  }, [extractNpcIdFromCommand, npcData, yawObject])

  const handleVoiceTeamFloorCommand = useCallback((command: string) => {
    const floorMatch = command.match(/(?:floor|level)\s*(\d+)/i)
    const teamMatch = NPC_TEAM_PRESETS.find((team) => command.toLowerCase().includes(team.name.toLowerCase()))
    if (!floorMatch || !teamMatch) return false
    const floor = Math.max(0, Math.min(ROOFTOP_FLOOR, Number(floorMatch[1]) - 1))
    handleSendToFloor(floor, teamMatch.name)
    return true
  }, [handleSendToFloor])

  const handleVoiceCommand = useCallback((rawCommand: string) => {
    const command = rawCommand.trim()
    const normalized = command.toLowerCase()
    if (!command) return

    setLastVoiceCommand(command)
    setVoiceStatus(`Heard: ${command}`)
    recordVoiceCommand(command, "heard")

    if (/close|exit|hide window|x window/.test(normalized)) {
      closeWordpressWindow()
      toast.success("Closed shortcode window")
      return
    }

    if (/next|forward/.test(normalized) && /window|shortcode|app|panel/.test(normalized)) {
      selectWindowByOffset(1)
      toast.success("Opened next shortcode window")
      return
    }

    if (/previous|back|last/.test(normalized) && /window|shortcode|app|panel/.test(normalized)) {
      selectWindowByOffset(-1)
      toast.success("Opened previous shortcode window")
      return
    }

    if (/wide|fullscreen|full screen|maximize|bigger/.test(normalized)) {
      setIsShortcodeWidescreen(true)
      toast.success("Widescreen shortcode window enabled")
      return
    }

    if (/normal|small|minimize|restore/.test(normalized)) {
      setIsShortcodeWidescreen(false)
      toast.success("Restored normal shortcode window")
      return
    }

    const floorCommand = normalized.match(/(?:go|move|take me|navigate|floor)\s*(?:to\s*)?(?:floor|level)?\s*(1|2|3|4|5|6|roof|rooftop)/i)
    if (floorCommand) {
      const target = floorCommand[1]
      const floor = /roof|6/.test(target) ? ROOFTOP_FLOOR : Math.max(0, Math.min(ROOFTOP_FLOOR, Number(target) - 1))
      handleNavigateToFloor(floor)
      return
    }

    if (/refresh|reload/.test(normalized) && /wordpress|api|shortcode|window|data/.test(normalized)) {
      fetchWordpressWindows()
      fetchWordpressFeatures()
      toast.success("Refreshing live WordPress API data")
      return
    }
    if (/dictation mode|start dictation|live dictation|dictate mode/.test(normalized)) {
      setLiveVoiceMode("dictation")
      setShowProjectWindow(true)
      setVoiceStatus("Live dictation mode active. Say 'command mode' to control the city again.")
      toast.success("Live dictation mode active")
      return
    }

    if (/command mode|stop dictation|voice command mode/.test(normalized)) {
      setLiveVoiceMode("command")
      setVoiceStatus("Voice command mode active")
      toast.success("Voice command mode active")
      return
    }

    if (/open project|show project|project manager|project management|daily todo|daily to do|checklist|habit tracker/.test(normalized) && !/add|create|import|complete|finish/.test(normalized)) {
      setShowProjectWindow(true)
      toast.success("Opened Project Manager")
      return
    }

    if (/^(take note|dictate|note to self|write down)/.test(normalized)) {
      addDictationNote(command, "command")
      return
    }

    if (/^(add|create|make)\s+.*(task|todo|to do|checklist item)/.test(normalized)) {
      addProjectTaskFromVoice(command)
      return
    }

    if (toggleProjectTaskByVoice(command)) {
      return
    }

    if (/import|load/.test(normalized) && /habit|tracker|daily/.test(normalized)) {
      importProjectTemplate("habit")
      return
    }

    if (/import|load/.test(normalized) && /project|board|tasks/.test(normalized)) {
      importProjectTemplate("project")
      return
    }

    if (/export|download|save/.test(normalized) && /(project|board|tasks|habits|notes)/.test(normalized)) {
      exportProjectBoard()
      return
    }

    if (/add|create|build|spawn/.test(normalized) && /(project room|habit board|task kanban|kanban|voice router|project board|voice gate|automation lab|client portal|media studio|calendar room)/.test(normalized)) {
      const kind: DynamicCityFeature["kind"] = /habit board/.test(normalized)
        ? "habit-board"
        : /kanban|task/.test(normalized)
          ? "task-kanban"
          : /voice router/.test(normalized)
            ? "voice-router"
            : /project board/.test(normalized)
              ? "project-board"
              : /voice gate/.test(normalized)
                ? "voice-gate"
                : /automation lab/.test(normalized)
                  ? "automation-lab"
                  : /client portal/.test(normalized)
                    ? "client-portal"
                    : /media studio/.test(normalized)
                      ? "media-studio"
                      : /calendar room/.test(normalized)
                        ? "calendar-room"
                        : "project-room"
      addDynamicCityFeature(kind, "voice")
      setShowProjectWindow(true)
      return
    }

    if (moveNpcByVoiceCommand(command)) {
      return
    }


    if (/(?:create|add|make|new)\b.*\b(?:npc|agent|avatar)\b/.test(normalized)) {
      createVoiceNPC(command)
      return
    }

    if (/import|load|bring in/.test(normalized) && /team|npc/.test(normalized)) {
      const size = normalized.includes("100") ? 100 : normalized.includes("50") ? 50 : 25
      handleImportTeamPreset(size as 25 | 50 | 100)
      return
    }

    if (/add|create|build|spawn/.test(normalized) && /(tower|skybridge|bridge|command pod|pod|voice stage|stage|api core|wordpress core|path node|yuka|project room|habit board|task kanban|kanban|voice router|project board|voice gate|automation lab|client portal|media studio|calendar room)/.test(normalized)) {
      const kind: DynamicCityFeature["kind"] = /skybridge|bridge/.test(normalized)
        ? "skybridge"
        : /command pod|pod/.test(normalized)
          ? "command-pod"
          : /voice stage|stage/.test(normalized)
            ? "voice-stage"
            : /api core|wordpress core/.test(normalized)
              ? "api-core"
              : /project room/.test(normalized)
                ? "project-room"
                : /habit board/.test(normalized)
                  ? "habit-board"
                  : /task kanban|kanban/.test(normalized)
                    ? "task-kanban"
                    : /voice router/.test(normalized)
                      ? "voice-router"
                      : /project board/.test(normalized)
                        ? "project-board"
                        : /voice gate/.test(normalized)
                          ? "voice-gate"
                          : /automation lab/.test(normalized)
                            ? "automation-lab"
                            : /client portal/.test(normalized)
                              ? "client-portal"
                              : /media studio/.test(normalized)
                                ? "media-studio"
                                : /calendar room/.test(normalized)
                                  ? "calendar-room"
                                  : /path node|yuka/.test(normalized)
                                    ? "path-node"
                                    : "tower"
      addDynamicCityFeature(kind, "voice")
      return
    }

    if (handleVoiceTeamFloorCommand(command)) {
      return
    }

    if (/come here|come to me|summon|bring/.test(normalized)) {
      const npcId = extractNpcIdFromCommand(command)
      handleCallNPC(npcId, { openWindow: true, instant: true })
      return
    }

    if (/call/.test(normalized) && /(npc|agent|brand|gpt|ceo)/.test(normalized)) {
      const npcId = extractNpcIdFromCommand(command)
      handleCallNPC(npcId, { openWindow: true })
      return
    }

    if (/follow me|stay with me|walk with me/.test(normalized)) {
      const npcId = extractNpcIdFromCommand(command)
      handleCallNPC(npcId, { openWindow: voiceAutoOpenWindows })
      setNpcMovementMode("summon")
      toast.success(`NPC ${npcId} is following your camera route`)
      return
    }

    if (/patrol|guard route|walk route/.test(normalized)) {
      setNpcMovementMode("patrol")
      handleScatterNPCs()
      toast.success("NPC patrol routing started")
      return
    }

    if (/freeze|stop all npc|hold position/.test(normalized)) {
      setNpcMovementMode("realistic")
      setNpcData((prev) => prev.map((npc) => ({ ...npc, targetPosition: npc.position?.clone?.() || npc.targetPosition, status: "Holding voice position" })))
      toast.success("NPCs holding position")
      return
    }

    // UI settings / visibility / Xbox mouse mode
    if (/open (ui )?settings|ui settings/.test(normalized)) {
      setShowUiSettings(true)
      toast.success("Opened UI Settings")
      return
    }
    if (/hide (all )?(the )?(ui|buttons|hud|interface)/.test(normalized)) {
      const next = { ...uiPrefs } as UiPrefs
      ;(Object.keys(next) as Array<keyof UiPrefs>).forEach((key) => { next[key] = false })
      handleUiPrefsChange(next)
      toast.success("All UI hidden — tap the ⚙ corner button or say 'show ui' to bring it back")
      return
    }
    if (/show (all )?(the )?(ui|buttons|hud|interface)/.test(normalized)) {
      const next = { ...uiPrefs } as UiPrefs
      ;(Object.keys(next) as Array<keyof UiPrefs>).forEach((key) => { next[key] = true })
      handleUiPrefsChange(next)
      toast.success("All UI restored")
      return
    }
    if (/mouse mode|virtual (mouse|cursor)/.test(normalized)) {
      setVirtualMouseMode((prev) => !prev)
      return
    }

    // Rooftop portals: "portal 3002", "open port 3001", "enter portal 3"
    const portalMatch = normalized.match(/(?:portal|port)\s*(3\d{3}|10|[1-9])\b/)
    if (portalMatch && /portal|port/.test(normalized)) {
      const raw = Number(portalMatch[1])
      const port = raw >= 3001 ? raw : 3000 + raw
      handleEnterPortal(port)
      return
    }

    // NPC group actions / formations with Yuka-style routes
    if (/circle (up|me|around)|form (a )?circle/.test(normalized)) { handleGroupAction("circle"); return }
    if (/grid (up|formation)|form (a )?grid/.test(normalized)) { handleGroupAction("grid"); return }
    if (/two rows|line up|form (a )?line/.test(normalized)) { handleGroupAction("rows"); return }
    if (/v formation|vee formation|form (a )?v\b/.test(normalized)) { handleGroupAction("vee"); return }
    if (/orbit (me|player)|circle route/.test(normalized)) { handleGroupAction("orbit"); return }
    if (/patrol (the )?floor|floor patrol|sweep (the )?floor/.test(normalized)) { handleGroupAction("patrol-floor"); return }
    if (/figure eight|figure 8|infinity route/.test(normalized)) { handleGroupAction("figure-eight"); return }
    if (/guard (the )?rooms|post guards|guard duty/.test(normalized)) { handleGroupAction("guard-rooms"); return }
    if (/floor tour|tour (the )?(floor|rooms)|room tour/.test(normalized)) { handleGroupAction("floor-tour"); return }
    if (/conga/.test(normalized)) { handleGroupAction("conga"); return }
    if (/stadium wave|the wave|do the wave/.test(normalized)) { handleGroupAction("stadium-wave"); return }
    if (/flash ?mob|dance party/.test(normalized)) { handleGroupAction("flash-mob"); return }
    if (/call (a )?meeting|team meeting|everyone meeting/.test(normalized)) { handleGroupAction("meeting"); return }
    if (/stop (all )?(routes|patrols)|clear (the )?paths/.test(normalized)) { handleGroupAction("stop-routes"); return }
    if (/unfreeze|resume all|thaw/.test(normalized)) { handleGroupAction("unfreeze"); return }
    if (/freeze all|freeze npcs|statue/.test(normalized)) { handleGroupAction("freeze"); return }

    if (/open (npc )?directory|edit npcs|npc editor|npc directory/.test(normalized)) {
      setShowNpcDirectory(true)
      toast.success("Opened NPC Directory editor")
      return
    }

    // Named room navigation: "go to the lobby", "take me to the arcade", "rooftop garden"
    const roomMatch = ROOM_DESTINATIONS.find((room) => room.keywords.some((keyword) => normalized.includes(keyword)))
    if (roomMatch && /go|take me|navigate|teleport|visit|room|walk to/.test(normalized)) {
      handleNavigateToRoom(roomMatch.id)
      return
    }

    // NPC gestures: "npc 3 wave", "wave all", "everyone cheer", "nod npc 5"
    const gestureMatch = GESTURE_TYPES.find((type) => normalized.includes(type))
    if (gestureMatch) {
      if (/all|everybody|everyone/.test(normalized)) {
        handleGestureNPCs([], gestureMatch)
      } else {
        handleGestureNPCs([extractNpcIdFromCommand(command)], gestureMatch)
      }
      return
    }

    if (/dance|dancing|celebrate/.test(normalized)) {
      if (/all|everybody|everyone/.test(normalized)) {
        handleDanceNPCs([])
      } else {
        handleDanceNPCs([extractNpcIdFromCommand(command)])
      }
      return
    }

    if (/walk|roam|scatter/.test(normalized)) {
      handleScatterNPCs()
      return
    }

    if (/gather|meet|meeting/.test(normalized)) {
      handleGatherNPCs()
      return
    }

    if (/brand|bsp app|brand gpt|pin brand/.test(normalized)) {
      const pinned = findWordpressWindowByText("bsp_app") || localPinnedBrandWindow()
      selectWordpressWindow(pinned)
      return
    }

    const windowMatch = findWordpressWindowByText(command)
    if (/open|show|load|view/.test(normalized) && windowMatch) {
      selectWordpressWindow(windowMatch)
      toast.success(`Opened [${windowMatch.tag}]`)
      return
    }

    if (/npm|pnpm|terminal|command/.test(normalized)) {
      const script = /feature/.test(normalized)
        ? "wp:features"
        : /suite/.test(normalized)
          ? "wp:suite"
          : /window/.test(normalized)
            ? "wp:windows"
            : /health|diagnostic/.test(normalized)
              ? "wp:diagnostics"
              : "wp:ping"
      runLocalNpmCommand(script)
      return
    }

    setVoiceStatus(`No exact match for: ${command}`)
    toast(`Voice command heard: ${command}`)
  }, [
    closeWordpressWindow,
    selectWindowByOffset,
    fetchWordpressWindows,
    fetchWordpressFeatures,
    extractNpcIdFromCommand,
    handleCallNPC,
    handleDanceNPCs,
    handleScatterNPCs,
    handleGatherNPCs,
    createVoiceNPC,
    handleImportTeamPreset,
    addDynamicCityFeature,
    handleVoiceTeamFloorCommand,
    findWordpressWindowByText,
    selectWordpressWindow,
    runLocalNpmCommand,
    addDictationNote,
    addProjectTaskFromVoice,
    toggleProjectTaskByVoice,
    importProjectTemplate,
    moveNpcByVoiceCommand,
    recordVoiceCommand,
    exportProjectBoard,
    handleNavigateToFloor,
    handleNavigateToRoom,
    handleGestureNPCs,
    handleGroupAction,
    handleEnterPortal,
    uiPrefs,
    handleUiPrefsChange,
    voiceAutoOpenWindows,
  ])

  const toggleVoiceAgent = useCallback(() => {
    if (typeof window === "undefined") return

    if (voiceAgentActive) {
      voiceRecognitionRef.current?.stop?.()
      voiceRecognitionRef.current = null
      setVoiceAgentActive(false)
      setVoiceStatus("Voice agent stopped")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Use Chrome or Edge for realtime voice commands.")
      setVoiceStatus("Browser speech recognition unavailable")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setVoiceAgentActive(true)
      setVoiceStatus("Realtime voice agent listening")
      toast.success("Voice agent active: say 'Brand GPT', 'next window', or 'NPC 3 come here'")
    }

    recognition.onresult = (event: any) => {
      const result = event.results?.[event.results.length - 1]?.[0]?.transcript || ""
      setVoiceTranscript(result)
      const normalizedResult = result.toLowerCase().trim()
      if (liveVoiceModeRef.current === "dictation" && !/^(command mode|stop dictation|voice command|close window|next window|previous window|brand gpt)/.test(normalizedResult)) {
        addDictationNote(result, "dictation")
      } else {
        handleVoiceCommand(result)
      }
    }

    recognition.onerror = (event: any) => {
      const message = event?.error ? `Voice error: ${event.error}` : "Voice recognition error"
      setVoiceStatus(message)
      if (event?.error !== "no-speech") toast.error(message)
    }

    recognition.onend = () => {
      if (voiceRecognitionRef.current) {
        try {
          recognition.start()
        } catch {
          setVoiceAgentActive(false)
          setVoiceStatus("Voice agent paused")
        }
      } else {
        setVoiceAgentActive(false)
      }
    }

    voiceRecognitionRef.current = recognition
    recognition.start()
  }, [voiceAgentActive, handleVoiceCommand, addDictationNote])


  const handleImportTeams = useCallback((payload: any) => {
    const teamAssignments: Array<{ name: string; members: Array<number | string>; skills?: string[]; roles?: Record<string, string> }> = []
    const npcAssignments = Array.isArray(payload?.npcs) ? payload.npcs : []

    if (Array.isArray(payload)) {
      payload.forEach((team) => teamAssignments.push({ name: team.name, members: team.npcIds || team.ids || team.members || [], skills: team.skills, roles: team.roles }))
    } else if (Array.isArray(payload?.teams)) {
      payload.teams.forEach((team: any) => teamAssignments.push({ name: team.name, members: team.npcIds || team.ids || team.members || [], skills: team.skills, roles: team.roles }))
    } else if (payload && typeof payload === "object") {
      Object.entries(payload).forEach(([name, members]) => {
        if (Array.isArray(members)) {
          teamAssignments.push({ name, members })
        }
      })
    }

    setNpcData((prev) =>
      prev.map((npc) => {
        const direct = npcAssignments.find((item: any) => item.id === npc.id || item.name === npc.name)
        const assignedTeam = teamAssignments.find((team) =>
          team.members.some((member) => member === npc.id || member === npc.name || member === String(npc.id)),
        )

        if (!direct && !assignedTeam) return npc

        return {
          ...npc,
          team: direct?.team || assignedTeam?.name || npc.team,
          role: direct?.role || assignedTeam?.roles?.[String(npc.id)] || npc.role,
          skills: direct?.skills || assignedTeam?.skills || npc.skills,
          floor: typeof direct?.floor === "number" ? direct.floor : npc.floor,
          status: direct?.status || "Imported team",
        }
      }),
    )
    toast.success("NPC teams imported")
  }, [])


  // Handle adding a new custom NPC
  const handleAddNPC = useCallback(
    (npc: NPCData) => {
      const enrichedNpc = addNPCFeatures([attachNpcShortcodeWindow(npc)])[0]
      // The live sync effect diffs this into the scene — only the new NPC spawns
      setNpcData((prev) => [...prev, enrichedNpc])
      toast.success(`Added new NPC: ${enrichedNpc.name}`)
    },
    [],
  )

  // Handle replacing an NPC with a GLB model
  const handleReplaceNPC = useCallback((id: number, newData: NPCData) => {
    // Update the NPC data in state
    setNpcData((prev) => prev.map((npc) => (npc.id === id ? attachNpcShortcodeWindow({ ...npc, ...newData }) : npc)))

    // Replace the NPC in the scene if the manager exists
    if (npcManagerRef.current && sceneRef.current) {
      const success = npcManagerRef.current.replaceNPC(id, attachNpcShortcodeWindow(newData))

      if (success) {
        toast.success(`Replaced ${newData.name} with 3D model`)
      } else {
        toast.error("Failed to replace NPC")
      }
    }
  }, [])

  // Handle removing a custom NPC
  const handleRemoveNPC = useCallback(
    (id: number) => {
      // Only allow removing custom NPCs.
      if (id <= DEFAULT_NPC_COUNT) {
        toast.error("Cannot remove default NPCs")
        return
      }

      // The live sync effect despawns just this NPC — no scene rebuild
      setNpcData((prev) => prev.filter((npc) => npc.id !== id))
      toast.success(`Removed NPC #${id}`)
    },
    [],
  )

  // Track sprites for billboard effect
  const registerSprite = useCallback((sprite: THREE.Sprite) => {
    spritesRef.current.push(sprite)
  }, [])

  // Handle joystick movement
  const handleMoveJoystick = useCallback((x: number, y: number) => {
    moveJoystickRef.current = { x, y }
  }, [])

  // Handle joystick rotation
  const handleRotateJoystick = useCallback((x: number) => {
    rotateJoystickRef.current = { x, y: 0 }
  }, [])

  // Add functions to handle make call and break call
  const handleMakeCall = useCallback(() => {
    if (npcManagerRef.current) {
      // Send NPCs to their tables
      npcData.forEach((npc) => {
        if (npc.tablePosition && npcManagerRef.current) {
          npcManagerRef.current.sendNPCToPosition(npc.id, npc.tablePosition)
        }
      })
      setIsAtTables(true)
      toast.success("NPCs are going to their tables")
    }
  }, [npcData])

  const handleBreakCall = useCallback(() => {
    if (npcManagerRef.current) {
      // Return NPCs to random roaming
      npcManagerRef.current.returnToRandomRoaming()
      setIsAtTables(false)
      toast.success("NPCs are returning to random roaming")
    }
  }, [])

  // Handle beforeunload to save position
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePosition()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [savePosition])

  // Create tables and add them to the scene
  useEffect(() => {
    if (!sceneRef.current) return

    // Create tables
    TABLE_POSITIONS.forEach((tablePos, index) => {
      const tableGroup = new THREE.Group()
      tableGroup.position.set(tablePos.position[0], tablePos.position[1], tablePos.position[2])
      tableGroup.rotation.set(tablePos.rotation[0], tablePos.rotation[1], tablePos.rotation[2])

      // Create table top
      const tableTopGeometry = new THREE.BoxGeometry(2, 0.1, 1.5)
      const tableTopMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown wood color
        roughness: 0.7,
        metalness: 0.2,
      })
      const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial)
      tableTop.position.y = 1 // Table height
      tableTop.castShadow = true
      tableTop.receiveShadow = true
      tableGroup.add(tableTop)

      // Create table legs
      const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1)
      const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.7,
        metalness: 0.2,
      })

      // Position of the four legs
      const legPositions = [
        [-0.9, 0.5, -0.7], // front left
        [0.9, 0.5, -0.7], // front right
        [-0.9, 0.5, 0.7], // back left
        [0.9, 0.5, 0.7], // back right
      ]

      legPositions.forEach((pos) => {
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        leg.position.set(pos[0], pos[1], pos[2])
        leg.castShadow = true
        leg.receiveShadow = true
        tableGroup.add(leg)
      })

      // Create a phone on the table
      const phoneBaseGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.2)
      const phoneBaseMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.8,
      })
      const phoneBase = new THREE.Mesh(phoneBaseGeometry, phoneBaseMaterial)
      phoneBase.position.set(0, 1.1, 0)
      phoneBase.castShadow = true
      phoneBase.receiveShadow = true
      tableGroup.add(phoneBase)

      // Create phone handset
      const handsetGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.1)
      const handsetMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.5,
        metalness: 0.7,
      })
      const handset = new THREE.Mesh(handsetGeometry, handsetMaterial)
      handset.position.set(0, 1.17, 0)
      handset.castShadow = true
      handset.receiveShadow = true
      tableGroup.add(handset)

      // Add table number
      const canvas = document.createElement("canvas")
      canvas.width = 128
      canvas.height = 64
      const context = canvas.getContext("2d")
      if (context) {
        context.fillStyle = "white"
        context.font = "bold 48px Arial"
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText(`${index + 1}`, 64, 32)

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(material)
        sprite.position.set(0, 1.5, 0)
        sprite.scale.set(0.5, 0.25, 1)
        tableGroup.add(sprite)
      }

      // Add userData for interaction
      tableGroup.userData = { type: "table", tableId: index + 1 }

      // Add to scene and store reference
      sceneRef.current.add(tableGroup)
      tablesRef.current.push(tableGroup)
    })

    return () => {
      // Clean up tables when component unmounts
      if (sceneRef.current) {
        tablesRef.current.forEach((table) => {
          sceneRef.current?.remove(table)
          table.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose()
              if (object.material instanceof THREE.Material) {
                object.material.dispose()
              } else if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose())
              }
            }
          })
        })
        tablesRef.current = []
      }
    }
  }, [])

  // Always-fresh handler references for the stable scene event listeners.
  // Assigned during render so wrappers registered once at mount always call
  // the latest logic without ever re-running the scene setup effect.
  const eventHandlersRef = useRef({
    handleKeyDown,
    handleKeyUp,
    handleClick,
    handleMouseMove,
    handleResize,
    handlePointerLockChange,
    handlePointerLockError,
    handleMovement,
  })
  eventHandlersRef.current = {
    handleKeyDown,
    handleKeyUp,
    handleClick,
    handleMouseMove,
    handleResize,
    handlePointerLockChange,
    handlePointerLockError,
    handleMovement,
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x8ecbff)
    createRealisticSky(scene)
    sceneRef.current = scene

    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 1.7, 25) // Start position
    cameraRef.current = camera

    // Initialize yaw object
    yawObject.current.position.set(0, 1.7, 25)
    scene.add(yawObject.current)

    // Try to load saved position
    loadPosition()

    // Initialize renderer
    const heavyNpcScene = npcDataRef.current.length >= 60 || r3fSpeedMode
    const renderer = new THREE.WebGLRenderer({
      antialias: !heavyNpcScene,
      powerPreference: "high-performance",
      alpha: false,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, heavyNpcScene ? 1.25 : 1.75))
    renderer.shadowMap.enabled = !heavyNpcScene
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Post processing: disabled in 60+ NPC speed mode to avoid double-render lag.
    try {
      if (!heavyNpcScene) {
        const composer = new EffectComposer(renderer)
        composer.addPass(new RenderPass(scene, camera))

        const bloomPass = new BloomPass(
          0.55,
          25,
          3,
          192,
        )
        composer.addPass(bloomPass)
        composerRef.current = composer
      } else {
        composerRef.current = null
      }
    } catch (error) {
      console.error("Error setting up post-processing:", error)
      composerRef.current = null
    }

    // Setup controls — CRITICAL GLITCH FIX:
    // PointerLockControls rotates whatever object it's given on every mousemove
    // while locked. Our own look code (handleMouseMove -> mouseRef -> move())
    // ALSO rotates yawObject. Both running at once double-applied every mouse
    // movement — the spinning/jerky "glitch moving around". We now hand PLC a
    // detached dummy object so it ONLY manages pointer lock/unlock, and our
    // movement hook is the single source of truth for rotation.
    const pointerLockProxy = new THREE.Object3D()
    const controls = new PointerLockControls(pointerLockProxy, renderer.domElement)
    controlsRef.current = controls

    // Create gallery
    const gallery = new Gallery(scene, LIVE_GALLERY_ITEMS, spritesRef)
    gallery.create()

    // Create interior walls with proper error handling
    try {
      const interiorWalls = new InteriorWalls(scene)
      interiorWalls.create()

      // Store wall meshes for collision detection
      const walls = interiorWalls.getWalls()
      wallsRef.current = walls

      // Add walls to collision objects
      collisionObjectsRef.current = [...collisionObjectsRef.current, ...walls]
    } catch (error) {
      console.error("Error creating interior walls:", error)
    }

    // Create multi-floor office building with stairs and rooms
    try {
      const officeBuilding = new OfficeBuilding(scene)
      officeBuilding.create()

      // Add building collision objects
      const buildingCollisions = officeBuilding.getCollisionObjects()
      collisionObjectsRef.current = [...collisionObjectsRef.current, ...buildingCollisions]

      console.log(`Office building created with ${TOTAL_FLOORS} floors`)
    } catch (error) {
      console.error("Error creating office building:", error)
    }

    // v28.6: build the expanded city district around the tower — road grid,
    // 45+ skyline buildings, brand towers, fountain plaza, central park,
    // market street, street lamps, cars, billboards, and the city gate.
    try {
      const cityDistrict = buildCityDistrict(scene)
      collisionObjectsRef.current = [...collisionObjectsRef.current, ...cityDistrict.collisions]
      console.log(`City district created: ${cityDistrict.collisions.length} solid structures`)
    } catch (error) {
      console.error("Error creating city district:", error)
    }

    // Build themed rooms + props on every floor (lobby, boardroom, arcade lounge,
    // focus pods, rooftop garden, helipad, teleport pads, room signs)
    let levelFeaturesGroup: THREE.Group | null = null
    try {
      levelFeaturesGroup = buildLevelFeatures(scene)
      console.log(`Level features created: ${ROOM_DESTINATIONS.length} named rooms`)
    } catch (error) {
      console.error("Error creating level features:", error)
    }

    // v28.6: the whole world exists now — rebuild the movement raycast list so
    // the outer building shell (minus the new front entrance) and the city
    // buildings are actually solid to the player.
    try {
      refreshCollisionObjects()
    } catch (error) {
      console.error("Error refreshing collision objects:", error)
    }

    // Collect all sprites for billboard effect
    scene.traverse((object) => {
      if (object instanceof THREE.Sprite) {
        spritesRef.current.push(object)
      }
    })

    // Update the NPC initialization with error handling
    try {
      // Initialize NPCs with improved pathing
      const npcManager = new NPCManager(scene, camera)

      // Update NPC data with improved paths - distribute NPCs across all 3 floors
      const updatedNPCData = npcDataRef.current.map((npc, index) => {
        // v28.6: outdoor city NPCs spawn around their home spot in the district
        // (plaza, park, market, downtown) instead of inside the building.
        if (npc.outdoor && npc.homeCenter) {
          const outdoorAngle = ((index % 14) / 14) * Math.PI * 2
          const outdoorRadius = 5 + (index % 4) * 3.5
          const spawnX = npc.homeCenter.x + Math.cos(outdoorAngle) * outdoorRadius
          const spawnZ = npc.homeCenter.z + Math.sin(outdoorAngle) * outdoorRadius
          return {
            ...npc,
            position: new THREE.Vector3(spawnX, 1, spawnZ),
            targetPosition: new THREE.Vector3(
              npc.homeCenter.x + Math.cos(outdoorAngle + 0.9) * (outdoorRadius + 4),
              1,
              npc.homeCenter.z + Math.sin(outdoorAngle + 0.9) * (outdoorRadius + 4),
            ),
            interactionRadius: npc.interactionRadius * 1.2,
            floor: 0,
          }
        }
        const floorIndex = typeof npc.floor === "number" ? Math.min(npc.floor, TOTAL_FLOORS - 1) : Math.floor(index / 8) % TOTAL_FLOORS
        const floorY = floorIndex * FLOOR_HEIGHT + 1
        const localIndex = index % 8
        const angle = (localIndex / 8) * Math.PI * 2
        const radius = 9 + (Math.floor(index / TOTAL_FLOORS) % 3) * 4
        const randomX = Math.cos(angle) * radius
        const randomZ = Math.sin(angle) * radius
        const randomTargetX = Math.cos(angle + 0.7) * (radius + 3)
        const randomTargetZ = Math.sin(angle + 0.7) * (radius + 3)

        return {
          ...npc,
          position: new THREE.Vector3(randomX, floorY, randomZ),
          targetPosition: new THREE.Vector3(randomTargetX, floorY, randomTargetZ),
          // Increase interaction radius for better detection in maze
          interactionRadius: npc.interactionRadius * 1.2,
          // Store floor info for NPC
          floor: floorIndex,
        }
      })

      npcManager.createNPCs(updatedNPCData)
      npcManagerRef.current = npcManager
      setActiveNpcs(new Set(updatedNPCData.map((npc) => npc.id))) // All NPCs active by default
      // Keep React state in step with the real spawn positions/floors, and
      // make sure the live-sync effect doesn't immediately re-process this.
      skipNextNpcSyncRef.current = true
      npcDataRef.current = updatedNPCData
      setNpcData(updatedNPCData)
    } catch (error) {
      console.error("Error initializing NPCs:", error)
      toast.error("There was an issue initializing NPCs. Some features may be limited.")
    }

    // Setup lighting
    const setupLighting = () => {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      ambientLightRef.current = ambientLight

      // Add directional light for shadows
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(0, 30, 0)
      directionalLight.castShadow = !heavyNpcScene
      directionalLight.shadow.mapSize.width = heavyNpcScene ? 512 : 2048
      directionalLight.shadow.mapSize.height = heavyNpcScene ? 512 : 2048
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 100
      directionalLight.shadow.camera.left = -50
      directionalLight.shadow.camera.right = 50
      directionalLight.shadow.camera.top = 50
      directionalLight.shadow.camera.bottom = -50
      scene.add(directionalLight)
      directionalLightRef.current = directionalLight

      // Add spotlights for each wall
      const createSpotlight = (x: number, y: number, z: number, intensity: number, targetPos: THREE.Vector3) => {
        const spotlight = new THREE.SpotLight(0xffffff, intensity)
        spotlight.position.set(x, y, z)
        spotlight.target.position.copy(targetPos)
        spotlight.castShadow = !heavyNpcScene
        spotlight.angle = 0.5
        spotlight.penumbra = 0.2
        spotlight.decay = 1
        spotlight.distance = 80
        spotlight.shadow.mapSize.width = heavyNpcScene ? 256 : 1024
        spotlight.shadow.mapSize.height = heavyNpcScene ? 256 : 1024
        scene.add(spotlight)
        scene.add(spotlight.target)
        return spotlight
      }

      createSpotlight(0, 15, -25, 0.948, new THREE.Vector3(0, 0, -30))
      createSpotlight(0, 15, 25, 0.948, new THREE.Vector3(0, 0, 30))
      createSpotlight(-25, 15, 0, 0.948, new THREE.Vector3(-30, 0, 0))
      createSpotlight(25, 15, 0, 0.948, new THREE.Vector3(30, 0, 0))
    }

    setupLighting()

    // Initialize exhibit hover effect
    if (cameraRef.current && sceneRef.current) {
      exhibitHoverEffectRef.current = new ExhibitHoverEffect(cameraRef.current, sceneRef.current, (item) => {
        if (item) {
          setTooltipInfo({ title: item.title, description: item.description })
          // Dispatch custom event to show tooltip
          window.dispatchEvent(new CustomEvent("exhibit-hover", { detail: true }))
        } else {
          setTooltipInfo(null)
          // Dispatch custom event to hide tooltip
          window.dispatchEvent(new CustomEvent("exhibit-hover", { detail: false }))
        }
      })
    }

    // Start the clock
    clockRef.current.start()
    lastFpsTimeRef.current = performance.now()

    // Animation loop
    let animationFrameId = 0
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Calculate delta time (clamped: after a background tab / long hitch the raw
      // delta can be seconds, which made NPCs teleport and physics spaz — a major glitch source)
      const currentTime = performance.now()
      const deltaTime = Math.min((currentTime - lastUpdateTimeRef.current) / 1000, 0.1)
      lastUpdateTimeRef.current = currentTime

      // Update player movement
      eventHandlersRef.current.handleMovement()

      // Walk-through portals: stepping into a rooftop doorway navigates this tab
      // to its localhost URL — no click needed. Small radius so you must actually
      // walk through the door, with a one-shot guard against double-fires.
      if (!portalTriggeredRef.current && yawObject.current) {
        const py = yawObject.current.position.y
        const roofY = ROOFTOP_FLOOR * FLOOR_HEIGHT
        if (Math.abs(py - (roofY + 1.7)) < 4) {
          const px = yawObject.current.position.x
          const pz = yawObject.current.position.z
          for (const portal of PORTAL_DESTINATIONS) {
            const dx = px - portal.x
            const dz = pz - portal.z
            if (dx * dx + dz * dz < PORTAL_TRIGGER_RADIUS * PORTAL_TRIGGER_RADIUS) {
              portalTriggeredRef.current = true
              savePosition()
              toast.success(`Walking through ${portal.label}…`)
              window.location.href = portal.url
              break
            }
          }
        }
      }

      // Update NPCs
      if (npcManagerRef.current && yawObject.current) {
        npcManagerRef.current.update(deltaTime, yawObject.current.position)
      }

      // NOTE: camera position/rotation are synced inside move() (via handleMovement)
      // including vertical pitch. The old duplicate copy here overwrote the pitch
      // with yawObject's flat rotation every frame, which broke/looked-glitchy
      // vertical mouse look. Removed.

      // Render the scene once. Composer replaces raw renderer instead of duplicating it.
      if (composerRef.current) {
        try {
          composerRef.current.render()
        } catch (error) {
          console.error("Error in composer rendering:", error)
          if (rendererRef.current && cameraRef.current && sceneRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current)
          }
        }
      } else if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }

      const detectedFloor = Math.max(0, Math.min(ROOFTOP_FLOOR, Math.round((yawObject.current.position.y - 1.7) / FLOOR_HEIGHT)))
      setCurrentFloor((prev) => (prev === detectedFloor ? prev : detectedFloor))
    }
    animate()

    // Event listeners — stable wrappers that always call the LATEST handler via ref.
    // This is the core fix for the scene-rebuild glitch: the effect below no longer
    // depends on handler identities, so pointer-lock changes, flying mode, voice
    // window minimize/restore, and NPC edits can never tear the 3D world down.
    const onKeyDown = (e: KeyboardEvent) => eventHandlersRef.current.handleKeyDown(e)
    const onKeyUp = (e: KeyboardEvent) => eventHandlersRef.current.handleKeyUp(e)
    const onClick = (e: MouseEvent) => eventHandlersRef.current.handleClick(e)
    const onMouseMove = (e: MouseEvent) => eventHandlersRef.current.handleMouseMove(e)
    const onResize = () => eventHandlersRef.current.handleResize()
    const onPointerLockChange = () => eventHandlersRef.current.handlePointerLockChange()
    const onPointerLockError = (e: Event) => eventHandlersRef.current.handlePointerLockError(e)

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("click", onClick)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("resize", onResize)
    document.addEventListener("pointerlockchange", onPointerLockChange)
    document.addEventListener("pointerlockerror", onPointerLockError)

    // Show initial instructions
    toast.success("Click to start exploring. WASD to move, Q/E to turn. Press N for NPC Directory, H for controls, F to fly.", {
      duration: 5000,
    })

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("click", onClick)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("pointerlockchange", onPointerLockChange)
      document.removeEventListener("pointerlockerror", onPointerLockError)

      if (levelFeaturesGroup) {
        scene.remove(levelFeaturesGroup)
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
      }

      if (npcManagerRef.current) {
        npcManagerRef.current.dispose()
      }

      if (exhibitHoverEffectRef.current) {
        exhibitHoverEffectRef.current.dispose()
      }

      // Clear sprite references
      spritesRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r3fSpeedMode])

  // ── Live NPC directory sync ──────────────────────────────────────────────
  // Whenever npcData changes (directory edits, voice-created NPCs, team imports),
  // diff it into the live manager instead of rebuilding the scene: names, colors,
  // speeds, floors update in place; new NPCs spawn; removed NPCs despawn.
  useEffect(() => {
    if (skipNextNpcSyncRef.current) {
      skipNextNpcSyncRef.current = false
      return
    }
    if (npcManagerRef.current) {
      try {
        npcManagerRef.current.syncNPCs(npcData)
        setActiveNpcs(npcManagerRef.current.getActiveNPCIds())
      } catch (error) {
        console.error("Error syncing NPC directory into the live scene:", error)
      }
    }
  }, [npcData])

  // ── NPC directory persistence (localStorage) ─────────────────────────────
  const NPC_DIRECTORY_STORAGE_KEY = "v0map-npc-directory-v28"

  // Load saved directory edits on mount and merge onto defaults by id
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NPC_DIRECTORY_STORAGE_KEY)
      if (!saved) return
      const overrides: Array<Partial<NPCData> & { id: number }> = JSON.parse(saved)
      if (!Array.isArray(overrides) || overrides.length === 0) return
      setNpcData((prev) =>
        prev.map((npc) => {
          const override = overrides.find((item) => item.id === npc.id)
          if (!override) return npc
          return {
            ...npc,
            name: override.name ?? npc.name,
            color: override.color ?? npc.color,
            role: override.role ?? npc.role,
            team: override.team ?? npc.team,
            bio: override.bio ?? npc.bio,
            status: override.status ?? npc.status,
            speed: typeof override.speed === "number" ? override.speed : npc.speed,
            floor: typeof override.floor === "number" ? override.floor : npc.floor,
            glbUrl: override.glbUrl ?? npc.glbUrl,
            shortcodeTag: override.shortcodeTag ?? npc.shortcodeTag,
            shortcode: override.shortcode ?? npc.shortcode,
            dialogue: Array.isArray(override.dialogue) ? override.dialogue : npc.dialogue,
          }
        }),
      )
      toast.success("Loaded your saved NPC directory edits")
    } catch (error) {
      console.error("Failed to load saved NPC directory:", error)
    }
  }, [])

  const persistNpcDirectory = useCallback((list: NPCData[]) => {
    try {
      const serializable = list.map((npc) => ({
        id: npc.id,
        name: npc.name,
        color: npc.color,
        role: npc.role,
        team: npc.team,
        bio: npc.bio,
        status: npc.status,
        speed: npc.speed,
        floor: npc.floor,
        glbUrl: npc.glbUrl,
        shortcodeTag: npc.shortcodeTag,
        shortcode: npc.shortcode,
        dialogue: npc.dialogue,
      }))
      localStorage.setItem(NPC_DIRECTORY_STORAGE_KEY, JSON.stringify(serializable))
    } catch (error) {
      console.error("Failed to save NPC directory:", error)
    }
  }, [])

  // Directory editor -> state + live scene + persistence, in one place
  const handleDirectoryChange = useCallback((nextList: NPCData[]) => {
    setNpcData(nextList)
    persistNpcDirectory(nextList)
  }, [persistNpcDirectory])

  const handleDirectoryReset = useCallback(() => {
    try {
      localStorage.removeItem(NPC_DIRECTORY_STORAGE_KEY)
    } catch {}
    const defaults = createDefaultNPCs()
    setNpcData(defaults)
    toast.success("NPC directory reset to defaults")
  }, [])

  // (Gesture + named-room handlers are defined earlier, near the other NPC handlers,
  // so handleVoiceCommand can reference them safely.)

  // Add a new function to handle editing NPC names
  const handleEditNPC = useCallback((id: number, newName: string, newStreamlitUrl: string) => {
    const shortcodeTag = newStreamlitUrl.startsWith("[")
      ? newStreamlitUrl.replace(/^\[/, "").replace(/\].*$/, "").trim()
      : newStreamlitUrl.includes("v0map_shortcode_tag=")
        ? new URL(newStreamlitUrl, window.location.origin).searchParams.get("v0map_shortcode_tag") || getNpcShortcodeTag({ id, name: newName })
        : getNpcShortcodeTag({ id, name: newName })
    const wordpressUrl = shortcodeRenderUrl(shortcodeTag)

    // Update the NPC data in state
    setNpcData((prev) =>
      prev.map((npc) =>
        npc.id === id
          ? { ...npc, name: newName, shortcodeTag, shortcode: `[${shortcodeTag}]`, wordpressUrl, streamlitUrl: wordpressUrl }
          : npc,
      ),
    )

    toast.success(`Updated NPC: ${newName}`)
  }, [])

  // Generate a position that doesn't collide with walls
  const generateSafePosition = useCallback((walls: THREE.Object3D[]) => {
    const raycaster = new THREE.Raycaster()
    const roomSize = 50
    let attempts = 0
    let position

    // Try to find a position that doesn't collide with walls
    do {
      position = new THREE.Vector3(Math.random() * roomSize - roomSize / 2, 1, Math.random() * roomSize - roomSize / 2)

      // Check all directions for collisions
      let collides = false
      const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
      ]

      for (const dir of directions) {
        raycaster.set(position, dir.normalize())
        const intersects = raycaster.intersectObjects(walls, true)
        if (intersects.length > 0 && intersects[0].distance < 1.5) {
          collides = true
          break
        }
      }

      if (!collides) break

      attempts++
    } while (attempts < 20)

    return position
  }, [])


  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="absolute inset-0 cursor-pointer" />

      {/* Loading indicator */}
      {(!modelsLoaded || !animationsLoaded) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading 3D models and animations...</p>
          </div>
        </div>
      )}

      {/* NPC Controls */}
      <NPCControls
        npcs={npcData}
        activeNpcs={activeNpcs}
        onToggleNpc={handleToggleNpc}
        onToggleAll={handleToggleAllNpcs}
        onCallMeeting={handleToggleMeeting}
        onOpenAllStreamlit={handleOpenAllStreamlit}
        onAddNPC={handleAddNPC}
        onRemoveNPC={handleRemoveNPC}
        onReplaceNPC={handleReplaceNPC}
        onEditNPC={handleEditNPC}
        onCallNPC={handleCallNPC}
        onMakeCall={handleMakeCall} // Add this line
        onBreakCall={handleBreakCall} // Add this line
        onScatterNPCs={handleScatterNPCs}
        onGatherNPCs={handleGatherNPCs}
        onSendToFloor={handleSendToFloor}
        onNavigateToFloor={handleNavigateToFloor}
        onCallTeam={handleCallTeam}
        onToggleTeam={handleToggleTeam}
        onOpenTeamApps={handleOpenTeamApps}
        onImportTeams={handleImportTeams}
        isMeetingActive={isMeetingActive}
        isAtTables={isAtTables} // Add this line
        currentFloor={currentFloor}
        defaultNpcCount={DEFAULT_NPC_COUNT}
      />

      {/* Enhanced Flying Mode Control */}
      {uiPrefs.flyingControls && (
        <FlyingModeControl
          isEnabled={flyingMode}
          onToggle={toggleFlyingMode}
          onFlyUp={flyUp}
          onFlyDown={flyDown}
          onReset={resetHeight}
        />
      )}

      {/* Pro Mini Map: floor tabs, layer toggles, live NPC dots, tap-to-teleport */}
      {uiPrefs.miniMap && (
        <MiniMapPro
          className="top-32"
          getPlayer={() =>
            yawObject.current
              ? {
                  x: yawObject.current.position.x,
                  y: yawObject.current.position.y,
                  z: yawObject.current.position.z,
                  rotationY: yawObject.current.rotation.y,
                }
              : null
          }
          getNpcSnapshot={() => npcManagerRef.current?.getSnapshot() ?? []}
          npcColors={Object.fromEntries(npcData.map((npc) => [npc.id, npc.color]))}
          onNavigateRoom={(roomId) => handleNavigateToRoom(roomId)}
          onEnterPortal={(port) => handleEnterPortal(port)}
        />
      )}

      {/* Add this component to the JSX return section, after the MiniMap component */}
      {uiPrefs.controllerStatus && <ControllerStatus isConnected={externalControllerActive} />}

      {/* Exhibit Info Card */}
      {selectedItem && (
        <InfoCard
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null)
            if (controlsRef.current && isControlsEnabled) {
              try {
                controlsRef.current.lock()
              } catch (error) {
                console.error("Failed to lock pointer after closing info card:", error)
              }
            }
          }}
        />
      )}

      {/* NPC Conversation Card */}
      {selectedNPC && (
        <InfoCard
          item={{
            title: selectedNPC.name,
            description: `${selectedNPC.name} opens a live WordPress shortcode window pulled from the site API.`,
            shortcode: selectedNPC.shortcode,
            liveUrl: selectedNPC.wordpressUrl || selectedNPC.streamlitUrl,
            streamlitUrl: selectedNPC.wordpressUrl || selectedNPC.streamlitUrl,
          }}
          onClose={() => {
            setSelectedNPC(null)
            if (controlsRef.current && isControlsEnabled) {
              try {
                controlsRef.current.lock()
              } catch (error) {
                console.error("Failed to lock pointer after closing NPC conversation:", error)
              }
            }
          }}
          isNPC={true}
        />
      )}


      {/* Live NPC Directory Editor (press N or say "open directory") */}
      {showNpcDirectory && (
        <NpcDirectoryEditor
          npcs={npcData}
          floors={ROOFTOP_FLOOR + 1}
          onChange={handleDirectoryChange}
          onReset={handleDirectoryReset}
          onClose={() => setShowNpcDirectory(false)}
          onCallNpc={(id) => handleCallNPC(id, { openWindow: false })}
          onGestureNpc={(id) => handleGestureNPCs([id], "wave")}
        />
      )}

      {/* UI Settings: hide each or all HUD elements (persisted) */}
      {showUiSettings && (
        <UiSettingsPanel prefs={uiPrefs} onChange={handleUiPrefsChange} onClose={() => setShowUiSettings(false)} />
      )}

      {/* Always-visible gear so you can restore UI after Hide All (bottom-right corner pill) */}
      <button
        onClick={() => setShowUiSettings((prev) => !prev)}
        className="fixed bottom-3 right-3 z-[85] rounded-full border border-white/25 bg-slate-950/80 p-2.5 text-base shadow-lg backdrop-blur hover:bg-slate-800"
        aria-label="UI settings"
        title="UI Settings — show/hide any HUD element"
      >
        ⚙️
      </button>

      {/* Xbox virtual mouse cursor + mini keyboard (press RSB on the controller) */}
      <VirtualCursor enabled={virtualMouseMode} onExit={() => setVirtualMouseMode(false)} />

      {/* Closable City Voice Commands tab */}
      <div className="fixed right-4 top-24 z-40 w-[min(390px,calc(100vw-2rem))] text-white">
        {showVoiceCommandTab && uiPrefs.voicePanel ? (
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-3xl border border-cyan-300/25 bg-slate-950/92 p-4 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-cyan-200"><Map size={16} /> City Voice Commands</div>
                <div className="mt-1 text-xs text-slate-300">Create NPCs, import teams, summon agents, build city features, and open live WP shortcode windows by voice.</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => setShowUiSettings(true)} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="UI settings" title="UI Settings — hide any button">⚙️</button>
                <button onClick={() => setShowVoiceCommandTab(false)} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Close city voice commands"><PanelRightClose size={18} /></button>
              </div>
            </div>

            {uiPrefs.quickActions && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <button onClick={() => setShowNpcDirectory(true)} className="rounded-xl bg-cyan-500 px-3 py-2 font-black text-slate-950 hover:bg-cyan-400"><Users size={14} className="inline" /> NPC Directory (N)</button>
              <button onClick={() => createVoiceNPC("create npc named Voice Builder with shortcode aisc_tools")} className="rounded-xl bg-emerald-500 px-3 py-2 font-black text-slate-950 hover:bg-emerald-400"><PlusCircle size={14} className="inline" /> Create NPC</button>
              <button onClick={() => handleImportTeamPreset(25)} className="rounded-xl bg-white/10 px-3 py-2 font-bold hover:bg-white/20"><Users size={14} className="inline" /> Team 25</button>
              <button onClick={() => handleImportTeamPreset(50)} className="rounded-xl bg-white/10 px-3 py-2 font-bold hover:bg-white/20"><Users size={14} className="inline" /> Team 50</button>
              <button onClick={() => handleImportTeamPreset(100)} className="rounded-xl bg-white/10 px-3 py-2 font-bold hover:bg-white/20"><Users size={14} className="inline" /> Team 100</button>
              <button onClick={() => addDynamicCityFeature("tower")} className="rounded-xl bg-indigo-500 px-3 py-2 font-black text-white hover:bg-indigo-400"><Building2 size={14} className="inline" /> AI Tower</button>
              <button onClick={() => addDynamicCityFeature("api-core")} className="rounded-xl bg-fuchsia-500 px-3 py-2 font-black text-white hover:bg-fuchsia-400"><Database size={14} className="inline" /> API Core</button>
              <button onClick={() => addDynamicCityFeature("voice-stage")} className="rounded-xl bg-orange-500 px-3 py-2 font-black text-white hover:bg-orange-400"><Mic size={14} className="inline" /> Voice Stage</button>
              <button onClick={() => addDynamicCityFeature("path-node")} className="rounded-xl bg-yellow-400 px-3 py-2 font-black text-slate-950 hover:bg-yellow-300"><Wand2 size={14} className="inline" /> Yuka Node</button>
            </div>
            )}

            {/* Named rooms: teleport across every floor's new level features */}
            {uiPrefs.roomsSection && (
            <div className="mt-3 rounded-2xl bg-black/30 p-3">
              <button onClick={() => toggleSection("rooms")} className="flex w-full items-center justify-between text-xs font-black uppercase text-slate-300 hover:text-white">
                <span>Rooms · say “go to the lobby”</span>
                <span>{collapsedSections["rooms"] ? "▸" : "▾"}</span>
              </button>
              {!collapsedSections["rooms"] && (
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                {ROOM_DESTINATIONS.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleNavigateToRoom(room.id)}
                    className="truncate rounded-lg px-2 py-1.5 text-left font-bold hover:bg-white/10"
                    style={{ color: room.color }}
                    title={`${room.description} (${room.floor === ROOFTOP_FLOOR ? "Rooftop" : `Floor ${room.floor + 1}`})`}
                  >
                    {room.name}
                  </button>
                ))}
              </div>
              )}
            </div>
            )}

            {/* NPC gestures: quick crowd actions, or say "npc 3 wave" */}
            {uiPrefs.gesturesSection && (
            <div className="mt-3 rounded-2xl bg-black/30 p-3">
              <button onClick={() => toggleSection("gestures")} className="flex w-full items-center justify-between text-xs font-black uppercase text-slate-300 hover:text-white">
                <span>Gestures · say “npc 3 wave” or “cheer all”</span>
                <span>{collapsedSections["gestures"] ? "▸" : "▾"}</span>
              </button>
              {!collapsedSections["gestures"] && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                {GESTURE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleGestureNPCs([], type)}
                    className="rounded-full bg-white/10 px-3 py-1.5 font-bold capitalize hover:bg-fuchsia-500/60"
                  >
                    {type} all
                  </button>
                ))}
              </div>
              )}
            </div>
            )}

            {/* NPC group actions: formations + Yuka-style patrol routes with visible paths */}
            {uiPrefs.groupActionsSection && (
            <div className="mt-3 rounded-2xl bg-black/30 p-3">
              <button onClick={() => toggleSection("group")} className="flex w-full items-center justify-between text-xs font-black uppercase text-slate-300 hover:text-white">
                <span>Group Actions · Yuka routes draw glowing paths</span>
                <span>{collapsedSections["group"] ? "▸" : "▾"}</span>
              </button>
              {!collapsedSections["group"] && (
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
                <button onClick={() => handleGroupAction("circle")} className="rounded-lg bg-cyan-500/80 px-2 py-2 font-black text-slate-950 hover:bg-cyan-400">Circle Me</button>
                <button onClick={() => handleGroupAction("grid")} className="rounded-lg bg-cyan-500/80 px-2 py-2 font-black text-slate-950 hover:bg-cyan-400">Grid Up</button>
                <button onClick={() => handleGroupAction("rows")} className="rounded-lg bg-cyan-500/80 px-2 py-2 font-black text-slate-950 hover:bg-cyan-400">Two Rows</button>
                <button onClick={() => handleGroupAction("vee")} className="rounded-lg bg-cyan-500/80 px-2 py-2 font-black text-slate-950 hover:bg-cyan-400">V Form</button>
                <button onClick={() => handleGroupAction("orbit")} className="rounded-lg bg-emerald-500/80 px-2 py-2 font-black text-slate-950 hover:bg-emerald-400">Orbit Me</button>
                <button onClick={() => handleGroupAction("patrol-floor")} className="rounded-lg bg-emerald-500/80 px-2 py-2 font-black text-slate-950 hover:bg-emerald-400">Patrol Floor</button>
                <button onClick={() => handleGroupAction("figure-eight")} className="rounded-lg bg-emerald-500/80 px-2 py-2 font-black text-slate-950 hover:bg-emerald-400">Figure 8</button>
                <button onClick={() => handleGroupAction("guard-rooms")} className="rounded-lg bg-indigo-500/80 px-2 py-2 font-black text-white hover:bg-indigo-400">Guard Rooms</button>
                <button onClick={() => handleGroupAction("floor-tour")} className="rounded-lg bg-amber-500/80 px-2 py-2 font-black text-slate-950 hover:bg-amber-400">Floor Tour</button>
                <button onClick={() => handleGroupAction("conga")} className="rounded-lg bg-amber-500/80 px-2 py-2 font-black text-slate-950 hover:bg-amber-400">Conga 💃</button>
                <button onClick={() => handleGroupAction("stadium-wave")} className="rounded-lg bg-amber-500/80 px-2 py-2 font-black text-slate-950 hover:bg-amber-400">Stadium Wave</button>
                <button onClick={() => handleGroupAction("flash-mob")} className="rounded-lg bg-amber-500/80 px-2 py-2 font-black text-slate-950 hover:bg-amber-400">Flash Mob</button>
                <button onClick={() => handleGroupAction("meeting")} className="rounded-lg bg-amber-500/80 px-2 py-2 font-black text-slate-950 hover:bg-amber-400">Call Meeting</button>
                <button onClick={handleGatherNPCs} className="rounded-lg bg-indigo-500/80 px-2 py-2 font-black text-white hover:bg-indigo-400">Gather All</button>
                <button onClick={handleScatterNPCs} className="rounded-lg bg-indigo-500/80 px-2 py-2 font-black text-white hover:bg-indigo-400">Scatter</button>
                <button onClick={() => handleDanceNPCs([])} className="rounded-lg bg-fuchsia-500/80 px-2 py-2 font-black text-white hover:bg-fuchsia-400">Dance All</button>
                <button onClick={() => handleGestureNPCs([], "cheer")} className="rounded-lg bg-fuchsia-500/80 px-2 py-2 font-black text-white hover:bg-fuchsia-400">Cheer All</button>
                <button onClick={() => handleGroupAction("freeze")} className="rounded-lg bg-sky-300/90 px-2 py-2 font-black text-slate-950 hover:bg-sky-200">Freeze</button>
                <button onClick={() => handleGroupAction("unfreeze")} className="rounded-lg bg-sky-300/90 px-2 py-2 font-black text-slate-950 hover:bg-sky-200">Unfreeze</button>
                <button onClick={() => handleGroupAction("stop-routes")} className="rounded-lg bg-rose-500/80 px-2 py-2 font-black text-white hover:bg-rose-400">Stop Routes</button>
              </div>
              )}
            </div>
            )}

            {/* Rooftop door portals — same-tab navigation to local apps */}
            {uiPrefs.portalsSection && (
            <div className="mt-3 rounded-2xl bg-black/30 p-3">
              <button onClick={() => toggleSection("portals")} className="flex w-full items-center justify-between text-xs font-black uppercase text-slate-300 hover:text-white">
                <span>Roof Portals · walk through a door or tap</span>
                <span>{collapsedSections["portals"] ? "▸" : "▾"}</span>
              </button>
              {!collapsedSections["portals"] && (
              <div className="mt-2 grid grid-cols-5 gap-1.5 text-[11px]">
                {PORTAL_DESTINATIONS.map((portal) => (
                  <button
                    key={portal.port}
                    onClick={() => handleEnterPortal(portal.port)}
                    className="rounded-lg px-1 py-2 font-black hover:bg-white/10"
                    style={{ color: portal.color, border: `1px solid ${portal.color}55` }}
                    title={`Navigate this tab to ${portal.url}`}
                  >
                    {portal.port}
                  </button>
                ))}
              </div>
              )}
            </div>
            )}

            <div className="mt-3 rounded-2xl bg-black/30 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-slate-300">
                <span>Say these</span>
                <span>{voiceCreatedNpcCount} voice NPCs · {dynamicCityFeatures.length} city features</span>
              </div>
              <div className="max-h-44 space-y-1 overflow-auto pr-1 text-xs text-slate-200">
                {CITY_VOICE_COMMANDS.map((command) => (
                  <button key={command} onClick={() => handleVoiceCommand(command)} className="block w-full rounded-lg px-2 py-1 text-left hover:bg-white/10">“{command}”</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowVoiceCommandTab(true)} className="float-right inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-3 font-black text-slate-950 shadow-lg hover:bg-cyan-400"><PanelRightOpen size={18} /> Voice Commands</button>
        )}
      </div>

      {/* Project Management / Daily Checklist / Habit Tracker Window */}
      {showProjectWindow && (
        <div className={`fixed ${projectWindowWide ? "inset-4" : "right-4 top-24 w-[min(720px,calc(100vw-2rem))]"} z-[65] overflow-hidden rounded-3xl border border-white/20 bg-slate-950/95 text-white shadow-2xl backdrop-blur`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-600 to-indigo-700 p-4">
            <div>
              <div className="flex items-center gap-2 text-lg font-black"><ClipboardList size={20} /> Project Manager + Daily Checklist</div>
              <div className="mt-1 text-xs text-cyan-50">Realtime voice dictation · checklist · importable habit tracker · NPC movement notes</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => importProjectTemplate("project")} className="rounded-xl bg-white/15 px-3 py-2 text-xs font-black hover:bg-white/25">Import Project</button>
              <button onClick={() => importProjectTemplate("habit")} className="rounded-xl bg-white/15 px-3 py-2 text-xs font-black hover:bg-white/25">Import Habits</button>
              <button onClick={() => setProjectWindowWide((value) => !value)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950 hover:bg-cyan-50">{projectWindowWide ? "Normal" : "Wide"}</button>
              <button onClick={() => setShowProjectWindow(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 hover:bg-red-700" aria-label="Close project manager"><X size={18} /></button>
            </div>
          </div>

          <div className={`${projectWindowWide ? "max-h-[calc(100vh-120px)]" : "max-h-[72vh]"} overflow-auto p-4`}>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-3"><div className="text-xs uppercase text-slate-300">Voice mode</div><div className="mt-1 text-lg font-black">{liveVoiceMode}</div></div>
              <div className="rounded-2xl bg-white/10 p-3"><div className="text-xs uppercase text-slate-300">Open tasks</div><div className="mt-1 text-lg font-black">{projectTasks.filter((task) => task.status !== "done").length}</div></div>
              <div className="rounded-2xl bg-white/10 p-3"><div className="text-xs uppercase text-slate-300">Done today</div><div className="mt-1 text-lg font-black">{habitItems.filter((habit) => habit.doneToday).length}/{habitItems.length}</div></div>
              <div className="rounded-2xl bg-white/10 p-3"><div className="text-xs uppercase text-slate-300">NPC move mode</div><div className="mt-1 text-lg font-black">{npcMovementMode}</div></div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 text-slate-900">
                <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-black"><ListTodo size={18} /> Daily To-Do</h3><button onClick={() => addProjectTaskFromVoice("add task Review WordPress shortcode styling")} className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white">+ Task</button></div>
                <div className="space-y-2">
                  {projectTasks.map((task, index) => (
                    <button key={task.id} onClick={() => setProjectTasks((prev) => prev.map((item) => item.id === task.id ? { ...item, status: item.status === "done" ? "todo" : "done" } : item))} className="block w-full rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50">
                      <div className="flex items-start gap-2"><CheckSquare2 size={16} className={task.status === "done" ? "text-emerald-600" : "text-slate-400"} /><div className="min-w-0"><div className={`font-bold ${task.status === "done" ? "line-through text-slate-400" : "text-slate-900"}`}>{index + 1}. {task.title}</div><div className="text-[11px] uppercase text-slate-500">{task.priority} · {task.source} · {task.status}</div></div></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 text-slate-900">
                <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-black"><CalendarCheck size={18} /> Habit Tracker</h3><button onClick={() => importProjectTemplate("habit")} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white">Import</button></div>
                <div className="space-y-2">
                  {habitItems.map((habit) => (
                    <button key={habit.id} onClick={() => setHabitItems((prev) => prev.map((item) => item.id === habit.id ? { ...item, doneToday: !item.doneToday, streak: item.doneToday ? Math.max(0, item.streak - 1) : item.streak + 1 } : item))} className="block w-full rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-3"><div><div className="font-bold">{habit.name}</div><div className="text-xs text-slate-500">Streak {habit.streak}/{habit.target} days · {habit.source}</div></div><span className={`rounded-full px-2 py-1 text-xs font-black ${habit.doneToday ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{habit.doneToday ? "Done" : "Open"}</span></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 text-slate-900">
                <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-black"><MessageSquareText size={18} /> Live Dictation</h3><button onClick={() => setLiveVoiceMode(liveVoiceMode === "dictation" ? "command" : "dictation")} className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-bold text-white">{liveVoiceMode === "dictation" ? "Command" : "Dictate"}</button></div>
                <div className="mb-3 rounded-xl bg-slate-100 p-3 text-xs text-slate-600">Say “dictation mode”, then speak notes. Say “command mode” to control NPCs again.</div>
                <div className="max-h-64 space-y-2 overflow-auto pr-1">
                  {dictationNotes.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No dictated notes yet.</div> : dictationNotes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="text-sm font-bold">{note.text}</div>
                      <div className="mt-1 text-[11px] uppercase text-slate-500">{note.source} · {note.createdAt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-black"><Target size={16} /> Voice movement shortcuts</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {["NPC 1 come here", "NPC 2 follow me", "move NPC 2 left", "NPC 3 patrol route", "freeze all NPCs", "add automation lab", "add project board", "export project board"].map((sample) => (
                  <button key={sample} onClick={() => handleVoiceCommand(sample)} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">“{sample}”</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Joysticks */}
      {uiPrefs.joysticks && showJoysticks && (
        <div className="fixed bottom-20 left-0 right-0 z-10 flex justify-between px-4">
          <Joystick onMove={handleMoveJoystick} className="ml-4" externalControllerActive={externalControllerActive} />
          <RotationJoystick
            onRotate={handleRotateJoystick}
            className="mr-4"
            externalControllerActive={externalControllerActive}
          />
        </div>
      )}

      {/* Menu Button */}
      <button
        onClick={() => setIsIframeMenuOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 z-10"
      >
        View Live Shortcodes
      </button>

      {/* Pinned Brand GPT Button */}
      <button
        onClick={() => {
          const pinned = wordpressWindows.find((windowItem) => windowItem.tag === PINNED_BRAND_WINDOW.tag) || localPinnedBrandWindow()
          selectWordpressWindow(pinned)
        }}
        className="fixed bottom-4 left-4 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-lg hover:from-fuchsia-700 hover:to-pink-700 transition-all duration-200 z-10 flex items-center gap-2 font-bold"
      >
        <span className="text-xl">★</span>
        Brand GPT
      </button>
      {/* Floating realtime voice agent blob */}
      <div className={`fixed z-40 rounded-3xl border border-white/20 bg-slate-950/90 text-white shadow-2xl backdrop-blur transition-all ${voiceAgentMinimized ? "pointer-events-none right-4 top-4 w-auto p-1 opacity-90" : "bottom-20 right-4 w-[min(380px,calc(100vw-2rem))] p-3"}`}>
        <div className={`flex items-center gap-3 ${voiceAgentMinimized ? "pointer-events-auto" : ""}`}>
          <button
            onClick={toggleVoiceAgent}
            className={`relative flex ${voiceAgentMinimized ? "h-10 w-10" : "h-14 w-14"} shrink-0 items-center justify-center rounded-full shadow-lg transition ${
              voiceAgentActive ? "bg-emerald-500 text-slate-950" : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
            aria-label="Toggle realtime voice agent"
          >
            {voiceAgentActive ? <Mic size={26} /> : <MicOff size={26} />}
            {voiceAgentActive && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/40" />}
          </button>
          {!voiceAgentMinimized && (
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-black">
                <Bot size={16} /> Realtime Voice Agent
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${voiceAgentActive ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-slate-200"}`}>
                  {voiceAgentActive ? "ACTIVE" : "OFF"}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-200">{liveVoiceMode}</span>
                <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] text-cyan-100">Floor {currentFloor === ROOFTOP_FLOOR ? "Roof" : currentFloor + 1}</span>
              </div>
              <div className="mt-1 truncate text-xs text-slate-300">{voiceStatus}</div>
              {voiceTranscript && <div className="mt-1 truncate text-xs text-emerald-200">“{voiceTranscript}”</div>}
            </div>
          )}
          <button onClick={() => setVoiceAgentMinimized((value) => !value)} className="pointer-events-auto rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Minimize realtime voice agent">
            {voiceAgentMinimized ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
          </button>
        </div>
        {!voiceAgentMinimized && (
          <>
            {uiPrefs.quickCommandBar && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <button onClick={() => handleVoiceCommand("brand gpt")} className="rounded-xl bg-white/10 px-2 py-2 font-bold hover:bg-white/20">Brand GPT</button>
              <button onClick={() => handleVoiceCommand("next window")} className="rounded-xl bg-white/10 px-2 py-2 font-bold hover:bg-white/20">Next Window</button>
              <button onClick={() => handleVoiceCommand("npc 1 come here")} className="rounded-xl bg-white/10 px-2 py-2 font-bold hover:bg-white/20">NPC 1 Come</button>
              <button onClick={() => handleVoiceCommand("dance all")} className="rounded-xl bg-white/10 px-2 py-2 font-bold hover:bg-white/20">Dance All</button>
              <button onClick={() => handleVoiceCommand("wave all")} className="rounded-xl bg-white/10 px-2 py-2 font-bold hover:bg-white/20">Wave All</button>
              <button onClick={() => handleVoiceCommand("go to the lobby")} className="rounded-xl bg-white/10 px-2 py-2 font-bold hover:bg-white/20">Lobby</button>
              <button onClick={() => handleVoiceCommand("go floor 2")} className="rounded-xl bg-cyan-500 px-2 py-2 font-black text-slate-950 hover:bg-cyan-400">Go 2F</button>
              <button onClick={() => handleVoiceCommand("go rooftop")} className="rounded-xl bg-cyan-500 px-2 py-2 font-black text-slate-950 hover:bg-cyan-400">Roof</button>
              <button onClick={() => handleVoiceCommand("refresh wordpress api")} className="rounded-xl bg-white/10 px-2 py-2 font-bold hover:bg-white/20">Refresh WP</button>
              <button onClick={() => setShowProjectWindow(true)} className="rounded-xl bg-cyan-500 px-2 py-2 font-black text-slate-950 hover:bg-cyan-400">Projects</button>
              <button onClick={() => setLiveVoiceMode(liveVoiceMode === "dictation" ? "command" : "dictation")} className="rounded-xl bg-purple-500 px-2 py-2 font-black text-white hover:bg-purple-400">{liveVoiceMode === "dictation" ? "Command" : "Dictate"}</button>
              <button onClick={() => handleVoiceCommand("add yuka path node")} className="rounded-xl bg-yellow-400 px-2 py-2 font-black text-slate-950 hover:bg-yellow-300">Yuka Node</button>
            </div>
            )}
            {(lastVoiceCommand || lastNpmCommandResult) && (
              <div className="mt-2 rounded-xl bg-black/30 p-2 text-[11px] text-slate-300">
                {lastVoiceCommand && <div><strong>Last:</strong> {lastVoiceCommand}</div>}
                {lastNpmCommandResult && <div className="mt-1 flex gap-1"><Terminal size={12} /> <span className="truncate">{lastNpmCommandResult}</span></div>}
                {voiceCommandHistory.length > 0 && (
                  <div className="mt-2 max-h-20 overflow-auto rounded-lg bg-white/5 p-2">
                    <div className="mb-1 text-[10px] font-black uppercase text-cyan-200">Voice History</div>
                    {voiceCommandHistory.slice(0, 4).map((item) => (
                      <div key={item.id} className="truncate text-[10px] text-slate-300">{item.createdAt} · {item.mode} · {item.text}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-white/5 px-2 py-1 text-[10px] text-slate-300">
              <span>Wake word: <strong>{voiceWakeWord}</strong></span>
              <button onClick={() => setVoiceAutoOpenWindows((value) => !value)} className="rounded-full bg-white/10 px-2 py-1 font-bold hover:bg-white/20">{voiceAutoOpenWindows ? "Auto-open ON" : "Auto-open OFF"}</button>
            </div>
          </>
        )}
      </div>

      {/* Floor dock */}
      <div className="fixed right-4 top-24 z-30 flex flex-col gap-2 rounded-2xl border border-white/15 bg-slate-950/75 p-2 text-white shadow-xl backdrop-blur">
        {[0, 1, 2, ROOFTOP_FLOOR].map((floor) => (
          <button
            key={`floor-dock-${floor}`}
            onClick={() => handleNavigateToFloor(floor)}
            className={`rounded-xl px-3 py-2 text-xs font-black ${currentFloor === floor ? "bg-emerald-400 text-slate-950" : "bg-white/10 hover:bg-white/20"}`}
          >
            {floor === ROOFTOP_FLOOR ? "Roof" : `${floor + 1}F`}
          </button>
        ))}
        <button onClick={() => setR3fSpeedMode((value) => !value)} className="rounded-xl bg-white/10 px-3 py-2 text-[10px] font-bold hover:bg-white/20">
          {r3fSpeedMode ? "Speed ON" : "HQ ON"}
        </button>
      </div>

      {/* WordPress Live NPC Button */}
      <button
        onClick={() => {
          fetchWordpressWindows()
          selectWordpressWindow(wordpressWindows.find((windowItem) => windowItem.tag === PINNED_BRAND_WINDOW.tag) || wordpressWindows[0] || localPinnedBrandWindow())
        }}
        className="fixed bottom-4 left-44 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 z-10 flex items-center gap-2 font-bold"
      >
        <span className="text-xl">WP</span>
        Live NPC
      </button>

      {/* All WordPress Shortcodes Button */}
      <button
        onClick={() => {
          setShowWordpressDashboard(true)
          setSelectedWordpressWindow(null)
          fetchWordpressWindows()
        }}
        className="fixed bottom-4 left-[340px] bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 z-10 flex items-center gap-2 font-bold"
      >
        <span className="text-xl">WP</span>
        Shortcode List
      </button>

      {/* Meeting Button */}
      <button
        onClick={handleToggleMeeting}
        className={`fixed bottom-4 left-[540px] ${isMeetingActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'} text-white px-6 py-3 rounded-full shadow-lg hover:opacity-90 transition-all duration-200 z-10 flex items-center gap-2 font-bold`}
      >
        <span className="text-xl">🤝</span>
        {isMeetingActive ? 'End Meeting' : 'Call Meeting'}
      </button>

      {/* NPC Controls Button */}
      <button
        onClick={() => setShowControls((prev) => !prev)}
        className="fixed bottom-4 left-[700px] bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-full shadow-lg hover:from-yellow-600 hover:to-amber-600 transition-all duration-200 z-10 flex items-center gap-2 font-bold"
      >
        <span className="text-xl">🤖</span>
        NPC Controls
      </button>

      {/* WordPress Dashboard Button */}
      <button
        onClick={() => {
          setShowWordpressDashboard(true)
          fetchWordpressWindows()
        }}
        className="fixed bottom-4 left-[900px] bg-gradient-to-r from-sky-600 to-teal-500 text-white px-6 py-3 rounded-full shadow-lg hover:from-sky-700 hover:to-teal-600 transition-all duration-200 z-10 flex items-center gap-2 font-bold"
      >
        <span className="text-xl">WP</span>
        Dashboards
      </button>

      {/* Controls Hint */}
      {showControls && (
        <div className="fixed top-24 left-4 bg-black/80 text-white p-4 rounded-2xl text-sm z-10 max-w-xs max-h-[70vh] overflow-y-auto">
          <h3 className="font-bold mb-2">Controls</h3>
          <ul className="space-y-1">
            <li>WASD / Arrows: Move + strafe</li>
            <li>Q / E: Rotate left / right</li>
            <li>Mouse: Look around (click canvas)</li>
            <li>N: NPC Directory editor</li>
            <li>F: Toggle flying mode</li>
            <li>Space / Shift: Fly up / down</li>
            <li>PageUp / PageDown or Z: Quick fly</li>
            <li>R: Reset height</li>
            <li>M: Open exhibits menu</li>
            <li>H: Toggle this panel</li>
            <li>J: Toggle joysticks</li>
            <li>ESC: Release mouse</li>
            <li>Click: Exhibits · NPCs · Roof portals</li>
            <li className="text-cyan-300">Roof doorways: walk through → localhost 3001-3010</li>
            <li className="text-cyan-300">⚙ corner button: hide/show any UI</li>
            <li className="text-green-400">Controller: {externalControllerActive ? "Connected" : "Not Connected"}</li>
            {externalControllerActive && (
              <>
                <li>Left Stick: Move · Right Stick: Rotate</li>
                <li>A: Interact · B: Exit control</li>
                <li>X: Toggle flying · Y: Open menu</li>
                <li>LB / RB: Fly down / up</li>
                <li className="text-cyan-300">RSB: MOUSE MODE — stick moves cursor, A clicks, LB/RB scrolls, Y mini keyboard, B exits</li>
              </>
            )}
          </ul>
          <h3 className="font-bold mt-4 mb-2">Debug Info</h3>
          <ul className="space-y-1 text-xs">
            <li>FPS: {debugInfo.fps}</li>
            <li>
              Position: ({debugInfo.position.x}, {debugInfo.position.y}, {debugInfo.position.z})
            </li>
            <li>
              Rotation: {debugInfo.rotation.y.toFixed(2)} (Pitch: {debugInfo.pitch.x.toFixed(2)})
            </li>
            <li>Mode: {flyingMode ? "Flying" : "Walking"}</li>
          </ul>
        </div>
      )}

      {/* Iframe Menu */}
      {isIframeMenuOpen && <IframeMenu items={LIVE_GALLERY_ITEMS} onClose={() => setIsIframeMenuOpen(false)} />}

      {/* WordPress shortcode content is rendered only in the selected dashboard window below. */}

      {showWordpressDashboard && (
        <div className="fixed inset-0 bg-black/85 z-50 overflow-y-auto">
          <div className="container mx-auto py-8 px-4">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Live WordPress Shortcode Windows — Real Styled Pages</h2>
                <p className="mt-2 text-sm text-slate-200">
                  {wordpressApiStatus === "connected"
                    ? `${wordpressWindows.length || DEFAULT_NPC_COUNT} exact agent windows synced from WordPress / local roster`
                    : wordpressApiStatus === "loading"
                      ? "Connecting to WordPress API..."
                      : wordpressApiStatus === "error"
                        ? wordpressApiError
                        : "Ready to connect"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    fetchWordpressWindows()
                    fetchWordpressFeatures()
                  }}
                  className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100"
                >
                  <RefreshCw size={16} /> Refresh API
                </button>
                <button
                  onClick={() => {
                    setShowWordpressDashboard(false)
                    setSelectedWordpressWindow(null)
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                  aria-label="Close WordPress dashboards"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-xl">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database size={20} />
                  <h3 className="text-lg font-bold">Live WordPress API Features</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${wordpressFeatureStatus === "connected" ? "bg-emerald-100 text-emerald-900" : wordpressFeatureStatus === "loading" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-900"}`}>
                  {wordpressFeatureStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-10">
                {[
                  ["NPC Windows", wordpressFeatures?.metrics?.npcWindows ?? wordpressWindows.length],
                  ["Approved", wordpressFeatures?.metrics?.approvedShortcodes ?? wordpressWindows.length],
                  ["Registered", wordpressFeatures?.metrics?.registeredShortcodes ?? 0],
                  ["Matched", wordpressFeatures?.metrics?.matchedShortcodes ?? 0],
                  ["Missing", wordpressFeatures?.metrics?.missingShortcodes ?? 0],
                  ["Pages", wordpressFeatures?.metrics?.pages ?? Object.keys(wordpressPages).length],
                  ["Posts", wordpressFeatures?.metrics?.posts ?? 0],
                  ["Media", wordpressFeatures?.metrics?.media ?? 0],
                  ["Post Types", wordpressFeatures?.metrics?.customPostTypes ?? 0],
                  ["Menus", wordpressFeatures?.metrics?.menus ?? 0],
                  ["Active Plugins", wordpressFeatures?.metrics?.activePlugins ?? 0],
                  ["API Routes", wordpressFeatures?.metrics?.apiRoutes ?? 0],
                  ["Theme Supports", wordpressFeatures?.metrics?.themeSupports ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl bg-white/10 p-3 text-center">
                    <div className="text-2xl font-black">{String(value)}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-300">{String(label)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-xl bg-white/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-300">Connected Site</div>
                  <div className="mt-1 text-lg font-black">{wordpressFeatures?.site?.name || "Entremotivator"}</div>
                  <div className="mt-1 text-xs text-slate-300">{wordpressFeatures?.site?.url || "https://entremotivator.com"}</div>
                  <div className="mt-2 text-xs text-slate-300">Plugin v{wordpressFeatures?.plugin?.version || "pending"} · {wordpressFeatures?.site?.timezone || "WordPress timezone"}</div>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-300">Render Mode</div>
                  <div className="mt-1 text-lg font-black">Styled WordPress Iframe</div>
                  <div className="mt-1 text-xs text-slate-300">One active shortcode window at a time · pinned {wordpressFeatures?.features?.health?.pinnedShortcode || "[bsp_app]"}</div>
                  <div className="mt-2 text-xs text-slate-300">Cookie iframe fix: {wordpressFeatures?.features?.health?.iframeCookieFix ? "on" : "check plugin"}</div>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-300">API Source</div>
                  <div className="mt-1 text-lg font-black">{wordpressFeatures?.source || "Next WP Proxy"}</div>
                  <div className="mt-1 text-xs text-slate-300">Server-side REST pull through /api/wp/suite</div>
                  {wordpressFeatures?.plugin?.dashboardUrl && (
                    <a href={wordpressFeatures.plugin.dashboardUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded bg-white px-3 py-1.5 text-xs font-bold text-slate-900">
                      Open Plugin Dashboard
                    </a>
                  )}
                </div>
              </div>

              {(wordpressFeatures?.features?.diagnostics || wordpressFeatures?.features?.commandCenter) && (
                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
                  <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-100">Connection Diagnostics</div>
                    <div className="mt-1 text-3xl font-black">{wordpressFeatures?.features?.diagnostics?.readinessScore ?? wordpressFeatures?.metrics?.diagnosticReadinessScore ?? 0}%</div>
                    <div className="mt-1 text-xs text-emerald-100">Styled iframe mode · server-side Basic Auth · no browser Application Password exposure.</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-white/10 p-2"><strong>{asArray<any>(wordpressFeatures?.features?.diagnostics?.matchedTags).length ?? wordpressFeatures?.metrics?.matchedShortcodes ?? 0}</strong><br />matched</div>
                      <div className="rounded-lg bg-white/10 p-2"><strong>{asArray<any>(wordpressFeatures?.features?.diagnostics?.missingTags).length ?? wordpressFeatures?.metrics?.missingShortcodes ?? 0}</strong><br />missing</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-cyan-100">Pinned Brand GPT</div>
                    <div className="mt-1 text-lg font-black">{wordpressFeatures?.features?.commandCenter?.brand?.title || "Brand GPT"}</div>
                    <div className="mt-1 text-xs text-cyan-100">{wordpressFeatures?.features?.commandCenter?.brand?.shortcode || "[bsp_app]"} stays pinned and opens as the real WordPress page.</div>
                    {(wordpressFeatures?.features?.commandCenter?.brand?.liveUrl || selectedWordpressWindow?.liveUrl) && (
                      <button
                        type="button"
                        onClick={() => selectWordpressWindow((wordpressFeatures?.features?.commandCenter?.brand || localPinnedBrandWindow()) as WordPressNpcWindow)}
                        className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-900"
                      >
                        Open Brand GPT Styled Window
                      </button>
                    )}
                  </div>
                  <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-100">Repair Hints</div>
                    <div className="mt-2 max-h-28 space-y-1 overflow-auto text-xs text-amber-50">
                      {(asArray<string>(wordpressFeatures?.features?.diagnostics?.repairHints).length ? asArray<string>(wordpressFeatures?.features?.diagnostics?.repairHints) : ["Run pnpm run wp:ping", "Run pnpm run wp:diagnostics", "Keep v0map plugin v20 active"]).slice(0, 4).map((hint: string, index: number) => (
                        <div key={`wp-repair-${index}`} className="rounded bg-white/10 px-2 py-1">{hint}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
                {asArray<any>(wordpressFeatures?.features?.featureGroups).slice(0, 8).map((group: any, index: number) => (
                  <div key={stableWpKey("feature-group", group, index)} className="rounded-xl bg-white p-3 text-slate-900">
                    <div className="text-xs font-bold uppercase text-slate-500">Feature Group</div>
                    <div className="font-black">{group.team}</div>
                    <div className="mt-1 text-xs text-slate-600">{group.registered || 0} live · {group.missing || 0} missing · {group.total || 0} total</div>
                    <div className="mt-2 line-clamp-2 text-[11px] text-slate-500">{asArray<string>(group.shortcodes).slice(0, 5).join("  ")}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
                <div className="rounded-xl bg-white p-4 text-slate-900">
                  <div className="text-xs font-bold uppercase text-slate-500">Shortcode Provider Pull</div>
                  <div className="mt-1 text-lg font-black">{asArray<any>(wordpressFeatures?.features?.shortcodeProviders).length} provider groups</div>
                  <div className="mt-3 max-h-40 space-y-2 overflow-auto pr-1">
                    {asArray<any>(wordpressFeatures?.features?.shortcodeProviders).slice(0, 10).map((provider: any, index: number) => (
                      <div key={stableWpKey("provider", provider, index)} className="rounded-lg bg-slate-100 p-2 text-xs">
                        <div className="font-black text-slate-900">{provider.team}</div>
                        <div className="text-slate-600">{provider.registered || 0} live · {provider.missing || 0} missing · {provider.total || 0} total</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 text-slate-900">
                  <div className="text-xs font-bold uppercase text-slate-500">WordPress Plugin Pull</div>
                  <div className="mt-1 text-lg font-black">{wordpressFeatures?.metrics?.activePlugins ?? 0} active plugins</div>
                  <div className="mt-3 max-h-40 space-y-2 overflow-auto pr-1">
                    {asArray<any>(wordpressFeatures?.features?.plugins).filter((plugin: any) => plugin.active).slice(0, 10).map((plugin: any, index: number) => (
                      <div key={stableWpKey("plugin", plugin, index)} className="rounded-lg bg-slate-100 p-2 text-xs">
                        <div className="font-black text-slate-900">{plugin.name}</div>
                        <div className="text-slate-600">v{plugin.version || "n/a"}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 text-slate-900">
                  <div className="text-xs font-bold uppercase text-slate-500">Theme / API Map</div>
                  <div className="mt-1 text-lg font-black">{wordpressFeatures?.features?.theme?.name || "Live WordPress theme"}</div>
                  <div className="mt-2 text-xs text-slate-600">Routes: {Array.isArray(wordpressFeatures?.features?.apiRoutes) ? wordpressFeatures?.features?.apiRoutes?.length : Object.keys(wordpressFeatures?.features?.apiRoutes || {}).length}</div>
                  <div className="mt-2 line-clamp-3 text-xs text-slate-600">Supports: {asArray<string>(wordpressFeatures?.features?.theme?.supports).join(", ") || "Theme support data pending"}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                {asArray<any>(wordpressFeatures?.features?.menus).slice(0, 3).map((menu: any, index: number) => (
                  <div key={stableWpKey("wp-menu", menu, index)} className="rounded-xl bg-white p-3 text-slate-900">
                    <div className="text-xs font-bold uppercase text-slate-500">WordPress Menu</div>
                    <div className="font-black">{menu.name || menu.slug}</div>
                    <div className="mt-1 text-xs text-slate-600">{menu.count || (menu.items || []).length || 0} items · {(menu.locations || []).join(", ") || "no location"}</div>
                  </div>
                ))}
                {Object.entries(asObject(wordpressFeatures?.features?.customContent)).slice(0, 3).map(([type, group]: [string, any]) => (
                  <div key={`custom-content-${type}`} className="rounded-xl bg-white p-3 text-slate-900">
                    <div className="text-xs font-bold uppercase text-slate-500">Custom Post Type</div>
                    <div className="font-black">{group?.label || type}</div>
                    <div className="mt-1 text-xs text-slate-600">{(group?.items || []).length} recent items · REST {group?.restBase || type}</div>
                  </div>
                ))}
                {asArray<any>(wordpressFeatures?.features?.comments).slice(0, 3).map((comment: any, index: number) => (
                  <a key={stableWpKey("wp-comment", comment, index)} href={comment.link} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white p-3 text-slate-900 hover:bg-slate-100">
                    <div className="text-xs font-bold uppercase text-slate-500">Recent Comment</div>
                    <div className="font-bold">{comment.author || "Comment"}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-600">{comment.excerpt}</div>
                  </a>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {asArray<any>(wordpressFeatures?.features?.pages).slice(0, 3).map((page: any, index: number) => (
                  <a key={stableWpKey("wp-page", page, index)} href={page.link} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white p-3 text-slate-900 hover:bg-slate-100">
                    <div className="text-xs font-bold uppercase text-slate-500">WordPress Page</div>
                    <div className="font-bold" dangerouslySetInnerHTML={{ __html: page?.title?.rendered || page?.title || page?.slug || "Page" }} />
                  </a>
                ))}
                {asArray<any>(wordpressFeatures?.features?.posts).slice(0, 3).map((post: any, index: number) => (
                  <a key={stableWpKey("wp-post", post, index)} href={post.link} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white p-3 text-slate-900 hover:bg-slate-100">
                    <div className="text-xs font-bold uppercase text-slate-500">WordPress Post</div>
                    <div className="font-bold" dangerouslySetInnerHTML={{ __html: post?.title?.rendered || post?.title || post?.slug || "Post" }} />
                  </a>
                ))}
              </div>

              {asArray<any>(wordpressFeatures?.features?.media).length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                  {asArray<any>(wordpressFeatures?.features?.media).slice(0, 6).map((item: any, index: number) => (
                    <a key={stableWpKey("wp-media", item, index)} href={item.sourceUrl || item.source_url || item.link} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl bg-white text-slate-900 hover:bg-slate-100">
                      {(item.thumbnailUrl || item.source_url) && (item.mediaType === "image" || item.media_type === "image") ? (
                        <img src={item.thumbnailUrl || item.source_url} alt={item.title?.rendered || item.title || "WordPress media"} className="h-24 w-full object-cover" />
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-slate-200 text-xs font-bold uppercase text-slate-500">Media</div>
                      )}
                      <div className="line-clamp-2 p-2 text-xs font-bold" dangerouslySetInnerHTML={{ __html: item?.title?.rendered || item?.title || "Media item" }} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-5">
              {Object.entries(wordpressPages).map(([key, page]) => (
                <div
                  key={key}
                  className="rounded border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/20"
                >
                  <a href={page.url} target="_blank" rel="noopener noreferrer" className="block text-sm font-bold">
                    {page.title}
                  </a>
                  <div className="mt-1 truncate text-xs text-slate-300">{page.shortcode}</div>
                  {page.edit && (
                    <a
                      href={page.edit}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex rounded bg-white px-2 py-1 text-xs font-bold text-slate-900"
                    >
                      Edit in WordPress
                    </a>
                  )}
                </div>
              ))}
            </div>

            {selectedWordpressWindow ? (
              // v28.4: shortcode windows are pinned to the TOP of the full screen —
              // a fixed top sheet, full width, header first, so every live WP
              // shortcode opens at the top instead of buried down the dashboard scroll.
              <div className={`fixed inset-x-0 top-0 z-[75] flex flex-col overflow-hidden bg-white shadow-2xl ${isShortcodeWidescreen ? "h-screen" : "max-h-screen rounded-b-2xl"}`}>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-100 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-white">Live WP</span>
                      <h3 className="truncate text-xl font-black text-slate-900">{selectedWordpressWindow.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedWordpressWindow.team} · {windowCodeLabel(selectedWordpressWindow)} · {isDashboardWrapperWindow(selectedWordpressWindow) ? "frontend link wrapper" : selectedWordpressWindow.shortcode ? (selectedWordpressWindow.registered ? "registered" : "missing") : "link"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => selectWindowByOffset(-1)}
                      className="inline-flex items-center gap-1 rounded bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow hover:bg-slate-50"
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <button
                      onClick={() => selectWindowByOffset(1)}
                      className="inline-flex items-center gap-1 rounded bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow hover:bg-slate-50"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => setIsShortcodeWidescreen((value) => !value)}
                      className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-2 text-sm font-bold text-white shadow hover:bg-indigo-700"
                    >
                      {isShortcodeWidescreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      {isShortcodeWidescreen ? "Normal" : "Wide"}
                    </button>
                    <button
                      onClick={() => {
                        setIsShortcodeWidescreen(true)
                        document.querySelector("[data-live-shortcode-window]")?.requestFullscreen?.()
                      }}
                      className="inline-flex items-center gap-1 rounded bg-black px-3 py-2 text-sm font-bold text-white shadow hover:bg-slate-800"
                    >
                      <Maximize2 size={16} /> Full
                    </button>
                    <button
                      onClick={() => handleCallNPC(selectedWordpressWindow.npcId || 1, { openWindow: true, instant: true })}
                      className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-2 text-sm font-bold text-white shadow hover:bg-emerald-700"
                    >
                      <Sparkles size={16} /> Come Here
                    </button>
                    <button
                      onClick={() => handleDanceNPCs([selectedWordpressWindow.npcId || 1])}
                      className="inline-flex items-center gap-1 rounded bg-fuchsia-600 px-3 py-2 text-sm font-bold text-white shadow hover:bg-fuchsia-700"
                    >
                      Dance
                    </button>
                    {selectedWordpressWindow.editUrl && (
                      <a
                        href={selectedWordpressWindow.editUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-700"
                      >
                        Edit WP
                      </a>
                    )}
                    {selectedWordpressWindow.pageUrl && (
                      <a
                        href={selectedWordpressWindow.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700"
                      >
                        Open Page
                      </a>
                    )}
                    <button
                      onClick={closeWordpressWindow}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                      aria-label="Close live shortcode window"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {selectedWordpressWindow.tabs && selectedWordpressWindow.tabs.length > 1 && (
                  <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
                    <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Shortcode tabs for this agent</div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedWordpressWindow.tabs.map((tab, index) => (
                        <button
                          key={`selected-tab-${selectedWordpressWindow.id}-${tab.tag}-${index}`}
                          onClick={() => selectWordpressWindow({
                            ...selectedWordpressWindow,
                            id: `${selectedWordpressWindow.id}-tab-${tab.tag}`,
                            title: `${selectedWordpressWindow.title} · ${tab.title}`,
                            tag: tab.tag,
                            shortcode: tab.shortcode,
                            liveUrl: tab.liveUrl || shortcodeRenderUrl(tab.tag, tab.shortcode),
                            wordpressUrl: tab.liveUrl || shortcodeRenderUrl(tab.tag, tab.shortcode),
                            pageUrl: tab.liveUrl || shortcodeRenderUrl(tab.tag, tab.shortcode),
                          })}
                          className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition ${selectedWordpressWindow.tag === tab.tag ? "border-emerald-400 bg-emerald-100 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                        >
                          <div className="font-black">{tab.title}</div>
                          <div className="opacity-70">{tab.source === "v0map-wrapper" ? "V0Map dashboard wrapper" : tab.shortcode}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`relative bg-white ${isShortcodeWidescreen ? "min-h-0 flex-1" : ""}`}>
                  {isWordpressWindowLoading && (
                    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 shadow">
                      Loading real WordPress page styling for {windowCodeLabel(selectedWordpressWindow)}...
                    </div>
                  )}
                  <iframe
                    key={`${selectedWordpressWindow.id}-${selectedWordpressWindow.tag}-${isShortcodeWidescreen ? "wide" : "normal"}`}
                    title={selectedWordpressWindow.title}
                    className={`${isShortcodeWidescreen ? "h-full" : "h-[56vh]"} w-full border-0 bg-white`}
                    sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
                    src={wordpressFrameSrc(selectedWordpressWindow)}
                    allow="clipboard-read; clipboard-write; fullscreen; payment; autoplay; microphone"
                    allowFullScreen
                    onLoad={() => setIsWordpressWindowLoading(false)}
                  />
                </div>

                <div className="shrink-0 border-t border-slate-200 bg-slate-950 p-3 text-white">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-300">Shortcode menu below this live window</div>
                    <div className="text-xs text-slate-400">Say “next window”, “close window”, “wide screen”, or “NPC {selectedWordpressWindow.npcId || 1} come here”.</div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {shortcodeMenuWindows().slice(0, 80).map((windowItem, index) => (
                      <button
                        key={stableWpKey("window-menu", windowItem, index)}
                        onClick={() => selectWordpressWindow(windowItem)}
                        className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs transition ${
                          selectedWordpressWindow.tag === windowItem.tag
                            ? "border-emerald-300 bg-emerald-400 text-slate-950"
                            : "border-white/10 bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        <div className="font-black">{windowItem.title}</div>
                        <div className="mt-0.5 opacity-80">{windowCodeLabel(windowItem)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {wordpressWindows.map((windowItem) => (
                  <button
                    key={windowItem.id}
                    onClick={() => selectWordpressWindow(windowItem)}
                    className="rounded-lg border border-white/15 bg-white p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{windowItem.title}</h3>
                        <p className="text-sm text-slate-600">{windowItem.team}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          windowItem.registered ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {windowItem.registered ? "Live" : "Missing"}
                      </span>
                    </div>
                    <code className="text-xs text-slate-600">[{windowItem.tag}]</code>
                    {windowItem.editUrl && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={windowItem.editUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Edit in WordPress
                        </a>
                        {windowItem.pageUrl && (
                          <a
                            href={windowItem.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Open Live Page
                          </a>
                        )}
                      </div>
                    )}
                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                      {windowItem.renderError
                        ? windowItem.renderError
                        : windowItem.html
                          ? "Opens as the real WordPress styled page."
                          : "Click to open the real WordPress styled page."}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {tooltipInfo && <ExhibitTooltip title={tooltipInfo.title} description={tooltipInfo.description} />}
      <DebugOverlay enabled={true} />
      <GamepadController
        onLeftStickMove={(x, y) => {
          if (virtualMouseModeRef.current) return handleMoveJoystick(0, 0)
          handleMoveJoystick(x, y)
        }}
        onRightStickMove={(x, y) => {
          if (virtualMouseModeRef.current) return handleRotateJoystick(0)
          handleRotateJoystick(x)
        }}
        onButtonPress={handleControllerButtonPress}
        onControllerConnect={handleControllerConnect}
      />
    </div>
  )
}
