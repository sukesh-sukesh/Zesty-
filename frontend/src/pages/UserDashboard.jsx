import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictComplaint, getRestaurants, placeOrder, getOrders } from '../api';
import { ShoppingBag, CheckCircle, AlertCircle, XCircle, Search, MessageSquare, ArrowRight, X, Clock } from 'lucide-react';

function UserDashboard() {
    const [activeTab, setActiveTab] = useState('food'); // 'food' or 'orders'
    const [restaurants, setRestaurants] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderingId, setOrderingId] = useState(null); // specific restaurant being ordered from

    // Complaint Modal State
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [complaintText, setComplaintText] = useState('');
    const [complaintResult, setComplaintResult] = useState(null);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/login/user');
            return;
        }
        fetchRestaurants();
        fetchMyOrders();
    }, [user?.id, navigate]);

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

        // Simulating items selection
        const itemsList = restaurant.menu.slice(0, 2);
        const itemsStr = itemsList.map(i => `${i.name} (x1)`).join(', ');
        const total = itemsList.reduce((sum, i) => sum + i.price, 0);

        // Small Artificial Delay for realism
        await new Promise(resolve => setTimeout(resolve, 800));

        const res = await placeOrder({
            user_id: user.id,
            restaurant_name: restaurant.name,
            items: itemsStr,
            total_amount: total
        });

        setOrderingId(null);

        if (res.error) {
            alert(res.error);
        } else {
            // Show success animation/toast here ideally, for now alert is okay but less glitchy than confirm
            // alert('Order placed successfully! 🍔'); 
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
            const data = await predictComplaint(complaintText, user.id, selectedOrder.id);
            if (data.error) {
                setError(data.error);
            } else {
                setComplaintResult(data);
                fetchMyOrders(); // Refresh to show status
            }
        } catch (err) {
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="user-dashboard">
            <header className="flex justify-between items-center mb-2">
                <div>
                    <h2>Hello, {user.username} 👋</h2>
                    <p className="text-muted">What's on your mind today?</p>
                </div>
                <button
                    onClick={() => { sessionStorage.removeItem('user'); navigate('/login/user'); }}
                    className="btn-secondary"
                >
                    Logout
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 mb-2" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', position: 'sticky', top: '70px', background: '#f5f6f8', zIndex: 90 }}>
                <button
                    className={`tab-btn ${activeTab === 'food' ? 'active' : ''}`}
                    onClick={() => setActiveTab('food')}
                    style={{
                        background: activeTab === 'food' ? 'var(--primary)' : 'white',
                        color: activeTab === 'food' ? 'white' : 'var(--text)',
                        padding: '0.75rem 1.5rem', borderRadius: '30px', fontWeight: '600',
                        boxShadow: activeTab === 'food' ? '0 4px 10px rgba(252, 128, 25, 0.3)' : 'none',
                        border: '1px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    🍔 Order Food
                </button>
                <button
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                    style={{
                        background: activeTab === 'orders' ? 'var(--primary)' : 'white',
                        color: activeTab === 'orders' ? 'white' : 'var(--text)',
                        padding: '0.75rem 1.5rem', borderRadius: '30px', fontWeight: '600',
                        boxShadow: activeTab === 'orders' ? '0 4px 10px rgba(252, 128, 25, 0.3)' : 'none',
                        border: '1px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    📦 Your Orders
                </button>
            </div>

            {/* Restaurant Listing */}
            {activeTab === 'food' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', paddingBottom: '2rem' }}>
                    {restaurants.map(rest => (
                        <div key={rest.id} className="restaurant-card" style={{ border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                            <div style={{ position: 'relative' }}>
                                <img src={rest.image} alt={rest.name} className="restaurant-img" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> 30-40 min
                                </div>
                            </div>
                            <div className="restaurant-info" style={{ padding: '1.25rem' }}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="restaurant-name" style={{ fontSize: '1.2rem', fontWeight: '700', color: '#282c3f' }}>{rest.name}</div>
                                    <div className="rating-badge" style={{ background: '#24963f', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>★ {rest.rating}</div>
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', height: '40px', overflow: 'hidden', color: '#686b78' }}>
                                    {rest.menu.map(m => m.name).join(', ')}
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', opacity: orderingId === rest.id ? 0.7 : 1, background: '#fc8019', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onClick={() => handlePlaceOrder(rest)}
                                    disabled={orderingId === rest.id}
                                >
                                    {orderingId === rest.id ? 'Placing Order...' : 'Order Now'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Order History */}
            {activeTab === 'orders' && (
                <div className="orders-list" style={{ paddingBottom: '2rem' }}>
                    {orders.length === 0 ? (
                        <div className="text-center p-2 text-muted" style={{ marginTop: '4rem', textAlign: 'center', color: '#999' }}>
                            <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
                            <p>No orders yet. Go eat something! 🍕</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="order-item" style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', background: 'white', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="order-header" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div className="order-restaurant" style={{ fontSize: '1.2rem', marginBottom: '0.25rem', fontWeight: '600', color: '#282c3f' }}>{order.restaurant_name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.9rem', color: '#686b78' }}>
                                            {order.items} • ₹{order.total_amount}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#93959f' }}>
                                            <Clock size={12} /> {new Date(order.order_date).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="badge" style={{ background: '#f0f0f0', color: '#666', fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                            {order.status || 'Delivered'}
                                        </div>
                                    </div>
                                </div>

                                {/* Complaint Status or Action */}
                                {order.complaint_status ? (
                                    <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '50%', background:
                                                        order.complaint_status === 'Resolved' ? 'green' :
                                                            order.complaint_status === 'Verified' ? 'blue' : 'orange'
                                                }}></div>
                                                <span className="font-bold text-muted" style={{ fontSize: '0.9rem', color: '#535665' }}>Issue Reported</span>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: order.complaint_status === 'Resolved' ? 'green' : order.complaint_status === 'Verified' ? 'blue' : 'orange' }}>
                                                {order.complaint_status}
                                            </span>
                                        </div>

                                        {/* Status Messages */}
                                        {order.complaint_status === 'Pending' && (
                                            <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0.5rem 0', paddingLeft: '1rem', color: '#686b78' }}>
                                                Your issue has been submitted and is under review by our team.
                                            </p>
                                        )}
                                        {order.complaint_status === 'Verified' && (
                                            <p style={{ fontSize: '0.9rem', margin: '0.5rem 0', color: '#1565c0', paddingLeft: '1rem' }}>
                                                The issue is verified. Our team will contact you soon and resolve it.
                                            </p>
                                        )}
                                        {(order.complaint_status === 'Resolved' && (
                                            <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', marginTop: '0.75rem', border: '1px solid #c8e6c9' }}>
                                                <div className="flex items-center gap-2" style={{ color: '#2e7d32', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                                    <CheckCircle size={18} /> Resolution
                                                </div>
                                                <p style={{ margin: 0, fontSize: '1rem', color: '#1b5e20' }}>
                                                    {order.admin_response_text || "Case resolved."}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                        <button
                                            className="btn-secondary"
                                            style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem', borderRadius: '4px', border: '1px solid #d4d5d9', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#3d4152' }}
                                            onClick={() => openComplaintModal(order)}
                                        >
                                            Report an Issue
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Complaint Modal */}
            {showComplaintModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(40, 44, 63, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal" style={{ background: 'white', width: '90%', maxWidth: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                        <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid #f0f0f0' }}>
                            <h3 style={{ margin: 0, color: '#282c3f' }}>Report an Issue</h3>
                            <button onClick={() => setShowComplaintModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#686b78" /></button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {!complaintResult ? (
                                <form onSubmit={handleSubmitComplaint}>
                                    <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #eee' }}>🍔</div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#282c3f' }}>{selectedOrder?.restaurant_name}</div>
                                            <div className="text-muted" style={{ fontSize: '0.85rem', color: '#686b78' }}>Order #{selectedOrder?.id} • {selectedOrder?.items}</div>
                                        </div>
                                    </div>

                                    <label style={{ marginBottom: '0.75rem', display: 'block', fontWeight: '600', color: '#535665' }}>Describe your issue</label>
                                    <textarea
                                        rows="5"
                                        placeholder="Please tell us what went wrong..."
                                        value={complaintText}
                                        onChange={(e) => setComplaintText(e.target.value)}
                                        disabled={loading}
                                        style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', border: '1px solid #d4d5d9', resize: 'none', fontFamily: 'inherit', fontSize: '1rem', color: '#282c3f' }}
                                    ></textarea>

                                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontSize: '1rem', background: '#fc8019', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }} disabled={loading}>
                                        {loading ? 'Submitting...' : 'Submit Complaint'}
                                    </button>
                                    {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
                                </form>
                            ) : (
                                <div className="text-center" style={{ padding: '2rem 0', textAlign: 'center' }}>
                                    <div style={{ marginBottom: '1.5rem', color: '#60b246', display: 'flex', justifyContent: 'center' }}><CheckCircle size={64} /></div>
                                    <h3 style={{ marginBottom: '0.5rem', color: '#282c3f' }}>Complaint Submitted</h3>
                                    <p className="text-muted" style={{ maxWidth: '300px', margin: '0 auto 2rem auto', lineHeight: '1.6', color: '#686b78' }}>
                                        We have categorized your issue as <br />
                                        <span style={{ background: '#fff8e1', padding: '0.25rem 0.75rem', borderRadius: '20px', color: '#fbc02d', fontWeight: 'bold', display: 'inline-block', marginTop: '0.5rem' }}>{complaintResult.category}</span>
                                    </p>
                                    <button className="btn-primary" onClick={() => setShowComplaintModal(false)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: '#fc8019', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Close</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default UserDashboard;
