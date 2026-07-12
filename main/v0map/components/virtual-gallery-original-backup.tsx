"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { PointerLockControls } from "three-stdlib"
import { Gallery } from "./gallery"
import { InfoCard } from "./info-card"
import { useMovement } from "@/hooks/use-movement"
import { IframeMenu } from "./iframe-menu"
import { type NPCData, NPCManager } from "./npc"
import { toast } from "react-hot-toast"
import { Joystick, RotationJoystick } from "./joystick"
import { NPCControls } from "./npc-controls"
import { X } from "lucide-react"
// Add these imports at the top of the file
import { preloadModels, AVAILABLE_MODELS } from "./preload-models"
import { preloadAnimations } from "./animation-manager"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass"
import { ExhibitHoverEffect } from "./exhibit-hover-effect"
import { ExhibitTooltip } from "./exhibit-tooltip"
import { InteriorWalls } from "./interior-walls"
import { FlyingModeControl } from "./flying-mode-control"
import { MiniMap } from "./mini-map"
import { DebugOverlay } from "./debug-overlay"
// Add these imports at the top of the file
import { GamepadController } from "./gamepad-controller"
// Add this import at the top of the file
import { ControllerStatus } from "./controller-status"

// Add this function to handle model loading errors
const handleModelLoadingError = (error: any, modelName: string) => {
  console.error(`Error loading model ${modelName}:`, error)
  toast.error(`Failed to load model ${modelName}. Using fallback.`)
}

// Add table positions array
const TABLE_POSITIONS = [
  { position: [15, 0, 15], rotation: [0, -Math.PI / 4, 0] },
  { position: [15, 0, 5], rotation: [0, -Math.PI / 4, 0] },
  { position: [15, 0, -5], rotation: [0, -Math.PI / 4, 0] },
  { position: [15, 0, -15], rotation: [0, -Math.PI / 4, 0] },
  { position: [-15, 0, 15], rotation: [0, Math.PI / 4, 0] },
  { position: [-15, 0, 5], rotation: [0, Math.PI / 4, 0] },
  { position: [-15, 0, -5], rotation: [0, Math.PI / 4, 0] },
  { position: [-15, 0, -15], rotation: [0, Math.PI / 4, 0] },
  { position: [0, 0, 20], rotation: [0, 0, 0] },
  { position: [0, 0, -20], rotation: [0, Math.PI, 0] },
]

// NPC Data with unique names, colors, and Streamlit URLs
const DEFAULT_NPC_DATA: NPCData[] = [
  {
    id: 1,
    name: "Agent CEO",
    model: "professor",
    color: "#4285F4", // Google Blue
    streamlitUrl: "http://localhost:8504/agent_ceo",
    position: new THREE.Vector3(-10, 1, -10),
    targetPosition: new THREE.Vector3(-15, 1, -15),
    speed: 0.5,
    rotationSpeed: 2.0,
    interactionRadius: 5,
    dialogue: [
      "Hello there! I'm Professor Ada, and I specialize in AI ethics.",
      "It's a pleasure to meet you! I can tell you all about the ethical implications of AI.",
      "AI ethics is a fascinating field. Feel free to ask me anything!",
    ],
    tablePosition: new THREE.Vector3(15, 0, 15), // Add table position
  },
  {
    id: 2,
    name: "Agent Social",
    model: "scientist",
    color: "#EA4335", // Google Red
    streamlitUrl: "http://localhost:8504/agent_social",
    position: new THREE.Vector3(10, 1, -10),
    targetPosition: new THREE.Vector3(15, 1, -15),
    speed: 0.4,
    rotationSpeed: 1.8,
    interactionRadius: 5,
    dialogue: [
      "Greetings! I'm Dr. Turing, an expert in machine learning algorithms.",
      "I'm pleased to meet you. I can explain the intricacies of ML algorithms.",
      "Machine learning is my passion. Don't hesitate to ask me anything!",
    ],
    tablePosition: new THREE.Vector3(15, 0, 5), // Add table position
  },
  {
    id: 3,
    name: "Agent Mindset",
    model: "guide",
    color: "#FBBC05", // Google Yellow
    streamlitUrl: "http://localhost:8504/agent_mindset",
    position: new THREE.Vector3(10, 1, 10),
    targetPosition: new THREE.Vector3(15, 1, 15),
    speed: 0.6,
    rotationSpeed: 2.2,
    interactionRadius: 5,
    dialogue: [
      "Welcome to the AI Art Gallery! I'm Curator Nova.",
      "I'm delighted to guide you through the world of AI-generated art.",
      "AI art is constantly evolving. Feel free to explore and ask questions!",
    ],
    tablePosition: new THREE.Vector3(15, 0, -5), // Add table position
  },
  {
    id: 4,
    name: "Agent Blogger",
    model: "engineer",
    color: "#34A853", // Google Green
    streamlitUrl: "http://localhost:8504/agent_blogger",
    position: new THREE.Vector3(-10, 1, 10),
    targetPosition: new THREE.Vector3(-15, 1, -15),
    speed: 0.45,
    rotationSpeed: 1.9,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Engineer Byte, and I specialize in robotics.",
      "I'm happy to meet you. I can show you how AI is used in robotics.",
      "Robotics is a fascinating field. Feel free to ask me anything!",
    ],
    tablePosition: new THREE.Vector3(15, 0, -15), // Add table position
  },
  {
    id: 5,
    name: "Agent Grant",
    model: "analyst",
    color: "#9C27B0", // Purple
    streamlitUrl: "http://localhost:8504/agent_grant",
    position: new THREE.Vector3(0, 1, -20),
    targetPosition: new THREE.Vector3(5, 1, -25),
    speed: 0.55,
    rotationSpeed: 2.1,
    interactionRadius: 5,
    dialogue: [
      "Hi, I'm Analyst Pixel, and I'm an expert in data visualization.",
      "It's a pleasure to meet you. I can explain how AI helps visualize data.",
      "Data visualization is my specialty. Feel free to ask me anything!",
    ],
    tablePosition: new THREE.Vector3(-15, 0, 15), // Add table position
  },
  {
    id: 6,
    name: "Agent Prayer AI",
    model: "philosopher",
    color: "#FF9800", // Orange
    streamlitUrl: "http://localhost:8504/agent_prayer_ai",
    position: new THREE.Vector3(0, 1, 20),
    targetPosition: new THREE.Vector3(5, 1, 25),
    speed: 0.5,
    rotationSpeed: 2.0,
    interactionRadius: 5,
    dialogue: [
      "Greetings, I am Philosopher Quantum, here to discuss the philosophical implications of AI.",
      "It's a pleasure to meet you. I can share my thoughts on AI's impact on society.",
      "The philosophy of AI is a complex topic. Feel free to engage in debate!",
    ],
    tablePosition: new THREE.Vector3(-15, 0, 5), // Add table position
  },
  {
    id: 7,
    name: "Agent Metrics",
    model: "designer",
    color: "#E91E63", // Pink
    streamlitUrl: "http://localhost:8504/agent_metrics",
    position: new THREE.Vector3(-20, 1, 0),
    targetPosition: new THREE.Vector3(-25, 1, 5),
    speed: 0.6,
    rotationSpeed: 2.2,
    interactionRadius: 5,
    dialogue: [
      "Hello, I'm Designer Spectrum, and I specialize in UX design.",
      "I'm happy to meet you. I can show you how AI enhances UX design.",
      "UX design is my passion. Feel free to ask me anything!",
    ],
    tablePosition: new THREE.Vector3(-15, 0, -5), // Add table position
  },
  {
    id: 8,
    name: "Agent Researcher",
    model: "linguist",
    color: "#00BCD4", // Cyan
    streamlitUrl: "http://localhost:8504/agent_researcher",
    position: new THREE.Vector3(20, 1, 0),
    targetPosition: new THREE.Vector3(25, 1, 5),
    speed: 0.45,
    rotationSpeed: 1.9,
    interactionRadius: 5,
    dialogue: [
      "Hi, I'm Linguist Echo, and I'm an expert in natural language processing.",
      "It's a pleasure to meet you. I can explain how AI processes human language.",
      "NLP is my specialty. Feel free to ask me anything!",
    ],
    tablePosition: new THREE.Vector3(-15, 0, -15), // Add table position
  },
  {
    id: 9,
    name: "Agent Investor",
    model: "gamer",
    color: "#8BC34A", // Light Green
    streamlitUrl: "http://localhost:8504/agent_investor",
    position: new THREE.Vector3(-15, 1, -15),
    targetPosition: new THREE.Vector3(-20, 1, -20),
    speed: 0.55,
    rotationSpeed: 2.1,
    interactionRadius: 5,
    dialogue: [
      "Hey, I'm Gamer Pixel, and I'm passionate about AI in gaming.",
      "I'm excited to meet you. I can show you how AI is used in video games.",
      "Gaming is my passion. Feel free to ask me anything!",
    ],
    tablePosition: new THREE.Vector3(0, 0, 20), // Add table position
  },
  {
    id: 10,
    name: "Agent Newsroom",
    model: "futurist",
    color: "#3F51B5", // Indigo
    streamlitUrl: "http://localhost:8504/agent_newsroom",
    position: new THREE.Vector3(15, 1, 15),
    targetPosition: new THREE.Vector3(20, 1, 20),
    speed: 0.5,
    rotationSpeed: 2.0,
    interactionRadius: 5,
    dialogue: [
      "Greetings, I am Futurist Vision, here to discuss the future of technology.",
      "It's a pleasure to meet you. I can share my predictions about future tech.",
      "The future is exciting! Feel free to ask me anything about it!",
    ],
    tablePosition: new THREE.Vector3(0, 0, -20), // Add table position
  },
]

// Function to replace all NPCs with GLB models
const replaceAllNPCsWithGLBModels = (npcs: NPCData[]): NPCData[] => {
  // Make a copy of the NPCs array
  const updatedNPCs = [...npcs]

  // Replace all NPCs with GLB models
  for (let i = 0; i < updatedNPCs.length; i++) {
    // Use the corresponding model from AVAILABLE_MODELS
    // If we have more NPCs than models, cycle through the models
    const modelIndex = i % AVAILABLE_MODELS.length

    // Store the original color for fallback
    const originalColor = updatedNPCs[i].color

    updatedNPCs[i] = {
      ...updatedNPCs[i],
      model: "glb",
      glbUrl: AVAILABLE_MODELS[modelIndex].url,
      // Keep the original color for fallback
      color: originalColor,
    }
  }

  return updatedNPCs
}

const GALLERY_ITEMS = [
  // North Wall
  {
    title: "Agent CEO",
    description: "Explore the ethical implications of AI",
    streamlitUrl: "http://localhost:8504/streamlit_agent",
    position: { x: 0, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    title: "Agent Social",
    description: "Introduction to machine learning concepts",
    streamlitUrl: "http://localhost:8504/html_css_agent",
    position: { x: -14, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    title: "Agent Mindset",
    description: "Dive deep into neural network architectures",
    streamlitUrl: "http://localhost:8504/business_plan_agent",
    position: { x: 14, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    title: "Agent Blogger",
    description: "Discover AI applications in healthcare",
    streamlitUrl: "http://localhost:8504/ecom_agent",
    position: { x: -24, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    title: "Agent Grant",
    description: "Predictions and trends in AI development",
    streamlitUrl: "http://localhost:8504/agent_health",
    position: { x: 24, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },

  // East Wall
  {
    title: "Agent Prayer AI",
    description: "Explore image and video processing with AI",
    streamlitUrl: "http://localhost:8504/cinch_closer",
    position: { x: 29, y: 2, z: -14 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Agent Metrics",
    description: "Understand how AI processes human language",
    streamlitUrl: "http://localhost:8504/disc_agent",
    position: { x: 29, y: 2, z: 0 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Agent Researcher",
    description: "Learn about AI that improves through trial and error",
    streamlitUrl: "http://localhost:8504/invoice_agent",
    position: { x: 29, y: 2, z: 14 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Agent Investor",
    description: "Discover AI applications in the financial sector",
    streamlitUrl: "http://localhost:8504/agent_clone",
    position: { x: 29, y: 2, z: -24 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Agent Newsroom",
    description: "Explore the intersection of AI and robotics",
    streamlitUrl: "http://localhost:8504/agent_doctor",
    position: { x: 29, y: 2, z: 24 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },

  // South Wall
  {
    title: "Streamlit Agent",
    description: "Create art using AI algorithms",
    streamlitUrl: "http://localhost:8504/agent_multi-lig",
    position: { x: 0, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "HTML CSS Agent",
    description: "Learn about self-driving car technology",
    streamlitUrl: "http://localhost:8504/agent_real_estate",
    position: { x: -14, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "Business Plan Agent",
    description: "Explore how AI is transforming education",
    streamlitUrl: "http://localhost:8504/business_launcher",
    position: { x: 14, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "Ecom Agent",
    description: "Discover the potential of quantum AI",
    streamlitUrl: "http://localhost:8504/agent_booking",
    position: { x: -24, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "Agent Health",
    description: "Learn how AI is helping combat climate change",
    streamlitUrl: "http://localhost:8504/agent_ceo",
    position: { x: 24, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },

  // West Wall
  {
    title: "Cinch Closer",
    description: "Explore AI applications in video games",
    streamlitUrl: "http://localhost:8504/agent_social",
    position: { x: -29, y: 2, z: -14 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "Disc Agent",
    description: "Understand how AI can recognize and respond to emotions",
    streamlitUrl: "http://localhost:8504/agent_mindset",
    position: { x: -29, y: 2, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "Invoice Agent",
    description: "Learn about AI in digital security",
    streamlitUrl: "http://localhost:8504/agent_blogger",
    position: { x: -29, y: 2, z: 14 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "Agent Clone",
    description: "Dive into methods for interpreting AI decisions",
    streamlitUrl: "http://localhost:8504/agent_grant",
    position: { x: -29, y: 2, z: -24 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "Agent Doctor",
    description: "Explore the ethical and legal aspects of AI",
    streamlitUrl: "http://localhost:8504/agent_prayer_ai",
    position: { x: -29, y: 2, z: 24 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
]

// Helper function to convert Vector3 objects to/from JSON
const serializeVector3 = (vector: THREE.Vector3) => {
  return { x: vector.x, y: vector.y, z: vector.z }
}

const deserializeVector3 = (obj: { x: number; y: number; z: number }) => {
  return new THREE.Vector3(obj.x, obj.y, obj.z)
}

// Helper function to serialize NPCData for localStorage
const serializeNPCData = (npc: NPCData) => {
  return {
    ...npc,
    position: serializeVector3(npc.position),
    targetPosition: serializeVector3(npc.targetPosition),
  }
}

const deserializeNPCData = (data: any): NPCData => {
  return {
    ...data,
    position: deserializeVector3(data.position),
    targetPosition: deserializeVector3(data.position),
  }
}

// Define collision objects outside of the component
const collisionObjectsRef = { current: [] as THREE.Object3D[] }

export default function VirtualGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<PointerLockControls | null>(null)
  const [selectedItem, setSelectedItem] = useState<(typeof GALLERY_ITEMS)[0] | null>(null)
  const [selectedNPC, setSelectedNPC] = useState<NPCData | null>(null)
  const keysRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyA: false,
    KeyD: false,
    w: false,
    a: false,
    s: false,
    d: false,
    Space: false, // Added for flying up
    ShiftLeft: false, // Added for flying down
  })
  const moveJoystickRef = useRef({ x: 0, y: 0 })
  const rotateJoystickRef = useRef({ x: 0, y: 0 })
  const mouseRef = useRef({ x: 0, y: 0 })
  const isPointerLocked = useRef(false)
  const [isIframeMenuOpen, setIsIframeMenuOpen] = useState(false)
  const [isControlsEnabled, setIsControlsEnabled] = useState(true)
  const npcManagerRef = useRef<NPCManager | null>(null)
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const lastUpdateTimeRef = useRef<number>(0)
  const [showControls, setShowControls] = useState(false)
  const spritesRef = useRef<THREE.Sprite[]>([])
  const [showJoysticks, setShowJoysticks] = useState(true)
  const [npcData, setNpcData] = useState<NPCData[]>(replaceAllNPCsWithGLBModels([...DEFAULT_NPC_DATA]))
  const [activeNpcs, setActiveNpcs] = useState<Set<number>>(new Set())
  const [isMeetingActive, setIsMeetingActive] = useState(false)
  const [isAtTables, setIsAtTables] = useState(false) // State for tracking if NPCs are at tables
  const [debugInfo, setDebugInfo] = useState({
    fps: 0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { y: 0 },
    pitch: { x: 0 },
  })
  const framesRef = useRef(0)
  const lastFpsTimeRef = useRef(0)
  // Add a state for tracking open Streamlit iframes
  const [openStreamlitApps, setOpenStreamlitApps] = useState<NPCData[]>([])
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [animationsLoaded, setAnimationsLoaded] = useState(false)
  const composerRef = useRef<EffectComposer | null>(null)
  const wallsRef = useRef<THREE.Object3D[]>([])
  const tablesRef = useRef<THREE.Group[]>([])
  // Add these state variables inside the VirtualGallery component
  const [externalControllerActive, setExternalControllerActive] = useState(false)
  const [controllerButtonMap, setControllerButtonMap] = useState<Record<number, string>>({})

  // Add a ref for the hover effect:
  const exhibitHoverEffectRef = useRef<ExhibitHoverEffect | null>(null)

  const [tooltipInfo, setTooltipInfo] = useState<{ title: string; description: string } | null>(null)

  // Add flying mode state
  const [flyingMode, setFlyingMode] = useState(false)
  const flyingModeRef = useRef(false)
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null)
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null)

  // Update refs when flying mode changes
  useEffect(() => {
    flyingModeRef.current = flyingMode
  }, [flyingMode])

  // Load custom NPCs from localStorage on initial render
  useEffect(() => {
    try {
      const savedNPCs = localStorage.getItem("customNPCs")
      if (savedNPCs) {
        const parsedNPCs = JSON.parse(savedNPCs)
        const deserializedNPCs = parsedNPCs.map(deserializeNPCData)

        // Apply GLB models to custom NPCs as well
        const customNPCsWithGLB = deserializedNPCs.map((npc, index) => ({
          ...npc,
          model: "glb",
          glbUrl: AVAILABLE_MODELS[(index + DEFAULT_NPC_DATA.length) % AVAILABLE_MODELS.length].url,
        }))

        setNpcData([...replaceAllNPCsWithGLBModels([...DEFAULT_NPC_DATA]), ...customNPCsWithGLB])
      }
    } catch (error) {
      console.error("Failed to load custom NPCs:", error)
    }
  }, [])

  // Save custom NPCs to localStorage whenever they change
  useEffect(() => {
    try {
      // Only save custom NPCs (id > 10)
      const customNPCs = npcData.filter((npc) => npc.id > 10)
      if (customNPCs.length > 0) {
        const serializedNPCs = customNPCs.map(serializeNPCData)
        localStorage.setItem("customNPCs", JSON.stringify(serializedNPCs))
      }
    } catch (error) {
      console.error("Failed to save custom NPCs:", error)
    }
  }, [npcData])

  // Add this useEffect to preload models and animations
  useEffect(() => {
    // Preload models and animations when the component mounts
    const loadAssets = async () => {
      try {
        // First preload models
        const modelsSuccess = await preloadModels()
        setModelsLoaded(true)

        if (modelsSuccess) {
          toast.success("3D models preloaded successfully")
        } else {
          toast.error("Some models failed to load. Using fallbacks where needed.")
        }

        // Then preload animations
        try {
          const animationsSuccess = await preloadAnimations()

          if (animationsSuccess) {
            toast.success("Animations loaded successfully")
          } else {
            toast.warning("Using simplified animations as fallback")
          }
        } catch (animError) {
          console.error("Animation loading error:", animError)
          toast.warning("Using simplified animations as fallback")
        }

        // Always set animations as loaded, even if there was an error
        setAnimationsLoaded(true)
      } catch (error) {
        console.error("Error in preloading assets:", error)
        setModelsLoaded(true)
        setAnimationsLoaded(true)
        toast.error("Failed to preload assets. Using fallbacks.")
      }
    }

    loadAssets()
  }, [])

  // Pass the scene to the movement hook for collision detection
  const { move, yawObject, savePosition, loadPosition } = useMovement(
    cameraRef,
    keysRef,
    moveJoystickRef,
    rotateJoystickRef,
    mouseRef,
    sceneRef,
    flyingModeRef,
  )

  // Toggle flying mode
  const toggleFlyingMode = useCallback(() => {
    setFlyingMode((prev) => !prev)
    toast.success(flyingMode ? "Flying mode disabled" : "Flying mode enabled. Use Space to fly up, Shift to fly down")
  }, [flyingMode])

  // Fly straight up
  const flyUp = useCallback(() => {
    if (flyingMode && yawObject.current) {
      const newPosition = yawObject.current.position.clone()
      newPosition.y += 5 // Move up by 5 units

      // Enforce maximum height
      const maxHeight = 40
      if (newPosition.y > maxHeight) {
        newPosition.y = maxHeight
      }

      yawObject.current.position.copy(newPosition)
      toast.success("Flying up!")
    }
  }, [flyingMode])

  // Fly straight down
  const flyDown = useCallback(() => {
    if (flyingMode && yawObject.current) {
      const newPosition = yawObject.current.position.clone()
      newPosition.y -= 5 // Move down by 5 units

      // Enforce minimum height
      const minHeight = 1.7 // Standard player height
      if (newPosition.y < minHeight) {
        newPosition.y = minHeight
      }

      yawObject.current.position.copy(newPosition)
      toast.success("Flying down!")
    }
  }, [flyingMode])

  // Reset height to ground level
  const resetHeight = useCallback(() => {
    if (flyingMode && yawObject.current) {
      const newPosition = yawObject.current.position.clone()
      newPosition.y = 1.7 // Reset to standard player height
      yawObject.current.position.copy(newPosition)
      toast.success("Height reset to ground level")
    }
  }, [flyingMode])

  // Add this function inside the VirtualGallery component
  const handleControllerConnect = useCallback((connected: boolean) => {
    setExternalControllerActive(connected)
    if (connected) {
      toast.success("Game controller connected! You can now use your controller to navigate.")
    } else {
      toast.info("Game controller disconnected.")
    }
  }, [])

  // Add this function inside the VirtualGallery component
  const handleControllerButtonPress = useCallback(
    (buttonIndex: number, pressed: boolean) => {
      if (!pressed) return

      // Map controller buttons to actions
      // Button mapping may vary by controller, so we'll handle common mappings
      switch (buttonIndex) {
        case 0: // A button or bottom button
          // Interact with objects (similar to click)
          if (controlsRef.current && !isPointerLocked.current && isControlsEnabled) {
            try {
              controlsRef.current.lock()
            } catch (error) {
              console.error("Failed to lock pointer:", error)
            }
          }
          break
        case 1: // B button or right button
          // Exit pointer lock (similar to ESC)
          if (controlsRef.current && isPointerLocked.current) {
            controlsRef.current.unlock()
          }
          break
        case 2: // X button or left button
          // Toggle flying mode
          toggleFlyingMode()
          break
        case 3: // Y button or top button
          // Open menu (similar to M key)
          setIsIframeMenuOpen(true)
          break
        case 4: // Left shoulder
          // Fly down (in flying mode)
          if (flyingMode) flyDown()
          break
        case 5: // Right shoulder
          // Fly up (in flying mode)
          if (flyingMode) flyUp()
          break
        case 8: // Menu/Start button
          // Toggle controls visibility
          setShowControls((prev) => !prev)
          break
        case 9: // Options/Select button
          // Toggle joysticks visibility
          setShowJoysticks((prev) => !prev)
          break
        default:
          break
      }
    },
    [flyingMode, flyDown, flyUp, toggleFlyingMode, isControlsEnabled, isPointerLocked],
  )

  const handleMovement = useCallback(() => {
    if (isControlsEnabled) {
      move()
    }

    // Update sprite orientations to always face camera
    spritesRef.current.forEach((sprite) => {
      if (sprite.userData.rotation !== undefined && cameraRef.current) {
        // Get the camera's rotation
        const cameraRotation = cameraRef.current.rotation.y

        // Calculate the sprite's rotation to face the camera
        const spriteRotation = sprite.userData.rotation

        // Apply rotation to make sprite face camera
        sprite.quaternion.setFromEuler(new THREE.Euler(0, cameraRotation + spriteRotation, 0))
      }
    })

    // Update debug info
    framesRef.current++
    const time = performance.now()
    if (time >= lastFpsTimeRef.current + 1000) {
      setDebugInfo((prev) => ({
        ...prev,
        fps: framesRef.current,
        position: {
          x: Number.parseFloat(yawObject.current.position.x.toFixed(2)),
          y: Number.parseFloat(yawObject.current.position.y.toFixed(2)),
          z: Number.parseFloat(yawObject.current.position.z.toFixed(2)),
        },
        rotation: { y: Number.parseFloat(yawObject.current.rotation.y.toFixed(2)) },
        pitch: { x: Number.parseFloat(cameraRef.current?.rotation.x.toFixed(2) || "0") },
      }))
      framesRef.current = 0
      lastFpsTimeRef.current = time
    }

    // Update post-processing effects
    if (composerRef.current && cameraRef.current && sceneRef.current) {
      try {
        composerRef.current.render()
      } catch (error) {
        console.error("Error in composer rendering:", error)
        // Fallback to standard renderer
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }
      }
    }
  }, [move, isControlsEnabled, cameraRef])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.code as keyof typeof keysRef.current
      if (key in keysRef.current) {
        keysRef.current[key] = true
      }

      // Press 'M' to open the iframe menu
      if (event.code === "KeyM") {
        setIsIframeMenuOpen(true)
      }

      // Press 'H' to toggle controls visibility
      if (event.code === "KeyH") {
        setShowControls((prev) => !prev)
      }

      // Press 'J' to toggle joysticks visibility
      if (event.code === "KeyJ") {
        setShowJoysticks((prev) => !prev)
      }

      // Press 'Escape' to exit pointer lock
      if (event.code === "Escape" && controlsRef.current) {
        controlsRef.current.unlock()
      }

      // Add 'F' key to toggle flying mode
      if (event.code === "KeyF") {
        toggleFlyingMode()
      }

      // Add 'R' key to reset height when in flying mode
      if (event.code === "KeyR" && flyingMode) {
        resetHeight()
      }

      // Add 'Q' key for quick fly up
      if (event.code === "KeyQ" && flyingMode) {
        flyUp()
      }

      // Add 'Z' key for quick fly down
      if (event.code === "KeyZ" && flyingMode) {
        flyDown()
      }
    },
    [toggleFlyingMode, flyingMode, resetHeight, flyUp, flyDown],
  )

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.code as keyof typeof keysRef.current
    if (key in keysRef.current) {
      keysRef.current[key] = false
    }
  }, [])

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return

      if (!isPointerLocked.current && isControlsEnabled) {
        try {
          controlsRef.current?.lock()
        } catch (error) {
          console.error("Failed to lock pointer:", error)
          toast.error("Failed to lock pointer. You can still interact with the gallery.")
          // Fallback behavior: allow interaction without pointer lock
          handleInteraction(event)
        }
        return
      }

      handleInteraction(event)
    },
    [isControlsEnabled],
  )

  const handleInteraction = useCallback(
    (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return

      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, cameraRef.current)
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true)

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object

        // Check if clicked on an exhibit
        if (clickedObject.userData && clickedObject.userData.type === "exhibit") {
          setSelectedItem(clickedObject.userData.item)
          if (controlsRef.current) {
            controlsRef.current.unlock()
          }
          // Save position when interacting with exhibits
          savePosition()
        }

        // Check if clicked on an NPC
        if (clickedObject.userData && clickedObject.userData.type === "npc") {
          const npcId = clickedObject.userData.npcId
          const npc = npcData.find((n) => n.id === npcId)
          if (npc) {
            handleNPCInteraction(npc)
          }
        }
      }
    },
    [savePosition, npcData],
  )

  const handleNPCInteraction = useCallback(
    (npc: NPCData) => {
      setSelectedNPC(npc)
      if (controlsRef.current) {
        controlsRef.current.unlock()
      }
      // Save position when interacting with NPCs
      savePosition()
    },
    [savePosition],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isPointerLocked.current && isControlsEnabled) {
        // Increased sensitivity for 360° rotation
        mouseRef.current.x += event.movementX * 0.003
        mouseRef.current.y += event.movementY * 0.003
      } else if (exhibitHoverEffectRef.current) {
        // Update hover effect when not in pointer lock mode
        exhibitHoverEffectRef.current.update(event.clientX, event.clientY, window.innerWidth, window.innerHeight)
      }
    },
    [isControlsEnabled],
  )

  const handlePointerLockChange = useCallback(() => {
    isPointerLocked.current = document.pointerLockElement === containerRef.current
    setIsControlsEnabled(isPointerLocked.current)
  }, [])

  const handlePointerLockError = useCallback((event: Event) => {
    console.error("Pointer lock error:", event)
    toast.error("Pointer lock failed. You can still interact with the gallery using alternative controls.")
    setIsControlsEnabled(true) // Enable alternative controls
  }, [])

  const handleResize = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return
    cameraRef.current.aspect = window.innerWidth / window.innerHeight
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    if (composerRef.current) {
      composerRef.current.setSize(window.innerWidth, window.innerHeight)
    }
  }, [])

  // Handle NPC toggling
  const handleToggleNpc = useCallback((id: number) => {
    if (npcManagerRef.current) {
      npcManagerRef.current.toggleNPC(id)
      setActiveNpcs(npcManagerRef.current.getActiveNPCIds())
    }
  }, [])

  // Handle toggling all NPCs
  const handleToggleAllNpcs = useCallback(
    (active: boolean) => {
      if (npcManagerRef.current) {
        npcManagerRef.current.setAllNPCs(active)
        setActiveNpcs(active ? new Set(npcData.map((npc) => npc.id)) : new Set())
      }
    },
    [npcData],
  )

  // Handle calling a meeting
  const handleToggleMeeting = useCallback(() => {
    if (npcManagerRef.current) {
      const isInMeeting = npcManagerRef.current.toggleMeeting()
      setIsMeetingActive(isInMeeting)
      if (isInMeeting) {
        toast.success("Meeting called! NPCs are gathering in the center.")
      } else {
        toast.success("Meeting dismissed.")
      }
      return isInMeeting
    }
    return false
  }, [])

  // Update the handleOpenAllStreamlit function to open iframes instead of new windows
  const handleOpenAllStreamlit = useCallback(() => {
    const activeNpcIds = Array.from(activeNpcs)
    const activeNpcList = npcData.filter((npc) => activeNpcIds.includes(npc.id))

    if (activeNpcList.length === 0) {
      toast.error("No NPCs are active. Please activate NPCs first.")
      return
    }

    // Set the active NPCs to show their Streamlit apps in iframes
    setOpenStreamlitApps(activeNpcList)
    toast.success(`Opened ${activeNpcList.length} Streamlit apps`)
  }, [activeNpcs, npcData])

  // Add a function to handle calling a single NPC
  const handleCallNPC = useCallback(
    (id: number) => {
      if (!npcManagerRef.current || !yawObject.current) return

      // Pass the yawObject directly, which has both position and rotation
      const targetPosition = npcManagerRef.current.callNPC(id, yawObject.current)
      if (targetPosition) {
        const npc = npcData.find((npc) => npc.id === id)
        if (npc) {
          toast.success(`Called ${npc.name} to your position`)
        }
      } else {
        toast.error("Failed to call NPC. Make sure it's active.")
      }
    },
    [npcData, yawObject],
  )

  // Add a function to close a specific Streamlit app
  const closeStreamlitApp = useCallback((id: number) => {
    setOpenStreamlitApps((prev) => prev.filter((npc) => npc.id !== id))
  }, [])

  // Add a function to close all Streamlit apps
  const closeAllStreamlitApps = useCallback(() => {
    setOpenStreamlitApps([])
  }, [])

  // Handle adding a new custom NPC
  const handleAddNPC = useCallback(
    (npc: NPCData) => {
      setNpcData((prev) => [...prev, npc])

      // Add the NPC to the scene if the manager exists
      if (npcManagerRef.current && sceneRef.current) {
        // Recreate NPCs with the updated data
        npcManagerRef.current.dispose()
        const newManager = new NPCManager(sceneRef.current, cameraRef.current)
        newManager.createNPCs([...npcData, npc])
        npcManagerRef.current = newManager

        // Update active NPCs
        setActiveNpcs(newManager.getActiveNPCIds())
      }

      toast.success(`Added new NPC: ${npc.name}`)
    },
    [npcData, cameraRef],
  )

  // Handle replacing an NPC with a GLB model
  const handleReplaceNPC = useCallback((id: number, newData: NPCData) => {
    // Update the NPC data in state
    setNpcData((prev) => prev.map((npc) => (npc.id === id ? { ...npc, ...newData } : npc)))

    // Replace the NPC in the scene if the manager exists
    if (npcManagerRef.current && sceneRef.current) {
      const success = npcManagerRef.current.replaceNPC(id, newData)

      if (success) {
        toast.success(`Replaced ${newData.name} with 3D model`)
      } else {
        toast.error("Failed to replace NPC")
      }
    }
  }, [])

  // Handle removing a custom NPC
  const handleRemoveNPC = useCallback(
    (id: number) => {
      // Only allow removing custom NPCs (id > 10)
      if (id <= 10) {
        toast.error("Cannot remove default NPCs")
        return
      }

      setNpcData((prev) => prev.filter((npc) => npc.id !== id))

      // Remove the NPC from the scene if the manager exists
      if (npcManagerRef.current && sceneRef.current) {
        // Recreate NPCs with the updated data
        npcManagerRef.current.dispose()
        const updatedNPCs = npcData.filter((npc) => npc.id !== id)
        const newManager = new NPCManager(sceneRef.current, cameraRef.current)
        newManager.createNPCs(updatedNPCs)
        npcManagerRef.current = newManager

        // Update active NPCs
        setActiveNpcs(newManager.getActiveNPCIds())
      }

      toast.success(`Removed NPC #${id}`)
    },
    [npcData, cameraRef],
  )

  // Track sprites for billboard effect
  const registerSprite = useCallback((sprite: THREE.Sprite) => {
    spritesRef.current.push(sprite)
  }, [])

  // Handle joystick movement
  const handleMoveJoystick = useCallback((x: number, y: number) => {
    moveJoystickRef.current = { x, y }
  }, [])

  // Handle joystick rotation
  const handleRotateJoystick = useCallback((x: number) => {
    rotateJoystickRef.current = { x, y: 0 }
  }, [])

  // Add functions to handle make call and break call
  const handleMakeCall = useCallback(() => {
    if (npcManagerRef.current) {
      // Send NPCs to their tables
      npcData.forEach((npc) => {
        if (npc.tablePosition && npcManagerRef.current) {
          npcManagerRef.current.sendNPCToPosition(npc.id, npc.tablePosition)
        }
      })
      setIsAtTables(true)
      toast.success("NPCs are going to their tables")
    }
  }, [npcData])

  const handleBreakCall = useCallback(() => {
    if (npcManagerRef.current) {
      // Return NPCs to random roaming
      npcManagerRef.current.returnToRandomRoaming()
      setIsAtTables(false)
      toast.success("NPCs are returning to random roaming")
    }
  }, [])

  // Handle beforeunload to save position
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePosition()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [savePosition])

  // Create tables and add them to the scene
  useEffect(() => {
    if (!sceneRef.current) return

    // Create tables
    TABLE_POSITIONS.forEach((tablePos, index) => {
      const tableGroup = new THREE.Group()
      tableGroup.position.set(tablePos.position[0], tablePos.position[1], tablePos.position[2])
      tableGroup.rotation.set(tablePos.rotation[0], tablePos.rotation[1], tablePos.rotation[2])

      // Create table top
      const tableTopGeometry = new THREE.BoxGeometry(2, 0.1, 1.5)
      const tableTopMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown wood color
        roughness: 0.7,
        metalness: 0.2,
      })
      const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial)
      tableTop.position.y = 1 // Table height
      tableTop.castShadow = true
      tableTop.receiveShadow = true
      tableGroup.add(tableTop)

      // Create table legs
      const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1)
      const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.7,
        metalness: 0.2,
      })

      // Position of the four legs
      const legPositions = [
        [-0.9, 0.5, -0.7], // front left
        [0.9, 0.5, -0.7], // front right
        [-0.9, 0.5, 0.7], // back left
        [0.9, 0.5, 0.7], // back right
      ]

      legPositions.forEach((pos) => {
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        leg.position.set(pos[0], pos[1], pos[2])
        leg.castShadow = true
        leg.receiveShadow = true
        tableGroup.add(leg)
      })

      // Create a phone on the table
      const phoneBaseGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.2)
      const phoneBaseMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.8,
      })
      const phoneBase = new THREE.Mesh(phoneBaseGeometry, phoneBaseMaterial)
      phoneBase.position.set(0, 1.1, 0)
      phoneBase.castShadow = true
      phoneBase.receiveShadow = true
      tableGroup.add(phoneBase)

      // Create phone handset
      const handsetGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.1)
      const handsetMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.5,
        metalness: 0.7,
      })
      const handset = new THREE.Mesh(handsetGeometry, handsetMaterial)
      handset.position.set(0, 1.17, 0)
      handset.castShadow = true
      handset.receiveShadow = true
      tableGroup.add(handset)

      // Add table number
      const canvas = document.createElement("canvas")
      canvas.width = 128
      canvas.height = 64
      const context = canvas.getContext("2d")
      if (context) {
        context.fillStyle = "white"
        context.font = "bold 48px Arial"
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText(`${index + 1}`, 64, 32)

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(material)
        sprite.position.set(0, 1.5, 0)
        sprite.scale.set(0.5, 0.25, 1)
        tableGroup.add(sprite)
      }

      // Add userData for interaction
      tableGroup.userData = { type: "table", tableId: index + 1 }

      // Add to scene and store reference
      sceneRef.current.add(tableGroup)
      tablesRef.current.push(tableGroup)
    })

    return () => {
      // Clean up tables when component unmounts
      if (sceneRef.current) {
        tablesRef.current.forEach((table) => {
          sceneRef.current?.remove(table)
          table.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose()
              if (object.material instanceof THREE.Material) {
                object.material.dispose()
              } else if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose())
              }
            }
          })
        })
        tablesRef.current = []
      }
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb) // Sky blue
    sceneRef.current = scene

    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 1.7, 25) // Start position
    cameraRef.current = camera

    // Initialize yaw object
    yawObject.current.position.set(0, 1.7, 25)
    scene.add(yawObject.current)

    // Try to load saved position
    loadPosition()

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Post processing
    try {
      const composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))

      const bloomPass = new BloomPass(
        0.8, // Reduced strength to avoid WebGL errors
        25, // kernel size
        4, // sigma : gaussian blur
        256, // blur render target resolution
      )
      composer.addPass(bloomPass)
      composerRef.current = composer
    } catch (error) {
      console.error("Error setting up post-processing:", error)
      // Continue without post-processing if it fails
    }

    // Setup controls
    const controls = new PointerLockControls(yawObject.current, renderer.domElement)
    controlsRef.current = controls

    // Create gallery
    const gallery = new Gallery(scene, GALLERY_ITEMS, spritesRef)
    gallery.create()

    // Create interior walls with proper error handling
    try {
      const interiorWalls = new InteriorWalls(scene)
      interiorWalls.create()

      // Store wall meshes for collision detection
      const walls = interiorWalls.getWalls()
      wallsRef.current = walls

      // Add walls to collision objects
      collisionObjectsRef.current = [...collisionObjectsRef.current, ...walls]
    } catch (error) {
      console.error("Error creating interior walls:", error)
    }

    // Collect all sprites for billboard effect
    scene.traverse((object) => {
      if (object instanceof THREE.Sprite) {
        spritesRef.current.push(object)
      }
    })

    // Update the NPC initialization with error handling
    try {
      // Initialize NPCs with improved pathing
      const npcManager = new NPCManager(scene, camera)

      // Update NPC data with improved paths but with safer position generation
      const updatedNPCData = npcData.map((npc) => {
        // Use simpler position generation to avoid errors
        const roomSize = 40 // Smaller than the actual room size to keep away from walls
        const randomX = Math.random() * roomSize - roomSize / 2
        const randomZ = Math.random() * roomSize - roomSize / 2
        const randomTargetX = Math.random() * roomSize - roomSize / 2
        const randomTargetZ = Math.random() * roomSize - roomSize / 2

        return {
          ...npc,
          position: new THREE.Vector3(randomX, 1, randomZ),
          targetPosition: new THREE.Vector3(randomTargetX, 1, randomTargetZ),
          // Increase interaction radius for better detection in maze
          interactionRadius: npc.interactionRadius * 1.2,
        }
      })

      npcManager.createNPCs(updatedNPCData)
      npcManagerRef.current = npcManager
      setActiveNpcs(new Set(updatedNPCData.map((npc) => npc.id))) // All NPCs active by default
    } catch (error) {
      console.error("Error initializing NPCs:", error)
      toast.error("There was an issue initializing NPCs. Some features may be limited.")
    }

    // Setup lighting
    const setupLighting = () => {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      ambientLightRef.current = ambientLight

      // Add directional light for shadows
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(0, 30, 0)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 100
      directionalLight.shadow.camera.left = -50
      directionalLight.shadow.camera.right = 50
      directionalLight.shadow.camera.top = 50
      directionalLight.shadow.camera.bottom = -50
      scene.add(directionalLight)
      directionalLightRef.current = directionalLight

      // Add spotlights for each wall
      const createSpotlight = (x: number, y: number, z: number, intensity: number, targetPos: THREE.Vector3) => {
        const spotlight = new THREE.SpotLight(0xffffff, intensity)
        spotlight.position.set(x, y, z)
        spotlight.target.position.copy(targetPos)
        spotlight.castShadow = true
        spotlight.angle = 0.5
        spotlight.penumbra = 0.2
        spotlight.decay = 1
        spotlight.distance = 80
        spotlight.shadow.mapSize.width = 1024
        spotlight.shadow.mapSize.height = 1024
        scene.add(spotlight)
        scene.add(spotlight.target)
        return spotlight
      }

      createSpotlight(0, 15, -25, 0.948, new THREE.Vector3(0, 0, -30))
      createSpotlight(0, 15, 25, 0.948, new THREE.Vector3(0, 0, 30))
      createSpotlight(-25, 15, 0, 0.948, new THREE.Vector3(-30, 0, 0))
      createSpotlight(25, 15, 0, 0.948, new THREE.Vector3(30, 0, 0))
    }

    setupLighting()

    // Initialize exhibit hover effect
    if (cameraRef.current && sceneRef.current) {
      exhibitHoverEffectRef.current = new ExhibitHoverEffect(cameraRef.current, sceneRef.current, (item) => {
        if (item) {
          setTooltipInfo({ title: item.title, description: item.description })
          // Dispatch custom event to show tooltip
          window.dispatchEvent(new CustomEvent("exhibit-hover", { detail: true }))
        } else {
          setTooltipInfo(null)
          // Dispatch custom event to hide tooltip
          window.dispatchEvent(new CustomEvent("exhibit-hover", { detail: false }))
        }
      })
    }

    // Start the clock
    clockRef.current.start()
    lastFpsTimeRef.current = performance.now()

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // Calculate delta time
      const currentTime = performance.now()
      const deltaTime = (currentTime - lastUpdateTimeRef.current) / 1000 // Convert to seconds
      lastUpdateTimeRef.current = currentTime

      // Update player movement
      handleMovement()

      // Update NPCs
      if (npcManagerRef.current && yawObject.current) {
        npcManagerRef.current.update(deltaTime, yawObject.current.position)
      }

      // Update camera position and rotation
      if (cameraRef.current) {
        cameraRef.current.position.copy(yawObject.current.position)
        cameraRef.current.rotation.copy(yawObject.current.rotation)
      }

      // Render the scene
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
      if (composerRef.current) {
        try {
          composerRef.current.render()
        } catch (error) {
          console.error("Error in composer rendering:", error)
          // Fallback to standard renderer
          if (rendererRef.current && cameraRef.current && sceneRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current)
          }
        }
      }
    }
    animate()

    // Event listeners
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("click", handleClick)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", handleResize)
    document.addEventListener("pointerlockchange", handlePointerLockChange)
    document.addEventListener("pointerlockerror", handlePointerLockError)

    // Show initial instructions
    toast.success("Click to start exploring. Press H for controls, J for joysticks, F to toggle flying mode.", {
      duration: 5000,
    })

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("click", handleClick)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("pointerlockchange", handlePointerLockChange)
      document.removeEventListener("pointerlockerror", handlePointerLockError)

      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
      }

      if (npcManagerRef.current) {
        npcManagerRef.current.dispose()
      }

      if (exhibitHoverEffectRef.current) {
        exhibitHoverEffectRef.current.dispose()
      }

      // Clear sprite references
      spritesRef.current = []
    }
  }, [
    handleMovement,
    handleKeyDown,
    handleKeyUp,
    handleClick,
    handleMouseMove,
    handleResize,
    handlePointerLockChange,
    handlePointerLockError,
    loadPosition,
    npcData,
    toggleFlyingMode,
  ])

  // Add a new function to handle editing NPC names
  const handleEditNPC = useCallback((id: number, newName: string, newStreamlitUrl: string) => {
    // Update the NPC data in state
    setNpcData((prev) =>
      prev.map((npc) => (npc.id === id ? { ...npc, name: newName, streamlitUrl: newStreamlitUrl } : npc)),
    )

    toast.success(`Updated NPC: ${newName}`)
  }, [])

  // Generate a position that doesn't collide with walls
  const generateSafePosition = useCallback((walls: THREE.Object3D[]) => {
    const raycaster = new THREE.Raycaster()
    const roomSize = 50
    let attempts = 0
    let position

    // Try to find a position that doesn't collide with walls
    do {
      position = new THREE.Vector3(Math.random() * roomSize - roomSize / 2, 1, Math.random() * roomSize - roomSize / 2)

      // Check all directions for collisions
      let collides = false
      const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
      ]

      for (const dir of directions) {
        raycaster.set(position, dir.normalize())
        const intersects = raycaster.intersectObjects(walls, true)
        if (intersects.length > 0 && intersects[0].distance < 1.5) {
          collides = true
          break
        }
      }

      if (!collides) break

      attempts++
    } while (attempts < 20)

    return position
  }, [])

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="absolute inset-0 cursor-pointer" />

      {/* Loading indicator */}
      {(!modelsLoaded || !animationsLoaded) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading 3D models and animations...</p>
          </div>
        </div>
      )}

      {/* NPC Controls */}
      <NPCControls
        npcs={npcData}
        activeNpcs={activeNpcs}
        onToggleNpc={handleToggleNpc}
        onToggleAll={handleToggleAllNpcs}
        onCallMeeting={handleToggleMeeting}
        onOpenAllStreamlit={handleOpenAllStreamlit}
        onAddNPC={handleAddNPC}
        onRemoveNPC={handleRemoveNPC}
        onReplaceNPC={handleReplaceNPC}
        onEditNPC={handleEditNPC}
        onCallNPC={handleCallNPC}
        onMakeCall={handleMakeCall} // Add this line
        onBreakCall={handleBreakCall} // Add this line
        isMeetingActive={isMeetingActive}
        isAtTables={isAtTables} // Add this line
      />

      {/* Enhanced Flying Mode Control */}
      <FlyingModeControl
        isEnabled={flyingMode}
        onToggle={toggleFlyingMode}
        onFlyUp={flyUp}
        onFlyDown={flyDown}
        onReset={resetHeight}
      />

      {/* Mini Map with NPC heatmap and wall texture labels - positioned below flying controls */}
      {yawObject.current && (
        <MiniMap
          playerPosition={yawObject.current.position}
          playerRotation={yawObject.current.rotation.y}
          npcs={npcData.map((npc) => ({
            position: npc.position,
            color: npc.color,
            isActive: Array.from(activeNpcs).includes(npc.id),
            name: npc.name,
            id: npc.id,
          }))}
          roomSize={60}
          galleryItems={GALLERY_ITEMS}
          className="top-32" // Position below flying controls
        />
      )}

      {/* Add this component to the JSX return section, after the MiniMap component */}
      <ControllerStatus isConnected={externalControllerActive} />

      {/* Exhibit Info Card */}
      {selectedItem && (
        <InfoCard
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null)
            if (controlsRef.current && isControlsEnabled) {
              try {
                controlsRef.current.lock()
              } catch (error) {
                console.error("Failed to lock pointer after closing info card:", error)
              }
            }
          }}
        />
      )}

      {/* NPC Conversation Card */}
      {selectedNPC && (
        <InfoCard
          item={{
            title: selectedNPC.name,
            description: `Conversation with ${selectedNPC.name}, an AI expert in this field.`,
            streamlitUrl: selectedNPC.streamlitUrl,
          }}
          onClose={() => {
            setSelectedNPC(null)
            if (controlsRef.current && isControlsEnabled) {
              try {
                controlsRef.current.lock()
              } catch (error) {
                console.error("Failed to lock pointer after closing NPC conversation:", error)
              }
            }
          }}
          isNPC={true}
        />
      )}

      {/* Joysticks */}
      {showJoysticks && (
        <div className="fixed bottom-20 left-0 right-0 z-10 flex justify-between px-4">
          <Joystick onMove={handleMoveJoystick} className="ml-4" externalControllerActive={externalControllerActive} />
          <RotationJoystick
            onRotate={handleRotateJoystick}
            className="mr-4"
            externalControllerActive={externalControllerActive}
          />
        </div>
      )}

      {/* Menu Button */}
      <button
        onClick={() => setIsIframeMenuOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 z-10"
      >
        View All AI Exhibits
      </button>

      {/* Controls Hint */}
      {showControls && (
        <div className="fixed top-24 left-4 bg-black/70 text-white p-4 rounded text-sm z-10 max-w-xs">
          <h3 className="font-bold mb-2">Controls</h3>
          <ul className="space-y-1">
            <li>WASD / Arrow Keys: Move</li>
            <li>Mouse: Look around (360°)</li>
            <li>Space: Fly up (in flying mode)</li>
            <li>Shift: Fly down (in flying mode)</li>
            <li>F: Toggle flying mode</li>
            <li>Q: Quick fly up</li>
            <li>Z: Quick fly down</li>
            <li>R: Reset height</li>
            <li>E: Interact with NPCs</li>
            <li>M: Open exhibits menu</li>
            <li>H: Toggle controls</li>
            <li>J: Toggle joysticks</li>
            <li>ESC: Exit mouse control</li>
            <li>Click: Select exhibits</li>
            <li className="text-green-400">Controller: {externalControllerActive ? "Connected" : "Not Connected"}</li>
            {externalControllerActive && (
              <>
                <li>Left Stick: Move</li>
                <li>Right Stick: Rotate</li>
                <li>A/Bottom: Interact</li>
                <li>B/Right: Exit control</li>
                <li>X/Left: Toggle flying</li>
                <li>Y/Top: Open menu</li>
                <li>L1/LB: Fly down</li>
                <li>R1/RB: Fly up</li>
              </>
            )}
          </ul>
          <h3 className="font-bold mt-4 mb-2">Debug Info</h3>
          <ul className="space-y-1 text-xs">
            <li>FPS: {debugInfo.fps}</li>
            <li>
              Position: ({debugInfo.position.x}, {debugInfo.position.y}, {debugInfo.position.z})
            </li>
            <li>
              Rotation: {debugInfo.rotation.y.toFixed(2)} (Pitch: {debugInfo.pitch.x.toFixed(2)})
            </li>
            <li>Mode: {flyingMode ? "Flying" : "Walking"}</li>
          </ul>
        </div>
      )}

      {/* Iframe Menu */}
      {isIframeMenuOpen && <IframeMenu items={GALLERY_ITEMS} onClose={() => setIsIframeMenuOpen(false)} />}

      {/* Streamlit Iframes */}
      {openStreamlitApps.length > 0 && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">NPC Streamlit Apps</h2>
              <button
                onClick={closeAllStreamlitApps}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label="Close all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openStreamlitApps.map((npc) => (
                <div key={npc.id} className="bg-white rounded-lg overflow-hidden shadow-lg">
                  <div className="flex justify-between items-center p-4 bg-gray-100">
                    <h3 className="text-xl font-semibold">{npc.name}</h3>
                    <button
                      onClick={() => closeStreamlitApp(npc.id)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="aspect-video w-full relative">
                    <iframe
                      src={npc.streamlitUrl}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tooltipInfo && <ExhibitTooltip title={tooltipInfo.title} description={tooltipInfo.description} />}
      <DebugOverlay enabled={true} />
      <GamepadController
        onLeftStickMove={handleMoveJoystick}
        onRightStickMove={handleRotateJoystick}
        onButtonPress={handleControllerButtonPress}
        onControllerConnect={handleControllerConnect}
      />
    </div>
  )
}
