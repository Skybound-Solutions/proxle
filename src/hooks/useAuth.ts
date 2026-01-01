import { useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    type User
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { calculateNewStats, type UserStats } from '../lib/stats';

// Helper function for user-friendly error messages
// This function is not part of the original file, but is required by the new code.
// Assuming it's a private helper or will be added elsewhere.
function getFriendlyErrorMessage(errorCode: string): string {
    switch (errorCode) {
        case 'auth/popup-blocked':
            return 'Pop-up blocked by your browser. Please allow pop-ups for this site or try again.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in cancelled. You closed the pop-up window.';
        case 'auth/cancelled-popup-request':
            return 'Sign-in attempt cancelled. Please try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection and try again.';
        case 'auth/unauthorized-domain':
            return 'Authentication not configured for this domain. Please contact support.';
        case 'auth/internal-error':
            return 'An internal error occurred. This might happen in private browsing mode. Trying an alternative sign-in method.';
        case 'auth/user-disabled':
            return 'Your account has been disabled. Please contact support.';
        case 'auth/operation-not-allowed':
            return 'Sign-in method not enabled. Please contact support.';
        default:
            return 'An unexpected error occurred during sign-in. Please try again.';
    }
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

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

    // Check for redirect result on mount
    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    // Successfully signed in via redirect
                    console.log('Successfully signed in via redirect:', result.user.email);
                    setAuthError(null);
                }
            } catch (error: any) {
                console.error('Redirect result error:', error);
                const errorMessage = getFriendlyErrorMessage(error.code);
                setAuthError(errorMessage);
            }
        };

        checkRedirectResult();
    }, []);

    const signInWithGoogle = async (forceRedirect = false) => {
        setAuthError(null);
        setIsRetrying(false);

        // If forced redirect, just do it
        if (forceRedirect) {
            try {
                await signInWithRedirect(auth, googleProvider);
                return;
            } catch (error: any) {
                console.error('Redirect sign-in error:', error);
                setAuthError(getFriendlyErrorMessage(error.code));
                throw error;
            }
        }

        // Check if we recently attempted a popup (prevents rapid-fire attempts)
        const lastPopupAttempt = localStorage.getItem('last_popup_attempt');
        const now = Date.now();

        // If popup was attempted in last 3 seconds, use redirect instead
        if (lastPopupAttempt && (now - parseInt(lastPopupAttempt)) < 3000) {
            console.log('Recent popup attempt detected, using redirect method');
            setIsRetrying(true);
            try {
                await signInWithRedirect(auth, googleProvider);
                return;
            } catch (error: any) {
                console.error('Redirect sign-in error:', error);
                setAuthError(getFriendlyErrorMessage(error.code));
                throw error;
            }
        }

        // Try popup first
        try {
            localStorage.setItem('last_popup_attempt', now.toString());
            await signInWithPopup(auth, googleProvider);
            localStorage.removeItem('last_popup_attempt');
            setAuthError(null);
        } catch (error: any) {
            const errorCode = error?.code;
            const errorMessage = error?.message || 'Unknown error';

            console.error('Sign in error:', errorCode, errorMessage);

            // Handle specific error cases
            switch (errorCode) {
                case 'auth/popup-blocked':
                    // Popup was blocked by browser
                    console.log('Popup blocked, falling back to redirect');
                    setAuthError('Pop-up blocked. Redirecting to sign-in page...');
                    setIsRetrying(true);
                    setTimeout(() => {
                        signInWithRedirect(auth, googleProvider);
                    }, 1000);
                    break;

                case 'auth/popup-closed-by-user':
                    // User intentionally closed popup
                    console.log('User closed popup');
                    localStorage.removeItem('last_popup_attempt');
                    setAuthError('Sign-in cancelled');
                    break;

                case 'auth/cancelled-popup-request':
                    // Multiple popup attempts detected
                    console.log('Multiple popup attempts, using redirect');
                    setAuthError('Switching to alternative sign-in method...');
                    setIsRetrying(true);
                    setTimeout(() => {
                        signInWithRedirect(auth, googleProvider);
                    }, 1000);
                    break;

                case 'auth/network-request-failed':
                    // Network issue
                    setAuthError('Network error. Please check your connection and try again.');
                    throw error;

                case 'auth/unauthorized-domain':
                    // Domain not authorized in Firebase Console
                    setAuthError('Authentication not configured for this domain');
                    throw error;

                case 'auth/internal-error':
                    // Internal error - likely Safari private mode or similar
                    console.log('Internal error, likely private browsing mode, using redirect');
                    setAuthError('Switching to alternative sign-in method...');
                    setIsRetrying(true);
                    setTimeout(() => {
                        signInWithRedirect(auth, googleProvider);
                    }, 1000);
                    break;

                default:
                    // For any unknown error, fall back to redirect
                    // This handles Safari private mode and other edge cases
                    console.log('Unknown error, falling back to redirect:', errorCode);
                    setAuthError('Sign-in method not supported in this mode. Trying alternative...');
                    setIsRetrying(true);
                    setTimeout(() => {
                        signInWithRedirect(auth, googleProvider);
                    }, 1000);
                    break;
            }
        }
    };

    const signOutUser = async () => {
        try {
            await signOut(auth);
            setAuthError(null);
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

    const updateUserProfile = async (data: {
        leaderboardName?: string,
        message?: string,
        displayOnLeaderboard?: boolean,
        showDonationAmount?: boolean,
        showStreak?: boolean
    }) => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const updates: any = { ...data };

        // If message is being updated, it must be re-approved
        if (data.message !== undefined) {
            updates.messageApprovalStatus = 'pending';
        }

        // If leaderboard name is being changed (and not to Anonymous), mark for approval
        if (data.leaderboardName !== undefined &&
            data.leaderboardName !== 'Anonymous' &&
            data.leaderboardName !== userData?.leaderboardName) {
            updates.leaderboardNameApprovalStatus = 'pending';
        }

        await updateDoc(userRef, updates);

        // Fetch fresh data
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setUserData(userSnap.data() as UserStats);
        }
    };

    const clearAuthError = () => {
        setAuthError(null);
        setIsRetrying(false);
    };

    return {
        user,
        userData,
        loading,
        signInWithGoogle,
        signOutUser,
        updateStats,
        updateUserProfile,
        authError,
        isRetrying,
        clearAuthError
    };
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

            // Leaderboard Settings (Privacy-first defaults)
            displayOnLeaderboard: false,                    // Opt-out by default
            leaderboardName: 'Anonymous',                   // Anonymous by default for privacy
            showDonationAmount: true,                       // Show amount if they opt-in and donated
            showStreak: true,                               // Show streak if they opt-in
            leaderboardNameApprovalStatus: 'approved',      // "Anonymous" is pre-approved

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
