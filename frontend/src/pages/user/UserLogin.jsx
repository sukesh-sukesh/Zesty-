import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser } from '../../api';

const UserLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await loginUser(username, password, 'user');
        setLoading(false);
        if (res.error) {
            setError(res.error);
        } else {
            sessionStorage.setItem('user', JSON.stringify(res.user));
            navigate('/user/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-white flex w-full font-sans overflow-hidden">
            {/* Left Side - Hero Presentation (Hidden on mobile, large video on desktop) */}
            <div className="hidden lg:flex flex-1 relative flex-col justify-center items-center bg-[#1f2937]">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="/src/assets/videos/hero-food.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>

                <div className="relative z-10 p-16 max-w-2xl text-left w-full ml-12">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center font-black text-4xl shadow-[0_0_30px_rgba(252,128,25,0.4)] rotate-12">
                            Z
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter">ZestyCare</h1>
                    </div>
                    <h2 className="text-5xl font-black text-white leading-tight mb-6">
                        Discover Authentic<br />
                        <span className="text-primary border-b-4 border-primary pb-1 block mt-2">South Indian Flavors.</span>
                    </h2>
                    <p className="text-xl text-slate-300 font-medium">Order your favorite meals and get instant support for any issues.</p>
                </div>
            </div>

            {/* Right Side - Clean Swiggy Drawer Style Form */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full lg:w-[500px] xl:w-[550px] bg-white h-screen flex flex-col pt-12 lg:pt-24 px-8 lg:px-14 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] relative z-20 overflow-y-auto"
            >
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-1">Login</h2>
                        <p className="text-sm font-medium text-slate-500">
                            or <Link to="/register" className="text-primary font-bold hover:underline">create an account</Link>
                        </p>
                        <div className="w-8 h-1 bg-slate-800 mt-4"></div>
                    </div>
                    <img
                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=60"
                        alt="Food icon"
                        className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg pointer-events-none"
                    />
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="block w-full px-5 py-5 text-base text-slate-900 bg-transparent border border-slate-300 rounded-none appearance-none focus:outline-none focus:ring-0 focus:border-primary peer transition-colors"
                            placeholder=" "
                            required
                        />
                        <label
                            htmlFor="username"
                            className="absolute text-sm text-slate-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 font-medium"
                        >
                            Username or Email
                        </label>
                    </div>

                    <div className="relative">
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="block w-full px-5 py-5 text-base text-slate-900 bg-transparent border border-slate-300 border-t-0 rounded-none appearance-none focus:outline-none focus:ring-0 focus:border-primary peer transition-colors"
                            placeholder=" "
                            required
                        />
                        <label
                            htmlFor="password"
                            className="absolute text-sm text-slate-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 font-medium"
                        >
                            Password
                        </label>
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm font-medium mt-2">
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-black text-sm uppercase tracking-wide py-4 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>

                    <p className="text-[11px] font-medium text-slate-500 mt-4 leading-relaxed">
                        By clicking on Login, I accept the Terms & Conditions & Privacy Policy
                    </p>
                </form>
            </motion.div>
        </div>
    );
};

export default UserLogin;
