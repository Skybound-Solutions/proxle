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

async function forceSyncAll() {
    console.log("🔄 Forcing sync for all users...\n");

    const usersSnap = await db.collection('users').get();

    for (const doc of usersSnap.docs) {
        const data = doc.data();

        // Trigger the Cloud Function by making a tiny update
        await doc.ref.update({
            lastSyncedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✓ Triggered sync for: ${data.displayName || data.email}`);
    }

    console.log(`\n✅ Triggered sync for ${usersSnap.size} users.`);
    console.log("The syncLeaderboard Cloud Function should process these updates within a few seconds.");

    process.exit(0);
}

forceSyncAll();
