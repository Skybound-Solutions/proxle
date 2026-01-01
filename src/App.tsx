import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { functions, trackEvent } from './firebase';
import { Info, Share2, Copy, CheckCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import AdSpace from './components/AdSpace';
import { useAuth } from './hooks/useAuth';
import ProfileMenu from './components/ProfileMenu';
import SignInPrompt from './components/SignInPrompt';
import StatsModal from './components/StatsModal';
import LeaderboardModal from './components/LeaderboardModal';
import LeaderboardSettingsModal from './components/LeaderboardSettingsModal';


function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Types
type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

interface Guess {
  word: string;
  similarity: number;
  simWords: string[];
  letterStatus: LetterStatus[];
}

function App() {
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  // Auth & New Features
  const { user, userData, loading, signInWithGoogle, signOutUser, updateStats, updateUserProfile, authError, isRetrying, clearAuthError } = useAuth();
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLeaderboardSettings, setShowLeaderboardSettings] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [nextGameTime, setNextGameTime] = useState("");
  const navigate = useNavigate();

  const ADMIN_EMAILS = ['banklam@skyboundmi.com', 'proxle@skyboundmi.com'];
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  // Countdown Timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setNextGameTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update Stats on Game End
  useEffect(() => {
    if (showVictory && !guesses.find(g => g.similarity === 100)) {
      // This is a "game over" but not a win (handled below manually usually, but here checking state)
      // Wait, handleVirtualInput logic usually sets showVictory.
      // Let's hook into where showVictory is SET instead of effect to avoid double counting.
    }
  }, [showVictory]);

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
      const timer = setTimeout(() => setShowSignInPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [showVictory, user, loading]);

  // Load/Save guesses from localStorage for persistence
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`proxle_guesses_${todayStr}`);
    if (saved) {
      const parsedGuesses = JSON.parse(saved);
      setGuesses(parsedGuesses);
      // If they already won today, show victory screen
      if (parsedGuesses.some((g: Guess) => g.similarity === 100)) {
        setShowStats(true); // Show stats instead of victory to avoid repeat celebration
      }
    }
  }, []);

  useEffect(() => {
    if (guesses.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(`proxle_guesses_${todayStr}`, JSON.stringify(guesses));
    }
  }, [guesses]);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Initial check for standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showVictory || showInfo || showStats) return;

      if (e.key === 'Backspace') {
        handleVirtualInput('BACKSPACE');
      } else if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        handleVirtualInput(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, showVictory, showInfo, showStats]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };



  // Virtual Keyboard Input
  const handleVirtualInput = (char: string) => {
    if (char === 'BACKSPACE') {
      setInput(prev => prev.slice(0, -1));
    } else if (input.length < 5) {
      setInput(prev => prev + char);
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const submitGuess = async () => {
    if (input.length < 3) return;
    setIsLoading(true);

    try {
      // Collect all previous hints to ensure uniqueness
      const previousHints = guesses.flatMap(g => g.simWords);

      const result = await httpsCallable(functions, 'evaluateGuess')({
        guessWord: input.toUpperCase(),
        previousHints
      });

      console.log("AI Result:", result);

      const data = result.data as any;

      if (!data || typeof data.isValidWord === 'undefined') {
        throw new Error("Invalid response format from AI");
      }

      if (!data.isValidWord) {
        // Handle invalid word
        alert(`"${input}" is not a valid word!`);
        setIsLoading(false);
        return;
      }

      const newGuess: Guess = {
        word: input.toUpperCase(),
        similarity: data.similarity,
        simWords: data.hint ? [data.hint] : [],
        letterStatus: data.letterStatus || Array(input.length).fill('absent')
      };

      setGuesses(prev => [newGuess, ...prev]);

      // Check for win condition (similarity 100 means exact match)
      if (data.similarity === 100) {
        // WINNER!
        setShowVictory(true);
        updateStats(true, guesses.length + 1); // +1 because we are just adding this guess now
        trackEvent('level_end', { guesses: guesses.length + 1, outcome: 'win' });
        setTimeout(() => {
          setShowVictory(false);
          setShowStats(true);
        }, 1500);
      }

    } catch (error: any) {
      console.error("AI Evaluation Failed:", error);

      // Check for specific error types if needed
      let errorMsg = "AI Offline";
      if (error.message?.includes("failed-precondition")) errorMsg = "Config Error";

      const newGuess: Guess = {
        word: input.toUpperCase(),
        similarity: 0,
        simWords: [errorMsg],
        letterStatus: Array(input.length).fill('absent')
      };
      setGuesses(prev => [newGuess, ...prev]);
    } finally {
      setIsLoading(false);
    }

    if (guesses.length === 0) {
      trackEvent('game_start');
    }

    setInput("");
  };

  // Render Grid Row
  const renderRow = (word: string, isGuess = false, patterns: LetterStatus[] = []) => {
    const slots = Array(5).fill("");
    const inputUpper = word.toUpperCase();

    for (let i = 0; i < inputUpper.length; i++) {
      slots[i] = inputUpper[i];
    }

    return (
      <div className="grid grid-cols-5 gap-2 w-full">
        {slots.map((_, i) => (
          <motion.div
            key={i}
            initial={isGuess ? { scale: 1 } : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "aspect-square flex items-center justify-center text-2xl font-black rounded-xl border-2 transition-all duration-300",
              inputUpper[i] ? "border-white/40 bg-white/10" : "border-white/10 bg-black/20",
              isGuess && patterns[i] === 'correct' && "bg-green-500/80 border-green-400 text-white",
              isGuess && patterns[i] === 'present' && "bg-yellow-500/80 border-yellow-400 text-white",
              isGuess && patterns[i] === 'absent' && "bg-white/5 border-white/20 text-white/40"
            )}
          >
            {inputUpper[i] || ""}
          </motion.div>
        ))}
      </div>
    );
  };

  // Generate shareable text with emoji grid
  const generateShareText = () => {
    const streakText = userData?.currentStreak ? ` 🔥 Streak: ${userData.currentStreak}` : '';
    const emojiGrid = guesses.slice().reverse().map((guess) => {
      const isWinningGuess = guess.similarity === 100;

      const emojiRow = Array(5).fill('').map((_, i) => {
        // If this is the winning guess, show all greens to hide word length
        if (isWinningGuess) return '🟩';

        const char = guess.word[i];
        if (!char) return '⬜';

        const status = guess.letterStatus[i];
        if (status === 'correct') return '🟩';
        if (status === 'present') return '🟨';
        return '⬛';
      }).join('');

      // Add percentage after the emoji row
      return `${emojiRow} ${Math.floor(guess.similarity)}%`;
    }).join('\n');

    return `Proxle ${guesses.length} guesses${streakText}\n\n${emojiGrid}\n\nJoin the hunt: https://proxle.app`;
  };

  // Share using Web Share API
  const handleShare = async () => {
    const shareText = generateShareText();
    trackEvent('share', { method: 'web_share', guesses: guesses.length });

    // Try native share on any mobile-ish device
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PROXLE',
          text: shareText,
        });
        setShareStatus('shared');
        return;
      } catch (err) {
        // If it's an "AbortError", the user just closed the sheet, no need to alert
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      handleCopyToClipboard(); // Final fallback
    }
  };

  // Copy to clipboard fallback
  const handleCopyToClipboard = async () => {
    const fullText = generateShareText();
    trackEvent('share', { method: 'clipboard', guesses: guesses.length });

    try {
      await navigator.clipboard.writeText(fullText);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Last resort: create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = fullText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
      document.body.removeChild(textarea);
    }
  };

  // Helper function to get keyboard letter status
  const getKeyStatus = (letter: string): LetterStatus => {
    const upperLetter = letter.toUpperCase();
    let status: LetterStatus = 'empty';

    // Check all guesses to determine the best status for this letter
    for (const guess of guesses) {
      for (let i = 0; i < guess.word.length; i++) {
        if (guess.word[i] === upperLetter) {
          const currentStatus = guess.letterStatus[i];

          if (currentStatus === 'correct') return 'correct';
          if (currentStatus === 'present') status = 'present';
          if (currentStatus === 'absent' && status === 'empty') status = 'absent';
        }
      }
    }

    return status;
  };

  // Helper function to get word length hint based on green squares
  const getWordLengthHint = (): string | null => {
    for (const guess of guesses) {
      // Check if position 5 (index 4) has a green square - means exactly 5 letters
      if (guess.letterStatus[4] === 'correct') {
        return "💡 5-letter word";
      }

      // Check if position 4 (index 3) has a green square - means at least 4 letters
      if (guess.letterStatus[3] === 'correct') {
        return "💡 4-5 letter word";
      }
    }

    return null;
  };

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground font-sans flex flex-col items-center overflow-hidden relative selection:bg-primary selection:text-primary-foreground">

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-20 animate-pulse" />
        <div className="absolute top-40 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] opacity-20" />
      </div>

      {/* Header */}
      <header className="w-full max-w-md p-3 flex items-center justify-between z-[40] glass-panel mb-2 mt-2 rounded-2xl mx-4">
        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent shrink-0">
          PROXLE
        </h1>

        <AdSpace type="coffee" variant="header" onClick={() => setShowLeaderboard(true)} />

        <div className="flex gap-2 shrink-0 items-center">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors" onClick={() => setShowInfo(true)}>
            <Info size={20} />
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
              stats={userData}
              onSignOut={signOutUser}
              onViewStats={() => setShowStats(true)}
              onViewLeaderboardSettings={() => setShowLeaderboardSettings(true)}
              isAdmin={!!isAdmin}
              onViewAdmin={() => navigate('/admin')}
            />
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
        </div>
      </header>

      {/* Sign-In Prompt (after first win) */}
      <AnimatePresence>
        {showSignInPrompt && !user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-overlay"
            onClick={() => setShowSignInPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStats && (
          <StatsModal
            stats={userData} // Computed stats
            isOpen={showStats}
            onClose={() => setShowStats(false)}
            onShare={handleShare}
            shareStatus={shareStatus}
            nextGameTime={nextGameTime}
          />
        )}
      </AnimatePresence>

      {/* Leaderboard Settings Modal */}
      <AnimatePresence>
        {showLeaderboardSettings && (
          <LeaderboardSettingsModal
            userData={userData}
            isOpen={showLeaderboardSettings}
            onClose={() => setShowLeaderboardSettings(false)}
            onUpdateProfile={updateUserProfile}
          />
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <LeaderboardModal
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-overlay"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  How to Play
                </h2>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-white/80">
                {/* Install App Section */}
                {installPrompt && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl">
                    <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                      <Download size={18} className="text-primary" />
                      Install App
                    </h3>
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">
                        Install Proxle for a fullscreen, native app experience!
                      </p>
                      <button
                        onClick={handleInstallClick}
                        className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-lg text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all"
                      >
                        Add to Home Screen
                      </button>
                    </div>
                  </div>
                )}

                {isIOS && !installPrompt && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl">
                    <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                      <Download size={18} className="text-primary" />
                      Install App
                    </h3>
                    <div className="text-xs text-white/70 space-y-2">
                      <p>To install on iOS:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-1 opacity-80">
                        <li>Tap the <Share2 size={12} className="inline mx-1" /> Share button in your browser</li>
                        <li>Scroll down and select <span className="text-white font-semibold">"Add to Home Screen"</span></li>
                      </ol>
                    </div>
                  </div>
                )}

                <p className="text-base">
                  <strong className="text-white">Proxle</strong> is a twist on the classic word game. The secret word can be <strong className="text-white">3 to 5 letters long</strong>.
                </p>
                <p className="text-sm text-white/80">
                  Instead of just spelling, you get clues about the <span className="text-primary font-bold">meaning</span> of the word too!
                </p>

                <div className="space-y-2">
                  <h3 className="text-white font-bold text-base">🎯 How it Works</h3>
                  <p>Guess a word to get two types of feedback:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                    <li><strong className="text-green-400">Spelling:</strong> Typical green/yellow colors for letter positions.</li>
                    <li><strong className="text-primary">Meaning:</strong> A score (0-100%) showing semantic closeness.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-bold text-base">🔤 Spelling Hints</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-500 border-green-400 border-2 rounded-lg flex items-center justify-center font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        L
                      </div>
                      <span><strong className="text-green-400">Green:</strong> Right letter, right spot</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-yellow-500 border-yellow-400 border-2 rounded-lg flex items-center justify-center font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                        I
                      </div>
                      <span><strong className="text-yellow-400">Yellow:</strong> Right letter, wrong spot</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-zinc-700/80 border-zinc-600 border-2 rounded-lg flex items-center justify-center font-bold text-zinc-400">
                        O
                      </div>
                      <span><strong className="text-zinc-400">Gray:</strong> Letter not in word</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-bold text-base">🧠 Meaning Hints</h3>
                  <p>
                    Every guess gives you a <strong className="text-primary">Context Score</strong>.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm opacity-90">
                    <li>High Score: You are conceptually close!</li>
                    <li>Low Score: You get a <strong className="text-yellow-400">1-word hint</strong> describing a shared attribute (e.g., shape, material, action).</li>
                  </ul>
                  <div className="glass-card p-3 rounded-lg border border-primary/20 mt-2">
                    <div className="text-xs text-white/50 mb-1">Example: Target is "PLANE"</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">EAGLE</span>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full font-bold">
                            Hint: Flight
                          </span>
                        </div>
                      </div>
                      <span className="text-xl font-black text-white/40">45%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-bold text-base">💡 Winning Strategy</h3>
                  <ul className="list-disc list-inside space-y-1 text-white/70">
                    <li>Use the <strong>Context Score</strong> to find the right topic.</li>
                    <li>Use the <strong>Colors</strong> to figure out the spelling.</li>
                    <li>Remember: The word might not make sense until you check the meaning!</li>
                  </ul>
                </div>


                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/50 text-center">
                    New puzzle daily • Powered by AI semantic analysis
                  </p>

                  {/* Legal Links */}
                  <div className="flex gap-4 justify-center mt-4 text-xs">
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-white/70 transition-colors underline"
                    >
                      Privacy Policy
                    </a>
                    <span className="text-white/20">•</span>
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-white/70 transition-colors underline"
                    >
                      Terms of Service
                    </a>
                  </div>

                  <p className="text-xs text-white/30 text-center mt-4">
                    Made with ❤️ for my Loving Wife
                  </p>
                  <p className="text-[10px] text-white/20 text-center mt-1">
                    <a href="https://skyboundmi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-colors">
                      Proxle™ © 2025 Skybound Solutions LLC. All rights reserved.
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Modal with Share */}
      <AnimatePresence>
        {showVictory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-overlay flex items-center justify-center p-4 z-[100]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="glass-panel rounded-2xl p-8 max-w-md w-full relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Celebration Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-green-500/20 rounded-full blur-[60px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>

              <div className="relative z-10">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                    You Won!
                  </h2>
                  <p className="text-white/60 text-sm">
                    Solved in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}
                  </p>
                </div>

                {/* Share Preview */}
                <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
                  <div className="text-xs text-white/50 mb-2 text-center">Your Result</div>
                  <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-center">
                    {generateShareText()}
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleShare}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 flex items-center justify-center gap-2"
                  >
                    {shareStatus === 'shared' ? (
                      <>
                        <CheckCircle size={20} />
                        Shared!
                      </>
                    ) : shareStatus === 'copied' ? (
                      <>
                        <CheckCircle size={20} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 size={20} />
                        Share Result
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 border border-white/10"
                  >
                    {shareStatus === 'copied' ? (
                      <>
                        <CheckCircle size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setShowVictory(false)}
                  className="mt-6 w-full text-white/50 hover:text-white/80 text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <main className="flex-1 w-full max-w-md px-4 flex flex-col z-10 items-stretch overflow-hidden">

        {/* Active Input Area */}
        <div className="mb-4 relative">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Guess the word</span>
          </div>

          {renderRow(input)}

          {/* Semantic Hints (Recent) */}
          {guesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 glass-card rounded-xl border border-white/5"
            >
              <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Last Clue Analysis</div>

              {/* High Proximity Alert */}
              {guesses[0].similarity > 60 && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "mb-3 p-3 border rounded-lg text-center",
                    guesses[0].similarity === 100
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 cursor-pointer hover:bg-green-500/30 transition-colors"
                      : "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30"
                  )}
                  onClick={() => {
                    if (guesses[0].similarity === 100) setShowVictory(true);
                  }}
                >
                  <div className={cn(
                    "text-lg font-black bg-clip-text text-transparent",
                    guesses[0].similarity === 100
                      ? "bg-gradient-to-r from-green-400 to-emerald-400"
                      : "bg-gradient-to-r from-orange-400 to-red-400"
                  )}>
                    {guesses[0].similarity === 100 ? "🎉 VICTORY! 🎉" :
                      guesses[0].similarity > 85 ? "🔥 SO CLOSE! 🔥" :
                        "🔥 HEATING UP! 🔥"}
                  </div>
                  <div className={cn(
                    "text-[10px] mt-1",
                    guesses[0].similarity === 100 ? "text-green-300/80" : "text-orange-300/80"
                  )}>
                    {guesses[0].similarity === 100 ? (
                      <div className="flex items-center justify-center gap-1">
                        <span>Tap to Share</span>
                        <Share2 size={10} />
                      </div>
                    ) :
                      guesses[0].similarity > 85 ? "You're burning hot!" :
                        "You're on the right track!"}
                  </div>
                </motion.div>
              )}

              {/* Word Length Hint */}
              {getWordLengthHint() && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-3 p-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-center"
                >
                  <div className="text-sm font-bold text-green-400">
                    {getWordLengthHint()}
                  </div>
                  <div className="text-[9px] text-green-300/70 mt-0.5">Green squares reveal length!</div>
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{guesses[0].word}</span>
                  <div className="flex gap-2 mt-1">
                    {guesses[0].simWords.map(w => (
                      <span key={w} className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn("text-2xl font-black",
                    guesses[0].similarity > 70 ? "text-green-400" :
                      guesses[0].similarity > 40 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {Math.floor(guesses[0].similarity)}%
                  </span>
                  <span className="text-[10px] text-white/30">Proximity</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
          {guesses.map((g, i) => (
            <div key={i} className="bg-white/5 rounded-lg border border-white/5 p-2">
              <div className="flex items-center gap-3">
                {/* Compact Grid */}
                <div className="grid grid-cols-5 gap-1 shrink-0">
                  {Array(5).fill("").map((_, idx) => {
                    const char = g.word[idx] || "";
                    let status: LetterStatus = 'empty';

                    if (char && g.letterStatus) {
                      status = g.letterStatus[idx];
                    }

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "h-8 w-8 border rounded flex items-center justify-center text-xs font-bold uppercase",
                          !char && "border-white/10 bg-white/5",
                          status === 'correct' && "bg-green-500 border-green-400 text-white",
                          status === 'present' && "bg-yellow-500 border-yellow-400 text-white",
                          status === 'absent' && "bg-zinc-700/80 border-zinc-600 text-zinc-400",
                        )}
                      >
                        {char}
                      </div>
                    );
                  })}
                </div>

                {/* Metadata */}
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="flex gap-1.5 flex-wrap">
                    {g.simWords.length > 0 ? (
                      g.simWords.map(w => (
                        <span key={w} className="text-[9px] px-1.5 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full whitespace-nowrap">{w}</span>
                      ))
                    ) : (
                      g.similarity > 60 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full whitespace-nowrap">
                          No Hint (So Close!)
                        </span>
                      )
                    )}
                  </div>
                  <span className={cn("font-bold text-sm ml-2 shrink-0",
                    g.similarity > 70 ? "text-green-400" :
                      g.similarity > 40 ? "text-yellow-400" : "text-red-400"
                  )}>{Math.floor(g.similarity)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Keyboard */}
      <footer className="w-full max-w-md p-2 z-20 bg-background/90 backdrop-blur-md border-t border-white/5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2">
        <div className="flex flex-col gap-2">
          {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1.5">
              {rowIdx === 2 && (
                <button onClick={submitGuess} disabled={isLoading} className="h-10 px-3 bg-primary text-primary-foreground font-bold rounded-lg text-sm flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait">
                  {isLoading ? "..." : "ENTER"}
                </button>
              )}
              {row.split('').map(char => {
                const keyStatus = getKeyStatus(char);

                return (
                  <button
                    key={char}
                    onClick={() => handleVirtualInput(char)}
                    className={cn(
                      "h-10 w-8 sm:w-10 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center relative overflow-hidden group",
                      // Default state
                      keyStatus === 'empty' && "bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/5 text-white",
                      // Correct position - vibrant green with glow
                      keyStatus === 'correct' && "bg-gradient-to-br from-emerald-500 to-green-600 border-2 border-emerald-400/50 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105",
                      // Wrong position - amber/yellow with glow
                      keyStatus === 'present' && "bg-gradient-to-br from-amber-500 to-yellow-600 border-2 border-amber-400/50 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105",
                      // Not in word - muted dark
                      keyStatus === 'absent' && "bg-zinc-800/90 border border-zinc-700/50 text-zinc-500 hover:bg-zinc-800"
                    )}
                  >
                    {/* Subtle shine effect for correct/present keys */}
                    {(keyStatus === 'correct' || keyStatus === 'present') && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    <span className="relative z-10">{char}</span>
                  </button>
                );
              })}
              {rowIdx === 2 && (
                <button onClick={() => handleVirtualInput('BACKSPACE')} className="h-10 px-3 bg-white/10 text-white rounded-lg text-sm flex items-center justify-center active:bg-white/20 transition-colors">
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      </footer>
    </div >
  );
}

export default App;
