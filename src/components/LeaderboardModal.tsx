import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, X, Heart, MessageSquare, Shield } from 'lucide-react';
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
    isAnonymous: boolean;
    showAmount: 'exact' | 'tier' | 'hidden';
    timestamp: any;
}

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TimeWindow = '30days' | '90days' | 'alltime';

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
    const [activeTab, setActiveTab] = useState<TimeWindow>('alltime');
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchSupporters();
        }
    }, [isOpen, activeTab]);

    const fetchSupporters = async () => {
        setLoading(true);
        try {
            // Read from the specialized public leaderboard collection
            const leaderboardRef = collection(db, 'leaderboard');
            const q = query(
                leaderboardRef,
                where('amount', '>', 0),
                orderBy('amount', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    displayName: d.displayName,
                    amount: d.amount,
                    message: d.message,
                    approvalStatus: d.approvalStatus || 'pending',
                    photoURL: d.photoURL,
                    isAnonymous: d.isAnonymous === true,
                    showAmount: d.showAmount || 'exact',
                    timestamp: d.lastActiveAt
                } as Supporter;
            });

            setSupporters(data);
        } catch (error) {
            console.error("Fetch Supporters Error:", error);
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
                className="glass-overlay"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-xl">
                            <Trophy className="text-yellow-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Supporters Hall</h2>
                            <p className="text-xs text-white/50">Fueling the AI behind Proxle</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex p-2 gap-1 bg-black/20 mx-6 mt-6 rounded-xl border border-white/5">
                    <FilterTab active={activeTab === 'alltime'} label="All Time" onClick={() => setActiveTab('alltime')} />
                    <FilterTab active={activeTab === '90days'} label="90 Days" onClick={() => setActiveTab('90days')} />
                    <FilterTab active={activeTab === '30days'} label="30 Days" onClick={() => setActiveTab('30days')} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-white/40 font-medium">Reading the Hall of Fame...</p>
                        </div>
                    ) : supporters.length === 0 ? (
                        <div className="text-center py-12">
                            <Heart className="mx-auto text-white/10 mb-4" size={48} />
                            <p className="text-white/40">Be the first to support Proxle!</p>
                        </div>
                    ) : (
                        <>
                            {/* Top 3 Billboard */}
                            <div className="space-y-4">
                                {top3.map((s, i) => (
                                    <BillboardItem key={s.id} supporter={s} rank={i + 1} />
                                ))}
                            </div>

                            {/* Others List */}
                            {others.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2">Top Contributors</h3>
                                    {others.map((s, i) => (
                                        <SupporterRow key={s.id} supporter={s} rank={i + 4} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer / CTA */}
                <div className="p-6 bg-white/5 border-t border-white/10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-xs text-white/40 bg-black/20 p-3 rounded-xl border border-white/5">
                            <Shield size={14} className="text-cyan-400 shrink-0" />
                            <p>Top 3 supporters can display a custom message to all players. Verified via Ko-fi.</p>
                        </div>

                        <a
                            href="https://ko-fi.com/skyboundmi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
                        >
                            <Heart size={20} fill="currentColor" />
                            Support Proxle on Ko-fi
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function FilterTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                active ? "bg-white/10 text-white shadow-inner" : "text-white/30 hover:text-white/60"
            )}
        >
            {label}
        </button>
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
                        {supporter.photoURL && !supporter.isAnonymous ? (
                            <img src={supporter.photoURL} className="w-10 h-10 rounded-full border-2 border-white/10" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg grayscale">
                                {supporter.isAnonymous ? '👤' : '✨'}
                            </div>
                        )}
                        <div className="absolute -top-2 -left-2 text-xl drop-shadow-md">
                            {medals[rank]}
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-white flex items-center gap-2">
                            {supporter.isAnonymous ? 'Anonymous Supporter' : supporter.displayName}
                        </div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                            {supporter.showAmount === 'exact' ? `$${supporter.amount.toFixed(2)}` : 'Supporter'}
                        </div>
                    </div>
                </div>
            </div>

            {supporter.message && !supporter.isAnonymous && supporter.approvalStatus === 'approved' && (
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

function SupporterRow({ supporter, rank }: { supporter: Supporter, rank: number }) {
    return (
        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 group">
            <div className="flex items-center gap-3">
                <span className="w-6 text-[10px] font-mono font-bold text-white/20 group-hover:text-white/40 transition-colors">
                    #{rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs grayscale">
                    {supporter.photoURL && !supporter.isAnonymous ? (
                        <img src={supporter.photoURL} className="w-full h-full rounded-full" />
                    ) : (
                        supporter.isAnonymous ? '👤' : '✨'
                    )}
                </div>
                <span className="font-medium text-sm text-white/80">
                    {supporter.isAnonymous ? 'Anonymous' : supporter.displayName}
                </span>
            </div>
            <div className="text-sm font-mono font-bold text-white/40">
                {supporter.showAmount === 'exact' ? `$${supporter.amount.toFixed(0)}` : '💎'}
            </div>
        </div>
    );
}
