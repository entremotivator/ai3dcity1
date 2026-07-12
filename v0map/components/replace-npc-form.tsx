"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X, RefreshCw, FileUp, AlertCircle } from "lucide-react"
import type { NPCData } from "./npc"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AVAILABLE_MODELS } from "./preload-models"

interface ReplaceNPCFormProps {
  npcs: NPCData[]
  onReplaceNPC: (id: number, newData: NPCData) => void
  onClose: () => void
}

export function ReplaceNPCForm({ npcs, onReplaceNPC, onClose }: ReplaceNPCFormProps) {
  const [selectedNpcId, setSelectedNpcId] = useState<string>("")
  // Use the first available model as default
  const [glbUrl, setGlbUrl] = useState(AVAILABLE_MODELS[0].url)
  const [selectedModelIndex, setSelectedModelIndex] = useState(0)
  const [useReadyPlayerMe, setUseReadyPlayerMe] = useState(false)
  const [readyPlayerMeUrl, setReadyPlayerMeUrl] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Check if the file is a GLB file
    if (!file.name.toLowerCase().endsWith(".glb")) {
      toast.error("Please upload a GLB file")
      return
    }

    // Revoke previous blob URL if it exists
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl)
    }

    // Create a blob URL for the file
    const blobUrl = URL.createObjectURL(file)
    setUploadedFile(file)
    setUploadedFileUrl(blobUrl)
    setGlbUrl("") // Clear the URL input when a file is uploaded

    toast.success(`File "${file.name}" uploaded successfully`)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleModelSelect = (index: number) => {
    setSelectedModelIndex(index)
    setGlbUrl(AVAILABLE_MODELS[index].url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    const newErrors: Record<string, string> = {}

    if (!selectedNpcId) {
      newErrors.selectedNpcId = "Please select an NPC to replace"
    }

    if (!glbUrl.trim() && !useReadyPlayerMe && !uploadedFileUrl) {
      newErrors.glbUrl = "GLB URL or file upload is required"
    }

    if (useReadyPlayerMe && !readyPlayerMeUrl.trim()) {
      newErrors.readyPlayerMeUrl = "Ready Player Me URL is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const npcId = Number.parseInt(selectedNpcId)
    const selectedNpc = npcs.find((npc) => npc.id === npcId)

    if (!selectedNpc) {
      setErrors({ selectedNpcId: "Invalid NPC selection" })
      return
    }

    // Determine the GLB URL to use
    const finalGlbUrl = useReadyPlayerMe ? readyPlayerMeUrl : uploadedFileUrl ? uploadedFileUrl : glbUrl

    // Create updated NPC data
    const updatedNPC: NPCData = {
      ...selectedNpc,
      model: "glb",
      glbUrl: finalGlbUrl,
    }

    onReplaceNPC(npcId, updatedNPC)

    // Reset form
    setSelectedNpcId("")
    setGlbUrl(AVAILABLE_MODELS[0].url)
    setSelectedModelIndex(0)
    setUseReadyPlayerMe(false)
    setReadyPlayerMeUrl("")
    setErrors({})
    // Don't revoke the blob URL here as it's now being used by the NPC
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Replace NPC with 3D Model</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Alert variant="info" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Choose from our pre-loaded 3D models or upload your own GLB file.</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="selectedNpcId">Select NPC to Replace</Label>
            <Select value={selectedNpcId} onValueChange={setSelectedNpcId}>
              <SelectTrigger className={errors.selectedNpcId ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an NPC" />
              </SelectTrigger>
              <SelectContent>
                {npcs.map((npc) => (
                  <SelectItem key={npc.id} value={npc.id.toString()}>
                    {npc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.selectedNpcId && <p className="text-red-500 text-xs">{errors.selectedNpcId}</p>}
          </div>

          <Tabs defaultValue="preloaded" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="preloaded"
                onClick={() => {
                  setUseReadyPlayerMe(false)
                }}
              >
                Pre-loaded Models
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                onClick={() => {
                  setUseReadyPlayerMe(false)
                }}
              >
                Upload File
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                onClick={() => {
                  setUseReadyPlayerMe(false)
                }}
              >
                Custom URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preloaded" className="space-y-2">
              <Label>Select a Pre-loaded Model</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                {AVAILABLE_MODELS.map((model, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={selectedModelIndex === index ? "default" : "outline"}
                    className="h-auto py-2 px-3 flex flex-col items-center justify-center"
                    onClick={() => handleModelSelect(index)}
                  >
                    <div className="w-8 h-8 bg-purple-200 rounded-full mb-1 flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="text-xs">{model.name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-2">
              <Label>Upload GLB File</Label>
              <input type="file" ref={fileInputRef} accept=".glb" onChange={handleFileChange} className="hidden" />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  className="flex-1"
                  disabled={isUploading}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Choose GLB File"}
                </Button>
              </div>
              {uploadedFile && <div className="text-sm text-green-600 mt-1">File uploaded: {uploadedFile.name}</div>}
              <p className="text-xs text-gray-500">Upload a GLB file from your device</p>
            </TabsContent>

            <TabsContent value="custom" className="space-y-2">
              <Label htmlFor="glbUrl">GLB Model URL</Label>
              <Input
                id="glbUrl"
                value={glbUrl}
                onChange={(e) => setGlbUrl(e.target.value)}
                placeholder="https://example.com/model.glb"
                className={errors.glbUrl ? "border-red-500" : ""}
              />
              {errors.glbUrl && <p className="text-red-500 text-xs">{errors.glbUrl}</p>}
              <p className="text-xs text-gray-500">Enter a valid URL to a GLB file</p>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Replace NPC
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
