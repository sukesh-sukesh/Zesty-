import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getOrders, predictComplaint } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Clock, FileText, CheckCircle, AlertTriangle, MessageSquare, ChevronDown, Check } from 'lucide-react';

const UserOrders = () => {
    const { userLocation } = useOutletContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(sessionStorage.getItem('user'));

    // Complaint Modal State
    const [showComplaintForm, setShowComplaintForm] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [complaintText, setComplaintText] = useState('');
    const [complaintLoading, setComplaintLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchMyOrders();
    }, []);

    const fetchMyOrders = async () => {
        setLoading(true);
        if (user) {
            const data = await getOrders(user.id);
            setOrders(data);
        }
        setLoading(false);
    };

    const handleReportIssue = (order) => {
        setSelectedOrder(order);
        setComplaintText('');
        setError('');
        setSuccessMsg('');
        setShowComplaintForm(true);
    };

    const submitComplaint = async (e) => {
        e.preventDefault();
        if (!complaintText.trim() || !selectedOrder) return;

        setComplaintLoading(true);
        setError('');

        // Mocking to send userLocation as string to predict API which expects zone_id int if mapped,
        // but our predict uses zone_id=1 as default if we send string.
        // We'll send default 1 for now to prevent backend crash since backend expects integer in SQLite.
        try {
            const res = await predictComplaint(complaintText, user.id, selectedOrder.id, 1);
            if (res.error) setError(res.error);
            else {
                setSuccessMsg('Your issue has been recorded by our AI.');
                setTimeout(() => {
                    setShowComplaintForm(false);
                    fetchMyOrders();
                }, 2000);
            }
        } catch (err) {
            setError('System error connecting to AI node.');
        } finally {
            setComplaintLoading(false);
        }
    };

    const getTimelineStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-orange-100 text-orange-600 border-orange-200';
            case 'Verified by L1': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'Forwarded to Department': return 'bg-purple-100 text-purple-600 border-purple-200';
            case 'Resolved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'Rejected': return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 relative">
            <h1 className="text-3xl font-black text-base-text tracking-tight flex items-center gap-3">
                <ShoppingBag className="text-primary" /> My Order History
            </h1>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-base-card h-40 rounded-[2rem] border border-base-border w-full" />)}
                </div>
            ) : orders.length === 0 ? (
                <div className="py-24 text-center rounded-[2rem] bg-base-card border border-base-border border-dashed flex flex-col items-center">
                    <div className="w-24 h-24 bg-base-bg rounded-full flex items-center justify-center text-slate-300 mb-6 rotate-12">
                        <ShoppingBag size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-base-text tracking-tight">No orders yet</h3>
                    <p className="text-base-secondaryText font-medium mt-2">Hungry? Explore restaurants in {userLocation}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={order.id}
                            className="bg-base-card rounded-[2rem] border border-base-border p-6 md:p-8 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-primary transition-colors" />

                            <div className="flex-1 flex flex-col justify-between pl-2">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-black text-base-text leading-none">{order.restaurant_name}</h3>
                                    </div>
                                    <p className="text-base-secondaryText font-medium flex items-center gap-2 mb-4">
                                        <Clock size={14} /> {new Date(order.order_date).toLocaleString()}
                                    </p>
                                    <p className="text-slate-700 font-medium leading-relaxed bg-base-bg p-3 rounded-xl border border-base-border">{order.items}</p>
                                </div>
                                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    <span>ORDER #{order.id}</span>
                                    <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    <span className="text-base-text font-black text-xl">&#x20b9;{order.total_amount}</span>
                                </div>
                            </div>

                            <div className="md:w-64 shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-base-border pt-6 md:pt-0 md:pl-6 text-sm">
                                {order.complaint_status ? (
                                    <div className="h-full flex flex-col font-sans">
                                        <h4 className="font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 text-xs">
                                            Support Ticket Status
                                        </h4>
                                        <div className="relative pl-6 pb-4 border-l-2 border-slate-200 flex-1">
                                            <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[7px] top-1"></div>
                                            <p className="font-bold text-slate-600 mb-1">Issue Reported</p>
                                        </div>
                                        <div className="relative pl-6 pb-2 border-l-2 border-slate-200 flex-1">
                                            <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ${order.complaint_status !== 'Pending' ? 'bg-primary shadow-[0_0_10px_rgba(252,128,25,0.4)]' : 'bg-orange-300 animate-pulse'}`}></div>
                                            <p className={`font-bold ${order.complaint_status !== 'Pending' ? 'text-slate-800' : 'text-orange-500'}`}>
                                                {order.complaint_status === 'Pending' ? 'Investigating...' : 'System Routing'}
                                            </p>
                                        </div>
                                        {order.complaint_status !== 'Pending' && (
                                            <div className="relative pl-6 pt-2">
                                                <div className={`absolute w-4 h-4 rounded-full flex items-center justify-center -left-[9px] top-2 ${order.complaint_status === 'Resolved' ? 'bg-accent text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-blue-500 text-white'}`}>
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                <div className={`p-3 rounded-xl border ${getTimelineStyle(order.complaint_status)}`}>
                                                    <p className="font-black text-xs uppercase tracking-wider mb-1">{order.complaint_status}</p>
                                                    {order.admin_response_text && <p className="font-medium text-xs opacity-90 leading-tight">"{order.admin_response_text}"</p>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col justify-end">
                                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl mb-auto flex items-start gap-2">
                                            <CheckCircle size={16} className="mt-0.5 shrink-0 text-accent" />
                                            <div>
                                                <p className="font-black tracking-wide text-xs uppercase">Delivered Safely</p>
                                                <p className="text-xs font-medium opacity-80 leading-tight mt-0.5">Enjoy your fresh meal from {order.restaurant_name}!</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleReportIssue(order)} className="mt-4 py-3 w-full bg-base-card border border-base-border hover:border-red-200 text-base-secondaryText hover:text-red-500 hover:bg-red-50 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 group">
                                            <AlertTriangle size={14} className="group-hover:scale-110 transition-transform" /> Report Issue
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Complaint Form Modal */}
            <AnimatePresence>
                {showComplaintForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-base-card rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-lg border border-base-border"
                        >
                            {!successMsg ? (
                                <form onSubmit={submitComplaint} className="flex flex-col h-full">
                                    <div className="p-6 md:p-8 bg-base-bg border-b border-base-border flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute -right-6 -top-6 text-slate-200/50 pointer-events-none">
                                            <MessageSquare size={120} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-base-text tracking-tight leading-none mb-1">Help with Order</h3>
                                            <p className="text-base-secondaryText text-sm font-medium">Order #{selectedOrder?.id} • {selectedOrder?.restaurant_name}</p>
                                        </div>
                                        <button type="button" onClick={() => setShowComplaintForm(false)} className="w-10 h-10 bg-base-card border border-base-border rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors z-10 box-content p-0">
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3 px-1">Describe the Issue</label>
                                            <textarea
                                                rows="5"
                                                value={complaintText}
                                                onChange={(e) => setComplaintText(e.target.value)}
                                                disabled={complaintLoading}
                                                className="w-full bg-base-bg border border-base-border rounded-2xl p-4 text-base-text font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none placeholder:text-slate-400 shadow-inner"
                                                placeholder="e.g., The food arrived cold and missing the extra sauce..."
                                                required
                                            ></textarea>
                                        </div>

                                        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100 text-center font-bold tracking-wide">{error}</p>}

                                        <button
                                            type="submit"
                                            disabled={complaintLoading}
                                            className="w-full bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-[0_4px_14px_rgba(252,128,25,0.4)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {complaintLoading ? 'AI Classification in progress...' : 'Submit to AI Engine'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-24 h-24 bg-emerald-100 text-accent rounded-full flex items-center justify-center mb-6 border-[8px] border-emerald-50 shadow-inner">
                                        <CheckCircle size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-base-text mb-2">Issue Submitted</h3>
                                    <p className="text-base-secondaryText font-medium mb-8 text-center px-4 leading-relaxed">
                                        Our AI has recorded your query. A dedicated support agent in your region will assist you momentarily.
                                    </p>
                                    <div className="animate-pulse flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-300" style={{ animationDelay: '200ms' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-300" style={{ animationDelay: '400ms' }}></div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserOrders;
