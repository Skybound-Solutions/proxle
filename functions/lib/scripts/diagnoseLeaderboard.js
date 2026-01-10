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
async function diagnose() {
    console.log("=== DIAGNOSING LEADERBOARD DATA ===\n");
    const usersSnap = await db.collection('users').get();
    console.log(`Total users: ${usersSnap.size}\n`);
    console.log("--- User Details ---");
    usersSnap.forEach(doc => {
        const d = doc.data();
        console.log(`\nUser: ${d.displayName || d.email || doc.id}`);
        console.log(`  Email: ${d.email}`);
        console.log(`  Display on Leaderboard: ${d.displayOnLeaderboard}`);
        console.log(`  Leaderboard Name: ${d.leaderboardName || 'not set'}`);
        console.log(`  Current Streak: ${d.currentStreak || 0}`);
        console.log(`  Show Streak: ${d.showStreak}`);
        console.log(`  Approval Status: ${d.leaderboardNameApprovalStatus || 'not set'}`);
    });
    console.log("\n\n=== LEADERBOARD COLLECTION ===");
    const lbSnap = await db.collection('leaderboard').get();
    console.log(`Total leaderboard entries: ${lbSnap.size}\n`);
    lbSnap.forEach(doc => {
        const d = doc.data();
        console.log(`Entry: ${d.displayName}`);
        console.log(`  Amount: $${d.amount || 0}`);
        console.log(`  Streak: ${d.currentStreak || 0}`);
        console.log(`  Show Streak: ${d.showStreak}`);
        console.log(`  Display on LB: ${d.displayOnLeaderboard}`);
        console.log('---');
    });
    process.exit(0);
}
diagnose();
//# sourceMappingURL=diagnoseLeaderboard.js.map