import { Timestamp } from 'firebase/firestore';

export interface UserStats {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    currentStreak: number;
    maxStreak: number;
    lastPlayedDate: Timestamp | null;
    guessDistribution: Record<string, number>;
    winRate: number;

    // Leaderboard Settings
    displayOnLeaderboard?: boolean;
    leaderboardName?: string;
    showDonationAmount?: boolean;
    showStreak?: boolean;
    leaderboardNameApprovalStatus?: 'pending' | 'approved' | 'rejected';
    message?: string;
    messageApprovalStatus?: 'pending' | 'approved' | 'rejected';

    // Donations
    donations?: {
        total: number;
        count: number;
    };
}

/**
 * Calculates the new stats for a user after a game completion.
 * Handles streak logic (increment if consecutive day, reset if missed day).
 */
export function calculateNewStats(
    currentStats: UserStats,
    didWin: boolean,
    guessCount: number
): UserStats {
    const now = new Date();

    // Clone stats to avoid mutation
    const newStats = { ...currentStats };

    // 1. Basic Counts
    newStats.totalGames += 1;
    if (didWin) {
        newStats.totalWins += 1;
    } else {
        newStats.totalLosses += 1;
    }

    // 2. Win Rate
    newStats.winRate = Math.round((newStats.totalWins / newStats.totalGames) * 100);

    // 3. Streak Logic
    if (didWin) {
        if (!newStats.lastPlayedDate) {
            // First game ever
            newStats.currentStreak = 1;
        } else {
            const lastPlayed = newStats.lastPlayedDate.toDate();

            // BUG FIX #1: Normalize dates to UTC midnight to avoid timezone issues
            const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const lastPlayedDay = new Date(Date.UTC(
                lastPlayed.getUTCFullYear(),
                lastPlayed.getUTCMonth(),
                lastPlayed.getUTCDate()
            ));

            // Use Math.floor instead of Math.ceil to avoid off-by-one errors
            const diffTime = Math.abs(today.getTime() - lastPlayedDay.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day! Increment streak
                newStats.currentStreak += 1;
            } else if (diffDays === 0) {
                // Already played today? (Should be prevented by UI, but safety check)
                // Do nothing to streak
            } else {
                // Missed a day (or more). Reset streak.
                newStats.currentStreak = 1;
            }
        }

        // Update Max Streak
        if (newStats.currentStreak > newStats.maxStreak) {
            newStats.maxStreak = newStats.currentStreak;
        }
    } else {
        // Loss breaks streak
        newStats.currentStreak = 0;
    }

    // 4. Guess Distribution (Only on win)
    if (didWin) {
        const key = guessCount >= 8 ? '8+' : guessCount.toString();
        newStats.guessDistribution = {
            ...newStats.guessDistribution,
            [key]: (newStats.guessDistribution[key] || 0) + 1
        };
    }

    return newStats;
}
