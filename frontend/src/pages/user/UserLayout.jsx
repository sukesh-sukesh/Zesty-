import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { MapPin, Search, User, LogOut, ShoppingBag } from 'lucide-react';

const UserLayout = () => {
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState('Coimbatore');
    const user = JSON.parse(sessionStorage.getItem('user'));
    const location = useLocation();

    useEffect(() => {
        if (!user) {
            navigate('/user/login');
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        const data = await res.json();
                        let city = data.address.city || data.address.state_district || data.address.county || 'Coimbatore';
                        const allowed = ['Coimbatore', 'Chennai', 'Bangalore', 'Hyderabad', 'Kochi'];
                        const match = allowed.find(a => city.toLowerCase().includes(a.toLowerCase()));
                        setUserLocation(match || 'Coimbatore');
                    } catch (e) {
                        setUserLocation('Coimbatore');
                    }
                },
                () => {
                    setUserLocation('Coimbatore');
                }
            );
        } else {
            setUserLocation('Coimbatore');
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-base-bg font-sans pb-16">
            <header className="fixed top-0 inset-x-0 bg-base-card border-b border-base-border z-50 shadow-[0_2px_15px_rgba(0,0,0,0.04)] h-20 flex items-center">
                <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/user/home" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
                            <div className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                                Z
                            </div>
                            <span className="text-2xl font-black tracking-tight text-base-text">ZestyCare</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors cursor-pointer group">
                            <MapPin size={18} className="text-primary group-hover:-translate-y-0.5 transition-transform" />
                            <div>
                                <p className="text-[10px] font-bold text-base-secondaryText uppercase tracking-widest leading-none">Delivering to</p>
                                <p className="font-bold text-base-text leading-tight border-b-2 border-base-text">{userLocation}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex items-center gap-2 md:gap-4 lg:gap-6">
                        <Link to="/user/home" className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all ${location.pathname.includes('/user/home') || location.pathname.includes('/user/restaurant') ? 'text-primary bg-primary/10' : 'text-base-secondaryText hover:text-primary hover:bg-primary/5'}`}>
                            <Search size={18} /> Search
                        </Link>
                        <Link to="/user/orders" className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all ${location.pathname.includes('/user/orders') ? 'text-primary bg-primary/10' : 'text-base-secondaryText hover:text-primary hover:bg-primary/5'}`}>
                            <ShoppingBag size={18} /> Orders
                        </Link>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 text-base-secondaryText font-bold hover:text-primary hover:bg-primary/5 rounded-2xl cursor-pointer transition-all">
                            <User size={18} /> {user.username}
                        </div>
                        <button onClick={() => { sessionStorage.removeItem('user'); navigate('/user/login'); }} className="w-10 h-10 flex items-center justify-center rounded-xl text-base-secondaryText hover:text-red-500 hover:bg-red-50 transition-colors ml-2">
                            <LogOut size={18} />
                        </button>
                    </nav>
                </div>
            </header>

            <main className="pt-28 max-w-7xl mx-auto px-4 md:px-6">
                <Outlet context={{ userLocation, setUserLocation }} />
            </main>
        </div>
    );
};

export default UserLayout;
