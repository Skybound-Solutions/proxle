# Leaderboard Enhancement - Quick Reference

## What's Changing?

### Before → After

| Component | Before | After |
|-----------|--------|-------|
| **Header Button** | ☕ "Support" → Ko-fi link | 🏆 "Leaderboard" → Opens leaderboard |
| **Leaderboard Screen** | Only shows donators | Shows top 3 donators + streak leaders + other supporters |
| **Donate Button** | In header | In leaderboard footer (enhanced) |
| **Privacy Controls** | Basic (on/off) | Granular (opt-in, name control, amount visibility, streak visibility) |
| **Zero Donations** | Shows $0.00 | Hidden (only shows if donated > $0) |
| **Display Name** | Google name default | "Anonymous" default with AI moderation |
| **Content Moderation** | Admin only (messages) | AI + Admin (names auto, messages manual) |

---

## New Leaderboard Layout

```
┌─────────────────────────────────────────────────┐
│  🏆 PROXLE LEADERBOARD                          │
│  "Supporting Proxle & Top Players"              │
├─────────────────────────────────────────────────┤
│                                                 │
│  💎 TOP SUPPORTERS                              │
│  ─────────────────────────────────────────────  │
│  🥇 1. Alice C.            $150.00  🔥 12       │
│      "Love playing this every morning!"         │
│                                                 │
│  🥈 2. The Word King       $120.00  🔥 8        │
│      "Beat my streak if you can."               │
│                                                 │
│  🥉 3. Sarah M.            $100.00              │
│      "For the developers ☕"                    │
│  ─────────────────────────────────────────────  │
│                                                 │
│  🔥 STREAK LEADERS (Active Players)             │
│  ─────────────────────────────────────────────  │
│  1.  ProxlePro          🔥 25 days              │
│  2.  DailyGamer         🔥 18 days              │
│  3.  WordNerd           🔥 15 days              │
│  4.  StreakMaster       🔥 12 days              │
│  5.  ConsistentCarl     🔥 10 days              │
│  ─────────────────────────────────────────────  │
│                                                 │
│  OTHER SUPPORTERS                               │
│  ─────────────────────────────────────────────  │
│  4.  Bob                $75.00   🔥 5           │
│  5.  Anonymous          💎       🔥 3           │
│  6.  WordNerd           $25.00                  │
│  7.  ProxleFan          💎                      │
│  ...                                            │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  [❤️ Support Proxle & Join the Leaderboard]    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Privacy Controls (Stats Modal)

### For ALL Users:
```
🏆 Leaderboard Settings
──────────────────────────────────────

[ ✓ ] Appear on Leaderboard

  Display Name: 
  [Alice_________]
  ℹ️ Names are reviewed for appropriateness

  [ ✓ ] Show My Streak
```

### For Supporters (if donated):
```
🏆 Leaderboard Settings
──────────────────────────────────────

[ ✓ ] Appear on Leaderboard

  Display Name: 
  [Alice C._______]
  ℹ️ Names are reviewed for appropriateness

  [ ✓ ] Show My Streak
  [ ✓ ] Show Donation Amount

  💎 Supporter Message (Top 3 only):
  [Love playing this every morning!____]
  ℹ️ Only visible if you're in top 3
```

---

## User Journey

### New User:
1. ❌ **Not on leaderboard** (opted out by default)
2. Name shown as "Anonymous" in their stats
3. Can opt-in anytime via Stats modal

### Daily Player (Building Streak):
1. Plays 5 days in a row → Streak = 5
2. Opts into leaderboard
3. ✅ **Appears in "Streak Leaders"** section (if streak ≥ 3)

### Supporter (Made Donation):
1. Donates $25 via Ko-fi
2. Webhook updates their donation total
3. Still ❌ **not visible** until they opt-in
4. Opts in, enables "Show Donation Amount"
5. ✅ **Appears in "Other Supporters"** section
6. If they reach top 3 → Can add custom message

### Top 3 Supporter:
1. Makes large donation → Becomes #2
2. ✅ Automatically gets "billboard" card with message option
3. Writes message → Pending admin approval
4. Admin approves → Message visible to all players

---

## Display Rules

### Name Display:
- **Opted Out**: Never shown
- **Opted In, No Custom Name**: "Anonymous"
- **Opted In, Custom Name (Approved)**: Shows custom name
- **Opted In, Custom Name (Pending)**: Shows "Anonymous" until approved
- **Opted In, Custom Name (Rejected)**: Reverts to "Anonymous", user notified

### Donation Amount:
- **Has Not Donated**: Not in donators list
- **Donated, `showDonationAmount = true`**: Shows exact $ amount
- **Donated, `showDonationAmount = false`**: Shows 💎 icon
- **In Streak Leaders Section**: Never shows $ (always shows streak only)

### Streak Display:
- **Any Section, `showStreak = true`**: Shows 🔥 badge with number
- **Any Section, `showStreak = false`**: Hides streak badge
- **Streak Leaders Section**: Only shows users with `showStreak = true` AND streak ≥ 3

### Messages:
- **Top 3 Donators Only**: Can submit message
- **Rank 4+**: No message option
- **Message Approval**: Admin must approve (manual)
- **Name Approval**: AI checks automatically

---

## Technical Implementation

### New Database Fields (`users` collection):

```typescript
{
  // ... existing fields ...
  
  // NEW PRIVACY CONTROLS
  displayOnLeaderboard: boolean,        // Default: false
  leaderboardName: string,              // Default: "Anonymous"
  showDonationAmount: boolean,          // Default: true
  showStreak: boolean,                  // Default: true
  leaderboardNameApprovalStatus: string // Default: "approved"
}
```

### New Cloud Function:

```typescript
checkLeaderboardName(name: string)
→ Returns: { approved: boolean }
→ Uses: Gemini AI to check appropriateness
→ Called: When user saves new leaderboard name
```

### Updated Queries:

**Top Donators:**
```typescript
collection: 'leaderboard'
where: amount > 0 AND displayOnLeaderboard == true
orderBy: amount DESC
limit: 50
```

**Streak Leaders:**
```typescript
collection: 'users'
where: displayOnLeaderboard == true AND currentStreak >= 3 AND showStreak == true
orderBy: currentStreak DESC
limit: 10
```

---

## AI Moderation

### Name Filtering:
**Rejects:**
- Profanity / offensive language
- Hate speech
- Sexual content
- Personal info (phone, address)
- Spam / advertising
- Impersonation

**Process:**
1. User enters custom name
2. Click "Save"
3. AI checks → ✅ Approved or ❌ Rejected
4. If approved → Saved and visible
5. If rejected → Alert shown, reverts to previous name

**Cost:** ~$0.00001 per check, ~$0.05/month for 5000 checks

### Message Moderation:
**Manual Admin Approval** (existing process)
- Only top 3 can submit
- Admin reviews in dashboard
- Approve/reject from admin panel

---

## Benefits

### For Players:
✅ **See competition** - Streaks make it competitive even without donating
✅ **Complete privacy control** - Choose exactly what's visible
✅ **Safe space** - AI + admin moderation keeps it family-friendly

### For the Game:
✅ **More engagement** - Streaks encourage daily play
✅ **More donations** - Top 3 "billboard" is coveted advertising space
✅ **Better community** - Celebrates both supporters and active players

### For Supporters:
✅ **Recognition** - Top 3 get prominent display + message
✅ **Privacy** - Can hide amounts and stay anonymous if desired
✅ **Flexibility** - Control name, streak visibility, amount visibility

---

## Implementation Timeline

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1 | UI Changes (button, layout) | 2 hours |
| 2 | Leaderboard Logic (queries, sections) | 4 hours |
| 3 | Privacy Controls (toggles, settings) | 3 hours |
| 4 | AI Moderation (Cloud Function) | 3 hours |
| 5 | Donation Visibility (display logic) | 2 hours |
| 6 | Database Updates (schema, migration) | 2 hours |
| 7 | Cloud Functions (sync, triggers) | 3 hours |
| 8 | Testing & Polish | 4 hours |
| **TOTAL** | | **~23 hours** |

---

## Next Steps

1. **Review Plan** - Confirm this aligns with vision
2. **Prioritize Features** - All features or MVP first?
3. **Begin Implementation** - Start with Phase 1 (UI changes)
4. **Iterate** - Get feedback, refine

**Ready to start building?** 🚀
