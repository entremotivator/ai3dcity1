# V24 Upgrade Added

- Realtime voice command mode + live dictation mode.
- Project Manager window with daily to-do checklist.
- Importable habit tracker and project board JSON files.
- Voice commands to add project room, habit board, task kanban, and voice router to the 3D city.
- Voice movement commands: move NPC left/right/forward/back, send NPC to project room, summon NPC and open its shortcode window.
- New WordPress REST routes and Next proxy routes for live voice options and project templates.

# Changelog

## v22 - Voice NPC Window Control Upgrade

- Added next/previous/X close controls to the live shortcode window.
- Added widescreen mode for shortcode iframes.
- Added shortcode menu items below the main live WordPress iframe.
- Added floating realtime voice agent blob.
- Added voice commands for Brand GPT, next window, close window, widescreen, NPC come here, dance all, and WordPress API refresh.
- Added safe local command route for whitelisted pnpm WordPress diagnostics.
- Added NPC summon and dance actions.
- Added complex building details: command atrium, skybridges, server racks, glowing API core details.

# Changelog - Enhanced Virtual Gallery

## Version 2.0.0 - Enhanced Edition (January 2026)

### 🎉 Major Enhancements

#### 30 AI Agents System
- **ADDED**: 20 new AI agents (expanded from 10 to 30 total agents)
- **ADDED**: Ready Player Me avatar integration for all 30 agents
- **ADDED**: Unique voice agent clone IDs for each character
- **ADDED**: Personality system with distinct character traits
- **ADDED**: Multiple walking patterns (random, patrol, circular, zigzag)
- **ADDED**: Enhanced NPC positioning system for larger room
- **ADDED**: 30 unique table positions for workstation mode
- **IMPROVED**: NPC dialogue system with more variety
- **IMPROVED**: Agent interaction radius and detection

#### Streamlit Integration
- **ADDED**: 17 new Streamlit applications (expanded from 10 to 27 total)
- **UPDATED**: All Streamlit URLs to use port 8501 (changed from 8502)
- **ADDED**: Invoices application
- **ADDED**: Appointments management system
- **ADDED**: Pricing strategy tool
- **ADDED**: Customers CRM
- **ADDED**: Super Chat communication hub
- **ADDED**: AI Caller voice system
- **ADDED**: Content Management Dashboard
- **ADDED**: Activate Agents control panel
- **ADDED**: Ad View analytics
- **ADDED**: Agent Log tracking
- **ADDED**: AutoSocial automation
- **ADDED**: Bizplan business planning
- **ADDED**: BookBuddy reading companion
- **ADDED**: Calendar scheduling
- **ADDED**: Grant Tracker monitoring
- **ADDED**: Habit Tracker for routines
- **ADDED**: Drive View file management
- **ADDED**: Email Outreach campaigns
- **ADDED**: ImageGPT visual creation
- **ADDED**: Inbox Agent email management
- **ADDED**: LinkedIn Checklist optimization
- **ADDED**: LinkedIn Systems automation
- **ADDED**: Live HTML editor
- **ADDED**: Project Management 2.0
- **ADDED**: Social Checklist tasks
- **ADDED**: Cost Tracker management
- **ADDED**: Trader investment tools

#### Gallery & Environment
- **EXPANDED**: Room size from 60x60 to 100x100 units
- **ADDED**: 30 table positions distributed around the room
- **IMPROVED**: Wall positioning for better Streamlit display
- **ENHANCED**: Lighting system for larger space
- **OPTIMIZED**: Collision detection for expanded area

#### Configuration & Setup
- **ADDED**: `ready-player-me-config.ts` for avatar management
- **ADDED**: `npc-config-30.ts` for NPC configuration
- **ADDED**: `ENHANCED_README.md` comprehensive documentation
- **ADDED**: `QUICKSTART.md` for quick setup
- **ADDED**: `CHANGELOG.md` version tracking
- **CREATED**: Backup of original `virtual-gallery.tsx`
- **UPDATED**: `app/page.tsx` with dynamic imports for SSR compatibility

#### Performance & Optimization
- **IMPROVED**: Build process with proper SSR handling
- **ADDED**: Loading screen for gallery initialization
- **OPTIMIZED**: Avatar loading with fallback system
- **ENHANCED**: Model preloading for 30 agents
- **IMPROVED**: Memory management for larger NPC count

### 🔧 Technical Improvements

#### Code Structure
- **REFACTORED**: NPC data structure for better scalability
- **IMPROVED**: Type definitions for Ready Player Me avatars
- **ENHANCED**: Configuration management
- **ADDED**: Comprehensive inline documentation
- **IMPROVED**: Code organization and modularity

#### Build System
- **FIXED**: Server-side rendering issues with Three.js
- **ADDED**: Dynamic import with SSR disabled
- **IMPROVED**: Build optimization for production
- **ENHANCED**: Loading states and error handling

### 🎨 UI/UX Enhancements

#### Visual Improvements
- **ADDED**: Loading screen with agent count display
- **IMPROVED**: NPC name labels visibility
- **ENHANCED**: Streamlit iframe presentation
- **ADDED**: Instructions panel with 30 agents indicator

#### Control Enhancements
- **MAINTAINED**: All original keyboard controls
- **MAINTAINED**: All original gamepad support
- **MAINTAINED**: All original mobile controls
- **MAINTAINED**: Flying mode functionality
- **MAINTAINED**: Meeting mode functionality
- **MAINTAINED**: Table assignment mode

### 📚 Documentation

#### New Documentation
- **ADDED**: `ENHANCED_README.md` - Comprehensive guide
- **ADDED**: `QUICKSTART.md` - Quick start guide
- **ADDED**: `CHANGELOG.md` - Version history
- **ADDED**: Inline code comments throughout
- **ADDED**: Configuration examples
- **ADDED**: Troubleshooting guide
- **ADDED**: Customization instructions

#### Documentation Improvements
- **ENHANCED**: Agent profile descriptions
- **ADDED**: Streamlit application catalog
- **ADDED**: Control reference guide
- **ADDED**: Customization examples
- **ADDED**: Performance optimization tips

### 🐛 Bug Fixes

#### Build & Deployment
- **FIXED**: SSR compatibility issues with Three.js
- **FIXED**: Dynamic import configuration
- **FIXED**: Build process for production

#### Functionality
- **MAINTAINED**: All original features working
- **ENSURED**: Backward compatibility
- **PRESERVED**: Original NPC behavior
- **KEPT**: All existing controls and interactions

### 🔄 Migration Notes

#### From Version 1.0 to 2.0

**What's Preserved:**
- ✅ All original 10 NPCs (now with Ready Player Me avatars)
- ✅ All original controls and interactions
- ✅ Flying mode functionality
- ✅ Meeting mode functionality
- ✅ Table assignment mode
- ✅ Gamepad support
- ✅ Mobile support
- ✅ Debug overlay
- ✅ Mini map
- ✅ Collision detection
- ✅ Animation system

**What's New:**
- ✅ 20 additional NPCs (total 30)
- ✅ Ready Player Me avatars for all agents
- ✅ 17 additional Streamlit apps (total 27)
- ✅ All Streamlit URLs updated to port 8501
- ✅ Expanded room size
- ✅ Enhanced documentation

**What Changed:**
- 🔄 Streamlit port changed from 8502 to 8501
- 🔄 Room size increased from 60x60 to 100x100
- 🔄 NPC count increased from 10 to 30
- 🔄 Avatar system changed to Ready Player Me

### 📊 Statistics

#### Before (v1.0)
- NPCs: 10
- Streamlit Apps: 10
- Room Size: 60x60 units
- Table Positions: 10
- Avatar System: Basic GLB models
- Documentation: Basic README

#### After (v2.0)
- NPCs: **30** (+200%)
- Streamlit Apps: **27** (+170%)
- Room Size: **100x100** units (+67%)
- Table Positions: **30** (+200%)
- Avatar System: **Ready Player Me** (Professional)
- Documentation: **Comprehensive** (4 files)

### 🎯 Future Roadmap

#### Planned Features (v2.1)
- [ ] Custom avatar upload interface
- [ ] Real-time voice chat with agents
- [ ] Advanced AI dialogue system
- [ ] Multi-room gallery expansion
- [ ] Collaborative multiplayer mode

#### Under Consideration
- [ ] VR/AR support
- [ ] Advanced physics simulation
- [ ] Weather and time-of-day cycles
- [ ] Custom NPC behavior scripting
- [ ] Integration with more external services

### 🙏 Acknowledgments

- Original v0map project team
- Ready Player Me for avatar technology
- Three.js community
- Next.js team
- Streamlit developers
- All contributors and testers

---

## Version 1.0.0 - Original Release

### Initial Features
- 10 AI agents with basic avatars
- 10 Streamlit applications
- 3D virtual gallery environment
- Pointer lock controls
- Movement and collision detection
- Flying mode
- Meeting mode
- Table assignments
- Mobile support
- Gamepad support
- Debug overlay
- Mini map

---

**Current Version**: 2.0.0 Enhanced
**Release Date**: January 29, 2026
**Status**: Production Ready ✅
**Build**: Successful ✅
**Tests**: Passed ✅

## V18 — WordPress API Feature Suite Plus

- Added `/api/wp/suite` and `/api/wp/api-map` Next.js proxy routes.
- Added `/wp-json/v0map-npc/v1/feature-suite` and `/wp-json/v0map-npc/v1/api-map` WordPress routes.
- Expanded live API panel with active plugins, API routes, theme supports, provider groups, menus, custom content, and recent comments.
- Kept `[bsp_app]` pinned as Brand GPT and kept real styled WordPress iframe render mode.
- Kept one active shortcode window at a time.


## V19 — WordPress API Feature Suite Plus Ultra

- Added `/api/wp/diagnostics`, `/api/wp/command-center`, `/api/wp/search`, and `/api/wp/render-url` Next.js routes.
- Added WordPress plugin REST routes for diagnostics, command center, search, and styled render URL validation.
- Added readiness scoring, missing shortcode checks, duplicate shortcode checks, repair hints, and iframe/header diagnostics.
- Added richer in-world WordPress panel cards for diagnostics, pinned Brand GPT, and repair hints.
- Keeps `[bsp_app]` pinned and loaded as a real styled WordPress iframe page.
- Keeps live shortcode windows one-at-a-time and avoids `srcDoc` for plugin shortcodes.
- Added `pnpm run wp:diagnostics`, `pnpm run wp:command`, `pnpm run wp:search`, and `pnpm run wp:render-url`.


## V21 Stable WordPress Media Key Fix
- Fixed duplicate React keys like `wp-media-undefined`.
- Added stable fallback keys for WordPress media/pages/posts/menus/plugins/comments.
- Hardened `/api/wp/suite` and `/api/wp/features` payloads.
- Plugin v1.17.0 now returns stable media IDs and aliases.

## v23 — Voice City NPC Builder

- Added voice-only NPC creation commands.
- Added importable NPC team presets for 25, 50, and 100 NPCs.
- Added closable City Voice Commands tab.
- Added runtime 3D city feature creation with voice and button controls.
- Added AI tower, command pod, voice stage, API core, skybridge, and Yuka-style path node builders.
- Added more complex OfficeBuilding geometry: voice decks, path network, and hologram billboards.
- Added WordPress REST routes for voice-command metadata and team presets.
- Added Next API proxy routes for voice-command and team-preset sync.
- Fixed duplicate gather command declaration in the gallery handler.
- Preserved one-active-shortcode-window behavior and real styled WordPress iframe rendering.

## V25 — Voice City Command Center

- Added command schema/parser APIs.
- Added WordPress voice command suite, project manager suite, and NPC movement playbook endpoints.
- Added project board export, voice history, auto-open toggle, and more city feature commands.
- Added advanced importable templates for 30-day project sprint, advanced habit tracker, voice command center, and NPC movement playbook.
