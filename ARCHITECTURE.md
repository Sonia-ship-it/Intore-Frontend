# Frontend Architecture

---

## Authentication Flow

```
/register
    │
    ├── authStore.register()  →  POST /auth/register
    │         │
    │         └── verificationRequired: true
    │
    ▼
/verify?email=...
    │
    ├── authStore.verify()  →  POST /auth/verify
    │         │
    │         └── JWT token stored in localStorage
    │
    ▼
/recruiter/dashboard
```

```
/login
    │
    ├── authStore.login()  →  POST /auth/login
    │         │
    │         └── JWT token stored in localStorage
    │
    ▼
/recruiter/dashboard  (or /applicant/dashboard)
```

Token is read from `localStorage` on every `apiFetch` call and sent as `Authorization: Bearer <token>`.

---

## Screening Flow (JobDetail page)

```
Recruiter opens /recruiter/jobs/[id]
    │
    ├── Load job details  →  GET /jobs/:id
    ├── Load ingestion state  ←  ingestionStore
    │
    ▼
Click "Screen Candidates"
    │
    ├── Animated progress bar (step labels driven by interval)
    │
    ├── runScreeningAndWait()  →  POST /screening/run
    │         │
    │         └── Gemini evaluates all candidates
    │
    ├── Results rendered in ranked table
    │         ├── Score bar (0–100)
    │         ├── Recommendation badge (Shortlist / Consider / Not Selected)
    │         ├── Strengths + Gaps chips
    │         └── Expandable row with full AI reasoning
    │
    ├── AI chat panel unlocked
    │         └── Auto-sends intro message summarising top pick
    │
    └── Download buttons (CSV / JSON)
```

---

## AI Chat (AIChatFAB)

The floating chat button is available on all recruiter pages.

```
User types question
    │
    ├── POST /screening/ask
    │         ├── jobId from URL (if on job detail page)
    │         └── "general" otherwise
    │
    └── Gemini answers using:
              ├── Job-specific screening snapshot (if jobId provided)
              └── Most recent snapshot (if general)
```

Suggestions are context-aware based on the current route:
- Job detail → candidate comparison questions
- Candidates page → profile-specific questions
- Screenings page → result summary questions
- Other pages → general recruiting questions

---

## Component Hierarchy

```
RecruiterLayout
├── AppSidebar
│   ├── Logo (IntoreMark)
│   ├── Nav links (Dashboard, Jobs, Candidates, Screenings, Settings)
│   └── User info + Back to home
├── AppHeader
│   ├── Page title
│   ├── Post a job button
│   ├── Search input
│   ├── Theme toggle
│   ├── Notifications bell
│   └── User dropdown (Profile, Settings, Logout)
├── <page content>
└── AIChatFAB (floating)
```

---

## Key Components

### TagInput
`src/components/intore/TagInput.tsx`

Skill tag input with:
- Tags rendered as removable pills
- Suggestions dropdown (filtered as you type)
- Add on Enter or comma
- Remove last tag on Backspace

### ScoreBar
`src/components/intore/ScoreBar.tsx`

Animated progress bar for match scores. Color-coded:
- ≥70% → green (`bg-score-high`)
- ≥50% → amber (`bg-score-medium`)
- <50% → red (`bg-score-low`)

### BiasWarning
`src/components/intore/BiasWarning.tsx`

Dismissible warning banner shown after screening completes. Stored in `screeningStore.biasWarningDismissed`.

### EmptyState
`src/components/intore/EmptyState.tsx`

Reusable empty state with icon, title, description, and optional action button.

### Avatar
`src/components/intore/Avatar.tsx`

Initials-based avatar with configurable size (`sm`, `md`, `lg`) and color.

---

## Routing

Uses Next.js Pages Router (`pages/` directory).

Route files in `pages/` are thin wrappers that import from `src/pages/`:

```typescript
// pages/recruiter/dashboard.tsx
import RecruiterDashboard from "@/pages/recruiter/Dashboard";
export default RecruiterDashboard;
```

This keeps the actual page logic in `src/` while Next.js handles routing from `pages/`.

---

## Theme

Managed by `useTheme` hook. Persisted in `localStorage`. Toggles `dark` class on `<html>`.

Dark mode uses Tailwind's `dark:` variant throughout.

---

## Password Strength Meter

On the Register page, password strength is evaluated in real time against 4 criteria:
1. Length ≥ 8 characters
2. Contains uppercase letter
3. Contains number
4. Contains special character

Score 1 → Weak, 2 → Fair, 3 → Good, 4 → Strong. Displayed as a colored progress bar with a hint.

---

## Download (Screening Results)

Results can be exported from the JobDetail page:

- **CSV** — rank, name, score, confidence, top strength, key gap, recommendation, reasoning
- **JSON** — full structured data for each ranked candidate

Both use the browser's `Blob` + `URL.createObjectURL` download pattern.
