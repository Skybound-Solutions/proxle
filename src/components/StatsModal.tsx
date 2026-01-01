import { motion } from 'framer-motion';
import { X, Share2, Check, Edit2 } from 'lucide-react';
import type { UserStats } from '../lib/stats';
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

interface StatsModalProps {
    stats: UserStats | null;
    userData: any | null; // Full user document data
    isOpen: boolean;
    onClose: () => void;
    onShare: () => void;
    onUpdateProfile?: (data: any) => Promise<void>;
    shareStatus: 'idle' | 'copied' | 'shared';
    nextGameTime: string;
}

export default function StatsModal({
    stats,
    userData,
    isOpen,
    onClose,
    onShare,
    onUpdateProfile,
    shareStatus,
    nextGameTime
}: StatsModalProps) {
    const [isEditing, setIsEditing] = useState(false);

    // Suggested name from Google account (only used when they first turn on leaderboard)
    const suggestedName = userData?.displayOnLeaderboard === false && userData?.displayName
        ? `${userData.displayName.split(' ')[0]} ${userData.displayName.split(' ')[1]?.[0] || ''}.`
        : '';

    const [formData, setFormData] = useState({
        leaderboardName: userData?.leaderboardName || suggestedName || 'Anonymous',
        message: userData?.message || '',
        displayOnLeaderboard: userData?.displayOnLeaderboard !== false,
        showDonationAmount: userData?.showDonationAmount !== false,
        showStreak: userData?.showStreak !== false
    });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    if (!isOpen) return null;

    const displayStats = stats || {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        currentStreak: 0,
        maxStreak: 0,
        winRate: 0,
        guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, '8+': 0 }
    };

    const maxFreq = Math.max(...Object.values(displayStats.guessDistribution), 1);
    const isSupporter = (userData?.donations?.total || 0) > 0;

    const handleSave = async () => {
        if (!onUpdateProfile) return;
        setSaveStatus('saving');

        try {
            // If leaderboard name changed and user opted in, check it with AI
            if (formData.displayOnLeaderboard &&
                formData.leaderboardName !== userData?.leaderboardName &&
                formData.leaderboardName.toLowerCase() !== 'anonymous') {

                // Call AI moderation function
                const checkName = httpsCallable(functions, 'checkLeaderboardName');

                try {
                    const result = await checkName({ name: formData.leaderboardName });
                    const data = result.data as { approved: boolean; reason?: string };

                    if (!data.approved) {
                        // Revert to previous name and show error
                        setFormData({
                            ...formData,
                            leaderboardName: userData?.leaderboardName || 'Anonymous'
                        });

                        const reason = data.reason || 'This name was flagged as inappropriate';
                        alert(`❌ ${reason}\n\nPlease choose a different name.`);
                        setSaveStatus('idle');
                        return;
                    }
                } catch (moderationError) {
                    console.error("Name moderation error:", moderationError);
                    alert('❌ Unable to verify name.\n\nPlease try again or contact support.');
                    setSaveStatus('idle');
                    return;
                }
            }

            // Name approved (or didn't change), proceed with save
            await onUpdateProfile(formData);
            setSaveStatus('saved');
            setTimeout(() => {
                setSaveStatus('idle');
                setIsEditing(false);
            }, 1500);
        } catch (error) {
            console.error("Save error:", error);
            alert('❌ Failed to save settings.\n\nPlease try again.');
            setSaveStatus('idle');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-overlay"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm glass-panel rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar z-[60]"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-center mb-6 tracking-wide">STATISTICS</h2>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-2 mb-8">
                    <StatBox value={displayStats.totalGames} label="Played" />
                    <StatBox value={displayStats.winRate} label="Win %" />
                    <StatBox value={displayStats.currentStreak} label="Streak" highlight={displayStats.currentStreak > 2} />
                    <StatBox value={displayStats.maxStreak} label="Max" />
                </div>

                {/* Guess Distribution */}
                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-white/70">Guess Distribution</h3>
                <div className="space-y-1.5 mb-8">
                    {Object.entries(displayStats.guessDistribution).map(([guess, count]) => (
                        <div key={guess} className="flex items-center gap-2 group">
                            <span className="w-4 text-xs font-mono text-white/50">{guess}</span>
                            <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / maxFreq) * 100}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className={`h-full flex items-center justify-end px-2 ${count > 0 ? 'bg-cyan-500' : 'bg-transparent'}`}
                                >
                                    {count > 0 && <span className="text-xs font-bold text-black">{count}</span>}
                                </motion.div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Leaderboard Settings Section - Available to ALL users */}
                <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                            🏆 Leaderboard Settings
                        </h3>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            {/* Opt-in Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-xs text-white/70 font-medium">Appear on Leaderboard</label>
                                    <p className="text-[10px] text-white/40 mt-0.5">Show your stats and/or support publicly</p>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, displayOnLeaderboard: !formData.displayOnLeaderboard })}
                                    className={`w-10 h-6 rounded-full transition-colors relative ${formData.displayOnLeaderboard ? 'bg-cyan-500' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.displayOnLeaderboard ? 'left-5' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Only show privacy controls if opted in */}
                            {formData.displayOnLeaderboard && (
                                <>
                                    {/* Display Name */}
                                    <div>
                                        <label className="text-[10px] uppercase text-white/40 block mb-1">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.leaderboardName}
                                            onChange={(e) => setFormData({ ...formData, leaderboardName: e.target.value })}
                                            maxLength={30}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                            placeholder="How you appear on leaderboard"
                                        />
                                        <p className="text-[10px] text-white/40 mt-1">
                                            📝 Names are reviewed for appropriateness
                                        </p>
                                    </div>

                                    {/* Show Streak Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-xs text-white/70 font-medium">Show My Streak</label>
                                            <p className="text-[10px] text-white/40 mt-0.5">Display your 🔥 streak badge</p>
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, showStreak: !formData.showStreak })}
                                            className={`w-10 h-6 rounded-full transition-colors relative ${formData.showStreak ? 'bg-cyan-500' : 'bg-white/10'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.showStreak ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {/* Show Donation Amount Toggle (only if supporter) */}
                                    {isSupporter && (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-xs text-white/70 font-medium">Show Donation Amount</label>
                                                <p className="text-[10px] text-white/40 mt-0.5">Display exact $ or show 💎 icon</p>
                                            </div>
                                            <button
                                                onClick={() => setFormData({ ...formData, showDonationAmount: !formData.showDonationAmount })}
                                                className={`w-10 h-6 rounded-full transition-colors relative ${formData.showDonationAmount ? 'bg-cyan-500' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.showDonationAmount ? 'left-5' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Billboard Message (Top 3 only) */}
                                    {isSupporter && (
                                        <div>
                                            <label className="text-[10px] uppercase text-white/40 block mb-1">
                                                Billboard Message (Top 3 Only)
                                            </label>
                                            <textarea
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                maxLength={60}
                                                rows={2}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                                                placeholder="Your message for all to see..."
                                            />
                                            <p className="text-[10px] text-white/40 mt-1">
                                                💬 Only visible if you're in the top 3 supporters
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={saveStatus === 'saving'}
                                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {saveStatus === 'saving' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                                    saveStatus === 'saved' ? <Check size={18} /> : 'Save Settings'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Leaderboard Status</span>
                                <span className={`font-medium ${formData.displayOnLeaderboard ? 'text-cyan-400' : 'text-white/60'}`}>
                                    {formData.displayOnLeaderboard ? '✓ Visible' : 'Hidden'}
                                </span>
                            </div>
                            {formData.displayOnLeaderboard && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/40">Display Name</span>
                                        <span className="text-white font-medium">{formData.leaderboardName || 'Anonymous'}</span>
                                    </div>
                                    {formData.message && (
                                        <div className="text-xs italic text-cyan-400 opacity-80 mt-2">"{formData.message}"</div>
                                    )}
                                    {isSupporter && (
                                        <div className="text-[10px] text-white/30 text-center mt-2 pt-2 border-t border-white/10">
                                            Total Donated: ${userData?.donations?.total?.toFixed(2)}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer: Countdown & Share */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                    <div className="text-center w-1/2 border-r border-white/10 pr-4">
                        <div className="text-xs uppercase text-white/50 font-medium mb-1">Next Proxle</div>
                        <div className="text-xl font-mono font-bold tracking-widest">{nextGameTime}</div>
                    </div>

                    <div className="w-1/2 pl-4">
                        <button
                            onClick={onShare}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-lg active:scale-95 ${shareStatus === 'copied'
                                ? 'bg-green-500 text-white'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110'
                                }`}
                        >
                            {shareStatus === 'copied' ? 'Copied!' : (
                                <>
                                    <Share2 size={18} />
                                    SHARE
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}

function StatBox({ value, label, highlight = false }: { value: number, label: string, highlight?: boolean }) {
    return (
        <div className="flex flex-col items-center">
            <div className={`text-2xl font-black ${highlight ? 'text-orange-400' : 'text-white'}`}>
                {value}
            </div>
            <div className="text-[10px] uppercase text-white/50 font-medium tracking-wide text-center">
                {label}
            </div>
        </div>
    );
}
