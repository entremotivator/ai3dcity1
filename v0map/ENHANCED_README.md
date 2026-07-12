# Enhanced Virtual Gallery with 30 AI Agents

## 🚀 Major Enhancements

This enhanced version includes significant improvements over the original project:

### ✨ 30 Full Room AI Agents
- **30 unique AI agents** with distinct personalities and roles
- Each agent uses **Ready Player Me avatars** for realistic 3D representation
- Advanced pathfinding and walking behaviors (random, patrol, circular, zigzag patterns)
- Voice agent clone capabilities with unique voice IDs
- Interactive dialogue systems for each agent
- Meeting mode: All agents can gather at the center
- Table mode: Agents move to assigned workstations
- Individual agent activation/deactivation controls

### 🖼️ 27 Streamlit Wall Applications
All Streamlit applications are now integrated on the gallery walls using **port 8501**:

**North Wall (5 apps):**
1. Invoices - Invoice and payment management
2. Appointments - Scheduling system
3. Pricing - Pricing strategy optimizer
4. Customers - CRM system
5. Super Chat - Communication hub

**East Wall (7 apps):**
6. AI Caller - Voice calling system
7. Content Dashboard - Content management
8. Activate Agents - Agent activation system
9. Ad View - Advertising analytics
10. Agent Log - Activity tracking
11. AutoSocial - Social media automation
12. Bizplan - Business planning

**South Wall (7 apps):**
13. BookBuddy - Reading companion
14. Calendar - Schedule management
15. Grant Tracker - Grant application tracking
16. Habit Tracker - Habit building
17. Drive View - File management
18. Email Outreach - Email campaigns
19. ImageGPT - AI image generation

**West Wall (7 apps):**
20. Inbox Agent - Email management
21. LinkedIn Checklist - LinkedIn optimization
22. LinkedIn Systems - LinkedIn automation
23. Live HTML - HTML editor
24. Project Management - Project tracking
25. Social Checklist - Social media tasks
26. Cost Tracker - Cost management
27. Trader - Trading tools

### 🎮 Enhanced Controls & Features
- **Flying Mode**: Press F to toggle, Space to fly up, Shift to fly down
- **Gamepad Support**: Full Xbox/PlayStation controller compatibility
- **Mobile Controls**: Touch joysticks for mobile devices
- **Mini Map**: Real-time navigation map showing all agents
- **Debug Overlay**: FPS counter and position tracking
- **NPC Controls Panel**: Manage all 30 agents from a single interface
- **Collision Detection**: Realistic physics and movement
- **Day/Night Cycle**: Dynamic lighting system
- **Weather System**: Environmental effects
- **Post-Processing**: Bloom effects and visual enhancements

## 🎯 Agent Profiles

Each of the 30 agents has a unique role:

1. **Agent CEO** - Strategic business leader
2. **Agent Social** - Social media expert
3. **Agent Mindset** - Mental wellness coach
4. **Agent Blogger** - Content creation specialist
5. **Agent Grant** - Funding specialist
6. **Agent Prayer AI** - Spiritual guide
7. **Agent Metrics** - Data analyst
8. **Agent Researcher** - Research specialist
9. **Agent Investor** - Investment advisor
10. **Agent Newsroom** - News curator
11. **Agent Invoice** - Finance manager
12. **Agent Appointments** - Scheduler
13. **Agent Pricing** - Pricing strategist
14. **Agent Customer** - Customer success manager
15. **Agent SuperChat** - Communication hub
16. **Agent Caller** - Voice AI specialist
17. **Agent Content** - Content manager
18. **Agent Activator** - System activator
19. **Agent AdView** - Advertising specialist
20. **Agent Logger** - Activity tracker
21. **Agent AutoSocial** - Social automation expert
22. **Agent BizPlan** - Business planner
23. **Agent BookBuddy** - Reading companion
24. **Agent Calendar** - Time organizer
25. **Agent GrantTracker** - Grant monitor
26. **Agent Habit** - Habit coach
27. **Agent DriveView** - File manager
28. **Agent Outreach** - Email specialist
29. **Agent ImageGPT** - Visual creator
30. **Agent Inbox** - Email manager

## 🎨 Ready Player Me Integration

All 30 agents use Ready Player Me avatars:
- High-quality 3D character models
- Customizable appearances
- Smooth animations
- Optimized for web performance
- Fallback system for loading errors

## 🕹️ Controls Guide

### Keyboard Controls
- **WASD / Arrow Keys**: Move around
- **Mouse**: Look around (when pointer is locked)
- **F**: Toggle flying mode
- **Space**: Fly up (in flying mode)
- **Shift**: Fly down (in flying mode)
- **R**: Reset height to ground level
- **M**: Toggle Streamlit menu
- **C**: Toggle NPC controls panel
- **ESC**: Close menus and dialogs
- **Click**: Lock pointer for first-person control

### Gamepad Controls
- **Left Stick**: Move
- **Right Stick**: Look around
- **A Button**: Lock pointer
- **B Button**: Unlock pointer
- **X Button**: Toggle flying mode
- **Y Button**: Open menu
- **LB**: Fly down
- **RB**: Fly up
- **Start**: Toggle controls panel

### Mobile Controls
- **Left Joystick**: Move
- **Right Joystick**: Look around
- **Tap screen**: Lock pointer

## 🏗️ Project Structure

```
v0map-main 2/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── virtual-gallery.tsx (ENHANCED - 30 NPCs)
│   ├── virtual-gallery-enhanced.tsx (Enhanced version)
│   ├── virtual-gallery-original-backup.tsx (Original backup)
│   ├── ready-player-me-config.ts (NEW - Avatar configuration)
│   ├── npc.tsx (NPC class implementation)
│   ├── gallery.tsx (Wall gallery system)
│   ├── npc-controls.tsx (NPC management UI)
│   ├── mini-map.tsx (Navigation map)
│   ├── debug-overlay.tsx (Debug information)
│   ├── flying-mode-control.tsx (Flying controls)
│   ├── gamepad-controller.tsx (Gamepad support)
│   ├── joystick.tsx (Mobile controls)
│   ├── iframe-menu.tsx (Streamlit menu)
│   └── ... (other components)
├── hooks/
│   └── use-movement.ts (Movement and collision)
├── public/
│   └── ... (assets)
└── package.json
```

## 🚀 Getting Started

### Installation

```bash
cd "v0map-main 2"
pnpm install
```

### Development

```bash
pnpm dev
```

The application will start on `http://localhost:3000`

### Building for Production

```bash
pnpm build
pnpm start
```

## 🔧 Configuration

### Customizing Ready Player Me Avatars

Edit `components/ready-player-me-config.ts` to use your own Ready Player Me avatar URLs:

```typescript
export const READY_PLAYER_ME_AVATARS: ReadyPlayerMeAvatar[] = [
  {
    id: "avatar_1",
    name: "Agent CEO",
    avatarUrl: "https://models.readyplayer.me/YOUR_AVATAR_ID.glb?morphTargets=ARKit&textureAtlas=1024",
  },
  // ... add more avatars
]
```

### Customizing Streamlit URLs

Edit the `GALLERY_ITEMS` array in `components/virtual-gallery.tsx` to change Streamlit application URLs:

```typescript
const GALLERY_ITEMS = [
  {
    title: "Your App Name",
    description: "Your app description",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 0, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // ... add more items
]
```

### Customizing NPC Behavior

Edit the `DEFAULT_NPC_DATA` array in `components/virtual-gallery.tsx` to modify NPC properties:

```typescript
{
  id: 1,
  name: "Your Agent Name",
  model: "glb",
  color: "#4285F4",
  streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
  position: new THREE.Vector3(-10, 1, -10),
  targetPosition: new THREE.Vector3(-15, 1, -15),
  speed: 0.5, // Movement speed
  rotationSpeed: 2.0, // Rotation speed
  interactionRadius: 5, // Interaction distance
  dialogue: [
    "Your dialogue line 1",
    "Your dialogue line 2",
  ],
  tablePosition: new THREE.Vector3(20, 0, 20),
  glbUrl: getReadyPlayerMeAvatar(0),
}
```

## 🎨 Customizing the Gallery

### Room Size
The gallery room is 60x60 units. To change the size, modify the floor geometry in `components/virtual-gallery.tsx`:

```typescript
const floorGeometry = new THREE.PlaneGeometry(100, 100) // Change dimensions here
```

### Lighting
Adjust ambient and directional lighting:

```typescript
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6) // Color, intensity
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8) // Color, intensity
```

### Wall Positions
Gallery items are positioned on four walls:
- **North Wall**: z = -29
- **South Wall**: z = 29
- **East Wall**: x = 29
- **West Wall**: x = -29

## 🐛 Troubleshooting

### NPCs not loading
- Check browser console for errors
- Ensure Ready Player Me URLs are valid
- Verify internet connection for avatar loading

### Streamlit apps not displaying
- Ensure all Streamlit apps are running on port 8501
- Check CORS settings if apps are on different domains
- Verify iframe permissions in browser

### Performance issues
- Reduce number of active NPCs using the controls panel
- Disable post-processing effects
- Lower browser window size
- Close unnecessary Streamlit apps

### Controls not working
- Click on the canvas to lock pointer
- Check if gamepad is properly connected
- Ensure keyboard focus is on the canvas

## 📝 Features Preserved from Original

✅ All original NPC functionality
✅ Gallery wall system
✅ Pointer lock controls
✅ Movement and collision detection
✅ Lighting and shadows
✅ Animation system
✅ Model preloading
✅ Local storage for custom NPCs
✅ Debug overlay
✅ Mobile support
✅ Gamepad support
✅ Flying mode
✅ Meeting mode
✅ Table assignments
✅ Interactive dialogues
✅ Streamlit integration

## 🆕 New Features Added

✅ 20 additional NPCs (10 → 30)
✅ Ready Player Me avatar integration
✅ 27 Streamlit wall applications
✅ Enhanced NPC control panel
✅ Voice agent clone IDs
✅ Personality system for NPCs
✅ Walking pattern variations
✅ Expanded room size
✅ More table positions
✅ Enhanced documentation

## 📦 Dependencies

- **Next.js 15.2.4** - React framework
- **React 19.2.0** - UI library
- **Three.js** - 3D graphics
- **three-stdlib** - Three.js utilities
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 🤝 Contributing

To add more agents:
1. Add avatar URL to `ready-player-me-config.ts`
2. Add NPC data to `DEFAULT_NPC_DATA` array
3. Add corresponding Streamlit app to `GALLERY_ITEMS`
4. Update table positions if needed

## 📄 License

Same license as the original project.

## 🙏 Acknowledgments

- Original v0map project creators
- Ready Player Me for avatar system
- Three.js community
- Streamlit team

---

**Version**: 2.0.0 Enhanced
**Last Updated**: January 2026
**Total Agents**: 30
**Total Streamlit Apps**: 27
**Status**: Production Ready ✅
