"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncLeaderboard = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
/**
 * Automatically sync the public leaderboard collection when users update their settings.
 * This denormalizes user data for efficient public leaderboard queries.
 */
exports.syncLeaderboard = (0, firestore_1.onDocumentUpdated)("users/{uid}", async (event) => {
    var _a, _b;
    const userId = event.params.uid;
    const afterData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
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
        amount: ((_b = afterData.donations) === null || _b === void 0 ? void 0 : _b.total) || 0,
        currentStreak: afterData.currentStreak || 0,
        // Privacy settings
        showAmount: afterData.showDonationAmount !== false, // Default true
        showStreak: afterData.showStreak !== false, // Default true
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
//# sourceMappingURL=syncLeaderboard.js.map