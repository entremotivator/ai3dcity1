"use client"

import { useState, useEffect } from "react"
import type { NPCData } from "./npc"

interface NPCInteractionButtonProps {
  npc: NPCData
  onInteract: (npc: NPCData) => void
}

export function NPCInteractionButton({ npc, onInteract }: NPCInteractionButtonProps) {
  const [visible, setVisible] = useState(true)
  const [pulseAnimation, setPulseAnimation] = useState(false)

  useEffect(() => {
    // Start pulse animation
    const interval = setInterval(() => {
      setPulseAnimation((prev) => !prev)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!visible) return null

  return (
    <button
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg z-50 transition-all duration-300 ${
        pulseAnimation ? "scale-110" : "scale-100"
      }`}
      onClick={() => onInteract(npc)}
    >
      Talk to {npc.name}
    </button>
  )
}
