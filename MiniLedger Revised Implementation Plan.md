# MiniLedger: Revised Implementation Plan

A leaner, correctness-first rewrite of the original assessment plan. One target platform (Expo on a phone or emulator), one Postgres container, and a thin vertical slice built first so integration problems surface on day one.

## 1. Guiding Principles

- Working, tested, and clearly explained beats polished but fragile.
- One target: native via Expo Go or an emulator. No web build.
- Build in vertical slices. Every step ends with something runnable end to end.
- Decide the tricky rules once (money, dates, overdue, OTP) and write them in the README.
- Name the trade-offs openly. It shows engineering judgment.

## 2. Scope

**Must have**

- Phone + mock OTP login (OTP printed in the server log), JWT session.
- Add a loan (friend name, amount, due date) and mark it repaid.
- Summary endpoint: total lent, total repaid, overdue amount.
- App: login screen, list with overdue highlighted, add form, summary card on top.
- README with run instructions, and a 2–3 minute screen recording.

**Should have**

- Receipt photo upload.
- Zod validation on every input.
- Automated tests for the core rules.
- Seed script, filter tabs (All / Pending / Overdue / Repaid), pull-to-refresh.

**Explicitly out of scope** (list these in the README as future work)

- Theme switching, animations, skeleton loaders, country-code picker, web build.
- Real SMS provider, refresh tokens, pagination, rate limiting, cloud file storage.

## 3. Stack

**Backend:** Node 20+, TypeScript, Express, Prisma + PostgreSQL 16 (Docker Compose), Zod, jsonwebtoken, multer, Jest + ts-jest + Supertest.

**Mobile:** Expo (TypeScript), React Navigation (native stack), TanStack Query, axios (fetch for the multipart upload), expo-secure-store, expo-image-picker, @react-native-community/datetimepicker.

**Tooling rule:** pin the exact Prisma and Expo SDK versions you tested, and commit the `prisma/migrations` folder. Newer Prisma majors changed configuration, so follow the docs for the version you install.

## 4. Decisions Made Up Front

### Money

- Store amounts as integer minor units (`amountMinor`, paise or cents). No floats, no Decimal serialization surprises.
- The API accepts and returns `amount` as a plain number with at most 2 decimals. Conversion happens in one small `money.ts` util with its own unit tests.
- Sums are computed in the database with `aggregate`, not in JavaScript.

### Dates and overdue

- `dueDate` is a date-only column (`@db.Date`), sent as `YYYY-MM-DD`. This avoids timezone drift.
- **Overdue rule:** `status = PENDING AND dueDate < today`. A loan due today is not overdue.
- "Today" comes from an injectable clock, using a configured timezone (`APP_TZ`, default `Asia/Kolkata`). Document this in the README.
- The server returns `isOverdue` on every loan. The app uses it for highlighting and does not recompute it.

### OTP and auth

- Generate 6-digit codes with `crypto.randomInt`. TTL 5 minutes.
- Store an HMAC of the code, not the code itself.
- Single use. A new send invalidates older unconsumed codes for that phone. Maximum 5 verify attempts per code.
- Normalize and validate phone numbers as E.164 (for example `+919999999999`).
- Print the code in a boxed server log line. An optional `MOCK_OTP_FIXED` env var forces a known code for demos and tests. It is off by default and ignored when `NODE_ENV=production`.
- JWT (HS256) with a 7-day expiry and the user id in `sub`. The server refuses to start if `JWT_SECRET` is missing.

### Repay semantics

- Ownership is enforced in the query: `updateMany({ where: { id, userId, status: 'PENDING' }, data: { status: 'REPAID', repaidAt: now } })`.
- If the count is 0, look the loan up by `id` and `userId`. Not found (or someone else's) returns 404, never 403. Already repaid returns 409 `ALREADY_REPAID`.

### Receipts

- multer with a 5 MB limit, a mimetype allowlist (jpeg, png, webp), and a random UUID filename. The original filename is never trusted.
- The database stores a relative path. The API returns `/uploads/<file>`, and the app prefixes its own base URL.
- Files are served publicly by unguessable name. State this as a known trade-off in the README.

### Errors

Every error uses one shape: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`. A single error-handling middleware maps Zod errors, multer errors, and known domain errors to it.

## 5. Data Model

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  phone     String   @unique
  createdAt DateTime @default(now())
  loans     Loan[]
}

model Otp {
  id         String    @id @default(uuid())
  phone      String
  codeHash   String
  expiresAt  DateTime
  attempts   Int       @default(0)
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  @@index([phone, createdAt])
}

enum LoanStatus {
  PENDING
  REPAID
}

model Loan {
  id          String     @id @default(uuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  friendName  String
  amountMinor Int
  dueDate     DateTime   @db.Date
  status      LoanStatus @default(PENDING)
  repaidAt    DateTime?
  receiptPath String?
  notes       String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([userId, status])
  @@index([userId, dueDate])
}
```

Note: the `Otp` table is deliberately not linked to `User`, because the user may not exist until the first successful verification.

## 6. API Specification

All `/api/loans*` routes require `Authorization: Bearer <token>`.

### Auth

- **POST `/api/auth/send-otp`**: body `{ phone }`. Returns `{ success: true }` and prints the code to the server log.
- **POST `/api/auth/verify-otp`**: body `{ phone, code }`. On success, upserts the user and returns `{ token, user: { id, phone } }`. Errors: `OTP_INVALID`, `OTP_EXPIRED`, `TOO_MANY_ATTEMPTS`.

### Loans

- **POST `/api/loans`**: JSON or `multipart/form-data` with `friendName` (1–80 chars), `amount` (> 0, max 2 decimals), `dueDate` (`YYYY-MM-DD`), optional `notes`, optional `receipt` file. Returns 201 with the loan. With multipart, fields arrive as strings, so use `z.coerce.number()` and validate the date string explicitly.
- **GET `/api/loans`**: query `status=PENDING|REPAID|OVERDUE` and optional `sort`. Default order is pending first, then `dueDate` ascending (the enum is declared PENDING before REPAID, so ordering by status works). Each loan includes `isOverdue`.
- **PATCH `/api/loans/:id/repay`**: see repay semantics above. Returns the updated loan.
- **GET `/api/loans/summary`**: returns `totalLent`, `totalRepaid`, `totalPending`, `overdueAmount`, and `counts { total, repaid, pending, overdue }`.

**Route order matters:** register `/summary` before `/:id` routes.

**Loan response shape**

```json
{
  "id": "uuid",
  "friendName": "Aman",
  "amount": 1500.5,
  "dueDate": "2026-11-05",
  "status": "PENDING",
  "isOverdue": false,
  "repaidAt": null,
  "receiptUrl": "/uploads/3f2a....jpg",
  "notes": null,
  "createdAt": "2026-10-23T09:00:00.000Z"
}
```

## 7. Backend Structure

```
backend/
  prisma/ (schema.prisma, migrations/, seed.ts)
  src/
    app.ts            // builds the Express app, does NOT listen
    server.ts         // imports app, calls listen
    config/env.ts     // Zod-validated env, fails fast
    lib/ (prisma.ts, clock.ts, money.ts, errors.ts)
    middleware/ (auth.ts, validate.ts, upload.ts, errorHandler.ts)
    modules/
      auth/  (routes, controller, service, schemas)
      loans/ (routes, controller, service, schemas, serializer)
  tests/
  uploads/ (.gitkeep; contents gitignored)
docker-compose.yml     // postgres + a second database for tests
.env.example
```

Keep the layers thin: routes wire middleware, controllers parse and respond, services hold the rules and talk to Prisma.

## 8. Mobile App

### Structure

```
mobile/
  App.tsx              // QueryClientProvider, AuthProvider, navigation
  src/
    api/ (client.ts, auth.ts, loans.ts)
    context/AuthContext.tsx
    screens/ (LoginScreen.tsx, HomeScreen.tsx, AddLoanScreen.tsx)
    components/ (SummaryCard, LoanCard, FilterTabs, EmptyState, ErrorState)
    utils/ (format.ts, theme.ts)
```

### Screens

- **Login:** two steps on one screen. Phone input, then a 6-digit code input. Show a short assessment hint: "OTP is printed in the server terminal." No animation needed.
- **Home:** summary card on top (Total Lent, Repaid, Overdue), filter tabs, a `FlatList` of loan cards with pull-to-refresh, and a floating add button.
- **Add loan:** a modal screen with name, amount, date picker, optional notes, and an optional receipt picker with a thumbnail preview. Inline validation messages.
- **Loan card:** avatar initials, formatted amount, a relative due label ("Due in 3 days", "Overdue by 5 days"), a red style when `isOverdue`, a receipt icon that opens a simple full-screen image modal, and a one-tap "Mark repaid" button.

### State and data

- TanStack Query holds `loans` (keyed by filter) and `summary`. After adding or repaying, call `invalidateQueries` on both, so the summary card updates right after "Mark repaid". This is the key moment in the video.
- Store the JWT with `expo-secure-store`. On a 401 from any call, clear it and return to Login.
- Handle loading, empty, and error states on Home, plus form validation errors on Add.

### Networking (common time sink)

- Read the base URL from `EXPO_PUBLIC_API_URL`.
- Physical device: use your computer's LAN IP, for example `http://192.168.x.x:4000`. Android emulator: `http://10.0.2.2:4000`. iOS simulator: `http://localhost:4000`.
- The backend must listen on `0.0.0.0`.
- Document all three cases in the README and in `mobile/.env.example`.

### Receipt upload in React Native

- Append the file as `{ uri, name, type }` to `FormData`.
- Do not set the `Content-Type` header manually, or the multipart boundary breaks. Using `fetch` for this one call is often more reliable than axios.
- Test the picker on iOS and confirm which mimetype it returns, then make sure the backend allowlist matches.

## 9. Build Order (Thin Vertical Slices)

**Step 0: Scaffolding** Repo layout, `docker-compose.yml`, `.env.example`, backend skeleton (`app.ts` / `server.ts` split, env validation, `/health`), first Prisma migration. *Done when:* `docker compose up -d` and `npm run dev` give a healthy `/health`.

**Step 1: Auth slice (backend + mobile)** OTP service, send/verify endpoints, JWT middleware, Login screen, secure token storage, logout. *Done when:* a real phone or emulator logs in using the OTP from the terminal, and the session survives an app restart. This is where networking problems get fixed.

**Step 2: Loans slice** Create, list, repay on the backend, then the list, add form, and repay button in the app. Overdue highlighting included. *Done when:* you can add a loan, see it, mark it repaid, and see an overdue loan in red.

**Step 3: Summary slice** Summary endpoint, summary card, query invalidation. *Done when:* the card updates immediately after repaying a loan.

**Step 4: Receipts** Upload middleware, static serving, picker in the form, thumbnail and viewer. *Done when:* a photo attached on the phone shows up on the card.

**Step 5: Tests** See the next section. *Done when:* `npm test` passes from a clean database.

**Step 6: Seed, README, video** Seed script, README, rehearsal, final recording.

**Step 7: Polish (only if time remains)** Skeleton loaders, receipt zoom, small UI refinements.

## 10. Testing Plan

**Setup**

- Jest + ts-jest + Supertest, importing `app` directly (no `listen`).
- A separate `miniledger_test` database. Run `prisma migrate deploy` in global setup and truncate tables between tests.
- Inject the clock and the OTP generator so tests are deterministic.

**Highest-value tests**

- **Money util:** `12.34` becomes 1234 and back, rounding cases, rejection of more than 2 decimals.
- **Summary math:** totals and counts across a mix of repaid, pending, and overdue loans.
- **Overdue boundary:** due yesterday is overdue, due today is not, repaid loans are never overdue.
- **Ownership isolation:** user A cannot list or repay user B's loans (404).
- **Repay:** success sets `repaidAt`; a second call returns 409.
- **Validation:** negative amount, zero, bad date, empty name, bad phone.
- **OTP:** wrong code, expired code, reuse of a consumed code, attempt limit, and a new send invalidating the old code.
- **Auth guard:** missing or invalid token returns 401.

## 11. Seed Script

`npm run seed` creates a demo user (for example `+919999999999`) and about 8 loans: 2 repaid, 3 upcoming, 3 overdue. Due dates are computed relative to today so the overdue items stay overdue. The script is idempotent (it clears the demo user's loans first).

## 12. README Outline

1. One-paragraph description and a screenshot or GIF.
2. Prerequisites with versions (Node, Docker, Expo Go).
3. Setup in 3–5 copy-paste commands: start Postgres, install, migrate, seed, run the backend, run the app.
4. Environment variables, and the networking table (device, Android emulator, iOS simulator).
5. How to log in: the demo phone number, and where to find the OTP in the server log.
6. API table with curl examples.
7. Business rules: overdue definition, money handling, timezone.
8. How to run tests.
9. **Design decisions and what I'd do next:** real SMS provider, hashed OTPs with rate limiting, refresh tokens, object storage for receipts with signed URLs, pagination, CI pipeline.

## 13. Video Script (target 2:45)

- **0:00–0:15** Intro. Terminal shows Docker Postgres and the backend running.
- **0:15–0:40** Enter the phone number, show the OTP in the server log, enter it, land on the dashboard.
- **0:40–1:05** Explain the summary card and the seeded loans.
- **1:05–1:45** Add a loan with a due date and a receipt photo. Show it in the list and open the receipt.
- **1:45–2:05** Show overdue items in red and use the filter tabs.
- **2:05–2:30** Mark a loan repaid and watch the summary card update.
- **2:30–2:50** Run `npm test` and show it passing.
- **2:50–3:00** Point to the README and the trade-offs section.

Rehearse once, pre-seed the data, and keep typing to a minimum.

## 14. Risks and Mitigations

- **Device cannot reach the API:** use the LAN IP, bind to `0.0.0.0`, and test this in Step 1.
- **Multipart upload fails silently:** do not set `Content-Type` manually, use the `{ uri, name, type }` shape, and test on a real device early.
- **Timezone off-by-one on due dates:** date-only column, injected clock, and explicit boundary tests.
- **Prisma setup differs by version:** pin the version and commit migrations.
- **Scope creep:** anything in the "out of scope" list waits until Step 7.
- **Flaky tests:** isolated test database, truncation between tests, no real clock.

## 15. Submission Checklist

- [ ] GitHub repo with `/backend` and `/mobile`, clean history, no secrets committed.
- [ ] `.env.example` in both folders.
- [ ] Migrations committed, seed script working.
- [ ] README covers setup, OTP login, API, rules, tests, and trade-offs.
- [ ] `npm test` passes on a fresh clone.
- [ ] 2–3 minute video (Loom or Google Drive) with link permissions set to viewable.
- [ ] Tested the full flow once from a clean clone before submitting.
