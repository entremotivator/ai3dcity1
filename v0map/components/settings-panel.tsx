"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Settings, X } from "lucide-react"

export interface SettingsConfig {
  graphics: {
    quality: "low" | "medium" | "high"
    shadows: boolean
    postProcessing: boolean
  }
  gameplay: {
    movementSpeed: number
    rotationSpeed: number
    fov: number
  }
  audio: {
    masterVolume: number
    musicVolume: number
    effectsVolume: number
    ambientVolume: number
  }
  interface: {
    showFps: boolean
    showMinimap: boolean
    showControls: boolean
  }
}

interface SettingsPanelProps {
  settings: SettingsConfig
  onSettingsChange: (settings: SettingsConfig) => void
  onClose: () => void
  className?: string
}

export function SettingsPanel({ settings, onSettingsChange, onClose, className = "" }: SettingsPanelProps) {
  const [currentSettings, setCurrentSettings] = useState<SettingsConfig>({ ...settings })
  const [activeTab, setActiveTab] = useState<"graphics" | "gameplay" | "audio" | "interface">("graphics")

  const handleSettingChange = <K extends keyof SettingsConfig, T extends keyof SettingsConfig[K]>(
    category: K,
    setting: T,
    value: SettingsConfig[K][T],
  ) => {
    const newSettings = {
      ...currentSettings,
      [category]: {
        ...currentSettings[category],
        [setting]: value,
      },
    }
    setCurrentSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const resetSettings = () => {
    const defaultSettings: SettingsConfig = {
      graphics: {
        quality: "medium",
        shadows: true,
        postProcessing: true,
      },
      gameplay: {
        movementSpeed: 0.15,
        rotationSpeed: 0.002,
        fov: 75,
      },
      audio: {
        masterVolume: 0.8,
        musicVolume: 0.5,
        effectsVolume: 0.7,
        ambientVolume: 0.6,
      },
      interface: {
        showFps: true,
        showMinimap: true,
        showControls: true,
      },
    }
    setCurrentSettings(defaultSettings)
    onSettingsChange(defaultSettings)
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex border-b mb-4">
          <Button
            variant={activeTab === "graphics" ? "default" : "ghost"}
            className="flex-1 rounded-none"
            onClick={() => setActiveTab("graphics")}
          >
            Graphics
          </Button>
          <Button
            variant={activeTab === "gameplay" ? "default" : "ghost"}
            className="flex-1 rounded-none"
            onClick={() => setActiveTab("gameplay")}
          >
            Gameplay
          </Button>
          <Button
            variant={activeTab === "audio" ? "default" : "ghost"}
            className="flex-1 rounded-none"
            onClick={() => setActiveTab("audio")}
          >
            Audio
          </Button>
          <Button
            variant={activeTab === "interface" ? "default" : "ghost"}
            className="flex-1 rounded-none"
            onClick={() => setActiveTab("interface")}
          >
            Interface
          </Button>
        </div>

        {activeTab === "graphics" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quality</Label>
              <div className="flex gap-2">
                <Button
                  variant={currentSettings.graphics.quality === "low" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSettingChange("graphics", "quality", "low")}
                >
                  Low
                </Button>
                <Button
                  variant={currentSettings.graphics.quality === "medium" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSettingChange("graphics", "quality", "medium")}
                >
                  Medium
                </Button>
                <Button
                  variant={currentSettings.graphics.quality === "high" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSettingChange("graphics", "quality", "high")}
                >
                  High
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="shadows">Shadows</Label>
              <Switch
                id="shadows"
                checked={currentSettings.graphics.shadows}
                onCheckedChange={(checked) => handleSettingChange("graphics", "shadows", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="postProcessing">Post Processing</Label>
              <Switch
                id="postProcessing"
                checked={currentSettings.graphics.postProcessing}
                onCheckedChange={(checked) => handleSettingChange("graphics", "postProcessing", checked)}
              />
            </div>
          </div>
        )}

        {activeTab === "gameplay" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="movementSpeed">
                  Movement Speed: {currentSettings.gameplay.movementSpeed.toFixed(2)}
                </Label>
              </div>
              <Slider
                id="movementSpeed"
                min={0.05}
                max={0.3}
                step={0.01}
                value={[currentSettings.gameplay.movementSpeed]}
                onValueChange={(value) => handleSettingChange("gameplay", "movementSpeed", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotationSpeed">
                  Rotation Speed: {currentSettings.gameplay.rotationSpeed.toFixed(3)}
                </Label>
              </div>
              <Slider
                id="rotationSpeed"
                min={0.001}
                max={0.005}
                step={0.0001}
                value={[currentSettings.gameplay.rotationSpeed]}
                onValueChange={(value) => handleSettingChange("gameplay", "rotationSpeed", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="fov">Field of View: {currentSettings.gameplay.fov}°</Label>
              </div>
              <Slider
                id="fov"
                min={60}
                max={90}
                step={1}
                value={[currentSettings.gameplay.fov]}
                onValueChange={(value) => handleSettingChange("gameplay", "fov", value[0])}
              />
            </div>
          </div>
        )}

        {activeTab === "audio" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="masterVolume">
                  Master Volume: {Math.round(currentSettings.audio.masterVolume * 100)}%
                </Label>
              </div>
              <Slider
                id="masterVolume"
                min={0}
                max={1}
                step={0.01}
                value={[currentSettings.audio.masterVolume]}
                onValueChange={(value) => handleSettingChange("audio", "masterVolume", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="musicVolume">
                  Music Volume: {Math.round(currentSettings.audio.musicVolume * 100)}%
                </Label>
              </div>
              <Slider
                id="musicVolume"
                min={0}
                max={1}
                step={0.01}
                value={[currentSettings.audio.musicVolume]}
                onValueChange={(value) => handleSettingChange("audio", "musicVolume", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="effectsVolume">
                  Effects Volume: {Math.round(currentSettings.audio.effectsVolume * 100)}%
                </Label>
              </div>
              <Slider
                id="effectsVolume"
                min={0}
                max={1}
                step={0.01}
                value={[currentSettings.audio.effectsVolume]}
                onValueChange={(value) => handleSettingChange("audio", "effectsVolume", value[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ambientVolume">
                  Ambient Volume: {Math.round(currentSettings.audio.ambientVolume * 100)}%
                </Label>
              </div>
              <Slider
                id="ambientVolume"
                min={0}
                max={1}
                step={0.01}
                value={[currentSettings.audio.ambientVolume]}
                onValueChange={(value) => handleSettingChange("audio", "ambientVolume", value[0])}
              />
            </div>
          </div>
        )}

        {activeTab === "interface" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showFps">Show FPS</Label>
              <Switch
                id="showFps"
                checked={currentSettings.interface.showFps}
                onCheckedChange={(checked) => handleSettingChange("interface", "showFps", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showMinimap">Show Minimap</Label>
              <Switch
                id="showMinimap"
                checked={currentSettings.interface.showMinimap}
                onCheckedChange={(checked) => handleSettingChange("interface", "showMinimap", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showControls">Show Controls</Label>
              <Switch
                id="showControls"
                checked={currentSettings.interface.showControls}
                onCheckedChange={(checked) => handleSettingChange("interface", "showControls", checked)}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={resetSettings}>
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
