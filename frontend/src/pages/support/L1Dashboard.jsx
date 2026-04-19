import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupportComplaints, supportAction, getDepartments } from '../../api';
import SidebarLayout from '../../components/SidebarLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, XCircle, Send, CheckCircle2, Filter, AlertCircle, Clock, CheckSquare, ChevronLeft, ChevronRight, BarChart3, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const L1Dashboard = () => {
    const [user, setUser] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('supportUser');
        if (!stored) {
            navigate('/support/login');
            return;
        }
        const u = JSON.parse(stored);
        if (u.role !== 'L1' && u.role !== 'support') {
            navigate('/support/login');
            return;
        }
        setUser(u);
        loadData(u);
        fetchDepartments();
    }, [navigate]);

    const fetchDepartments = async () => {
        const res = await getDepartments();
        setDepartments(res);
    };

    const loadData = async (u) => {
        setLoading(true);
        const res = await getSupportComplaints(u.zone_id, '');
        setComplaints(Array.isArray(res) ? res : []);
        setLoading(false);
    };

    const handleAction = async (id, action, deptId = null) => {
        let admin_response_text = prompt("Enter optional response message to user:");
        if (admin_response_text === null) return;

        let payload = { complaint_id: id, action, admin_response_text };
        if (action === 'Forward') {
            payload.department_id = deptId;
        }

        const res = await supportAction(payload);
        if (!res.error) {
            loadData(user);
        } else {
            alert("Failed action: " + res.error);
        }
    };

    const filteredComplaints = complaints.filter(c => {
        if (filterStatus !== 'All' && c.status !== filterStatus) return false;
        if (filterCategory !== 'All' && c.category !== filterCategory) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const textMatch = c.text && c.text.toLowerCase().includes(query);
            const userMatch = c.user_name && c.user_name.toLowerCase().includes(query);
            const catMatch = c.category && c.category.toLowerCase().includes(query);
            if (!textMatch && !userMatch && !catMatch) return false;
        }

        if (dateRange.start) {
            const cDate = new Date(c.timestamp.split(' ')[0]);
            const sDate = new Date(dateRange.start);
            if (cDate < sDate) return false;
        }

        if (dateRange.end) {
            const cDate = new Date(c.timestamp.split(' ')[0]);
            const eDate = new Date(dateRange.end);
            if (cDate > eDate) return false;
        }

        return true;
    });

    const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
    const displayedComplaints = filteredComplaints.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const pendingCount = complaints.filter(c => c.status === 'Pending').length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
    const verifiedCount = complaints.filter(c => c.status === 'Verified by L1').length;
    const fwdCount = complaints.filter(c => c.status === 'Forwarded to Department').length;
    const uniqueCategories = [...new Set(complaints.map(c => c.category))];

    // Analytics Generation
    const categoryData = useMemo(() => {
        const counts = {};
        complaints.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [complaints]);

    const dailyData = useMemo(() => {
        const map = {};
        complaints.forEach(c => {
            const date = c.timestamp.split(' ')[0];
            map[date] = (map[date] || 0) + 1;
        });
        const sortedKeys = Object.keys(map).sort();
        return sortedKeys.map(date => ({ date, active: map[date] })).slice(-15); // last 15 days
    }, [complaints]);

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin text-emerald-500">
                    <CheckCircle2 size={48} />
                </div>
            </div>
        );
    }

    return (
        <SidebarLayout role="support" userConfig={{ level: 'L1', zone: user.zone_id }}>
            <div className="max-w-7xl mx-auto space-y-6 pb-20">

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">L1 Regional Hub</h1>
                        <p className="text-slate-500 font-medium">Monitoring {complaints.length} production tickets.</p>
                    </div>
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                        <BarChart3 size={18} /> Analytics Live
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">Total Assigned</p>
                        <h4 className="text-3xl font-black text-slate-800">{complaints.length}</h4>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-orange-400">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1"><AlertCircle size={14} className="text-orange-500" /> Pending</p>
                        <h4 className="text-3xl font-black text-slate-800">{pendingCount}</h4>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-emerald-400">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1"><CheckSquare size={14} className="text-emerald-500" /> Resolved</p>
                        <h4 className="text-3xl font-black text-slate-800">{resolvedCount}</h4>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-purple-400">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1"><Send size={14} className="text-purple-500" /> Forwarded L2</p>
                        <h4 className="text-3xl font-black text-slate-800">{fwdCount}</h4>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-blue-400">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1"><Clock size={14} className="text-blue-500" /> Avg Resp Time</p>
                        <h4 className="text-3xl font-black text-slate-800">12<span className="text-sm font-bold text-slate-400 ml-1">mins</span></h4>
                    </div>
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-primary" /> Daily Complaint Volume</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="active" stroke="#FC8019" strokeWidth={3} dot={{ r: 4, fill: '#FC8019', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                        <h3 className="font-bold text-slate-800 mb-2 w-full text-left">Category Distribution</h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {categoryData.slice(0, 4).map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-500 px-2 font-black uppercase tracking-widest text-xs">
                            <Filter size={16} /> Filters
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 font-medium text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Verified by L1">Verified by L1</option>
                            <option value="Forwarded to Department">Forwarded</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <select
                            value={filterCategory}
                            onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 font-medium text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="All">All Categories</option>
                            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                            <Search size={16} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="bg-transparent border-none text-sm focus:outline-none w-32 md:w-48 placeholder-slate-400"
                            />
                        </div>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={e => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 font-medium text-sm focus:outline-none focus:border-primary"
                        />
                        <span className="text-slate-400 text-sm font-bold">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={e => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 font-medium text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <span className="text-sm font-bold text-slate-500">Page {currentPage} of {totalPages || 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"><ChevronLeft size={16} /></button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>)
                    ) : displayedComplaints.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-slate-500 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
                            <CheckSquare size={48} className="mx-auto text-slate-300 mb-4" />
                            No complaints in this queue!
                        </div>
                    ) : (
                        <AnimatePresence>
                            {displayedComplaints.map(c => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={c.id}
                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:border-slate-300 transition-all group relative"
                                >
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-primary transition-colors" />
                                    <div className="p-5 border-b border-slate-100 flex flex-col bg-slate-50/50 pl-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-black text-slate-400 tracking-wider">#{c.id}</span>
                                                <span className="bg-slate-200 text-slate-700 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md">{c.category}</span>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-black border ${c.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-200' : c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {c.status}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{c.restaurant_name}</h3>
                                        <div className="flex justify-between items-end mt-2">
                                            <p className="text-xs text-slate-500 font-medium">User: {c.user_name}</p>
                                            <p className="text-xs text-slate-400 font-bold">{c.timestamp.split(' ')[0]}</p>
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col pl-6">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 h-28 overflow-y-auto">
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed">"{c.text}"</p>
                                        </div>

                                        {c.status === 'Pending' && (
                                            <div className="space-y-3 mt-auto">
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleAction(c.id, 'Verify')} className="flex-1 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-200 font-black tracking-wide py-2.5 rounded-xl text-xs uppercase transition-colors flex justify-center items-center gap-1.5">
                                                        <ShieldCheck size={16} /> Verify
                                                    </button>
                                                    <button onClick={() => handleAction(c.id, 'Reject')} className="flex-1 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 font-black tracking-wide py-2.5 rounded-xl text-xs uppercase transition-colors flex justify-center items-center gap-1.5">
                                                        <XCircle size={16} /> Reject
                                                    </button>
                                                </div>
                                                <button onClick={() => handleAction(c.id, 'Resolve')} className="w-full bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 font-black tracking-wide py-2.5 rounded-xl text-xs uppercase transition-colors flex justify-center items-center gap-1.5 shadow-sm">
                                                    <CheckCircle2 size={16} /> Resolve Simple
                                                </button>
                                                <div className="flex gap-2 pt-3 border-t border-slate-100">
                                                    <select id={`fwd-${c.id}`} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-3 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-shadow">
                                                        {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                                                    </select>
                                                    <button onClick={() => handleAction(c.id, 'Forward', document.getElementById(`fwd-${c.id}`).value)} className="bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white font-black uppercase tracking-wider px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center shadow-sm">
                                                        Forward <Send size={14} className="ml-1.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
};

export default L1Dashboard;
