"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sun, Moon, Sunrise, Sunset, Clock } from "lucide-react"
import { TimeOfDay } from "./day-night-cycle"

interface TimeControlsProps {
  currentTime: TimeOfDay
  isAutoRotating: boolean
  cycleDuration: number
  onTimeChange: (time: TimeOfDay) => void
  onToggleAutoRotate: () => void
  onCycleDurationChange: (seconds: number) => void
  className?: string
}

export function TimeControls({
  currentTime,
  isAutoRotating,
  cycleDuration,
  onTimeChange,
  onToggleAutoRotate,
  onCycleDurationChange,
  className = "",
}: TimeControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getTimeIcon = () => {
    switch (currentTime) {
      case TimeOfDay.DAWN:
        return <Sunrise className="h-5 w-5" />
      case TimeOfDay.DAY:
        return <Sun className="h-5 w-5" />
      case TimeOfDay.DUSK:
        return <Sunset className="h-5 w-5" />
      case TimeOfDay.NIGHT:
        return <Moon className="h-5 w-5" />
    }
  }

  return (
    <Card className={`fixed top-4 left-4 bg-black/80 border-gray-700 shadow-lg z-20 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => setIsExpanded(!isExpanded)}>
            <Clock className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-1">
            {getTimeIcon()}
            <span className="text-xs text-white capitalize">{currentTime}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-gray-700">
            <div className="grid grid-cols-4 gap-1">
              <Button
                variant={currentTime === TimeOfDay.DAWN ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => onTimeChange(TimeOfDay.DAWN)}
              >
                <Sunrise className="h-4 w-4 mr-1" />
                <span className="text-xs">Dawn</span>
              </Button>
              <Button
                variant={currentTime === TimeOfDay.DAY ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => onTimeChange(TimeOfDay.DAY)}
              >
                <Sun className="h-4 w-4 mr-1" />
                <span className="text-xs">Day</span>
              </Button>
              <Button
                variant={currentTime === TimeOfDay.DUSK ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => onTimeChange(TimeOfDay.DUSK)}
              >
                <Sunset className="h-4 w-4 mr-1" />
                <span className="text-xs">Dusk</span>
              </Button>
              <Button
                variant={currentTime === TimeOfDay.NIGHT ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => onTimeChange(TimeOfDay.NIGHT)}
              >
                <Moon className="h-4 w-4 mr-1" />
                <span className="text-xs">Night</span>
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-cycle" className="text-xs text-white">
                  Auto Cycle
                </Label>
                <Switch id="auto-cycle" checked={isAutoRotating} onCheckedChange={onToggleAutoRotate} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cycle-duration" className="text-xs text-white">
                  Cycle Duration: {Math.round(cycleDuration / 60)} minutes
                </Label>
                <Slider
                  id="cycle-duration"
                  min={60}
                  max={1800}
                  step={60}
                  value={[cycleDuration]}
                  onValueChange={(value) => onCycleDurationChange(value[0])}
                  disabled={!isAutoRotating}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
