import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { calculateNewStats, type UserStats } from '../lib/stats';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Create/update user document & fetch stats
                const data = await ensureUserDocument(firebaseUser);
                setUserData(data as UserStats);
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signOutUser = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    const updateStats = async (didWin: boolean, guessCount: number) => {
        if (!user || !userData) return;

        const newStats = calculateNewStats(userData, didWin, guessCount);

        // Optimistic update
        setUserData(newStats);

        // Persist
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            ...newStats,
            lastPlayedDate: serverTimestamp() // Use server time for truth
        });
    };

    const updateUserProfile = async (data: { leaderboardName?: string, message?: string, displayOnLeaderboard?: boolean, showAmount?: string }) => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const updates: any = { ...data };

        // If message is being updated, it must be re-approved
        if (data.message !== undefined) {
            updates.messageApprovalStatus = 'pending';
        }

        await updateDoc(userRef, updates);

        // Fetch fresh data
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setUserData(userSnap.data() as UserStats);
        }
    };

    return { user, userData, loading, signInWithGoogle, signOutUser, updateStats, updateUserProfile };
}

async function ensureUserDocument(user: User) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const initialStats = {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            currentStreak: 0,
            maxStreak: 0,
            lastPlayedDate: null,
            guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, '8+': 0 },
            winRate: 0
        };

        // Create new user document
        await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),

            ...initialStats,

            // Settings
            displayOnLeaderboard: false,
            leaderboardName: user.displayName ? `${user.displayName.split(' ')[0]} ${user.displayName.split(' ')[1]?.[0] || ''}.` : 'Anonymous',

            // Leaderboard/Donations
            donations: {
                total: 0,
                count: 0
            }
        });
        return initialStats;
    } else {
        // Update last active
        await setDoc(userRef, {
            lastActiveAt: serverTimestamp(),
        }, { merge: true });

        return userSnap.data();
    }
}
