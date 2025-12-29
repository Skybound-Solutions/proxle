# Next Version Plan: Phrasle v2.0

## Overview
This plan outlines the roadmap for the next major version of Phrasle (Proxle). The focus is on user retention through account persistence, gamification (stats/streaks), and administrative oversight.

## 1. Google OAuth & User Accounts

### Architecture
- **Tech**: Firebase Authentication (Google Provider).
- **Implementation**:
  - Initialize `Auth` in `src/firebase.ts`.
  - Create a `UserContext` or use `react-firebase-hooks` to manage session state.
  - Add a "Sign In with Google" button in the header.
  - **Guest Mode**: Users can still play without signing in. Stats are stored in `localStorage` until they sign in, at which point valid local stats are merged into their cloud profile (optional complexity, or start fresh).

### Complexity: **Low**
Firebase Auth is "batteries-included". 
- **Time**: ~1-2 hours.
- **Risk**: Low.

### Costs: **Free**
- Firebase Identity Platform is free for the first 50,000 Monthly Active Users (MAUs).
- Google Sign-In is included in the free tier.

---

## 2. Records, Streaks, and Fun Stats

### Architecture
- **Tech**: Cloud Firestore (NoSQL Database).
- **Data Model**:
  - Collection: `users`
  - Document ID: `userId` (from Auth) or `deviceId` (if we want anonymous cloud stats, but stick to Auth for now).
  - Fields:
    - `totalGames`: number
    - `wins`: number
    - `currentStreak`: number
    - `maxStreak`: number
    - `lastWinDate`: timestamp (for streak calculation)
    - `guessDistribution`: { 1: 0, 2: 4, 3: 10, ... } (Histogram data)

### Logic
1. **Game End**:
   - If User is Signed In: Trigger a Firestore write to update stats.
   - Logic: Increment games/wins. Check `lastWinDate`. If yesterday, increment streak. If older, reset streak to 1. Update max streak if needed.
2. **UI**:
   - New "Bar Chart" icon in header.
   - Modal showing:
     - Big "Streak" fire icon.
     - Win % (Wins / Total).
     - Guess Distribution Bar Chart (Wordle style).

### Complexity: **Medium**
Requires robust logic to handle dates (timezones!) correctly for streaks.
- **Time**: ~3-4 hours.
- **Risk**: Low (isolated feature).

### Costs: **Very Low**
- Firestore Free Tier:
  - 50,000 Reads / day
  - 20,000 Writes / day
- **Scenario**: If you have 1,000 users playing 1 game/day:
  - 1,000 reads (load stats) + 1,000 writes (save stats) = Well within free tier.

---

## 3. Local Admin Dashboard

### Concept
A "Command Center" for you to monitor the app's health and business metrics. 

### Architecture
- **Location**: A protected route in your app (e.g., `/admin`) or a separate local-only tool.
- **Security**: 
  - **Option A (Simple)**: Check if `user.email === 'your-email@gmail.com'` in the code.
  - **Option B (Secure)**: Set Custom Claims on your user account to `role: admin` and verify in Security Rules.
- **Features**:
  1. **User Stats**: Query `users` collection for total count.
  2. **Billing/Income**: 
     - *Note*: Firebase does not provide an API to read your bill programmatically easily without setting up BigQuery exports.
     - **Solution**: A "Links" widget that opens the specific Firebase Usage page and Ko-Fi Dashboard.
     - **Manual Tracking**: A simple input form where you log "Income this month" and it saves to a `stats/admin` document, then graphs it.
  3. **API Key Usage**:
     - *Note*: Gemini API usage is best viewed in Google Cloud Console.
     - **Solution**: Embed Google Cloud Monitoring charts (iframe) or link to them.

### Complexity: **Medium**
Building a good dashboard is time-consuming (UI work). 
- **Time**: ~4-6 hours.
- **Risk**: Medium (Security - must ensure regular users can't access it).

### Costs: **Negligible**
- Hosting is part of the main app.
- Reads/Writes are minimal (only you using it).

---

## Summary of Estimated Efforts

| Feature | Complexity | Est. Dev Time | recurring Cost (approx) |
| :--- | :--- | :--- | :--- |
| **Google Auth** | Low | 2 hrs | $0 (up to 50k users) |
| **Stats & Streaks** | Medium | 4 hrs | $0 (Free Tier likely covers it) |
| **Admin Dashboard** | Medium | 5 hrs | $0 |
| **Total** | | **~1-2 Days** | **$0** (Growth dependent) |

## Next Steps to Execute
1. **Enable Authentication** in Firebase Console.
2. **Enable Firestore** in Firebase Console.
3. **Update Code**:
   - `firebase.ts`: Add Auth/Firestore.
   - `App.tsx`: Add Login Logic.
   - Components: Build Stats Modal & Admin Page.
