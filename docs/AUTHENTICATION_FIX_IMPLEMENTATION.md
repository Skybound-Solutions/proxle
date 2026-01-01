# Authentication Fix - Implementation Guide

This document provides step-by-step instructions to implement the authentication fixes for Proxle.

## 🎯 What We're Fixing

1. Safari private browsing mode authentication failures
2. Intermittent "works on second try" authentication issues
3. Missing error handling and user feedback
4. Mobile browser popup blocking issues

## 📝 Changes Required

### File 1: `src/hooks/useAuth.ts`

**Complete updated version with all fixes:**

```typescript
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

function getFriendlyErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
        'auth/popup-blocked': 'Pop-up was blocked. Redirecting to sign-in page...',
        'auth/popup-closed-by-user': 'Sign-in cancelled. Click to try again.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/unauthorized-domain': 'Sign-in not available for this domain.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled.',
        'auth/cancelled-popup-request': 'Multiple sign-in attempts detected. Trying alternative method...',
        'auth/internal-error': 'Sign-in method not supported. Trying alternative...',
    };
    
    return messages[errorCode] || 'Sign-in failed. Trying alternative method...';
}
```

### File 2: `src/firebase.ts`

**Update the auth domain to use custom domain:**

```typescript
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
    projectId: "proxle-game",
    appId: "1:890224174750:web:827fd57e4f9bb7653ebd8f",
    storageBucket: "proxle-game.firebasestorage.app",
    apiKey: "AIzaSyD7ZCFZg3BCSmZifP8dnDdECADYOTDR-eU",
    authDomain: "proxle.app",  // ✅ CHANGED: Use custom domain
    messagingSenderId: "890224174750",
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app, 'us-central1');
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const trackEvent = (name: string, params?: any) => {
    if (analytics) {
        logEvent(analytics, name, params);
    }
};

// Use Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// ✅ ADDED: Force account selection to help with cached account issues
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Connect to emulators in dev
if (import.meta.env.DEV) {
    // Using the IP address as configured in earlier steps
    const emulatorHost = "10.0.1.195";
    console.log(`Connecting to Emulators on ${emulatorHost}`);

    connectFunctionsEmulator(functions, emulatorHost, 5001);
    // connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
    // connectFirestoreEmulator(db, emulatorHost, 8080);
}
```

### File 3: `src/App.tsx`

**Update the sign-in button and header to show auth errors:**

Find the section around line 447 where the sign-in button is (in the header):

```typescript
// Replace lines 446-453 with:
) : (
    <div className="flex flex-col items-end gap-1">
        <button
            onClick={() => signInWithGoogle()}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 border border-white/10"
        >
            Sign In
        </button>
        {authError && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] text-red-400 max-w-[120px] text-right"
            >
                {authError}
            </motion.div>
        )}
    </div>
)}
```

Also update line 41 to destructure the new auth values:

```typescript
// Replace line 41:
const { user, userData, loading, signInWithGoogle, signOutUser, updateStats, updateUserProfile, authError, isRetrying, clearAuthError } = useAuth();
```

### File 4: `src/components/SignInPrompt.tsx`

**Add error display and alternative sign-in option:**

```typescript
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';

interface SignInPromptProps {
    onSignIn: (forceRedirect?: boolean) => void;
    onDismiss: () => void;
    authError?: string | null;
    isRetrying?: boolean;
}

export default function SignInPrompt({ onSignIn, onDismiss, authError, isRetrying }: SignInPromptProps) {
    return (
        <div className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-black mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                🎉 Nice Work!
            </h2>
            <p className="text-white/80 mb-6 text-sm">
                Sign in with Google to save your stats, compete on the leaderboard, and track your winning streak!
            </p>

            {/* Error Display */}
            {authError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4"
                >
                    <p className="text-red-400 text-sm">{authError}</p>
                    {isRetrying && (
                        <p className="text-red-300 text-xs mt-1 animate-pulse">
                            Retrying with alternative method...
                        </p>
                    )}
                </motion.div>
            )}

            <div className="space-y-3">
                {/* Primary Sign-In Button */}
                <button
                    onClick={() => onSignIn()}
                    disabled={isRetrying}
                    className="w-full bg-white text-zinc-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Chrome size={20} />
                    Sign In with Google
                </button>

                {/* Alternative Sign-In Method */}
                {authError && !isRetrying && (
                    <button
                        onClick={() => onSignIn(true)}
                        className="w-full text-white/60 hover:text-white/80 text-xs py-2 transition-colors"
                    >
                        Try Alternative Sign-In Method →
                    </button>
                )}

                {/* Dismiss Button */}
                <button
                    onClick={onDismiss}
                    className="w-full text-white/40 hover:text-white/60 text-sm transition-colors"
                >
                    Maybe Later
                </button>
            </div>

            <p className="text-xs text-white/30 text-center mt-4">
                We only use your email to save your progress. No spam, ever.
            </p>
        </div>
    );
}
```

And update where it's used in App.tsx (around line 473):

```typescript
<SignInPrompt
    onSignIn={async (forceRedirect = false) => {
        try {
            await signInWithGoogle(forceRedirect);
            setShowSignInPrompt(false);
        } catch (e) {
            console.error("Sign in error:", e);
            // Error is now displayed in the component via authError state
        }
    }}
    onDismiss={() => {
        setShowSignInPrompt(false);
        clearAuthError();
    }}
    authError={authError}
    isRetrying={isRetrying}
/>
```

## 🚀 Deployment Steps

### 1. Make the Code Changes

Apply all the changes above to the respective files.

### 2. Test Locally

```bash
npm run dev
```

Test scenarios:
- Regular sign-in (should use popup)
- Click sign-in button twice rapidly (should use redirect)
- Use Safari in private mode (should fallback to redirect)

### 3. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project "proxle-game"
3. Navigate to **Authentication** → **Settings** → **Authorized Domains**
4. Ensure `proxle.app` is in the list (it should be already)
5. Ensure `localhost` is there for local testing

### 4. Build and Deploy

```bash
# Build production version
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

### 5. Test in Production

After deployment, test on:
- Desktop Safari (private mode)
- iOS Safari (normal mode)
- iOS Safari (private mode)
- Share link from Messages app on iOS
- Chrome desktop and mobile

## 🧪 How to Test Each Issue

### Test Issue #1: Safari Private Browsing

1. Open Safari
2. Enable Private Browsing (File → New Private Window)
3. Go to https://proxle.app
4. Click "Sign In"
5. **Expected behavior**: 
   - Popup may fail silently or show error
   - After 1 second, should redirect to Google sign-in page
   - After signing in on Google, should redirect back to proxle.app
   - User should be signed in successfully

### Test Issue #2: Intermittent Failures (Rapid Clicks)

1. Open proxle.app in any browser
2. Click "Sign In" button
3. **Immediately** close the popup that appears
4. Click "Sign In" button again within 3 seconds
5. **Expected behavior**:
   - Second click should use redirect method instead of popup
   - Should successfully authenticate
   - No "cancelled-popup-request" error

### Test Error Display

1. Block popups in your browser settings
2. Try to sign in
3. **Expected behavior**:
   - Error message should appear: "Pop-up blocked. Redirecting to sign-in page..."
   - Should show "Retrying with alternative method..."
   - Should redirect after 1 second

## 📊 Analytics to Monitor

After deployment, add this tracking to monitor success:

```typescript
// In useAuth.ts, add to signInWithGoogle success path:
trackEvent('auth_success', {
    method: forceRedirect ? 'redirect' : 'popup',
    browser: navigator.userAgent
});

// And in error paths:
trackEvent('auth_failure', {
    error_code: errorCode,
    fallback_used: true,
    browser: navigator.userAgent
});
```

## ✅ Success Criteria

After implementing all changes, you should see:

- ✅ Authentication works in Safari private browsing mode
- ✅ No more "works on second try" issues
- ✅ Clear error messages for users
- ✅ Automatic fallback to redirect when popup fails
- ✅ Mobile authentication reliability improved
- ✅ Share links work consistently

## 📞 If Issues Persist

If after implementation you still see issues:

1. Check browser console for error codes
2. Verify Firebase Console authorized domains
3. Test with `authDomain: "proxle-game.firebaseapp.com"` to rule out custom domain issues
4. Check if user has disabled all third-party cookies (rare, but happens)
5. Review Firebase Authentication logs in the console

## 🎉 You're Done!

Once implemented and deployed, your authentication should be significantly more reliable across all browsers and devices.
