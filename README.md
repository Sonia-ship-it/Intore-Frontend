# Intore Frontend — Recruiter Dashboard

Next.js 15 + React 18 + TypeScript frontend for the Intore recruitment platform.

---

## Setup

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
npm run dev
```

App runs at `http://localhost:3000`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL |
| `NEXT_PUBLIC_API_URL` | Alias for above (fallback) |

---

## Project Structure

```
src/
├── pages/                    # Next.js pages router
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Verify.tsx
│   ├── recruiter/
│   │   ├── Dashboard.tsx
│   │   ├── JobsList.tsx
│   │   ├── JobDetail.tsx
│   │   ├── CreateJob.tsx
│   │   ├── BulkUpload.tsx
│   │   ├── CandidatesList.tsx
│   │   ├── ScreeningsList.tsx
│   │   └── Settings.tsx
│   └── LandingPage.tsx
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── RecruiterLayout.tsx
│   │   └── Footer.tsx
│   ├── intore/               # Domain-specific components
│   │   ├── Avatar.tsx
│   │   ├── Badges.tsx
│   │   ├── BiasWarning.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── Chips.tsx
│   │   ├── ConfidenceBadge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ScoreBar.tsx
│   │   ├── Spinner.tsx
│   │   ├── SuggestionChips.tsx
│   │   └── TagInput.tsx
│   ├── ui/                   # shadcn/ui components
│   │   └── AIChatFAB.tsx     # Floating AI assistant
│   ├── animations/
│   └── branding/
├── stores/                   # Zustand state
│   ├── authStore.ts
│   ├── screeningStore.ts
│   └── ingestionStore.ts
├── lib/
│   ├── api.ts                # apiFetch, ApiError
│   ├── screeningApi.ts       # Screening API calls
│   ├── ingestion.ts          # Candidate data parsing
│   └── utils.ts              # cn() utility
├── hooks/
│   ├── use-mobile.ts
│   ├── use-toast.ts
│   └── useTheme.ts
└── data/
    └── mockData.ts           # Type definitions + mock data
```

---

## Pages

### Public

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing landing page |
| `/login` | `Login` | Recruiter login |
| `/register` | `Register` | Recruiter registration |
| `/verify` | `Verify` | Email verification |

### Recruiter (protected)

| Route | Component | Description |
|---|---|---|
| `/recruiter/dashboard` | `Dashboard` | Overview with stats, recent jobs, AI CTA |
| `/recruiter/jobs` | `JobsList` | All jobs with search and filters |
| `/recruiter/jobs/new` | `CreateJob` | Job creation form |
| `/recruiter/jobs/[id]` | `JobDetail` | Job detail + AI screening + chat |
| `/recruiter/jobs/[id]/upload` | `BulkUpload` | Bulk candidate ingestion |
| `/recruiter/candidates` | `CandidatesList` | Normalized candidate profiles |
| `/recruiter/screenings` | `ScreeningsList` | Screening history |
| `/recruiter/settings` | `Settings` | Profile, appearance, notifications |

---

## State Management

### authStore

Manages authentication state persisted in `localStorage`.

```typescript
{
  token?: string
  user: { id, name, email, avatar?, role? } | null
  role: 'recruiter' | 'applicant'
  isAuthenticated: boolean
  login(email, password): Promise<void>
  register(params): Promise<{ verificationRequired, devCode? }>
  verify(email, code): Promise<void>
  resendCode(email, purpose): Promise<{ devCode? }>
  logout(): void
}
```

### screeningStore

Manages the screening UI state for a job detail page.

```typescript
{
  status: 'idle' | 'running' | 'complete' | 'error'
  progress: number          // 0–100
  biasWarningDismissed: boolean
  chatMessages: ChatMessage[]
  isUnlocked: boolean       // chat unlocked after screening
  isStreaming: boolean
}
```

### ingestionStore

Tracks ingested candidates per job.

```typescript
{
  byJobId: {
    [jobId]: {
      candidates: NormalizedCandidate[]
      sources: string[]
      umurava?: { profiles: any[] }
    }
  }
}
```

---

## API Client

`src/lib/api.ts`

```typescript
apiFetch<T>(path: string, opts?: RequestInit): Promise<T>
apiUpload<T>(path: string, form: FormData): Promise<T>
```

- Automatically attaches `Authorization: Bearer <token>` from localStorage
- Throws `ApiError` with `status` and `details` on non-2xx responses
- Human-readable error messages for 401, 403, 404, 500

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Run Vitest tests |

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `next` | React framework with file-based routing |
| `zustand` | Lightweight state management |
| `@radix-ui/*` | Accessible headless UI primitives |
| `tailwindcss` | Utility-first CSS |
| `recharts` | Charts (dashboard activity graph) |
| `framer-motion` | Animations |
| `react-phone-number-input` | International phone input |
| `papaparse` | CSV parsing |
| `xlsx` | Excel file parsing |
| `react-hook-form` | Form state management |
| `zod` | Schema validation |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for deeper component documentation.
