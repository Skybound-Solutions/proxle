import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, X, Heart, Flame, ChevronDown } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where, startAfter, DocumentSnapshot, startAt } from 'firebase/firestore';
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
    currentStreak: number;
    showStreak: boolean;
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

            // TEMPORARY: Simplified query to work without composite index
            // Once index builds, we can add back the where clauses
            const streaksQuery = query(
                collection(db, 'leaderboard'),
                orderBy('currentStreak', 'desc'),
                limit(50) // Fetch more and filter client-side
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

            // Process Streaks with client-side filtering
            if (streaksResult.status === 'fulfilled') {
                const snapshot = streaksResult.value;

                // Filter client-side for users who should be displayed
                const filtered = snapshot.docs.filter(doc => {
                    const d = doc.data();
                    return d.displayOnLeaderboard === true &&
                        d.showStreak === true &&
                        (d.currentStreak || 0) >= 1;
                });

                const leaders = filtered.slice(0, ITEMS_PER_PAGE).map((doc, index) => ({
                    id: doc.id,
                    displayName: doc.data().displayName || 'Anonymous',
                    currentStreak: doc.data().currentStreak || 0,
                    photoURL: doc.data().photoURL,
                    rank: index + 1,
                    isCurrentUser: currentUserData?.uid === doc.id  // FIX: Use UID not email
                } as StreakLeader));

                setStreakLeaders(leaders);
                setLastDoc(filtered[filtered.length - 1]);
                if (filtered.length < ITEMS_PER_PAGE) setHasMore(false);
            }

        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMyRank = async (_myStreak: number) => {
        try {
            // TODO: Re-enable once composite index is built
            // This requires an index on leaderboard collection: displayOnLeaderboard, showStreak, currentStreak
            // For now, we'll calculate rank from the fetched data
            setMyRank(null);

            /* 
            const leaderboardRef = collection(db, 'leaderboard');
            const q = query(
                leaderboardRef,
                where('displayOnLeaderboard', '==', true),
                where('showStreak', '==', true),
                where('currentStreak', '>', myStreak)
            );
            const snapshot = await getCountFromServer(q);
            setMyRank(snapshot.data().count + 1);
            */
        } catch (e) {
            console.error("Rank calculation error:", e);
        }
    };

    const loadMoreStreaks = async () => {
        if (!lastDoc || loadingMore || !hasMore) return;
        setLoadingMore(true);

        try {
            const q = query(
                collection(db, 'leaderboard'),
                orderBy('currentStreak', 'desc'),
                startAfter(lastDoc),
                limit(ITEMS_PER_PAGE)
            );

            const snapshot = await getDocs(q);

            // Filter client-side
            const filtered = snapshot.docs.filter(doc => {
                const d = doc.data();
                return d.displayOnLeaderboard === true &&
                    d.showStreak === true &&
                    (d.currentStreak || 0) >= 1;
            });

            if (filtered.length > 0) {
                const startRank = streakLeaders.length + 1;
                const newLeaders = filtered.map((doc, index) => ({
                    id: doc.id,
                    displayName: doc.data().displayName || 'Anonymous',
                    currentStreak: doc.data().currentStreak || 0,
                    photoURL: doc.data().photoURL,
                    rank: startRank + index,
                    isCurrentUser: currentUserData?.uid === doc.id  // FIX: Use UID
                } as StreakLeader));

                setStreakLeaders(prev => [...prev, ...newLeaders]);
                setLastDoc(filtered[filtered.length - 1]);
            }

            if (filtered.length < ITEMS_PER_PAGE) setHasMore(false);
        } catch (e) {
            console.error("Load more error:", e);
        } finally {
            setLoadingMore(false);
        }
    };

    const jumpToMyRank = async () => {
        if (!currentUserData || !myRank) return;
        setLoading(true);

        // Reset list and fetch starting at my streak
        // Note: Sort is DESC, so startAt(myStreak) means start at users with that streak
        try {
            const q = query(
                collection(db, 'leaderboard'),
                orderBy('currentStreak', 'desc'),
                startAt(currentUserData.currentStreak),
                limit(ITEMS_PER_PAGE)
            );
            const snapshot = await getDocs(q);

            const leaders = snapshot.docs.map((doc) => ({
                id: doc.id,
                displayName: doc.data().displayName || 'Anonymous',
                currentStreak: doc.data().currentStreak || 0,
                photoURL: doc.data().photoURL,
                rank: "?", // Visual indicator that we jumped
                isCurrentUser: currentUserData.uid === doc.id  // FIX: Use UID
            } as any));

            setStreakLeaders(leaders);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(true); // Can load more downwards

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
                {/* Compact Header */}
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={18} />
                        <h2 className="text-base font-bold text-white">Leaderboard</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href="https://ko-fi.com/skyboundmi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-white text-xs rounded-lg font-bold flex items-center gap-1 transition-all"
                        >
                            ☕ Support
                        </a>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/50">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div id="leaderboard-list" className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-white/40 font-medium">Loading leaderboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Top 3 Supporters - Compact */}
                            {topDonators.length > 0 && (
                                <div className="space-y-1.5">
                                    <h3 className="text-[9px] uppercase tracking-widest text-white/30 font-bold px-1 flex items-center gap-1">
                                        <Heart size={10} className="text-cyan-400" />
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
                            <div className="space-y-1.5">
                                <h3 className="text-[9px] uppercase tracking-widest text-white/30 font-bold px-1 flex items-center gap-1">
                                    <Flame size={10} className="text-orange-400" />
                                    Streak Leaderboard
                                </h3>
                                <div className="space-y-1">
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
            </motion.div>
        </div>
    );
}

function BillboardItem({ supporter, rank }: { supporter: Supporter, rank: number }) {
    const medals = ["🏆", "🥇", "🥈"];

    return (
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gradient-to-r from-yellow-400/20 to-transparent border border-yellow-400/30">
            <span className="w-6 text-center text-[10px] font-mono text-yellow-400 font-bold flex-shrink-0">
                {medals[rank - 1]}
            </span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] flex-shrink-0">
                {supporter.photoURL ? (
                    <img src={supporter.photoURL} className="w-full h-full rounded-full" alt="" />
                ) : '✨'}
            </div>
            <span className="text-xs text-white font-medium flex-shrink-0">{supporter.displayName}</span>
            {supporter.showDonationAmount && (
                <span className="text-[10px] text-yellow-300 font-bold px-1.5 py-0.5 bg-yellow-500/10 rounded flex-shrink-0">
                    ${supporter.amount.toFixed(2)}
                </span>
            )}
            {supporter.message && supporter.approvalStatus === 'approved' && (
                <span className="text-[9px] italic text-white/50 truncate flex-1 min-w-0">
                    "{supporter.message}"
                </span>
            )}
            {supporter.showStreak && supporter.currentStreak > 0 && (
                <span className="text-[10px] text-orange-300 font-bold flex-shrink-0">
                    🔥{supporter.currentStreak}
                </span>
            )}
        </div>
    );
}

function StreakLeaderRow({ leader }: { leader: StreakLeader }) {
    return (
        <div className={clsx(
            "flex items-center gap-2 p-1.5 rounded-lg transition-colors",
            leader.isCurrentUser ? "bg-violet-500/20" : "hover:bg-white/5"
        )}>
            <span className="w-6 text-center text-[10px] font-mono text-white/30 flex-shrink-0">
                {leader.rank === '?' ? '-' : `#${leader.rank}`}
            </span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] flex-shrink-0">
                {leader.photoURL ? (
                    <img src={leader.photoURL} className="w-full h-full rounded-full" alt="" />
                ) : '✨'}
            </div>
            <span className="flex-1 text-xs text-white truncate min-w-0">
                {leader.displayName}{leader.isCurrentUser && " (You)"}
            </span>
            <span className="text-[10px] text-orange-300 font-bold flex-shrink-0">
                🔥{leader.currentStreak}
            </span>
        </div>
    );
}
