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

**Odyssey** transforms event planning from chaotic message threads and cross-platform hell into organized, collaborative experiences. Whether you're planning a gaming tournament at a friend's house, weekend trip to Malibu, study session at a cafe, or potluck dinner with club members, Odyssey consolidates all your events by combining the conversational power of Discord with intelligent automation and a sleek web interface.

### Why Odyssey?

- **Natural Language First** – Create events by chatting: `@Odyssey potluck at my place this Saturday from 6 to 8 PM`
- **Cross-Server Dashboard** – View all your events from every Discord server in one unified web app
- **Modular & Flexible** – Enable only the features you need: packing lists, group tasks, transportation coordination, budget management, weather alerts, etc.
- **Public & Private Events** – Fine-grained access control with role and user-based permissions
- **Real-Time Sync** – Supabase-powered live updates across Discord and web
- **AI-Powered** – Smart date parsing, poll creation, and time optimization using Azure OpenAI + LangChain
---

## ✨ Features

### Event Management

<img src="odyssey-readme-screenshots/odyssey-event-page-1.png" alt="Event Detail Page" width="700">

- **Natural Language Creation** – Mention `@Odyssey` with event or poll details and AI extracts everything you need
- **Slash Command Support** – `/create-event` or `/create-poll` if you prefer the discord command flow
- **Multi-Day Events** – Full support for trips, retreats, and various extended activities
- **Pre-Made Event Types & Defaults** – Social, Trip, Meeting, Sports, Food, Gaming, etc.
- **Visibility Control** – Public (server-wide) or Private (custom role/user-based access)

### Discord Bot Commands

<img src="odyssey-readme-screenshots/odyssey-bot-create-event-confirmation-embed.png" alt="Bot Event Creation" width="600">

**Natural Language Event Creation:**
- Mention `@Odyssey` or use `/create-event` with event details
- AI extracts date, time, location, description
- Confirmation embed with editable fields and privacy toggle
- Module selection during creation

<img src="odyssey-readme-screenshots/odyssey-bot-select-modules-embed.png" alt="Module Selection" width="600">

**Member Management:**

<img src="odyssey-readme-screenshots/odyssey-bot-add-member.png" alt="Add Member" width="600">

- Add members with role selection (Organizer, Co-Host, Member, Viewer)
- Edit member roles and RSVP status
- Organizer transfer with confirmation flow

<img src="odyssey-readme-screenshots/odyssey-bot-promote-and-transfer-organizer.png" alt="Transfer Organizer" width="600">

**Available Commands:**
- `/create-event` – AI-powered event creation
- `/edit-event-modules` – Enable/disable event features
- `/manage-members` – Add/edit/remove event members
- `/rsvp` – Join event
- `/leave-event` – Leave event
- `/create-poll` – AI-powered poll creation (discord embed-based and web grid-based)
- `/find-best-times` – AI-powered optimal time finder for availability (web) polls

### Modular Dashboard

Every event can enable/disable features based on needs:

<details>
<summary><b>📅 Schedule Timeline</b></summary>

<img src="odyssey-readme-screenshots/schedule-of-events-closeup.png" alt="Schedule Timeline" width="600">

- Start/end times for each activity
- Chronologically ordered timeline with overlap constraints

</details>

<details>
<summary><b>👥 Attendees Module</b></summary>

<img src="odyssey-readme-screenshots/attendees-closeup.png" alt="Attendees Module" width="600">

- Role-based membership: Organizer, Co-Host, Member, Viewer
- RSVP tracking (Yes/Maybe)
- RSVP No || Removing someone (Public Event) = leaving/being removed from event and becoming a viewer 
- RSVP No || Removing someone (Private Event) = leaving/being removed from event and losing access to join
- Add members with conditional role permissions
- Transfer organizer privileges with warnings

</details>

<details>
<summary><b>📦 Group Dashboard</b></summary>

<img src="odyssey-readme-screenshots/group-packing-items-closeup.png" alt="Group Packing List" width="600">
<img src="odyssey-readme-screenshots/group-tasks-closeup.png" alt="Group Tasks" width="600">

**Shared Packing List:**
- Assign items to specific members
- Quantity tracking
- Pending indicator (items created by regular members need to be approved)
- Checkbox to mark items as packed

**Tasks Management:**
- Assign tasks to specific members
- Priority levels (Low/Medium/High)
- Due dates
- Checkbox to mark tasks as completed

</details>

<details>
<summary><b>🎒 Individual Packing Lists</b></summary>

<img src="odyssey-readme-screenshots/indiv-packing-list-closeup.png" alt="Individual Packing" width="600">

- Private packing lists for each attendee
- Quantity tracking
- Progress bar
- Fully isolated from group lists

</details>

<details>
<summary><b>🚗 Transportation Module</b></summary>

<img src="odyssey-readme-screenshots/transportation-closeup.png" alt="Transportation" width="600">

- Register as driver (with available seats)
- Request rides / Join a car
- Pickup / Arrival locations and time coordination
- Addresses, vehicle descriptions, etc.

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
- Automatic alerts for bad weather

</details>

### Advanced Polling System

<img src="odyssey-readme-screenshots/odyssey-web-poll-normal-view.png" alt="Web Poll Grid View" width="600">

- **Embed Polls** – Quick yes/no or single-choice polls in Discord
- **Web Polls** – Drag and select availability grids for complex scheduling
- **AI Poll Creation** – `@Odyssey when can people meet next week for 2 hours?`
- **Anonymous Voting** – Hide results until you vote
- **Find Best Times** – AI analyzes poll responses and suggests optimal meeting times with scoring algorithm

<img src="odyssey-readme-screenshots/odyssey-web-poll-detail-view.png" alt="Poll Detail View" width="600">

**Poll Features:**
- Automatic result display in Discord through embed after poll deadline
- Participant availability tracking for each 1-hour time slot

<img src="odyssey-readme-screenshots/odyssey-web-poll-confirmation.png" alt="Poll Confirmation" width="600">

### Permissions & Roles

- **Organizer** – Full control, can transfer role to co-host or member
- **Co-Host** – Manage members, edit all modules (cannot delete event)
- **Member** – View, RSVP, contribute to group packing list
- **Viewer** – Read-only access for public and private events

### Cross-Server Features

<img src="odyssey-readme-screenshots/odyssey-home-light.png" alt="Dashboard Light Mode" width="700">

- **Unified Dashboard** – See events from all your Discord servers
- **Server Filtering** – Filter by server and status (server names / events you're a member in vs. can join)
- **Status Badges** – Visual indicators for event membership or lack of
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
   - User: `/create-event beach party next Saturday at 3pm`
   - Bot → Same AI pipeline but short circuit tool selection → Confirm → Store
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
│   │   │   ├── agents/         # LangChain AI agent workflows
│   │   │   │   └── tools/      # Custom LangChain tools
│   │   │   ├── commands/       # Slash command handlers
│   │   │   ├── handlers/       # Event/interaction handlers
│   │   │   ├── lib/            # Core libraries (Supabase client, etc.)
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   ├── utils/          # Helper utilities
│   │   │   └── index.ts        # Bot entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                    # Web dashboard (Next.js)
│   │   ├── public/             # Static assets
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router
│   │   │   │   ├── page.tsx           # Dashboard homepage
│   │   │   │   ├── event/[id]/        # Event detail pages
│   │   │   │   ├── auth/              # Authentication pages
│   │   │   │   └── api/               # API routes
│   │   │   ├── components/     # React components
│   │   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   ├── poll/              # Poll-specific components
│   │   │   │   ├── providers/         # Context providers
│   │   │   │   ├── EventHeader.tsx
│   │   │   │   ├── EventsDashboard.tsx
│   │   │   │   ├── EventsGrid.tsx
│   │   │   │   ├── ScheduleTimeline.tsx
│   │   │   │   ├── AttendeesModule.tsx
│   │   │   │   ├── GroupDashboard.tsx
│   │   │   │   ├── IndividualPackingList.tsx
│   │   │   │   ├── TransportationModule.tsx
│   │   │   │   ├── BudgetModule.tsx
│   │   │   │   └── WeatherForecast.tsx
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities (Supabase, event utils, etc.)
│   │   │   └── middleware.ts   # Next.js middleware
│   │   ├── .gitignore
│   │   ├── components.json
│   │   ├── eslint.config.mjs
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   └── shared/                 # Shared TypeScript types
│       ├── src/
│       │   └── types/
│       │       └── database.ts # Supabase type definitions
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── tsconfig.tsbuildinfo
│
├── odyssey-readme-screenshots/ # README assets
├── LICENSE                     # MIT License
├── .gitignore                  # Git ignore rules
├── package.json                # Root package.json
├── pnpm-lock.yaml              # Dependency lock file
├── pnpm-workspace.yaml         # Monorepo configuration
└── README.md                   # This README
```

---

## 📊 Current Status & Roadmap

### Completed Features

- [x] Natural language event creation with AI parsing
- [x] Slash command event creation
- [x] Multi-day event support with start/end times
- [x] Public/Private event visibility with access control
- [x] Modular dashboard (enable/disable features per event)
- [x] Schedule timeline
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

### Remaining MVP Tasks

- [ ] Attendees module bug fixes (private event access edge cases)
- [ ] Connect Transportation Module to backend
- [ ] Connect Weather Module to backend
- [ ] Connect Budget Module to backend
- [ ] Clean up bot embed flow
- [ ] Enable users to view their web polls through dashboard
- [ ] Finish fundamental web features and ensure consistency across bot and web options + actions
- [ ] Test realtime subscriptions for all modules
- [ ] Comprehensive prod testing with multiple servers & users
- [ ] Deploy web app on Vercel and host Discord Bot on Railway (supabase for DB)


### Future Features

- [ ] Automated reminders (event, packing, polls)
- [ ] Calendar export (.ics for Google/Apple Calendar)
- [ ] Discord native event sync
- [ ] RAG-based Q&A (`@Odyssey who's bringing the tent?`)
- [ ] Message digestion (`/digest-plan` to extract decisions from chat)
- [ ] AI event summaries
- [ ] Anonymous poll mode
- [ ] Create mobile app and pair with iMessage / SMS
---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Discord communities**

[⬆ Back to Top](#odyssey)

</div>
