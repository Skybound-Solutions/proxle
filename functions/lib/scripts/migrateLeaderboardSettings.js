"use strict";
/**
 * Migration Script: Add Leaderboard Privacy Settings
 *
 * Adds new privacy control fields to existing user documents:
 * - showDonationAmount
 * - showStreak
 * - leaderboardNameApprovalStatus
 *
 * Run with: npm run script:migrate-leaderboard
 */
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Initialize Firebase Admin
const serviceAccount = require('../../service-account-key.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
async function migrateLeaderboardSettings() {
    var _a, _b, _c, _d, _e;
    console.log('🚀 Starting migration: Adding leaderboard privacy settings...\n');
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    let updated = 0;
    let skipped = 0;
    let batch = db.batch();
    let batchCount = 0;
    console.log(`📊 Found ${snapshot.size} users to process\n`);
    for (const doc of snapshot.docs) {
        const data = doc.data();
        // Skip if new fields already exist
        if (data.showDonationAmount !== undefined &&
            data.showStreak !== undefined &&
            data.leaderboardNameApprovalStatus !== undefined) {
            skipped++;
            continue;
        }
        // Add new fields with correct defaults
        batch.update(doc.ref, {
            // Privacy settings (true by default if user opts in)
            showDonationAmount: (_a = data.showDonationAmount) !== null && _a !== void 0 ? _a : true,
            showStreak: (_b = data.showStreak) !== null && _b !== void 0 ? _b : true,
            // Approval status
            leaderboardNameApprovalStatus: (_c = data.leaderboardNameApprovalStatus) !== null && _c !== void 0 ? _c : 'approved',
            // Preserve existing settings
            displayOnLeaderboard: (_d = data.displayOnLeaderboard) !== null && _d !== void 0 ? _d : false,
            leaderboardName: (_e = data.leaderboardName) !== null && _e !== void 0 ? _e : 'Anonymous'
        });
        updated++;
        batchCount++;
        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
            console.log(`💾 Committing batch of ${batchCount} updates...`);
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
        }
    }
    // Commit remaining operations
    if (batchCount > 0) {
        console.log(`💾 Committing final batch of ${batchCount} updates...`);
        await batch.commit();
    }
    console.log('\n✅ Migration complete!');
    console.log(`   Updated: ${updated} users`);
    console.log(`   Skipped: ${skipped} users (already migrated)`);
    console.log(`   Total: ${snapshot.size} users\n`);
    process.exit(0);
}
// Run migration
migrateLeaderboardSettings().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
//# sourceMappingURL=migrateLeaderboardSettings.js.map