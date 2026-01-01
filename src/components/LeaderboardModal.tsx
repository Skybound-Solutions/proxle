import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, X, Heart, MessageSquare, Flame, ChevronDown } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where, startAfter, getCountFromServer, DocumentSnapshot, startAt } from 'firebase/firestore';
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
    actualStreakRank?: number; // Fetched rank
}

interface StreakLeader {
    id: string;
    displayName: string;
    currentStreak: number;
    photoURL?: string;
    rank: number | string; // Allow '?' for jump
    isCurrentUser?: boolean;
}

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserData: any; // Use any to allow accessing email not in UserStats
}

const ITEMS_PER_PAGE = 20;

export default function LeaderboardModal({ isOpen, onClose, currentUserData }: LeaderboardModalProps) {
    const [topDonators, setTopDonators] = useState<Supporter[]>([]);
    const [streakLeaders, setStreakLeaders] = useState<StreakLeader[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [myRank, setMyRank] = useState<number | null>(null);

    // Scroll container ref for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreStreaks();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);


    useEffect(() => {
        if (isOpen) {
            resetAndFetch();
        }
    }, [isOpen]);

    const resetAndFetch = async () => {
        setLoading(true);
        setStreakLeaders([]);
        setLastDoc(null);
        setHasMore(true);

        // 1. Fetch Rank if User Exists
        if (currentUserData?.displayOnLeaderboard && currentUserData.currentStreak > 0) {
            calculateMyRank(currentUserData.currentStreak);
        } else {
            setMyRank(null);
        }

        try {
            // 2. Initial Data Fetch (Top Donators + First Page Streaks)
            const donatorsQuery = query(
                collection(db, 'leaderboard'),
                where('amount', '>', 0),
                orderBy('amount', 'desc'),
                limit(3)
            );

            const streaksQuery = query(
                collection(db, 'users'),
                where('displayOnLeaderboard', '==', true),
                where('showStreak', '==', true),
                where('currentStreak', '>=', 1),
                orderBy('currentStreak', 'desc'),
                limit(ITEMS_PER_PAGE)
            );

            const [donatorsResult, streaksResult] = await Promise.allSettled([
                getDocs(donatorsQuery),
                getDocs(streaksQuery)
            ]);

            // Process Donators
            if (donatorsResult.status === 'fulfilled') {
                const donators = donatorsResult.value.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        displayName: d.displayName || 'Anonymous',
                        amount: d.amount || 0,
                        message: d.message,
                        approvalStatus: d.approvalStatus || 'pending',
                        photoURL: d.photoURL,
                        showDonationAmount: d.showAmount !== false,
                        currentStreak: d.currentStreak || 0,
                        showStreak: d.showStreak !== false
                    } as Supporter;
                });
                setTopDonators(donators);
            }

            // Process Streaks
            if (streaksResult.status === 'fulfilled') {
                const snapshot = streaksResult.value;
                const leaders = snapshot.docs.map((doc, index) => ({
                    id: doc.id,
                    displayName: doc.data().leaderboardName || 'Anonymous',
                    currentStreak: doc.data().currentStreak || 0,
                    photoURL: doc.data().photoURL,
                    rank: index + 1,
                    isCurrentUser: currentUserData?.email === doc.data().email // Best effort match if ID not available in stats
                } as StreakLeader));

                setStreakLeaders(leaders);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                if (snapshot.docs.length < ITEMS_PER_PAGE) setHasMore(false);
            }

        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMyRank = async (myStreak: number) => {
        try {
            const usersRef = collection(db, 'users');
            // Count users with strictly better streak
            const q = query(
                usersRef,
                where('displayOnLeaderboard', '==', true),
                where('showStreak', '==', true),
                where('currentStreak', '>', myStreak)
            );
            const snapshot = await getCountFromServer(q);
            setMyRank(snapshot.data().count + 1);
        } catch (e) {
            console.error("Rank calculation error:", e);
        }
    };

    const loadMoreStreaks = async () => {
        if (!hasMore || loadingMore || !lastDoc) return;
        setLoadingMore(true);

        try {
            const q = query(
                collection(db, 'users'),
                where('displayOnLeaderboard', '==', true),
                where('showStreak', '==', true),
                where('currentStreak', '>=', 1),
                orderBy('currentStreak', 'desc'),
                startAfter(lastDoc),
                limit(ITEMS_PER_PAGE)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                setHasMore(false);
            } else {
                const startRank = streakLeaders.length + 1;
                const newLeaders = snapshot.docs.map((doc, index) => ({
                    id: doc.id,
                    displayName: doc.data().leaderboardName || 'Anonymous',
                    currentStreak: doc.data().currentStreak || 0,
                    photoURL: doc.data().photoURL,
                    rank: startRank + index,
                    isCurrentUser: currentUserData?.email === doc.data().email
                } as StreakLeader));

                setStreakLeaders(prev => [...prev, ...newLeaders]);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                if (snapshot.docs.length < ITEMS_PER_PAGE) setHasMore(false);
            }
        } catch (error) {
            console.error("Load more error:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const jumpToMyRank = async () => {
        if (!myRank || !currentUserData) return;
        setLoading(true);
        // Reset list and fetch starting at my streak
        // Note: Sort is DESC, so startAt(myStreak) means start at users with that streak
        try {
            const q = query(
                collection(db, 'users'),
                where('displayOnLeaderboard', '==', true),
                where('showStreak', '==', true),
                where('currentStreak', '>=', 1),
                orderBy('currentStreak', 'desc'),
                startAt(currentUserData.currentStreak),
                limit(ITEMS_PER_PAGE)
            );
            const snapshot = await getDocs(q);

            // Note: The rank calculation for this page is tricky because we jumped.
            // We use 'myRank' as the anchor. If I am the first in this batch (best case), rank is 'myRank'.
            // Actually, startAt(streak) includes everyone WITH that streak.
            // So the first person in this list has streak == myStreak (or better if simple startAt).
            // Actually 'startAt' includes items equal to the value.
            // But since it's DESC, larger values come first.
            // So startAt(10) starts at 10.
            // Users with 11 are skipped.
            // So the rank of the first item is roughly 'myRank' (minus ties optimization).
            // We'll approximate rank starts at myRank for the first in batch (assuming I'm near top of my streak group).
            // More accurately: The count of users > myStreak is (myRank - 1).
            // So the first user in this list (streak == myStreak) is practically at rank (myRank).

            const leaders = snapshot.docs.map((doc) => ({
                id: doc.id,
                displayName: doc.data().leaderboardName || 'Anonymous',
                currentStreak: doc.data().currentStreak || 0,
                photoURL: doc.data().photoURL,
                rank: "?", // Visual indicator that we jumped
                isCurrentUser: currentUserData.email === doc.data().email
            } as any));

            setStreakLeaders(leaders);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(true); // Can load more downwards

            // Scroll to top of list container?
            // document.getElementById('leaderboard-list')?.scrollTo(0,0);
        } catch (e) {
            console.error("Jump error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

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
                            <p className="text-xs text-white/50">Top Supporters & Active Streaks</p>
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
                <div id="leaderboard-list" className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-white/40 font-medium">Loading leaderboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Top 3 Supporters Billboard */}
                            {topDonators.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2 flex items-center gap-2">
                                        <Heart size={12} className="text-cyan-400" />
                                        Top Supporters
                                    </h3>
                                    {topDonators.map((s, i) => (
                                        <BillboardItem key={s.id} supporter={s} rank={i + 1} />
                                    ))}
                                </div>
                            )}

                            {/* My Rank Banner */}
                            {myRank && currentUserData && (
                                <button
                                    onClick={jumpToMyRank}
                                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-violet-500/30 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300">
                                            #{myRank}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-white">Your Rank</div>
                                            <div className="text-[10px] text-white/50">Click to scroll to your position</div>
                                        </div>
                                    </div>
                                    <ChevronDown className="text-violet-400 group-hover:translate-y-1 transition-transform" size={16} />
                                </button>
                            )}

                            {/* Streak Leaders Section */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2 flex items-center gap-2">
                                    <Flame size={12} className="text-orange-400" />
                                    Streak Leaderboard
                                </h3>
                                <div className="space-y-2">
                                    {streakLeaders.map((leader, i) => (
                                        <div key={leader.id} ref={i === streakLeaders.length - 1 ? lastElementRef : null}>
                                            <StreakLeaderRow leader={leader} />
                                        </div>
                                    ))}
                                    {streakLeaders.length === 0 && (
                                        <div className="text-center py-8 text-white/30 text-sm">
                                            No explicit streaks yet. Start playing!
                                        </div>
                                    )}
                                </div>
                                {loadingMore && (
                                    <div className="flex justify-center py-4">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer / CTA */}
                <div className="p-6 bg-white/5 border-t border-white/10 shrink-0">
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
                <div className="flex-1 px-3">
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
                <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5 relative z-10">
                    <MessageSquare size={12} className="absolute -top-1.5 -right-1.5 text-cyan-400/50" />
                    <p className="text-sm italic text-white/80 leading-relaxed">
                        "{supporter.message}"
                    </p>
                </div>
            )}
        </div>
    );
}

function StreakLeaderRow({ leader }: { leader: StreakLeader }) {
    return (
        <div className={clsx(
            "flex items-center justify-between p-3 rounded-xl transition-colors border group",
            leader.isCurrentUser
                ? "bg-violet-500/20 border-violet-500/30"
                : "hover:bg-white/5 border-transparent hover:border-white/5"
        )}>
            <div className="flex items-center gap-3">
                <span className={clsx(
                    "w-8 text-center text-sm font-mono font-bold transition-colors",
                    (typeof leader.rank === 'number' && leader.rank <= 3) ? "text-yellow-400" : "text-white/20 group-hover:text-white/40"
                )}>
                    {leader.rank === '?' ? '-' : `#${leader.rank}`}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">
                    {leader.photoURL ? (
                        <img src={leader.photoURL} className="w-full h-full rounded-full" alt="" />
                    ) : (
                        '✨'
                    )}
                </div>
                <span className={clsx("font-medium text-sm", leader.isCurrentUser ? "text-violet-200" : "text-white/80")}>
                    {leader.displayName} {leader.isCurrentUser && "(You)"}
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
