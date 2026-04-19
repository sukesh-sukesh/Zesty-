import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupportComplaints, supportAction } from '../../api';
import SidebarLayout from '../../components/SidebarLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, AlertTriangle, CheckCircle, Ticket, Wallet, PackageOpen, Undo, ChevronLeft, ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

const L2Dashboard = () => {
    const [user, setUser] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('supportUser');
        if (!stored) {
            navigate('/support/login');
            return;
        }
        const u = JSON.parse(stored);
        if (u.role !== 'L2' && u.role !== 'support') {
            navigate('/support/login');
            return;
        }
        setUser(u);
        loadData(u);
    }, [navigate]);

    const loadData = async (u) => {
        setLoading(true);
        const res = await getSupportComplaints(u.zone_id, u.department_id);
        setComplaints(Array.isArray(res) ? res : []);
        setLoading(false);
    };

    const handleAction = async (id, action) => {
        let admin_response_text = prompt("Enter investigation response message to user:");
        if (admin_response_text === null) return;

        let payload = { complaint_id: id, action, admin_response_text };

        if (action === 'Resolve') {
            const withComp = window.confirm("Add compensation?");
            if (withComp) {
                payload.compensation_type = prompt("Type (Refund, Coupon, Wallet Credit, Free Delivery):", "Coupon");
                payload.compensation_amount = parseFloat(prompt("Amount in \u20B9 (if applicable):", "0"));
                if (payload.compensation_type === 'Coupon' || payload.compensation_type === 'Free Delivery') {
                    payload.coupon_code = prompt("Enter code:", "SUPPORT_" + Math.floor(Math.random() * 10000));
                }
            }
        }

        const res = await supportAction(payload);
        if (!res.error) {
            loadData(user);
        } else {
            alert("Failed action: " + res.error);
        }
    };

    const uniqueCategories = [...new Set(complaints.map(c => c.category))];

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

    const pendingCount = complaints.filter(c => c.status !== 'Resolved').length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

    const compStats = useMemo(() => {
        let refunds = 0, coupons = 0, freeDel = 0, wallets = 0;
        complaints.forEach(c => {
            if (c.compensations) {
                c.compensations.forEach(cmp => {
                    if (cmp.type?.toLowerCase().includes('refund')) refunds++;
                    if (cmp.type?.toLowerCase().includes('coupon')) coupons++;
                    if (cmp.type?.toLowerCase().includes('free')) freeDel++;
                    if (cmp.type?.toLowerCase().includes('wallet')) wallets++;
                });
            }
        });
        return [
            { name: 'Refunds', value: refunds },
            { name: 'Coupons', value: coupons },
            { name: 'Free Delivery', value: freeDel },
            { name: 'Wallet Credit', value: wallets }
        ].filter(v => v.value > 0);
    }, [complaints]);

    const getCompIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('refund')) return <Undo size={14} className="text-red-500" />;
        if (t.includes('coupon')) return <Ticket size={14} className="text-orange-500" />;
        if (t.includes('wallet')) return <Wallet size={14} className="text-emerald-500" />;
        if (t.includes('free')) return <PackageOpen size={14} className="text-blue-500" />;
        return <CheckCircle size={14} className="text-slate-500" />;
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin text-emerald-500">
                    <CheckCircle size={48} />
                </div>
            </div>
        );
    }

    return (
        <SidebarLayout role="support" userConfig={{ level: `L2 ${user.department_name || ''}`, zone: user.zone_id }}>
            <div className="max-w-7xl mx-auto space-y-6 pb-20">

                {/* Header & Stats */}
                <div className="bg-[#1f2937] p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="relative z-10 w-full md:w-2/3">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Specialized Investigation</h1>
                            <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">{user.department_name}</span>
                        </div>
                        <p className="text-slate-300 font-medium text-lg">Analyze escalated evidence and finalize resolutions securely.</p>
                    </div>

                    <div className="relative z-10 w-full md:w-auto flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[120px]">
                            <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest mb-1">Assigned</p>
                            <h4 className="text-3xl font-black text-white">{complaints.length}</h4>
                        </div>
                        <div className="bg-orange-500/20 backdrop-blur-md border border-orange-500/30 p-4 rounded-2xl flex flex-col items-center min-w-[120px]">
                            <p className="text-orange-200 font-bold text-[10px] uppercase tracking-widest mb-1">Pending</p>
                            <h4 className="text-3xl font-black text-white">{pendingCount}</h4>
                        </div>
                    </div>
                </div>

                {/* Analytics Grid */}
                {compStats.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight"><PieChartIcon size={18} className="text-primary" /> Resolution Distribution</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={compStats} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                                            {compStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4 max-w-sm">
                                {compStats.map((stat, i) => (
                                    <div key={stat.name} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                            <span className="font-bold text-slate-700">{stat.name}</span>
                                        </div>
                                        <span className="font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters & Pagination controls */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-500 px-2 font-black uppercase text-xs tracking-widest">
                            <Filter size={16} /> Filters
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Forwarded to Department">Requires Investigation</option>
                            <option value="Under Investigation">Under Investigation</option>
                            <option value="Resolved">Resolved Cases</option>
                        </select>
                        <select
                            value={filterCategory}
                            onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 font-bold text-sm focus:outline-none focus:border-primary transition-colors"
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
                                className="bg-transparent border-none text-sm focus:outline-none w-32 md:w-36 placeholder-slate-400"
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
                    <div className="flex items-center gap-3 pr-2 border-l border-slate-200 pl-4">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
                        <div className="flex gap-1.5">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                {/* List View For Escalations */}
                <div className="space-y-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-40 bg-white border border-slate-200 rounded-3xl animate-pulse"></div>)
                    ) : displayedComplaints.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-4 rotate-6 border border-slate-100 shadow-sm">
                                <AlertTriangle size={36} />
                            </div>
                            <span className="text-lg font-bold text-slate-500">No escalations found for your department.</span>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {displayedComplaints.map((c, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    key={c.id}
                                    className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group relative"
                                >
                                    <div className="absolute top-0 left-0 w-2 h-full bg-slate-200 group-hover:bg-secondary transition-colors" />
                                    <div className="p-8 md:w-[35%] bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col pl-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="font-mono text-xs font-black text-slate-500 tracking-widest bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm">CASE-{c.id}</span>
                                            <div className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                                {c.status}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 mb-1 leading-tight tracking-tight">{c.restaurant_name}</h3>
                                        <p className="text-sm font-bold text-slate-500 mb-6">User: {c.user_name}</p>

                                        <div className="mt-auto">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">AI Category Flag</span>
                                            <span className="inline-block bg-white border border-slate-200 text-slate-700 text-xs tracking-wider font-black px-4 py-2 rounded-xl shadow-sm">{c.category}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col justify-between pl-10">
                                        <div>
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 relative hover:shadow-inner transition-shadow">
                                                <p className="text-slate-700 font-medium leading-relaxed relative z-10 text-lg">"{c.text}"</p>
                                            </div>

                                            {c.compensations && c.compensations.length > 0 && (
                                                <div className="mb-6 flex flex-wrap gap-2">
                                                    {c.compensations.map((cmp, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm">
                                                            {getCompIcon(cmp.type)}
                                                            <span className="uppercase tracking-widest text-[10px] ml-1">{cmp.type}</span>
                                                            {cmp.amount > 0 && <span className="text-emerald-500 font-black ml-1 text-base">₹{cmp.amount}</span>}
                                                            {cmp.coupon_code && <span className="bg-white px-2 py-1 rounded-lg border border-emerald-200 text-emerald-600 font-mono tracking-widest hidden sm:inline-block ml-2 shadow-sm text-xs">{cmp.coupon_code}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {c.status !== 'Resolved' && (
                                            <div className="flex justify-end pt-5 border-t border-slate-100 mt-2">
                                                <button
                                                    onClick={() => handleAction(c.id, 'Resolve')}
                                                    className="bg-[#1f2937] hover:bg-black text-white font-black uppercase tracking-wider px-8 py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3 hover:-translate-y-1 group"
                                                >
                                                    Finalize Resolution <CheckCircle size={20} className="group-hover:scale-110 transition-transform text-primary" />
                                                </button>
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

export default L2Dashboard;
