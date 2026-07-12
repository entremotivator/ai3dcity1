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
import { GamepadController } from "./gamepad-controller"
import { ControllerStatus } from "./controller-status"
import { READY_PLAYER_ME_AVATARS, getReadyPlayerMeAvatar, getFallbackAvatarUrl } from "./ready-player-me-config"

// Add this function to handle model loading errors
const handleModelLoadingError = (error: any, modelName: string) => {
  console.error(`Error loading model ${modelName}:`, error)
  toast.error(`Failed to load model ${modelName}. Using fallback.`)
}

// Enhanced table positions array for 30 NPCs
const TABLE_POSITIONS = [
  { position: [20, 0, 20], rotation: [0, -Math.PI / 4, 0] },
  { position: [20, 0, 10], rotation: [0, -Math.PI / 4, 0] },
  { position: [20, 0, 0], rotation: [0, -Math.PI / 4, 0] },
  { position: [20, 0, -10], rotation: [0, -Math.PI / 4, 0] },
  { position: [20, 0, -20], rotation: [0, -Math.PI / 4, 0] },
  { position: [-20, 0, 20], rotation: [0, Math.PI / 4, 0] },
  { position: [-20, 0, 10], rotation: [0, Math.PI / 4, 0] },
  { position: [-20, 0, 0], rotation: [0, Math.PI / 4, 0] },
  { position: [-20, 0, -10], rotation: [0, Math.PI / 4, 0] },
  { position: [-20, 0, -20], rotation: [0, Math.PI / 4, 0] },
  { position: [10, 0, 25], rotation: [0, 0, 0] },
  { position: [0, 0, 25], rotation: [0, 0, 0] },
  { position: [-10, 0, 25], rotation: [0, 0, 0] },
  { position: [10, 0, -25], rotation: [0, Math.PI, 0] },
  { position: [0, 0, -25], rotation: [0, Math.PI, 0] },
  { position: [-10, 0, -25], rotation: [0, Math.PI, 0] },
  { position: [25, 0, 10], rotation: [0, -Math.PI / 2, 0] },
  { position: [25, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  { position: [25, 0, -10], rotation: [0, -Math.PI / 2, 0] },
  { position: [-25, 0, 10], rotation: [0, Math.PI / 2, 0] },
  { position: [-25, 0, 0], rotation: [0, Math.PI / 2, 0] },
  { position: [-25, 0, -10], rotation: [0, Math.PI / 2, 0] },
  { position: [15, 0, 15], rotation: [0, -Math.PI / 3, 0] },
  { position: [15, 0, -15], rotation: [0, -Math.PI / 3, 0] },
  { position: [-15, 0, 15], rotation: [0, Math.PI / 3, 0] },
  { position: [-15, 0, -15], rotation: [0, Math.PI / 3, 0] },
  { position: [5, 0, 20], rotation: [0, 0, 0] },
  { position: [-5, 0, 20], rotation: [0, 0, 0] },
  { position: [5, 0, -20], rotation: [0, Math.PI, 0] },
  { position: [-5, 0, -20], rotation: [0, Math.PI, 0] },
]

// Enhanced NPC Data with 30 unique agents using Ready Player Me avatars
const DEFAULT_NPC_DATA: NPCData[] = [
  {
    id: 1,
    name: "Agent CEO",
    model: "glb",
    color: "#4285F4",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-10, 1, -10),
    targetPosition: new THREE.Vector3(-15, 1, -15),
    speed: 0.5,
    rotationSpeed: 2.0,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent CEO, your strategic business leader.",
      "Let's discuss growth strategies and business optimization.",
      "I'm here to help you scale your operations effectively.",
    ],
    tablePosition: new THREE.Vector3(20, 0, 20),
    glbUrl: getReadyPlayerMeAvatar(0),
  },
  {
    id: 2,
    name: "Agent Social",
    model: "glb",
    color: "#EA4335",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(10, 1, -10),
    targetPosition: new THREE.Vector3(15, 1, -15),
    speed: 0.4,
    rotationSpeed: 1.8,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent Social, your social media expert.",
      "Let's boost your online presence and engagement.",
      "Social media strategy is my specialty!",
    ],
    tablePosition: new THREE.Vector3(20, 0, 10),
    glbUrl: getReadyPlayerMeAvatar(1),
  },
  {
    id: 3,
    name: "Agent Mindset",
    model: "glb",
    color: "#FBBC05",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(10, 1, 10),
    targetPosition: new THREE.Vector3(15, 1, 15),
    speed: 0.6,
    rotationSpeed: 2.2,
    interactionRadius: 5,
    dialogue: [
      "Welcome! I'm Agent Mindset, your mental wellness coach.",
      "Let's develop a growth mindset together.",
      "Your success starts with the right mindset!",
    ],
    tablePosition: new THREE.Vector3(20, 0, 0),
    glbUrl: getReadyPlayerMeAvatar(2),
  },
  {
    id: 4,
    name: "Agent Blogger",
    model: "glb",
    color: "#34A853",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-10, 1, 10),
    targetPosition: new THREE.Vector3(-15, 1, 15),
    speed: 0.45,
    rotationSpeed: 1.9,
    interactionRadius: 5,
    dialogue: [
      "Hey! I'm Agent Blogger, your content creation specialist.",
      "Let's write something amazing together.",
      "Content is king, and I'm here to help you create it!",
    ],
    tablePosition: new THREE.Vector3(20, 0, -10),
    glbUrl: getReadyPlayerMeAvatar(3),
  },
  {
    id: 5,
    name: "Agent Grant",
    model: "glb",
    color: "#9C27B0",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(0, 1, -20),
    targetPosition: new THREE.Vector3(5, 1, -25),
    speed: 0.55,
    rotationSpeed: 2.1,
    interactionRadius: 5,
    dialogue: [
      "Greetings! I'm Agent Grant, your funding specialist.",
      "Let's find the perfect grant opportunities for you.",
      "I know all the funding sources available!",
    ],
    tablePosition: new THREE.Vector3(20, 0, -20),
    glbUrl: getReadyPlayerMeAvatar(4),
  },
  {
    id: 6,
    name: "Agent Prayer AI",
    model: "glb",
    color: "#FF9800",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(0, 1, 20),
    targetPosition: new THREE.Vector3(5, 1, 25),
    speed: 0.5,
    rotationSpeed: 2.0,
    interactionRadius: 5,
    dialogue: [
      "Peace be with you. I'm Agent Prayer AI.",
      "Let's reflect and find spiritual guidance together.",
      "I'm here to provide spiritual support and wisdom.",
    ],
    tablePosition: new THREE.Vector3(-20, 0, 20),
    glbUrl: getReadyPlayerMeAvatar(5),
  },
  {
    id: 7,
    name: "Agent Metrics",
    model: "glb",
    color: "#E91E63",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-20, 1, 0),
    targetPosition: new THREE.Vector3(-25, 1, 5),
    speed: 0.6,
    rotationSpeed: 2.2,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent Metrics, your data analyst.",
      "Let's analyze the numbers and track performance.",
      "Data-driven decisions are the key to success!",
    ],
    tablePosition: new THREE.Vector3(-20, 0, 10),
    glbUrl: getReadyPlayerMeAvatar(6),
  },
  {
    id: 8,
    name: "Agent Researcher",
    model: "glb",
    color: "#00BCD4",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(20, 1, 0),
    targetPosition: new THREE.Vector3(25, 1, 5),
    speed: 0.45,
    rotationSpeed: 1.9,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent Researcher, your research specialist.",
      "Let's conduct deep research and find answers.",
      "Knowledge is power, and I'm here to help you gain it!",
    ],
    tablePosition: new THREE.Vector3(-20, 0, 0),
    glbUrl: getReadyPlayerMeAvatar(7),
  },
  {
    id: 9,
    name: "Agent Investor",
    model: "glb",
    color: "#8BC34A",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-15, 1, -15),
    targetPosition: new THREE.Vector3(-20, 1, -20),
    speed: 0.55,
    rotationSpeed: 2.1,
    interactionRadius: 5,
    dialogue: [
      "Welcome! I'm Agent Investor, your investment advisor.",
      "Let's grow your portfolio with smart investments.",
      "Financial success through strategic investing!",
    ],
    tablePosition: new THREE.Vector3(-20, 0, -10),
    glbUrl: getReadyPlayerMeAvatar(8),
  },
  {
    id: 10,
    name: "Agent Newsroom",
    model: "glb",
    color: "#3F51B5",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(15, 1, 15),
    targetPosition: new THREE.Vector3(20, 1, 20),
    speed: 0.5,
    rotationSpeed: 2.0,
    interactionRadius: 5,
    dialogue: [
      "Breaking news! I'm Agent Newsroom.",
      "Let's stay informed with the latest updates.",
      "I track all the news that matters!",
    ],
    tablePosition: new THREE.Vector3(-20, 0, -20),
    glbUrl: getReadyPlayerMeAvatar(9),
  },
  {
    id: 11,
    name: "Agent Invoice",
    model: "glb",
    color: "#FF5722",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-12, 1, -8),
    targetPosition: new THREE.Vector3(-17, 1, -13),
    speed: 0.48,
    rotationSpeed: 1.95,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent Invoice, your finance manager.",
      "Let's handle all your invoicing needs efficiently.",
      "Payment tracking and financial management is my expertise!",
    ],
    tablePosition: new THREE.Vector3(10, 0, 25),
    glbUrl: getReadyPlayerMeAvatar(10),
  },
  {
    id: 12,
    name: "Agent Appointments",
    model: "glb",
    color: "#009688",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(12, 1, -8),
    targetPosition: new THREE.Vector3(17, 1, -13),
    speed: 0.52,
    rotationSpeed: 2.05,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent Appointments, your scheduling expert.",
      "Let's organize your calendar and manage meetings.",
      "Time management made simple!",
    ],
    tablePosition: new THREE.Vector3(0, 0, 25),
    glbUrl: getReadyPlayerMeAvatar(11),
  },
  {
    id: 13,
    name: "Agent Pricing",
    model: "glb",
    color: "#795548",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(12, 1, 8),
    targetPosition: new THREE.Vector3(17, 1, 13),
    speed: 0.47,
    rotationSpeed: 1.92,
    interactionRadius: 5,
    dialogue: [
      "Welcome! I'm Agent Pricing, your pricing strategist.",
      "Let's optimize your pricing for maximum value.",
      "Value-based pricing is the key to profitability!",
    ],
    tablePosition: new THREE.Vector3(-10, 0, 25),
    glbUrl: getReadyPlayerMeAvatar(12),
  },
  {
    id: 14,
    name: "Agent Customer",
    model: "glb",
    color: "#607D8B",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-12, 1, 8),
    targetPosition: new THREE.Vector3(-17, 1, 13),
    speed: 0.53,
    rotationSpeed: 2.08,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent Customer, your customer success manager.",
      "Let's ensure every customer is satisfied and happy.",
      "Customer satisfaction is my top priority!",
    ],
    tablePosition: new THREE.Vector3(10, 0, -25),
    glbUrl: getReadyPlayerMeAvatar(13),
  },
  {
    id: 15,
    name: "Agent SuperChat",
    model: "glb",
    color: "#F44336",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(0, 1, -15),
    targetPosition: new THREE.Vector3(3, 1, -20),
    speed: 0.58,
    rotationSpeed: 2.15,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent SuperChat, your communication hub.",
      "Let's connect with your team seamlessly.",
      "Communication is the foundation of success!",
    ],
    tablePosition: new THREE.Vector3(0, 0, -25),
    glbUrl: getReadyPlayerMeAvatar(14),
  },
  {
    id: 16,
    name: "Agent Caller",
    model: "glb",
    color: "#2196F3",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(0, 1, 15),
    targetPosition: new THREE.Vector3(3, 1, 20),
    speed: 0.49,
    rotationSpeed: 1.97,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent Caller, your voice AI specialist.",
      "Let's reach out to prospects with intelligent calls.",
      "Voice automation at its finest!",
    ],
    tablePosition: new THREE.Vector3(-10, 0, -25),
    glbUrl: getReadyPlayerMeAvatar(15),
  },
  {
    id: 17,
    name: "Agent Content",
    model: "glb",
    color: "#4CAF50",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-18, 1, 5),
    targetPosition: new THREE.Vector3(-23, 1, 8),
    speed: 0.51,
    rotationSpeed: 2.02,
    interactionRadius: 5,
    dialogue: [
      "Welcome! I'm Agent Content, your content manager.",
      "Let's organize and strategize your content effectively.",
      "Content management is my specialty!",
    ],
    tablePosition: new THREE.Vector3(25, 0, 10),
    glbUrl: getReadyPlayerMeAvatar(16),
  },
  {
    id: 18,
    name: "Agent Activator",
    model: "glb",
    color: "#FFC107",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(18, 1, 5),
    targetPosition: new THREE.Vector3(23, 1, 8),
    speed: 0.54,
    rotationSpeed: 2.1,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent Activator, your system activator.",
      "Let's get all systems up and running smoothly.",
      "Activation and deployment is what I do best!",
    ],
    tablePosition: new THREE.Vector3(25, 0, 0),
    glbUrl: getReadyPlayerMeAvatar(17),
  },
  {
    id: 19,
    name: "Agent AdView",
    model: "glb",
    color: "#9E9E9E",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-18, 1, -5),
    targetPosition: new THREE.Vector3(-23, 1, -8),
    speed: 0.46,
    rotationSpeed: 1.93,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent AdView, your advertising specialist.",
      "Let's optimize your ad campaigns for maximum ROI.",
      "Ad performance and optimization is my focus!",
    ],
    tablePosition: new THREE.Vector3(25, 0, -10),
    glbUrl: getReadyPlayerMeAvatar(18),
  },
  {
    id: 20,
    name: "Agent Logger",
    model: "glb",
    color: "#673AB7",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(18, 1, -5),
    targetPosition: new THREE.Vector3(23, 1, -8),
    speed: 0.57,
    rotationSpeed: 2.13,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent Logger, your activity tracker.",
      "Let's review all system logs and activities.",
      "Tracking and monitoring is essential for success!",
    ],
    tablePosition: new THREE.Vector3(-25, 0, 10),
    glbUrl: getReadyPlayerMeAvatar(19),
  },
  {
    id: 21,
    name: "Agent AutoSocial",
    model: "glb",
    color: "#00BCD4",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-8, 1, -12),
    targetPosition: new THREE.Vector3(-13, 1, -17),
    speed: 0.5,
    rotationSpeed: 2.0,
    interactionRadius: 5,
    dialogue: [
      "Welcome! I'm Agent AutoSocial, your social automation expert.",
      "Let's automate your social media posts and engagement.",
      "Automation saves time and increases efficiency!",
    ],
    tablePosition: new THREE.Vector3(-25, 0, 0),
    glbUrl: getReadyPlayerMeAvatar(20),
  },
  {
    id: 22,
    name: "Agent BizPlan",
    model: "glb",
    color: "#CDDC39",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(8, 1, -12),
    targetPosition: new THREE.Vector3(13, 1, -17),
    speed: 0.48,
    rotationSpeed: 1.96,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent BizPlan, your business planning expert.",
      "Let's create a comprehensive business plan for success.",
      "Strategic planning is the foundation of growth!",
    ],
    tablePosition: new THREE.Vector3(-25, 0, -10),
    glbUrl: getReadyPlayerMeAvatar(21),
  },
  {
    id: 23,
    name: "Agent BookBuddy",
    model: "glb",
    color: "#FF6F00",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(8, 1, 12),
    targetPosition: new THREE.Vector3(13, 1, 17),
    speed: 0.52,
    rotationSpeed: 2.04,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent BookBuddy, your reading companion.",
      "Let's find your next great book to read.",
      "Knowledge through reading is powerful!",
    ],
    tablePosition: new THREE.Vector3(15, 0, 15),
    glbUrl: getReadyPlayerMeAvatar(22),
  },
  {
    id: 24,
    name: "Agent Calendar",
    model: "glb",
    color: "#1976D2",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-8, 1, 12),
    targetPosition: new THREE.Vector3(-13, 1, 17),
    speed: 0.56,
    rotationSpeed: 2.12,
    interactionRadius: 5,
    dialogue: [
      "Welcome! I'm Agent Calendar, your time organizer.",
      "Let's manage your schedule efficiently.",
      "Time is precious, let's make the most of it!",
    ],
    tablePosition: new THREE.Vector3(15, 0, -15),
    glbUrl: getReadyPlayerMeAvatar(23),
  },
  {
    id: 25,
    name: "Agent GrantTracker",
    model: "glb",
    color: "#C2185B",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(0, 1, -10),
    targetPosition: new THREE.Vector3(2, 1, -15),
    speed: 0.49,
    rotationSpeed: 1.98,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent GrantTracker, your grant monitor.",
      "Let's track all your grant applications and progress.",
      "Grant success tracking made easy!",
    ],
    tablePosition: new THREE.Vector3(-15, 0, 15),
    glbUrl: getReadyPlayerMeAvatar(24),
  },
  {
    id: 26,
    name: "Agent Habit",
    model: "glb",
    color: "#7B1FA2",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(0, 1, 10),
    targetPosition: new THREE.Vector3(2, 1, 15),
    speed: 0.53,
    rotationSpeed: 2.07,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent Habit, your habit coach.",
      "Let's build positive habits and routines together.",
      "Consistency is the key to lasting change!",
    ],
    tablePosition: new THREE.Vector3(-15, 0, -15),
    glbUrl: getReadyPlayerMeAvatar(25),
  },
  {
    id: 27,
    name: "Agent DriveView",
    model: "glb",
    color: "#0288D1",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-5, 1, -18),
    targetPosition: new THREE.Vector3(-8, 1, -23),
    speed: 0.47,
    rotationSpeed: 1.94,
    interactionRadius: 5,
    dialogue: [
      "Welcome! I'm Agent DriveView, your file manager.",
      "Let's organize and access your documents easily.",
      "File management made simple and efficient!",
    ],
    tablePosition: new THREE.Vector3(5, 0, 20),
    glbUrl: getReadyPlayerMeAvatar(26),
  },
  {
    id: 28,
    name: "Agent Outreach",
    model: "glb",
    color: "#388E3C",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(5, 1, -18),
    targetPosition: new THREE.Vector3(8, 1, -23),
    speed: 0.51,
    rotationSpeed: 2.01,
    interactionRadius: 5,
    dialogue: [
      "Hello! I'm Agent Outreach, your email specialist.",
      "Let's connect with prospects through effective email campaigns.",
      "Email outreach is my strength!",
    ],
    tablePosition: new THREE.Vector3(-5, 0, 20),
    glbUrl: getReadyPlayerMeAvatar(27),
  },
  {
    id: 29,
    name: "Agent ImageGPT",
    model: "glb",
    color: "#F57C00",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(5, 1, 18),
    targetPosition: new THREE.Vector3(8, 1, 23),
    speed: 0.55,
    rotationSpeed: 2.09,
    interactionRadius: 5,
    dialogue: [
      "Hi! I'm Agent ImageGPT, your visual creator.",
      "Let's generate amazing images with AI.",
      "AI-powered imagery at your service!",
    ],
    tablePosition: new THREE.Vector3(5, 0, -20),
    glbUrl: getReadyPlayerMeAvatar(28),
  },
  {
    id: 30,
    name: "Agent Inbox",
    model: "glb",
    color: "#5D4037",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: new THREE.Vector3(-5, 1, 18),
    targetPosition: new THREE.Vector3(-8, 1, 23),
    speed: 0.5,
    rotationSpeed: 2.0,
    interactionRadius: 5,
    dialogue: [
      "Welcome! I'm Agent Inbox, your email manager.",
      "Let's achieve inbox zero together.",
      "Email management made effortless!",
    ],
    tablePosition: new THREE.Vector3(-5, 0, -20),
    glbUrl: getReadyPlayerMeAvatar(29),
  },
]

// Function to replace all NPCs with Ready Player Me GLB models
const replaceAllNPCsWithGLBModels = (npcs: NPCData[]): NPCData[] => {
  const updatedNPCs = [...npcs]

  for (let i = 0; i < updatedNPCs.length; i++) {
    const originalColor = updatedNPCs[i].color

    updatedNPCs[i] = {
      ...updatedNPCs[i],
      model: "glb",
      glbUrl: updatedNPCs[i].glbUrl || getReadyPlayerMeAvatar(i),
      color: originalColor,
    }
  }

  return updatedNPCs
}

// Enhanced GALLERY_ITEMS with 25+ Streamlit applications on walls (using port 8501)
const GALLERY_ITEMS = [
  // North Wall (5 items)
  {
    title: "Invoices",
    description: "Manage all your invoices and payments",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 0, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    title: "Appointments",
    description: "Schedule and manage appointments",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -14, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    title: "Pricing",
    description: "Optimize your pricing strategy",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 14, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    title: "Customers",
    description: "Customer relationship management",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -24, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    title: "Super Chat",
    description: "Advanced communication hub",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 24, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },

  // East Wall (7 items)
  {
    title: "AI Caller",
    description: "Intelligent voice calling system",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 29, y: 2, z: -20 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Content Dashboard",
    description: "Manage all your content",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 29, y: 2, z: -14 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Activate Agents",
    description: "Activate and manage AI agents",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 29, y: 2, z: -7 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Ad View",
    description: "Advertising analytics and insights",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 29, y: 2, z: 0 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Agent Log",
    description: "Track all agent activities",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 29, y: 2, z: 7 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "AutoSocial",
    description: "Automated social media management",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 29, y: 2, z: 14 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },
  {
    title: "Bizplan",
    description: "Business planning and strategy",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 29, y: 2, z: 20 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  },

  // South Wall (7 items)
  {
    title: "BookBuddy",
    description: "Your reading companion",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 0, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "Calendar",
    description: "Schedule and time management",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -10, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "Grant Tracker",
    description: "Track grant applications",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 10, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "Habit Tracker",
    description: "Build better habits",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -20, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "Drive View",
    description: "File management system",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 20, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "Email Outreach",
    description: "Email campaign management",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -24, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
  {
    title: "ImageGPT",
    description: "AI-powered image generation",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 24, y: 2, z: 29 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },

  // West Wall (7 items)
  {
    title: "Inbox Agent",
    description: "Email inbox management",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -29, y: 2, z: -20 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "LinkedIn Checklist",
    description: "LinkedIn optimization tasks",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -29, y: 2, z: -14 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "LinkedIn Systems",
    description: "LinkedIn automation and growth",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -29, y: 2, z: -7 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "Live HTML",
    description: "Live HTML editor and preview",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -29, y: 2, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "Project Management",
    description: "Comprehensive project tracking",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -29, y: 2, z: 7 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "Social Checklist",
    description: "Social media task management",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -29, y: 2, z: 14 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },
  {
    title: "Cost Tracker",
    description: "Track and manage costs",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: -29, y: 2, z: 20 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
  },

  // Additional wall item
  {
    title: "Trader",
    description: "Trading and investment tools",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
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
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    KeyQ: false,
    KeyE: false,
    Space: false,
    ShiftLeft: false,
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
  const [isAtTables, setIsAtTables] = useState(false)
  const [debugInfo, setDebugInfo] = useState({
    fps: 0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { y: 0 },
    pitch: { x: 0 },
  })
  const framesRef = useRef(0)
  const lastFpsTimeRef = useRef(0)
  const [openStreamlitApps, setOpenStreamlitApps] = useState<NPCData[]>([])
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [animationsLoaded, setAnimationsLoaded] = useState(false)
  const composerRef = useRef<EffectComposer | null>(null)
  const wallsRef = useRef<THREE.Object3D[]>([])
  const tablesRef = useRef<THREE.Group[]>([])
  const [externalControllerActive, setExternalControllerActive] = useState(false)
  const [controllerButtonMap, setControllerButtonMap] = useState<Record<number, string>>({})
  const exhibitHoverEffectRef = useRef<ExhibitHoverEffect | null>(null)
  const [tooltipInfo, setTooltipInfo] = useState<{ title: string; description: string } | null>(null)
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

        const customNPCsWithGLB = deserializedNPCs.map((npc: NPCData, index: number) => ({
          ...npc,
          model: "glb",
          glbUrl: getReadyPlayerMeAvatar((index + DEFAULT_NPC_DATA.length) % READY_PLAYER_ME_AVATARS.length),
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
      const customNPCs = npcData.filter((npc) => npc.id > 30)
      if (customNPCs.length > 0) {
        const serializedNPCs = customNPCs.map(serializeNPCData)
        localStorage.setItem("customNPCs", JSON.stringify(serializedNPCs))
      }
    } catch (error) {
      console.error("Failed to save custom NPCs:", error)
    }
  }, [npcData])

  // Preload models and animations
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const modelsSuccess = await preloadModels()
        setModelsLoaded(true)

        if (modelsSuccess) {
          toast.success("3D models preloaded successfully")
        } else {
          toast.error("Some models failed to load. Using fallbacks where needed.")
        }

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
      newPosition.y += 5

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
      newPosition.y -= 5

      const minHeight = 1.7
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
      newPosition.y = 1.7
      yawObject.current.position.copy(newPosition)
      toast.success("Height reset to ground level")
    }
  }, [flyingMode])

  // Handle controller connect
  const handleControllerConnect = useCallback((connected: boolean) => {
    setExternalControllerActive(connected)
    if (connected) {
      toast.success("Game controller connected! You can now use your controller to navigate.")
    } else {
      toast.info("Game controller disconnected.")
    }
  }, [])

  // Handle controller button press
  const handleControllerButtonPress = useCallback(
    (buttonIndex: number, pressed: boolean) => {
      if (!pressed) return

      switch (buttonIndex) {
        case 0:
          if (controlsRef.current && !isPointerLocked.current && isControlsEnabled) {
            try {
              controlsRef.current.lock()
            } catch (error) {
              console.error("Failed to lock pointer:", error)
            }
          }
          break
        case 1:
          if (controlsRef.current && isPointerLocked.current) {
            controlsRef.current.unlock()
          }
          break
        case 2:
          toggleFlyingMode()
          break
        case 3:
          setIsIframeMenuOpen(true)
          break
        case 4:
          if (flyingMode) flyDown()
          break
        case 5:
          if (flyingMode) flyUp()
          break
        case 6:
          resetHeight()
          break
        case 9:
          setShowControls((prev) => !prev)
          break
        default:
          break
      }
    },
    [flyingMode, isControlsEnabled, toggleFlyingMode, flyDown, flyUp, resetHeight],
  )

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.Fog(0x87ceeb, 0, 100)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 1.7, 5)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    containerRef.current.appendChild(renderer.domElement)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    ambientLightRef.current = ambientLight

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)
    directionalLightRef.current = directionalLight

    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100)
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    floor.userData = { type: "floor" }
    scene.add(floor)

    // Add pointer lock controls
    const controls = new PointerLockControls(camera, renderer.domElement)
    controlsRef.current = controls

    controls.addEventListener("lock", () => {
      isPointerLocked.current = true
    })

    controls.addEventListener("unlock", () => {
      isPointerLocked.current = false
    })

    // Click to lock pointer
    renderer.domElement.addEventListener("click", () => {
      if (!isPointerLocked.current && isControlsEnabled) {
        try {
          controls.lock()
        } catch (error) {
          console.error("Failed to lock pointer:", error)
        }
      }
    })

    // Add yaw object to scene
    scene.add(controls.getObject())

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [isControlsEnabled])

  // Initialize NPC Manager with 30 NPCs
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !modelsLoaded || !animationsLoaded) return

    const npcManager = new NPCManager(sceneRef.current, cameraRef.current)
    npcManagerRef.current = npcManager

    npcData.forEach((data) => {
      npcManager.addNPC(data)
    })

    toast.success(`${npcData.length} AI agents initialized and ready!`)

    return () => {
      if (npcManagerRef.current) {
        npcManagerRef.current.dispose()
      }
    }
  }, [sceneRef.current, cameraRef.current, modelsLoaded, animationsLoaded, npcData])

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return

    const animate = () => {
      requestAnimationFrame(animate)

      const delta = clockRef.current.getDelta()

      // Update movement
      if (yawObject.current) {
        move(delta)
      }

      // Update NPCs
      if (npcManagerRef.current) {
        npcManagerRef.current.update(delta)
      }

      // Update FPS
      framesRef.current++
      const currentTime = performance.now()
      if (currentTime >= lastFpsTimeRef.current + 1000) {
        const fps = Math.round((framesRef.current * 1000) / (currentTime - lastFpsTimeRef.current))
        setDebugInfo((prev) => ({
          ...prev,
          fps,
        }))
        framesRef.current = 0
        lastFpsTimeRef.current = currentTime
      }

      // Update debug position
      if (yawObject.current) {
        setDebugInfo((prev) => ({
          ...prev,
          position: {
            x: Math.round(yawObject.current!.position.x * 10) / 10,
            y: Math.round(yawObject.current!.position.y * 10) / 10,
            z: Math.round(yawObject.current!.position.z * 10) / 10,
          },
          rotation: {
            y: Math.round((yawObject.current!.rotation.y * 180) / Math.PI),
          },
          pitch: {
            x: Math.round((cameraRef.current!.rotation.x * 180) / Math.PI),
          },
        }))
      }

      // Render scene
      if (composerRef.current) {
        composerRef.current.render()
      } else {
        rendererRef.current!.render(sceneRef.current!, cameraRef.current!)
      }
    }

    animate()
  }, [move])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code in keysRef.current) {
        ;(keysRef.current as any)[event.code] = true
      }

      // Toggle flying mode with F key
      if (event.code === "KeyF") {
        toggleFlyingMode()
      }

      // Fly up with Space
      if (event.code === "Space" && flyingMode) {
        event.preventDefault()
        flyUp()
      }

      // Fly down with Shift
      if (event.code === "ShiftLeft" && flyingMode) {
        event.preventDefault()
        flyDown()
      }

      // Reset height with R
      if (event.code === "KeyR" && flyingMode) {
        resetHeight()
      }

      // Toggle menu with M
      if (event.code === "KeyM") {
        setIsIframeMenuOpen((prev) => !prev)
      }

      // Toggle controls with C
      if (event.code === "KeyC") {
        setShowControls((prev) => !prev)
      }

      // Escape to close menus
      if (event.code === "Escape") {
        setIsIframeMenuOpen(false)
        setSelectedItem(null)
        setSelectedNPC(null)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code in keysRef.current) {
        ;(keysRef.current as any)[event.code] = false
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [flyingMode, toggleFlyingMode, flyUp, flyDown, resetHeight])

  // NPC interaction
  const handleNPCClick = useCallback(
    (npc: NPCData) => {
      setSelectedNPC(npc)
      toast.success(`Interacting with ${npc.name}`)
    },
    [],
  )

  // Gallery item interaction
  const handleGalleryItemClick = useCallback(
    (item: typeof GALLERY_ITEMS[0]) => {
      setSelectedItem(item)
      toast.success(`Opening ${item.title}`)
    },
    [],
  )

  // Toggle NPC meeting mode
  const toggleMeeting = useCallback(() => {
    if (npcManagerRef.current) {
      if (isMeetingActive) {
        npcManagerRef.current.endMeeting()
        setIsMeetingActive(false)
        toast.success("Meeting ended. NPCs returning to normal behavior.")
      } else {
        npcManagerRef.current.startMeeting()
        setIsMeetingActive(true)
        toast.success("Meeting started. All NPCs gathering at center.")
      }
    }
  }, [isMeetingActive])

  // Toggle NPCs at tables
  const toggleTables = useCallback(() => {
    if (npcManagerRef.current) {
      if (isAtTables) {
        npcManagerRef.current.sendNPCsToOriginalPositions()
        setIsAtTables(false)
        toast.success("NPCs returning to original positions.")
      } else {
        npcManagerRef.current.sendNPCsToTables()
        setIsAtTables(true)
        toast.success("NPCs moving to their assigned tables.")
      }
    }
  }, [isAtTables])

  // Activate/deactivate NPCs
  const toggleNPCActive = useCallback(
    (npcId: number) => {
      if (npcManagerRef.current) {
        const npc = npcManagerRef.current.getNPC(npcId)
        if (npc) {
          if (activeNpcs.has(npcId)) {
            npc.deactivate()
            setActiveNpcs((prev) => {
              const newSet = new Set(prev)
              newSet.delete(npcId)
              return newSet
            })
            toast.success(`${npc.name} deactivated`)
          } else {
            npc.activate()
            setActiveNpcs((prev) => new Set(prev).add(npcId))
            toast.success(`${npc.name} activated`)
          }
        }
      }
    },
    [activeNpcs],
  )

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Gallery Component */}
      <Gallery
        items={GALLERY_ITEMS}
        scene={sceneRef.current}
        camera={cameraRef.current}
        onItemClick={handleGalleryItemClick}
      />

      {/* NPC Controls */}
      {showControls && (
        <NPCControls
          npcs={npcData}
          activeNpcs={activeNpcs}
          onToggleActive={toggleNPCActive}
          onToggleMeeting={toggleMeeting}
          onToggleTables={toggleTables}
          isMeetingActive={isMeetingActive}
          isAtTables={isAtTables}
        />
      )}

      {/* Flying Mode Control */}
      <FlyingModeControl
        flyingMode={flyingMode}
        onToggle={toggleFlyingMode}
        onFlyUp={flyUp}
        onFlyDown={flyDown}
        onResetHeight={resetHeight}
      />

      {/* Mini Map */}
      <MiniMap
        playerPosition={yawObject.current?.position || new THREE.Vector3()}
        playerRotation={yawObject.current?.rotation.y || 0}
        npcs={npcData}
        galleryItems={GALLERY_ITEMS}
      />

      {/* Debug Overlay */}
      <DebugOverlay debugInfo={debugInfo} />

      {/* Controller Status */}
      <ControllerStatus active={externalControllerActive} buttonMap={controllerButtonMap} />

      {/* Gamepad Controller */}
      <GamepadController
        keysRef={keysRef}
        moveJoystickRef={moveJoystickRef}
        rotateJoystickRef={rotateJoystickRef}
        onConnect={handleControllerConnect}
        onButtonPress={handleControllerButtonPress}
      />

      {/* Mobile Joysticks */}
      {showJoysticks && (
        <>
          <Joystick joystickRef={moveJoystickRef} position="left" />
          <RotationJoystick joystickRef={rotateJoystickRef} position="right" />
        </>
      )}

      {/* Iframe Menu */}
      {isIframeMenuOpen && (
        <IframeMenu
          items={GALLERY_ITEMS}
          onClose={() => setIsIframeMenuOpen(false)}
          onItemClick={handleGalleryItemClick}
        />
      )}

      {/* Selected Item Display */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-11/12 h-5/6 bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              <X size={24} />
            </button>
            <iframe
              src={selectedItem.streamlitUrl}
              className="w-full h-full"
              title={selectedItem.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Selected NPC Display */}
      {selectedNPC && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-11/12 h-5/6 bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedNPC(null)}
              className="absolute top-4 right-4 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              <X size={24} />
            </button>
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-4">{selectedNPC.name}</h2>
              <div className="mb-6">
                {selectedNPC.dialogue?.map((line, index) => (
                  <p key={index} className="text-lg mb-2">
                    {line}
                  </p>
                ))}
              </div>
              <iframe
                src={selectedNPC.streamlitUrl}
                className="w-full h-96"
                title={selectedNPC.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Exhibit Tooltip */}
      {tooltipInfo && (
        <ExhibitTooltip title={tooltipInfo.title} description={tooltipInfo.description} />
      )}

      {/* Instructions */}
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg text-sm">
        <p className="font-bold mb-2">Controls:</p>
        <p>WASD / Arrow Keys: Move</p>
        <p>Mouse: Look around</p>
        <p>F: Toggle flying mode</p>
        <p>Space: Fly up (when flying)</p>
        <p>Shift: Fly down (when flying)</p>
        <p>R: Reset height</p>
        <p>M: Toggle menu</p>
        <p>C: Toggle NPC controls</p>
        <p>ESC: Close menus</p>
        <p className="mt-2 font-bold">30 AI Agents Active!</p>
      </div>
    </div>
  )
}
