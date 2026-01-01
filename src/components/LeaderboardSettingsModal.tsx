import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

interface LeaderboardSettingsModalProps {
    userData: any; // Full user document data
    isOpen: boolean;
    onClose: () => void;
    onUpdateProfile?: (data: any) => Promise<void>;
}

export default function LeaderboardSettingsModal({
    userData,
    isOpen,
    onClose,
    onUpdateProfile
}: LeaderboardSettingsModalProps) {
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
                onClose();
            }, 1000);
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

                <h2 className="text-xl font-bold text-center mb-6 tracking-wide flex items-center justify-center gap-2">
                    <span>🏆</span> Leaderboard Settings
                </h2>

                <div className="space-y-4">
                    {/* Opt-in Toggle */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div>
                            <label className="text-sm text-white font-bold">Appear on Leaderboard</label>
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
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4"
                        >
                            {/* Display Name */}
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <label className="text-[10px] uppercase text-white/40 block mb-2 font-bold">
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
                                <p className="text-[10px] text-white/40 mt-2">
                                    📝 Names are reviewed for appropriateness
                                </p>
                            </div>

                            {/* Show Streak Toggle */}
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                <div>
                                    <label className="text-sm text-white font-bold">Show My Streak</label>
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
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <label className="text-sm text-white font-bold">Show Donation Amount</label>
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
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <label className="text-[10px] uppercase text-white/40 block mb-2 font-bold">
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
                                    <p className="text-[10px] text-white/40 mt-2">
                                        💬 Only visible if you're in the top 3 supporters
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-lg active:scale-95"
                    >
                        {saveStatus === 'saving' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                            saveStatus === 'saved' ? <Check size={18} /> : 'Save Settings'}
                    </button>
                </div>

            </motion.div>
        </div>
    );
}
