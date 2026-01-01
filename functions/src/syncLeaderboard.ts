import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * Automatically sync the public leaderboard collection when users update their settings.
 * This denormalizes user data for efficient public leaderboard queries.
 */
export const syncLeaderboard = onDocumentUpdated("users/{uid}", async (event) => {
    const userId = event.params.uid;
    const afterData = event.data?.after.data();

    if (!afterData) {
        logger.warn("No after data for user update", { userId });
        return;
    }

    const leaderboardRef = admin.firestore().collection("leaderboard").doc(userId);

    // If user opted out of leaderboard, remove their entry
    if (!afterData.displayOnLeaderboard) {
        logger.info("User opted out of leaderboard, removing entry", { userId });
        await leaderboardRef.delete();
        return;
    }

    // User is opted in - create or update leaderboard entry
    const leaderboardData = {
        // Display settings
        displayName: afterData.leaderboardName || "Anonymous",
        photoURL: afterData.photoURL || null,

        // Stats
        amount: afterData.donations?.total || 0,
        currentStreak: afterData.currentStreak || 0,

        // Privacy settings
        showAmount: afterData.showDonationAmount !== false,  // Default true
        showStreak: afterData.showStreak !== false,          // Default true

        // Message (only if supporter and approved)
        message: afterData.message || null,
        approvalStatus: afterData.messageApprovalStatus || "pending",

        // Metadata
        displayOnLeaderboard: true,
        lastActiveAt: afterData.lastActiveAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    logger.info("Syncing leaderboard entry", {
        userId,
        displayName: leaderboardData.displayName,
        amount: leaderboardData.amount,
        streak: leaderboardData.currentStreak
    });

    await leaderboardRef.set(leaderboardData, { merge: true });
});
