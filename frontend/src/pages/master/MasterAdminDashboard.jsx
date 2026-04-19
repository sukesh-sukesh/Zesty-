import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/SidebarLayout';
import { getMasterStats, getZones } from '../../api';
import { motion } from 'framer-motion';
import { Globe, BarChart3, Database, ShieldAlert, Navigation, Settings2, Box, Cpu, Activity, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const MasterAdminDashboard = () => {
    const [master, setMaster] = useState(null);
    const [zones, setZones] = useState([]);
    const [zoneStats, setZoneStats] = useState({});
    const [globalMode, setGlobalMode] = useState(true);
    const [activeZone, setActiveZone] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('masterUser');
        if (!stored) {
            navigate('/master-admin/login');
            return;
        }
        const m = JSON.parse(stored);
        setMaster(m);
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        const zs = await getZones();
        setZones(zs);

        const statsMap = {};
        for (let z of zs) {
            const st = await getMasterStats(z.zone_id);
            statsMap[z.zone_id] = st;
        }
        setZoneStats(statsMap);
        setLoading(false);
    };

    // Aggregations
    const globalTotal = Object.values(zoneStats).reduce((sum, st) => sum + (st.total || 0), 0);
    const globalPending = Object.values(zoneStats).reduce((sum, st) => sum + (st.pending || 0), 0);
    const globalResolved = Object.values(zoneStats).reduce((sum, st) => sum + (st.resolved || 0), 0);

    const zoneComparisonData = useMemo(() => {
        return zones.map(z => {
            const st = zoneStats[z.zone_id] || {};
            return {
                name: z.zone_name,
                Total: st.total || 0,
                Resolved: st.resolved || 0,
                Pending: st.pending || 0
            };
        });
    }, [zones, zoneStats]);

    const globalDeptData = useMemo(() => {
        const aggs = {};
        Object.values(zoneStats).forEach(st => {
            if (st.workload) {
                Object.entries(st.workload).forEach(([dept, count]) => {
                    aggs[dept] = (aggs[dept] || 0) + count;
                });
            }
        });
        return Object.entries(aggs).map(([name, value]) => ({ name: name || 'Unassigned', value }));
    }, [zoneStats]);

    // Mock trend 
    const trendData = useMemo(() => {
        const base = Math.floor(globalTotal / 30) || 50;
        const data = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            data.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                volume: Math.max(0, base + Math.floor(Math.random() * 30 - 15))
            });
        }
        return data;
    }, [globalTotal]);

    const currentStats = globalMode ? {
        total: globalTotal,
        pending: globalPending,
        resolved: globalResolved,
        workload: globalDeptData.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {})
    } : (zoneStats[activeZone] || { total: 0, pending: 0, resolved: 0, workload: {} });

    if (!master) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin text-emerald-500">
                    <Activity size={48} />
                </div>
            </div>
        );
    }

    return (
        <SidebarLayout role="master" userConfig={{ level: 'Global Registry' }}>
            <div className="max-w-7xl mx-auto space-y-8 font-sans pb-20">

                {/* Global Command Header */}
                <div className="bg-slate-950 rounded-[2rem] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01OS41IDAuNWwtNTkgNTkiIHN0cm9rZT0icmdiYSgxNiwxODUsMTI5LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNMCAwbDYwIDYwIiBzdHJva2U9InJnYmEoMTYsMTg1LDEyOSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-50 z-0"></div>
                    <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col gap-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <Globe size={24} className="text-emerald-400" />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight font-mono text-emerald-50">Global Ops Control</h1>
                            <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded text-[10px] uppercase tracking-widest font-black border border-red-500/20 animate-pulse ml-2">Live Sync</span>
                        </div>
                        <p className="text-slate-400 text-sm font-mono tracking-wider">
                            Administrator: <span className="text-emerald-400 font-bold">{master.admin_username}</span> | SYS_STATUS: OPTIMAL
                        </p>
                    </div>

                    <div className="relative z-10 flex gap-4">
                        <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl flex flex-col items-end shadow-inner min-w-[120px]">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Active Nodes</span>
                            <span className="text-3xl font-black text-slate-200">{zones.length}</span>
                        </div>
                        <div className="bg-emerald-950/40 border border-emerald-800 p-5 rounded-2xl flex flex-col items-end shadow-inner h-full justify-between min-w-[120px]">
                            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Global Load</span>
                            <div className="flex items-center gap-2 mt-auto">
                                <Activity size={24} className="text-emerald-400" />
                                <span className="text-3xl font-black text-emerald-50">STABLE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Node Selector Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 mb-6 flex items-center gap-2">
                            <Navigation size={16} /> Data Vectors
                        </h3>
                        <div className="space-y-3 relative z-10">
                            <button
                                onClick={() => { setGlobalMode(true); setActiveZone(null); }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${globalMode ? 'bg-slate-900 border-slate-700 shadow-lg text-white' : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${globalMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                                        <Globe size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Global Aggregate</h4>
                                        <p className="text-[10px] font-mono uppercase tracking-wider opacity-70">Master View</p>
                                    </div>
                                </div>
                            </button>

                            {zones.map(z => (
                                <button
                                    key={z.zone_id}
                                    onClick={() => { setGlobalMode(false); setActiveZone(z.zone_id); }}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${!globalMode && activeZone === z.zone_id ? 'bg-emerald-50 border-emerald-300 shadow-md shadow-emerald-100' : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${!globalMode && activeZone === z.zone_id ? 'bg-emerald-500 text-white shadow-emerald-500/40' : 'bg-slate-100 text-slate-500'}`}>
                                            <Database size={18} />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${!globalMode && activeZone === z.zone_id ? 'text-emerald-900' : 'text-slate-700'}`}>{z.zone_name}</h4>
                                            <p className={`text-[10px] font-mono uppercase tracking-wider ${!globalMode && activeZone === z.zone_id ? 'text-emerald-600' : 'text-slate-400'}`}>Node-0{z.zone_id}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Node Health Mini Panel */}
                        <div className="bg-slate-900 mt-8 rounded-3xl p-6 border border-slate-800 overflow-hidden relative shadow-lg">
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <Cpu size={140} className="text-emerald-500" />
                            </div>
                            <h4 className="text-white font-bold mb-5 flex items-center gap-2 text-sm uppercase tracking-widest"><Settings2 size={16} className="text-emerald-400" /> System Params</h4>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center text-xs font-mono">
                                    <span className="text-slate-400">ML Engine</span>
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">ONLINE</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-mono border-t border-slate-800 pt-3">
                                    <span className="text-slate-400">Database</span>
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">SYNCED</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-mono border-t border-slate-800 pt-3">
                                    <span className="text-slate-400">Latency Core</span>
                                    <span className="text-slate-200 font-bold">14ms</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Display */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl border border-slate-200">
                                <Activity className="animate-spin text-emerald-500 mb-4" size={48} />
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aggregating Global Vectors...</span>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={globalMode ? 'global' : activeZone}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                        <BarChart3 size={28} className="text-primary" /> {globalMode ? 'Global Analytics Summary' : `Regional Analytics: Node-0${activeZone}`}
                                    </h2>
                                </div>

                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors cursor-default">
                                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-inner">
                                            <Box size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-5xl font-black text-slate-800 mb-1 tracking-tight">{currentStats.total}</h4>
                                            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-1">Aggregated Output</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors cursor-default">
                                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 shadow-inner">
                                            <ShieldAlert size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-5xl font-black text-orange-600 mb-1 tracking-tight">{currentStats.pending}</h4>
                                            <p className="text-orange-900/50 font-black uppercase tracking-widest text-[10px] mt-1">Global Backlog Alert</p>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.1)] flex flex-col justify-between hover:border-emerald-300 transition-colors cursor-default">
                                        <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/40">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-5xl font-black text-emerald-600 mb-1 tracking-tight">{currentStats.resolved}</h4>
                                            <p className="text-emerald-800/60 font-black uppercase tracking-widest text-[10px] mt-1">Net Cleared Cases</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recharts Analytics grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Global Zone Bar Chart (Only in Global Mode) */}
                                    {globalMode && (
                                        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                                            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 tracking-tight"><Globe className="text-indigo-500" size={20} /> Regional Node Performance Comparison</h3>
                                            <div className="h-72">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={zoneComparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                                        <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                        <Bar dataKey="Resolved" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                                                        <Bar dataKey="Pending" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 ${!globalMode && 'lg:col-span-2'}`}>
                                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2"><BarChart3 className="text-secondary" size={20} /> Live Timeline Trend</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={trendData}>
                                                    <defs>
                                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} minTickGap={20} />
                                                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Area type="monotone" dataKey="volume" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col items-center">
                                        <h3 className="font-bold text-slate-800 text-lg mb-4 w-full text-left tracking-tight">Department Bandwidth Share</h3>
                                        <div className="h-56 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={Object.entries(currentStats.workload).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                                                        {Object.keys(currentStats.workload).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
                                            {Object.keys(currentStats.workload).slice(0, 4).map((name, index) => (
                                                <div key={name} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    {name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

            </div>
        </SidebarLayout>
    );
};

export default MasterAdminDashboard;
