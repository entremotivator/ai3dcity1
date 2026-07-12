"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, FileUp, AlertCircle } from "lucide-react"
import type { NPCData } from "./npc"
import * as THREE from "three"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AVAILABLE_MODELS } from "./preload-models"

interface AddNPCFormProps {
  onAddNPC: (npc: NPCData) => void
  existingNPCs: NPCData[]
  onClose: () => void
}

export function AddNPCForm({ onAddNPC, existingNPCs, onClose }: AddNPCFormProps) {
  const [name, setName] = useState("")
  const [streamlitUrl, setStreamlitUrl] = useState("[aisc_hub]")
  const [color, setColor] = useState("#4285F4")
  const [useGLB, setUseGLB] = useState(true) // Default to using 3D models
  const [glbUrl, setGlbUrl] = useState(AVAILABLE_MODELS[0].url)
  const [selectedModelIndex, setSelectedModelIndex] = useState(0)
  const [useReadyPlayerMe, setUseReadyPlayerMe] = useState(false)
  const [readyPlayerMeUrl, setReadyPlayerMeUrl] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate a random position within the room
  const generateRandomPosition = () => {
    const roomSize = 50 // Slightly smaller than actual room to keep NPCs away from walls
    const x = Math.random() * roomSize - roomSize / 2
    const z = Math.random() * roomSize - roomSize / 2
    return new THREE.Vector3(x, 1, z)
  }

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

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!streamlitUrl.trim() || (!streamlitUrl.startsWith("http") && !streamlitUrl.startsWith("["))) {
      newErrors.streamlitUrl = "Enter a WordPress shortcode like [aisc_hub] or a valid live URL"
    }

    if (useGLB && !glbUrl.trim() && !uploadedFileUrl && !useReadyPlayerMe) {
      newErrors.glbUrl = "GLB URL or file upload is required when using 3D model"
    }

    if (useReadyPlayerMe && !readyPlayerMeUrl.trim()) {
      newErrors.readyPlayerMeUrl = "Ready Player Me URL is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Generate a new unique ID
    const maxId = Math.max(0, ...existingNPCs.map((npc) => npc.id))
    const newId = maxId + 1

    // Generate random positions
    const position = generateRandomPosition()
    const targetPosition = generateRandomPosition()

    // Determine the GLB URL to use
    let finalGlbUrl = ""
    if (useGLB) {
      if (useReadyPlayerMe) {
        finalGlbUrl = readyPlayerMeUrl
      } else if (uploadedFileUrl) {
        finalGlbUrl = uploadedFileUrl
      } else {
        finalGlbUrl = glbUrl
      }
    }

    // Create new NPC data
    const newNPC: NPCData = {
      id: newId,
      name,
      model: useGLB ? "glb" : "custom",
      color,
      streamlitUrl,
      position,
      targetPosition,
      speed: 0.4 + Math.random() * 0.3, // Random speed between 0.4 and 0.7
      rotationSpeed: 1.8 + Math.random() * 0.5, // Random rotation speed
      interactionRadius: 5,
      glbUrl: useGLB ? finalGlbUrl : undefined,
    }

    onAddNPC(newNPC)

    // Reset form
    setName("")
    setStreamlitUrl("[aisc_hub]")
    setColor("#4285F4")
    setUseGLB(true)
    setGlbUrl(AVAILABLE_MODELS[0].url)
    setSelectedModelIndex(0)
    setUseReadyPlayerMe(false)
    setReadyPlayerMeUrl("")
    setErrors({})
    setUploadedFile(null)
    // Don't revoke the blob URL here as it's now being used by the NPC
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Add New NPC</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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

          <div className="flex items-center space-x-2">
            <Switch id="use-glb" checked={useGLB} onCheckedChange={setUseGLB} />
            <Label htmlFor="use-glb">Use 3D Model</Label>
          </div>

          {useGLB && (
            <>
              <Alert variant="info" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Choose from our pre-loaded 3D models or upload your own GLB file.</AlertDescription>
              </Alert>

              <Tabs defaultValue="preloaded" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preloaded" onClick={() => setUseReadyPlayerMe(false)}>
                    Pre-loaded Models
                  </TabsTrigger>
                  <TabsTrigger value="upload" onClick={() => setUseReadyPlayerMe(false)}>
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="custom" onClick={() => setUseReadyPlayerMe(false)}>
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
                  {uploadedFile && (
                    <div className="text-sm text-green-600 mt-1">File uploaded: {uploadedFile.name}</div>
                  )}
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
            </>
          )}

          {!useGLB && (
            <div className="space-y-2">
              <Label htmlFor="color">NPC Color</Label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: color }} />
                <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add NPC
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
