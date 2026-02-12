
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import AdminRegister from './pages/AdminRegister';
import UserDashboard from './pages/UserDashboard';
import Admin from './pages/Admin';
import './index.css';

function Navbar() {
  const location = useLocation();
  // Don't show navbar on login pages if you want a clean look, or show minimal
  if (['/login/user', '/login/admin', '/register'].includes(location.pathname)) {
    return (
      <nav className="navbar">
        <Link to="/" className="logo">Zasty</Link>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <Link to="/" className="logo">Zasty</Link>
      <div className="nav-links">
        {/* Links conditionally based on auth would be better, but keeping simple */}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login/user" element={<UserLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/admin" element={<AdminRegister />} />

            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/admin/dashboard" element={<Admin />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
