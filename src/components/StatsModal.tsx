import { motion } from 'framer-motion';
import { X, Share2 } from 'lucide-react';
import type { UserStats } from '../lib/stats';


interface StatsModalProps {
    stats: UserStats | null;
    isOpen: boolean;
    onClose: () => void;
    onShare: () => void;
    shareStatus: 'idle' | 'copied' | 'shared';
    nextGameTime: string;
}

export default function StatsModal({
    stats,
    isOpen,
    onClose,
    onShare,
    shareStatus,
    nextGameTime
}: StatsModalProps) {
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
