import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictComplaint, getRestaurants, placeOrder, getOrders, getZones } from '../../api';
import SidebarLayout from '../../components/SidebarLayout';
import { ShoppingBag, CheckCircle, Clock, MapPin, Search, ChevronRight, Store, FileText, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function UserDashboard() {
    const [activeTab, setActiveTab] = useState('food');
    const [restaurants, setRestaurants] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderingId, setOrderingId] = useState(null);
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState(1);

    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [complaintText, setComplaintText] = useState('');
    const [complaintResult, setComplaintResult] = useState(null);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/user/login');
            return;
        }
        fetchRestaurants();
        fetchMyOrders();
        fetchZones();
    }, [user?.id, navigate]);

    const fetchZones = async () => {
        const data = await getZones();
        setZones(data);
        if (data.length > 0) setSelectedZone(data[0].zone_id);
    };

    const fetchRestaurants = async () => {
        const data = await getRestaurants();
        setRestaurants(data);
    };

    const fetchMyOrders = async () => {
        if (user) {
            const data = await getOrders(user.id);
            setOrders(data);
        }
    };

    const handlePlaceOrder = async (restaurant) => {
        setOrderingId(restaurant.id);
        const itemsList = restaurant.menu.slice(0, 2);
        const itemsStr = itemsList.map(i => `${i.name} (x1)`).join(', ');
        const total = itemsList.reduce((sum, i) => sum + i.price, 0);

        await new Promise(resolve => setTimeout(resolve, 800));

        const res = await placeOrder({
            user_id: user.id,
            restaurant_name: restaurant.name,
            items: itemsStr,
            total_amount: total
        });

        setOrderingId(null);
        if (res.error) alert(res.error);
        else {
            fetchMyOrders();
            setActiveTab('orders');
        }
    };

    const openComplaintModal = (order) => {
        setSelectedOrder(order);
        setComplaintText('');
        setComplaintResult(null);
        setError('');
        setShowComplaintModal(true);
    };

    const handleSubmitComplaint = async (e) => {
        e.preventDefault();
        if (!complaintText.trim()) return;
        setLoading(true);
        setError('');
        try {
            const data = await predictComplaint(complaintText, user.id, selectedOrder.id, selectedZone);
            if (data.error) setError(data.error);
            else {
                setComplaintResult(data);
                fetchMyOrders();
            }
        } catch (err) {
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <SidebarLayout role="user" userConfig={{ level: '' }}>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user.username}!</h1>
                        <p className="text-slate-500 mt-2 font-medium">Ready for another delicious meal? Don't forget to select your zone.</p>
                    </div>

                    <div className="relative z-10 w-full md:w-auto flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl shadow-inner">
                        <div className="bg-white p-2 rounded-xl shadow-sm text-primary">
                            <MapPin size={20} />
                        </div>
                        <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(Number(e.target.value))}
                            className="bg-transparent border-none outline-none font-bold text-slate-800 pr-8 cursor-pointer appearance-none w-full md:w-auto"
                        >
                            {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-4 text-slate-400">
                            <ChevronRight size={16} className="rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-max relative z-10 mx-auto md:mx-0">
                    <button
                        onClick={() => setActiveTab('food')}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'food' ? 'bg-white text-primary shadow-md shadow-slate-200/50 scale-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95 origin-center'}`}
                    >
                        <Store size={18} /> Catalog
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-primary shadow-md shadow-slate-200/50 scale-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95 origin-center'}`}
                    >
                        <ShoppingBag size={18} /> My Orders
                    </button>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'food' && (
                        <motion.div
                            key="food"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {restaurants.map(rest => (
                                <div key={rest.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col">
                                    <div className="relative h-48 overflow-hidden">
                                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />
                                        <img src={rest.image} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--primary)" ><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                            {rest.rating}
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">{rest.name}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-1">{rest.menu.map(m => m.name).join(', ')}</p>

                                        <button
                                            onClick={() => handlePlaceOrder(rest)}
                                            disabled={orderingId === rest.id}
                                            className={`w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all shadow-sm ${orderingId === rest.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white hover:shadow-primary/30'}`}
                                        >
                                            {orderingId === rest.id ? 'Processing...' : 'Place Order'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {orders.length === 0 ? (
                                <div className="bg-white border text-center border-slate-200 border-dashed rounded-[2rem] p-16 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-4 rotate-12">
                                        <ShoppingBag size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">No recent orders found</h3>
                                    <p className="text-slate-500 mt-2">Check out our catalog to place your first order.</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-primary transition-colors" />

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-slate-900">{order.restaurant_name}</h3>
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded-full tracking-wide">#{order.id}</span>
                                            </div>
                                            <p className="text-slate-600 font-medium mb-1">{order.items}</p>
                                            <p className="text-sm text-slate-400 flex items-center gap-1.5 font-medium">
                                                <Clock size={14} className="text-slate-400" /> {new Date(order.order_date).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-start md:items-end justify-between border-t border-slate-100 pt-4 md:border-t-0 md:pt-0">
                                            <div className="text-2xl font-extrabold text-slate-900 mb-4 md:mb-0">
                                                &#x20b9;{order.total_amount}
                                            </div>

                                            {order.complaint_status ? (
                                                <div className="w-full md:w-auto bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-auto">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${order.complaint_status === 'Resolved' ? 'bg-emerald-500' : order.complaint_status === 'Verified' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-orange-400 animate-pulse'}`} />
                                                        <span className="text-sm font-bold text-slate-700">Issue: {order.complaint_status}</span>
                                                    </div>

                                                    {order.complaint_status === 'Resolved' && (
                                                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-3 rounded-xl mt-2 flex gap-2 w-full max-w-sm">
                                                            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                                                            <span className="font-medium">{order.admin_response_text || "Case resolved."}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => openComplaintModal(order)}
                                                    className="w-full md:w-auto mt-auto px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2"
                                                >
                                                    <AlertTriangle size={16} /> Report Issue
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Complaint Modal */}
                {showComplaintModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg relative border border-slate-200 font-sans"
                        >
                            {!complaintResult ? (
                                <>
                                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <FileText className="text-primary" /> Report an Issue
                                        </h3>
                                        <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-2 border border-slate-200 rounded-full transition-colors">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmitComplaint} className="p-8">
                                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6 flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl shrink-0 border border-slate-100">🛵</div>
                                            <div>
                                                <div className="font-bold text-slate-800">{selectedOrder?.restaurant_name}</div>
                                                <div className="text-xs text-slate-500 font-medium">Order #{selectedOrder?.id}</div>
                                            </div>
                                        </div>

                                        <label className="text-sm font-bold text-slate-700 block mb-2">Description</label>
                                        <textarea
                                            rows="4"
                                            value={complaintText}
                                            onChange={(e) => setComplaintText(e.target.value)}
                                            disabled={loading}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none shadow-inner mb-6 placeholder:text-slate-400 font-medium text-sm"
                                            placeholder="What went wrong with this order?"
                                        ></textarea>

                                        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100 text-center font-bold">{error}</p>}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(252,128,25,0.39)] hover:shadow-[0_6px_20px_rgba(252,128,25,0.23)] transition-all flex justify-center items-center gap-2"
                                        >
                                            {loading ? 'Processing through AI...' : 'Submit Resolution Request'}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-6 relative">
                                        <CheckCircle size={40} />
                                        <div className="absolute inset-0 border-4 border-emerald-50 rounded-full animate-ping opacity-20"></div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Captured</h3>
                                    <p className="text-slate-500 font-medium mb-6">Our system has routed your issue under <br /><span className="inline-block mt-2 bg-slate-100 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full font-bold text-sm">{complaintResult.category}</span></p>
                                    <button onClick={() => setShowComplaintModal(false)} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors shadow-lg">Done</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}

export default UserDashboard;
