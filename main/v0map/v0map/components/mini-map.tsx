"use client"

import { useEffect, useRef, useState } from "react"
import type * as THREE from "three"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, Layers } from "lucide-react"

interface MiniMapProps {
  playerPosition: THREE.Vector3
  playerRotation: number
  npcs: Array<{
    position: THREE.Vector3
    color: string
    isActive: boolean
    name?: string
    id?: number
  }>
  roomSize: number
  className?: string
  galleryItems?: Array<{
    title: string
    position: { x: number; y: number; z: number }
  }>
}

export function MiniMap({
  playerPosition,
  playerRotation,
  npcs,
  roomSize,
  className = "",
  galleryItems = [],
}: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const mapSize = expanded ? 240 : 120

  // Store NPC positions for heatmap
  const npcPositionsRef = useRef<Array<{ x: number; z: number; time: number }>>([])

  // Add NPC positions to history for heatmap
  useEffect(() => {
    if (!showHeatmap) return

    npcs.forEach((npc) => {
      if (npc.isActive) {
        npcPositionsRef.current.push({
          x: npc.position.x,
          z: npc.position.z,
          time: Date.now(),
        })
      }
    })

    // Limit history to last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    npcPositionsRef.current = npcPositionsRef.current.filter((pos) => pos.time > fiveMinutesAgo)
  }, [npcs, showHeatmap])

  // Draw the main map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set background
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw room boundaries
    ctx.strokeStyle = "#444"
    ctx.lineWidth = 2
    const roomSizeScaled = (roomSize / 60) * mapSize
    const roomOffset = mapSize / 2 - roomSizeScaled / 2
    ctx.strokeRect(roomOffset, roomOffset, roomSizeScaled, roomSizeScaled)

    // Draw exhibits as small dots with labels
    ctx.fillStyle = "#888"

    // North wall
    drawWallExhibits(ctx, 0, -1, 5, mapSize, roomSizeScaled, roomOffset)
    // East wall
    drawWallExhibits(ctx, 1, 0, 5, mapSize, roomSizeScaled, roomOffset)
    // South wall
    drawWallExhibits(ctx, 0, 1, 5, mapSize, roomSizeScaled, roomOffset)
    // West wall
    drawWallExhibits(ctx, -1, 0, 5, mapSize, roomSizeScaled, roomOffset)

    // Draw gallery item labels if expanded and labels are enabled
    if (expanded && showLabels && galleryItems.length > 0) {
      ctx.font = "6px Arial"
      ctx.fillStyle = "#fff"
      ctx.textAlign = "center"

      galleryItems.forEach((item) => {
        const itemX = mapSize / 2 + (item.position.x / (roomSize / 2)) * (mapSize / 2)
        const itemZ = mapSize / 2 + (item.position.z / (roomSize / 2)) * (mapSize / 2)

        // Draw a small marker for the item
        ctx.fillStyle = "#4a90e2"
        ctx.beginPath()
        ctx.arc(itemX, itemZ, 2, 0, Math.PI * 2)
        ctx.fill()

        // Draw the label
        ctx.fillStyle = "#fff"
        const shortTitle = item.title.length > 12 ? item.title.substring(0, 10) + "..." : item.title

        // Determine label position based on wall
        let labelX = itemX
        let labelY = itemZ

        // Adjust label position based on which wall it's on
        if (Math.abs(item.position.z) > Math.abs(item.position.x)) {
          // North or South wall
          labelY = item.position.z < 0 ? itemZ - 6 : itemZ + 6
        } else {
          // East or West wall
          labelX = item.position.x > 0 ? itemX + 6 : itemX - 6
          ctx.textAlign = item.position.x > 0 ? "left" : "right"
        }

        ctx.fillText(shortTitle, labelX, labelY)
        ctx.textAlign = "center" // Reset text alignment
      })
    }

    // Draw NPCs
    npcs.forEach((npc) => {
      if (!npc.isActive) return

      const npcX = mapSize / 2 + (npc.position.x / (roomSize / 2)) * (mapSize / 2)
      const npcZ = mapSize / 2 + (npc.position.z / (roomSize / 2)) * (mapSize / 2)

      ctx.fillStyle = npc.color
      ctx.beginPath()
      ctx.arc(npcX, npcZ, expanded ? 4 : 2, 0, Math.PI * 2)
      ctx.fill()

      // Draw NPC ID/name if expanded
      if (expanded && npc.name) {
        ctx.font = "6px Arial"
        ctx.fillStyle = "#fff"
        ctx.textAlign = "center"
        ctx.fillText(npc.id?.toString() || "", npcX, npcZ - 5)
      }
    })

    // Draw player
    const playerX = mapSize / 2 + (playerPosition.x / (roomSize / 2)) * (mapSize / 2)
    const playerZ = mapSize / 2 + (playerPosition.z / (roomSize / 2)) * (mapSize / 2)

    // Draw player position
    ctx.fillStyle = "#4CAF50"
    ctx.beginPath()
    ctx.arc(playerX, playerZ, expanded ? 5 : 3, 0, Math.PI * 2)
    ctx.fill()

    // Draw player direction
    const dirLength = expanded ? 10 : 6
    const dirX = playerX + Math.sin(playerRotation) * dirLength
    const dirZ = playerZ + Math.cos(playerRotation) * dirLength

    ctx.strokeStyle = "#4CAF50"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playerX, playerZ)
    ctx.lineTo(dirX, dirZ)
    ctx.stroke()

    // Draw "YOU" label next to player
    if (expanded) {
      ctx.font = "8px Arial"
      ctx.fillStyle = "#4CAF50"
      ctx.textAlign = "center"
      ctx.fillText("YOU", playerX, playerZ - 8)
    }

    // Draw compass
    drawCompass(ctx, mapSize)
  }, [playerPosition, playerRotation, npcs, roomSize, expanded, mapSize, showLabels, galleryItems])

  // Draw heatmap
  useEffect(() => {
    if (!showHeatmap) return

    const canvas = heatmapCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Skip if no positions
    if (npcPositionsRef.current.length === 0) return

    // Create heatmap
    ctx.globalAlpha = 0.6

    // Draw each position with a gradient
    npcPositionsRef.current.forEach((pos) => {
      const x = mapSize / 2 + (pos.x / (roomSize / 2)) * (mapSize / 2)
      const z = mapSize / 2 + (pos.z / (roomSize / 2)) * (mapSize / 2)

      // Calculate age factor (newer positions are more intense)
      const age = (Date.now() - pos.time) / (5 * 60 * 1000) // 0 to 1 where 0 is newest
      const intensity = 1 - age

      // Create radial gradient
      const radius = expanded ? 15 : 8
      const gradient = ctx.createRadialGradient(x, z, 0, x, z, radius)
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.7})`)
      gradient.addColorStop(1, "rgba(255, 0, 0, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, z, radius, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.globalAlpha = 1.0
  }, [showHeatmap, mapSize, roomSize, npcs])

  // Helper function to draw exhibits on a wall
  const drawWallExhibits = (
    ctx: CanvasRenderingContext2D,
    xDir: number,
    zDir: number,
    count: number,
    mapSize: number,
    roomSizeScaled: number,
    roomOffset: number,
  ) => {
    const spacing = roomSizeScaled / (count + 1)
    for (let i = 1; i <= count; i++) {
      const x = mapSize / 2 + xDir * (roomSizeScaled / 2 - 1)
      const z = mapSize / 2 + zDir * (roomSizeScaled / 2 - 1)

      // Adjust position based on wall
      const adjustedX = xDir === 0 ? roomOffset + i * spacing : x
      const adjustedZ = zDir === 0 ? roomOffset + i * spacing : z

      ctx.beginPath()
      ctx.arc(adjustedX, adjustedZ, expanded ? 3 : 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Helper function to draw compass
  const drawCompass = (ctx: CanvasRenderingContext2D, mapSize: number) => {
    const compassRadius = expanded ? 15 : 10
    const compassX = mapSize - compassRadius - 5
    const compassY = compassRadius + 5

    // Draw compass circle
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.beginPath()
    ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2)
    ctx.stroke()

    // Draw compass directions
    ctx.font = expanded ? "8px Arial" : "6px Arial"
    ctx.fillStyle = "#fff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // North
    ctx.fillStyle = "#f44336" // Red for North
    ctx.fillText("N", compassX, compassY - compassRadius + 5)

    // Other directions
    ctx.fillStyle = "#fff"
    ctx.fillText("E", compassX + compassRadius - 5, compassY)
    ctx.fillText("S", compassX, compassY + compassRadius - 5)
    ctx.fillText("W", compassX - compassRadius + 5, compassY)
  }

  return (
    <Card
      className={`fixed top-32 left-4 p-2 bg-black/80 border-gray-700 shadow-lg z-20 ${className}`}
      style={{ width: mapSize + 16, height: mapSize + 48 }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-white">Mini Map</span>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white p-0"
            onClick={() => setShowHeatmap(!showHeatmap)}
            title={showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          >
            <Layers className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white p-0"
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? "Hide Labels" : "Show Labels"}
          >
            <span className="text-xs">Aa</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white p-0"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Minimize" : "Expand"}
          >
            {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={mapSize} height={mapSize} className="rounded-sm" />
        {showHeatmap && (
          <canvas
            ref={heatmapCanvasRef}
            width={mapSize}
            height={mapSize}
            className="absolute top-0 left-0 rounded-sm pointer-events-none"
          />
        )}
      </div>
    </Card>
  )
}
