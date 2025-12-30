# Admin Panel: GDPR/Privacy Tools

## Overview
Admin dashboard tools for handling user privacy requests as outlined in the Privacy Policy:
1. **Data Access Request** - Export user's complete data
2. **Data Deletion Request** - Permanently delete user account and data
3. **Data Correction Request** - Update user information

---

## Privacy Requests Dashboard

### Location: `/admin` → Privacy Requests Tab

```
┌────────────────────────────────────────────────────┐
│  🎮 PROXLE ADMIN                                   │
│  [Overview] [Users] [Privacy Requests] ← New Tab   │
├────────────────────────────────────────────────────┤
│                                                    │
│  🔒 Privacy & Data Rights Requests                 │
│  ──────────────────────────────────────────────   │
│                                                    │
│  📊 Queue Status                                   │
│  Pending Requests: 2                               │
│  Completed (Last 30 Days): 8                       │
│  Average Response Time: 1.2 hours                  │
│                                                    │
│  ──────────────────────────────────────────────   │
│                                                    │
│  🔔 Active Requests (2)                            │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 📥 Data Access Request                       │ │
│  │ john@gmail.com                               │ │
│  │ Submitted: Dec 29, 2024 2:15 PM (30 min ago)│ │
│  │                                              │ │
│  │ [📦 Generate Export] [📧 Email to User]     │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🗑️ Deletion Request                          │ │
│  │ alice@gmail.com                              │ │
│  │ Submitted: Dec 29, 2024 1:45 PM (1 hour ago)│ │
│  │                                              │ │
│  │ ⚠️  User has 42 games and is VIP supporter   │ │
│  │                                              │ │
│  │ [🗑️ Confirm Deletion] [💬 Contact User]     │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ──────────────────────────────────────────────   │
│                                                    │
│  🔍 Manual User Lookup                             │
│  [Search by email...]               [Search]      │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 👤 alice@gmail.com                           │ │
│  │ Account Status: Active                       │ │
│  │ Data Size: 42 games, 2.3 KB                  │ │
│  │ Member Since: Dec 15, 2024                   │ │
│  │                                              │ │
│  │ [📦 Export Data] [🗑️ Delete Account]        │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Feature 1: Data Access Request (Export)

### What It Does
Generates a complete JSON export of all user data per GDPR Article 15.

### Included Data
```json
{
  "export_metadata": {
    "requested_at": "2024-12-29T14:15:00Z",
    "generated_at": "2024-12-29T14:16:23Z",
    "user_id": "abc123",
    "format_version": "1.0"
  },
  "profile": {
    "email": "john@gmail.com",
    "display_name": "John Doe",
    "photo_url": "https://...",
    "created_at": "2024-12-15T10:30:00Z",
    "last_active_at": "2024-12-29T08:00:00Z"
  },
  "game_statistics": {
    "total_games": 42,
    "total_wins": 38,
    "total_losses": 4,
    "win_rate": 90.5,
    "current_streak": 7,
    "max_streak": 12,
    "last_played_date": "2024-12-29",
    "guess_distribution": {
      "1": 2,
      "2": 15,
      "3": 20,
      "4": 8,
      "5": 3,
      "6+": 1
    }
  },
  "game_history": [
    {
      "date": "2024-12-29",
      "word": "CROWN",
      "guesses": ["LIGHT", "ROYAL", "CROWN"],
      "outcome": "win",
      "guess_count": 3,
      "completed_at": "2024-12-29T08:15:23Z"
    }
    // ... all games
  ],
  "donations": {
    "total_donated": 25.00,
    "donation_count": 3,
    "last_donation_at": "2024-12-20T12:00:00Z",
    "tier": "supporter"
  },
  "leaderboard_settings": {
    "opted_in": true,
    "display_name": "Johnny the Word King",
    "approval_status": "approved"
  },
  "achievements": ["first_win", "week_warrior", "semantic_savant"],
  "shares": {
    "share_count": 15,
    "last_shared_at": "2024-12-29T08:16:00Z"
  }
}
```

### Admin Interface

**Button:** "📦 Generate Export"

**When Clicked:**
1. Queries Firestore for all user documents
2. Queries game history collection
3. Queries donations collection
4. Compiles JSON file
5. Saves to Google Cloud Storage (temporary, 7-day expiration)
6. Generates secure download link
7. Shows success modal:

```
┌────────────────────────────────────────┐
│  ✅ Data Export Ready                  │
├────────────────────────────────────────┤
│                                        │
│  Export generated for john@gmail.com   │
│                                        │
│  📁 File: proxle-export-20241229.json  │
│  📊 Size: 12.3 KB                      │
│  🔗 Link expires: Jan 5, 2025          │
│                                        │
│  Download Link:                        │
│  [https://storage.googleapis.com/...]  │
│                                        │
│  [📋 Copy Link] [📧 Email to User]    │
│                                        │
└────────────────────────────────────────┘
```

**Email Template:**
```
Subject: Your Proxle Data Export

Hi John,

Your data export is ready! Click the link below to download:

🔗 https://storage.googleapis.com/proxle-exports/abc123.json

This link expires in 7 days for security.

The file contains:
- Your profile information
- Game statistics and history
- Donation records (if applicable)
- Leaderboard settings
- Achievements

If you have questions, reply to this email.

- Proxle Team
```

---

## Feature 2: Account Deletion Request

### What It Does
Permanently deletes user account and all associated data per GDPR Article 17 (Right to be Forgotten).

### What Gets Deleted

**Immediate Deletion:**
- `users/{userId}` document
- All game history in `games/{userId}/...`
- All achievements in `achievements/{userId}`
- User's stories in `stories/...` (removes author link, keeps stories)
- Leaderboard entry

**Retained (Anonymized):**
- Aggregate stats (e.g., "42 total users" decrements to "41")
- Donation records (financial/tax reasons, but anonymized)
  - `userId` → `null`
  - `email` → `deleted-user-{timestamp}@example.com`

### Admin Confirmation Flow

**Warning Modal:**
```
┌────────────────────────────────────────────────┐
│  ⚠️  Confirm Account Deletion                  │
├────────────────────────────────────────────────┤
│                                                │
│  You are about to permanently delete:          │
│                                                │
│  📧 alice@gmail.com                            │
│  👤 Alice C.                                   │
│  🎮 42 games played                            │
│  💎 VIP Supporter ($125 donated)               │
│  🏆 12-day max streak                          │
│                                                │
│  ⚠️  THIS ACTION CANNOT BE UNDONE!             │
│                                                │
│  The following will be deleted:                │
│  ✓ Profile and game statistics                │
│  ✓ Game history (42 games)                    │
│  ✓ Achievements (5 unlocked)                   │
│  ✓ Leaderboard entry                           │
│  ✓ Stories (3 submitted)                       │
│                                                │
│  Donation records will be anonymized.          │
│                                                │
│  Type user's email to confirm:                 │
│  [________________________________]             │
│                                                │
│  [❌ Cancel] [🗑️ DELETE ACCOUNT]              │
│                                                │
└────────────────────────────────────────────────┘
```

### Implementation (Cloud Function)

```typescript
export const deleteUserAccount = functions.https.onCall(async (data, context) => {
  // Check admin auth
  if (context.auth?.token.email !== 'YOUR_ADMIN_EMAIL') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  
  const { userId } = data;
  const batch = db.batch();
  
  // 1. Delete user profile
  batch.delete(db.collection('users').doc(userId));
  
  // 2. Delete game history
  const games = await db.collection('games').where('userId', '==', userId).get();
  games.docs.forEach(doc => batch.delete(doc.ref));
  
  // 3. Delete achievements
  const achievements = await db.collection('achievements').doc(userId).get();
  if (achievements.exists) {
    batch.delete(achievements.ref);
  }
  
  // 4. Remove from leaderboard
  batch.delete(db.collection('leaderboard').doc(userId));
  
  // 5. Anonymize donations (retain for financial records)
  const donations = await db.collection('donations').where('userId', '==', userId).get();
  donations.docs.forEach(doc => {
    batch.update(doc.ref, {
      userId: null,
      email: `deleted-user-${Date.now()}@example.com`,
      anonymized: true,
    });
  });
  
  // 6. Anonymize stories (keep content, remove author)
  const stories = await db.collection('stories').where('userId', '==', userId).get();
  stories.docs.forEach(doc => {
    batch.update(doc.ref, {
      userId: null,
      displayName: 'Deleted User',
      anonymized: true,
    });
  });
  
  // Commit batch
  await batch.commit();
  
  // 7. Disable Firebase Auth account
  await admin.auth().deleteUser(userId);
  
  return { success: true, message: 'User account deleted successfully' };
});
```

### Post-Deletion Email

```
Subject: Your Proxle Account Has Been Deleted

Hi Alice,

Your Proxle account has been permanently deleted as requested.

What was deleted:
✓ Your profile and login
✓ All game history and statistics
✓ Achievements and badges
✓ Leaderboard entries

Note: Your donation records have been anonymized for 
financial/tax purposes, but all personal identifiers 
have been removed.

Thank you for playing Proxle. You're always welcome 
to create a new account if you change your mind!

- Proxle Team
```

---

## Feature 3: Data Correction Request

### What It Does
Allows users to request corrections to their stored data (rare, mostly for edge cases).

### Common Scenarios
1. **Wrong email linked to donation**
2. **Incorrect stats due to bug**
3. **Leaderboard name typo**
4. **Merge duplicate accounts**

### Admin Interface

**Manual Edit Modal:**
```
┌────────────────────────────────────────────────┐
│  ✏️  Edit User Data                            │
│  alice@gmail.com                               │
├────────────────────────────────────────────────┤
│                                                │
│  Profile                                       │
│  Display Name: [Alice Chen____________]        │
│  Photo URL: [https://...____________]          │
│                                                │
│  Statistics (Use with caution!)                │
│  Total Games: [42]                             │
│  Total Wins: [38]                              │
│  Current Streak: [7]                           │
│  Max Streak: [12]                              │
│                                                │
│  Donations                                     │
│  Total Donated: [$125.00]                      │
│  Donation Count: [5]                           │
│                                                │
│  Leaderboard                                   │
│  Display Name: [Alice C.____________]          │
│  Approval Status: [Approved ▼]                 │
│                                                │
│  ⚠️  Changes are logged for audit trail        │
│                                                │
│  [Save Changes] [Cancel]                       │
│                                                │
└────────────────────────────────────────────────┘
```

**Audit Log (Firestore):**
```typescript
// Collection: adminActions
{
  timestamp: Timestamp,
  adminEmail: 'admin@proxle.app',
  action: 'edit_user_data',
  userId: 'abc123',
  changes: {
    'totalGames': { old: 41, new: 42 },
    'displayName': { old: 'Alise Chen', new: 'Alice Chen' }
  },
  reason: 'User reported stats bug from Dec 15'
}
```

---

## Request Intake Flow

### How Users Submit Requests

**Option 1: Email to proxle@skyboundmi.com**
Users send email with subject:
- "Data Export Request"
- "Delete My Account"
- "Correct My Data"

You manually action these via admin panel.

---

**Option 2: In-App Form (Phase 2)**

Settings → Privacy → "Data Rights Requests"

```
┌────────────────────────────────────────┐
│  🔒 Your Data Rights                   │
├────────────────────────────────────────┤
│                                        │
│  📥 Request My Data                    │
│  Get a copy of all your Proxle data.   │
│  [Request Export]                      │
│                                        │
│  🗑️ Delete My Account                  │
│  Permanently delete your account.      │
│  [Request Deletion]                    │
│                                        │
│  ✏️ Correct My Data                    │
│  Report incorrect information.         │
│  [Contact Support]                     │
│                                        │
└────────────────────────────────────────┘
```

**After clicking "Request Export":**
```
┌────────────────────────────────────────┐
│  ✅ Export Requested                   │
├────────────────────────────────────────┤
│                                        │
│  Your data export request has been     │
│  submitted. You'll receive a download  │
│  link at john@gmail.com within 24 hrs. │
│                                        │
│  Request ID: #20241229-001             │
│                                        │
│  [OK]                                  │
│                                        │
└────────────────────────────────────────┘
```

Request gets added to Firestore queue → You action via admin panel.

---

## Admin Implementation Checklist

### Phase 1: Manual Process (Now)
- [ ] Email inbox (proxle@skyboundmi.com) for requests
- [ ] Admin panel user search
- [ ] Manual export button (downloads JSON)
- [ ] Manual delete button (with confirmation)
- [ ] Manual edit fields for corrections

### Phase 2: Semi-Automated (Later)
- [ ] In-app request forms
- [ ] Firestore queue for requests
- [ ] Email notifications to admin
- [ ] Auto-generate exports (no manual intervention)
- [ ] Scheduled cleanup of expired exports

### Phase 3: Fully Automated (Future)
- [ ] User-initiated self-service export (instant download)
- [ ] 30-day account deletion grace period (user can cancel)
- [ ] Audit logs dashboard
- [ ] Compliance reporting (# of requests handled)

---

## Firestore Schema for Requests

```typescript
// Collection: privacyRequests
interface PrivacyRequest {
  id: string;
  type: 'access' | 'deletion' | 'correction';
  userId: string;
  userEmail: string;
  submittedAt: Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  completedAt?: Timestamp;
  completedBy?: string; // Admin email
  notes?: string;
  exportUrl?: string; // If type === 'access'
  deletionConfirmed?: boolean; // If type === 'deletion'
}
```

---

## Sample Cloud Function: Export Handler

```typescript
export const generateUserDataExport = functions.https.onCall(async (data, context) => {
  // Check admin or user self-requesting
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }
  
  const { userId } = data;
  
  // Authorization check
  const isAdmin = context.auth.token.email === 'YOUR_ADMIN_EMAIL';
  const isSelfRequest = context.auth.uid === userId;
  
  if (!isAdmin && !isSelfRequest) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized');
  }
  
  // Gather all user data
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  const gamesSnap = await db.collection('games')
    .where('userId', '==', userId)
    .orderBy('date', 'desc')
    .get();
  const games = gamesSnap.docs.map(doc => doc.data());
  
  const donationsSnap = await db.collection('donations')
    .where('userId', '==', userId)
    .get();
  const donations = donationsSnap.docs.map(doc => doc.data());
  
  const exportData = {
    export_metadata: {
      requested_at: new Date().toISOString(),
      generated_at: new Date().toISOString(),
      user_id: userId,
      format_version: '1.0',
    },
    profile: userData,
    game_history: games,
    donations: donations,
  };
  
  // Save to Cloud Storage
  const bucket = admin.storage().bucket();
  const filename = `exports/user-${userId}-${Date.now()}.json`;
  const file = bucket.file(filename);
  
  await file.save(JSON.stringify(exportData, null, 2), {
    metadata: {
      contentType: 'application/json',
      metadata: {
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      },
    },
  });
  
  // Generate signed URL (7-day expiration)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000),
  });
  
  return { 
    success: true, 
    downloadUrl: url,
    expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
  };
});
```

---

## Summary

| Feature | Purpose | Complexity | Priority |
|:--------|:--------|:-----------|:---------|
| **Data Export** | GDPR Article 15 compliance | Medium | High |
| **Account Deletion** | GDPR Article 17 compliance | Medium | High |
| **Data Correction** | User data accuracy | Low | Medium |
| **Request Queue** | Track/manage requests | Low | Medium |
| **Audit Logs** | Compliance documentation | Low | Low |

**Implementation Timeline:**
- **Phase 1:** Manual tools in admin panel (Week 2-3)
- **Phase 2:** User-facing request forms (Week 4)
- **Phase 3:** Full automation (Month 2+)

**Next:** Add these tools to Phase 1C (Admin Dashboard) implementation.
