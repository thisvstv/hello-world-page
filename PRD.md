# STRIDE — Product Requirements Document (PRD)

> **Document Version**: 2.0.0  
> **Status**: Active — Frontend Complete, Backend Pending  
> **Last Updated**: July 2025  
> **Author**: Product & Engineering  
> **Audience**: Engineering, Design, QA, Stakeholders, AI Agents

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target Users & Personas](#2-target-users--personas)
3. [Core Features](#3-core-features)
   - 3.1 [Daily Focused View (Kanban)](#31-daily-focused-view-kanban)
   - 3.2 [Chronos Timeline](#32-chronos-timeline)
   - 3.3 [Advanced Focus Timer](#33-advanced-focus-timer)
   - 3.4 [Task Management](#34-task-management)
   - 3.5 [Standalone Notes (Rich Text)](#35-standalone-notes-rich-text)
   - 3.6 [Command Palette](#36-command-palette)
   - 3.7 [Stealth Mode](#37-stealth-mode)
   - 3.8 [Collaboration & Notifications](#38-collaboration--notifications)
   - 3.9 [Audit Log (Activity Trail)](#39-audit-log-activity-trail)
   - 3.10 [Simple / Advanced View Modes](#310-simple--advanced-view-modes)
   - 3.11 [User Home (Command Center)](#311-user-home-command-center)
   - 3.12 [Analytics Dashboard](#312-analytics-dashboard)
   - 3.13 [Team Overview](#313-team-overview)
   - 3.14 [User Onboarding Tour](#314-user-onboarding-tour)
4. [Role-Based Access Control (RBAC)](#4-role-based-access-control-rbac)
5. [Business Logic & Constraints](#5-business-logic--constraints)
6. [Design Language](#6-design-language)
7. [Security & Sanitisation](#7-security--sanitisation)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Data & Persistence](#9-data--persistence)
10. [API Layer & Backend Readiness](#10-api-layer--backend-readiness)
11. [Success Metrics](#11-success-metrics)
12. [Roadmap & Milestones](#12-roadmap--milestones)

---

## 1. Product Vision

**STRIDE** is a high-performance, glassmorphic project management tool designed for individuals and small teams who demand focus, clarity, and visual elegance. It combines deep-work principles with intuitive visual timelines to help users **plan smarter and ship faster**.

### Problem Statement

Existing project management tools are either bloated with enterprise features that overwhelm solo developers, or too simplistic to handle real-world collaboration. There is no tool that balances **deep-work focus**, **visual task timelines**, and **team collaboration** in a premium, distraction-free interface.

### Solution

STRIDE provides:

- A **7-day rolling kanban board** that keeps users focused on the current week — not overwhelmed by backlogs — with automatic rollover of incomplete tasks
- A **horizontal 52-week Chronos Timeline** for visual project tracking with spring-animated drag-to-scroll
- An **Advanced Focus Timer** supporting three scientifically-backed productivity methods (Pomodoro, 52/17 Rule, 90-Minute Flow) with Web Audio notifications
- A **Notion-like rich-text Notes workspace** with floating bubble menu, inline formatting (H1/H2, bold, italic, underline, strikethrough, code, blockquote, text colour), and DOMPurify-based XSS sanitisation
- A **global Command Palette** (Ctrl+K) for instant project/task search and quick actions
- **Privacy-first Stealth Mode** (Shift+S) for screen-sharing safety
- **Role-based access control** (owner / admin / editor) with per-action enforcement
- A **Silk & Glass design language** — translucent surfaces, smooth Framer Motion animations, and obsessive attention to micro-interactions
- **PWA support** for installable desktop/mobile experience
- **i18n** with English and Arabic translations

### Core Differentiators

| Differentiator | Description |
|---|---|
| **Deep Work First** | Timer integration + distraction-free UI designed around focus sessions |
| **Visual Timeline** | Chronos provides at-a-glance project health via animated progress rings |
| **Premium Aesthetics** | Silk & Glass design language — no flat, generic dashboards |
| **Offline-First** | Full functionality without internet; seamless backend sync when connected |
| **API-Ready Architecture** | Frontend already built with async service layer — backend connects in hours, not weeks |

---

## 2. Target Users & Personas

### Persona 1: Solo Developer / Designer ("Alex")

- **Role**: Freelance full-stack developer
- **Pain Point**: Tracks tasks across too many tools (Notion, Todoist, physical notes)
- **STRIDE Value**: Single workspace with timeline, focus timer, notes, and weekly task board
- **Plan**: Solo or Team (up to 4 projects total)

### Persona 2: Startup Team Lead ("Jordan")

- **Role**: Engineering lead at a 5-person startup
- **Pain Point**: Needs lightweight PM tool without Jira's complexity
- **STRIDE Value**: Team mode with RBAC, member management, invite system, and audit trail
- **Plan**: Team (up to 4 projects total, max 5 members each)

### Persona 3: Agency Project Manager ("Sam")

- **Role**: Manages 3-4 client projects simultaneously
- **Pain Point**: Needs quick project switching, visual progress tracking, and client-facing views
- **STRIDE Value**: Dashboard with filter toggle (All/Solo/Team), progress rings, and stealth mode for presentations
- **Plan**: Team

---

## 3. Core Features

### 3.1 Daily Focused View (Kanban)

The primary workspace — a **7-day rolling kanban board** displaying the current week (Mon–Sun) as vertical columns.

| Capability | Description |
|---|---|
| **Inline Task Creation** | "Quick Add" input per column with glassmorphic card design |
| **Drag & Drop** | Tasks can be reordered within a day or dragged across days via `@dnd-kit/core` + `@dnd-kit/sortable` |
| **Automatic Rollover** | Uncompleted tasks from past days move to today with `rolledOver: true` flag |
| **Priority Badges** | Visual indicators for `low` (emerald), `medium` (sky), `high` (amber), `critical` (rose) |
| **Completion Toggle** | Click to mark done; completed tasks show strikethrough styling |
| **Task Context Menu** | Right-click for quick actions: assign, change tag, delete |
| **RBAC Filtering** | Editor role sees only tasks assigned to them |

### 3.2 Chronos Timeline

A **horizontal scrollable 52-week timeline** with drag-to-scroll and spring animations.

| Capability | Description |
|---|---|
| **Week Pills** | Weeks 1-52 rendered as circular pills with active-week glow |
| **Today Button** | One-click scroll to current week |
| **Spring Animations** | Framer Motion spring physics for smooth scrolling |
| **Monospace Font** | JetBrains Mono for precise week number rendering |

### 3.3 Advanced Focus Timer

A **draggable floating widget** supporting three scientifically-backed productivity methods:

| Method | Focus | Short Break | Long Break |
|---|---|---|---|
| **Pomodoro** | 25 min | 5 min | 15 min |
| **52/17 Rule** | 52 min | 17 min | 17 min |
| **90-Minute Flow** | 90 min | 20 min | 20 min |

| Capability | Description |
|---|---|
| **Circular Progress Ring** | SVG ring that transitions: primary (>5m) → amber (>1m) → rose (<1m) |
| **Browser Notifications** | Native `Notification API` alerts when a session ends |
| **Web Audio Alerts** | `AudioContext` sine wave at 830Hz, 0.3 gain, 0.8s duration |
| **Session Persistence** | Timer state survives page refresh via `localStorage` with drift-proof restoration |
| **Task Binding** | Timer can be launched from a specific task via the Task Drawer |
| **Minimized Pill** | Collapsible to a small pill showing time + play/pause |

### 3.4 Task Management

| Capability | Description |
|---|---|
| **Nested Sub-Tasks** | Each task supports sub-tasks with individual completion toggles and assignees |
| **Multi-Member Assignment** | Tasks assigned to multiple team members (stacked avatar chips) |
| **Custom Tags** | Colour-coded tags: Design (indigo), Backend (emerald), Feature (sky), UX (amber), Priority (rose), Security (rose) |
| **Priority Levels** | 4-tier system: `low`, `medium`, `high`, `critical` |
| **Due Dates** | Optional due date with calendar picker (react-day-picker) |
| **Task Drawer** | Full detail side panel with sub-tasks, activity, assignees, and focus timer launch |
| **Context Menu** | Right-click for tag/assignee/delete actions |

### 3.5 Standalone Notes (Rich Text)

A **Notion-like notes workspace** at `/notes` with a two-pane layout (note list + editor).

| Capability | Description |
|---|---|
| **Rich Text Editor** | `contentEditable` div with `document.execCommand` formatting |
| **Floating Bubble Menu** | Appears on text selection with: H1, H2, Normal Text, Bold, Italic, Underline, Strikethrough, Inline Code, Blockquote, Text Colour (7 colours) |
| **Note Colours** | 6 colour labels: none, blue, emerald, amber, rose, violet — rendered with inline styles |
| **Pin / Unpin** | Pinned notes sort to top |
| **Search & Filter** | Search by title, filter by linked project |
| **Project Linking** | Notes can be linked to a specific project |
| **XSS Sanitisation** | All content sanitised via `sanitizeHtml()` (DOMPurify strict allowlist) |
| **Typography Styles** | Headings, code blocks, blockquotes, bold, italic, underline, strikethrough all styled via Tailwind |

### 3.6 Command Palette

Global keyboard-driven command interface triggered by **Ctrl+K** / **⌘K**.

| Capability | Description |
|---|---|
| **Universal Search** | Search across all projects and all tasks (scans all `stride_tasks_*` localStorage keys) |
| **Quick Actions** | Create Project, Toggle Theme, Toggle Stealth Mode, Navigate to pages |
| **Keyboard Navigation** | Full arrow-key navigation with Enter to select |
| **Fuzzy Matching** | Powered by `cmdk` library |

### 3.7 Stealth Mode

Privacy feature for screen-sharing — triggered by **Shift+S** keyboard shortcut.

| Capability | Description |
|---|---|
| **Data Blurring** | All sensitive content blurred via CSS class `stealth-active` |
| **Session-Scoped** | Resets on page reload (not persisted) |
| **Input Aware** | Ignores shortcut when focused in inputs/textareas/contentEditable |
| **Global Scope** | Applies across all views simultaneously |

### 3.8 Collaboration & Notifications

| Capability | Description |
|---|---|
| **Team Mode** | Projects can be `solo` (single owner) or `team` (multi-member) |
| **Member Management** | Add/remove members with role assignment |
| **Invite System** | Invitations with `pending` / `accepted` / `declined` states |
| **Project Notes** | Shared note feed per project with author attribution |
| **Toast Notifications** | Via Sonner for system events |
| **Notification Centre** | Bell flyout with unread count, 5 notification types: info (sky), success (emerald), warning (amber), update (indigo), team (violet) |

### 3.9 Audit Log (Activity Trail)

Chronological record of project actions. Accessible from **Project Settings → Activity Log** tab.

| Capability | Description |
|---|---|
| **Tracked Events** | Project creation, settings updates, member changes, invites, notes, deletion |
| **Log Fields** | `action` (string), `userEmail`, `timestamp` (ISO 8601) |
| **RBAC** | Only `owner` and `admin` can view; editors see "Restricted Access" |
| **Timeline UI** | Vertical timeline with relative timestamps |

### 3.10 Simple / Advanced View Modes

Each project can be viewed in two modes:

| Mode | Description |
|---|---|
| **Simple** | Tabbed interface: Board, Notes, Calendar (lazy-loaded components) |
| **Advanced** | Full workspace: Chronos Timeline + Progress Card + Kanban + Project Notes |

### 3.11 User Home (Command Center)

Post-login landing page at `/home` with personalised greeting and 4 widget cards:

| Widget | Description |
|---|---|
| **Focus Timer** | Embedded mini timer (with own `FocusTimerProvider`) |
| **Due Today** | Loads tasks from all projects via localStorage scan |
| **Recent Notes** | Latest standalone notes from `stride_standalone_notes` |
| **Active Projects** | Project cards from context |

### 3.12 Analytics Dashboard

Project statistics at `/analytics`:

- Total projects, avg progress, on-track/delayed/completed counts
- Average estimated days, total notes, total unique members
- Status breakdown with progress bars
- Per-project progress sorted by completion with mini rings

### 3.13 Team Overview

Team page at `/team`:

- Aggregated member list (deduplicated across projects)
- Per-project team cards (team-mode projects only)
- Role hierarchy display: owner (Crown, amber) → admin (ShieldCheck, indigo) → editor (Pencil, emerald)

### 3.14 User Onboarding Tour

4-step guided tour on first visit:

1. **Welcome to STRIDE** — center modal
2. **Command Palette** — spotlight on `#onboarding-command-palette`
3. **Daily Tasks & Rollover** — spotlight on `#onboarding-task-board`
4. **Cyber-Stealth Mode** — spotlight on `#onboarding-stealth-badge`

SVG spotlight mask with cutout, responsive mobile layout, `resetOnboarding()` dev helper.

---

## 4. Role-Based Access Control (RBAC)

Three-tier permission model assigned per-project.

### Role Hierarchy

```
owner > admin > editor
```

### Permission Matrix

| Action | Owner | Admin | Editor |
|---|:---:|:---:|:---:|
| View project & assigned tasks | ✅ | ✅ | ✅ |
| Toggle task status (done/undone) | ✅ | ✅ | ✅ |
| Create / edit / delete tasks | ✅ | ✅ | ❌ |
| Drag-and-drop tasks | ✅ | ✅ | ❌ |
| Add tasks (Quick Add) | ✅ | ✅ | ❌ |
| Add / edit / delete notes | ✅ | ✅ | ❌ |
| Add / remove members | ✅ | ✅ | ❌ |
| Change member roles | ✅ | ✅ | ❌ |
| Send / manage invites | ✅ | ✅ | ❌ |
| Edit project settings | ✅ | ✅ | ❌ |
| View Activity Log | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |

> **Editor restrictions:** Editors see only tasks assigned to them (filtered by `userInitials`). They can toggle task done/undone only — cannot edit details, drag-and-drop, or create tasks.

### Business Rules

- Every project **must** have at least one `owner`
- Last `owner` cannot be removed or downgraded
- Solo-mode projects have a single `owner` — RBAC still applies for API/backend consistency

---

## 5. Business Logic & Constraints

### Route Map

| Route | Page | Auth | Layout |
|---|---|:---:|---|
| `/` | Landing | No | Standalone + Footer |
| `/auth` | Auth | No (redirect if logged in) | Standalone |
| `/home` | UserHome | Yes | Standalone |
| `/dashboard` | Index | Yes | DashboardLayout |
| `/notes` | NotesPage | Yes | DashboardLayout |
| `/profile` | Profile | Yes | DashboardLayout |
| `/analytics` | Analytics | Yes | DashboardLayout |
| `/team` | Team | Yes | DashboardLayout |
| `*` | NotFound | No | Standalone |

Footer hidden on workspace routes: `/dashboard`, `/profile`, `/analytics`, `/team`, `/notes`.

### Project Limits

| Constraint | Limit |
|---|---|
| Total Projects (all types) | 4 |
| Members per Project | 5 |

### Project Deletion

- Owner-only, requires typing exact project name
- Cascade deletes: tasks, sub-tasks, notes, members, invites, tags, audit logs, localStorage task data

### Auth Validation (Zod)

| Field | Rule |
|---|---|
| Email | Valid email, max 255 chars |
| Password | 8-128 chars, uppercase + number required |
| Full Name | 1-100 chars, `[a-zA-Z\s'-]+` |

---

## 6. Design Language

### Silk & Glass Aesthetic

| Principle | Implementation |
|---|---|
| **Translucent Surfaces** | `bg-white/60 dark:bg-white/[0.04]` + `backdrop-blur-lg` |
| **Soft Borders** | `border-[0.5px]` with low-opacity border colours |
| **Layered Shadows** | Multi-stop box shadows with neon glow per accent |
| **Micro-Interactions** | Framer Motion springs on interactive elements |
| **6 Accent Colours** | indigo, rose, emerald, amber, sky, violet (via CSS custom properties) |
| **Dark Mode** | `class`-based toggle with separate glow treatments |

---

## 7. Security & Sanitisation

### Frontend (Implemented)

| Measure | Implementation |
|---|---|
| XSS plain text | `sanitizeInput()` — regex HTML strip + event handler removal |
| XSS rich text | `sanitizeHtml()` — DOMPurify strict allowlist |
| Profanity filter | 18 regex patterns with asterisk replacement |
| Prototype pollution | Allowlisted field sets on all mutation paths |
| Auth validation | Zod `.strict()` schemas reject unknown keys |
| Password hashing | SHA-256 via `crypto.subtle.digest` (client-side) |
| CSRF | `X-CSRF-Token` from `<meta>` tag on all API requests |
| HTTPS enforcement | Runtime check in production |
| Source maps | Disabled in production |
| Console stripping | `console.*` and `debugger` dropped in production builds |

### Backend (Specified — see `BACKEND_REQUIREMENTS.md`)

| Measure | Specification |
|---|---|
| CORS | Whitelist origin, `credentials: true` |
| Rate limiting | Auth: 5 req/min/IP; API: 100 req/min/user |
| Password hashing | bcrypt ≥12 or Argon2id |
| JWT | RS256 preferred; 15min access / 7d refresh, HttpOnly cookies |
| Refresh rotation | New token per refresh; old invalidated |
| Input validation | Server-side HTML strip + profanity filter |
| SQL injection | Parameterised queries via ORM (Prisma 5) |

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Performance** | Lighthouse ≥ 90; bundle < 600 KB gzipped |
| **Accessibility** | WCAG 2.1 AA; keyboard-navigable; ARIA labels |
| **Browser Support** | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| **Offline Capability** | Full CRUD via localStorage; sync queue for backend |
| **Build Time** | Production build < 15 seconds |
| **Testing** | Vitest + Testing Library |

---

## 9. Data & Persistence

### localStorage Keys

| Key | Format | Owner |
|---|---|---|
| `wf_users` | `StoredUser[]` | AuthContext |
| `wf_session` | `User` | AuthContext |
| `wf_projects` | `Project[]` | ProjectDataContext |
| `stride_tutorial_completed` | `"true"` | UserOnboarding |
| `stride_last_open_date` | `"YYYY-MM-DD"` | DashboardLayout |
| `stride_focus_timer` | Timer state JSON | FocusTimerContext |
| `stride_tasks_{projectId}` | `DayColumn[]` | useTasks |
| `stride_standalone_notes` | `StandaloneNote[]` | NotesPage |
| `stride-dashboard-view-mode` | `"simple" \| "advanced"` | ProjectDashboard |
| `stride-dashboard-simple-tab` | `"board" \| "notes" \| "calendar"` | ProjectDashboard |
| `theme` | `"light" \| "dark"` | ThemeProvider |
| `accent` | AccentColor string | ThemeProvider |

### Logout Cleanup

Clears: `wf_projects`, `stride_tutorial_completed`, `stride_last_open_date`, all `stride_tasks_*` keys.

---

## 10. API Layer & Backend Readiness

### Current Architecture

```
Component → Hook → Context (optimistic update) → ProjectService (localStorage) → Promises
```

### Backend Swap Strategy

```
Component → Hook → Context (NO CHANGES) → ProjectService (swap localStorage → apiClient) → REST API
```

Each `ProjectService` function has a `// Future:` comment showing the exact `apiClient` call to uncomment. **No frontend component refactoring needed** — only `projectService.ts` changes.

### Environment Variable

`VITE_API_BASE_URL` — empty for localStorage mode, set to `https://api.stride.app` for production.

---

## 11. Success Metrics

| Metric | Target |
|---|---|
| Task Completion Rate | ≥ 70% within the week |
| Focus Timer Adoption | ≥ 40% of active users weekly |
| Project Retention | ≥ 60% with activity in last 7 days |
| Invite Acceptance | ≥ 50% acceptance rate |
| Page Load Time | < 2s on 3G |

---

## 12. Roadmap & Milestones

### Phase 1: Foundation (✅ Complete)

- [x] Daily Focused View with drag-and-drop
- [x] Chronos Timeline with 52-week scroll
- [x] Focus Timer (Pomodoro, 52/17, 90-Min Flow)
- [x] Project CRUD with glassmorphic dashboard
- [x] Command Palette (Ctrl+K)
- [x] Stealth Mode (Shift+S)
- [x] Offline-first localStorage persistence
- [x] API-ready service layer with `// Future:` swap pattern

### Phase 2: Collaboration & Security (✅ Complete)

- [x] RBAC (Owner / Admin / Editor) with per-action enforcement
- [x] Member management & invite system
- [x] Audit Log (Activity Trail)
- [x] Project limits (4 projects, 5 members)
- [x] DOMPurify + sanitizeInput XSS protection
- [x] Zod validation, prototype-pollution defence
- [x] User Home command center (`/home`)
- [x] Standalone Notes with rich-text BubbleMenu
- [x] Global Footer with Silk & Glass styling
- [x] User Onboarding Tour (4-step)
- [x] PWA support (vite-plugin-pwa)
- [x] i18n (en/ar)

### Phase 3: Backend Integration (🔄 In Progress)

- [ ] REST API implementation (see `BACKEND_REQUIREMENTS.md`)
- [ ] PostgreSQL database with Prisma migrations
- [ ] JWT auth with HttpOnly refresh cookies
- [ ] Server-side RBAC middleware
- [ ] Backend-enforced limits & validation
- [ ] WebSocket real-time events

### Phase 4: Scale & Polish (📋 Planned)

- [ ] Real-time collaboration (WebSocket task sync)
- [ ] File attachments
- [ ] Recurring tasks
- [ ] Calendar integration
- [ ] Mobile-native shell (Capacitor / Tauri)

---

*End of PRD v2.0.0*

- [ ] WebSocket integration for live task board updates
- [ ] Presence indicators (who's viewing which project)
- [ ] Push notifications for invite / assignment events
- [ ] File attachments on tasks and notes
- [ ] Calendar integrations (Google Calendar, Outlook)
- [ ] Export (PDF project reports, CSV task exports)

---

<div align="center">
  <sub>This document is the single source of truth for STRIDE's product requirements.<br/>All feature decisions should reference this PRD.</sub>
</div>
