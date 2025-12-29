# Proxle OAuth & Features: Complete Planning Summary

## 📋 What We've Built (Planning Phase)

### Legal & OAuth Preparation ✅
- **Privacy Policy** (`docs/PRIVACY_POLICY.md`)
- **Terms of Service** (`docs/TERMS_OF_SERVICE.md`)
- **React Routes** for `/privacy` and `/terms`
- **OAuth Verification Guide** with step-by-step instructions
- **Email Setup Guide** for support@proxle.app

### Feature Planning ✅
- **Feature Roadmap** (`docs/FEATURE_ROADMAP.md`)
  - Complete stats schema (basic + advanced)
  - UI/UX designs for profile menu, stats modal, sharing
  - Admin dashboard specifications
  - Donations system (Ko-fi integration)
  - 3 creative features: Share images, Achievements, AI hints
  - 4-phase implementation timeline

- **Phase 1A Implementation Plan** (`docs/PHASE_1A_IMPLEMENTATION.md`)
  - Exact code for authentication
  - File-by-file implementation guide
  - Testing checklist
  - Deployment steps

---

## 🎯 Your Feature Requests: Status

| Feature | Status | Document | Notes |
|:--------|:-------|:---------|:------|
| **Google OAuth** | ✅ Planned | FEATURE_ROADMAP.md, PHASE_1A | Profile in upper right |
| **Stats & Streaks** | ✅ Planned | FEATURE_ROADMAP.md | Comprehensive schema defined |
| **FTUE (Info pane day 1)** | ✅ Planned | PHASE_1A | localStorage check |
| **Privacy/Terms in Info** | ✅ Implemented | App.tsx (current) | Links in footer |
| **Admin Dashboard** | ✅ Planned | FEATURE_ROADMAP.md | User search, metrics, costs |
| **Ko-fi Integration** | ✅ Planned | FEATURE_ROADMAP.md | Webhook receiver |
| **Donations Leaderboard** | ✅ Planned | FEATURE_ROADMAP.md | Public `/supporters` page |
| **Share with Streak** | ✅ Planned | FEATURE_ROADMAP.md | Enhanced share text |
| **Searchable User List** | ✅ Planned | FEATURE_ROADMAP.md | Admin feature |
| **Link Donations to Users** | ✅ Planned | FEATURE_ROADMAP.md | Via email matching |

---

## 💡 Your Additional Suggestions Answered

### 1. **Social Share Images** 🎨 (Non-Obvious!)
**Concept:** Generate beautiful PNG images of game results with QR code  
**Why:** 10x more engagement on social media than text  
**Status:** ✅ Planned (Phase 2B)  
**Implementation:** html2canvas library  
**Complexity:** Medium (2-3 hours)  
**Impact:** High (viral marketing)

### 2. **Achievements System** 🏆
**Concept:** Unlockable badges (Week Warrior, One Shot, Semantic Savant, etc.)  
**Why:** Gamification → retention  
**Status:** ✅ Planned (Phase 2B)  
**Implementation:** Firestore achievement tracking  
**Complexity:** Medium (4-5 hours)  
**Impact:** High (daily engagement boost)

### 3. **AI Hint System** 💡
**Concept:** AI-powered contextual hints for stuck players  
**Monetization:** Free users watch ad, supporters get unlimited  
**Why:** Reduces frustration while monetizing non-payers  
**Status:** ✅ Planned (Phase 3)  
**Implementation:** Gemini API + AdSense  
**Complexity:** Medium (3-4 hours)  
**Impact:** High (retention + revenue)

---

## 💰 Cost Analysis

### Current Costs (No Auth, ~100 users/day)
- **Gemini API**: $2-5/month
- **Firebase Hosting/Functions**: Free tier
- **Total**: ~$5/month

### Projected Costs (With All Features, 10k users)
| Service | Monthly Cost |
|:--------|:-------------|
| Firestore | $0 (free tier covers) |
| Firebase Auth | $0 (50k MAU free) |
| Gemini API | $15-30 |
| Cloud Functions | $0-5 |
| **TOTAL** | **$20-35/month** |

### Revenue Projections
- **Conservative:** 3 supporters @ $5/mo = $15/mo (break even)
- **Moderate:** 10 supporters @ $10/mo = $100/mo (+$70 profit)
- **Optimistic:** 25 supporters @ $8/mo = $200/mo (+$170 profit)

**Goal:** 10+ regular supporters = sustainable + profitable ✅

---

## 🗺️ Implementation Roadmap

### ✅ **Completed (Now)**
- Privacy Policy & Terms
- Legal page routes
- OAuth verification guide
- Complete feature planning

### **Phase 1A: Authentication** (Week 1, ~8 hours)
- [ ] Firebase Auth setup
- [ ] Profile menu component
- [ ] Sign in/out flows
- [ ] First-time user experience
- [ ] User document creation

### **Phase 1B: Stats & Streaks** (Week 1-2, ~10 hours)
- [ ] Stats schema implementation
- [ ] Streak calculation logic
- [ ] Stats modal UI
- [ ] Guess distribution chart
- [ ] Enhanced sharing

### **Phase 1C: Admin Dashboard** (Week 2, ~12 hours)
- [ ] `/admin` route with auth
- [ ] Real-time metrics
- [ ] User search
- [ ] Top users table
- [ ] Manual cost tracking

### **Phase 2A: Donations** (Week 3, ~8 hours)
- [ ] Ko-fi webhook
- [ ] Link donations to users
- [ ] Public supporters leaderboard
- [ ] Privacy controls

### **Phase 2B: Social & Achievements** (Week 4, ~10 hours)
- [ ] Share image generator
- [ ] Achievement system
- [ ] Daily challenges

### **Phase 3: Advanced** (Future)
- [ ] AI hints
- [ ] Global leaderboards
- [ ] Friend system
- [ ] Email summaries

**Total Active Development Time:** ~50 hours (~1 month part-time)

---

## 🤔 Open Design Questions (For Discussion)

### 1. **Streak Timezone Handling**
**Options:**
- A. Browser timezone (simplest)
- B. User-selectable timezone (best UX)
- C. UTC only (simplest, but confusing)

**Recommendation:** Start with Browser timezone (A), add setting later

---

### 2. **Guest Play Behavior**
**Options:**
- A. Allow guest play, localStorage fallback
- B. Require sign-in to play
- C. Guest play but limited features

**Recommendation:** Option A with merge on sign-in

---

### 3. **Ko-fi Donation Matching**
**Problem:** Donor email might not match Google account

**Solutions:**
- A. Match by exact email
- B. Manual admin override
- C. User self-claim with donation code

**Recommendation:** A + B (auto-match, admin can manually link)

---

### 4. **Supporters Leaderboard Privacy**
**Options:**
- A. Show exact amounts
- B. Show name only
- C. Show tiers (<$5, $5-20, $20+)

**Recommendation:** Option C (tiers) to avoid discouraging small donors

---

### 5. **Retroactive Achievements**
**Question:** Grant achievements for past performance?

**Options:**
- A. Yes, for all achievements
- B. Only streak-based
- C. None, start from launch

**Recommendation:** Option B (streak-based only, since we have date data)

---

## 📊 Admin Dashboard Mock (Reference)

```
┌────────────────────────────────────────────────┐
│  🎮 PROXLE ADMIN                    [@] Razma  │
├────────────────────────────────────────────────┤
│                                                │
│  📊 Overview                   Dec 29, 2024    │
│  ────────────────────────────────────────────  │
│                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ Total Users │ │ Active Today│ │  Games   │ │
│  │    1,247    │ │      89     │ │  4,392   │ │
│  └─────────────┘ └─────────────┘ └──────────┘ │
│                                                │
│  💰 Revenue & Costs                            │
│  ────────────────────────────────────────────  │
│  Ko-fi (This Month)           $127.00  (8)     │
│  Google Cloud                  $8.42           │
│  Net                          +$118.58  💚     │
│                                                │
│  🔍 [Search users...]                          │
│                                                │
│  🏆 Top Streaks                                │
│  1. Alice C.  🔥45   $15  ⭐                   │
│  2. Bob S.    🔥32   $0                        │
│                                                │
└────────────────────────────────────────────────┘
```

---

## ✅ Next Steps (Your Choice)

### **Option A: Deploy Legal Pages First**
1. Test `/privacy` and `/terms` locally (dev server is running!)
2. Build & deploy to production
3. Submit for OAuth verification
4. Wait for approval (3-7 days)
5. Then implement Phase 1A

**Pros:** Get verification process started ASAP  
**Timeline:** Can submit today

---

### **Option B: Start Phase 1A Implementation Now**
1. Implement authentication (use test users)
2. Build stats system
3. Test locally
4. Deploy everything together
5. Submit for OAuth verification

**Pros:** More complete feature set at launch  
**Timeline:** 1 week dev, then submit

---

### **Option C: Hybrid Approach** ⭐ (Recommended)
1. **Today:** Deploy legal pages, submit OAuth verification
2. **This week:** Build Phase 1A while waiting for approval
3. **Next week:** OAuth approved → deploy auth system
4. **Following weeks:** Phase 1B, 1C, 2A...

**Pros:** Maximize parallelization, no wasted time  
**Timeline:** Continuous progress

---

## 📁 All Documentation

| Document | Purpose |
|:---------|:--------|
| `PRIVACY_POLICY.md` | Legal requirement for OAuth |
| `TERMS_OF_SERVICE.md` | Legal protection |
| `OAUTH_VERIFICATION_GUIDE.md` | Step-by-step OAuth submission |
| `EMAIL_SETUP.md` | Configure support@proxle.app |
| `OAUTH_DEPLOYMENT_SUMMARY.md` | Overview of OAuth setup |
| `NEXT_VERSION_PLAN.md` | Original feature request discussion |
| `FEATURE_ROADMAP.md` | **Complete feature specifications** ⭐ |
| `PHASE_1A_IMPLEMENTATION.md` | **Exact code for authentication** ⭐ |

---

## 💬 Questions?

I'm ready to:
1. Start implementing Phase 1A (authentication)
2. Deploy the legal pages for OAuth verification
3. Clarify any design decisions
4. Adjust the roadmap based on your feedback

**What would you like to tackle first?**
