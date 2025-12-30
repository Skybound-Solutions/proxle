# Donations Leaderboard Design (Humble Bundle Style)

## Core Philosophy
Like the classic Humble Bundle leaderboard:
- **Rank by Generosity:** Top contributors sorted by total amount donated.
- **Custom Presence:** Donors choose their Display Name and an optional **Support Message**.
- **Privacy First:** Detailed privacy settings (Hide amount, Hide name, etc.).

## 1. User Experience

### Step 1: User Donates
User donates via Ko-fi.

### Step 2: User Claims & Configures (Post-Donation)
In `Settings` → `Supporter Badge`:

```
┌────────────────────────────────────────────────────┐
│  💎 Supporter Settings                             │
├────────────────────────────────────────────────────┤
│                                                    │
│  Total Donated: $25.00                             │
│  Current Rank: #42                                 │
│                                                    │
│  📝 Leaderboard Display                            │
│                                                    │
│  [x] Show me on the leaderboard                    │
│                                                    │
│  Display Name:                                     │
│  [ WordWizard99_______ ]                           │
│                                                    │
│  Support Message (Optional, max 60 chars):         │
│  [ Keep up the great work! 🚀_________ ]           │
│                                                    │
│  Privacy Options:                                  │
│  ( ) Show exact amount ($25.00)                    │
│  ( ) Show tier only (💎 VIP)                       │
│  ( ) Hide amount completely                        │
│                                                    │
│  [Save Settings]                                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Step 3: The Public Leaderboard

**URL:** `https://proxle.app/supporters`

```
┌────────────────────────────────────────────────────────┐
│  🏆 PROXLE TOP CONTRIBUTORS                            │
│  "Thanks to the 142 supporters keeping Proxle free!"   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [ All Time ]  [ Last 90 Days ]  [ Last 30 Days ]      │
│  ────────────────────────────────────────────────────  │
│  🥇 1. Alice C.                $150.00                 │
│      "Love playing this every morning!"                │
│                                                        │
│  🥈 2. The Word King           $120.00                 │
│      "Beat my streak if you can."                      │
│                                                        │
│  🥉 3. Sarah M.                $100.00                 │
│      "For the developers ☕"                           │
│  ────────────────────────────────────────────────────  │
│  4.  Bob                     $75.00                    │
│  5.  Anonymous               $50.00                    │
│  6.  WordNerd                $25.00                    │
│  ...                                                   │
│                                                        │
│  ────────────────────────────────────────────────────  │
│  📊 STATS                                              │
│  Average Donation: $8.42   |   Total Supporters: 142   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**The "Billboard" Mechanic:**
- **Top 3 ONLY:** Can display a public message.
- **Ranks 4+:** Show Name & Amount only.
- **Why?** Turns the Top 3 spots into highly coveted "advertising" space. Players will fight (donate) to keep their message visible.



---

## 2. Admin Approval Workflow (Safety)

Since we allow custom text (Messages), manual approval is critical.

**Admin Dashboard:**
```
┌────────────────────────────────────────────────────┐
│  🔍 Pending Approvals (1)                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  👤 User: WordWizard99                             │
│  💰 Amount: $25.00                                 │
│  📝 Message: "Keep up the great work! 🚀"          │
│                                                    │
│  [✅ Approve]  [❌ Reject Text]  [❌ Reject Name]  │
│                                                    │
└────────────────────────────────────────────────────┘
```
*   **Reject Text:** Clears their message but keeps their name/donation on leaderboard.
*   **Reject Name:** Resets name to "Proxle Player" until they change it.

---

## 3. Data Model Update

```typescript
interface UserLeaderboardProfile {
  optedIn: boolean;
  displayName: string;
  message: string;          // New: Custom message
  showAmount: 'exact' | 'tier' | 'hidden'; // New: Privacy granularity
  approvalStatus: 'pending' | 'approved' | 'rejected';
  
  // Stats
  totalDonated: number;
}
```

---

## 4. Why This Works (Psychology)
1.  **Competitive Altruism:** "Alice is #1 with $150? I'll donate $160 to take the spot." (The Humble Bundle effect)
2.  **Expression:** People pay for the *message* as much as the game. A way to shout out friends or just be seen.
3.  **Transparency:** Seeing real amounts makes the project feel like a shared community effort.

---

## Implementation Priority
**Phase 2A (Donations)** remains the right place for this. 
1. Build the tracking/webhook.
2. Build the basic list.
3. Add the "Message" feature.
