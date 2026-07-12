"use client"

import { useState, useEffect } from "react"

export function Controls() {
  const [debugInfo, setDebugInfo] = useState({
    fps: 0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  })

  useEffect(() => {
    let lastTime = performance.now()
    let frames = 0

    function updateDebugInfo() {
      const camera = (window as any).camera
      if (camera) {
        setDebugInfo((prev) => ({
          ...prev,
          position: {
            x: camera.position.x.toFixed(2),
            y: camera.position.y.toFixed(2),
            z: camera.position.z.toFixed(2),
          },
          rotation: {
            x: camera.rotation.x.toFixed(2),
            y: camera.rotation.y.toFixed(2),
            z: camera.rotation.z.toFixed(2),
          },
        }))
      }

      frames++
      const time = performance.now()
      if (time >= lastTime + 1000) {
        setDebugInfo((prev) => ({ ...prev, fps: frames }))
        frames = 0
        lastTime = time
      }

      requestAnimationFrame(updateDebugInfo)
    }

    updateDebugInfo()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded">
      <h3 className="font-bold mb-2">Controls</h3>
      <ul className="space-y-1 text-sm">
        <li>↑/↓ - Move forward/backward</li>
        <li>←/→ - Move left/right</li>
        <li>A/D - Rotate left/right</li>
        <li>Mouse - Look around</li>
        <li>Click - Interact with exhibits</li>
        <li>Joystick - Alternative movement</li>
      </ul>
      <h3 className="font-bold mt-4 mb-2">Debug Info</h3>
      <ul className="space-y-1 text-sm">
        <li>FPS: {debugInfo.fps}</li>
        <li>
          Position: ({debugInfo.position.x}, {debugInfo.position.y}, {debugInfo.position.z})
        </li>
        <li>
          Rotation: ({debugInfo.rotation.x}, {debugInfo.rotation.y}, {debugInfo.rotation.z})
        </li>
      </ul>
    </div>
  )
}
