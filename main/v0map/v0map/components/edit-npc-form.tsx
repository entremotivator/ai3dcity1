"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Save } from "lucide-react"
import type { NPCData } from "./npc"

interface EditNPCFormProps {
  npcs: NPCData[]
  onEditNPC: (id: number, newName: string, newStreamlitUrl: string) => void
  onClose: () => void
}

export function EditNPCForm({ npcs, onEditNPC, onClose }: EditNPCFormProps) {
  const [selectedNpcId, setSelectedNpcId] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [streamlitUrl, setStreamlitUrl] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle NPC selection
  const handleSelectNPC = (id: number) => {
    const npc = npcs.find((npc) => npc.id === id)
    if (npc) {
      setSelectedNpcId(id)
      setName(npc.name)
      setStreamlitUrl(npc.streamlitUrl)
      setErrors({})
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    const newErrors: Record<string, string> = {}

    if (!selectedNpcId) {
      newErrors.selectedNpcId = "Please select an NPC to edit"
    }

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!streamlitUrl.trim() || (!streamlitUrl.startsWith("http") && !streamlitUrl.startsWith("["))) {
      newErrors.streamlitUrl = "Enter a WordPress shortcode like [aisc_hub] or a valid live URL"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit the edit
    if (selectedNpcId) {
      onEditNPC(selectedNpcId, name, streamlitUrl)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit NPC</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select NPC to Edit</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {npcs.map((npc) => (
                <Button
                  key={npc.id}
                  variant={selectedNpcId === npc.id ? "default" : "outline"}
                  className="justify-start overflow-hidden"
                  onClick={() => handleSelectNPC(npc.id)}
                >
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: npc.color }} />
                  <span className="truncate">{npc.name}</span>
                </Button>
              ))}
            </div>
            {errors.selectedNpcId && <p className="text-red-500 text-xs">{errors.selectedNpcId}</p>}
          </div>

          {selectedNpcId && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">NPC Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter NPC name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="streamlitUrl">WordPress Shortcode or Live URL</Label>
                <Input
                  id="streamlitUrl"
                  value={streamlitUrl}
                  onChange={(e) => setStreamlitUrl(e.target.value)}
                  placeholder="[aisc_hub] or https://entremotivator.com/v0map-npc-gallery/?v0map_shortcode_tag=aisc_hub&v0map_embed=1"
                  className={errors.streamlitUrl ? "border-red-500" : ""}
                />
                {errors.streamlitUrl && <p className="text-red-500 text-xs">{errors.streamlitUrl}</p>}
              </div>

              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
