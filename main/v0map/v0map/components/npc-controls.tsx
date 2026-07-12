"use client"

import { useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, MessageSquare, Video, UserPlus, Coffee, Building, Shuffle, Target, MapPin, Upload, Navigation } from "lucide-react"
import type { NPCData } from "./npc"
import { ROOFTOP_FLOOR } from "./office-building"
import { CustomNPCManager } from "./custom-npc-manager"

// Update the NPCControlsProps interface to add the new functions
interface NPCControlsProps {
  npcs: NPCData[]
  activeNpcs: Set<number>
  onToggleNpc: (id: number) => void
  onToggleAll: (active: boolean) => void
  onCallMeeting: () => boolean
  onOpenAllStreamlit: () => void
  onAddNPC: (npc: NPCData) => void
  onRemoveNPC: (id: number) => void
  onReplaceNPC: (id: number, newData: NPCData) => void
  onEditNPC: (id: number, newName: string, newStreamlitUrl: string) => void
  onCallNPC: (id: number) => void
  onMakeCall: () => void
  onBreakCall: () => void
  onScatterNPCs?: () => void // Scatter NPCs randomly
  onGatherNPCs?: () => void // Gather NPCs to a point
  onSendToFloor?: (floor: number, team?: string) => void // Send NPCs to specific floor
  onNavigateToFloor?: (floor: number) => void
  onCallTeam?: (team: string) => void
  onToggleTeam?: (team: string, active: boolean) => void
  onOpenTeamApps?: (team: string) => void
  onImportTeams?: (payload: any) => void
  isMeetingActive: boolean
  isAtTables: boolean
  currentFloor?: number // Current floor indicator
  defaultNpcCount?: number
  className?: string
}

// Update the function parameters to include the new props
export function NPCControls({
  npcs,
  activeNpcs,
  onToggleNpc,
  onToggleAll,
  onCallMeeting,
  onOpenAllStreamlit,
  onAddNPC,
  onRemoveNPC,
  onReplaceNPC,
  onEditNPC,
  onCallNPC,
  onMakeCall,
  onBreakCall,
  onScatterNPCs,
  onGatherNPCs,
  onSendToFloor,
  onNavigateToFloor,
  onCallTeam,
  onToggleTeam,
  onOpenTeamApps,
  onImportTeams,
  isMeetingActive,
  isAtTables,
  currentFloor = 0,
  defaultNpcCount = 10,
  className = "",
}: NPCControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomNPCManager, setShowCustomNPCManager] = useState(false)
  const teams = Array.from(new Set(npcs.map((npc) => npc.team || "General")))
  const [selectedTeam, setSelectedTeam] = useState(teams[0] || "General")
  const selectedTeamIds = npcs.filter((npc) => (npc.team || "General") === selectedTeam).map((npc) => npc.id)
  const selectedTeamActive = selectedTeamIds.some((id) => activeNpcs.has(id))

  const allActive = activeNpcs.size === npcs.length

  // Separate default NPCs from custom NPCs.
  const defaultNPCs = npcs.filter((npc) => npc.id <= defaultNpcCount)
  const customNPCs = npcs.filter((npc) => npc.id > defaultNpcCount)

  const handleTeamImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onImportTeams) return

    const text = await file.text()
    onImportTeams(JSON.parse(text))
    event.target.value = ""
  }

  const renderNPCRow = (npc: NPCData) => (
    <div key={npc.id} className="rounded border p-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`npc-${npc.id}`} className="min-w-0 flex items-center gap-2">
          <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: npc.color }} />
          <span className="truncate">{npc.name}</span>
        </Label>
        <Switch id={`npc-${npc.id}`} checked={activeNpcs.has(npc.id)} onCheckedChange={() => onToggleNpc(npc.id)} />
      </div>
      <div className="mt-1 grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="min-w-0 text-[11px] text-muted-foreground">
          <div className="truncate">{npc.team || "General"} · {npc.role || "AI Specialist"}</div>
          <div className="truncate">{(npc.skills || []).slice(0, 3).join(", ") || "ready"}</div>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onCallNPC(npc.id)} title={`Call ${npc.name} here`}>
            <Navigation className="mr-1 h-3 w-3" />
            Come
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenAllStreamlit()} title="Open active NPC apps">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`fixed top-4 right-4 z-10 ${className}`}>
      <Button variant="secondary" onClick={() => setIsOpen(!isOpen)} className="mb-2 w-full">
        {isOpen ? "Hide NPC Controls" : "Show NPC Controls"}
      </Button>

      {isOpen && (
        <>
          {showCustomNPCManager ? (
            <CustomNPCManager
              npcs={npcs}
              onAddNPC={onAddNPC}
              onRemoveNPC={onRemoveNPC}
              onReplaceNPC={onReplaceNPC}
              onEditNPC={onEditNPC}
              onClose={() => setShowCustomNPCManager(false)}
              defaultNpcCount={defaultNpcCount}
            />
          ) : (
            <Card className="w-96 max-h-[84vh] overflow-y-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>NPC Controls</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCustomNPCManager(true)}
                    title="Manage Custom NPCs"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label className="text-sm font-bold">Floor Manager</Label>
                    {onImportTeams && (
                      <Label className="inline-flex cursor-pointer items-center rounded-md border px-2 py-1 text-xs">
                        <Upload className="mr-1 h-3 w-3" />
                        Import Teams
                        <input type="file" accept="application/json,.json" className="hidden" onChange={handleTeamImport} />
                      </Label>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: ROOFTOP_FLOOR + 1 }, (_, floor) => floor).map((floor) => (
                      <Button
                        key={floor}
                        variant={currentFloor === floor ? "default" : "outline"}
                        size="sm"
                        onClick={() => onNavigateToFloor?.(floor)}
                        title={floor === ROOFTOP_FLOOR ? "Go to rooftop" : `Go to floor ${floor + 1}`}
                      >
                        {floor === ROOFTOP_FLOOR ? "Roof" : `${floor + 1}F`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 pb-2 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <Label htmlFor="all-npcs" className="font-bold">
                      All NPCs ({npcs.length})
                    </Label>
                    <Button
                      variant={allActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => onToggleAll(!allActive)}
                    >
                      {allActive ? "Remove All" : "Show All"}
                    </Button>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <Button
                      variant={isMeetingActive ? "destructive" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={onCallMeeting}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {isMeetingActive ? "End Meeting" : "Call Meeting"}
                    </Button>

                    <Button
                      variant={isAtTables ? "destructive" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={isAtTables ? onBreakCall : onMakeCall}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      {isAtTables ? "Break" : "Make Call"}
                    </Button>

                    <Button variant="outline" size="sm" className="flex-1" onClick={onOpenAllStreamlit}>
                      <Video className="mr-2 h-4 w-4" />
                      Open Apps
                    </Button>
                  </div>

                  {/* Additional NPC Controls */}
                  <div className="flex gap-2 mb-3">
                    {onScatterNPCs && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={onScatterNPCs}
                      >
                        <Shuffle className="mr-2 h-4 w-4" />
                        Scatter
                      </Button>
                    )}
                    {onGatherNPCs && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={onGatherNPCs}
                      >
                        <Target className="mr-2 h-4 w-4" />
                        Gather
                      </Button>
                    )}
                  </div>

                  {/* Floor Controls */}
                  {onSendToFloor && (
                    <div className="mb-3">
                      <Label className="text-xs mb-2 block">Send NPCs to Floor</Label>
                      <div className="grid grid-cols-4 gap-1">
                        {Array.from({ length: ROOFTOP_FLOOR + 1 }, (_, floor) => floor).map((floor) => (
                          <Button
                            key={floor}
                            variant={currentFloor === floor ? "default" : "outline"}
                            size="sm"
                            className="px-1"
                            onClick={() => onSendToFloor(floor)}
                          >
                            {floor === ROOFTOP_FLOOR ? <Coffee className="mr-1 h-3 w-3" /> : <Building className="mr-1 h-3 w-3" />}
                            {floor === ROOFTOP_FLOOR ? "Roof" : `${floor + 1}F`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {teams.length > 0 && (
                  <div className="mb-4 rounded border p-3">
                    <Label className="mb-2 block text-sm font-bold">NPC Teams</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="mb-2">
                        <SelectValue placeholder="Choose team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => onCallTeam?.(selectedTeam)}>
                        <Users className="mr-1 h-3 w-3" />
                        Call Team
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onOpenTeamApps?.(selectedTeam)}>
                        <Video className="mr-1 h-3 w-3" />
                        Team Apps
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onToggleTeam?.(selectedTeam, !selectedTeamActive)}>
                        {selectedTeamActive ? "Hide Team" : "Show Team"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onSendToFloor?.(currentFloor, selectedTeam)}>
                        <MapPin className="mr-1 h-3 w-3" />
                        Team Here
                      </Button>
                    </div>
                  </div>
                )}

                {/* Default NPCs Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">Default NPCs ({defaultNPCs.length})</h3>
                  <div className="space-y-2">{defaultNPCs.map(renderNPCRow)}</div>
                </div>

                {/* Custom NPCs Section */}
                {customNPCs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Custom NPCs</h3>
                    <div className="space-y-2">{customNPCs.map(renderNPCRow)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
