# STRIDE — Technical Requirements & Feature Specification

> **Document Version**: 2.0.0  
> **Last Updated**: July 2025  
> **Status**: Frontend Complete — Backend Pending  
> **Audience**: Engineers, QA, AI Agents

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Component Inventory](#3-component-inventory)
4. [Context Provider Architecture](#4-context-provider-architecture)
5. [Route Map](#5-route-map)
6. [Type System](#6-type-system)
7. [localStorage Schema](#7-localstorage-schema)
8. [API Layer](#8-api-layer)
9. [RBAC Implementation](#9-rbac-implementation)
10. [Business Rules & Constants](#10-business-rules--constants)
11. [Security Implementation](#11-security-implementation)
12. [Seed Data](#12-seed-data)
13. [Feature Specifications](#13-feature-specifications)
14. [Build & Config](#14-build--config)
15. [Dependencies](#15-dependencies)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.8.3 |
| Build Tool | Vite + SWC | 5.4.19 |
| Styling | Tailwind CSS | 3.4.17 |
| Animation | Framer Motion | 12.34.0 |
| Routing | React Router | 6.30.1 |
| DnD | @dnd-kit/core + sortable | 6.3.1 / 10.0.0 |
| Sanitisation | DOMPurify | 3.3.1 |
| Validation | Zod | 3.25.76 |
| i18n | i18next + react-i18next | 25.8.10 / 16.5.4 |
| Command Palette | cmdk | 1.1.1 |
| Toasts | Sonner | 1.7.4 |
| Icons | lucide-react | 0.462.0 |
| Date Utils | date-fns | 3.6.0 |
| PWA | vite-plugin-pwa | 1.2.0 |
| Tests | Vitest + Testing Library | 3.2.4 |
| UI Primitives | Radix UI | various |
| CSS Utilities | tailwind-merge + clsx + CVA | various |

---

## 2. Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root: providers, routing, lazy loading
├── App.css                     # Global styles
├── index.css                   # Tailwind directives
├── vite-env.d.ts               # Vite type declarations
│
├── api/
│   ├── apiClient.ts            # Fetch wrapper with JWT, CSRF, 401 handling
│   ├── projectService.ts       # CRUD abstraction over localStorage (backend-ready)
│   └── NotificationService.ts  # Toast notification service
│
├── components/
│   ├── AuthContext.tsx          # Auth provider: SHA-256, session, legacy migration
│   ├── ProjectDataContext.tsx   # Project state: CRUD, RBAC, optimistic updates
│   ├── FocusTimerContext.tsx    # Timer state: methods, persistence, Web Audio
│   ├── SettingsContext.tsx      # Settings panel trigger
│   ├── ThemeProvider.tsx        # Theme + accent colour via CSS custom properties
│   ├── NotificationSystem.tsx   # Notification context + flyout panel
│   ├── StealthMode.tsx          # Privacy blur (Shift+S)
│   ├── CommandPalette.tsx       # Ctrl+K global search + actions
│   ├── ErrorBoundary.tsx        # React error boundary
│   │
│   ├── DashboardLayout.tsx      # Layout wrapper: sidebar, header, onboarding, timer
│   ├── DashboardSidebar.tsx     # Desktop sidebar (expand on hover) + mobile bottom nav
│   ├── DashboardHeader.tsx      # Top header: search, accent picker, theme, notifications
│   ├── UserOnboarding.tsx       # 4-step guided tour with SVG spotlight
│   │
│   ├── CreateProjectModal.tsx   # Project creation modal (24 icons, 6 colours)
│   ├── ProjectDashboard.tsx     # Project list/grid: Simple + Advanced modes
│   ├── ProjectSettings.tsx      # Settings overlay: General, Tags, Members, Activity
│   ├── ProjectNotes.tsx         # In-project note feed
│   │
│   ├── DailyFocusedView.tsx     # 7-day kanban with DnD, rollover, RBAC filtering
│   ├── ChronosTimeline.tsx      # 52-week horizontal timeline
│   ├── ProgressBentoCard.tsx    # Average progress summary card
│   ├── FocusTimer.tsx           # Draggable timer widget UI
│   │
│   ├── TaskDrawer.tsx           # Task detail side panel
│   ├── TaskContextMenu.tsx      # Right-click context menu
│   │
│   └── ui/                      # ~60 Radix-based UI primitives (shadcn/ui)
│
├── hooks/
│   ├── useProjects.ts           # Thin wrapper over ProjectDataContext
│   ├── useTasks.ts              # Per-project task persistence
│   ├── use-mobile.tsx           # Mobile breakpoint detector
│   ├── use-os.ts                # OS detection
│   └── use-toast.ts             # Toast hook re-export
│
├── lib/
│   ├── utils.ts                 # cn() — clsx + tailwind-merge
│   └── sanitize.ts              # sanitizeInput, sanitizeHtml, sanitizeObject
│
├── pages/
│   ├── Landing.tsx              # Public marketing page (718 lines)
│   ├── Auth.tsx                 # Login/register with Zod validation
│   ├── Index.tsx                # Main workspace (project selection + detail views)
│   ├── NotesPage.tsx            # Standalone notes with rich-text BubbleMenu
│   ├── Analytics.tsx            # Project statistics dashboard
│   ├── Team.tsx                 # Team member overview
│   ├── Profile.tsx              # Editable user profile
│   └── NotFound.tsx             # 404 page
│
├── types/
│   └── index.ts                 # All business types & interfaces
│
└── test/
    ├── setup.ts                 # Vitest setup
    └── example.test.ts          # Example test
```

---

## 3. Component Inventory

### Context Providers (7)

| Component | File | Purpose | localStorage Keys |
|---|---|---|---|
| `AuthProvider` | AuthContext.tsx | User auth, SHA-256 hashing, session | `wf_users`, `wf_session` |
| `ProjectDataProvider` | ProjectDataContext.tsx | Project CRUD, RBAC, optimistic updates | `wf_projects` |
| `FocusTimerProvider` | FocusTimerContext.tsx | Timer state, 3 methods, Web Audio | `stride_focus_timer` |
| `ThemeProvider` | ThemeProvider.tsx | Light/dark theme, 6 accents, CSS vars | `theme`, `accent` |
| `NotificationProvider` | NotificationSystem.tsx | Notification state + flyout | — |
| `StealthProvider` | StealthMode.tsx | Privacy blur toggle (Shift+S) | — |
| `CommandPaletteProvider` | CommandPalette.tsx | Ctrl+K search, nav, actions | — |
| `SettingsProvider` | SettingsContext.tsx | Settings panel trigger | — |

### Layout (4)

| Component | File | Purpose |
|---|---|---|
| `DashboardLayout` | DashboardLayout.tsx | Sidebar + header + onboarding + timer wrapper |
| `DashboardSidebar` | DashboardSidebar.tsx | Desktop expand-on-hover sidebar + mobile bottom nav |
| `DashboardHeader` | DashboardHeader.tsx | Top bar: search, accent picker, theme toggle, notifications |
| `UserOnboarding` | UserOnboarding.tsx | 4-step SVG spotlight guided tour |

### Feature Components (12)

| Component | File | Key Features |
|---|---|---|
| `CreateProjectModal` | CreateProjectModal.tsx | 24 icons, 6 colours, solo/team mode, team member picker |
| `ProjectDashboard` | ProjectDashboard.tsx | Simple/Advanced view modes, project grid, filter toggle |
| `ProjectSettings` | ProjectSettings.tsx | 4 tabs (General, Tags, Members, Activity), RBAC-gated |
| `ProjectNotes` | ProjectNotes.tsx | In-project note feed, collapsible |
| `DailyFocusedView` | DailyFocusedView.tsx | 7-day kanban, DnD, rollover, RBAC task filtering |
| `ChronosTimeline` | ChronosTimeline.tsx | 52-week horizontal scroll, spring animations |
| `ProgressBentoCard` | ProgressBentoCard.tsx | Avg progress across projects |
| `FocusTimer` | FocusTimer.tsx | Draggable widget, full/pill modes, SVG ring |
| `TaskDrawer` | TaskDrawer.tsx | Task detail: sub-tasks, assignees, priority, timer launch |
| `TaskContextMenu` | TaskContextMenu.tsx | Right-click: tags, assignees, delete |
| `NotificationFlyout` | NotificationSystem.tsx | Bell flyout with categorised notifications |
| `ErrorBoundary` | ErrorBoundary.tsx | React class component error boundary |

### Pages (8)

| Page | Route | Auth | Layout |
|---|---|:---:|---|
| `Landing` | `/` | No | Standalone + Footer |
| `Auth` | `/auth` | No | Standalone |
| `UserHome` | `/home` | Yes | Standalone |
| `Index` | `/dashboard` | Yes | DashboardLayout |
| `NotesPage` | `/notes` | Yes | DashboardLayout |
| `Profile` | `/profile` | Yes | DashboardLayout |
| `Analytics` | `/analytics` | Yes | DashboardLayout |
| `Team` | `/team` | Yes | DashboardLayout |
| `NotFound` | `*` | No | Standalone |

---

## 4. Context Provider Architecture

### Provider Nesting Order (App.tsx)

```
MotionConfig (reducedMotion: "user")
└── ThemeProvider
    └── TooltipProvider
        └── BrowserRouter
            └── AuthProvider
                └── NotificationProvider
                    └── ProjectDataProvider
                        └── SettingsProvider
                            └── CommandPaletteProvider
                                └── StealthProvider
                                    └── ErrorBoundary
                                        └── Routes
```

**Note**: `FocusTimerProvider` is NOT global — it wraps:
- `DashboardLayout` (workspace pages)
- `UserHome` (home page mini timer)

---

## 5. Route Map

| Route | Component | Auth | Layout | Footer |
|---|---|:---:|---|:---:|
| `/` | `Landing` | No | — | Yes |
| `/coming-soon` | `Landing` alias | No | — | Yes |
| `/auth` | `Auth` | AuthRoute* | — | Yes |
| `/home` | `UserHome` | ProtectedRoute | — | No |
| `/dashboard` | `Index` | ProtectedRoute | DashboardLayout | No |
| `/notes` | `NotesPage` | ProtectedRoute | DashboardLayout | No |
| `/profile` | `Profile` | ProtectedRoute | DashboardLayout | No |
| `/analytics` | `Analytics` | ProtectedRoute | DashboardLayout | No |
| `/team` | `Team` | ProtectedRoute | DashboardLayout | No |
| `*` | `NotFound` | No | — | No |

- **ProtectedRoute**: Redirects to `/auth` if not authenticated
- **AuthRoute**: Redirects to `/home` if already authenticated
- **WORKSPACE_PREFIXES**: `["/dashboard", "/profile", "/analytics", "/team", "/notes"]` — hide footer

---

## 6. Type System

All types defined in `src/types/index.ts`:

```typescript
type ProjectRole = "owner" | "admin" | "editor";
type ProjectMode = "solo" | "team";
type ProjectViewMode = "simple" | "advanced";
type ProjectStatus = "on-track" | "delayed" | "completed";
type InviteStatus = "pending" | "accepted" | "declined";
type Priority = "low" | "medium" | "high" | "critical";

interface User {
    id: string; email: string; fullName: string;
    jobTitle: string; createdAt: string;
    avatar?: string; bio?: string;
}

interface StoredUser extends User {
    passwordHash: string;
    password?: string; // legacy plaintext (migrated on login)
}

interface ProjectMember {
    userId: string; name: string; initials: string;
    role: ProjectRole; joinedAt: string; color?: string;
}

interface ProjectInvite {
    email: string; role: ProjectRole;
    status: InviteStatus; sentAt: string;
}

interface ProjectNote {
    id: string; content: string;
    authorEmail: string; authorName: string;
    createdAt: string;
}

interface ProjectTag { label: string; color: string; }

interface AuditLogEntry {
    action: string; userEmail: string; timestamp: string;
}

interface Project {
    id: string; name: string; description: string;
    iconName: string; progress: number; status: ProjectStatus;
    color: string; mode: ProjectMode; viewMode: ProjectViewMode;
    members: ProjectMember[]; invites: ProjectInvite[];
    notes: ProjectNote[]; tags: ProjectTag[];
    createdAt: string; estimatedDays: number;
    auditLogs: AuditLogEntry[];
}

interface Tag { label: string; color: string; }
interface SubTask {
    id: string; title: string; done: boolean; assignee?: string;
}

interface Task {
    id: string; title: string; done: boolean; priority: Priority;
    tags: Tag[]; assignees: string[]; dueDate?: string;
    description?: string; rolledOver?: boolean; subtasks?: SubTask[];
}

interface DayColumn { day: string; tasks: Task[]; }

interface StandaloneNote {
    id: string; title: string; content: string;
    color?: string; pinned: boolean; projectId?: string;
    createdAt: string; updatedAt: string;
}
```

---

## 7. localStorage Schema

| Key | Type | Set By | Cleared On |
|---|---|---|---|
| `wf_users` | `StoredUser[]` | AuthContext | Never |
| `wf_session` | `User` | AuthContext | Logout |
| `wf_projects` | `Project[]` | ProjectDataContext | Logout |
| `stride_tutorial_completed` | `"true"` | UserOnboarding | Logout |
| `stride_last_open_date` | `"YYYY-MM-DD"` | DashboardLayout | Logout |
| `stride_focus_timer` | `TimerState` JSON | FocusTimerContext | Never |
| `stride_tasks_{projectId}` | `DayColumn[]` | useTasks | Logout / Project delete |
| `stride_standalone_notes` | `StandaloneNote[]` | NotesPage | Never |
| `stride-dashboard-view-mode` | `"simple" \| "advanced"` | ProjectDashboard | Never |
| `stride-dashboard-simple-tab` | `"board" \| "notes" \| "calendar"` | ProjectDashboard | Never |
| `theme` | `"light" \| "dark"` | ThemeProvider | Never |
| `accent` | AccentColor | ThemeProvider | Never |

### Logout Cleanup (AuthContext)

Removes: `wf_projects`, `stride_tutorial_completed`, `stride_last_open_date`, all keys matching `stride_tasks_*`.

### Project Delete Cleanup (ProjectService)

Removes: `stride_tasks_{deletedProjectId}`.

---

## 8. API Layer

### Current Architecture (localStorage)

```
Component → useProjects()/useTasks() → ProjectDataContext → ProjectService → localStorage
```

### ProjectService Functions

| Function | localStorage Key | Backend Endpoint |
|---|---|---|
| `fetchProjects()` | `wf_projects` | `GET /api/projects` |
| `createProject(data)` | `wf_projects` | `POST /api/projects` |
| `updateProject(id, updates)` | `wf_projects` | `PATCH /api/projects/:id` |
| `deleteProject(id)` | `wf_projects` + `stride_tasks_{id}` | `DELETE /api/projects/:id` |
| `addNote(projectId, note)` | `wf_projects` | `POST /api/projects/:id/notes` |
| `deleteNote(projectId, noteId)` | `wf_projects` | `DELETE /api/projects/:id/notes/:noteId` |
| `addMember(projectId, member)` | `wf_projects` | `POST /api/projects/:id/members` |
| `removeMember(projectId, userId)` | `wf_projects` | `DELETE /api/projects/:id/members/:userId` |
| `updateMemberRole(projectId, userId, role)` | `wf_projects` | `PATCH /api/projects/:id/members/:userId` |
| `sendInvite(projectId, invite)` | `wf_projects` | `POST /api/projects/:id/invites` |
| `acceptInvite(projectId, email)` | `wf_projects` | `POST /api/projects/:id/invites/accept` |
| `declineInvite(projectId, email)` | `wf_projects` | `POST /api/projects/:id/invites/decline` |
| `fetchTasks(projectId)` | `stride_tasks_{id}` | `GET /api/projects/:id/tasks` |
| `saveTasks(projectId, columns)` | `stride_tasks_{id}` | `PUT /api/projects/:id/tasks` |

### apiClient.ts

| Feature | Value |
|---|---|
| Base URL | `VITE_API_BASE_URL` (empty = localStorage mode) |
| HTTPS | Enforced in production |
| Auth | `Authorization: Bearer <token>` |
| CSRF | `X-CSRF-Token` from `<meta>` tag |
| Credentials | `include` (cookies) |
| Content-Type | `application/json` |
| 401 Handler | Global `onUnauthorized` callback (clears token) |

---

## 9. RBAC Implementation

### Role Definitions

| Role | Display | Description |
|---|---|---|
| `owner` | Owner — Full control | All permissions |
| `admin` | Admin — Manage members & settings | Everything except delete/transfer |
| `editor` | Editor — Assigned tasks only | Toggle task status on assigned tasks only |

### Permission Matrix

| Action | Owner | Admin | Editor |
|---|:---:|:---:|:---:|
| View project & assigned tasks | ✅ | ✅ | ✅ |
| Toggle task done/undone | ✅ | ✅ | ✅ |
| Create/edit/delete tasks | ✅ | ✅ | ❌ |
| Drag-and-drop tasks | ✅ | ✅ | ❌ |
| Quick Add tasks | ✅ | ✅ | ❌ |
| Change tags/assignees | ✅ | ✅ | ❌ |
| Add/remove members | ✅ | ✅ | ❌ |
| Send/manage invites | ✅ | ✅ | ❌ |
| Edit project settings | ✅ | ✅ | ❌ |
| View Activity Log | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |

### Enforcement Points

| Component | RBAC Mechanism |
|---|---|
| `DailyFocusedView` | Editor sees only assigned tasks (filtered by `userInitials`); DnD disabled; Quick Add hidden |
| `TaskDrawer` | `readOnly` prop: editor can only toggle `done`, all other fields disabled |
| `TaskContextMenu` | `restrictActions` prop hides all actions for editors |
| `ProjectSettings` | Members/Activity tabs hidden for editors; delete requires owner |
| `ProjectDataContext` | `getMyRole()` returns current user's role for the active project |

### Business Rules

- Every project must have at least one `owner`
- Last owner cannot be removed or downgraded (enforced in `removeMember` and `updateMemberRole`)
- Solo-mode projects have one `owner` member

---

## 10. Business Rules & Constants

### Limits

| Constant | Value | Enforced In |
|---|---|---|
| `MAX_TOTAL_PROJECTS` | 4 | ProjectDataContext, CreateProjectModal, ProjectDashboard |
| `MAX_MEMBERS` | 5 per project | ProjectSettings |
| Default `estimatedDays` | 30 | CreateProjectModal |
| Max avatar upload | 5 MB | Profile |

### Productivity Methods

| Method | Focus | Short Break | Long Break |
|---|---|---|---|
| Pomodoro | 25 min | 5 min | 15 min |
| 52/17 Rule | 52 min | 17 min | 17 min |
| 90-Minute Flow | 90 min | 20 min | 20 min |

### Timer Audio

- Frequency: 830 Hz, Gain: 0.3, Duration: 0.8s, Waveform: Sine

### Auth Validation (Zod `.strict()`)

| Field | Rule |
|---|---|
| Email | Valid email, max 255 chars |
| Password | 8-128 chars, uppercase + number required |
| Full Name | 1-100 chars, `/^[a-zA-Z\s'-]+$/` |
| Job Title | 1-80 chars |

### Colour Palettes

| Context | Colours |
|---|---|
| Global accents | indigo, rose, emerald, amber, sky, violet |
| Project accents (extended) | + fuchsia, orange |
| Tag colours | indigo, rose, emerald, amber, sky, fuchsia, orange, lime |
| Note colours | none, blue, emerald, amber, rose, violet |
| Notification types | info (sky), success (emerald), warning (amber), update (indigo), team (violet) |

### Task Priority Colours

| Priority | Colour |
|---|---|
| low | emerald |
| medium | sky |
| high | amber |
| critical | rose |

### Available Tags (Seed)

Design (indigo), Backend (emerald), Feature (sky), UX (amber), Priority (rose), Security (rose)

### Project Icons (24)

Palette, Layers, Rocket, Sparkles, Shield, Zap, Globe, Code, Database, Terminal, Star, Heart, Briefcase, GraduationCap, Coffee, Gamepad2, Music, Camera, BookOpen, Plane, Trophy, Lightbulb, PenTool, Gem

---

## 11. Security Implementation

### Frontend (Implemented)

| Layer | Implementation |
|---|---|
| **XSS (plain text)** | `sanitizeInput()` — strips HTML, scripts, `javascript:`, `data:`, `on*=` handlers |
| **XSS (rich text)** | `sanitizeHtml()` — DOMPurify strict allowlist (b, i, u, s, h1-h6, p, br, a, code, pre, blockquote, span, div, font + href/style/color attrs) |
| **Profanity** | 18 regex patterns → asterisk replacement |
| **Prototype pollution** | Allowlisted field sets on `updateProject`, `ProjectSettings`, `ProjectService` |
| **Auth validation** | Zod `.strict()` schemas (reject unknown keys) |
| **Password hashing** | SHA-256 via `crypto.subtle.digest` |
| **CSRF** | `X-CSRF-Token` header from `<meta>` tag |
| **HTTPS** | Runtime enforcement in production |
| **401 handling** | Global unauthorized handler clears token |
| **Source maps** | Disabled in production |
| **Console strip** | `console.*` + `debugger` dropped in production |
| **MIME** | `X-Content-Type-Options: nosniff` |
| **Referrer** | `strict-origin-when-cross-origin` |

### DOMPurify Config

```typescript
ALLOWED_TAGS: [
    "b", "i", "u", "em", "strong", "s", "strike", "del",
    "p", "br", "hr", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "pre", "code",
    "a", "span", "div", "sub", "sup", "mark", "font"
]
ALLOWED_ATTR: ["href", "target", "rel", "class", "id", "style", "color"]
ALLOW_DATA_ATTR: false
```

---

## 12. Seed Data

### 5 Projects

| ID | Name | Colour | Mode | Progress | Status |
|---|---|---|---|---|---|
| proj-1 | Design System v3 | indigo | team | 72% | on-track |
| proj-2 | API Gateway | rose | team | 45% | delayed |
| proj-3 | Mobile App | emerald | team | 88% | on-track |
| proj-4 | AI Assistant | amber | solo | 30% | on-track |
| proj-5 | Platform Infra | sky | team | 60% | delayed |

### 5 Team Members

| Initials | Name | Colour |
|---|---|---|
| AK | Alex Kim | indigo |
| MJ | Maya Jones | violet |
| RL | Ryan Lee | sky |
| SC | Sam Chen | emerald |
| TW | Taylor Wu | amber |

### 7 Seed Tasks

| Day | Title | Tags | Assignees | Done |
|---|---|---|---|:---:|
| Mon | Design System Overhaul | Design | AK, MJ | ❌ |
| Mon | API Rate Limiting | Backend | RL | ✅ |
| Tue | Onboarding Flow | Feature, UX | MJ, SC | ❌ |
| Wed | Real-time Notifications | Backend | AK, RL, TW | ❌ |
| Wed | Dark Mode Polish | Design | SC | ❌ (rolled) |
| Thu | Auth Integration | Security, Backend | AK | ❌ |
| Fri | Landing Page | Design, Feature | MJ, TW | ❌ |

### 8 Notifications

1. Team invite from Maya Jones — "Design System v3"
2. Task completed — Ryan Lee finished "API Integration"
3. Task assigned — "Dashboard Redesign"
4. Deadline approaching — "Mobile App Launch" due in 2 days
5. Sprint started — Sprint 3
6. Member joined — Sam Chen → "Platform Infra"
7. Role updated — Admin in "API Gateway"
8. Project milestone — "Design System v3" at 75%

### 10 Motivational Quotes

1. "Let's build some momentum today! 🚀"
2. "Ready to architect your week?"
3. "Small steps compound. Ship something today. ⚡"
4. "Focus mode: activated. Let's crush it."
5. "Today's progress is tomorrow's foundation."
6. "One task at a time. You've got this. 💪"
7. "Great things are built in daily increments."
8. "Time to turn ideas into action."
9. "Your future self will thank you. Let's go!"
10. "Another day, another chance to ship. 🎯"

---

## 13. Feature Specifications

### Rich Text Editor (NotesPage.tsx)

**Architecture**: `contentEditable` div with `document.execCommand` for formatting.

**BubbleMenu** (floating toolbar on text selection):

| Button | Command | Icon |
|---|---|---|
| Heading 1 | `formatBlock "H1"` | Heading1 |
| Heading 2 | `formatBlock "H2"` | Heading2 |
| Normal Text | `formatBlock "P"` | Type |
| Bold | `bold` | Bold |
| Italic | `italic` | Italic |
| Underline | `underline` | Underline |
| Strikethrough | `strikeThrough` | Strikethrough |
| Inline Code | `insertHTML <code>` | Code2 |
| Blockquote | `formatBlock "BLOCKQUOTE"` | Quote |
| Text Colour | `foreColor` (7 colours) | Palette |

**Text Colours**: Default (remove), Red (#ef4444), Orange (#f97316), Emerald (#10b981), Blue (#3b82f6), Violet (#8b5cf6), Rose (#f43f5e)

**Note Colours** (sidebar label): none, blue (#3b82f6), emerald (#10b981), amber (#f59e0b), rose (#f43f5e), violet (#8b5cf6)

**Typography Styles** (EDITOR_TYPOGRAPHY):
- `h1`: text-2xl, font-extrabold, tracking-tight
- `h2`: text-xl, font-bold, tracking-tight
- `b/strong`: font-bold
- `i/em`: italic
- `u`: underline, decoration-primary/40
- `s/strike`: line-through
- `pre`: rounded-lg, bg-muted/50, p-4, text-sm, font-mono, overflow-x-auto
- `code`: bg-muted/60, px-1.5, py-0.5, rounded, text-xs, font-mono
- `blockquote`: border-l-2, border-primary/40, pl-4, italic, text-muted-foreground

**Sanitisation**: All content passes through `sanitizeHtml()` (DOMPurify) on save.

### Focus Timer

**Methods**: Pomodoro (25/5/15), 52/17 Rule (52/17/17), 90-Minute Flow (90/20/20)

**Modes**: `focus`, `short-break`, `long-break`

**Statuses**: `idle`, `running`, `paused`

**Ring Colour Logic**: primary (>5min) → amber (>1min) → rose (<1min)

**Audio**: Web Audio API, 830Hz sine, 0.3 gain, 0.8s

**Persistence**: Drift-proof — stores `startedAt` timestamp, recalculates elapsed on reload.

### DnD Kanban (DailyFocusedView)

**Library**: `@dnd-kit/core` + `@dnd-kit/sortable`

**Custom Sensor**: `LeftClickSensor` — only activates on left mouse button (preserves right-click for context menu)

**Rollover**: Past-day uncompleted tasks auto-move to today with `rolledOver: true`

**RBAC**: Editor sees only assigned tasks; DnD disabled; Quick Add hidden

**Cancel Behaviour**: If drag handler throws or user cancels, state reverts to pre-drag snapshot

### Stealth Mode

**Trigger**: Shift+S keyboard shortcut (ignored in inputs/textareas/contentEditable)

**Mechanism**: CSS class `stealth-active` on wrapper div enables `filter: blur()`

**Scope**: Session-only, global, resets on reload

### Command Palette

**Trigger**: Ctrl+K / Cmd+K

**Search Scope**: All projects (from context) + all tasks (scans all `stride_tasks_*` localStorage keys)

**Quick Actions**: Create New Project, Toggle Dark/Light Mode, Toggle Stealth Mode (⇧S), Go to Analytics, Go to Team, Go to Profile

### User Onboarding

**4 Steps**:
1. Welcome to STRIDE (center modal)
2. Command Palette (spotlight `#onboarding-command-palette`, bottom)
3. Daily Tasks & Rollover (spotlight `#onboarding-task-board`, top)
4. Cyber-Stealth Mode (spotlight `#onboarding-stealth-badge`, bottom)

**Reset**: `resetOnboarding()` exported for dev/testing

---

## 14. Build & Config

### Vite (vite.config.ts)

| Setting | Value |
|---|---|
| Dev server | host `"::"`, port 8080, HMR overlay disabled |
| React | `@vitejs/plugin-react-swc` |
| PWA | `vite-plugin-pwa` with `autoUpdate` strategy |
| Path alias | `@ → ./src` |
| Source maps | `false` (prod) |
| Minification | `esbuild` |
| Console drop | `console.*` + `debugger` in production |

### PWA Manifest

- Name: "STRIDE Workspace"
- Short name: "STRIDE"
- Theme: `#0f172a`
- Display: `standalone`
- Icons: 192x192, 512x512, 512x512 maskable

### Tailwind (tailwind.config.ts)

- Dark mode: `class`-based
- Container: centered, 2rem padding, max 1400px
- Colour system: CSS custom properties (`hsl(var(--...))`)
- Plugin: `tailwindcss-animate`

### TypeScript

- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- Path alias: `@/*` → `./src/*`

---

## 15. Dependencies

### Production (30+)

React 18, React DOM 18, React Router 6, TypeScript 5.8, Framer Motion 12, @dnd-kit (core + sortable + utilities), Radix UI primitives (accordion, dialog, dropdown, popover, tabs, tooltip, etc.), class-variance-authority, clsx, tailwind-merge, cmdk, date-fns, DOMPurify, i18next, react-i18next, input-otp, lucide-react, react-day-picker, react-resizable-panels, sonner, vaul, Zod, tailwindcss-animate, embla-carousel-react.

### Dev

Vite 5, @vitejs/plugin-react-swc, Tailwind CSS 3, PostCSS, Autoprefixer, @tailwindcss/typography, ESLint 9, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, Vitest 3, @testing-library/react, @testing-library/jest-dom, jsdom, vite-plugin-pwa, lovable-tagger.

---

*End of REQUIREMENTS v2.0.0*
