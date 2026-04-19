const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
const API_URL = `${BASE_URL.replace(/\/$/, '')}/api`;

// --- Auth ---

export const loginUser = async (username, password, role) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role }),
        });
        return response.json();
    } catch (error) {
        return { error: "Login failed" };
    }
};

export const registerUser = async (username, password, role = 'user') => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role }),
        });
        return response.json();
    } catch (error) {
        return { error: "Registration failed" };
    }
};

// --- Restaurants & Orders ---

export const getRestaurants = async (zone = '') => {
    try {
        const query = zone ? `?zone=${encodeURIComponent(zone)}` : '';
        const response = await fetch(`${API_URL}/restaurants${query}`);
        return response.json();
    } catch (error) {
        return [];
    }
};

export const placeOrder = async (orderData) => {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
        });
        return response.json();
    } catch (error) {
        return { error: "Failed to place order" };
    }
};

export const getOrders = async (user_id) => {
    try {
        const response = await fetch(`${API_URL}/orders?user_id=${user_id}`);
        return response.json();
    } catch (error) {
        return [];
    }
};

// --- Complaints ---

export const predictComplaint = async (text, user_id, order_id, zone_id = 1) => {
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, user_id, order_id, zone_id }),
        });
        return response.json();
    } catch (error) {
        return { error: "Failed to connect to server" };
    }
};

export const getComplaints = async (filters = {}) => {
    // filters can include: user_id, role, category, date, status
    // Remove null or undefined or 'All' values
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'All' && filters[key] !== 'null') {
            cleanFilters[key] = filters[key];
        }
    });

    const params = new URLSearchParams(cleanFilters);
    try {
        const response = await fetch(`${API_URL}/complaints?${params}`);
        return response.json();
    } catch (error) {
        return [];
    }
};

export const updateComplaintStatus = async (id, status, admin_response_text = null) => {
    try {
        const body = { status };
        if (admin_response_text) body.admin_response_text = admin_response_text;

        const response = await fetch(`${API_URL}/complaints/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return response.json();
    } catch (error) {
        return { error: "Failed to update status" };
    }
};

export const getStats = async () => {
    try {
        const response = await fetch(`${API_URL}/stats`);
        return response.json();
    } catch (error) {
        return {};
    }
};

// --- SYSTEM ---
export const getZones = async () => {
    try {
        const res = await fetch(`${API_URL}/zones`);
        return res.json();
    } catch (e) {
        return [];
    }
};

export const getDepartments = async () => {
    try {
        const res = await fetch(`${API_URL}/departments`);
        return res.json();
    } catch (e) {
        return [];
    }
};

// --- LOGIN EXSTRAS ---
export const supportLogin = async (username, password) => {
    try {
        const res = await fetch(`${API_URL}/support/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        return res.json();
    } catch (e) {
        return { error: 'Login failed' };
    }
};

export const masterLogin = async (username, password) => {
    try {
        const res = await fetch(`${API_URL}/master/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        return res.json();
    } catch (e) {
        return { error: 'Login failed' };
    }
};

// --- SUPPORT ACTIONS ---
export const getSupportComplaints = async (zone_id, department_id = '') => {
    try {
        let url = `${API_URL}/support/complaints?zone_id=${zone_id}`;
        if (department_id) url += `&department_id=${department_id}`;
        const res = await fetch(url);
        return res.json();
    } catch (e) {
        return [];
    }
};

export const supportAction = async (data) => {
    try {
        const res = await fetch(`${API_URL}/support/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return res.json();
    } catch (e) {
        return { error: 'Action failed' };
    }
};

// --- MASTER ADMIN ACTIONS ---
export const getMasterStats = async (zone_id) => {
    try {
        const res = await fetch(`${API_URL}/master/stats?zone_id=${zone_id}`);
        return res.json();
    } catch (e) {
        return {};
    }
};

export const getMasterStaff = async (zone_id) => {
    try {
        const res = await fetch(`${API_URL}/master/staff?zone_id=${zone_id}`);
        return res.json();
    } catch (e) {
        return [];
    }
};

export const createStaff = async (data) => {
    try {
        const res = await fetch(`${API_URL}/master/staff`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return res.json();
    } catch (e) {
        return { error: 'Creation failed' };
    }
};
