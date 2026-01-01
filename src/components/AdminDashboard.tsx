import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Activity, Trash2, Heart, Check, X as XIcon, MessageSquare, Search, RefreshCw, Shield, Edit2, FileJson, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { doc, deleteDoc, updateDoc, serverTimestamp, where } from 'firebase/firestore';

const ADMIN_EMAILS = ['banklam@skyboundmi.com', 'proxle@skyboundmi.com'];

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalGames: 0,
        recentUsers: [] as any[],
        pendingApprovals: [] as any[]
    });
    const [users, setUsers] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [donators, setDonators] = useState<any[]>([]);

    // Security Check
    useEffect(() => {
        if (!loading) {
            if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
                navigate('/');
            } else {
                fetchAdminData();
            }
        }
    }, [user, loading, navigate]);

    const fetchAdminData = async () => {
        try {
            const usersRef = collection(db, 'users');

            // Fetch Recent Users
            const qRecent = query(usersRef, orderBy('lastActiveAt', 'desc'), limit(50));
            const snapshotRecent = await getDocs(qRecent);

            // Fetch Pending Approvals
            const qPending = query(usersRef, where('messageApprovalStatus', '==', 'pending'), limit(50));
            const snapshotPending = await getDocs(qPending);

            let games = 0;
            const recent: any[] = [];
            snapshotRecent.forEach(doc => {
                const data = doc.data();
                games += (data.totalGames || 0);
                recent.push({ id: doc.id, ...data });
            });

            const pending: any[] = [];
            snapshotPending.forEach(doc => {
                pending.push({ id: doc.id, ...doc.data() });
            });

            // Fetch All Donators
            const qDonators = query(usersRef, orderBy('donations.total', 'desc'), limit(100));
            const snapshotDonators = await getDocs(qDonators);
            const donatorsList: any[] = [];
            snapshotDonators.forEach(doc => {
                const d = doc.data();
                if (d.donations?.total > 0) {
                    donatorsList.push({ id: doc.id, ...d });
                }
            });
            setDonators(donatorsList);

            setStats({
                totalUsers: snapshotRecent.size, // Recently active count
                totalGames: games,
                recentUsers: recent,
                pendingApprovals: pending
            });
            setUsers(recent);
        } catch (error) {
            console.error("Admin Fetch Error:", error);
        } finally {
            setDataLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setUsers(stats.recentUsers);
            return;
        }

        setIsSearching(true);
        try {
            const usersRef = collection(db, 'users');
            // Try email first
            let q = query(usersRef, where('email', '==', searchTerm.toLowerCase()));
            let snap = await getDocs(q);

            if (snap.empty) {
                // Try display name
                q = query(usersRef, where('displayName', '==', searchTerm));
                snap = await getDocs(q);
            }

            const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(results);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleExportData = (user: any) => {
        const exportData = {
            metadata: {
                exported_at: new Date().toISOString(),
                app: "Proxle"
            },
            profile: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastActive: user.lastActiveAt?.toDate?.() || user.lastActiveAt
            },
            stats: {
                totalGames: user.totalGames,
                totalWins: user.totalWins,
                winRate: user.winRate,
                currentStreak: user.currentStreak,
                maxStreak: user.maxStreak,
                guessDistribution: user.guessDistribution
            },
            donations: user.donations || {},
            leaderboard: {
                name: user.leaderboardName,
                message: user.message,
                status: user.messageApprovalStatus,
                displayOnLeaderboard: user.displayOnLeaderboard
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proxle-data-${user.email || user.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleApproveMessage = async (userId: string, status: 'approved' | 'rejected') => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                messageApprovalStatus: status
            });
            fetchAdminData();
        } catch (error) {
            console.error("Approval Error:", error);
            alert("Failed to update status.");
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!window.confirm(`⚠️ PERMANENTLY DELETE USER: ${email || userId}?\n\nThis action cannot be undone. All stats and history will be wiped.`)) return;

        try {
            await deleteDoc(doc(db, 'users', userId));
            fetchAdminData();
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Failed to delete user.");
        }
    };

    const handleManualCredit = async (userId: string, currentTotal: number) => {
        const amountStr = window.prompt("Enter donation amount to ADD (e.g. 5.00):");
        if (!amountStr) return;

        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return alert("Invalid amount");

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                'donations.total': currentTotal + amount,
                'donations.count': (users.find(u => u.id === userId)?.donations?.count || 0) + 1,
                'lastActiveAt': serverTimestamp()
            });
            fetchAdminData();
        } catch (error) {
            console.error("Credit Error:", error);
            alert("Failed to credit amount.");
        }
    };

    const handleToggleLeaderboard = async (userId: string, currentStatus: boolean | undefined) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                displayOnLeaderboard: !currentStatus
            });
            // Optimistic update
            setDonators(prev => prev.map(u => u.id === userId ? { ...u, displayOnLeaderboard: !currentStatus } : u));
            fetchAdminData();
        } catch (error) {
            console.error("Toggle Error:", error);
            alert("Failed to toggle status.");
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const userRef = doc(db, 'users', editingUser.id);
            await updateDoc(userRef, {
                displayName: editingUser.displayName,
                currentStreak: Number(editingUser.currentStreak || 0),
                maxStreak: Number(editingUser.maxStreak || 0),
                leaderboardName: editingUser.leaderboardName || ''
            });
            setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
            setEditingUser(null);
            fetchAdminData();
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update user.");
        }
    };

    if (loading || dataLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) return null;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center overflow-x-hidden relative selection:bg-cyan-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] opacity-20 animate-pulse" />
                <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] opacity-20" />
                <div className="absolute -bottom-20 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] opacity-10" />
            </div>

            <div className="max-w-7xl mx-auto w-full p-6 lg:p-12 relative z-10">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                            <Shield className="text-cyan-500" size={32} />
                            NEXUS CONTROL <span className="text-sm font-mono text-cyan-500/50 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">v2.1</span>
                        </h1>
                        <p className="text-white/40 font-medium tracking-wide uppercase text-xs">Administrator Command Center</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => fetchAdminData()}
                            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-bold"
                        >
                            Back to App
                        </button>
                    </div>
                </header>

                {/* Infrastructure & Billing */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden text-white">
                        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">
                                <Activity size={12} className="text-blue-400" />
                                GCP Spending (Est)
                            </div>
                            <div className="text-3xl font-black text-white">$0.00 <span className="text-xs text-green-500 font-mono">-$2.45 Credit</span></div>
                            <div className="text-[10px] text-white/30 mt-3 flex justify-between items-center">
                                <span>Credits: $0.15/day</span>
                                <a href="https://console.cloud.google.com/billing" target="_blank" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
                                    Console <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden text-white">
                        <div className="absolute inset-0 bg-orange-500/5 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">
                                <Activity size={12} className="text-orange-400" />
                                Cloudflare
                            </div>
                            <div className="text-3xl font-black text-white">ACTIVE</div>
                            <div className="text-[10px] text-white/30 mt-3 flex justify-between items-center">
                                <span>Requests: 1.2k (24h)</span>
                                <a href="https://dash.cloudflare.com" target="_blank" className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors">
                                    Dashboard <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <StatCard
                        icon={<Users className="text-cyan-400" />}
                        label="Active Agents"
                        value={stats.totalUsers}
                    />
                    <StatCard
                        icon={<Activity className="text-purple-400" />}
                        label="Total Incursions"
                        value={stats.totalGames}
                    />
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <form onSubmit={handleSearch} className="relative max-w-2xl">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search Agents by Email or Name..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            {isSearching ? 'Analyzing...' : 'Execute Search'}
                        </button>
                    </form>
                </div>

                {/* Pending Approvals */}
                {stats.pendingApprovals.length > 0 && (
                    <div className="glass-panel rounded-2xl p-6 border border-yellow-500/30 mb-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-yellow-400">
                                <MessageSquare size={20} />
                                Pending Message Approvals ({stats.pendingApprovals.length})
                            </h2>

                            <div className="space-y-4">
                                {stats.pendingApprovals.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-4">
                                            {u.photoURL ? (
                                                <img src={u.photoURL} className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-white/10" />
                                            )}
                                            <div>
                                                <div className="font-bold">{u.displayName} <span className="text-white/40 font-mono text-xs ml-2">${u.donations?.total || 0}</span></div>
                                                <div className="text-sm italic text-cyan-400">"{u.message}"</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApproveMessage(u.id, 'approved')}
                                                className="p-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg transition-colors"
                                                title="Approve"
                                            >
                                                <Check size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleApproveMessage(u.id, 'rejected')}
                                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <XIcon size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Donator Management Section */}
                <div className="glass-panel rounded-2xl p-6 border border-cyan-500/30 mb-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400">
                        <Heart size={20} />
                        Donator Management
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50">
                                    <th className="pb-4">Rank</th>
                                    <th className="pb-4">Donator</th>
                                    <th className="pb-4">Amount</th>
                                    <th className="pb-4">Message & Status</th>
                                    <th className="pb-4 text-center">Placement</th>
                                    <th className="pb-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {donators.map((u, i) => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 font-mono font-bold text-white/50">#{i + 1}</td>
                                        <td className="py-4 flex items-center gap-3">
                                            {u.photoURL ? (
                                                <img src={u.photoURL} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                            )}
                                            <div>
                                                <div className="font-bold text-white">{u.displayName || 'Anonymous'}</div>
                                                <div className="text-xs text-white/40">{u.lederboardName || u.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 font-mono text-green-400 font-bold">
                                            ${u.donations?.total?.toFixed(2)}
                                        </td>
                                        <td className="py-4 max-w-xs">
                                            {u.message ? (
                                                <div className="space-y-1">
                                                    <div className="text-sm italic text-white/80">"{u.message}"</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${u.messageApprovalStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                            u.messageApprovalStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-yellow-500/20 text-yellow-400'
                                                            }`}>
                                                            {u.messageApprovalStatus || 'pending'}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleApproveMessage(u.id, 'approved')} className="p-1 hover:text-green-400"><Check size={14} /></button>
                                                            <button onClick={() => handleApproveMessage(u.id, 'rejected')} className="p-1 hover:text-red-400"><XIcon size={14} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-white/20 italic">- No message -</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-center">
                                            <button
                                                onClick={() => handleToggleLeaderboard(u.id, u.displayOnLeaderboard)}
                                                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mx-auto ${u.displayOnLeaderboard !== false
                                                    ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                                                    }`}
                                            >
                                                {u.displayOnLeaderboard !== false ? (
                                                    <><Eye size={14} /> VISIBLE</>
                                                ) : (
                                                    <><EyeOff size={14} /> HIDDEN</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button
                                                onClick={() => setEditingUser(u)}
                                                className="p-2 hover:text-cyan-400 transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* User Table */}
                <div className="glass-panel rounded-2xl p-6 border border-white/10 text-white">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Activity size={20} />
                        Recent Activity
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50">
                                    <th className="pb-4">User</th>
                                    <th className="pb-4">Games</th>
                                    <th className="pb-4">Donated</th>
                                    <th className="pb-4">Win Rate</th>
                                    <th className="pb-4">Last Active</th>
                                    <th className="pb-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="py-4 flex items-center gap-3">
                                            {u.photoURL ? (
                                                <img src={u.photoURL} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                            )}
                                            <div>
                                                <div className="font-bold text-white">{u.displayName || 'Anonymous'}</div>
                                                <div className="text-xs text-white/40">{u.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-4 font-mono text-white">
                                            <div className="text-white">{u.totalGames}</div>
                                            <div className="text-[10px] text-white/30">Streak: {u.currentStreak || 0}</div>
                                        </td>
                                        <td className="py-4 font-mono text-green-400">
                                            ${u.donations?.total?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="py-4 font-mono text-white">{u.winRate}%</td>
                                        <td className="py-4 text-white/50">
                                            {u.lastActiveAt?.toDate().toLocaleDateString()}
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleManualCredit(u.id, u.donations?.total || 0)}
                                                    className="p-2 hover:text-green-400 transition-colors"
                                                    title="Credit Donation"
                                                >
                                                    <Heart size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingUser(u)}
                                                    className="p-2 hover:text-cyan-400 transition-colors"
                                                    title="Edit Agent"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleExportData(u)}
                                                    className="p-2 hover:text-purple-400 transition-colors"
                                                    title="Export Data (JSON)"
                                                >
                                                    <FileJson size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                                    className="p-2 hover:text-red-500 transition-colors"
                                                    title="Permanent Deletion"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Manual Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm shadow-2xl" onClick={() => setEditingUser(null)} />
                    <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 text-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Edit2 size={20} className="text-cyan-400" />
                                Edit Agent Data
                            </h3>
                            <button onClick={() => setEditingUser(null)}><XIcon size={24} /></button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="text-xs text-white/40 block mb-1 uppercase tracking-widest">Display Name</label>
                                <input
                                    type="text"
                                    value={editingUser.displayName || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1 uppercase tracking-widest">Current Streak</label>
                                    <input
                                        type="number"
                                        value={editingUser.currentStreak || 0}
                                        onChange={(e) => setEditingUser({ ...editingUser, currentStreak: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1 uppercase tracking-widest">Max Streak</label>
                                    <input
                                        type="number"
                                        value={editingUser.maxStreak || 0}
                                        onChange={(e) => setEditingUser({ ...editingUser, maxStreak: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1 uppercase tracking-widest">Leaderboard Alias</label>
                                <input
                                    type="text"
                                    value={editingUser.leaderboardName || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, leaderboardName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                />
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-all text-white">
                                    Commit Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, link = false }: { icon: any, label: string, value: any, link?: boolean }) {
    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl">
                {icon}
            </div>
            <div>
                <div className="text-xs uppercase tracking-wide text-white/50 mb-1">{label}</div>
                <div className={`text-2xl font-bold ${link ? 'text-primary' : ''}`}>{value}</div>
            </div>
        </div>
    );
}
