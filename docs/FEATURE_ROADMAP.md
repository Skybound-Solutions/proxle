# Proxle Feature Roadmap: OAuth & Beyond

## 🎯 Vision

Transform Proxle from a casual daily puzzle into a **persistent, engaging social experience** where players:
- Track their progress and streaks
- Compete on leaderboards
- Support the game they love
- Build a community around word-guessing mastery

---

## 📊 User Stats: What to Track

### Core Game Stats (Phase 1)
```typescript
interface UserStats {
  // Identity
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
  
  // Game Performance
  totalGames: number;              // All games played
  totalWins: number;               // Successfully solved
  totalLosses: number;             // Gave up / failed
  winRate: number;                 // Calculated: wins / totalGames
  
  // Streaks
  currentStreak: number;           // Consecutive days won
  maxStreak: number;               // Best ever streak
  lastPlayedDate: string;          // ISO date for streak calculation
  
  // Guess Distribution (Wordle style)
  guessDistribution: {
    1: number,  // Wins in 1 guess
    2: number,
    3: number,
    4: number,
    5: number,
    6: number,
    7: number,
    '8+': number
  };
  
  // Account Meta
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}
```

### Advanced Stats (Phase 2)
```typescript
interface AdvancedStats {
  // Efficiency Metrics
  averageGuesses: number;          // Mean guesses per win
  medianGuesses: number;           // Median guesses per win
  perfectGames: number;            // 1-guess wins
  
  // Semantic Performance
  averageSimilarityScore: number;  // How close guesses typically are
  semanticImprovementRate: number; // Getting better over time?
  
  // Engagement
  daysPlayed: number;              // Total unique days
  longestSession: number;          // Most guesses in one game
  favoriteStartWord: string;       // Most common first guess
  
  // Social
  shareCount: number;              // Times shared results
  donationTotal: number;           // USD donated (if linked)
  donationCount: number;           // Number of donations
  
  // Achievements (unlockable badges)
  achievements: string[];          // ["first_win", "week_streak", "semantic_master"]
}
```

### Per-Game History (Optional - Phase 3)
Store individual game records for replay/analysis:
```typescript
interface GameRecord {
  gameId: string;                  // Date-based: "2024-12-29"
  userId: string;
  guesses: {
    word: string;
    similarity: number;
    letterStatus: LetterStatus[];
    timestamp: Timestamp;
  }[];
  outcome: 'win' | 'loss';
  finalGuessCount: number;
  completedAt: Timestamp;
}
```

**Storage Consideration:** 
- Phase 1 stats only: ~1KB per user
- With full history: ~10KB per user (if playing daily for a year)
- 10,000 users = ~100MB = well within Firestore free tier

---

## 🎨 UI/UX Enhancements

### Phase 1A: Authentication & Profile

#### Upper Right Profile Menu
```
┌─────────────────────────────────────────┐
│  PROXLE            ☕         [@] [🔄]  │  ← [@] = Profile Avatar
└─────────────────────────────────────────┘

Click Avatar → Dropdown Menu:
┌──────────────────────────────┐
│  👤 John Doe                 │
│     john@gmail.com           │
├──────────────────────────────┤
│  📊 My Stats                 │  ← Opens stats modal
│  🏆 Achievements (Phase 2)   │
│  ⚙️  Settings (Future)       │
├──────────────────────────────┤
│  🚪 Sign Out                 │
└──────────────────────────────┘
```

**Implementation:**
- Use `framer-motion` for smooth dropdown animation
- Avatar from Google `photoURL`
- Dropdown closes on outside click
- Mobile: Full-screen modal instead of dropdown

---

#### First-Time User Experience (FTUE)

**Problem:** Users don't click the ℹ️ icon.

**Solution:** Auto-show on first visit
```typescript
// In App.tsx
const [showInfo, setShowInfo] = useState(false);

useEffect(() => {
  const hasSeenIntro = localStorage.getItem('proxle_has_seen_intro');
  
  if (!hasSeenIntro) {
    setShowInfo(true);
    localStorage.setItem('proxle_has_seen_intro', 'true');
  }
}, []);
```

**Enhanced FTUE Flow:**
1. User visits site → Info modal auto-opens
2. Info modal shows:
   - **How to Play**
   - **Sign In CTA** (prominent button)
   - Privacy/Terms links (bottom)
3. User can dismiss or play as guest
4. If signed in, show **Welcome Modal** with personalized message

---

### Phase 1B: Stats Modal

Click "My Stats" → Full-screen overlay:

```
┌─────────────────────────────────────────────────┐
│  📊 Your Stats                          [Close] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Games Played        Win Rate        Streak    │
│      ███                ███            🔥       │
│       42               90%              7       │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Guess Distribution                             │
│   1 ▮ 2                                         │
│   2 ▮▮▮▮▮▮▮▮ 15                                │
│   3 ▮▮▮▮▮▮▮▮▮▮▮▮ 20  ← Most common            │
│   4 ▮▮▮▮▮ 8                                    │
│   5 ▮▮ 3                                        │
│   6+ ▮ 1                                        │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  🏆 Max Streak: 12 days (Dec 15 - Dec 27)      │
│  🎯 Average Guesses: 3.2                        │
│  ⚡ Perfect Games: 2                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Design Notes:**
- Use gradient bars for guess distribution
- Animate numbers on open (count-up effect)
- Show comparison to global average (Phase 2)
- Export as image feature (Phase 2)

---

### Phase 1C: Enhanced Sharing

**Current Share:**
```
Proxle 5/5

⬛⬛🟨⬛⬛ 12%
🟨🟨⬛⬛⬛ 34%
🟩🟨🟨⬛⬛ 67%
🟩🟩🟩🟨⬛ 89%
🟩🟩🟩🟩🟩 100%

Play Proxle: https://proxle.app
```

**Enhanced Share (with streak):**
```
Proxle 5/5 🔥7

⬛⬛🟨⬛⬛ 12%
🟨🟨⬛⬛⬛ 34%
🟩🟨🟨⬛⬛ 67%
🟩🟩🟩🟨⬛ 89%
🟩🟩🟩🟩🟩 100%

7-day streak! | Play: https://proxle.app
```

**Advanced (Phase 2):**
```
Proxle 3/5 🔥12 ⭐

⬛⬛🟨⬛⬛ 12%
🟩🟨🟨⬛⬛ 67%
🟩🟩🟩🟩🟩 100%

12-day streak! Top 5% of players 🎯
Play: https://proxle.app
```

---

## 👑 Admin Dashboard: Features & Layout

### Phase 1: Core Admin Panel

**URL:** `https://proxle.app/admin`  
**Access Control:**
```typescript
// Firestore Security Rule
match /stats/admin {
  allow read, write: if request.auth.token.email == 'razma@skyboundmi.com';
}
```

**Dashboard Layout:**

```
┌────────────────────────────────────────────────────────────┐
│  🎮 PROXLE ADMIN DASHBOARD                      [@] Razma  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📊 Real-Time Overview                    🗓️ Dec 29, 2024  │
│  ─────────────────────────────────────────────────────────│
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Total Users  │  │ Active Today │  │ Games Played │     │
│  │    1,247     │  │     89       │  │    4,392     │     │
│  │  +12 today   │  │  +5 vs avg   │  │  +156 today  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                            │
│  💰 Revenue & Costs                                        │
│  ─────────────────────────────────────────────────────────│
│                                                            │
│  Ko-fi Donations (This Month)           $127.00 (8 donors)│
│  Google Cloud Costs (This Month)         $8.42 (Gemini)   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Net Revenue                             +$118.58 💚       │
│                                                            │
│  🔍 User Search                                            │
│  ─────────────────────────────────────────────────────────│
│  [Search by email or name...]              [🔍 Search]    │
│                                                            │
│  🏆 Top Users (By Streak)                                  │
│  ─────────────────────────────────────────────────────────│
│  1. Alice Chen          🔥 45 days      $15 donated  ⭐    │
│  2. Bob Smith           🔥 32 days      $0                 │
│  3. Carol Davis         🔥 28 days      $25 donated  ⭐    │
│  ...                                                       │
│                                                            │
│  📈 Charts & Insights                                      │
│  ─────────────────────────────────────────────────────────│
│  [Daily Active Users Graph]                                │
│  [API Usage Over Time]                                     │
│  [Revenue vs. Costs Trend]                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### Admin Features Breakdown

#### 1. **Real-Time Metrics**
- Total users (query `users` collection)
- Active today (users with `lastActiveAt` in last 24h)
- Games played (sum of `totalGames`)
- New users (last 7 days, last 30 days)

**Firestore Query:**
```typescript
const today = startOfDay(new Date());
const activeToday = await db.collection('users')
  .where('lastActiveAt', '>=', today)
  .count()
  .get();
```

---

#### 2. **Revenue Integration**

##### Ko-fi API
Ko-fi provides a **webhook** but not a read API. 

**Solution A: Webhook Receiver** (Recommended)
1. Ko-fi sends POST request when donation received
2. Firebase Function receives webhook
3. Parses email from donation (if provided)
4. Matches to user account
5. Increments `donationTotal` and `donationCount`
6. Stores in `donations` collection for admin view

```typescript
// Firebase Function
export const kofiWebhook = functions.https.onRequest(async (req, res) => {
  const { verification_token, from_name, email, amount, message } = req.body;
  
  // Verify Ko-fi signature
  if (verification_token !== process.env.KOFI_VERIFICATION_TOKEN) {
    return res.status(401).send('Unauthorized');
  }
  
  // Find user by email (if provided)
  let userId = null;
  if (email) {
    const userSnap = await db.collection('users').where('email', '==', email).get();
    if (!userSnap.empty) {
      userId = userSnap.docs[0].id;
    }
  }
  
  // Store donation
  await db.collection('donations').add({
    fromName: from_name,
    email: email || null,
    userId: userId,
    amount: parseFloat(amount),
    message: message,
    timestamp: FieldValue.serverTimestamp(),
  });
  
  // Update user stats if matched
  if (userId) {
    await db.collection('users').doc(userId).update({
      donationTotal: FieldValue.increment(parseFloat(amount)),
      donationCount: FieldValue.increment(1),
    });
  }
  
  res.status(200).send('OK');
});
```

**Solution B: Manual Entry Panel** (Simpler for now)
Admin dashboard has "Add Donation" form:
- Donor email (optional)
- Amount
- Date
- Note

This manually links donations to users.

---

##### Google Cloud Cost Tracking

**Problem:** Google Cloud doesn't provide a direct API for billing.

**Solution A: BigQuery Export** (Enterprise, overkill for now)
**Solution B: Cloud Billing Budget Alerts** (Notifications only)
**Solution C: Manual Entry** (Quick & simple)

**Recommended for Phase 1:** 
- Admin dashboard has a "Update Costs" button
- Opens modal: "Enter this month's Gemini API cost from [Cloud Console Link]"
- Saves to `stats/admin` document
- Displays in dashboard

```typescript
// Firestore: stats/admin
{
  costs: {
    '2024-12': 8.42,
    '2024-11': 6.15,
    // ...
  },
  lastUpdated: Timestamp
}
```

**Future:** Pull from Google Cloud Billing API (requires service account setup).

---

#### 3. **User Search**

Search by email or name:
```typescript
// Client-side filter (works for <10k users)
const filteredUsers = allUsers.filter(u => 
  u.email.toLowerCase().includes(query) ||
  u.displayName.toLowerCase().includes(query)
);

// Or Firestore query (limited)
const results = await db.collection('users')
  .where('email', '==', searchEmail)
  .get();
```

**Search Result Card:**
```
┌─────────────────────────────────────────────┐
│ 👤 John Doe (john@gmail.com)                │
├─────────────────────────────────────────────┤
│ Games: 42  |  Win Rate: 90%  |  Streak: 7  │
│ Donated: $10.00 (2 donations)               │
│ Joined: Dec 15, 2024                        │
│ Last Active: 2 hours ago                    │
│                                             │
│ [View Full Stats]  [Send Message] (Phase 3)│
└─────────────────────────────────────────────┘
```

---

#### 4. **Donations Leaderboard** (Public!)

**New Page:** `https://proxle.app/supporters`

```
┌─────────────────────────────────────────────┐
│  💝 PROXLE SUPPORTERS                       │
│  Thank you to our generous supporters!      │
├─────────────────────────────────────────────┤
│                                             │
│  🥇 Alice C.               $25.00  (★ VIP)  │
│  🥈 John D.                $15.00           │
│  🥉 Sarah M.               $10.00           │
│     Chris P.               $5.00            │
│     Alex T.                $5.00            │
│     ... and 12 more supporters!             │
│                                             │
│  Total Raised: $127.00 this month 💚        │
│                                             │
│  [☕ Support Proxle]                         │
└─────────────────────────────────────────────┘
```

**Features:**
- **Opt-in only**: Users checkbox "Show my name on supporters page"
- **Privacy options:**
  - Full name: "Alice Chen"
  - First name + initial: "Alice C."
  - Anonymous: "Anonymous Supporter"
- **VIP Badge:** >$20 donated (all-time)
- **Monthly & All-Time tabs**

**Firestore:**
```typescript
// users collection
{
  displayOnLeaderboard: boolean,    // Opt-in
  leaderboardName: string,          // "Alice C." or "Anonymous"
  donationTotal: number,
  donationCount: number,
}
```

---

## 🚀 Additional Feature Suggestions

### 1. **Social Sharing Images** (non-obvious 🎨)

**Concept:** Generate a beautiful share image (like GitHub stats cards).

**Example:**
When user clicks "Share", TWO options:
1. **Copy Text** (existing)
2. **Share Image** (NEW)

The image is dynamically generated:
```
┌─────────────────────────────────┐
│                                 │
│    PROXLE  #342                 │
│    ─────────────────            │
│                                 │
│    I solved it in 3 guesses!    │
│                                 │
│    ⬛⬛🟨⬛⬛  12%               │
│    🟩🟨🟨⬛⬛  67%               │
│    🟩🟩🟩🟩🟩  100%              │
│                                 │
│    🔥 7-day streak              │
│                                 │
│    [QR Code to proxle.app]      │
│                                 │
│    proxle.app                   │
└─────────────────────────────────┘
```

**Implementation:**
- Use `html2canvas` to render a hidden div
- Download as PNG
- User can save/share to Instagram, Twitter, etc.

**Why it's valuable:**
- **Social proof**: Visual shares get 10x more engagement than text
- **Free marketing**: Every share is a mini-poster
- **Virality**: QR code makes it easy for others to join

**Complexity:** Medium (2-3 hours)  
**Impact:** High (marketing multiplier)

---

### 2. **Daily Challenges & Achievements** 🏆

**Concept:** Gamify beyond just playing daily.

**Achievements:**
```typescript
const ACHIEVEMENTS = {
  // Streak-based
  'week_warrior': { name: 'Week Warrior', requirement: '7-day streak', icon: '🔥' },
  'month_master': { name: 'Month Master', requirement: '30-day streak', icon: '🏔️' },
  
  // Performance-based
  'one_shot': { name: 'One Shot', requirement: 'Win in 1 guess', icon: '🎯' },
  'speed_demon': { name: 'Speed Demon', requirement: 'Win in under 2 minutes', icon: '⚡' },
  
  // Social
  'supporter': { name: 'Supporter', requirement: 'Make a donation', icon: '💝' },
  'evangelist': { name: 'Evangelist', requirement: 'Share 10 times', icon: '📢' },
  
  // Semantic mastery
  'semantic_savant': { name: 'Semantic Savant', requirement: 'Get >90% similarity on first guess 5 times', icon: '🧠' },
}
```

**Daily Challenges:**
- Random special goals each day
- "Win in 4 guesses or less"
- "First guess must be >50% similar"
- "Use only 4-letter words today"

**Rewards:**
- Unlock badges
- Show in profile
- Special flair on leaderboard

**Complexity:** Medium (4-5 hours)  
**Impact:** High (retention boost)

---

### 3. **"Help Me Guess" AI Hint System** 💡

**Concept:** Optional AI-powered hint for stuck players.

**How it works:**
1. User has made 5+ guesses, still stuck
2. Button appears: "💡 Get a Hint (watch ad)" or "💡 Get a Hint (supporters only)"
3. AI analyzes their guesses and provides targeted advice:
   - "You're close! Try thinking about royal titles."
   - "The word is 5 letters. Focus on your green letters."

**Monetization:**
- **Free users:** Watch 5-second ad (AdSense)
- **Supporters:** Unlimited hints

**Why it's non-obvious:**
- Most puzzle games just let you fail
- This builds goodwill while monetizing
- Supporters get tangible value beyond just supporting

**Implementation:**
```typescript
export const getHint = functions.https.onCall(async (data, context) => {
  const { guesses, targetWord } = data;
  
  // Check if user is supporter
  const isSupporter = await checkIfSupporter(context.auth.uid);
  
  if (!isSupporter && !data.hasWatchedAd) {
    throw new Error('Watch ad first or become a supporter');
  }
  
  // Generate contextual hint
  const prompt = `User is stuck on word "${targetWord}". 
    Their guesses so far: ${guesses.join(', ')}.
    Give a helpful but not too revealing hint (one sentence).`;
  
  const hint = await callGeminiAPI(prompt);
  return { hint };
});
```

**Complexity:** Medium (3-4 hours)  
**Impact:** High (retention + monetization)

---

## 📅 Implementation Phases

### **Phase 1A: Core Authentication** (8 hours)
- [ ] Firebase Auth setup (Google Provider)
- [ ] Profile dropdown in header
- [ ] Sign in / Sign out flow
- [ ] FTUE: Auto-show info modal on first visit
- [ ] Basic user document creation in Firestore

**Dependencies:** None  
**Blockers:** None  
**Deploy after:** OAuth verification approved

---

### **Phase 1B: Stats & Streaks** (10 hours)
- [ ] Firestore schema for user stats
- [ ] Streak calculation logic (timezone-aware!)
- [ ] Stats modal UI
- [ ] Guess distribution chart
- [ ] Update stats on game completion
- [ ] Enhanced sharing (with streak)

**Dependencies:** Phase 1A  
**Blockers:** None

---

### **Phase 1C: Admin Dashboard Core** (12 hours)
- [ ] `/admin` route with auth check
- [ ] Real-time metrics (users, games, active today)
- [ ] User search functionality
- [ ] Top users table (by streak)
- [ ] Manual cost entry form
- [ ] Basic charts (daily active users)

**Dependencies:** Phase 1B  
**Blockers:** Need Ko-fi webhook URL

---

### **Phase 2A: Donations Integration** (8 hours)
- [ ] Ko-fi webhook receiver (Firebase Function)
- [ ] Link donations to user accounts
- [ ] Admin donations overview
- [ ] Public supporters leaderboard (`/supporters`)
- [ ] User opt-in/opt-out settings
- [ ] Privacy controls (full name / initial / anonymous)

**Dependencies:** Phase 1C  
**Blockers:** Need Ko-fi API credentials

---

### **Phase 2B: Social & Achievements** (10 hours)
- [ ] Share image generator (html2canvas)
- [ ] Achievement system (define + unlock)
- [ ] Achievement badges in profile
- [ ] Daily challenge system
- [ ] Challenge UI indicators

**Dependencies:** Phase 1B  
**Nice to have:** Phase 2A for "Supporter" achievement

---

### **Phase 3: Advanced Features** (TBD)
- [ ] AI hint system with ad integration
- [ ] Global leaderboards (win rate, average guesses)
- [ ] Friend system
- [ ] Google Cloud Billing API integration
- [ ] Full game history replay
- [ ] Weekly/monthly email summaries

---

## 💰 Cost Projections with Features

| Feature | Monthly Cost (10k users) | Notes |
|:--------|:------------------------|:------|
| **Firestore Reads** | $0 | Well within free tier (50k/day) |
| **Firestore Writes** | $0 | <20k/day free tier |
| **Firebase Auth** | $0 | 50k MAU free |
| **Gemini API** | $15-30 | ~10k games/day @ $0.001/request |
| **Cloud Functions** | $0-5 | Free tier covers most |
| **Ko-fi Webhook** | $0 | Included |
| **Image Generation** | $0 | Client-side (html2canvas) |
| **TOTAL** | **~$20-35/month** | For 10k active users |

**Revenue Goal:** $100/month (3-5 supporters)  
**Net Profit:** $65-80/month ✅

---

## 🎯 Recommended Implementation Order

1. **Phase 1A** → Get auth working, users can sign in
2. **Deploy & OAuth verification** → Remove scary warning
3. **Phase 1B** → Stats make the game sticky
4. **Phase 1C** → You can monitor health
5. **Phase 2A** → Monetize supporters properly
6. **Phase 2B** → Virality & retention boost

**Timeline:** 
- Week 1: Phases 1A-1B
- Week 2: Phase 1C
- Week 3: Phase 2A
- Week 4: Phase 2B

**Total:** ~1 month part-time work

---

## 🤔 Open Questions for Discussion

1. **Streak Timezone:**
   - Use user's browser timezone? (Simple)
   - Let user set timezone in settings? (Better UX)
   - UTC only? (Simplest, but weird for some users)

2. **Guest Play:**
   - Allow playing without sign-in? (Keep localStorage for later merge)
   - Force sign-in to play? (Easier, but friction)
   
   **Recommendation:** Allow guest play, prompt to sign in after first win.

3. **Ko-fi Matching:**
   - What if donation email doesn't match Google email?
   - Manual admin override?
   - Let users claim donations via code?

4. **Supporters Leaderboard Private Info:**
   - Show amounts? (Could discourage small donations)
   - Just show names? (More welcoming)
   
   **Recommendation:** Show amounts but tier them (<$5, $5-20, $20+).

5. **Achievements Retroactive?**
   - Grant achievements for past performance?
   - Only track from launch date?
   
   **Recommendation:** Grant retroactive for streak-based only.

---

## ✨ Summary

This roadmap transforms Proxle from a daily puzzle into a **full-featured game platform** with:
- ✅ Persistent user accounts
- ✅ Engaging stats and streaks
- ✅ Supporter recognition
- ✅ Admin oversight tools
- ✅ Viral sharing features
- ✅ Revenue sustainability

**Next Step:** Review this roadmap, then let's start with **Phase 1A (Authentication)**.
