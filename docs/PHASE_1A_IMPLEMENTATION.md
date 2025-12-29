# Phase 1A: Authentication Implementation Plan

## Overview
Implement Google OAuth with profile menu, stats foundation, and first-time user experience.

**Timeline:** 8 hours  
**Prerequisites:** OAuth verification approved (or use test users)

---

## File Changes Required

### 1. Update `firebase.ts`
```typescript
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "proxle-game",
  appId: "1:890224174750:web:827fd57e4f9bb7653ebd8f",
  storageBucket: "proxle-game.firebasestorage.app",
  apiKey: "AIzaSyD7ZCFZg3BCSmZifP8dnDdECADYOTDR-eU",
  authDomain: "proxle-game.firebaseapp.com",
  messagingSenderId: "890224174750",
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app, 'us-central1');
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Connect to emulators in dev
if (import.meta.env.DEV) {
  const emulatorHost = "10.0.1.195";
  console.log(`Connecting to Functions Emulator on ${emulatorHost}:5001`);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
  
  // Uncomment to use Auth/Firestore emulators locally
  // connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
  // connectFirestoreEmulator(db, emulatorHost, 8080);
}
```

---

### 2. Create `src/hooks/useAuth.ts`
```typescript
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Create/update user document
        await ensureUserDocument(firebaseUser);
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

  return { user, loading, signInWithGoogle, signOutUser };
}

async function ensureUserDocument(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Create new user document
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      
      // Initialize stats
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: null,
      
      guessDistribution: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, '8+': 0
      },
      
      // Settings
      displayOnLeaderboard: false,
      leaderboardName: user.displayName?.split(' ')[0] + ' ' + (user.displayName?.split(' ')[1]?.[0] || '') + '.',
    });
  } else {
    // Update last active
    await setDoc(userRef, {
      lastActiveAt: serverTimestamp(),
    }, { merge: true });
  }
}
```

---

### 3. Create `src/components/ProfileMenu.tsx`
```typescript
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, BarChart3 } from 'lucide-react';

interface ProfileMenuProps {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
  onSignOut: () => void;
  onViewStats: () => void;
}

export default function ProfileMenu({ user, onSignOut, onViewStats }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all duration-200 active:scale-95"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 glass-panel rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="p-4 border-b border-white/10">
              <div className="font-semibold text-white">{user.displayName || 'Anonymous'}</div>
              <div className="text-xs text-white/50 truncate">{user.email}</div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  onViewStats();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
              >
                <BarChart3 size={18} className="text-cyan-400" />
                <span className="text-sm font-medium">My Stats</span>
              </button>

              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left text-red-400"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

### 4. Create `src/components/SignInPrompt.tsx`
```typescript
import { motion } from 'framer-motion';

interface SignInPromptProps {
  onSignIn: () => void;
  onDismiss: () => void;
}

export default function SignInPrompt({ onSignIn, onDismiss }: SignInPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-6 border border-cyan-500/30"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="text-lg font-bold text-white mb-2">Save Your Progress</h3>
        <p className="text-sm text-white/70 mb-4">
          Sign in with Google to track your stats, streaks, and achievements across all devices!
        </p>
        
        <div className="space-y-2">
          <button
            onClick={onSignIn}
            className="w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Sign in with Google
          </button>
          
          <button
            onClick={onDismiss}
            className="w-full text-white/50 hover:text-white/80 text-sm py-2 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

---

### 5. Update `App.tsx` (Key Changes)

Add imports:
```typescript
import { useAuth } from './hooks/useAuth';
import ProfileMenu from './components/ProfileMenu';
import SignInPrompt from './components/SignInPrompt';
```

Add state and hooks:
```typescript
function App() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();
  const [showStats, setShowStats] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  
  // FTUE: Show info modal on first visit
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('proxle_has_seen_intro');
    if (!hasSeenIntro) {
      setShowInfo(true);
      localStorage.setItem('proxle_has_seen_intro', 'true');
    }
  }, []);
  
  // Show sign-in prompt after first win (if not signed in)
  useEffect(() => {
    if (showVictory && !user && !loading) {
      setTimeout(() => setShowSignInPrompt(true), 2000);
    }
  }, [showVictory, user, loading]);
  
  // ... rest of app
}
```

Update header:
```tsx
<header className="w-full max-w-md p-4 flex items-center justify-between z-10 glass-panel mb-6 mt-4 rounded-2xl mx-4">
  <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent shrink-0">
    PROXLE
  </h1>

  <AdSpace type="coffee" variant="header" />

  <div className="flex gap-2 shrink-0 items-center">
    <button className="p-2 hover:bg-white/10 rounded-full transition-colors" onClick={() => setShowInfo(true)}>
      <Info size={20} />
    </button>
    <button className="p-2 hover:bg-white/10 rounded-full transition-colors" onClick={() => {
      setGuesses([]);
      setShowVictory(false);
      setShareStatus('idle');
    }}>
      <RefreshCw size={20} />
    </button>
    
    {/* Profile Menu or Sign In */}
    {loading ? (
      <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
    ) : user ? (
      <ProfileMenu 
        user={{
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        }}
        onSignOut={signOutUser}
        onViewStats={() => setShowStats(true)}
      />
    ) : (
      <button
        onClick={signInWithGoogle}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95"
      >
        Sign In
      </button>
    )}
  </div>
</header>
```

Add sign-in prompt (after victory modal, before game board):
```tsx
{/* Sign-In Prompt (after first win) */}
<AnimatePresence>
  {showSignInPrompt && !user && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={() => setShowSignInPrompt(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <SignInPrompt 
          onSignIn={async () => {
            await signInWithGoogle();
            setShowSignInPrompt(false);
          }}
          onDismiss={() => setShowSignInPrompt(false)}
        />
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## Firestore Security Rules

Create `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin-only access to admin stats
    match /stats/admin {
      allow read, write: if request.auth.token.email == 'razma@skyboundmi.com';
    }
    
    // Public read for supporters leaderboard (Phase 2)
    match /supporters/{doc} {
      allow read: if true;
      allow write: if false; // Only via Cloud Functions
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## Testing Checklist

- [ ] Sign in with Google works
- [ ] Profile photo appears in header
- [ ] Profile dropdown opens/closes
- [ ] Sign out works
- [ ] User document created in Firestore
- [ ] lastActiveAt updates on each visit
- [ ] Info modal auto-shows on first visit
- [ ] Sign-in prompt appears after first win (guest only)
- [ ] Emulator works locally (optional)

---

## Deployment Steps

1. **Build & Deploy**
```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

2. **Enable Google Auth in Firebase Console**
   - Go to Authentication → Sign-in method
   - Enable Google provider
   - Add authorized domains: `proxle.app`, `localhost`

3. **Test on production:**
   - Visit https://proxle.app
   - Click "Sign In"
   - Verify user document created in Firestore

---

## Next: Phase 1B (Stats & Streaks)

Once Phase 1A is deployed and tested, we'll:
- Create stats modal UI
- Implement streak calculation
- Add guess distribution chart
- Update stats on game completion
- Enhanced sharing with streak

**Ready to start Phase 1A implementation?**
