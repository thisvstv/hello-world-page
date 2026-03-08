# STRIDE — User Stories & Use Cases (Agile Documentation)

> **Document Version**: 1.0.0  
> **Methodology**: Agile / Scrum  
> **Last Updated**: February 2026  
> **Author**: Product & Engineering  
> **Status**: Approved

---

## Table of Contents

1. [Roles & Personas](#1-roles--personas)
2. [Epics Overview](#2-epics-overview)
3. [Use Cases](#3-use-cases)
4. [User Stories by Epic](#4-user-stories-by-epic)
5. [Acceptance Criteria (Major Epics)](#5-acceptance-criteria-major-epics)
6. [Non-Functional Stories](#6-non-functional-stories)
7. [Definition of Done](#7-definition-of-done)

---

## 1. Roles & Personas

| Role | Description | Key Permissions |
|---|---|---|
| **Solo User** | Individual using STRIDE for personal project management | Full CRUD on own projects (solo mode) |
| **Team Owner** | Creator of a team project; highest authority within the project | Project deletion, member management, RBAC assignment, audit log access |
| **Team Admin** | Delegated administrator; can manage members and settings | Member & tag management, audit log access; cannot delete projects |
| **Team Editor** | Contributor assigned to specific tasks | View assigned tasks only; toggle task status (done/undone); no editing of task details, settings, or members |

---

## 2. Epics Overview

| Epic ID | Epic Name | Priority | Stories |
|---|---|---|---|
| **EP-01** | Project Management | P0 — Critical | US-01 through US-06 |
| **EP-02** | Daily Focused View & Task Board | P0 — Critical | US-07 through US-14 |
| **EP-03** | Chronos Timeline | P1 — High | US-15 through US-18 |
| **EP-04** | Advanced Focus Timer | P1 — High | US-19 through US-24 |
| **EP-05** | Collaboration & Team Features | P0 — Critical | US-25 through US-31 |
| **EP-06** | Notifications & Communication | P1 — High | US-32 through US-36 |
| **EP-07** | Enterprise Audit Log | P1 — High | US-37 through US-40 |
| **EP-08** | Command Palette & Navigation | P2 — Medium | US-41 through US-43 |
| **EP-09** | Privacy & Stealth Mode | P2 — Medium | US-44 through US-46 |
| **EP-10** | Settings & Personalization | P1 — High | US-47 through US-51 |
| **EP-11** | Security & Performance | P0 — Critical | US-52 through US-56 |
| **EP-12** | Routing & User Home | P0 — Critical | US-57 through US-60 |

---

## 3. Use Cases

### UC-01: Manage Projects

**Actor**: Solo User, Team Owner  
**Precondition**: User is authenticated and on the dashboard  
**Trigger**: User clicks "New Project" or interacts with existing project cards

**Main Flow**:
1. User views the Project Dashboard with all existing projects displayed as cards.
2. User clicks "+ Create" to open the Create Project modal.
3. User fills in project name, description, selects an icon and accent color.
4. User chooses project mode (Solo or Team).
5. If Team mode, user adds team members via email and assigns roles.
6. User clicks "Create Project" — project appears on the dashboard.
7. User can later edit project settings, manage tags, or delete the project.

**Postcondition**: Project is persisted and visible on the dashboard and in analytics.  
**Constraints**: Maximum 4 total projects (solo + team combined). Maximum 5 members per team project.

---

### UC-02: Execute Daily Task Management

**Actor**: Solo User, Team Editor, Team Owner  
**Precondition**: User has selected a project and is viewing the workspace  
**Trigger**: User interacts with the 7-day rolling task board

**Main Flow**:
1. User views the current week (Mon–Sun) laid out as vertical day columns.
2. User creates a new task via the Quick Add input at the bottom of a day column.
3. User drags tasks to reorder within a day or moves them across days.
4. User clicks a task to open the Task Drawer with full details.
5. User adds sub-tasks, sets priority, assigns due dates, and tags.
6. User marks tasks as complete via the toggle button.
7. User clicks "Rollover" to move uncompleted past tasks to today.

**Postcondition**: Task state is persisted and reflected across all views (timeline, analytics, progress cards).

---

### UC-03: Execute Focus Session

**Actor**: Solo User, Team Editor, Team Owner  
**Precondition**: User has at least one task in the current project  
**Trigger**: User clicks the timer icon on a task card or in the Task Drawer

**Main Flow**:
1. User opens the Focus Timer widget (floating, draggable).
2. User selects a productivity method: Pomodoro (25/5), 52/17 Rule, or 90-Minute Flow.
3. User begins a focus session — the circular progress ring animates.
4. Timer changes color as time runs low (primary → amber → rose).
5. When the session completes, a browser notification and audio chime alert the user.
6. User may switch to a break mode (short or long) between focus sessions.
7. User can minimize the timer to a compact pill or close it entirely.

**Postcondition**: Completed sessions are counted and persisted. Timer state survives page refresh.

---

### UC-04: Manage Team Collaboration

**Actor**: Team Owner, Team Admin  
**Precondition**: A team-mode project exists  
**Trigger**: User opens Project Settings → Members tab

**Main Flow**:
1. User views current team members with their roles and invite status.
2. User adds a new member by entering their email and selecting a role.
3. System sends an invite (pending state) — the member appears in the list.
4. Owner can change member roles or remove members (except themselves).
5. Admin can manage members but cannot delete the project or remove the owner.
6. Editors see only their assigned tasks and can only toggle task status.

**Postcondition**: RBAC rules are enforced. Audit log entries are created for all membership changes.

---

### UC-05: Review Audit Trail

**Actor**: Team Owner, Team Admin  
**Precondition**: User has owner or admin role in a team project  
**Trigger**: User opens Project Settings → Activity Log tab

**Main Flow**:
1. User views a chronological timeline of all project actions.
2. Each entry shows: action description, performer (email), and relative timestamp.
3. User scrolls through the log (max-height 420px with overflow scroll).
4. Entries are auto-generated — no manual logging needed.

**Postcondition**: Full traceability of project changes is available.  
**Restriction**: Editors see a "Restricted Access" lock screen.

---

### UC-06: Navigate via Command Palette

**Actor**: All authenticated users  
**Precondition**: User is on any authenticated page  
**Trigger**: User presses Ctrl+K (Windows/Linux) or ⌘K (macOS)

**Main Flow**:
1. Command Palette overlay opens with a search input.
2. User types to search across projects, tasks, and quick actions.
3. User navigates results with arrow keys and selects with Enter.
4. Selected action is executed (navigate to project, open task, toggle theme, etc.).

**Postcondition**: User is navigated to the selected resource or action is executed.

---

## 4. User Stories by Epic

### EP-01: Project Management

| ID | User Story | Priority |
|---|---|---|
| **US-01** | As a **Solo User**, I want to create a solo project so that I can organize my tasks in a dedicated workspace. | P0 |
| **US-02** | As a **Team Owner**, I want to create a team project and invite members so that my team can collaborate. | P0 |
| **US-03** | As a **Solo User**, I want to choose a custom icon and accent colour for my project so that my dashboard feels personalized. | P2 |
| **US-04** | As a **Team Owner**, I want to delete a project so that I can remove workspaces I no longer need. | P1 |
| **US-05** | As a **Solo User**, I want to see a warning when I reach the 4-project limit so that I understand the system constraint. | P1 |
| **US-06** | As a **Team Owner**, I want the system to enforce a 5-member limit per project so that collaboration stays manageable. | P1 |

### EP-02: Daily Focused View & Task Board

| ID | User Story | Priority |
|---|---|---|
| **US-07** | As a **Solo User**, I want to see a 7-day rolling task board so that I focus on the current week only. | P0 |
| **US-08** | As a **Solo User**, I want to quickly add tasks via an inline input so that I can capture ideas without friction. | P0 |
| **US-09** | As a **Team Editor**, I want to drag and drop tasks between days so that I can reschedule my work. | P0 |
| **US-10** | As a **Solo User**, I want to mark tasks as complete with a single click so that I see immediate progress. | P0 |
| **US-11** | As a **Solo User**, I want a "Rollover" button to move overdue tasks to today so that nothing falls through the cracks. | P1 |
| **US-12** | As a **Team Editor**, I want to click a task to open a detail drawer so that I can view sub-tasks, activity, and metadata. | P0 |
| **US-13** | As a **Solo User**, I want to add sub-tasks within a task so that I can break complex work into smaller steps. | P1 |
| **US-14** | As a **Team Owner**, I want to right-click a task for quick actions (assign, prioritize, move, delete) so that I can manage tasks efficiently. | P1 |

### EP-03: Chronos Timeline

| ID | User Story | Priority |
|---|---|---|
| **US-15** | As a **Solo User**, I want to see a horizontal timeline showing the current project week so that I have visual context on my project's lifecycle. | P1 |
| **US-16** | As a **Solo User**, I want the current day highlighted on the timeline so that I know where I am in the project. | P2 |
| **US-17** | As a **Solo User**, I want to click any week marker to jump to that week so that I can navigate through the project timeline. | P2 |
| **US-18** | As a **Solo User**, I want a "back to current week" button so that I can quickly return to the present. | P2 |

### EP-04: Advanced Focus Timer

| ID | User Story | Priority |
|---|---|---|
| **US-19** | As a **Solo User**, I want to start a focus session from a task so that my timer is linked to a specific piece of work. | P1 |
| **US-20** | As a **Solo User**, I want to choose between Pomodoro, 52/17, and 90-Minute Flow methods so that I can match my focus style. | P1 |
| **US-21** | As a **Solo User**, I want a circular progress ring that changes colour as time runs low so that I have a visual sense of urgency. | P2 |
| **US-22** | As a **Solo User**, I want a browser notification and audio chime when my session ends so that I don't lose track of time. | P1 |
| **US-23** | As a **Solo User**, I want to minimize the timer to a pill so that it stays visible without taking up workspace. | P2 |
| **US-24** | As a **Solo User**, I want my timer state to persist across page refreshes so that I don't lose my session. | P1 |

### EP-05: Collaboration & Team Features

| ID | User Story | Priority |
|---|---|---|
| **US-25** | As a **Team Owner**, I want to add members by email with a specific role so that I can control access levels. | P0 |
| **US-26** | As a **Team Owner**, I want to change a member's role at any time so that I can adjust permissions as the project evolves. | P1 |
| **US-27** | As a **Team Owner**, I want to remove members from my project so that I can manage my team composition. | P1 |
| **US-28** | As a **Team Editor**, I want to see only tasks assigned to me and toggle their status so that I can focus on my responsibilities. | P1 |
| **US-30** | As a **Team Owner**, I want to add shared notes to a project so that team communication stays in context. | P1 |
| **US-31** | As a **Team Admin**, I want to manage tags and members on behalf of the owner so that administrative work is distributed. | P2 |

### EP-06: Notifications & Communication

| ID | User Story | Priority |
|---|---|---|
| **US-32** | As a **Team Member**, I want to receive a notification when I'm assigned to a task so that I know about new work. | P1 |
| **US-33** | As a **Team Owner**, I want to see a notification when a team member completes a task so that I can track progress. | P1 |
| **US-34** | As a **Solo User**, I want toast notifications for system events (project created, errors) so that I get immediate feedback. | P0 |
| **US-35** | As a **Solo User**, I want a notification bell with an unread count badge so that I know when new alerts arrive. | P1 |
| **US-36** | As a **Solo User**, I want to mark notifications as read or clear them all so that I can manage my notification inbox. | P2 |

### EP-07: Enterprise Audit Log

| ID | User Story | Priority |
|---|---|---|
| **US-37** | As a **Team Owner**, I want an activity log showing all project changes so that I have full traceability. | P1 |
| **US-38** | As a **Team Admin**, I want to view the audit log so that I can monitor project activity on behalf of the owner. | P1 |
| **US-39** | As a **Team Editor**, I want to be prevented from viewing the audit log so that sensitive operational data is secured. | P1 |
| **US-40** | As a **Team Owner**, I want audit entries to include who performed each action and when so that I can identify exactly what happened. | P1 |

### EP-08: Command Palette & Navigation

| ID | User Story | Priority |
|---|---|---|
| **US-41** | As a **Solo User**, I want to open a command palette with Ctrl+K so that I can search and navigate without using the mouse. | P1 |
| **US-42** | As a **Solo User**, I want to search across all projects and tasks from the command palette so that I find things instantly. | P1 |
| **US-43** | As a **Solo User**, I want quick actions (create project, toggle theme) in the command palette so that I perform common tasks faster. | P2 |

### EP-09: Privacy & Stealth Mode

| ID | User Story | Priority |
|---|---|---|
| **US-44** | As a **Solo User**, I want to toggle Stealth Mode with Alt+S so that I can blur sensitive data in public settings. | P2 |
| **US-45** | As a **Solo User**, I want to hover over blurred content to peek at it so that I can still read my data privately. | P2 |
| **US-46** | As a **Solo User**, I want Stealth Mode to apply across all views simultaneously so that no data leaks through unprotected screens. | P2 |

### EP-10: Settings & Personalization

| ID | User Story | Priority |
|---|---|---|
| **US-47** | As a **Solo User**, I want to switch between light and dark themes so that I can match my environment preference. | P1 |
| **US-48** | As a **Solo User**, I want to choose an accent colour (indigo, rose, emerald, etc.) so that my workspace feels personal. | P2 |
| **US-49** | As a **Team Owner**, I want to manage project-specific tags (create, edit, delete) so that my taxonomy is consistent. | P1 |
| **US-50** | As a **Solo User**, I want to update my profile (name, avatar) so that my identity is displayed correctly. | P2 |
| **US-51** | As a **Team Owner**, I want to configure project settings (name, description, estimated duration) so that project metadata stays accurate. | P1 |

### EP-11: Security & Performance

| ID | User Story | Priority |
|---|---|---|
| **US-52** | As a **Solo User**, I want all user inputs sanitized so that XSS and injection attacks are prevented. | P0 |
| **US-53** | As a **Solo User**, I want the app to load under 3 seconds on 4G so that the experience feels instant. | P0 |
| **US-54** | As a **Solo User**, I want page-level code splitting so that I only download the code I need for the current view. | P1 |
| **US-55** | As a **Solo User**, I want Content Security Policy headers enforced so that the app is protected against script injection. | P1 |
| **US-56** | As a **Team Member**, I want RBAC enforced on every mutation so that unauthorized actions are blocked at both UI and API layers. | P0 |

---

## 5. Acceptance Criteria (Major Epics)

### EP-03: Chronos Timeline

| AC ID | Acceptance Criteria |
|---|---|
| **AC-03.1** | **GIVEN** a user is viewing a project workspace, **WHEN** the Chronos Timeline renders, **THEN** it displays a horizontally scrollable strip of all weeks in the project's estimated duration, with the current week highlighted and centered. |
| **AC-03.2** | **GIVEN** the timeline is visible, **WHEN** the user clicks a week pill, **THEN** the active week label animates to the selected week number, and the timeline strip springs to center that week. |
| **AC-03.3** | **GIVEN** the user has scrolled to a past or future week, **WHEN** they click the "Jump to Current Week" button, **THEN** the timeline smoothly scrolls back and highlights the current week. |

### EP-04: Advanced Focus Timer

| AC ID | Acceptance Criteria |
|---|---|
| **AC-04.1** | **GIVEN** a task exists in the Daily Focused View, **WHEN** the user clicks the timer icon in the Task Drawer, **THEN** the Focus Timer opens as a draggable floating widget, pre-bound to that task's title, with the selected productivity method's default durations. |
| **AC-04.2** | **GIVEN** the Focus Timer is running, **WHEN** the user refreshes or navigates away and returns, **THEN** the timer restores its previous state (remaining time, mode, method, task title) from `localStorage` and resumes correctly. |
| **AC-04.3** | **GIVEN** a focus session completes (timeLeft reaches 0), **WHEN** the timer fires, **THEN** a browser notification is displayed (if permissions granted), an audio chime plays via `AudioContext`, the timer status changes to "idle", and the progress ring resets to full for the next session. |

### EP-07: Enterprise Audit Log (Activity Trail)

| AC ID | Acceptance Criteria |
|---|---|
| **AC-07.1** | **GIVEN** a user with `owner` or `admin` role opens Project Settings and navigates to the Activity Log tab, **WHEN** the tab renders, **THEN** all logged actions are displayed in reverse-chronological order with human-readable descriptions, performer email, and relative timestamps. |
| **AC-07.2** | **GIVEN** any mutation occurs (project update, member addition/removal, note creation, settings change), **WHEN** the mutation completes, **THEN** a new audit log entry is automatically appended without any manual instrumentation by the developer. |
| **AC-07.3** | **GIVEN** a user with `editor` role navigates to the Activity Log tab, **WHEN** the tab renders, **THEN** they see a "Restricted Access" lock screen with an informational message instead of the log entries, and no audit data is exposed. |

---

## 6. Non-Functional Stories

| ID | Story | Category |
|---|---|---|
| **NF-01** | As a user, I want all animations to run at 60fps so that the UI feels smooth and responsive. | Performance |
| **NF-02** | As a user, I want the app to work fully offline with localStorage persistence so that I can use STRIDE without an internet connection. | Reliability |
| **NF-03** | As a user, I want the UI to be fully responsive from 320px to 2560px so that I can use STRIDE on any device. | Accessibility |
| **NF-04** | As a user, I want all interactive elements to have visible focus indicators so that keyboard navigation is possible. | Accessibility |
| **NF-05** | As a user, I want the production bundle to exclude source maps and console statements so that the app is hardened. | Security |
| **NF-06** | As a user, I want all dependencies audited for known vulnerabilities so that the supply chain is secured. | Security |
| **NF-07** | As a user, I want page transitions to feel instant via React.lazy and Suspense so that navigation is seamless. | Performance |
| **NF-08** | As a user, I want expensive components memoized (React.memo) so that unnecessary re-renders don't degrade performance. | Performance |

---

## 7. Definition of Done

A User Story is considered **Done** when all of the following are satisfied:

- [ ] Feature implementation matches the story description and acceptance criteria
- [ ] Unit tests pass (`vitest`) with no regressions
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] No ESLint warnings or errors
- [ ] Responsive design verified on mobile (375px), tablet (768px), and desktop (1440px)
- [ ] Dark mode and light mode both render correctly
- [ ] Accessibility: interactive elements have `aria-label` or visible text labels
- [ ] Security: all user inputs are sanitized via `sanitizeInput()`
- [ ] Performance: no component renders more than twice on mount (verified via React DevTools Profiler)
- [ ] Code reviewed and merged to `main` branch

---

## Appendix: EP-12 — Routing & User Home Stories

### US-57: Landing Page — No Forced Redirect for Authenticated Users

**As a** logged-in user,  
**I want to** be able to visit the Landing Page without being redirected away,  
**So that** I can share the URL, browse feature info, or show the page to others while logged in.

**Acceptance Criteria:**
- AC-57.1: Navigating to `/` while authenticated renders the full Landing Page.
- AC-57.2: No `<Navigate>` or redirect fires for authenticated users on `/`.
- AC-57.3: All Landing Page sections (hero, features, CTA, footer) render correctly.

---

### US-58: Smart CTA Buttons & Logo

**As a** user on the Landing Page,  
**I want** the CTAs and logo to adapt based on whether I am logged in,  
**So that** I get relevant navigation options without confusion.

**Acceptance Criteria:**
- AC-58.1: When not authenticated, hero CTA reads "Get started" and nav CTA reads "Sign in". Both navigate to `/auth`.
- AC-58.2: When authenticated, hero CTA reads "Go to Home" and nav CTA reads "Go to Home". Both navigate to `/home`.
- AC-58.3: The STRIDE logo in the Landing nav is a `<Link>` — routes to `/home` when authenticated, `/` when not.
- AC-58.4: The STRIDE logo in the Dashboard sidebar is a `<Link>` to `/home`.

---

### US-59: User Home — Command Center

**As an** authenticated user,  
**I want** a dedicated `/home` page that acts as my command center,  
**So that** I have a personalised hub with quick actions and an overview before diving into projects.

**Acceptance Criteria:**
- AC-59.1: `/home` is a protected route — unauthenticated users are redirected to `/auth`.
- AC-59.2: Page displays a time-based greeting (Good morning/afternoon/evening) with the user's first name.
- AC-59.3: "Quick Actions" section contains two cards: "Go to Project Dashboard" → `/dashboard`, "Create New Project" → `/dashboard?action=create`.
- AC-59.4: Overview section displays project statistics (active/completed counts) with a progress bar.
- AC-59.5: Placeholder widgets for "Tasks Due Soon" and "Productivity" are visible.
- AC-59.6: Successful login or registration redirects to `/home`.

---

### US-60: Global Footer Component

**As a** visitor on the Landing Page,  
**I want** a professional footer with branding and navigation links,  
**So that** the page feels complete and I can find important links.

**Acceptance Criteria:**
- AC-60.1: Footer component renders at the bottom of the Landing Page.
- AC-60.2: Footer contains the STRIDE logo, brand tagline, and copyright text showing "© 2026".
- AC-60.3: Footer includes links for Features, Pricing, and Contact.
- AC-60.4: Footer uses Tailwind CSS and is responsive (stacks on mobile, side-by-side on desktop).

---

*This document is a living artifact maintained by the Product & Engineering team. Stories may be added, refined, or re-prioritized during sprint planning ceremonies.*
