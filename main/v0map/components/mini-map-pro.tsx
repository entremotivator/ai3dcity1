"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ROOM_DESTINATIONS, PORTAL_DESTINATIONS } from "./level-features"
import { FLOOR_HEIGHT, ROOFTOP_FLOOR } from "./office-building"
import { Map as MapIcon, ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// MiniMapPro v28.3
// Floor-layer minimap: tabs for every floor + rooftop, Auto mode that follows
// the player's floor, layer toggles (NPCs / Rooms / Portals / Labels), live NPC
// dots per floor with counts on each tab, click-a-room to teleport, expandable
// and fully collapsible to a pill (touch-friendly for iPad, big hit targets
// for the Xbox virtual cursor).
// ─────────────────────────────────────────────────────────────────────────────

export interface MiniMapNpcSnapshot {
  id: number
  name: string
  x: number
  y: number
  z: number
  visible: boolean
  frozen?: boolean
}

interface MiniMapProProps {
  getPlayer: () => { x: number; y: number; z: number; rotationY: number } | null
  getNpcSnapshot: () => MiniMapNpcSnapshot[]
  npcColors: Record<number, string>
  onNavigateRoom?: (roomId: string) => void
  onEnterPortal?: (port: number) => void
  className?: string
}

const WORLD_HALF = 50 // world units shown from center to edge (building view)
const CITY_WORLD_HALF = 250 // v28.6: zoomed-out scale when the player is out in the city

const floorOfY = (y: number) => Math.max(0, Math.min(ROOFTOP_FLOOR, Math.round(y / FLOOR_HEIGHT)))

export function MiniMapPro({ getPlayer, getNpcSnapshot, npcColors, onNavigateRoom, onEnterPortal, className = "" }: MiniMapProProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState<number | "auto">("auto")
  const [layers, setLayers] = useState({ npcs: true, rooms: true, portals: true, labels: true })
  const [floorCounts, setFloorCounts] = useState<number[]>([])
  const [playerFloor, setPlayerFloor] = useState(0)

  const mapSize = expanded ? 280 : 160

  const toggleLayer = (key: keyof typeof layers) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))

  const worldHalfRef = useRef(WORLD_HALF)

  const worldToMap = useCallback(
    (x: number, z: number) => ({
      x: ((x + worldHalfRef.current) / (worldHalfRef.current * 2)) * mapSize,
      y: ((z + worldHalfRef.current) / (worldHalfRef.current * 2)) * mapSize,
    }),
    [mapSize],
  )

  // Redraw loop (polls live positions — player/NPCs mutate outside React)
  useEffect(() => {
    if (collapsed) return
    let raf = 0
    let lastDraw = 0

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw)
      if (time - lastDraw < 100) return // 10 fps is plenty for a minimap
      lastDraw = time

      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return

      const player = getPlayer()
      const npcs = getNpcSnapshot()
      const currentPlayerFloor = player ? floorOfY(player.y - 1.7) : 0
      setPlayerFloor(currentPlayerFloor)
      const floor = selectedFloor === "auto" ? currentPlayerFloor : selectedFloor

      // v28.6: zoom the map out to city scale when the player is at ground
      // level outside the building footprint (out in the city district).
      const playerOutdoors = !!player && currentPlayerFloor === 0 && (Math.abs(player.x) > 46 || Math.abs(player.z) > 46)
      worldHalfRef.current = playerOutdoors ? CITY_WORLD_HALF : WORLD_HALF

      // Per-floor NPC counts for the tabs
      const counts = new Array(ROOFTOP_FLOOR + 1).fill(0)
      npcs.forEach((npc) => {
        if (npc.visible) counts[floorOfY(npc.y)]++
      })
      setFloorCounts(counts)

      // Background
      ctx.clearRect(0, 0, mapSize, mapSize)
      ctx.fillStyle = "rgba(6, 10, 20, 0.92)"
      ctx.fillRect(0, 0, mapSize, mapSize)

      // Grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)"
      ctx.lineWidth = 1
      for (let i = 1; i < 5; i++) {
        const g = (i / 5) * mapSize
        ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, mapSize); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(mapSize, g); ctx.stroke()
      }

      // Building boundary
      ctx.strokeStyle = floor === ROOFTOP_FLOOR ? "#fbbf24" : "#475569"
      ctx.lineWidth = 2
      const inner = worldToMap(-30, -30)
      const innerSize = ((60) / (worldHalfRef.current * 2)) * mapSize
      ctx.strokeRect(inner.x, inner.y, innerSize, innerSize)

      // Rooms layer for this floor
      if (layers.rooms) {
        ROOM_DESTINATIONS.filter((room) => room.floor === floor).forEach((room) => {
          const point = worldToMap(room.position.x, room.position.z)
          ctx.fillStyle = room.color
          ctx.beginPath()
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = "rgba(255,255,255,0.6)"
          ctx.lineWidth = 1
          ctx.stroke()
          if (layers.labels && expanded) {
            ctx.fillStyle = "rgba(255,255,255,0.85)"
            ctx.font = "9px sans-serif"
            ctx.textAlign = "center"
            ctx.fillText(room.name, point.x, point.y - 8)
          }
        })
      }

      // Portals layer (rooftop only)
      if (layers.portals && floor === ROOFTOP_FLOOR) {
        PORTAL_DESTINATIONS.forEach((portal) => {
          const point = worldToMap(portal.x, portal.z)
          ctx.fillStyle = portal.color
          ctx.fillRect(point.x - 4, point.y - 4, 8, 8)
          ctx.strokeStyle = "rgba(255,255,255,0.7)"
          ctx.strokeRect(point.x - 4, point.y - 4, 8, 8)
          if (layers.labels && expanded) {
            ctx.fillStyle = portal.color
            ctx.font = "bold 8px sans-serif"
            ctx.textAlign = "center"
            ctx.fillText(String(portal.port), point.x, point.y - 7)
          }
        })
      }

      // NPC layer: dots on this floor, dimmed ghosts one floor away
      if (layers.npcs) {
        npcs.forEach((npc) => {
          if (!npc.visible) return
          const npcFloor = floorOfY(npc.y)
          const sameFloor = npcFloor === floor
          if (!sameFloor && Math.abs(npcFloor - floor) > 1) return
          const point = worldToMap(npc.x, npc.z)
          ctx.globalAlpha = sameFloor ? 1 : 0.22
          ctx.fillStyle = npcColors[npc.id] || "#94a3b8"
          ctx.beginPath()
          ctx.arc(point.x, point.y, sameFloor ? 3.4 : 2.4, 0, Math.PI * 2)
          ctx.fill()
          if (npc.frozen && sameFloor) {
            ctx.strokeStyle = "#bae6fd"
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
          ctx.globalAlpha = 1
        })
      }

      // Player marker with facing wedge (highlight when viewing own floor)
      if (player) {
        const onThisFloor = currentPlayerFloor === floor
        const point = worldToMap(player.x, player.z)
        ctx.save()
        ctx.translate(point.x, point.y)
        ctx.rotate(-player.rotationY)
        ctx.globalAlpha = onThisFloor ? 1 : 0.3
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.moveTo(0, -7)
        ctx.lineTo(5, 6)
        ctx.lineTo(-5, 6)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = "#22d3ee"
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()
        ctx.globalAlpha = 1
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [collapsed, expanded, mapSize, selectedFloor, layers, getPlayer, getNpcSnapshot, npcColors, worldToMap])

  // Click on the map: teleport to the nearest room/portal marker under the tap
  const handleMapClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const mx = event.clientX - rect.left
    const my = event.clientY - rect.top
    const player = getPlayer()
    const floor = selectedFloor === "auto" ? (player ? floorOfY(player.y - 1.7) : 0) : selectedFloor

    if (floor === ROOFTOP_FLOOR && onEnterPortal) {
      for (const portal of PORTAL_DESTINATIONS) {
        const point = worldToMap(portal.x, portal.z)
        if (Math.hypot(point.x - mx, point.y - my) < 10) {
          onEnterPortal(portal.port)
          return
        }
      }
    }
    if (onNavigateRoom) {
      for (const room of ROOM_DESTINATIONS.filter((item) => item.floor === floor)) {
        const point = worldToMap(room.position.x, room.position.z)
        if (Math.hypot(point.x - mx, point.y - my) < 10) {
          onNavigateRoom(room.id)
          return
        }
      }
    }
  }

  const floorTabs: Array<{ key: number | "auto"; label: string }> = [
    { key: "auto", label: "Auto" },
    ...Array.from({ length: ROOFTOP_FLOOR }, (_, floor) => ({ key: floor as number | "auto", label: `${floor + 1}F` })),
    { key: ROOFTOP_FLOOR, label: "Roof" },
  ]

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={`fixed left-4 z-40 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/85 px-3 py-2 text-xs font-black text-white shadow-lg backdrop-blur hover:bg-slate-800 ${className}`}
      >
        <MapIcon size={14} /> Map <ChevronUp size={12} />
      </button>
    )
  }

  return (
    <div className={`fixed left-4 z-40 rounded-2xl border border-white/15 bg-slate-950/88 p-2 text-white shadow-2xl backdrop-blur ${className}`}>
      {/* Header row */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-cyan-200"><MapIcon size={12} /> Map</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded((prev) => !prev)} className="rounded-md bg-white/10 p-1 hover:bg-white/25" title={expanded ? "Smaller" : "Bigger"}>
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button onClick={() => setCollapsed(true)} className="rounded-md bg-white/10 p-1 hover:bg-white/25" title="Collapse map">
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Floor tabs with live NPC counts */}
      <div className="mb-1.5 flex flex-wrap gap-1">
        {floorTabs.map(({ key, label }) => {
          const active = selectedFloor === key
          const isPlayerHere = key !== "auto" && key === playerFloor
          const count = key === "auto" ? null : floorCounts[key as number] ?? 0
          return (
            <button
              key={String(key)}
              onClick={() => setSelectedFloor(key)}
              className={`rounded-md px-1.5 py-1 text-[10px] font-black leading-none ${active ? "bg-cyan-500 text-slate-950" : "bg-white/10 hover:bg-white/25"}`}
            >
              {label}
              {isPlayerHere && <span className="ml-0.5 text-[8px]">●</span>}
              {count !== null && count > 0 && <span className={`ml-0.5 text-[8px] ${active ? "text-slate-800" : "text-slate-400"}`}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={mapSize}
        height={mapSize}
        onClick={handleMapClick}
        className="cursor-crosshair rounded-lg"
        style={{ width: mapSize, height: mapSize }}
        title="Tap a room dot or portal square to teleport"
      />

      {/* Layer toggles */}
      <div className="mt-1.5 flex flex-wrap gap-1">
        {(Object.keys(layers) as Array<keyof typeof layers>).map((key) => (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            className={`rounded-md px-1.5 py-1 text-[9px] font-bold uppercase ${layers[key] ? "bg-emerald-500/80 text-slate-950" : "bg-white/10 text-slate-400 hover:bg-white/20"}`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}
