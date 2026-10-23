# MiniLedger — Complete Local Run & Video Submission Guide 📘

This comprehensive guide walks you through every step to run **MiniLedger** locally from scratch, test its features, and record the exact **2–3 minute video** for your assessment submission.

---

## 📑 Table of Contents
1. [Prerequisites & System Checklist](#1-prerequisites--system-checklist)
2. [Step-by-Step Local Setup](#2-step-by-step-local-setup)
   - [Step 2.1: Start the PostgreSQL Database](#step-21-start-the-postgresql-database)
   - [Step 2.2: Setup & Run the Backend API](#step-22-setup--run-the-backend-api)
   - [Step 2.3: Setup & Run the Mobile App (Expo)](#step-23-setup--run-the-mobile-app-expo)
3. [Testing & Verification Guide](#3-testing--verification-guide)
4. [2–3 Minute Video Recording Playbook](#4-23-minute-video-recording-playbook)
   - [Optimal Recording Screen Layout](#optimal-recording-screen-layout)
   - [Second-by-Second Demo Script & Voiceover](#second-by-second-demo-script--voiceover)
   - [Assessment Rubric Cross-Check](#assessment-rubric-cross-check)
5. [Submission Checklist](#5-submission-checklist)
6. [Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Prerequisites & System Checklist

Ensure the following tools are installed on your system:
- **Node.js**: v20 or higher (`node -v`)
- **Docker Desktop**: Running (`docker info`)
- **Git**: Installed (`git --version`)
- **Expo Go App** installed on your Android or iOS smartphone (from App Store / Google Play Store), **OR** an Android Studio Emulator / Xcode Simulator.

---

## 2. Step-by-Step Local Setup

Open **two separate terminal windows** (Terminal 1 for Backend, Terminal 2 for Mobile).

```
d:\PROJECTS\MiniLedger
├── backend/          -> Express + TypeScript + Prisma
├── mobile/           -> Expo + React Native + TypeScript
└── docker-compose.yml -> PostgreSQL 16
```

---

### Step 2.1: Start the PostgreSQL Database

1. Open **Terminal 1** at the project root (`d:\PROJECTS\MiniLedger`).
2. Start the PostgreSQL container:
   ```bash
   docker compose up -d
   ```
3. Verify that the container is healthy:
   ```bash
   docker ps
   ```
   *You should see `miniledger-postgres` running with port `0.0.0.0:5432->5432/tcp`.*

> **Note**: The container automatically provisions both `miniledger` (development) and `miniledger_test` (test suite) via `init-test-db.sql`.

---

### Step 2.2: Setup & Run the Backend API

In **Terminal 1**:

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Verify or create your `.env` file (copied from `.env.example`):
   ```bash
   # If backend/.env does not exist:
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Seed the database with realistic demo loans:
   ```bash
   npm run seed
   ```
   *This seeds 8 sample loans (2 repaid, 3 upcoming, 3 overdue) for demo user `+919999999999`.*

6. Start the backend development server:
   ```bash
   npm run dev
   ```

7. **Success Check**: You will see the server startup banner:
   ```
   ┌────────────────────────────────────────────────────────────┐
   │                  MiniLedger Backend API                    │
   │                                                            │
   │  Status:   RUNNING                                         │
   │  Host:     http://0.0.0.0:4000                             │
   │  Health:   http://localhost:4000/health                   │
   └────────────────────────────────────────────────────────────┘
   ```
   Keep Terminal 1 open. This terminal will print your **Mock OTP codes** whenever a login is requested!

---

### Step 2.3: Setup & Run the Mobile App (Expo)

In **Terminal 2**:

1. Navigate to the `mobile` folder:
   ```bash
   cd d:\PROJECTS\MiniLedger\mobile
   ```

2. Configure network connection in `mobile/.env`:
   - Find your computer's local Wi-Fi IP address:
     - On Windows PowerShell: `ipconfig` (look for *IPv4 Address*, e.g., `192.168.1.12`).
     - On Mac/Linux: `ifconfig` or `ip a`.
   - Open `mobile/.env` and update `EXPO_PUBLIC_API_URL`:
     ```env
     # If testing on a physical phone with Expo Go (same Wi-Fi):
     EXPO_PUBLIC_API_URL=http://192.168.1.12:4000

     # If testing on Android Emulator:
     # EXPO_PUBLIC_API_URL=http://10.0.2.2:4000

     # If testing on iOS Simulator:
     # EXPO_PUBLIC_API_URL=http://localhost:4000
     ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start Expo:
   ```bash
   npx expo start
   ```

5. Launch the app:
   - **On Physical Device**: Open the **Expo Go** app on your phone, tap **Scan QR Code**, and scan the QR code printed in Terminal 2.
   - **On Android Emulator**: Press `a` in Terminal 2.
   - **On iOS Simulator**: Press `i` in Terminal 2.

---

## 3. Testing & Verification Guide

### 3.1 Running the Automated Test Suite

In a terminal inside `backend/`:
```bash
cd d:\PROJECTS\MiniLedger\backend
npm test
```

### What is tested (26 automated tests):
1. **`money.test.ts`**:
   - Decimal to integer minor unit conversion (`12.34` -> `1234`).
   - Minor unit to decimal currency (`150050` -> `1500.50`).
   - Rejection of negative amounts, NaNs, and >2 decimal places.
2. **`auth.test.ts`**:
   - Generation of 6-digit OTP and HMAC-SHA256 hashing.
   - Attempt rate limiting (blocked after 5 failed tries with `TOO_MANY_ATTEMPTS`).
   - 5-minute TTL expiration check (`OTP_EXPIRED`).
   - Invalidation of older unconsumed OTPs when a new OTP is requested.
   - Single-use consumption (preventing replay attacks).
3. **`loans.test.ts`**:
   - Loan creation with Zod validation.
   - Multipart receipt image upload and URL generation.
   - **Overdue boundary testing**: Loans due *yesterday* are overdue; loans due *today* are NOT overdue; repaid loans are NEVER overdue.
   - User ownership isolation (User B cannot see or repay User A's loans).
   - Atomic status transition with 409 Conflict on double repay.
   - Accurate database sum aggregates (`totalLent`, `totalRepaid`, `overdueAmount`, counts).
4. **`health.test.ts`**:
   - Service uptime and timezone clock checks.

---

## 4. 2–3 Minute Video Recording Playbook

### Optimal Recording Screen Layout

Use **Loom** (recommended), **OBS Studio**, or your OS screen recorder.
Set up a **Split Screen** layout:
- **Left 40% of Screen**: Terminal running the backend dev server (`npm run dev`) so viewers can see the live mock OTP terminal output.
- **Right 60% of Screen**: The mobile app (Phone mirrored via scrcpy / QuickTime, or running inside the Android/iOS emulator).

```
┌─────────────────────────────────┬─────────────────────────────────┐
│        BACKEND TERMINAL         │        MOBILE APP SCREEN        │
│                                 │                                 │
│  [MOCK OTP]                     │     ┌─────────────────────┐     │
│  Phone: +919999999999           │     │    LEDGER SUMMARY   │     │
│  Code:  482910                  │     │ Lent: ₹12,150.50    │     │
│                                 │     │ Repaid: ₹1,650.50   │     │
│                                 │     │ Overdue: ₹4,750.00  │     │
│                                 │     └─────────────────────┘     │
└─────────────────────────────────┴─────────────────────────────────┘
```

---

### Second-by-Second Demo Script & Voiceover

Here is the script you can read while recording:

#### 🎬 0:00 – 0:25 | Introduction & Architecture
- **Action**: Show split screen with backend terminal on the left and mobile app on the right.
- **Voiceover**:
  > *"Hi, this is a demonstration of MiniLedger, a full-stack personal debt and loan tracker. The backend is built with Node.js, TypeScript, PostgreSQL, and Prisma ORM, containerized with Docker. The frontend is a React Native mobile application built with Expo and TypeScript using TanStack Query. Let's log in."*

---

#### 🎬 0:25 – 0:55 | Mock OTP Login Flow
- **Action**:
  1. Show mobile login screen. The phone number defaults to `+919999999999`.
  2. Tap **"Send Mock OTP"**.
  3. Point your mouse cursor to the backend terminal showing the boxed banner:
     `[MOCK OTP] Phone: +919999999999 | Code: XXXXXX`.
  4. Type the 6-digit code into the mobile input and tap **"Verify & Continue"**.
- **Voiceover**:
  > *"The app supports phone login with mock OTP. When I tap 'Send Mock OTP', the backend generates a secure 6-digit code, hashes it with HMAC-SHA256, and prints it in the server terminal logs as required. I'll enter the code from the terminal and verify. The session token is stored securely using Expo SecureStore."*

---

#### 🎬 0:55 – 1:25 | Dashboard & Summary Card
- **Action**:
  1. Point to the top **LEDGER SUMMARY** card.
  2. Read the values: Total Lent, Total Repaid, and Overdue Amount.
  3. Scroll down the list of loans: point out the **red overdue badge** (e.g. *"Overdue by 8 days"*) on overdue loans, and the **amber badge** on upcoming loans.
  4. Tap the **"Overdue"** tab chip to filter down to only overdue items.
- **Voiceover**:
  > *"Here on the home screen, the top summary card displays our total lent, total repaid, and the overdue amount calculated directly in the PostgreSQL database. In the loan list below, loans where the due date is before today are automatically highlighted in red with a relative day counter. We can also filter the list with these top tabs: All, Pending, Overdue, and Repaid."*

---

#### 🎬 1:25 – 2:05 | Adding a Loan with Receipt (Bonus Feature)
- **Action**:
  1. Tap the **"+ Add"** button in the header to open the bottom sheet modal.
  2. Enter Friend Name: `Rajat Kapoor`.
  3. Enter Amount: `1500`.
  4. Tap the **"+1 Week"** date preset button (or select date).
  5. Enter Notes: `Weekend dinner split`.
  6. Tap **"Select Receipt Photo"** and choose an image from your gallery/camera.
  7. Tap **"Save Loan Entry"**.
  8. Show the new loan appear at the top of the list with a **Receipt** button.
  9. Tap the **"Receipt"** button to open the fullscreen image preview modal, then close it.
- **Voiceover**:
  > *"Now let's add a new loan entry. I'll enter the friend's name, amount, select a due date using the quick preset chips, add an optional note, and attach a receipt photo. When I hit save, the app uploads the image as multipart data to the backend. The new entry appears immediately in our ledger, and tapping the receipt badge opens a full-screen preview."*

---

#### 🎬 2:05 – 2:30 | Instant Repayment & Live Summary Update
- **Action**:
  1. Focus on the top summary card (observe the numbers).
  2. Find an active loan (e.g., Vikram Singh for ₹3,500).
  3. Tap **"Mark Repaid"**.
  4. Notice the button flips to a green *"Paid"* confirmation.
  5. Point to the **Summary Card at the top** updating instantly:
     - Total Repaid increases.
     - Overdue / Pending decreases.
- **Voiceover**:
  > *"Now let's test repayment. When I tap 'Mark Repaid' on Vikram's loan, the backend performs an atomic update with conflict protection. TanStack Query automatically invalidates the query cache, and as you can see, our summary card at the top updates instantaneously without needing a manual page reload."*

---

#### 🎬 2:30 – 2:50 | Automated Tests & Conclusion
- **Action**:
  1. Bring the terminal to the foreground.
  2. Type `npm test` and press Enter.
  3. Show all 26 tests passing in green across the 4 test suites.
- **Voiceover**:
  > *"Finally, let's look at the automated tests. Running 'npm test' executes 26 unit and integration tests with Jest and Supertest, covering minor-unit currency calculations, mock OTP lifecycles, overdue boundaries, and ownership security. All 26 tests pass cleanly. Everything is committed to GitHub with a detailed README. Thank you!"*

---

### Assessment Rubric Cross-Check

Before submitting, verify that every item from the assessment prompt is visible in your video:

| Rubric Requirement | Where it appears in the video | Timecode |
|---|---|---|
| **Phone number login with mock OTP** | Login screen -> terminal output -> dashboard | `0:25 - 0:55` |
| **Print OTP in server log** | Boxed banner visible in terminal | `0:35` |
| **Add loan entry (name, amount, due date)** | "+ Add" modal form | `1:25 - 1:45` |
| **Highlight overdue entries** | Red card borders & alert pills | `1:00` |
| **Summary card (Total lent, repaid, overdue)** | Top dashboard card | `0:55 & 2:15` |
| **Mark loan as repaid** | "Mark Repaid" button click | `2:10` |
| **Summary dynamically updates** | Summary numbers change on repay | `2:15` |
| **Bonus: Receipt photo upload** | Camera/Gallery picker & viewer | `1:40 - 2:00` |
| **Bonus: Input validation & tests** | `npm test` passing in terminal | `2:30 - 2:45` |

---

## 5. Submission Checklist

1. **GitHub Link**:
   - URL: `https://github.com/AgrShubham/MiniLedger`
   - Ensure the repository visibility is set to **Public** so reviewers can access it.
2. **Video Link**:
   - If using **Loom**: Copy the share link.
   - If using **Google Drive**: Right-click the video file -> Share -> Change to **"Anyone with the link can view"** (Important: avoid access request delays).
3. **Submission Message Template**:
   ```markdown
   Hello,

   Here is my submission for the MiniLedger assessment:
   - GitHub Repository: https://github.com/AgrShubham/MiniLedger
   - Video Walkthrough (2-3 min): [INSERT_YOUR_LOOM_OR_DRIVE_LINK_HERE]

   Summary of implementation:
   - Backend: Node.js, TypeScript, PostgreSQL (Docker), Prisma ORM, Zod, JWT.
   - Mobile: React Native (Expo + TypeScript), TanStack Query, SecureStore.
   - Features: Mock OTP terminal authentication, Ledger summary aggregates, Overdue highlights, Atomic repayment transitions, Receipt photo uploads, and 26 automated tests (Jest + Supertest).

   Thank you for your review!
   ```

---

## 6. Troubleshooting & FAQs

### Q1: The mobile app says "Network Error" or "Failed to fetch" on login.
- **Cause**: The mobile phone cannot reach the backend server over your Wi-Fi.
- **Fix**:
  1. Check your computer's IP address with `ipconfig`.
  2. In `mobile/.env`, make sure `EXPO_PUBLIC_API_URL` uses that exact IP (e.g. `http://192.168.1.12:4000`), **not** `localhost`.
  3. Ensure both your computer and your phone are on the **same Wi-Fi network**.
  4. Ensure Windows Firewall is not blocking port 4000 (allow Node.js through private networks).

### Q2: Port 5432 is already in use when running Docker.
- **Cause**: An existing PostgreSQL service or container is running.
- **Fix**: Check running containers with `docker ps` and stop the conflicting service, or change the host port in `docker-compose.yml` to `5433:5432` and update `DATABASE_URL` in `backend/.env`.

### Q3: How do I re-seed or reset the database?
- Run `cd backend && npm run seed`. The seed script is completely idempotent and resets the demo user's loans cleanly.

### Q4: How do I reset tests?
- Simply run `cd backend && npm test`. The test suite automatically cleans up its test database before and after runs.
