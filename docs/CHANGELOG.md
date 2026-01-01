# Proxle Documentation - Recent Updates

This document tracks major updates and fixes to the Proxle application.

---

## December 31, 2025 - Word Selection Algorithm Fix

### Issue
Consecutive days showed very similar words (POND → PONY → POOL on Dec 29-31), causing poor user experience.

### Solution
- **Rebalanced word list:** 80% 5-letter words (605), 20% 4-letter words (151)
- **Shuffled distribution:** Used seeded random algorithm to prevent consecutive similar words
- **Reduced problematic clusters:** From 474 to 42 pairs (91% reduction)

### Impact
- Average similarity between consecutive words reduced from 0.65 to 0.33 (49% improvement)
- 80% of daily words are now 5-letter (up from 40%)
- No more repetitive patterns like POND/PONY/POOL

### Documentation
- **Main Summary:** [`README_WORD_SELECTION_FIX.md`](./README_WORD_SELECTION_FIX.md)
- **Technical Analysis:** [`WORD_SELECTION_ANALYSIS.md`](./WORD_SELECTION_ANALYSIS.md)
- **Implementation Details:** [`WORD_SELECTION_FINAL_SUMMARY.md`](./WORD_SELECTION_FINAL_SUMMARY.md)
- **Quick Reference:** [`WORD_SELECTION_FIX_SUMMARY.md`](./WORD_SELECTION_FIX_SUMMARY.md)

### Files Changed
- `functions/src/wordList.ts` - Updated with balanced, shuffled word list

### Status
✅ **Complete** - Ready for deployment

---

## Previous Updates

### Authentication Fixes
- Multiple OAuth and authentication issues resolved
- See: `AUTH_ISSUES_SUMMARY.md`, `AUTHENTICATION_FIX_IMPLEMENTATION.md`

### Admin Features
- Privacy tools for donation management
- See: `ADMIN_PRIVACY_TOOLS.md`

### Game Features
- Donation system and leaderboard
- See: `DONATIONS_LEADERBOARD_DESIGN.md`, `IMPLEMENTATION_COMPLETE.md`

---

## Documentation Index

### Game Design
- `game_design.md` - Core game mechanics
- `context.md` - Wordle research and context
- `CREATIVE_FEATURES.md` - Feature ideas

### Implementation
- `IMPLEMENTATION_COMPLETE.md` - Phase 1A completion
- `PHASE_1A_IMPLEMENTATION.md` - Detailed implementation notes
- `NEXT_VERSION_PLAN.md` - Future roadmap

### Authentication
- `AUTH_ISSUES_SUMMARY.md` - Authentication problems overview
- `AUTHENTICATION_FIX_IMPLEMENTATION.md` - Fix details
- `AUTH_TROUBLESHOOTING.md` - Troubleshooting guide
- `OAUTH_VERIFICATION_GUIDE.md` - OAuth setup

### Word Selection (NEW)
- `README_WORD_SELECTION_FIX.md` - **Main summary document**
- `WORD_SELECTION_ANALYSIS.md` - Technical analysis
- `WORD_SELECTION_FINAL_SUMMARY.md` - Implementation summary
- `WORD_SELECTION_FIX_SUMMARY.md` - Quick reference

### Business
- `MONETIZATION.md` - Revenue strategy
- `REVENUE_PROJECTIONS.md` - Financial projections
- `PRIVACY_POLICY.md` - Privacy policy
- `TERMS_OF_SERVICE.md` - Terms of service

### Setup & Configuration
- `EMAIL_SETUP.md` - Email configuration
- `GENKIT_SETUP.md` - Genkit setup
- `GCP_ACCESS_FIX.md` - GCP access fixes
- `RUN_AI.md` - AI setup instructions

---

**Last Updated:** December 31, 2025
