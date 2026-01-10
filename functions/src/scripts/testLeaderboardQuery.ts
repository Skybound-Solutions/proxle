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

async function testQuery() {
    console.log("🔍 Testing the exact query used by LeaderboardModal...\n");

    try {
        console.log("Query: users collection");
        console.log("  where('displayOnLeaderboard', '==', true)");
        console.log("  where('showStreak', '==', true)");
        console.log("  where('currentStreak', '>=', 1)");
        console.log("  orderBy('currentStreak', 'desc')");
        console.log("  limit(20)\n");

        const snapshot = await db.collection('users')
            .where('displayOnLeaderboard', '==', true)
            .where('showStreak', '==', true)
            .where('currentStreak', '>=', 1)
            .orderBy('currentStreak', 'desc')
            .limit(20)
            .get();

        console.log(`✅ Query succeeded! Found ${snapshot.size} users:\n`);

        let counter = 0; // Introduce a counter if numbering is still desired
        snapshot.forEach((doc) => {
            const data = doc.data();
            counter++;
            console.log(`${counter}. ${data.leaderboardName || data.displayName} - Streak: ${data.currentStreak}`);
        });

    } catch (error: any) {
        console.error("❌ Query failed:", error.message);
        if (error.message.includes('index')) {
            console.log("\n⚠️  This is an index issue. The index might still be building.");
        }
    }

    process.exit(0);
}

testQuery();
