import * as admin from 'firebase-admin';
import { resolve } from 'path';

const serviceAccountPath = resolve(__dirname, '../../../service-account-key.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'proxle-game'
    });
} catch (error) {
    console.log("Service account key not found, trying Application Default Credentials...");
    admin.initializeApp({
        projectId: 'proxle-game'
    });
}

const db = admin.firestore();

async function manualSync() {
    console.log("🔧 Manually syncing users to leaderboard...\n");

    const usersSnap = await db.collection('users').get();

    for (const doc of usersSnap.docs) {
        const data = doc.data();

        if (data.displayOnLeaderboard === true) {
            // Manually create/update the leaderboard entry
            const leaderboardData = {
                displayName: data.leaderboardName || data.displayName || 'Anonymous',
                amount: data.donations?.total || 0,
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
