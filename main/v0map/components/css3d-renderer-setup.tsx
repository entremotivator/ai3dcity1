"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js"
import type { Scene, PerspectiveCamera } from "three"

interface CSS3DRendererSetupProps {
  sceneRef: React.MutableRefObject<Scene | null>
  cameraRef: React.MutableRefObject<PerspectiveCamera | null>
}

export function CSS3DRendererSetup({ sceneRef, cameraRef }: CSS3DRendererSetupProps) {
  const rendererRef = useRef<CSS3DRenderer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !containerRef.current) return

    // Create CSS3D renderer
    const renderer = new CSS3DRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.top = "0"
    renderer.domElement.style.pointerEvents = "none" // Allow click-through
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Handle window resize
    const handleResize = () => {
      if (rendererRef.current && cameraRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [sceneRef, cameraRef])

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />
}
