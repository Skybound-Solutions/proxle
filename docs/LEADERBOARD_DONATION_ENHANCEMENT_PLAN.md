# Leaderboard & Donation Enhancement Plan

## Overview
Transform the donation button into a leaderboard button and add comprehensive privacy controls for users to opt into leaderboard participation, control their display name, and manage donation visibility. The leaderboard will prioritize top 3 donators with custom messages, then show top streaks to encourage both donations and consistent play.

---

## Current State Analysis

### What We Have:
1. **Header Button**: Currently shows "Support" phrases and links to Ko-fi (AdSpace component)
2. **LeaderboardModal**: Shows supporters ranked by donation amount with:
   - Top 3 get special "billboard" treatment with messages
   - Others shown in list format
   - Basic privacy controls (isAnonymous, showAmount)
3. **StatsModal**: Has supporter profile section for editing leaderboard settings
4. **User Data Structure**: 
   - `displayOnLeaderboard` (boolean)
   - `leaderboardName` (string)
   - `message` (string)
   - `messageApprovalStatus` ('pending' | 'approved' | 'rejected')
   - `donations.total` (number)
   - `currentStreak` (number)

### What Needs to Change:
1. **Header Button**: Change from donate to leaderboard
2. **Leaderboard Logic**: Combine donators + streaks in a meaningful way
3. **Privacy Controls**: Enhanced opt-in system with name filtering
4. **Donation Button**: Add to leaderboard screen
5. **Data Storage**: New fields for privacy preferences
6. **Content Moderation**: AI-based name filtering

---

## Phase 1: UI/UX Changes

### 1.1 Header Button Transformation
**File**: `src/components/AdSpace.tsx`

**Changes**:
- Replace the rotating "Support" phrases with leaderboard-related phrases
- Change the icon from ☕ to 🏆 (Trophy)
- Keep onClick behavior to open leaderboard
- New rotating phrases:
  - "Leaderboard"
  - "Top Players"
  - "See Streaks"
  - "Hall of Fame"
  - "Rankings"

**Implementation**:
```typescript
// Update phrases array
const phrases = [
    "Leaderboard",
    "Top Players", 
    "See Streaks",
    "Hall of Fame",
    "Rankings",
    "Champions",
    "Elite Club"
];

// Update icon
<span className="text-lg shrink-0 z-10">🏆</span>
```

### 1.2 Add Donate Button to Leaderboard
**File**: `src/components/LeaderboardModal.tsx`

**Changes**:
- Keep existing Ko-fi button in footer
- Potentially add a secondary "Your Support" card showing user's own donation status if they're a supporter
- Make the Ko-fi button more prominent with better CTA

**Implementation**:
```typescript
// In the footer section, enhance the existing button
<a
  href="https://ko-fi.com/skyboundmi"
  target="_blank"
  rel="noopener noreferrer"
  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
>
  <Heart size={20} fill="currentColor" />
  Support Proxle & Join the Leaderboard
</a>
```

---

## Phase 2: Leaderboard Logic Enhancement

### 2.1 New Leaderboard Structure

**Goal**: Show a mix of top donators and top streaks to encourage both behaviors.

**Layout**:
1. **Top 3 Donators** (Billboard Section)
   - Full display with custom message
   - Show donation amount (if opted in)
   - Show streak badge
   
2. **Top Active Streaks** (New Section)
   - Top 10 players with longest current streaks (minimum 3-day streak to appear)
   - Show streak count prominently
   - Show as "🔥 Streak Leaders"
   - Don't show donation amounts here
   - Only show players who opted into leaderboard

3. **Other Contributors** (Existing Section)
   - Ranked by donation amount (4th place onwards)
   - Show streak badges if they have them

### 2.2 Data Fetching Strategy
**File**: `src/components/LeaderboardModal.tsx`

**Implementation**:
```typescript
const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
        // Fetch top donators
        const donatorsRef = collection(db, 'leaderboard');
        const donatorsQuery = query(
            donatorsRef,
            where('amount', '>', 0),
            where('displayOnLeaderboard', '==', true), // Only opted-in users
            orderBy('amount', 'desc'),
            limit(50)
        );
        
        // Fetch top streaks from users collection
        const streaksRef = collection(db, 'users');
        const streaksQuery = query(
            streaksRef,
            where('displayOnLeaderboard', '==', true), // Only opted-in users
            where('currentStreak', '>=', 3), // Minimum 3-day streak
            orderBy('currentStreak', 'desc'),
            limit(10)
        );
        
        const [donatorsSnap, streaksSnap] = await Promise.all([
            getDocs(donatorsQuery),
            getDocs(streaksQuery)
        ]);
        
        const donators = donatorsSnap.docs.map(doc => ({...}));
        const streakLeaders = streaksSnap.docs.map(doc => ({...}));
        
        setDonators(donators);
        setStreakLeaders(streakLeaders);
    } catch (error) {
        console.error("Fetch Error:", error);
    } finally {
        setLoading(false);
    }
};
```

### 2.3 Leaderboard Display Order
```
┌────────────────────────────────────────┐
│  🏆 PROXLE LEADERBOARD                 │
├────────────────────────────────────────┤
│                                        │
│  TOP SUPPORTERS                        │
│  ─────────────────────────────────     │
│  🥇 1. Alice C.      $150.00  🔥 12   │
│      "Love this game!"                 │
│                                        │
│  🥈 2. Word King     $120.00  🔥 8    │
│      "Beat my streak!"                 │
│                                        │
│  🥉 3. Sarah M.      $100.00          │
│      "For the devs ☕"                 │
│  ──────────────────────────────────    │
│                                        │
│  🔥 STREAK LEADERS                     │
│  ──────────────────────────────────    │
│  1. ProxlePro       🔥 25 days         │
│  2. DailyGamer      🔥 18 days         │
│  3. WordNerd        🔥 15 days         │
│  ...                                   │
│  ──────────────────────────────────    │
│                                        │
│  OTHER SUPPORTERS                      │
│  ──────────────────────────────────    │
│  4.  Bob            $75.00  🔥 5      │
│  5.  Jane           💎                 │
│  ...                                   │
│                                        │
└────────────────────────────────────────┘
```

---

## Phase 3: Enhanced Privacy & User Controls

### 3.1 New Data Model
**Collection**: `users`

**New/Updated Fields**:
```typescript
interface UserLeaderboardSettings {
  // Existing
  displayOnLeaderboard: boolean;           // Opt-in to leaderboard
  leaderboardName: string;                 // Custom display name
  message?: string;                        // Custom message (top 3 donators only)
  messageApprovalStatus?: 'pending' | 'approved' | 'rejected';
  
  // NEW
  showDonationAmount: boolean;             // Show exact amount vs hiding
  leaderboardNameApprovalStatus?: 'pending' | 'approved' | 'rejected';
  leaderboardNameOriginal?: string;        // Store for moderation tracking
  showStreak: boolean;                     // Show streak on leaderboard
  
  // Stats
  currentStreak: number;
  donations: {
    total: number;
    count: number;
  }
}
```

### 3.2 Stats Modal Enhancement
**File**: `src/components/StatsModal.tsx`

**New Privacy Controls Section**:
```typescript
// Leaderboard Participation Section
<div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
    🏆 Leaderboard Settings
  </h3>
  
  {/* Opt-in Toggle */}
  <div className="flex items-center justify-between mb-3">
    <label className="text-xs text-white/70">Appear on Leaderboard</label>
    <ToggleSwitch 
      checked={formData.displayOnLeaderboard}
      onChange={(val) => setFormData({...formData, displayOnLeaderboard: val})}
    />
  </div>
  
  {formData.displayOnLeaderboard && (
    <>
      {/* Display Name */}
      <div className="mb-3">
        <label className="text-[10px] uppercase text-white/40 block mb-1">
          Display Name
        </label>
        <input
          type="text"
          value={formData.leaderboardName}
          onChange={(e) => handleNameChange(e.target.value)}
          maxLength={30}
          className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          placeholder="Your leaderboard name"
        />
        <p className="text-[10px] text-white/40 mt-1">
          Names are reviewed for appropriateness
        </p>
      </div>
      
      {/* Show Streak Toggle */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs text-white/70">Show My Streak</label>
        <ToggleSwitch 
          checked={formData.showStreak}
          onChange={(val) => setFormData({...formData, showStreak: val})}
        />
      </div>
      
      {/* Donation Amount Visibility (only if donated) */}
      {isSupporter && (
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/70">Show Donation Amount</label>
          <ToggleSwitch 
            checked={formData.showDonationAmount}
            onChange={(val) => setFormData({...formData, showDonationAmount: val})}
          />
        </div>
      )}
    </>
  )}
</div>
```

### 3.3 Default Privacy Settings
**File**: `src/hooks/useAuth.ts` - `ensureUserDocument` function

**Updates**:
```typescript
await setDoc(userRef, {
    // ... existing fields ...
    
    // NEW: Default privacy settings - opt-out by default
    displayOnLeaderboard: false,
    leaderboardName: 'Anonymous', // Default to anonymous
    showDonationAmount: true, // If they opt-in and donated, show amount by default
    showStreak: true, // Show streak by default if opted in
    leaderboardNameApprovalStatus: 'approved', // "Anonymous" is pre-approved
    
    // ... rest of fields ...
});
```

---

## Phase 4: Content Moderation (AI Filtering)

### 4.1 Name Appropriateness Check
**File**: `functions/src/index.ts` (new Cloud Function)

**Function**: `checkLeaderboardName`

**Purpose**: Use AI (Gemini) to check if a display name is appropriate

**Implementation**:
```typescript
import { onCall } from 'firebase-functions/v2/https';
import { gemini15Flash, genkit } from './genkit';

export const checkLeaderboardName = onCall(async (request) => {
    const { name } = request.data;
    
    if (!request.auth) {
        throw new Error('Authentication required');
    }
    
    // Check with AI
    const prompt = `You are a content moderator for a family-friendly word game. 
    Evaluate if the following display name is appropriate for a public leaderboard.
    
    Display Name: "${name}"
    
    Reject if it contains:
    - Profanity or offensive language
    - Hate speech or discriminatory content
    - Sexual content
    - Personal information (phone numbers, addresses, etc.)
    - Spam or advertising
    - Impersonation of public figures or brands
    
    Respond with ONLY "APPROVED" or "REJECTED".`;
    
    const result = await genkit.generate({
        model: gemini15Flash,
        prompt,
        config: {
            maxOutputTokens: 10,
            temperature: 0.1
        }
    });
    
    const decision = result.text.trim().toUpperCase();
    const isApproved = decision === 'APPROVED';
    
    return {
        approved: isApproved,
        decision: decision
    };
});
```

### 4.2 Frontend Integration
**File**: `src/components/StatsModal.tsx`

**Implementation**:
```typescript
const handleNameChange = async (newName: string) => {
    setFormData({ ...formData, leaderboardName: newName });
};

const handleSave = async () => {
    if (!onUpdateProfile) return;
    setSaveStatus('saving');
    
    try {
        // If leaderboard name changed and user opted in, check it
        if (formData.displayOnLeaderboard && 
            formData.leaderboardName !== userData?.leaderboardName &&
            formData.leaderboardName !== 'Anonymous') {
            
            // Call AI moderation function
            const checkName = httpsCallable(functions, 'checkLeaderboardName');
            const result = await checkName({ name: formData.leaderboardName });
            const data = result.data as { approved: boolean };
            
            if (!data.approved) {
                setFormData({ 
                    ...formData, 
                    leaderboardName: userData?.leaderboardName || 'Anonymous' 
                });
                alert('This name was flagged as inappropriate. Please choose another name.');
                setSaveStatus('idle');
                return;
            }
        }
        
        await onUpdateProfile(formData);
        setSaveStatus('saved');
        setTimeout(() => {
            setSaveStatus('idle');
            setIsEditing(false);
        }, 1500);
    } catch (error) {
        console.error("Save error:", error);
        setSaveStatus('idle');
    }
};
```

### 4.3 Message Moderation
**Keep existing admin approval workflow** for messages since only top 3 donators can have messages. This is already implemented in the AdminDashboard.

---

## Phase 5: Donation Visibility Logic

### 5.1 Display Rules
**File**: `src/components/LeaderboardModal.tsx`

**Rules**:
1. If user has NOT donated → Don't show in donators list at all
2. If user donated but `showDonationAmount = false` → Show 💎 instead of amount
3. If user donated and `showDonationAmount = true` → Show exact amount
4. If user `displayOnLeaderboard = false` → Never show anywhere

**Implementation**:
```typescript
// In BillboardItem component
<div className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
    {supporter.showDonationAmount 
        ? `$${supporter.amount.toFixed(2)}` 
        : '💎 Supporter'}
</div>

// In SupporterRow component  
<div className="text-sm font-mono font-bold text-white/40">
    {supporter.showDonationAmount 
        ? `$${supporter.amount.toFixed(0)}` 
        : '💎'}
</div>

// In streak leaders section - never show donation amounts
<StreakLeaderRow 
    name={leader.leaderboardName}
    streak={leader.currentStreak}
    rank={index + 1}
/>
```

### 5.2 Zero-Donation Handling
**Rule**: Don't show $0.00 - simply exclude from leaderboard

**Implementation in Firestore query**:
```typescript
where('amount', '>', 0)  // Only show users with actual donations
```

---

## Phase 6: Database Structure Updates

### 6.1 Users Collection
**Path**: `users/{uid}`

```typescript
{
  // Auth
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  
  // Stats
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: Timestamp | null;
  guessDistribution: { [key: string]: number };
  winRate: number;
  
  // Donations
  donations: {
    total: number;
    count: number;
  };
  
  // Leaderboard Settings (NEW/UPDATED)
  displayOnLeaderboard: boolean;           // Default: false
  leaderboardName: string;                 // Default: 'Anonymous'
  leaderboardNameApprovalStatus: 'pending' | 'approved' | 'rejected'; // Default: 'approved'
  showDonationAmount: boolean;             // Default: true
  showStreak: boolean;                     // Default: true
  message?: string;                        // Top 3 donators only
  messageApprovalStatus?: 'pending' | 'approved' | 'rejected';
}
```

### 6.2 Leaderboard Collection (Public Read)
**Path**: `leaderboard/{uid}`

This is a denormalized view updated by Cloud Functions when:
- User makes a donation (webhook)
- User updates their leaderboard settings
- Admin approves/rejects content

```typescript
{
  displayName: string;                     // From leaderboardName
  amount: number;                          // Total donated
  currentStreak: number;                   // Synced from users collection
  showAmount: boolean;                     // From showDonationAmount
  message?: string;                        // If top 3 and approved
  approvalStatus: 'pending' | 'approved' | 'rejected';
  photoURL?: string;
  lastActiveAt: Timestamp;
  
  // For filtering
  displayOnLeaderboard: boolean;
}
```

### 6.3 Migration Strategy
**File**: `functions/src/scripts/migrateLeaderboardSettings.ts`

```typescript
import { getFirestore } from 'firebase-admin/firestore';

async function migrateLeaderboardSettings() {
    const db = getFirestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const batch = db.batch();
    let count = 0;
    
    for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Only update if new fields don't exist
        if (data.showDonationAmount === undefined) {
            batch.update(doc.ref, {
                showDonationAmount: true,
                showStreak: true,
                leaderboardNameApprovalStatus: 'approved',
                // Keep existing displayOnLeaderboard value
            });
            
            count++;
            
            // Firestore batch limit is 500
            if (count % 500 === 0) {
                await batch.commit();
                // Start new batch
            }
        }
    }
    
    if (count % 500 !== 0) {
        await batch.commit();
    }
    
    console.log(`Migrated ${count} user documents`);
}
```

---

## Phase 7: Updated Cloud Functions

### 7.1 Sync Leaderboard on Settings Change
**File**: `functions/src/index.ts`

**Trigger**: Firestore trigger on `users/{uid}` updates

```typescript
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

export const syncLeaderboard = onDocumentUpdated('users/{uid}', async (event) => {
    const userId = event.params.uid;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (!after) return;
    
    const leaderboardRef = admin.firestore()
        .collection('leaderboard')
        .doc(userId);
    
    // If user opted out, remove from leaderboard
    if (!after.displayOnLeaderboard) {
        await leaderboardRef.delete();
        return;
    }
    
    // Update leaderboard entry
    await leaderboardRef.set({
        displayName: after.leaderboardName || 'Anonymous',
        amount: after.donations?.total || 0,
        currentStreak: after.currentStreak || 0,
        showAmount: after.showDonationAmount !== false,
        message: after.message || null,
        approvalStatus: after.messageApprovalStatus || 'approved',
        photoURL: after.photoURL || null,
        lastActiveAt: after.lastActiveAt,
        displayOnLeaderboard: after.displayOnLeaderboard
    }, { merge: true });
});
```

---

## Implementation Checklist

### Phase 1: UI Changes ✓
- [ ] Update AdSpace component button (☕ → 🏆)
- [ ] Update rotating phrases for leaderboard theme
- [ ] Enhance Ko-fi button in LeaderboardModal footer

### Phase 2: Leaderboard Logic ✓
- [ ] Add streak leaders section to LeaderboardModal
- [ ] Update data fetching to query both donators and streak leaders
- [ ] Implement new layout with 3 sections (Top 3, Streaks, Others)
- [ ] Add conditional rendering based on opt-in status

### Phase 3: Privacy Controls ✓
- [ ] Add new fields to user data model
- [ ] Create ToggleSwitch component
- [ ] Update StatsModal with new privacy controls section
- [ ] Update default settings in ensureUserDocument
- [ ] Update useAuth.updateUserProfile to handle new fields

### Phase 4: Content Moderation ✓
- [ ] Create checkLeaderboardName Cloud Function
- [ ] Integrate AI moderation in save flow
- [ ] Add user feedback for rejected names
- [ ] Keep existing message approval for admin

### Phase 5: Donation Visibility ✓
- [ ] Update BillboardItem to respect showDonationAmount
- [ ] Update SupporterRow to respect showDonationAmount
- [ ] Add streak-only display section (no amounts)
- [ ] Filter out zero donations from queries

### Phase 6: Database ✓
- [ ] Add new fields to users collection schema
- [ ] Update leaderboard collection structure
- [ ] Write and run migration script
- [ ] Update Firestore security rules

### Phase 7: Cloud Functions ✓
- [ ] Create syncLeaderboard trigger function
- [ ] Update Ko-fi webhook to sync leaderboard
- [ ] Test function triggers

### Phase 8: Testing ✓
- [ ] Test opt-in/opt-out flow
- [ ] Test name moderation (appropriate and inappropriate names)
- [ ] Test donation visibility toggles
- [ ] Test streak display toggles
- [ ] Test leaderboard ordering (donators + streaks)
- [ ] Test mobile responsiveness

---

## Security Considerations

### Firestore Rules
**File**: `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leaderboard is public read, but only Cloud Functions can write
    match /leaderboard/{userId} {
      allow read: if true; // Public
      allow write: if false; // Only Cloud Functions
    }
  }
}
```

---

## Cost Considerations

### AI Moderation Costs
- **Function**: checkLeaderboardName
- **Model**: Gemini 1.5 Flash
- **Estimated calls**: ~5-10 per user (most users won't change names often)
- **Cost per call**: ~$0.00001 (very minimal)
- **Monthly estimate**: 1000 users × 5 calls = 5000 calls = ~$0.05/month

### Firestore Costs
- **Additional reads**: Leaderboard now queries 2 collections
  - ~100 reads per leaderboard view (50 donators + 50 streak leaders)
  - Assumed 1000 views/day = 100k reads/day = 3M reads/month
  - Cost: ~$0.18/month (first 50k free)
- **Additional writes**: Sync function on user settings change
  - Assumed 100 changes/day = 3k writes/month
  - Cost: Negligible (within free tier)

**Total Additional Cost**: ~$0.25/month (minimal)

---

## Timeline Estimate

- **Phase 1** (UI Changes): 2 hours
- **Phase 2** (Leaderboard Logic): 4 hours
- **Phase 3** (Privacy Controls): 3 hours
- **Phase 4** (Content Moderation): 3 hours
- **Phase 5** (Donation Visibility): 2 hours
- **Phase 6** (Database Updates): 2 hours
- **Phase 7** (Cloud Functions): 3 hours
- **Phase 8** (Testing & Refinement): 4 hours

**Total**: ~23 hours of development time

---

## Future Enhancements (Not in This Phase)

1. **Leaderboard Time Filters**: Allow users to see "This Week", "This Month", "All Time"
2. **Achievement Badges**: Award badges for milestones (10-day streak, $25 donated, etc.)
3. **Leaderboard Notifications**: Notify users when they enter top 10 for streaks
4. **Social Sharing**: Let users share their leaderboard rank
5. **Seasonal Competitions**: Monthly streak competitions with winner recognition

---

## Questions & Decisions Needed

### 1. Streak Minimum Threshold
**Current Plan**: Minimum 3-day streak to appear on leaderboard
**Question**: Is 3 days appropriate, or should it be higher (5, 7)?
**Recommendation**: Start with 3, can adjust based on data

### 2. Default Opt-In Status
**Current Plan**: `displayOnLeaderboard = false` (opt-out by default)
**Question**: Should supporters who donate automatically opt-in?
**Recommendation**: Keep opt-out by default for privacy, but show a prompt after donation

### 3. Name Change Frequency
**Question**: Should we limit how often users can change their display name?
**Recommendation**: Allow changes but require re-approval each time (already in plan)

### 4. Anonymous Default Name
**Current Plan**: Default to "Anonymous" instead of Google name
**Question**: Should we suggest their Google first name as a starting point?
**Recommendation**: Yes, but keep "Anonymous" as the default if they don't customize

---

## Summary

This plan transforms Proxle's leaderboard from a pure donation ranking into a hybrid system that celebrates both financial support AND consistent engagement (streaks). Key improvements:

✅ **Privacy-First**: Users control exactly what appears on the leaderboard
✅ **Engagement-Driven**: Streaks are now featured alongside donations
✅ **Safe Community**: AI moderates names, admins approve messages
✅ **Clear Incentives**: Top 3 donators get message "billboard" space
✅ **User Control**: Opt-in system with granular visibility settings

The system encourages both donation support and daily play while respecting user privacy and maintaining a family-friendly environment.
