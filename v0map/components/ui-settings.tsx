"use client"

import { Settings2, X, Eye, EyeOff, Gamepad2, Tablet } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// UI Settings v28.3
// Per-element visibility switches for every HUD piece, plus Hide All / Show All.
// Persisted to localStorage. Big touch targets for iPad; every control is
// clickable with the Xbox virtual cursor (RSB mouse mode).
// ─────────────────────────────────────────────────────────────────────────────

export interface UiPrefs {
  voicePanel: boolean
  quickActions: boolean
  roomsSection: boolean
  gesturesSection: boolean
  groupActionsSection: boolean
  portalsSection: boolean
  quickCommandBar: boolean
  miniMap: boolean
  joysticks: boolean
  flyingControls: boolean
  controllerStatus: boolean
  gamificationHud: boolean
}

export const DEFAULT_UI_PREFS: UiPrefs = {
  voicePanel: true,
  quickActions: true,
  roomsSection: true,
  gesturesSection: true,
  groupActionsSection: true,
  portalsSection: true,
  quickCommandBar: true,
  miniMap: true,
  joysticks: true,
  flyingControls: true,
  controllerStatus: true,
  gamificationHud: true,
}

export const UI_PREFS_STORAGE_KEY = "v0map-ui-prefs-v28"

export const loadUiPrefs = (): UiPrefs => {
  try {
    const saved = localStorage.getItem(UI_PREFS_STORAGE_KEY)
    if (saved) return { ...DEFAULT_UI_PREFS, ...JSON.parse(saved) }
  } catch {}
  return { ...DEFAULT_UI_PREFS }
}

export const saveUiPrefs = (prefs: UiPrefs) => {
  try {
    localStorage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(prefs))
  } catch {}
}

const LABELS: Array<{ key: keyof UiPrefs; label: string; hint: string }> = [
  { key: "voicePanel", label: "Voice Command Panel", hint: "The whole right-side city panel" },
  { key: "quickActions", label: "· Quick Actions", hint: "Create NPC / teams / city features grid" },
  { key: "roomsSection", label: "· Rooms Section", hint: "Teleport buttons for every room" },
  { key: "gesturesSection", label: "· Gestures Section", hint: "Wave/cheer/salute all buttons" },
  { key: "groupActionsSection", label: "· Group Actions", hint: "Formations + Yuka route buttons" },
  { key: "portalsSection", label: "· Roof Portals", hint: "Port 3001-3010 buttons" },
  { key: "quickCommandBar", label: "Quick Command Dock", hint: "Bottom docked shortcut bar" },
  { key: "miniMap", label: "Mini Map", hint: "Floor-layer map (left side)" },
  { key: "joysticks", label: "Touch Joysticks", hint: "Move/rotate sticks for iPad" },
  { key: "flyingControls", label: "Flying Controls", hint: "Fly up/down/reset buttons" },
  { key: "controllerStatus", label: "Controller Badge", hint: "Gamepad connected indicator" },
  { key: "gamificationHud", label: "Gamification HUD", hint: "XP / level / streak overlay" },
]

interface UiSettingsPanelProps {
  prefs: UiPrefs
  onChange: (next: UiPrefs) => void
  onClose: () => void
}

export function UiSettingsPanel({ prefs, onChange, onClose }: UiSettingsPanelProps) {
  const setAll = (visible: boolean) => {
    const next = { ...prefs }
    ;(Object.keys(next) as Array<keyof UiPrefs>).forEach((key) => {
      next[key] = visible
    })
    onChange(next)
  }

  const toggle = (key: keyof UiPrefs) => onChange({ ...prefs, [key]: !prefs[key] })

  return (
    <div className="fixed inset-x-4 top-16 z-[80] mx-auto max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-950/97 text-white shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-slate-700 to-slate-900 p-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-black"><Settings2 size={20} /> UI Settings</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-300">
            <Tablet size={12} /> iPad-friendly · <Gamepad2 size={12} /> works with RSB mouse mode
          </div>
        </div>
        <button onClick={onClose} className="rounded-full bg-white/15 p-2 hover:bg-white/30" aria-label="Close UI settings">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-2 border-b border-white/10 p-3">
        <button onClick={() => setAll(false)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500/80 px-3 py-2.5 text-xs font-black hover:bg-rose-500">
          <EyeOff size={14} /> Hide ALL UI
        </button>
        <button onClick={() => setAll(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/80 px-3 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400">
          <Eye size={14} /> Show ALL UI
        </button>
      </div>

      <div className="max-h-[52vh] space-y-1 overflow-y-auto p-3">
        {LABELS.map(({ key, label, hint }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-left hover:bg-white/10"
          >
            <div>
              <div className="text-xs font-black">{label}</div>
              <div className="text-[10px] text-slate-400">{hint}</div>
            </div>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[key] ? "bg-emerald-500" : "bg-slate-600"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${prefs[key] ? "left-[22px]" : "left-0.5"}`} />
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-white/10 p-3 text-center text-[10px] text-slate-500">
        Saved automatically · voice: “open settings”, “hide ui”, “show ui” · a ⚙ button stays visible so you can always get back here
      </div>
    </div>
  )
}
