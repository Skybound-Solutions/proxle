"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const path_1 = require("path");
// Initialize Firebase Admin
const serviceAccountPath = (0, path_1.resolve)(__dirname, '../../../service-account-key.json');
try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'proxle-game'
    });
}
catch (error) {
    console.log("Service account key not found, trying Application Default Credentials...");
    admin.initializeApp({
        projectId: 'proxle-game'
    });
}
const db = admin.firestore();
async function giveInitialStreaks() {
    console.log("🚀 Giving initial streaks to leaderboard users...");
    try {
        const usersSnap = await db.collection('users').get();
        let updatedCount = 0;
        for (const doc of usersSnap.docs) {
            const data = doc.data();
            // Only update users who are set to appear on leaderboard but have 0/no streak
            if (data.displayOnLeaderboard === true && (!data.currentStreak || data.currentStreak === 0)) {
                await doc.ref.update({
                    currentStreak: 1
                });
                console.log(` - Updated ${data.leaderboardName || data.displayName || doc.id}`);
                updatedCount++;
            }
        }
        console.log(`✅ Successfully gave streaks to ${updatedCount} users.`);
    }
    catch (error) {
        console.error("❌ Error updating streaks:", error);
    }
}
giveInitialStreaks();
//# sourceMappingURL=giveInitialStreaks.js.map