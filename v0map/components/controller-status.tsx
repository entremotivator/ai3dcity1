"use client"

import { useState, useEffect } from "react"
import { Gamepad } from "lucide-react"

interface ControllerStatusProps {
  isConnected: boolean
  className?: string
}

export function ControllerStatus({ isConnected, className = "" }: ControllerStatusProps) {
  const [visible, setVisible] = useState(true)

  // Hide the status after 5 seconds if connected
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 5000)

      return () => clearTimeout(timer)
    } else {
      setVisible(true)
    }
  }, [isConnected])

  if (!visible) return null

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full 
        ${isConnected ? "bg-green-600" : "bg-gray-700"} 
        text-white flex items-center gap-2 shadow-lg transition-all duration-300 ${className}`}
    >
      <Gamepad className={`h-5 w-5 ${isConnected ? "animate-pulse" : ""}`} />
      <span className="text-sm font-medium">{isConnected ? "Controller Connected" : "No Controller Detected"}</span>
    </div>
  )
}
