# Odyssey

<div align="center">

**The intelligent event management platform for Discord communities.**

<img src="odyssey-readme-screenshots/odyssey-home-dark.png" alt="Odyssey Dashboard" width="800">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js_v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/Azure_OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)

**Coordinate group events across your Discord servers with AI-powered natural language commands and a beautiful web dashboard.**

[Features](#-features) • [Screenshots](#-screenshots) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Roadmap](#-current-status--roadmap)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Current Status & Roadmap](#-current-status--roadmap)
- [License](#-license)

---

## 🎯 Overview

**Odyssey** transforms Discord event planning from chaotic message threads into organized, collaborative experiences. Whether you're planning a gaming tournament, weekend trip, study session, or potluck dinner, Odyssey combines the conversational power of Discord with intelligent automation and a sleek web interface.

### Why Odyssey?

- **🤖 Natural Language First** – Create events by chatting: `@Odyssey potluck at my place this Saturday from 6 to 8 PM`
- **🌐 Cross-Server Dashboard** – View all your events from every Discord server in one unified web app
- **🧩 Modular & Flexible** – Enable only the features you need: packing lists, polls, transportation, budgets, weather
- **🔒 Public & Private Events** – Fine-grained access control with role-based permissions
- **⚡ Real-Time Sync** – Supabase-powered live updates across Discord and web
- **🧠 AI-Powered** – Smart date parsing, poll creation, and time optimization using Azure OpenAI + LangChain

---

## ✨ Features

### 🎪 Event Management

<img src="odyssey-readme-screenshots/odyssey-event-page-1.png" alt="Event Detail Page" width="700">

- **Natural Language Creation** – Mention `@Odyssey` with event details and AI extracts everything you need
- **Slash Command Support** – Traditional `/create-event` for structured input
- **Multi-Day Events** – Full support for trips, conferences, and extended activities
- **Event Types** – Social, Trip, Meeting, Sports, Food, Gaming, and more
- **Visibility Control** – Public (server-wide) or Private (invite-only) with role/user-based access

### 🤖 Discord Bot Commands

<img src="odyssey-readme-screenshots/odyssey-bot-create-event-confirmation-embed.png" alt="Bot Event Creation" width="600">

**Natural Language Event Creation:**
- Mention `@Odyssey` with event details
- AI extracts date, time, location, and description
- Confirmation embed with editable fields
- Module selection during creation

<img src="odyssey-readme-screenshots/odyssey-bot-select-modules-embed.png" alt="Module Selection" width="600">

**Member Management:**

<img src="odyssey-readme-screenshots/odyssey-bot-add-member.png" alt="Add Member" width="600">

- Add members with role selection (Co-Host, Member, Viewer)
- Edit member roles and RSVP status
- Organizer transfer with confirmation flow

<img src="odyssey-readme-screenshots/odyssey-bot-promote-and-transfer-organizer.png" alt="Transfer Organizer" width="600">

**Available Commands:**
- `/create-event` – Structured event creation
- `/manage-members` – Add/edit/remove event members
- `/create-poll` – Create polls for scheduling or voting
- `/find-best-times` – AI-powered optimal meeting time finder
- `/edit-event-modules` – Enable/disable event features
- And more!

### 🎛️ Modular Dashboard

Every event can enable/disable features based on needs:

<details>
<summary><b>📅 Schedule Timeline</b></summary>

<img src="odyssey-readme-screenshots/schedule-of-events-closeup.png" alt="Schedule Timeline" width="600">

- Drag-and-drop itinerary builder
- Start/end times for each activity
- Real-time collaboration with live updates
- Sortable timeline with order persistence

</details>

<details>
<summary><b>👥 Attendees Module</b></summary>

<img src="odyssey-readme-screenshots/attendees-closeup.png" alt="Attendees Module" width="600">

- Role-based membership: Organizer, Co-Host, Member, Viewer
- RSVP tracking (Yes/Maybe/No)
- Add members with conditional role permissions
- Transfer organizer privileges with warnings
- Remove/demote members with automatic viewer conversion (public events)

</details>

<details>
<summary><b>📦 Group Dashboard</b></summary>

<img src="odyssey-readme-screenshots/group-packing-items-closeup.png" alt="Group Packing List" width="600">
<img src="odyssey-readme-screenshots/group-tasks-closeup.png" alt="Group Tasks" width="600">

**Shared Packing List:**
- Assign items to specific members
- Quantity tracking
- Checkbox to mark items as packed
- Real-time sync across devices

**Tasks Management:**
- Priority levels (Low/Medium/High)
- Due dates
- Assignment to team members
- Completion tracking with timestamps

</details>

<details>
<summary><b>🎒 Individual Packing Lists</b></summary>

<img src="odyssey-readme-screenshots/indiv-packing-list-closeup.png" alt="Individual Packing" width="600">

- Private packing lists for each attendee
- Quantity tracking
- Progress percentage
- Fully isolated from group lists

</details>

<details>
<summary><b>🚗 Transportation Module</b></summary>

<img src="odyssey-readme-screenshots/transportation-closeup.png" alt="Transportation" width="600">

- Register as driver (with available seats)
- Request rides
- Auto-matching algorithm
- Pickup location and time coordination
- Vehicle descriptions and notes

</details>

<details>
<summary><b>💰 Budget Tracker</b></summary>

<img src="odyssey-readme-screenshots/budget-tracker-closeup.png" alt="Budget Tracker" width="600">

- Track event expenses
- Split bills equally or custom amounts
- See who owes whom
- Multiple currency support
- Expense categories and descriptions

</details>

<details>
<summary><b>🌤️ Weather Forecast</b></summary>

<img src="odyssey-readme-screenshots/weather-closeup.png" alt="Weather Widget" width="600">

- Location-based weather for event dates
- Temperature and conditions
- Multi-day forecasts for trips
- Automatic alerts for bad weather (coming soon)

</details>

### 🗳️ Advanced Polling System

<img src="odyssey-readme-screenshots/odyssey-web-poll-normal-view.png" alt="Web Poll Grid View" width="600">

- **Embed Polls** – Quick yes/no or single-choice polls in Discord
- **Web Polls** – Timeful-style availability grids for complex scheduling
- **AI Poll Creation** – `@Odyssey when can people meet next week for 2 hours?`
- **Anonymous Voting** – Hide results until you vote
- **Find Best Times** – AI analyzes poll responses and suggests optimal meeting times with scoring

<img src="odyssey-readme-screenshots/odyssey-web-poll-detail-view.png" alt="Poll Detail View" width="600">

**Poll Features:**
- Grid-based time slot selection
- Participant availability tracking
- AI-powered best time recommendations
- Discord embed notifications with confirmation

<img src="odyssey-readme-screenshots/odyssey-web-poll-confirmation.png" alt="Poll Confirmation" width="600">

### 🔐 Permissions & Roles

- **Organizer** – Full control, can transfer role
- **Co-Host** – Manage members, edit all modules (except delete event)
- **Member** – View, RSVP, contribute to shared lists
- **Viewer** – Read-only access for private events

### 🌍 Cross-Server Features

<img src="odyssey-readme-screenshots/odyssey-home-light.png" alt="Dashboard Light Mode" width="700">

- **Unified Dashboard** – See events from all your Discord servers
- **Server Filtering** – Filter by server and status (attending/organizing/viewing)
- **Status Badges** – Visual indicators for your role in each event
- **Dark/Light Mode** – Beautiful themes with smooth transitions

---

## 📸 Screenshots

### Login & Authentication
<img src="odyssey-readme-screenshots/odyssey-login-page.png" alt="Login" width="700">

### Event Dashboard with Filters
<img src="odyssey-readme-screenshots/odyssey-status-filter.png" alt="Filters" width="700">

### Full Event View
<img src="odyssey-readme-screenshots/full-event-view.png" alt="Full Event View" width="700">

---

## 🛠️ Tech Stack

### Frontend (Web)
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **UI Components:** Radix UI primitives
- **State Management:** TanStack React Query
- **Realtime:** Supabase subscriptions
- **Auth:** Supabase Auth with Discord OAuth

### Backend (Bot)
- **Runtime:** Node.js + TypeScript
- **Bot Framework:** Discord.js v14
- **AI/ML:** Azure OpenAI GPT-4 + LangChain
- **Agent Framework:** LangChain for multi-step workflows
- **Date Parsing:** AI-powered entity extraction
- **Database:** Supabase (PostgreSQL)

### Database & Infrastructure
- **Database:** Supabase (PostgreSQL 15)
- **Realtime Engine:** Supabase Realtime (WebSockets)
- **Vector Search:** pgvector (for future RAG features)
- **Row Level Security:** Granular access control policies
- **Triggers:** Automated workflows (e.g., auto-create organizer role)

### Monorepo Structure
- **Package Manager:** pnpm with workspaces
- **Shared Types:** `@odyssey/shared` for type safety across bot and web

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Discord User                            │
└─────────┬───────────────────────────────────┬───────────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────────────┐           ┌──────────────────────┐
│   Discord Bot        │           │   Web Dashboard      │
│   (Discord.js)       │           │   (Next.js)          │
│                      │           │                      │
│  • Natural Language  │           │  • Event Management  │
│  • Slash Commands    │           │  • Real-time Updates │
│  • Event Creation    │◄─────────►│  • Discord OAuth     │
│  • Polls & Voting    │  Supabase │  • Cross-Server View │
│  • Member Mgmt       │           │  • All Modules       │
└──────────┬───────────┘           └──────────┬───────────┘
           │                                  │
           │         ┌────────────────────┐   │
           └────────►│  Supabase          │◄──┘
                     │  (PostgreSQL)      │
                     │                    │
                     │  • Events DB       │
                     │  • Realtime Sync   │
                     │  • Row Level Sec.  │
                     │  • Auth            │
                     └─────────┬──────────┘
                               │
                     ┌─────────▼──────────┐
                     │  Azure OpenAI      │
                     │  (via LangChain)   │
                     │                    │
                     │  • Intent Parsing  │
                     │  • Date Extraction │
                     │  • Poll Generation │
                     └────────────────────┘
```

### Data Flow

1. **Event Creation (Natural Language)**
   - User: `@Odyssey beach party next Saturday at 3pm`
   - Bot → Azure OpenAI → Extract entities → Confirm with user → Store in Supabase
   - Web dashboard updates in real-time via Supabase subscriptions

2. **Event Creation (Slash Command)**
   - User: `/create-event Beach Party | next Saturday at 3pm`
   - Bot → Same AI pipeline → Confirm → Store
   - Immediate sync to web

3. **Web Interaction**
   - User logs in via Discord OAuth → Fetch user's guilds
   - Query events from all guilds → Display with real-time updates
   - Any edit triggers Supabase update → Bot and other web clients receive instant updates

---

## 📁 Project Structure

```
odyssey-project/
├── packages/
│   ├── bot/                    # Discord bot (Node.js + Discord.js)
│   │   ├── src/
│   │   │   ├── commands/       # Slash command handlers
│   │   │   ├── handlers/       # Event/interaction handlers
│   │   │   ├── lib/
│   │   │   │   ├── agent/      # LangChain AI agents
│   │   │   │   ├── permissions.ts
│   │   │   │   └── supabase.ts
│   │   │   └── index.ts        # Bot entry point
│   │   └── package.json
│   │
│   ├── web/                    # Web dashboard (Next.js)
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router
│   │   │   │   ├── page.tsx           # Dashboard homepage
│   │   │   │   ├── event/[id]/        # Event detail pages
│   │   │   │   └── api/               # API routes
│   │   │   ├── components/     # React components
│   │   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   ├── EventHeader.tsx
│   │   │   │   ├── ScheduleTimeline.tsx
│   │   │   │   ├── AttendeesModule.tsx
│   │   │   │   ├── GroupDashboard.tsx
│   │   │   │   ├── IndividualPackingList.tsx
│   │   │   │   ├── TransportationModule.tsx
│   │   │   │   ├── BudgetModule.tsx
│   │   │   │   └── WeatherForecast.tsx
│   │   │   └── lib/            # Utilities
│   │   └── package.json
│   │
│   └── shared/                 # Shared TypeScript types
│       ├── src/
│       │   └── types/
│       │       └── database.ts # Supabase type definitions
│       └── package.json
│
├── odyssey-readme-screenshots/ # README assets
├── dbSchema.sql                # Database schema
├── dbIndexes.sql               # Database indexes
├── dbTriggers.sql              # Database triggers
├── setup-*.sql                 # Module-specific RLS policies
├── odysseyV2.md                # Original design doc
├── roadmap.md                  # Implementation roadmap
├── ERROR_LOG.md                # Bug tracking log
├── package.json                # Root package.json
└── pnpm-workspace.yaml         # Monorepo configuration
```

---

## 📊 Current Status & Roadmap

### ✅ Completed Features

- [x] Natural language event creation with AI parsing
- [x] Slash command event creation
- [x] Multi-day event support with start/end times
- [x] Public/Private event visibility with access control
- [x] Modular dashboard (enable/disable features per event)
- [x] Schedule timeline with drag-and-drop
- [x] Group packing list and tasks
- [x] Individual packing lists
- [x] Transportation/carpool coordination
- [x] Budget tracking and expense splitting
- [x] Weather forecasts
- [x] Advanced polling system (embed + web grids)
- [x] AI-powered "Find Best Times" analysis
- [x] Role-based permissions (Organizer/Co-Host/Member/Viewer)
- [x] Member management with transfer organizer flow
- [x] Cross-server event dashboard
- [x] Real-time synchronization (Discord ↔ Web)
- [x] Discord OAuth authentication
- [x] Dark/Light mode
- [x] Server and status filtering

### 🚧 In Progress

- [ ] Attendees module bug fixes (private event access edge cases)
- [ ] Transportation module UI enhancements
- [ ] Weather module API integration improvements
- [ ] Budget module settlement algorithm refinement

### 🔮 Planned Features

- [ ] Automated reminders (event, packing, polls)
- [ ] Calendar export (.ics for Google/Apple Calendar)
- [ ] Discord native event sync
- [ ] RAG-based Q&A (`@Odyssey who's bringing the tent?`)
- [ ] Message digestion (`/digest-plan` to extract decisions from chat)
- [ ] AI event summaries
- [ ] Anonymous poll mode
- [ ] Poll reminder automation
- [ ] Mobile-optimized web app
- [ ] Photo album integration (Google Photos)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Discord communities**

[⬆ Back to Top](#odyssey)

</div>
