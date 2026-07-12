"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, X, RefreshCw, User } from "lucide-react"
import type { NPCData } from "./npc"
import { AddNPCForm } from "./add-npc-form"
import { ReplaceNPCForm } from "./replace-npc-form"
import { EditNPCForm } from "./edit-npc-form"

interface CustomNPCManagerProps {
  npcs: NPCData[]
  onAddNPC: (npc: NPCData) => void
  onRemoveNPC: (id: number) => void
  onReplaceNPC: (id: number, newData: NPCData) => void
  onEditNPC: (id: number, newName: string, newStreamlitUrl: string) => void
  onClose: () => void
  defaultNpcCount?: number
  className?: string
}

export function CustomNPCManager({
  npcs,
  onAddNPC,
  onRemoveNPC,
  onReplaceNPC,
  onEditNPC,
  onClose,
  defaultNpcCount = 24,
  className = "",
}: CustomNPCManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showReplaceForm, setShowReplaceForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [customNPCs, setCustomNPCs] = useState<NPCData[]>([])

  // Filter to only show true custom NPCs.
  useEffect(() => {
    setCustomNPCs(npcs.filter((npc) => npc.id > defaultNpcCount))
  }, [defaultNpcCount, npcs])

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Custom NPCs</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {showAddForm ? (
          <AddNPCForm
            onAddNPC={(npc) => {
              onAddNPC(npc)
              setShowAddForm(false)
            }}
            existingNPCs={npcs}
            onClose={() => setShowAddForm(false)}
          />
        ) : showReplaceForm ? (
          <ReplaceNPCForm
            npcs={npcs}
            onReplaceNPC={(id, newData) => {
              onReplaceNPC(id, newData)
              setShowReplaceForm(false)
            }}
            onClose={() => setShowReplaceForm(false)}
          />
        ) : showEditForm ? (
          <EditNPCForm
            npcs={npcs}
            onEditNPC={(id, newName, newStreamlitUrl) => {
              onEditNPC(id, newName, newStreamlitUrl)
              setShowEditForm(false)
            }}
            onClose={() => setShowEditForm(false)}
          />
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New NPC
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowReplaceForm(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Replace NPC
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowEditForm(true)}>
                <User className="mr-2 h-4 w-4" />
                Edit NPC
              </Button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {customNPCs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No custom NPCs added yet</div>
              ) : (
                <div className="space-y-3">
                  {customNPCs.map((npc) => (
                    <div key={npc.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        {npc.model === "glb" ? (
                          <div className="w-4 h-4 rounded-full bg-purple-500" title="3D Model" />
                        ) : (
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: npc.color }} />
                        )}
                        <span className="font-medium">{npc.name}</span>
                        {npc.model === "glb" && <span className="text-xs text-gray-500">(3D Model)</span>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => onRemoveNPC(npc.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}
