import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  installPrompt: any;
  onInstallClick: () => void;
  isIOS: boolean;
}

const InfoModal = ({ isOpen, onClose, installPrompt, onInstallClick, isIOS }: InfoModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="glass-overlay"
          onClick={onClose}
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
                onClick={onClose}
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
                      onClick={onInstallClick}
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
  );
};

export default InfoModal;