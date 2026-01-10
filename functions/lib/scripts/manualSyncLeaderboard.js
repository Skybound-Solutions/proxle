"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const path_1 = require("path");
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
async function manualSync() {
    var _a;
    console.log("🔧 Manually syncing users to leaderboard...\n");
    const usersSnap = await db.collection('users').get();
    for (const doc of usersSnap.docs) {
        const data = doc.data();
        if (data.displayOnLeaderboard === true) {
            // Manually create/update the leaderboard entry
            const leaderboardData = {
                displayName: data.leaderboardName || data.displayName || 'Anonymous',
                amount: ((_a = data.donations) === null || _a === void 0 ? void 0 : _a.total) || 0,
                currentStreak: data.currentStreak || 0,
                photoURL: data.photoURL || null,
                showAmount: data.showDonationAmount !== false,
                showStreak: data.showStreak !== false,
                displayOnLeaderboard: true,
                approvalStatus: data.messageApprovalStatus || 'pending',
                message: data.message || null,
                lastActiveAt: data.lastActiveAt || admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('leaderboard').doc(doc.id).set(leaderboardData);
            console.log(`✓ Synced: ${data.displayName || data.email}`);
        }
    }
    console.log("\n✅ Manual sync complete!");
    process.exit(0);
}
manualSync();
//# sourceMappingURL=manualSyncLeaderboard.js.map