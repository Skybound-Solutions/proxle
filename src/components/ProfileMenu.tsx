import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, BarChart3, Trophy } from 'lucide-react';
import type { UserStats } from '../lib/stats';

interface ProfileMenuProps {
    user: {
        displayName: string | null;
        email: string | null;
        photoURL: string | null;
    };
    stats: UserStats | null;
    onSignOut: () => void;
    onViewStats: () => void;
    onViewLeaderboardSettings: () => void;
    onViewAdmin?: () => void;
    isAdmin?: boolean;
}

export default function ProfileMenu({ user, stats, onSignOut, onViewStats, onViewLeaderboardSettings, onViewAdmin, isAdmin }: ProfileMenuProps) {
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
                        className="absolute right-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 p-2"
                    >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/10 mb-2">
                            <div className="font-semibold text-white truncate">{user.displayName || 'Anonymous'}</div>
                            <div className="text-xs text-white/50 truncate">{user.email}</div>
                        </div>

                        {/* Quick Stats Grid */}
                        {stats && (
                            <div className="px-2 mb-2">
                                <button
                                    onClick={() => {
                                        onViewStats();
                                        setIsOpen(false);
                                    }}
                                    className="w-full grid grid-cols-3 gap-1 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all group"
                                >
                                    <div className="text-center">
                                        <div className="text-xl font-black text-white">{stats.totalGames}</div>
                                        <div className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Played</div>
                                    </div>
                                    <div className="text-center border-x border-white/10 px-1">
                                        <div className="text-xl font-black text-emerald-400">{stats.winRate}%</div>
                                        <div className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Win %</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-black text-cyan-400">{stats.currentStreak}</div>
                                        <div className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Streak</div>
                                    </div>

                                    <div className="col-span-3 mt-3 flex items-center justify-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-widest group-hover:text-cyan-400/70 transition-colors">
                                        <BarChart3 size={12} />
                                        Full Statistics
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Menu Items */}
                        <div className="space-y-1">
                            {isAdmin && onViewAdmin && (
                                <button
                                    onClick={() => {
                                        onViewAdmin();
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-cyan-500/10 rounded-lg transition-colors text-left text-cyan-100/90"
                                >
                                    <LayoutDashboard size={18} className="text-cyan-400" />
                                    <span className="text-sm font-bold tracking-tight">Nexus Control Dashboard</span>
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    onViewLeaderboardSettings();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 rounded-lg transition-colors text-left text-white/90"
                            >
                                <Trophy size={18} className="text-yellow-400" />
                                <span className="text-sm font-bold">Leaderboard Settings</span>
                            </button>

                            <button
                                onClick={() => {
                                    onSignOut();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/20 rounded-lg transition-colors text-left text-red-300"
                            >
                                <LogOut size={18} />
                                <span className="text-sm font-bold">Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
