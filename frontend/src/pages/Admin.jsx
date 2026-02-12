import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComplaints, getStats, updateComplaintStatus } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader, Filter, PlayCircle, CheckCircle, Clock, XCircle, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react';

function Admin() {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterDate, setFilterDate] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const navigate = useNavigate();

    // Resolution State
    const [resolvingId, setResolvingId] = useState(null);
    const [resolutionText, setResolutionText] = useState('');
    const [selectedOption, setSelectedOption] = useState('');

    // Grouping State
    const [groupedComplaints, setGroupedComplaints] = useState({});

    // Check admin auth
    const admin = JSON.parse(sessionStorage.getItem('admin'));

    useEffect(() => {
        if (!admin) {
            navigate('/login/admin');
            return;
        }
        fetchData();
    }, [filterCategory, filterDate, filterStatus]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [complaintsData, statsData] = await Promise.all([
                getComplaints({
                    role: 'admin',
                    category: filterCategory === 'All' ? null : filterCategory,
                    date: filterDate === 'All' ? null : filterDate,
                    status: filterStatus === 'All' ? null : filterStatus
                }),
                getStats()
            ]);
            setComplaints(complaintsData);

            // Group by Date for better visualization
            const groups = {};
            complaintsData.forEach(c => {
                const dateKey = new Date(c.timestamp).toLocaleDateString();
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(c);
            });
            setGroupedComplaints(groups);

            setStats(statsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        // If resolving, show resolution box instead of immediate update
        if (newStatus === 'Resolved') {
            setResolvingId(id);
            // Default message
            setResolutionText('We have reviewed your complaint and resolved the issue.');
            setSelectedOption('');
            return;
        }

        await updateComplaintStatus(id, newStatus);
        fetchData();
    };

    const submitResolution = async (id) => {
        const finalMessage = resolutionText || "We have reviewed your complaint and resolved the issue.";
        await updateComplaintStatus(id, 'Resolved', finalMessage);
        setResolvingId(null);
        fetchData();
    };

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        setResolutionText(option);
    };

    const chartData = Object.keys(stats).map(key => ({
        name: key.split(' ')[0],
        full_name: key,
        count: stats[key]
    }));

    if (!admin) return null;

    return (
        <div className="admin-page" style={{ background: '#f1f2f5', minHeight: '100vh', padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'white', padding: '1rem 2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#ff7043', color: 'white', padding: '0.5rem', borderRadius: '8px', fontWeight: 'bold' }}>ADMIN</div>
                    <h2 style={{ margin: 0, color: '#333' }}>Complaint Management</h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: '#666' }}>Logged in as: <b>{admin.username}</b></span>
                    <button onClick={() => { sessionStorage.removeItem('admin'); navigate('/login/admin'); }} style={{ background: '#f5f5f5', color: '#333', padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', borderLeft: '5px solid #ff7043', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>TOTAL COMPLAINTS</div>
                    <div className="stat-num" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{complaints.length}</div>
                </div>
                {Object.entries(stats).map(([category, count]) => (
                    <div className="stat-card" key={category} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{category}</div>
                        <div className="stat-num" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{count}</div>
                    </div>
                ))}
            </div>

            <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Filters & Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333' }}><Filter size={18} /> Filters</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Category</label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    <option value="All">All Categories</option>
                                    <option value="Delivery Issue">Delivery Issue</option>
                                    <option value="Food Quality Issue">Food Quality Issue</option>
                                    <option value="Wrong / Missing Item">Wrong / Missing Item</option>
                                    <option value="Payment / Refund Issue">Payment / Refund Issue</option>
                                    <option value="App / Technical Issue">App / Technical Issue</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Not Responded">Not Responded</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Date</label>
                                <select
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    <option value="All">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Trends</h3>
                        <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} hide />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="count" fill="#ff7043" radius={[4, 4, 4, 4]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Complaints List */}
                <div className="complaints-container">
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '12px' }}><Loader className="animate-spin" size={32} color="#ff7043" /> <p>Loading complaints...</p></div>
                    ) : (
                        Object.keys(groupedComplaints).length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#999' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                <p>No complaints found for current filters.</p>
                            </div>
                        ) : (
                            Object.keys(groupedComplaints).map(date => (
                                <div key={date} style={{ marginBottom: '2rem' }}>
                                    <div style={{ padding: '0.5rem 1rem', background: '#e0e0e0', color: '#555', borderRadius: '20px', display: 'inline-block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                        {date === new Date().toLocaleDateString() ? 'Today' : date}
                                        <span style={{ marginLeft: '0.5rem', background: '#ccc', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>{groupedComplaints[date].length}</span>
                                    </div>

                                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead style={{ background: '#fcfcfc', borderBottom: '1px solid #eee' }}>
                                                <tr>
                                                    <th style={{ padding: '1rem', color: '#999', fontSize: '0.8rem', fontWeight: '600' }}>ID</th>
                                                    <th style={{ padding: '1rem', color: '#999', fontSize: '0.8rem', fontWeight: '600' }}>CUSTOMER & ORDER</th>
                                                    <th style={{ padding: '1rem', color: '#999', fontSize: '0.8rem', fontWeight: '600' }}>COMPLAINT</th>
                                                    <th style={{ padding: '1rem', color: '#999', fontSize: '0.8rem', fontWeight: '600' }}>CATEGORY</th>
                                                    <th style={{ padding: '1rem', color: '#999', fontSize: '0.8rem', fontWeight: '600' }}>STATUS</th>
                                                    <th style={{ padding: '1rem', color: '#999', fontSize: '0.8rem', fontWeight: '600' }}>ACTION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedComplaints[date].map(complaint => (
                                                    <React.Fragment key={complaint.id}>
                                                        <tr style={{ borderBottom: '1px solid #f5f5f5', background: resolvingId === complaint.id ? '#fff8e1' : 'white' }}>
                                                            <td style={{ padding: '1rem', fontWeight: 'bold', color: '#666' }}>#{complaint.id}</td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <div style={{ fontWeight: 'bold', color: '#333' }}>{complaint.user_name || 'Anonymous'}</div>
                                                                {complaint.restaurant_name && (
                                                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                                                                        {complaint.restaurant_name} • ₹{complaint.total_amount}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                                                <div style={{ color: '#333', lineHeight: '1.4' }}>{complaint.text}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Clock size={12} /> {new Date(complaint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <span className={`category-badge cat-${complaint.category.split(' ')[0]}`} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: '#f0f0f0', color: '#555' }}>{complaint.category}</span>
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <span style={{
                                                                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                                                                    background: complaint.status === 'Resolved' ? '#e8f5e9' : complaint.status === 'Verified' ? '#e3f2fd' : '#fff3e0',
                                                                    color: complaint.status === 'Resolved' ? '#2e7d32' : complaint.status === 'Verified' ? '#1565c0' : '#e65100'
                                                                }}>
                                                                    {complaint.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                {complaint.status !== 'Resolved' && resolvingId !== complaint.id && (
                                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                        <button
                                                                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', color: '#666' }}
                                                                            title="Verify"
                                                                            onClick={() => handleStatusUpdate(complaint.id, 'Verified')}
                                                                        >
                                                                            <CheckCircle size={16} />
                                                                        </button>
                                                                        <button
                                                                            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#333', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                                                                            onClick={() => handleStatusUpdate(complaint.id, 'Resolved')}
                                                                        >
                                                                            Resolve
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {complaint.status === 'Resolved' && (
                                                                    <div style={{ color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}><CheckCircle size={16} /> Done</div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Resolution Modal */}
            {resolvingId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="resolution-box" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', width: '90%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>Resolve Complaint #{resolvingId}</h3>
                            <button onClick={() => setResolvingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#666" /></button>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Select a preset action or customize the message:</p>
                        <div className="resolution-options" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {['50% Refund', 'Full Refund', '₹100 Coupon', 'Free Reorder'].map(opt => (
                                <div
                                    key={opt}
                                    className={`chip ${selectedOption === opt ? 'selected' : ''}`}
                                    style={{
                                        padding: '0.5rem 1rem', borderRadius: '20px', border: selectedOption === opt ? '1px solid #ff7043' : '1px solid #eee',
                                        background: selectedOption === opt ? '#fff3e0' : 'white', color: selectedOption === opt ? '#e64a19' : '#666',
                                        cursor: 'pointer', fontSize: '0.85rem'
                                    }}
                                    onClick={() => handleOptionSelect(opt)}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>

                        <textarea
                            placeholder="Type resolution message here..."
                            value={resolutionText}
                            onChange={(e) => {
                                setResolutionText(e.target.value);
                                if (!['50% Refund', 'Full Refund', '₹100 Coupon', 'Free Reorder'].includes(e.target.value)) {
                                    setSelectedOption('');
                                }
                            }}
                            rows="4"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd', fontFamily: 'inherit', marginBottom: '1.5rem', resize: 'vertical' }}
                        ></textarea>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', background: '#ccc', color: '#333', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setResolvingId(null)}>Cancel</button>
                            <button style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', background: '#ff7043', color: 'white', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => submitResolution(resolvingId)}>Confirm Resolution</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
