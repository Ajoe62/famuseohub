# FAMU-SOE Capstone and Lab Hub

A tool for the FAMU School of the Environment capstone program, built to be embedded in Canvas via **LTI 1.3**.

- **Students** choose a capstone track (Flagship or Project) and submit four stages in order: Topic Selection → Research Proposal → Completed Project → Presentation Deck. They also log lab and field hours toward the 50-hour requirement.
- **Faculty advisors** approve each stage or request a revision. Approving a stage unlocks the next one. Advisors also verify or return each lab-hour entry, and can export verified hours as CSV.
- Every decision is recorded with who made it and when (`reviews` table). Both sides get in-app notifications.

> **Status:** the workflow, database, sessions and tests are complete. **The Canvas LTI launch is not built yet.** Until it is, use the development login at `/dev/login`. See [Roadmap](#roadmap).

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

| Script | What it does |
|---|---|
| `npm run db:setup` | Wipes the local database, applies migrations, seeds sample data (refuses when `NODE_ENV=production`) |
| `npm run db:migrate` | Applies pending migrations only (use this in production) |
| `npm run db:seed` | Inserts sample data |
| `npm run db:generate` | After editing `db/schema.ts`, creates a new SQL migration in `drizzle/` |

## Checks

```bash
npm run lint        # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck   # tsc (TypeScript 7)
npm test            # Vitest: business rules, validation, services against in-memory Postgres
npm run test:e2e    # Playwright: full student/advisor story against a production build
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
- Stage N can be submitted only after stage N−1 is approved, and only while the stage is open or in revision. Writes use conditional updates, so double-submits and simultaneous reviews can't corrupt state.
- Only **approved** hours count toward the requirement. Entries must be 0.5–10 hours in 0.5 steps, and can't be in the future (Eastern time).
- Links must be `http(s)`. Spreadsheet formulas are neutralised in CSV exports.
- Advisors see students assigned to them, plus unassigned students in their course. Nothing from other courses.
- A student can change track only before submitting Stage 1.

**Embedding in Canvas.** Every response sends `Content-Security-Policy: frame-ancestors 'self' https://*.instructure.com`. In production, the session cookie is `Secure; SameSite=None; Partitioned`, so it works inside Canvas's cross-site iframe.

## Deploying

Required environment: `DATABASE_URL` and `SESSION_SECRET`; see [.env.example](.env.example). Run `npm run db:migrate` on each deploy. Host in a **US region**, and confirm hosting with FAMU IT before storing real student data (FERPA).

## Roadmap

1. **LTI 1.3 launch.** Add `/api/lti/login`, `/api/lti/launch` (verify the Canvas `id_token` against Canvas's JWKS, check nonce and state), and `/api/lti/jwks`. Then upsert `users`/`courses`/`memberships` from the claims and call `createSession()`. Map LTI roles: Instructor/TA → advisor, Learner → student. Test against saLTIre, then FAMU's beta Canvas.
2. **LTI Advantage.** Roster sync (NRPS) and a gradebook column for verified hours (AGS).
3. **Advisor assignment UI** (today it's set in the database), plus per-course settings for required hours and the deadline.
4. **Accessibility audit** (WCAG 2.1 AA) before the pilot.
