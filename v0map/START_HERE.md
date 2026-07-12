# V24 Upgrade Added

- Realtime voice command mode + live dictation mode.
- Project Manager window with daily to-do checklist.
- Importable habit tracker and project board JSON files.
- Voice commands to add project room, habit board, task kanban, and voice router to the 3D city.
- Voice movement commands: move NPC left/right/forward/back, send NPC to project room, summon NPC and open its shortcode window.
- New WordPress REST routes and Next proxy routes for live voice options and project templates.

# 🎉 START HERE - Enhanced Virtual Gallery v2.0

## Welcome to Your Enhanced Virtual Gallery!

Your project has been successfully enhanced with **30 AI agents** and **27 Streamlit applications**. This guide will help you get started quickly.

---

## 🚀 Quick Start (3 Steps)

### 1️⃣ Navigate to Project
```bash
cd "/home/ubuntu/v0map-main 2"
```

### 2️⃣ Install & Run
```bash
pnpm install  # Only needed first time
pnpm dev
```

### 3️⃣ Open Browser
Visit: **http://localhost:3000**

**That's it!** Your enhanced gallery is now running with 30 AI agents! 🎊

---

## 📚 Documentation Guide

We've created comprehensive documentation for you. Here's what to read based on your needs:

### 🏃 **Just Want to Start?**
→ Read: **QUICKSTART.md** (5 minutes)
- Basic setup instructions
- Essential controls
- Quick customization tips

### 📖 **Want Full Details?**
→ Read: **ENHANCED_README.md** (15 minutes)
- Complete feature documentation
- Detailed customization guide
- Troubleshooting section
- All 30 agent profiles
- All 27 Streamlit app descriptions

### 🔄 **Want to Know What Changed?**
→ Read: **CHANGELOG.md** (5 minutes)
- All enhancements listed
- Before/after comparison
- Migration notes
- Version history

### 🚀 **Ready to Deploy?**
→ Read: **DEPLOYMENT_SUMMARY.md** (10 minutes)
- Deployment checklist
- Build status
- Configuration guide
- Next steps

### 📋 **Want a Quick Overview?**
→ Read: **PROJECT_FILES.txt** (2 minutes)
- File list
- Quick stats
- Essential commands

---

## 🎯 What You Got

### 30 AI Agents with Ready Player Me Avatars

**Business & Strategy**
- Agent CEO, Agent Social, Agent Mindset, Agent Blogger, Agent Grant

**Operations & Analytics**
- Agent Prayer AI, Agent Metrics, Agent Researcher, Agent Investor, Agent Newsroom

**Finance & Administration**
- Agent Invoice, Agent Appointments, Agent Pricing, Agent Customer, Agent SuperChat

**Technology & Automation**
- Agent Caller, Agent Content, Agent Activator, Agent AdView, Agent Logger

**Marketing & Growth**
- Agent AutoSocial, Agent BizPlan, Agent BookBuddy, Agent Calendar, Agent GrantTracker

**Productivity & Tools**
- Agent Habit, Agent DriveView, Agent Outreach, Agent ImageGPT, Agent Inbox

### 27 Streamlit Applications (Port 8501)

**North Wall**: Invoices, Appointments, Pricing, Customers, Super Chat

**East Wall**: AI Caller, Content Dashboard, Activate Agents, Ad View, Agent Log, AutoSocial, Bizplan

**South Wall**: BookBuddy, Calendar, Grant Tracker, Habit Tracker, Drive View, Email Outreach, ImageGPT

**West Wall**: Inbox Agent, LinkedIn Checklist, LinkedIn Systems, Live HTML, Project Management, Social Checklist, Cost Tracker, Trader

---

## 🎮 Essential Controls

### Movement
- **WASD** or **Arrow Keys**: Move around
- **Mouse**: Look around (click canvas first)
- **F**: Toggle flying mode
- **Space**: Fly up (when flying)
- **Shift**: Fly down (when flying)

### Interaction
- **Click on Walls**: Open Streamlit apps
- **Click on NPCs**: Talk to AI agents
- **M**: Open Streamlit menu
- **C**: Open NPC controls
- **ESC**: Close menus

---

## 🔧 Quick Customization

### Change Avatar URLs
1. Open: `components/ready-player-me-config.ts`
2. Replace avatar URLs with your own Ready Player Me URLs
3. Save and restart dev server

### Change Streamlit URLs
1. Open: `components/virtual-gallery.tsx`
2. Find `GALLERY_ITEMS` array
3. Update `streamlitUrl` values
4. Save and restart dev server

### Modify NPC Behavior
1. Open: `components/virtual-gallery.tsx`
2. Find `DEFAULT_NPC_DATA` array
3. Adjust `speed`, `dialogue`, or other properties
4. Save and restart dev server

---

## ✅ What's Preserved

**All original features are working perfectly:**

✅ Pointer lock controls
✅ WASD/Arrow movement
✅ Flying mode
✅ Meeting mode (gather all agents)
✅ Table assignments
✅ NPC activation controls
✅ Collision detection
✅ Mini map
✅ Debug overlay
✅ Gamepad support
✅ Mobile touch controls
✅ Dynamic lighting
✅ Animations

---

## 📁 Project Structure

```
v0map-main 2/
├── 📄 START_HERE.md ⭐ (This file - Start here!)
├── 📄 QUICKSTART.md (Quick setup guide)
├── 📄 ENHANCED_README.md (Full documentation)
├── 📄 CHANGELOG.md (What changed)
├── 📄 DEPLOYMENT_SUMMARY.md (Deployment guide)
├── 📄 PROJECT_FILES.txt (File overview)
│
├── app/
│   ├── layout.tsx
│   └── page.tsx ✨ (Updated - SSR fix)
│
├── components/
│   ├── virtual-gallery.tsx ✨ (Enhanced - 30 NPCs)
│   ├── virtual-gallery-enhanced.tsx ✨ (Enhanced version)
│   ├── virtual-gallery-original-backup.tsx ✨ (Original backup)
│   ├── ready-player-me-config.ts ✨ (NEW - Avatars)
│   ├── npc.tsx (Original)
│   ├── gallery.tsx (Original)
│   └── ... (All other components)
│
├── hooks/
│   └── use-movement.ts (Original)
│
└── ... (Other files)
```

---

## 🎨 Features Showcase

### 🤖 30 AI Agents
Each agent has:
- Unique Ready Player Me 3D avatar
- Distinct personality and role
- Interactive dialogue system
- Voice agent clone ID
- Custom walking pattern
- Assigned workstation

### 🖼️ 27 Streamlit Apps
All apps are:
- Integrated on gallery walls
- Accessible via click or menu
- Running on port 8501
- Fully interactive
- Organized by category

### 🎮 Advanced Controls
- First-person movement
- Flying mode for exploration
- NPC management panel
- Mini map navigation
- Debug information
- Gamepad support
- Mobile touch controls

---

## 🐛 Troubleshooting

### NPCs Not Appearing?
```bash
# Check browser console for errors
# Verify internet connection (for Ready Player Me)
# Try refreshing the page
```

### Streamlit Apps Not Loading?
```bash
# Ensure apps run on port 8501
# Check if apps are accessible
# Verify CORS settings
```

### Build Errors?
```bash
cd "/home/ubuntu/v0map-main 2"
rm -rf .next
pnpm build
```

### Performance Issues?
- Press **C** to open NPC controls
- Deactivate some agents
- Close unused Streamlit apps
- Reduce window size

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Total AI Agents** | 30 |
| **Streamlit Applications** | 27 |
| **Room Size** | 100x100 units |
| **Table Positions** | 30 |
| **Avatar System** | Ready Player Me |
| **Streamlit Port** | 8501 |
| **Documentation Files** | 6 |
| **Build Status** | ✅ Successful |
| **Production Ready** | ✅ Yes |

---

## 🎯 Next Steps

### Immediate
1. ✅ Run `pnpm dev` to start the gallery
2. ✅ Explore and interact with all 30 agents
3. ✅ Click on walls to open Streamlit apps
4. ✅ Try flying mode (Press F)
5. ✅ Test NPC controls (Press C)

### Optional
- 🎨 Customize avatar URLs
- 🔧 Modify NPC behaviors
- 📱 Add more Streamlit apps
- 🎮 Adjust room layout
- 🌈 Change colors and themes

### Advanced
- 🚀 Deploy to production
- 🌐 Set up custom domain
- 📊 Add analytics
- 🔒 Implement authentication
- 🤝 Enable multiplayer

---

## 💡 Pro Tips

### Tip 1: Flying Mode
Press **F** to enable flying mode, then use **Space** and **Shift** to fly up and down. Great for getting an overview of the gallery!

### Tip 2: NPC Controls
Press **C** to open the NPC control panel. You can activate/deactivate individual agents, start meetings, or send everyone to tables.

### Tip 3: Quick Menu
Press **M** to quickly access all Streamlit applications without walking to the walls.

### Tip 4: Debug Info
The debug overlay (bottom-left) shows your FPS, position, and rotation. Useful for performance monitoring and navigation.

### Tip 5: Gamepad Support
Connect an Xbox or PlayStation controller for a more immersive experience. All controls are mapped automatically!

---

## 🆘 Need Help?

### Documentation
1. **QUICKSTART.md** - Basic setup and controls
2. **ENHANCED_README.md** - Complete documentation
3. **CHANGELOG.md** - What changed
4. **DEPLOYMENT_SUMMARY.md** - Deployment guide

### Code Reference
- **components/virtual-gallery.tsx** - Main component
- **components/ready-player-me-config.ts** - Avatar config
- **components/npc.tsx** - NPC implementation
- **app/page.tsx** - Entry point

### Browser Console
Press **F12** to open browser console and check for errors or warnings.

---

## 🎉 You're All Set!

Your enhanced virtual gallery is ready to go! Here's what to do now:

### Step 1: Start the Gallery
```bash
cd "/home/ubuntu/v0map-main 2"
pnpm dev
```

### Step 2: Open Your Browser
Visit: **http://localhost:3000**

### Step 3: Explore!
- Walk around and meet all 30 AI agents
- Click on walls to access Streamlit apps
- Try flying mode for a bird's eye view
- Experiment with NPC controls

---

## 📞 Quick Reference

| Action | Command/Key |
|--------|-------------|
| **Start Dev Server** | `pnpm dev` |
| **Build for Production** | `pnpm build` |
| **Move** | WASD / Arrows |
| **Look** | Mouse |
| **Flying Mode** | F |
| **Fly Up** | Space |
| **Fly Down** | Shift |
| **Streamlit Menu** | M |
| **NPC Controls** | C |
| **Close Menus** | ESC |

---

## 🌟 Highlights

✨ **30 AI Agents** - Triple the original count
✨ **27 Streamlit Apps** - All your tools in one place
✨ **Ready Player Me** - Professional 3D avatars
✨ **100% Compatible** - All original features preserved
✨ **Production Ready** - Built and tested
✨ **Fully Documented** - Comprehensive guides included

---

## 🎊 Enjoy Your Enhanced Virtual Gallery!

You now have a fully functional 3D virtual gallery with 30 AI agents and 27 Streamlit applications. Explore, customize, and make it your own!

**Questions?** Check the documentation files listed above.

**Ready to start?** Run `pnpm dev` and visit http://localhost:3000

**Happy exploring!** 🚀

---

**Version**: 2.0.0 Enhanced Edition
**Date**: January 29, 2026
**Status**: ✅ Production Ready
**Build**: ✅ Successful
**Documentation**: ✅ Complete

🎉 **Welcome to the Future of Virtual Galleries!** 🎉


## V21 Stable WordPress Media Key Fix
- Fixed duplicate React keys like `wp-media-undefined`.
- Added stable fallback keys for WordPress media/pages/posts/menus/plugins/comments.
- Hardened `/api/wp/suite` and `/api/wp/features` payloads.
- Plugin v1.17.0 now returns stable media IDs and aliases.

## V23 Voice City NPC Builder Quick Commands

After starting the app, open the City Voice Commands tab in the top-right. Try:

- `create NPC named Revenue Coach`
- `create NPC named Mission Guide with shortcode aisc_missions`
- `NPC 1 come here`
- `import team 25`
- `add AI tower`
- `add Yuka path node`
- `Brand GPT`

New local test scripts:

```bash
pnpm run wp:voice-commands
pnpm run wp:team-presets
pnpm run team:25
pnpm run team:50
pnpm run team:100
```
