import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, X, Heart, MessageSquare, Flame } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import clsx from 'clsx';

interface Supporter {
    id: string;
    displayName: string;
    amount: number;
    message?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    photoURL?: string;
    showDonationAmount: boolean;
    timestamp: any;
    currentStreak: number;
    showStreak: boolean;
}

interface StreakLeader {
    id: string;
    displayName: string;
    currentStreak: number;
    photoURL?: string;
}

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [streakLeaders, setStreakLeaders] = useState<StreakLeader[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboardData();
        }
    }, [isOpen]);

    const fetchLeaderboardData = async () => {
        setLoading(true);
        try {
            // Fetch top donators from leaderboard collection
            const leaderboardRef = collection(db, 'leaderboard');
            const donatorsQuery = query(
                leaderboardRef,
                where('amount', '>', 0),
                orderBy('amount', 'desc'),
                limit(50)
            );

            // Fetch top 10 streaks from users collection
            const usersRef = collection(db, 'users');
            const streaksQuery = query(
                usersRef,
                where('displayOnLeaderboard', '==', true),
                where('showStreak', '==', true),
                where('currentStreak', '>=', 1),
                orderBy('currentStreak', 'desc'),
                limit(10)
            );

            const [donatorsResult, streaksResult] = await Promise.allSettled([
                getDocs(donatorsQuery),
                getDocs(streaksQuery)
            ]);

            const donatorsData = donatorsResult.status === 'fulfilled'
                ? donatorsResult.value.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        displayName: d.displayName || 'Anonymous',
                        amount: d.amount || 0,
                        message: d.message,
                        approvalStatus: d.approvalStatus || 'pending',
                        photoURL: d.photoURL,
                        showDonationAmount: d.showAmount !== false,
                        timestamp: d.lastActiveAt,
                        currentStreak: d.currentStreak || 0,
                        showStreak: d.showStreak !== false
                    } as Supporter;
                })
                : [];

            if (donatorsResult.status === 'rejected') {
                console.error("Failed to fetch donators:", donatorsResult.reason);
            }

            const streaksData = streaksResult.status === 'fulfilled'
                ? streaksResult.value.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        displayName: d.leaderboardName || 'Anonymous',
                        currentStreak: d.currentStreak || 0,
                        photoURL: d.photoURL
                    } as StreakLeader;
                })
                : [];

            if (streaksResult.status === 'rejected') {
                console.error("Failed to fetch streaks:", streaksResult.reason);
            }

            setSupporters(donatorsData);
            setStreakLeaders(streaksData);
        } catch (error) {
            console.error("Fetch Leaderboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const top3 = supporters.slice(0, 3);
    const others = supporters.slice(3);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 z-0 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh] z-[60]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-xl">
                            <Trophy className="text-yellow-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Proxle Leaderboard</h2>
                            <p className="text-xs text-white/50">Top Supporters & Active Players</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-white/40 font-medium">Loading leaderboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Top 3 Supporters Billboard */}
                            {top3.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2 flex items-center gap-2">
                                        <Heart size={12} className="text-cyan-400" />
                                        Top Supporters
                                    </h3>
                                    {top3.map((s, i) => (
                                        <BillboardItem key={s.id} supporter={s} rank={i + 1} />
                                    ))}
                                </div>
                            )}

                            {/* Streak Leaders Section */}
                            {streakLeaders.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2 flex items-center gap-2">
                                        <Flame size={12} className="text-orange-400" />
                                        Streak Leaders
                                    </h3>
                                    <div className="space-y-2">
                                        {streakLeaders.map((leader, i) => (
                                            <StreakLeaderRow key={leader.id} leader={leader} rank={i + 1} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Supporters List */}
                            {others.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2">Other Supporters</h3>
                                    {others.map((s, i) => (
                                        <SupporterRow key={s.id} supporter={s} rank={i + 4} />
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {supporters.length === 0 && streakLeaders.length === 0 && (
                                <div className="text-center py-12">
                                    <Heart className="mx-auto text-white/10 mb-4" size={48} />
                                    <p className="text-white/40">Be the first to support Proxle!</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer / CTA */}
                <div className="p-6 bg-white/5 border-t border-white/10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-xs text-white/40 bg-black/20 p-3 rounded-xl border border-white/5">
                            <Trophy size={14} className="text-yellow-400 shrink-0" />
                            <p>Support Proxle to appear on the leaderboard and unlock a custom message!</p>
                        </div>

                        <a
                            href="https://ko-fi.com/skyboundmi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
                        >
                            <Heart size={20} fill="currentColor" />
                            Support Proxle & Join the Leaderboard
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function BillboardItem({ supporter, rank }: { supporter: Supporter, rank: number }) {
    const medals = ["🏆", "🥇", "🥈", "🥉"];
    const colors = [
        "",
        "from-yellow-400/20 to-transparent",
        "from-slate-300/20 to-transparent",
        "from-orange-400/20 to-transparent"
    ];
    const borderColors = [
        "",
        "border-yellow-400/30",
        "border-slate-300/30",
        "border-orange-400/30"
    ];

    return (
        <div className={clsx(
            "relative p-4 rounded-2xl border bg-gradient-to-br overflow-hidden group",
            colors[rank],
            borderColors[rank]
        )}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {supporter.photoURL ? (
                            <img src={supporter.photoURL} className="w-10 h-10 rounded-full border-2 border-white/10" alt="" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg grayscale">
                                ✨
                            </div>
                        )}
                        <div className="absolute -top-2 -left-2 text-xl drop-shadow-md">
                            {medals[rank]}
                        </div>
                    </div>
                </div>
                <div>
                    <div className="font-bold text-white flex items-center gap-2">
                        {supporter.displayName}
                        {supporter.showStreak && supporter.currentStreak > 0 && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                <span className="text-[10px] text-orange-400">🔥</span>
                                <span className="text-[10px] font-bold text-orange-300">{supporter.currentStreak}</span>
                            </div>
                        )}
                    </div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                        {supporter.showDonationAmount ? `$${supporter.amount.toFixed(2)}` : '💎 Supporter'}
                    </div>
                </div>
            </div>
            {supporter.message && supporter.approvalStatus === 'approved' && (
                <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5 relative z-10">
                    <MessageSquare size={12} className="absolute -top-1.5 -right-1.5 text-cyan-400/50" />
                    <p className="text-sm italic text-white/80 leading-relaxed">
                        "{supporter.message}"
                    </p>
                </div>
            )}

            {/* Background rank number */}
            <div className="absolute -right-4 -bottom-8 text-8xl font-black text-white/5 pointer-events-none italic">
                {rank}
            </div>
        </div>
    );
}

function StreakLeaderRow({ leader, rank }: { leader: StreakLeader, rank: number }) {
    return (
        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 group">
            <div className="flex items-center gap-3">
                <span className="w-6 text-[10px] font-mono font-bold text-white/20 group-hover:text-white/40 transition-colors">
                    #{rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">
                    {leader.photoURL ? (
                        <img src={leader.photoURL} className="w-full h-full rounded-full" alt="" />
                    ) : (
                        '✨'
                    )}
                </div>
                <span className="font-medium text-sm text-white/80">
                    {leader.displayName}
                </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <span className="text-orange-400">🔥</span>
                <span className="text-sm font-bold text-orange-300">{leader.currentStreak}</span>
                <span className="text-[10px] text-orange-300/60">days</span>
            </div>
        </div>
    );
}

function SupporterRow({ supporter, rank }: { supporter: Supporter, rank: number }) {
    return (
        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 group">
            <div className="flex items-center gap-3">
                <span className="w-6 text-[10px] font-mono font-bold text-white/20 group-hover:text-white/40 transition-colors">
                    #{rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs grayscale">
                    {supporter.photoURL ? (
                        <img src={supporter.photoURL} className="w-full h-full rounded-full" alt="" />
                    ) : (
                        '✨'
                    )}
                </div>
                <span className="font-medium text-sm text-white/80 flex items-center gap-2">
                    {supporter.displayName}
                    {supporter.showStreak && supporter.currentStreak > 0 && (
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded-full">
                            <span className="text-[9px] text-orange-400">🔥</span>
                            <span className="text-[9px] font-bold text-white/60">{supporter.currentStreak}</span>
                        </div>
                    )}
                </span>
            </div>
            <div className="text-sm font-mono font-bold text-white/40">
                {supporter.showDonationAmount ? `$${supporter.amount.toFixed(0)}` : '💎'}
            </div>
        </div>
    );
}
