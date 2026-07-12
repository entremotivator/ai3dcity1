"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, ArrowUp, ArrowDown, Compass } from "lucide-react"

interface FlyingModeControlProps {
  isEnabled: boolean
  onToggle: () => void
  onFlyUp: () => void
  onFlyDown: () => void
  onReset: () => void
  className?: string
}

export function FlyingModeControl({
  isEnabled,
  onToggle,
  onFlyUp,
  onFlyDown,
  onReset,
  className = "",
}: FlyingModeControlProps) {
  return (
    <Card className={`fixed top-4 left-4 bg-black/80 border-gray-700 shadow-lg z-20 p-3 ${className}`}>
      <div className="flex flex-col gap-2">
        <Button
          variant={isEnabled ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <Plane className={`h-4 w-4 ${isEnabled ? "animate-pulse" : ""}`} />
          {isEnabled ? "Disable Flying" : "Enable Flying"}
        </Button>

        {isEnabled && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={onFlyUp} className="flex items-center justify-center">
              <ArrowUp className="h-4 w-4" />
              <span className="ml-1">Up</span>
            </Button>

            <Button variant="outline" size="sm" onClick={onFlyDown} className="flex items-center justify-center">
              <ArrowDown className="h-4 w-4" />
              <span className="ml-1">Down</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex items-center justify-center col-span-2"
            >
              <Compass className="h-4 w-4" />
              <span className="ml-1">Reset Height</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
