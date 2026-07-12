"use client"

import { useState, useEffect } from "react"

interface DebugOverlayProps {
  enabled?: boolean
}

export function DebugOverlay({ enabled = false }: DebugOverlayProps) {
  const [stats, setStats] = useState({
    fps: 0,
    memory: {
      geometries: 0,
      textures: 0,
    },
    renderer: {
      info: {
        render: {
          triangles: 0,
          calls: 0,
        },
        memory: {
          textures: 0,
          geometries: 0,
        },
      },
    },
  })

  useEffect(() => {
    if (!enabled) return

    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number

    const updateStats = () => {
      frameCount++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTime

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed)
        frameCount = 0
        lastTime = currentTime

        // Get renderer info if available
        const renderer = (window as any).__THREE_RENDERER__
        let rendererInfo = {
          info: {
            render: {
              triangles: 0,
              calls: 0,
            },
            memory: {
              textures: 0,
              geometries: 0,
            },
          },
        }

        if (renderer && renderer.info) {
          rendererInfo = renderer
        }

        setStats({
          fps,
          memory: {
            geometries: rendererInfo.info.memory.geometries || 0,
            textures: rendererInfo.info.memory.textures || 0,
          },
          renderer: rendererInfo,
        })
      }

      animationFrameId = requestAnimationFrame(updateStats)
    }

    updateStats()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="fixed top-0 left-0 bg-black/70 text-white p-2 text-xs font-mono z-50">
      <div>FPS: {stats.fps}</div>
      <div>Triangles: {stats.renderer.info.render.triangles}</div>
      <div>Draw calls: {stats.renderer.info.render.calls}</div>
      <div>Geometries: {stats.memory.geometries}</div>
      <div>Textures: {stats.memory.textures}</div>
    </div>
  )
}
