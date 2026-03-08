# STRIDE — AI Agent Context

> **Purpose**: Rapid-onboarding document for AI coding agents (Claude, Copilot, Cursor, etc.)  
> **Last Updated**: July 2025  
> **Usage**: Feed this file as context before any STRIDE coding session.  
> **See Also**: `PRD.md` (product spec), `REQUIREMENTS.md` (technical spec), `BACKEND_REQUIREMENTS.md` (API/DB spec)

---

## What Is STRIDE?

A **glassmorphic project management SPA** built with React 18 + TypeScript + Vite 5. Full offline-first CRUD via localStorage with an async service layer ready for backend swap. Features a 7-day kanban board, rich-text notes (with right-click context menu, font sizes, image/link insertion, Arabic RTL support), focus timer, RBAC, and a "Silk & Glass" design language.

**Tagline**: "Plan smarter. Ship faster."

---

## Quick Orientation

| Question | Answer |
|---|---|
| Where is the code? | `src/` — components, pages, hooks, api, lib, types |
| What framework? | React 18 + TypeScript 5.8 + Vite 5 (SWC) |
| What styling? | Tailwind CSS 3 (class-based dark mode) + Framer Motion 12 |
| What state management? | React Context (7 providers) + localStorage persistence |
| What routing? | React Router 6, all pages lazy-loaded via `React.lazy` |
| What UI primitives? | Radix UI + shadcn/ui in `src/components/ui/` |
| Backend connected? | **No** — all data in localStorage. `projectService.ts` has `// Future:` comments for backend swap |
| How to run? | `npm run dev` → `http://localhost:8080` |
| How to build? | `npm run build` → `dist/` |
| How to test? | `npm run test` |

---

## Critical Rules for AI Agents

### DO

- **Use `sanitizeInput()`** for all plain-text user inputs (names, titles, descriptions)
- **Use `sanitizeHtml()`** for all rich-text/HTML content (notes editor)
- **Use allowlisted field sets** on any object mutation (no spreading user payloads directly)
- **Check `getMyRole()`** before enabling destructive actions
- **Use inline styles** for dynamic colours — Tailwind purges interpolated class names like `bg-${color}-500`
- **Add new tags to DOMPurify config** (`src/lib/sanitize.ts`) if introducing new HTML elements
- **Keep `projectService.ts` as the only data layer** — components should never read/write localStorage directly (except for isolated local prefs)
- **Respect the provider nesting order** in `App.tsx` — context consumers must be inside their providers

### DON'T

- **Don't add a `viewer` role** — RBAC is strictly owner/admin/editor. There is no read-only viewer role.
- **Don't exceed 4 projects** or **5 members per project** — these limits are intentional product constraints
- **Don't use `dangerouslySetInnerHTML` without `sanitizeHtml()`** — all HTML rendering goes through DOMPurify
- **Don't add global state** outside the context provider tree unless there's a strong reason
- **Don't spread unknown fields** onto objects — always filter through an allowlist
- **Don't use `bg-${variable}-500` patterns** — Tailwind can't detect these at build time. Use inline `style={{ backgroundColor }}` with hex values instead

---

## Architecture At-a-Glance

```
App.tsx (providers + routes)
├── Landing.tsx                     # Public marketing page
├── Auth.tsx                        # Login/register (Zod validation)
├── UserHome.tsx                    # Post-login command center
├── DashboardLayout.tsx             # Workspace shell (sidebar + header)
│   ├── Index.tsx                   # Project workspace (simple/advanced)
│   │   ├── ProjectDashboard.tsx    # Project list/grid
│   │   ├── ChronosTimeline.tsx     # 52-week timeline
│   │   ├── DailyFocusedView.tsx    # 7-day kanban (DnD)
│   │   ├── ProgressBentoCard.tsx   # Progress summary
│   │   └── ProjectNotes.tsx        # In-project notes
│   ├── NotesPage.tsx               # Standalone notes (rich text)
│   ├── Analytics.tsx               # Project statistics
│   ├── Team.tsx                    # Team overview
│   └── Profile.tsx                 # User profile
└── NotFound.tsx                    # 404
```

### Data Flow

```
Component → useProjects()/useTasks() → ProjectDataContext → ProjectService → localStorage
                                                                           ↓ (future)
                                                                    apiClient → REST API
```

### Provider Nesting (App.tsx)

```
MotionConfig → ThemeProvider → TooltipProvider → BrowserRouter →
  AuthProvider → NotificationProvider → ProjectDataProvider →
    SettingsProvider → CommandPaletteProvider → StealthProvider →
      ErrorBoundary → Routes
```

`FocusTimerProvider` is NOT global — injected locally in `DashboardLayout` and `UserHome`.

---

## RBAC Quick Reference

```
owner > admin > editor
```

| | Owner | Admin | Editor |
|---|:---:|:---:|:---:|
| View assigned tasks | ✅ | ✅ | ✅ |
| Toggle task done | ✅ | ✅ | ✅ |
| Create/edit/delete tasks | ✅ | ✅ | ❌ |
| DnD tasks | ✅ | ✅ | ❌ |
| Manage members/invites | ✅ | ✅ | ❌ |
| Project settings | ✅ | ✅ | ❌ |
| View audit log | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |

**Editor sees only assigned tasks** (filtered by `userInitials` in `DailyFocusedView`).

**Last owner protection**: Cannot remove or downgrade the last remaining owner.

---

## Key Constants

| Constant | Value | Location |
|---|---|---|
| `MAX_TOTAL_PROJECTS` | 4 | ProjectDataContext, CreateProjectModal, ProjectDashboard |
| `MAX_MEMBERS` | 5 | ProjectSettings |
| Default `estimatedDays` | 30 | CreateProjectModal |
| Max avatar upload | 5 MB | Profile |
| Max image per note | 1 MB | NotesPage (JS FileReader) |
| Account image storage | 10 MB | Backend (see BACKEND_REQUIREMENTS §8) |
| Password rules | 8-128 chars, uppercase + number | Auth (Zod) |
| Timer audio | 830Hz sine, 0.3 gain, 0.8s | FocusTimerContext |

---

## localStorage Keys

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

---

## Notes Editor — Key Details

### Right-Click Context Menu

The notes editor uses a **right-click context menu** (not a selection-based BubbleMenu). The `EditorContextMenu` component receives `pos` (x/y), `visible`, and `onClose` props. It is triggered via `onContextMenu` on the `contentEditable` div and dismissed via click-outside or Escape key.

### Formatting Capabilities

| Feature | Implementation |
|---|---|
| Headings (H1, H2, Normal) | `execCommand('formatBlock')` |
| Bold, Italic, Underline, Strikethrough | `execCommand('bold/italic/underline/strikeThrough')` |
| Inline Code | Wraps selection in `<code>` via `insertHTML` |
| Blockquote | `execCommand('formatBlock', 'BLOCKQUOTE')` |
| Font Size (Small/Normal/Large/Huge) | `execCommand('fontSize', '2/3/5/7')` → `<font size>` |
| Insert Link | `window.prompt` → `execCommand('createLink')` |
| Insert Image | Hidden `<input type="file">` → FileReader base64 → `execCommand('insertImage')` |
| Text Color (7 colours) | `execCommand('foreColor', hex)` |

### Image Limits

- **1 MB per file** — enforced in frontend JS (`file.size > 1_048_576`)
- **10 MB per account** — enforced by backend (see `BACKEND_REQUIREMENTS.md` §8)
- Images stored as base64 in localStorage (replaced with CDN URLs when backend connected)

### Arabic / RTL Support

The `contentEditable` div has `dir="auto"`, which lets the browser detect Arabic/Hebrew text direction automatically. The Cairo font (loaded in `index.html`) supports Arabic glyphs.

### DOMPurify Allowlist (sanitize.ts)

`ALLOWED_TAGS` includes: `img`, `font`, `a`, `b`, `i`, `u`, `em`, `strong`, `s`, `h1`-`h6`, `blockquote`, `pre`, `code`, `p`, `br`, `ul`, `ol`, `li`, `span`, `div`, `mark`, `sub`, `sup`

`ALLOWED_ATTR` includes: `href`, `target`, `rel`, `class`, `id`, `style`, `color`, `src`, `alt`, `width`, `height`, `size`
| `stride-dashboard-view-mode` | `"simple" \| "advanced"` | ProjectDashboard |
| `stride-dashboard-simple-tab` | `"board" \| "notes" \| "calendar"` | ProjectDashboard |
| `theme` | `"light" \| "dark"` | ThemeProvider |
| `accent` | AccentColor | ThemeProvider |

---

## Security Checklist

When modifying any user-facing input or data mutation:

1. **Text inputs** → `sanitizeInput()` (strips HTML, scripts, profanity)
2. **Rich HTML** → `sanitizeHtml()` (DOMPurify strict allowlist — includes `img` with `src`/`alt`)
3. **Object updates** → Filter through allowlisted field set (e.g., `ALLOWED_UPDATE_KEYS`, `ALLOWED_PROJECT_FIELDS`, `ALLOWED_SETTINGS_KEYS`)
4. **Form payloads** → Zod `.strict()` (rejects unknown keys)
5. **Dynamic colours** → Use inline `style={{}}` with hex values, NOT Tailwind `bg-${var}-500`
6. **New HTML tags** → Add to DOMPurify `ALLOWED_TAGS` in `src/lib/sanitize.ts`
7. **Role checks** → `getMyRole()` from `useProjectData()` context

---

## Colour System

### 6 Global Accent Colours

indigo, rose, emerald, amber, sky, violet — set via `ThemeProvider` as CSS custom properties.

### CSS Variables (set by ThemeProvider)

`--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring`, `--shadow-neon`, `--accent-btn-from`, `--accent-btn-to`, `--accent-mesh-light`, `--accent-mesh-dark`

### Project Accents (8)

indigo, violet, rose, emerald, amber, sky, fuchsia, orange

### Tag Colours (8)

indigo, rose, emerald, amber, sky, fuchsia, orange, lime

### Note Colours (6)

none, blue, emerald, amber, rose, violet

---

## Seed Data Summary

- **5 projects**: Design System v3 (indigo, 72%), API Gateway (rose, 45% delayed), Mobile App (emerald, 88%), AI Assistant (amber, 30%), Platform Infra (sky, 60% delayed)
- **5 team members**: AK (Alex Kim), MJ (Maya Jones), RL (Ryan Lee), SC (Sam Chen), TW (Taylor Wu)
- **7 tasks** across Mon-Fri with tags and assignees
- **8 notifications** covering invites, completions, assignments, deadlines
- **10 motivational quotes** shown once per day via toast

---

## Backend Readiness

The frontend is **fully backend-ready**. The swap requires:

1. Set `VITE_API_BASE_URL=https://api.stride.app`
2. Call `setAccessToken(jwt)` after login in `AuthContext`
3. In `projectService.ts`, replace localStorage reads/writes with `apiClient` calls (each function has a `// Future:` comment showing the exact call)
4. **No component-level refactoring needed**

### Backend Spec

See `BACKEND_REQUIREMENTS.md` for:
- 11 database tables (Users, Projects, ProjectMembers, Invites, Notes, Tags, AuditLogs, TaskColumns, Tasks, TaskAssignees, TaskTags, SubTasks)
- 17 REST API endpoints
- JWT auth (RS256, 15min access / 7d refresh, HttpOnly cookies)
- RBAC middleware spec
- WebSocket events (12 types, room-per-project)
- Recommended stack: Node.js 20+ (Fastify), PostgreSQL 16+, Prisma 5

---

## Route Map

| Route | Page | Auth | Layout |
|---|---|:---:|---|
| `/` | Landing | No | Standalone + Footer |
| `/auth` | Auth | AuthRoute | Standalone |
| `/home` | UserHome | Protected | Standalone |
| `/dashboard` | Index | Protected | DashboardLayout |
| `/notes` | NotesPage | Protected | DashboardLayout |
| `/profile` | Profile | Protected | DashboardLayout |
| `/analytics` | Analytics | Protected | DashboardLayout |
| `/team` | Team | Protected | DashboardLayout |
| `*` | NotFound | No | Standalone |

Footer hidden on: `/dashboard`, `/profile`, `/analytics`, `/team`, `/notes`

---

## Common Patterns

### Adding a New Page

1. Create `src/pages/MyPage.tsx`
2. Add lazy import in `App.tsx`: `const MyPage = lazy(() => import("./pages/MyPage"));`
3. Add route inside `<Routes>` with `<ProtectedRoute>` wrapper if auth required
4. Add to `WORKSPACE_PREFIXES` if it should hide the footer
5. Add sidebar nav item in `DashboardSidebar.tsx` if it's a workspace page

### Adding a New Context Provider

1. Create `src/components/MyContext.tsx` with `createContext` + `useMyContext` hook
2. Wrap in the provider tree in `App.tsx` at the appropriate nesting level
3. Export the hook for consumers

### Backend API Swap for a Service Function

In `projectService.ts`, each function follows this pattern:

```typescript
async fetchProjects(): Promise<Project[]> {
    // Current: localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
    // Future: return apiClient.get<Project[]>('/api/projects');
}
```

Just uncomment the `// Future:` line and remove the localStorage code.

---

*End of CLAUDE_CONTEXT.md*
