# 🚀 Quick Start Guide - Enhanced Virtual Gallery

## Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd "v0map-main 2"
pnpm install
```

### Step 2: Start Development Server
```bash
pnpm dev
```

The application will be available at: **http://localhost:3000**

### Step 3: Explore the Gallery!
- Click on the canvas to lock your pointer
- Use **WASD** or **Arrow Keys** to move around
- Use your **mouse** to look around
- Press **M** to open the Streamlit menu
- Press **C** to open NPC controls
- Press **F** to toggle flying mode

---

## 🎯 What's New in This Version

### 30 AI Agents
You now have **30 unique AI agents** walking around the gallery, each with:
- Ready Player Me 3D avatars
- Unique personalities and roles
- Interactive dialogue systems
- Voice agent clone capabilities
- Custom walking patterns

### 27 Streamlit Applications
All **27 Streamlit apps** are integrated on the gallery walls at **port 8501**:
- **North Wall**: Invoices, Appointments, Pricing, Customers, Super Chat
- **East Wall**: AI Caller, Content Dashboard, Activate Agents, Ad View, Agent Log, AutoSocial, Bizplan
- **South Wall**: BookBuddy, Calendar, Grant Tracker, Habit Tracker, Drive View, Email Outreach, ImageGPT
- **West Wall**: Inbox Agent, LinkedIn Checklist, LinkedIn Systems, Live HTML, Project Management, Social Checklist, Cost Tracker, Trader

---

## 🎮 Essential Controls

### Movement
- **W / ↑**: Move forward
- **S / ↓**: Move backward
- **A / ←**: Strafe left
- **D / →**: Strafe right
- **Mouse**: Look around

### Flying Mode
- **F**: Toggle flying mode
- **Space**: Fly up (when flying)
- **Shift**: Fly down (when flying)
- **R**: Reset to ground level

### Interaction
- **Click on walls**: Open Streamlit applications
- **Click on NPCs**: Interact with AI agents
- **M**: Toggle Streamlit menu
- **C**: Toggle NPC controls panel
- **ESC**: Close menus

### NPC Management
- **C**: Open NPC controls
- **Meeting Mode**: Gather all agents at center
- **Table Mode**: Send agents to workstations
- **Activate/Deactivate**: Toggle individual agents

---

## 📱 Mobile Support

The gallery works on mobile devices with:
- Touch joysticks for movement
- Tap to lock pointer
- Responsive UI

---

## 🎨 Customization

### Change Avatar URLs
Edit `components/ready-player-me-config.ts`:
```typescript
export const READY_PLAYER_ME_AVATARS: ReadyPlayerMeAvatar[] = [
  {
    id: "avatar_1",
    name: "Agent CEO",
    avatarUrl: "YOUR_READY_PLAYER_ME_URL_HERE.glb",
  },
  // ... more avatars
]
```

### Change Streamlit URLs
Edit `components/virtual-gallery.tsx`:
```typescript
const GALLERY_ITEMS = [
  {
    title: "Your App",
    description: "Your description",
    streamlitUrl: "https://entremotivator.com/npc-shortcode-windows/",
    position: { x: 0, y: 2, z: -29 },
    rotation: { x: 0, y: 0, z: 0 },
  },
]
```

### Modify NPC Behavior
Edit `components/virtual-gallery.tsx` in the `DEFAULT_NPC_DATA` array:
```typescript
{
  id: 1,
  name: "Agent Name",
  speed: 0.5, // Adjust movement speed
  rotationSpeed: 2.0, // Adjust rotation speed
  dialogue: ["Custom dialogue here"],
  // ... more properties
}
```

---

## 🔧 Troubleshooting

### NPCs Not Appearing
1. Check browser console for errors
2. Ensure Ready Player Me URLs are valid
3. Try refreshing the page

### Streamlit Apps Not Loading
1. Verify all Streamlit apps are running on port 8501
2. Check CORS settings
3. Ensure apps are accessible at the specified URLs

### Performance Issues
1. Open NPC controls (press C)
2. Deactivate some agents
3. Close unused Streamlit apps
4. Lower browser window size

### Controls Not Working
1. Click on the canvas to lock pointer
2. Check if keyboard focus is on the canvas
3. Try pressing ESC and clicking again

---

## 📦 Building for Production

```bash
pnpm build
pnpm start
```

The production build will be optimized and ready to deploy.

---

## 🆘 Need Help?

1. Check the full `ENHANCED_README.md` for detailed documentation
2. Review the `components/virtual-gallery.tsx` code
3. Check browser console for error messages
4. Ensure all dependencies are installed

---

## ✨ Features Overview

✅ **30 AI Agents** with Ready Player Me avatars
✅ **27 Streamlit Applications** on gallery walls
✅ **Flying Mode** for easy navigation
✅ **NPC Controls** for agent management
✅ **Mini Map** for orientation
✅ **Debug Overlay** for performance monitoring
✅ **Gamepad Support** for controllers
✅ **Mobile Support** with touch controls
✅ **Meeting Mode** to gather all agents
✅ **Table Mode** for workstation assignments
✅ **Interactive Dialogues** with each agent
✅ **Voice Agent Clones** for each character
✅ **Dynamic Lighting** and shadows
✅ **Collision Detection** for realistic movement
✅ **Responsive Design** for all devices

---

## 🎉 Enjoy Your Enhanced Virtual Gallery!

Explore the gallery, interact with 30 AI agents, and access all your Streamlit applications in an immersive 3D environment!

**Pro Tip**: Press **F** to enable flying mode and explore from above! 🚁


## V19 Live API Checks

After installing the v19 WordPress plugin and adding your local `.env.local` values, run:

```bash
pnpm run wp:ping
pnpm run wp:diagnostics
pnpm run wp:command
pnpm run wp:render-url bsp_app
pnpm run wp:search aisc
```

Use `/api/wp/render-url?tag=bsp_app` when you need the real styled Brand GPT iframe URL. Use `/api/wp/diagnostics` to see missing shortcode handlers, duplicate shortcode assignments, and cookie/iframe readiness.
