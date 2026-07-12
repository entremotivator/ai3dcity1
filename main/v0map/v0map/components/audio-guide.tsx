"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export function AudioGuide() {
  const [isPlaying, setIsPlaying] = useState(false)

  const toggleAudioGuide = () => {
    setIsPlaying(!isPlaying)
    // Audio guide implementation would go here
  }

  return (
    <div className="absolute top-4 right-4 space-y-2">
      <Button variant="secondary" onClick={toggleAudioGuide} className="w-full">
        {isPlaying ? "Stop Audio Guide" : "Start Audio Guide"}
      </Button>
    </div>
  )
}
