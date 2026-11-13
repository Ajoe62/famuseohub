# FAMU-SOE Capstone and Lab Hub

A tool for the FAMU School of the Environment capstone program, built to be embedded in Canvas via **LTI 1.3**.

- **Students** choose a capstone track (Flagship or Project) and submit four stages in order: Topic Selection → Research Proposal → Completed Project → Presentation Deck. They also log lab and field hours toward the 50-hour requirement.
- **Faculty advisors** approve each stage or request a revision. Approving a stage unlocks the next one. Advisors also verify or return each lab-hour entry, and can export verified hours as CSV.
- Every decision is recorded with who made it and when (`reviews` table). Both sides get in-app notifications.

> **Status:** the workflow, the Canvas LTI 1.3 launch, advisor assignment, and automated accessibility checks are built and tested against a simulated Canvas. **Next step: install it in FAMU's beta Canvas** ([docs/CANVAS_SETUP.md](docs/CANVAS_SETUP.md)). For local development, use the development login at `/dev/login`.

## Quick start

Requires Node 22+.

```bash
npm install
npm run db:setup   # creates a local database with fictional sample data
npm run dev        # http://localhost:3000 → redirects to /dev/login
```

Sign in as a sample user:

| User | Role | Scenario |
|---|---|---|
| Jordan Rivers | Student | Flagship track: Stage 1 approved, Stage 2 under review, 28 of 50 hours verified |
| Avery Chen | Student | Project track: Stage 1 open, one pending lab entry |
| Taylor Brooks | Student | No track yet, no assigned advisor |
| Dr. Casey Grant | Advisor | Jordan's advisor |
| Dr. Robin Hale | Advisor | Avery's advisor |

Use **Switch user (dev)** in the header to change users.

### Database

- **Development:** with `DATABASE_URL` unset, the app uses [PGlite](https://pglite.dev), a real Postgres compiled to WebAssembly, stored in `.data/pglite`. There's nothing to install.
  PGlite allows **one process at a time**, so stop `npm run dev` before running `db:*` scripts.
- **Production / Docker:** set `DATABASE_URL` to a Postgres connection string. The code is identical.
- **Staging on Neon:** `neon env pull` writes `DATABASE_URL` (pooled, used by the app) and `DATABASE_URL_UNPOOLED` (direct, used for migrations) into `.env.local`. The `db:*` scripts read `.env.local` too. With it present, `npm run dev` also uses Neon; comment the two lines out to go back to the faster local database. `db:setup` refuses to erase a hosted database without `-- --force`, and the test suites always use their own local database.

| Script | What it does |
|---|---|
| `npm run db:setup` | Wipes the database, applies migrations, seeds sample data (refuses in production; a hosted database needs `-- --force`) |
| `npm run db:migrate` | Applies pending migrations only (use this in production) |
| `npm run db:seed` | Inserts sample data |
| `npm run db:generate` | After editing `db/schema.ts`, creates a new SQL migration in `drizzle/` |
| `npm run db:migrate:prod` | Production migration runner (plain Node; uses `DATABASE_URL_UNPOOLED`, else `DATABASE_URL`) |
| `npm run lti:register` | Registers a Canvas instance + deployment ID (see [docs/CANVAS_SETUP.md](docs/CANVAS_SETUP.md)) |
| `npm run lti:keys` | Generates the production `LTI_PRIVATE_KEY` |

## Checks

```bash
npm run lint        # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck   # tsc (TypeScript 7)
npm test            # Vitest: rules, validation, services, LTI verification, production DB driver
npm run test:e2e    # Playwright against a production build: workflow, LTI launches from a
                    # simulated cross-site Canvas, and WCAG 2.1 AA checks (axe-core) on every page
```

- If `npx playwright install chromium` is blocked on your network, use an installed browser: `PW_CHANNEL=chrome npm run test:e2e` (or `msedge`).
- `npm test` uses a small launcher (`scripts/vitest.mjs`). On Windows, a `c:\` vs `C:\` drive-letter mismatch otherwise makes every test fail with "Vitest failed to find the runner".
- TypeScript: `tsc` runs TypeScript 7 (`@typescript/native`), while the `typescript` package is aliased to the TS 6 API, because typescript-eslint doesn't support TS 7 yet. This is [Microsoft's documented side-by-side setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

## Architecture

```
app/                 Next.js App Router pages, server actions (app/actions.ts), CSV route
  page.tsx           Student hub
  advisor/           Approval queue, per-student view, CSV export
  dev/login/         Development-only stand-in for the Canvas launch
components/          UI (server components; client only where interactive)
  ui/ActionForm.tsx  Form wrapper: pending state, server field errors, toasts
lib/
  curriculum.ts      Static program content (tracks, themes, stage names, limits)
  capstone/rules.ts  Pure business rules (stage gating, hour totals): unit-tested
  capstone/validation.ts  Zod schemas: the server-side source of truth for input
  services/          All reads/writes + authorization; take (db, actor), so they're testable
  auth/session.ts    Signed session cookie (jose), role checks
db/                  Drizzle schema, client, migrations runner, seed
drizzle/             Generated SQL migrations (commit these)
e2e/                 Playwright tests
docs/                Original static HTML prototype
```

**Rules enforced on the server:**
- Advisors can assign any student they can see (theirs or unassigned) to any advisor in the same course, or unassign them. Both people are notified.
- Stage N can be submitted only after stage N−1 is approved, and only while the stage is open or in revision. Writes use conditional updates, so double-submits and simultaneous reviews can't corrupt state.
- Only **approved** hours count toward the requirement. Entries must be 0.5–10 hours in 0.5 steps, and can't be in the future (Eastern time).
- Links must be `http(s)`. Spreadsheet formulas are neutralised in CSV exports.
- Advisors see students assigned to them, plus unassigned students in their course. Nothing from other courses.
- A student can change track only before submitting Stage 1.

**Canvas LTI 1.3** ([lib/lti/](lib/lti/), [app/api/lti/](app/api/lti/)):

| Endpoint | Purpose |
|---|---|
| `/api/lti/login` | OIDC login initiation: stores a single-use state + nonce, redirects to Canvas |
| `/api/lti/launch` | Verifies Canvas's signed `id_token` (JWKS signature, issuer, audience/azp, expiry, nonce, registered deployment), then creates or updates the user, course and role and starts a session |
| `/lti/landing`, `/api/lti/ticket` | If the browser blocks cookies in the iframe, continue in a new tab with a single-use, 2-minute ticket |
| `/api/lti/jwks` | The tool's public key |
| `/api/lti/config` | Canvas Developer Key JSON configuration |
| `/api/health` | Health check for the host |

Canvas roles map to app roles on every launch: Teacher/TA/Designer → advisor, Student → student, everyone else is refused. Emails are never stored. Every response sends `Content-Security-Policy: frame-ancestors` limited to Canvas. Over https, the session cookie is `Secure; SameSite=None; Partitioned`, so it works inside Canvas's cross-site iframe.

**Testing with Canvas from your machine.** Expose `npm run dev` through an https tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`), set `APP_URL` to the tunnel URL, then register the platform with `npm run lti:register`.

## Deploying

Required environment: `DATABASE_URL`, `APP_URL`, `SESSION_SECRET`, `LTI_PRIVATE_KEY`; see [.env.example](.env.example). A production server **refuses to start** if any is missing (`instrumentation.ts`). Host in a **US region**, and confirm hosting with FAMU IT before storing real student data (FERPA).

- **Vercel + hosted Postgres:** [vercel.json](vercel.json) pins the US East region and runs migrations before each build. Point preview deployments at a separate database.
- **Container (FAMU-managed hosting):** [Dockerfile](Dockerfile) builds an image that applies migrations on start. *Not yet test-built: Docker wasn't running on the development machine.*

After deploying, follow [docs/CANVAS_SETUP.md](docs/CANVAS_SETUP.md).

## Roadmap

1. **FAMU beta Canvas:** create the Developer Key, register it, and test with real Canvas accounts.
2. **Manual accessibility pass:** screen reader (NVDA/VoiceOver) and keyboard-only. Automated checks catch only part of WCAG.
3. **LTI Advantage:** roster sync (NRPS) and a gradebook column for verified hours (AGS).
4. **Per-course settings UI** for required hours and the deadline, plus a policy decision on late submissions.
