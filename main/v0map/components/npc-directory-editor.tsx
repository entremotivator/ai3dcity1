"use client"

import { useMemo, useState } from "react"
import * as THREE from "three"
import type { NPCData } from "./npc"
import { toast } from "react-hot-toast"
import {
  X,
  Search,
  PlusCircle,
  Trash2,
  Copy,
  Download,
  Upload,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Users,
  Save,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// NPC Directory Editor v28
// Fully editable in-app directory: every NPC field (name, role, team, color,
// floor, speed, model URL, shortcode, bio, status, dialogue) can be edited
// live. Changes stream into the running 3D scene via NPCManager.syncNPCs —
// no reloads, no scene rebuilds. Edits persist to localStorage.
// ─────────────────────────────────────────────────────────────────────────────

interface NpcDirectoryEditorProps {
  npcs: NPCData[]
  floors: number // total floors including rooftop, e.g. 4 => floors 1-3 + rooftop
  onChange: (next: NPCData[]) => void
  onReset: () => void
  onClose: () => void
  onCallNpc?: (id: number) => void
  onGestureNpc?: (id: number) => void
}

type EditableField =
  | "name"
  | "role"
  | "team"
  | "color"
  | "bio"
  | "status"
  | "glbUrl"
  | "shortcodeTag"

const FIELD_LABELS: Array<{ key: EditableField; label: string; placeholder: string }> = [
  { key: "role", label: "Role", placeholder: "e.g. Automation Lead" },
  { key: "team", label: "Team", placeholder: "e.g. Growth" },
  { key: "glbUrl", label: "3D Model URL (.glb)", placeholder: "https://…/avatar.glb" },
  { key: "shortcodeTag", label: "WP Shortcode Tag", placeholder: "e.g. bsp_app" },
  { key: "status", label: "Status", placeholder: "e.g. On rooftop" },
  { key: "bio", label: "Bio", placeholder: "Short description" },
]

export function NpcDirectoryEditor({ npcs, floors, onChange, onReset, onClose, onCallNpc, onGestureNpc }: NpcDirectoryEditorProps) {
  const [query, setQuery] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [teamFilter, setTeamFilter] = useState<string>("all")

  const teams = useMemo(() => {
    const set = new Set<string>()
    npcs.forEach((npc) => npc.team && set.add(npc.team))
    return Array.from(set).sort()
  }, [npcs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return npcs.filter((npc) => {
      if (teamFilter !== "all" && npc.team !== teamFilter) return false
      if (!q) return true
      return (
        npc.name.toLowerCase().includes(q) ||
        (npc.role || "").toLowerCase().includes(q) ||
        (npc.team || "").toLowerCase().includes(q) ||
        (npc.shortcodeTag || "").toLowerCase().includes(q) ||
        String(npc.id) === q
      )
    })
  }, [npcs, query, teamFilter])

  const updateNpc = (id: number, patch: Partial<NPCData>) => {
    onChange(npcs.map((npc) => (npc.id === id ? { ...npc, ...patch } : npc)))
  }

  const addNpc = () => {
    const nextId = npcs.reduce((max, npc) => Math.max(max, npc.id), 0) + 1
    const angle = Math.random() * Math.PI * 2
    const position = new THREE.Vector3(Math.cos(angle) * 10, 1, Math.sin(angle) * 10)
    const fresh: NPCData = {
      id: nextId,
      name: `New NPC ${nextId}`,
      model: "default",
      color: "#22d3ee",
      streamlitUrl: "",
      position,
      targetPosition: position.clone().add(new THREE.Vector3(2, 0, 2)),
      speed: 0.75,
      rotationSpeed: 2.2,
      interactionRadius: 5,
      team: "Directory Created",
      role: "New Agent",
      status: "Created in directory",
      floor: 0,
      dialogue: ["I was created in the NPC Directory editor."],
    }
    onChange([...npcs, fresh])
    setExpandedId(nextId)
    toast.success(`Added ${fresh.name} — it just spawned in the world`)
  }

  const duplicateNpc = (id: number) => {
    const source = npcs.find((npc) => npc.id === id)
    if (!source) return
    const nextId = npcs.reduce((max, npc) => Math.max(max, npc.id), 0) + 1
    const clonePos = source.position?.clone?.() || new THREE.Vector3(0, 1, 0)
    clonePos.x += 2
    onChange([
      ...npcs,
      {
        ...source,
        id: nextId,
        name: `${source.name} Copy`,
        position: clonePos,
        targetPosition: clonePos.clone().add(new THREE.Vector3(2, 0, 2)),
      },
    ])
    toast.success(`Duplicated ${source.name}`)
  }

  const removeNpc = (id: number) => {
    const target = npcs.find((npc) => npc.id === id)
    onChange(npcs.filter((npc) => npc.id !== id))
    if (expandedId === id) setExpandedId(null)
    toast.success(`Removed ${target?.name || `NPC #${id}`}`)
  }

  const exportDirectory = () => {
    const payload = npcs.map((npc) => ({
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
    const blob = new Blob([JSON.stringify({ version: 28, npcs: payload }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "npc-directory-v28.json"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Exported NPC directory JSON")
  }

  const importDirectory = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        const items: Array<Partial<NPCData> & { id?: number; name?: string }> = Array.isArray(parsed) ? parsed : parsed?.npcs
        if (!Array.isArray(items)) throw new Error("File must be a JSON array or { npcs: [...] }")
        let updated = 0
        const next = npcs.map((npc) => {
          const match = items.find((item) => item.id === npc.id || item.name === npc.name)
          if (!match) return npc
          updated++
          return {
            ...npc,
            name: match.name ?? npc.name,
            color: match.color ?? npc.color,
            role: match.role ?? npc.role,
            team: match.team ?? npc.team,
            bio: match.bio ?? npc.bio,
            status: match.status ?? npc.status,
            speed: typeof match.speed === "number" ? match.speed : npc.speed,
            floor: typeof match.floor === "number" ? match.floor : npc.floor,
            glbUrl: match.glbUrl ?? npc.glbUrl,
            shortcodeTag: match.shortcodeTag ?? npc.shortcodeTag,
            dialogue: Array.isArray(match.dialogue) ? match.dialogue : npc.dialogue,
          }
        })
        onChange(next)
        toast.success(`Imported directory — ${updated} NPC${updated === 1 ? "" : "s"} updated`)
      } catch (error: any) {
        toast.error(error?.message || "Failed to import directory JSON")
      }
    }
    input.click()
  }

  return (
    <div className="fixed inset-4 z-[70] flex flex-col overflow-hidden rounded-3xl border border-white/20 bg-slate-950/97 text-white shadow-2xl backdrop-blur md:inset-x-auto md:right-4 md:top-4 md:bottom-4 md:w-[min(560px,calc(100vw-2rem))]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-600 to-emerald-600 p-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-black"><Users size={20} /> NPC Directory</div>
          <div className="mt-0.5 text-xs text-cyan-50">Every field editable live · changes apply instantly in the 3D world · auto-saved to this browser</div>
        </div>
        <button onClick={onClose} className="rounded-full bg-white/15 p-2 hover:bg-white/30" aria-label="Close NPC directory">
          <X size={18} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3 text-xs">
        <div className="relative min-w-[160px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, role, team, id…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-8 pr-2 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
        </div>
        <select
          value={teamFilter}
          onChange={(event) => setTeamFilter(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900 px-2 py-2 outline-none focus:border-cyan-400"
        >
          <option value="all">All teams</option>
          {teams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
        <button onClick={addNpc} className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 font-black text-slate-950 hover:bg-emerald-400"><PlusCircle size={14} /> Add</button>
        <button onClick={exportDirectory} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 font-bold hover:bg-white/20"><Download size={14} /> Export</button>
        <button onClick={importDirectory} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 font-bold hover:bg-white/20"><Upload size={14} /> Import</button>
        <button onClick={onReset} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 font-bold hover:bg-rose-500/60"><RotateCcw size={14} /> Reset</button>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <span>{filtered.length} of {npcs.length} NPCs</span>
        <span className="inline-flex items-center gap-1"><Save size={12} /> Auto-saved</span>
      </div>

      {/* List */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {filtered.map((npc) => {
          const expanded = expandedId === npc.id
          return (
            <div key={npc.id} className="rounded-2xl border border-white/10 bg-white/5">
              {/* Row header */}
              <div className="flex items-center gap-2 p-2.5">
                <button onClick={() => setExpandedId(expanded ? null : npc.id)} className="rounded-lg bg-white/5 p-1.5 hover:bg-white/15">
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <span className="h-4 w-4 shrink-0 rounded-full border border-white/40" style={{ backgroundColor: npc.color }} />
                <input
                  value={npc.name}
                  onChange={(event) => updateNpc(npc.id, { name: event.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-sm font-bold outline-none hover:border-white/15 focus:border-cyan-400 focus:bg-slate-900"
                />
                <span className="hidden shrink-0 text-[10px] font-black text-slate-500 sm:inline">#{npc.id}</span>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                  {typeof npc.floor === "number" ? (npc.floor >= floors - 1 ? "Roof" : `${npc.floor + 1}F`) : "1F"}
                </span>
                <button onClick={() => duplicateNpc(npc.id)} className="rounded-lg bg-white/5 p-1.5 hover:bg-white/20" title="Duplicate"><Copy size={13} /></button>
                <button onClick={() => removeNpc(npc.id)} className="rounded-lg bg-white/5 p-1.5 hover:bg-rose-500/70" title="Remove"><Trash2 size={13} /></button>
              </div>

              {/* Expanded editor */}
              {expanded && (
                <div className="space-y-2 border-t border-white/10 p-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="font-bold text-slate-400">Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={/^#([0-9a-f]{6})$/i.test(npc.color) ? npc.color : "#22d3ee"}
                          onChange={(event) => updateNpc(npc.id, { color: event.target.value })}
                          className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
                        />
                        <input
                          value={npc.color}
                          onChange={(event) => updateNpc(npc.id, { color: event.target.value })}
                          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 outline-none focus:border-cyan-400"
                        />
                      </div>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold text-slate-400">Floor</span>
                      <select
                        value={typeof npc.floor === "number" ? npc.floor : 0}
                        onChange={(event) => updateNpc(npc.id, { floor: Number(event.target.value), status: Number(event.target.value) >= floors - 1 ? "On rooftop" : `On ${Number(event.target.value) + 1}F` })}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 outline-none focus:border-cyan-400"
                      >
                        {Array.from({ length: floors }, (_, floor) => (
                          <option key={floor} value={floor}>{floor >= floors - 1 ? "Rooftop" : `Floor ${floor + 1}`}</option>
                        ))}
                      </select>
                    </label>
                    <label className="col-span-2 space-y-1">
                      <span className="font-bold text-slate-400">Walk speed: {Number(npc.speed).toFixed(2)}</span>
                      <input
                        type="range"
                        min={0.3}
                        max={2}
                        step={0.05}
                        value={npc.speed}
                        onChange={(event) => updateNpc(npc.id, { speed: Number(event.target.value) })}
                        className="w-full accent-cyan-400"
                      />
                    </label>
                  </div>

                  {FIELD_LABELS.map(({ key, label, placeholder }) => (
                    <label key={key} className="block space-y-1">
                      <span className="font-bold text-slate-400">{label}</span>
                      <input
                        value={(npc[key] as string) || ""}
                        placeholder={placeholder}
                        onChange={(event) => updateNpc(npc.id, { [key]: event.target.value } as Partial<NPCData>)}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 outline-none placeholder:text-slate-600 focus:border-cyan-400"
                      />
                    </label>
                  ))}

                  <label className="block space-y-1">
                    <span className="font-bold text-slate-400">Dialogue (one line per row)</span>
                    <textarea
                      value={(npc.dialogue || []).join("\n")}
                      rows={3}
                      onChange={(event) => updateNpc(npc.id, { dialogue: event.target.value.split("\n").filter((line) => line.trim().length > 0) })}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 outline-none focus:border-cyan-400"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {onCallNpc && (
                      <button onClick={() => onCallNpc(npc.id)} className="rounded-lg bg-cyan-500 px-3 py-1.5 font-black text-slate-950 hover:bg-cyan-400">Summon to me</button>
                    )}
                    {onGestureNpc && (
                      <button onClick={() => onGestureNpc(npc.id)} className="rounded-lg bg-fuchsia-500 px-3 py-1.5 font-black text-white hover:bg-fuchsia-400">Wave 👋</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
            No NPCs match “{query}”. Try a different search or add a new NPC.
          </div>
        )}
      </div>
    </div>
  )
}
