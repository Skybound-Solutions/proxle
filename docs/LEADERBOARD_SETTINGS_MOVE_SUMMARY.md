# Feature: Move Leaderboard Settings to Profile Menu

## Changes
1. **New Component**: `LeaderboardSettingsModal.tsx`
   - Encapsulates all leaderboard privacy controls and AI moderation logic.
   - Extracted from `StatsModal`.

2. **Cleaned Component**: `StatsModal.tsx`
   - Removed the "Leaderboard Settings" section.
   - Now focused purely on game statistics.

3. **Updated Component**: `ProfileMenu.tsx`
   - Added a new menu item "Leaderboard Settings" with a Trophy icon.
   - Located right before the "Sign Out" button.

4. **Updated App Logic**: `App.tsx`
   - Added state `showLeaderboardSettings`.
   - Wired the Profile Menu button to open the new modal.

## Why
This separates concerns (Stats vs Settings) and makes the leaderboard configuration more accessible from the profile management area, reducing clutter in the stats view.
