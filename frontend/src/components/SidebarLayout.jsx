import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, BarChart, Users, Settings, LogOut, ShieldCheck, Mail, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarLayout = ({ children, role, userConfig = {} }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        switch (role) {
            case 'user':
                sessionStorage.removeItem('user');
                navigate('/user/login');
                break;
            case 'support':
                localStorage.removeItem('supportUser');
                navigate('/support/login');
                break;
            case 'admin':
                localStorage.removeItem('adminUser');
                navigate('/admin/login');
                break;
            case 'master':
                localStorage.removeItem('masterUser');
                navigate('/master-admin/login');
                break;
            default:
                navigate('/');
        }
    };

    const getLinks = () => {
        const commonLinks = [
            { name: 'Analytics', path: '#analytics', icon: BarChart },
            { name: 'Settings', path: '#settings', icon: Settings }
        ];

        if (role === 'user') {
            return [
                { name: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
                { name: 'Orders', path: '/user/orders', icon: Package },
                ...commonLinks
            ];
        } else if (role === 'support') {
            const path = userConfig.level === 'L1' ? '/support/l1-dashboard' : '/support/l2-dashboard';
            return [
                { name: 'Dashboard', path: path, icon: LayoutDashboard },
                { name: 'Complaints', path: '#complaints', icon: List },
                ...commonLinks
            ];
        } else if (role === 'admin') {
            return [
                { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
                { name: 'Complaints', path: '#complaints', icon: List },
                { name: 'Support Staff', path: '#staff', icon: Users },
                ...commonLinks
            ];
        } else if (role === 'master') {
            return [
                { name: 'Dashboard', path: '/master-admin/dashboard', icon: LayoutDashboard },
                { name: 'Global Complaints', path: '#complaints', icon: ShieldCheck },
                { name: 'Network Staff', path: '#staff', icon: Users },
                ...commonLinks
            ];
        }
        return [];
    };

    const links = getLinks();

    return (
        <div className="flex h-screen bg-base-bg text-base-text font-sans">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                className="w-64 bg-secondary border-r border-[#374151] flex flex-col shadow-xl hidden md:flex z-20"
            >
                <div className="h-16 flex items-center px-6 border-b border-[#374151]">
                    <span className="text-2xl font-black bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent tracking-tight">ZestyCare</span>
                </div>

                <div className="p-4 border-b border-[#374151]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Role</p>
                    <p className="text-sm font-bold text-slate-200">{role.toUpperCase()} {userConfig.level || ''}</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/20 text-primary font-bold shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'}`}
                            >
                                <Icon size={18} className={isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-300'} />
                                {link.name}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#374151] mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 font-medium transition-colors duration-200 group"
                    >
                        <LogOut size={18} className="text-slate-400 group-hover:text-red-400" />
                        Logout
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-base-bg relative z-10">
                <header className="h-16 bg-base-card border-b border-base-border flex items-center px-6 md:hidden shadow-sm">
                    <span className="text-xl font-bold text-primary tracking-tight">ZestyCare</span>
                </header>
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default SidebarLayout;
