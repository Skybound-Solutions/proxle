# Proxle v2: Definitive Feature Roadmap

## 1. Core User Experience (Authentication)
**Goal:** Seamless sign-in and cross-device syncing.

- **Google OAuth Integration:** Secure sign-in using Firebase Auth.
- **Profile Header:** Avatar w/ dropdown menu (Stats, Settings, Sign Out).
- **First-Time User Experience (FTUE):**
  - Auto-open Info modal for new visitors.
  - "Save Your Streak" prompt appears after a guest wins their first game.
- **Data Sync:** Game state, history, and stats sync across all devices.

## 2. Stats & Progression
**Goal:** Retention through achievement tracking.

- **Personal Statistics:**
  - Games Played, Wins, Losses, Win Rate %.
  - **Current Streak** & **Max Streak**.
  - **Guess Distribution** (Bar chart of guesses needed to win).
- **Cloud Firestore Storage:** Secure, scalable storage for user records.
- **Enhanced Sharing:** "Share Result" button copies text with `🔥 Streak: X` appended.

## 3. Donations & Leaderboard ("Humble Bundle Style")
**Goal:** Monetization through community status and "competitive altruism".

- **Donation Processing:** Ko-fi webhook listener to automate tracking.
- **Public Leaderboard (`/supporters`):**
  - **Ranking:** Sorted by **Total Amount Donated**.
  - **Filters:** [All Time] | [Last 90 Days] | [Last 30 Days].
  - **Custom Messages:** Donors can write a short message (e.g., "Thanks dev!").
- **Privacy Controls:**
  - Opt-in required.
  - Granular visibility: Hide Amount, Hide Name (Anonymous).
- **Admin Tools:**
  - **Approval Queue:** Manual review of all names/messages before publishing.
  - **Manual Linking:** Link donation email A to user account email B.

## 4. Admin Dashboard & Privacy
**Goal:** Management, compliance, and metrics.

- **Secure Route (`/admin`):** Email-restricted access.
- **Metrics Overview:**
  - Daily Active Users (DAU).
  - Revenue (MoM) vs. Estimated Costs.
- **User Management:**
  - User Search (by email/name).
  - View individual player stats/history.
- **GDPR / Privacy Tools:**
  - **Data Export:** Generate JSON file of all user data.
  - **Account Deletion:** Permanently wipe user & anonymize donation record.
  - **Data Correction:** Manual edit rights for admin.

## 5. Implementation Phases

### Phase 1A: Auth & Core (Week 1)
- Firebase Auth setup
- Profile Menu UI
- Firestore User Schema
- FTUE Logic

### Phase 1B: Stats System (Week 2)
- Streak calculation logic
- Stats Modal UI
- Enhanced Sharing
- Leaderboard Foundation

### Phase 1C: Admin & Privacy (Week 2-3)
- Admin Dashboard UI
- User Search
- GDPR Tools (Export/Delete)

### Phase 2: Donations & Leaderboard (Week 3-4)
- Ko-fi Webhook Cloud Function
- Leaderboard UI (Tabs, List, Filters)
- Donation Settings UI
- Approval Workflow

## 6. Budget & Projections
- **Target:** 5-6 Supporters @ $5/mo to break even.
- **Strategy:** Focus on "Whale" donors via Leaderboard (All-Time & 30-Day visibility).
