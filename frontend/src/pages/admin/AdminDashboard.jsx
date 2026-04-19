import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/SidebarLayout';
import { getMasterStats, getMasterStaff, createStaff, getDepartments } from '../../api';
import { motion } from 'framer-motion';
import { Users, UserPlus, FileText, CheckCircle2, Clock, Activity, LineChart as LineChartIcon, ShieldCheck, BarChart3, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const AdminDashboard = () => {
    const [admin, setAdmin] = useState(null);
    const [stats, setStats] = useState(null);
    const [staff, setStaff] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('L1');
    const [newDeptId, setNewDeptId] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('adminUser');
        if (!stored) {
            navigate('/admin/login');
            return;
        }
        const a = JSON.parse(stored);
        setAdmin(a);
        loadData(a.zone_id);
    }, [navigate]);

    const loadData = async (zone_id) => {
        const [statsData, staffData, depts] = await Promise.all([
            getMasterStats(zone_id),
            getMasterStaff(zone_id),
            getDepartments()
        ]);
        setStats(statsData);
        setStaff(staffData);
        setDepartments(depts);
        if (depts.length > 0) setNewDeptId(depts[0].department_id);
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        const res = await createStaff({
            username: newUsername,
            password: newPassword,
            role: newRole,
            zone_id: admin.zone_id,
            department_id: newRole === 'L2' ? newDeptId : null,
            created_by_admin: admin.id
        });
        if (res.error) {
            alert(res.error);
        } else {
            setNewUsername('');
            setNewPassword('');
            loadData(admin.zone_id);
            alert("Staff account active.");
        }
    };

    const deptChartData = useMemo(() => {
        if (!stats || !stats.workload) return [];
        return Object.entries(stats.workload).map(([name, count]) => ({
            name: name || 'Unassigned',
            cases: count
        }));
    }, [stats]);

    // Mocking trend data since API only gives agg totals for Zone Admin right now
    const trendData = useMemo(() => {
        if (!stats) return [];
        let base = Math.floor(stats.total / 30);
        const data = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            data.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                volume: Math.max(0, base + Math.floor(Math.random() * 20 - 10))
            });
        }
        return data;
    }, [stats]);

    if (!admin || !stats) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin text-orange-500">
                    <Activity size={48} />
                </div>
            </div>
        );
    }

    const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

    return (
        <SidebarLayout role="admin" userConfig={{ level: `Zone ${admin.zone_id} Administrator` }}>
            <div className="max-w-7xl mx-auto space-y-8 pb-20">

                {/* Header Zone Info */}
                <div className="bg-slate-900 border border-slate-700 rounded-[2rem] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                            <Activity size={36} className="text-orange-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-extrabold tracking-tight">Zone Monitoring</h1>
                                <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30 shadow-sm">Live KPI Data</span>
                            </div>
                            <p className="text-slate-400 font-medium mt-1">
                                Supervising Zone {admin.zone_id} Operations • Administrator: {admin.admin_username}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 bg-white/10 border border-white/10 rounded-2xl p-4 flex gap-6 backdrop-blur-md items-center shadow-inner">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolution Rate</p>
                            <h4 className="text-3xl font-black text-emerald-400 flex items-baseline gap-1">{resolutionRate}<span className="text-lg">%</span></h4>
                        </div>
                        <div className="w-12 h-12 rounded-full border-[4px] border-emerald-400 flex items-center justify-center">
                            <Target size={20} className="text-emerald-400" />
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:border-blue-300 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] group-hover:bg-blue-500 group-hover:w-32 group-hover:h-32 transition-all duration-500 -z-0"></div>
                        <FileText size={28} className="text-blue-500 mb-6 group-hover:text-white group-hover:scale-110 transition-transform origin-top-right relative z-10" />
                        <h4 className="text-5xl font-black text-slate-800 mb-2 relative z-10">{stats.total}</h4>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs relative z-10">Total Regional Cases</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:border-orange-300 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[100px] group-hover:bg-orange-500 group-hover:w-32 group-hover:h-32 transition-all duration-500 -z-0"></div>
                        <Clock size={28} className="text-orange-500 mb-6 group-hover:text-white group-hover:scale-110 transition-transform origin-top-right relative z-10" />
                        <h4 className="text-5xl font-black text-slate-800 mb-2 relative z-10">{stats.pending}</h4>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs relative z-10">Awaiting Action</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:border-emerald-300 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] group-hover:bg-emerald-500 group-hover:w-32 group-hover:h-32 transition-all duration-500 -z-0"></div>
                        <CheckCircle2 size={28} className="text-emerald-500 mb-6 group-hover:text-white group-hover:scale-110 transition-transform origin-top-right relative z-10" />
                        <h4 className="text-5xl font-black text-slate-800 mb-2 relative z-10">{stats.resolved}</h4>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs relative z-10">Successfully Resolved</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:border-purple-300 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[100px] group-hover:bg-purple-500 group-hover:w-32 group-hover:h-32 transition-all duration-500 -z-0"></div>
                        <Users size={28} className="text-purple-500 mb-6 group-hover:text-white group-hover:scale-110 transition-transform origin-top-right relative z-10" />
                        <h4 className="text-5xl font-black text-slate-800 mb-2 relative z-10">{staff.length}</h4>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs relative z-10">Active Agents</p>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-primary" /> Department Bottlenecks</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptChartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="cases" radius={[0, 4, 4, 0]} barSize={24}>
                                        {deptChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><LineChartIcon size={18} className="text-secondary" /> Ticket Influx Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="volume" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Staff Control Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Staff */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-[14px] flex items-center justify-center border border-emerald-100 shadow-inner">
                                <UserPlus size={24} />
                            </div>
                            <h3 className="font-bold text-slate-800 text-xl tracking-tight">Provision Agent</h3>
                        </div>

                        <form onSubmit={handleCreateStaff} className="space-y-4 flex-1">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Agent Identifier</label>
                                <input
                                    type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required
                                    placeholder="e.g. jdoe_l1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Access Passcode</label>
                                <input
                                    type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                                    placeholder="Secure temporary code"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow shadow-inner"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Clearance Level</label>
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 text-sm font-bold focus:outline-none focus:border-emerald-500 cursor-pointer transition-shadow hover:shadow-inner">
                                        <option value="L1">L1 Triage</option>
                                        <option value="L2">L2 Specialized</option>
                                    </select>
                                </div>
                                {newRole === 'L2' && (
                                    <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Department Route</label>
                                        <select value={newDeptId} onChange={e => setNewDeptId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 text-sm font-bold focus:outline-none focus:border-emerald-500 cursor-pointer transition-shadow hover:shadow-inner">
                                            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="w-full bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 font-black uppercase tracking-widest py-4 rounded-2xl text-xs transition-all shadow-sm mt-4 flex justify-center items-center gap-2 group">
                                <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" /> Authorize Credentials
                            </button>
                        </form>
                    </div>

                    {/* Active Personnel Roster */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-3 text-xl tracking-tight">
                                <Users className="text-secondary" /> Active Personnel Details
                            </h3>
                            <span className="bg-white border border-slate-200 shadow-sm text-slate-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest">{staff.length} Deployed</span>
                        </div>
                        <div className="p-6 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[440px]">
                            {staff.map(s => (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={s.id} className="flex items-center justify-between border border-slate-100 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-sm font-black border ${s.role === 'L1' ? 'bg-orange-50 text-orange-600 border-orange-100 group-hover:bg-orange-500 group-hover:text-white' : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-500 group-hover:text-white'} transition-colors`}>
                                            {s.role}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 leading-tight text-lg mb-0.5">{s.username}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                ID: Z{s.zone_id}-A{s.id}
                                                {s.role === 'L2' && <span className="bg-slate-100 px-2 py-0.5 rounded-md ml-1 text-slate-500">{s.department_name}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-lg hidden sm:block delay-75 group-hover:bg-emerald-100 transition-colors">System Ready</span>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                                    </div>
                                </motion.div>
                            ))}
                            {staff.length === 0 && (
                                <div className="text-center text-slate-400 font-medium py-16 bg-slate-50 border border-slate-200 border-dashed rounded-3xl m-2 flex flex-col items-center">
                                    <Users size={48} className="text-slate-300 mb-4" />
                                    No agents provisioned yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
};

export default AdminDashboard;
