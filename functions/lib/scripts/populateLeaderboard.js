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
async function populateLeaderboard() {
    console.log("🚀 Starting Leaderboard Population...");
    try {
        const usersSnap = await db.collection('users').get();
        console.log(`Found ${usersSnap.size} users.`);
        let updatedCount = 0;
        const batchSize = 100;
        let batch = db.batch();
        let operationCounter = 0;
        for (const doc of usersSnap.docs) {
            const data = doc.data();
            // Skip if already on leaderboard
            if (data.displayOnLeaderboard === true) {
                // console.log(`Skipping ${data.displayName || doc.id} (already enabled)`);
                continue;
            }
            // Prepare updates to enable leaderboard visibility
            const updates = {
                displayOnLeaderboard: true,
                showStreak: true,
                showDonationAmount: true, // Default to true for this population
                leaderboardName: data.leaderboardName || data.displayName || 'Anonymous Player',
                leaderboardNameApprovalStatus: data.leaderboardNameApprovalStatus || 'approved', // Auto-approve for existing
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            batch.update(doc.ref, updates);
            updatedCount++;
            operationCounter++;
            if (operationCounter >= batchSize) {
                await batch.commit();
                console.log(`Committed batch of ${operationCounter} updates...`);
                batch = db.batch();
                operationCounter = 0;
            }
        }
        if (operationCounter > 0) {
            await batch.commit();
        }
        console.log(`✅ Successfully updated ${updatedCount} users to appear on the leaderboard.`);
        console.log("This should trigger the 'syncLeaderboard' Cloud Function for each user.");
    }
    catch (error) {
        console.error("❌ Error populating leaderboard:", error);
    }
}
populateLeaderboard();
//# sourceMappingURL=populateLeaderboard.js.map