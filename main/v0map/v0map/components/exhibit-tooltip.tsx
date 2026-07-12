"use client"

import { useState, useEffect } from "react"

interface ExhibitTooltipProps {
  title: string
  description: string
}

export function ExhibitTooltip({ title, description }: ExhibitTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Position the tooltip slightly offset from the cursor
      setPosition({ x: e.clientX + 15, y: e.clientY + 15 })
    }

    // Custom event for showing/hiding the tooltip
    const handleShowTooltip = (e: CustomEvent) => {
      if (e.detail) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("exhibit-hover" as any, handleShowTooltip as any)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("exhibit-hover" as any, handleShowTooltip as any)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed z-50 bg-black/80 text-white p-3 rounded-md shadow-lg pointer-events-none max-w-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(0, -50%)",
      }}
    >
      <h3 className="font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-300">{description}</p>
    </div>
  )
}
