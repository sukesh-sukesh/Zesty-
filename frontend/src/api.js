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

export const getRestaurants = async () => {
    try {
        const response = await fetch(`${API_URL}/restaurants`);
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

export const predictComplaint = async (text, user_id, order_id) => {
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, user_id, order_id }),
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
