// Enhanced NPC Configuration with 30 Agents
// Each agent has unique positioning, colors, behaviors, and voice agent clone capabilities

import * as THREE from "three"

export interface NPCConfig {
  id: number
  name: string
  model: string
  color: string
  streamlitUrl: string // Legacy alias kept for old components; value is the live WordPress shortcode render URL
  liveUrl?: string
  wordpressUrl?: string
  shortcode?: string
  shortcodeTag?: string
  position: THREE.Vector3
  targetPosition: THREE.Vector3
  speed: number
  rotationSpeed: number
  interactionRadius: number
  dialogue: string[]
  tablePosition: THREE.Vector3
  voiceCloneId?: string // For voice agent clones
  personality?: string // Agent personality type
  walkingPattern?: "random" | "patrol" | "circular" | "zigzag"
}

// Color palette for 30 unique NPCs
const NPC_COLORS = [
  "#4285F4", "#EA4335", "#FBBC05", "#34A853", "#9C27B0", 
  "#FF9800", "#E91E63", "#00BCD4", "#8BC34A", "#3F51B5",
  "#FF5722", "#009688", "#795548", "#607D8B", "#F44336",
  "#2196F3", "#4CAF50", "#FFC107", "#9E9E9E", "#673AB7",
  "#00BCD4", "#CDDC39", "#FF6F00", "#1976D2", "#C2185B",
  "#7B1FA2", "#0288D1", "#388E3C", "#F57C00", "#5D4037"
]

// Live WordPress shortcode mapping for NPC windows.
// `streamlitUrl` is kept only as a backward-compatible field name; it now contains a WordPress shortcode render URL.
const WORDPRESS_SHORTCODE_RENDER_BASE = "https://entremotivator.com/v0map-npc-gallery/"

const WORDPRESS_SHORTCODE_TAGS = [
  "aisc_hub",
  "aisc_missions",
  "aisc_channels",
  "aisc_tools",
  "aisc_discussions",
  "aisc_ai_guide",
  "aisc_resources",
  "aisc_leaderboard",
  "aisc_showcases",
  "aisc_events",
  "aisc_ai_arbitrage",
  "aisc_dashboard",
  "aisc_login",
  "aisc_register",
  "aisc_forgot_password",
  "agent_workflow_chat",
  "agent_workflow_form",
  "agent_workflow_status",
  "vg_display_admin_page",
  "vg_display_logout_link",
  "vg_display_logout_url",
  "vg_display_login_url",
  "vg_display_edit_link",
  "vg_display_edit_url",
  "wp_frontend_admin_login_form",
  "download_now",
  "download_now_page",
  "em3d_dashboard_iframe",
  "em3d_command_directory",
  "em3d_operator_floor",
]

const shortcodeRenderUrl = (tag: string) =>
  `${WORDPRESS_SHORTCODE_RENDER_BASE}?v0map_shortcode_tag=${encodeURIComponent(tag)}&v0map_embed=1&v0map_full_assets=1`

// Agent names and personalities
const AGENT_PROFILES = [
  { name: "AISC Hub", personality: "Strategic Leader", dialogue: ["Welcome! I manage strategic initiatives.", "Let's discuss business growth.", "I'm here to optimize operations."] },
  { name: "Agent Social", personality: "Social Media Expert", dialogue: ["Hi! I handle all social media.", "Let's boost your online presence.", "Engagement is my specialty."] },
  { name: "Agent Mindset", personality: "Mindset Coach", dialogue: ["Hello! I focus on mental wellness.", "Let's develop a growth mindset.", "Your success starts with mindset."] },
  { name: "Agent Blogger", personality: "Content Creator", dialogue: ["Hey! I create engaging content.", "Let's write something amazing.", "Content is king!"] },
  { name: "Agent Grant", personality: "Grant Specialist", dialogue: ["Greetings! I find funding opportunities.", "Let's secure that grant.", "I know all the funding sources."] },
  { name: "Agent Prayer AI", personality: "Spiritual Guide", dialogue: ["Peace be with you.", "Let's reflect together.", "I'm here for spiritual support."] },
  { name: "Agent Metrics", personality: "Data Analyst", dialogue: ["Hello! I track all metrics.", "Let's analyze the data.", "Numbers tell the story."] },
  { name: "Agent Researcher", personality: "Research Specialist", dialogue: ["Hi! I conduct deep research.", "Let's find the answers.", "Knowledge is power."] },
  { name: "Agent Investor", personality: "Investment Advisor", dialogue: ["Welcome! I manage investments.", "Let's grow your portfolio.", "Smart investing is key."] },
  { name: "Agent Newsroom", personality: "News Curator", dialogue: ["Breaking news! I'm your source.", "Let's stay informed.", "I track all the latest."] },
  { name: "Agent Invoice", personality: "Finance Manager", dialogue: ["Hello! I handle invoicing.", "Let's manage your finances.", "Payment tracking is my forte."] },
  { name: "Agent Appointments", personality: "Scheduler", dialogue: ["Hi! I manage appointments.", "Let's schedule a meeting.", "Time management expert here."] },
  { name: "Agent Pricing", personality: "Pricing Strategist", dialogue: ["Welcome! I optimize pricing.", "Let's find the right price point.", "Value-based pricing is key."] },
  { name: "Agent Customer", personality: "Customer Success", dialogue: ["Hello! I ensure customer satisfaction.", "Let's solve any issues.", "Happy customers are my goal."] },
  { name: "Agent SuperChat", personality: "Communication Hub", dialogue: ["Hi! I manage all communications.", "Let's connect with your team.", "Seamless communication is vital."] },
  { name: "Agent Caller", personality: "Voice AI", dialogue: ["Hello! I make intelligent calls.", "Let's reach out to prospects.", "Voice automation at its best."] },
  { name: "Agent Content", personality: "Content Manager", dialogue: ["Welcome! I organize content.", "Let's build a content strategy.", "Content management is my expertise."] },
  { name: "Agent Activator", personality: "System Activator", dialogue: ["Hi! I activate all systems.", "Let's get everything running.", "Activation is my specialty."] },
  { name: "Agent AdView", personality: "Ad Specialist", dialogue: ["Hello! I optimize advertising.", "Let's maximize ROI.", "Ad performance is key."] },
  { name: "Agent Logger", personality: "Activity Tracker", dialogue: ["Hi! I log all activities.", "Let's review the logs.", "Tracking is essential."] },
  { name: "Agent AutoSocial", personality: "Social Automation", dialogue: ["Welcome! I automate social media.", "Let's schedule posts.", "Automation saves time."] },
  { name: "Agent BizPlan", personality: "Business Planner", dialogue: ["Hello! I create business plans.", "Let's plan for success.", "Strategy is everything."] },
  { name: "Agent BookBuddy", personality: "Reading Companion", dialogue: ["Hi! I recommend books.", "Let's find your next read.", "Knowledge through reading."] },
  { name: "Agent Calendar", personality: "Time Organizer", dialogue: ["Welcome! I manage calendars.", "Let's organize your schedule.", "Time is precious."] },
  { name: "Agent GrantTracker", personality: "Grant Monitor", dialogue: ["Hello! I track grant progress.", "Let's monitor applications.", "Grant success tracking."] },
  { name: "Agent Habit", personality: "Habit Coach", dialogue: ["Hi! I help build habits.", "Let's create positive routines.", "Consistency is key."] },
  { name: "Agent DriveView", personality: "File Manager", dialogue: ["Welcome! I organize files.", "Let's access your documents.", "File management made easy."] },
  { name: "Agent Outreach", personality: "Email Specialist", dialogue: ["Hello! I handle email outreach.", "Let's connect with prospects.", "Email campaigns are my strength."] },
  { name: "Agent ImageGPT", personality: "Visual Creator", dialogue: ["Hi! I generate images.", "Let's create visuals.", "AI-powered imagery."] },
  { name: "Agent Inbox", personality: "Email Manager", dialogue: ["Welcome! I manage inboxes.", "Let's organize emails.", "Inbox zero is possible."] },
]

// Walking patterns for diverse NPC behaviors
const WALKING_PATTERNS = ["random", "patrol", "circular", "zigzag"] as const

// Generate 30 NPC positions in a larger room space
const generateNPCPositions = (): Array<{pos: THREE.Vector3, target: THREE.Vector3, table: THREE.Vector3}> => {
  const positions = []
  const roomSize = 50 // Larger room for 30 NPCs
  const spacing = 10
  
  // Create a grid-like distribution with some randomness
  for (let i = 0; i < 30; i++) {
    const row = Math.floor(i / 6)
    const col = i % 6
    
    const x = -roomSize/2 + (col * spacing) + (Math.random() * 3 - 1.5)
    const z = -roomSize/2 + (row * spacing) + (Math.random() * 3 - 1.5)
    
    const targetX = x + (Math.random() * 10 - 5)
    const targetZ = z + (Math.random() * 10 - 5)
    
    // Table positions distributed around the room
    const tableAngle = (i / 30) * Math.PI * 2
    const tableRadius = 20
    const tableX = Math.cos(tableAngle) * tableRadius
    const tableZ = Math.sin(tableAngle) * tableRadius
    
    positions.push({
      pos: new THREE.Vector3(x, 1, z),
      target: new THREE.Vector3(targetX, 1, targetZ),
      table: new THREE.Vector3(tableX, 0, tableZ)
    })
  }
  
  return positions
}

// Generate the 30 NPC configuration
export const ENHANCED_NPC_DATA: NPCConfig[] = (() => {
  const positions = generateNPCPositions()
  
  return AGENT_PROFILES.map((profile, index) => {
    const pos = positions[index]
    const pattern = WALKING_PATTERNS[index % WALKING_PATTERNS.length]
    
    return {
      id: index + 1,
      name: profile.name,
      model: "glb", // Will use GLB models
      color: NPC_COLORS[index],
      shortcodeTag: WORDPRESS_SHORTCODE_TAGS[index] || "aisc_hub",
      shortcode: `[${WORDPRESS_SHORTCODE_TAGS[index] || "aisc_hub"}]`,
      wordpressUrl: shortcodeRenderUrl(WORDPRESS_SHORTCODE_TAGS[index] || "aisc_hub"),
      liveUrl: shortcodeRenderUrl(WORDPRESS_SHORTCODE_TAGS[index] || "aisc_hub"),
      streamlitUrl: shortcodeRenderUrl(WORDPRESS_SHORTCODE_TAGS[index] || "aisc_hub"),
      position: pos.pos,
      targetPosition: pos.target,
      speed: 0.3 + (Math.random() * 0.4), // Speed between 0.3 and 0.7
      rotationSpeed: 1.5 + (Math.random() * 1.0), // Rotation speed between 1.5 and 2.5
      interactionRadius: 5,
      dialogue: profile.dialogue,
      tablePosition: pos.table,
      voiceCloneId: `voice_clone_${index + 1}`, // Unique voice clone ID
      personality: profile.personality,
      walkingPattern: pattern
    }
  })
})()

// Export table positions for 30 NPCs
export const ENHANCED_TABLE_POSITIONS = ENHANCED_NPC_DATA.map((npc, index) => ({
  position: [npc.tablePosition.x, npc.tablePosition.y, npc.tablePosition.z],
  rotation: [0, (index / 30) * Math.PI * 2, 0]
}))
