import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// User Pages
import UserLogin from './pages/user/UserLogin';
import Register from './pages/Register';
import UserLayout from './pages/user/UserLayout';
import UserHome from './pages/user/UserHome';
import RestaurantMenu from './pages/user/RestaurantMenu';
import UserOrders from './pages/user/UserOrders';

// Support Pages
import SupportLogin from './pages/support/SupportLogin';
import L1Dashboard from './pages/support/L1Dashboard';
import L2Dashboard from './pages/support/L2Dashboard';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// Master Admin Pages
import MasterAdminLogin from './pages/master/MasterAdminLogin';
import MasterAdminDashboard from './pages/master/MasterAdminDashboard';

import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Routes>
          <Route path="/" element={<Navigate to="/user/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user/login" element={<UserLogin />} />

          {/* New Swiggy-Style User Layout & Routing */}
          <Route path="/user" element={<UserLayout />}>
            <Route path="home" element={<UserHome />} />
            <Route path="restaurant/:id" element={<RestaurantMenu />} />
            <Route path="orders" element={<UserOrders />} />
          </Route>

          <Route path="/user/dashboard" element={<Navigate to="/user/home" replace />} />

          <Route path="/support/login" element={<SupportLogin />} />
          <Route path="/support/l1-dashboard" element={<L1Dashboard />} />
          <Route path="/support/l2-dashboard" element={<L2Dashboard />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/master-admin/login" element={<MasterAdminLogin />} />
          <Route path="/master-admin/dashboard" element={<MasterAdminDashboard />} />

          {/* Legacy redirects */}
          <Route path="/login/user" element={<Navigate to="/user/login" replace />} />
          <Route path="/login/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/master/login" element={<Navigate to="/master-admin/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
