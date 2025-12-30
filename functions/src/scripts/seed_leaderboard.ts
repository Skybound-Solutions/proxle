
import * as admin from 'firebase-admin';

// Initialize admin SDK (uses default credential if running locally with emulator or logged in via CLI)
if (admin.apps.length === 0) {
    // For local script execution, we assume default application credentials are set up
    // or we are running in an environment where it can find them.
    // If running solely locally against prod, 'firebase login' usually handles credentials for client SDKs,
    // but for admin SDK scripts, setting GOOGLE_APPLICATION_CREDENTIALS might be needed or simple init:
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'proxle-game'
    });
}
const db = admin.firestore();

// Fake data for seeding
const FAKE_SUPPORTERS = [
    {
        id: 'user_seed_1',
        displayName: 'WordMaster99',
        amount: 50,
        message: 'Love this game! Keep it up!',
        approvalStatus: 'approved',
        isAnonymous: false,
        showAmount: 'exact'
    },
    {
        id: 'user_seed_2',
        displayName: 'Anonymous',
        amount: 25,
        message: null,
        approvalStatus: 'approved',
        isAnonymous: true,
        showAmount: 'hidden'
    },
    {
        id: 'user_seed_3',
        displayName: 'PuzzleQueen',
        amount: 10,
        message: 'Make it harder next time! 😉',
        approvalStatus: 'approved',
        isAnonymous: false,
        showAmount: 'tier'
    },
    {
        id: 'user_seed_4',
        displayName: 'CoffeeLover',
        amount: 5,
        message: 'Here is a coffee for you ☕',
        approvalStatus: 'pending', // Pending message
        isAnonymous: false,
        showAmount: 'exact'
    },
    {
        id: 'user_seed_5',
        displayName: 'GhostPlayer',
        amount: 100,
        message: 'Best word game since Wordle.',
        approvalStatus: 'approved',
        isAnonymous: false,
        showAmount: 'exact'
    }
];

async function seedLeaderboard() {
    console.log('🌱 Seeding fake leaderboard data...');

    const batch = db.batch();

    for (const supporter of FAKE_SUPPORTERS) {
        const ref = db.collection('leaderboard').doc(supporter.id);
        batch.set(ref, {
            ...supporter,
            photoURL: null, // No fake photos for now to keep it simple
            lastActiveAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    try {
        await batch.commit();
        console.log('✅ Successfully seeded fake supporters to "leaderboard" collection!');
        console.log('🔄 Refresh your app to see them in the Supporters Hall.');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
}

seedLeaderboard();
