
const API_URL = "http://localhost:5000/api";

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

// --- Complaints ---

export const predictComplaint = async (text, user_id) => {
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, user_id }),
        });
        return response.json();
    } catch (error) {
        return { error: "Failed to connect to server" };
    }
};

export const getComplaints = async (filters = {}) => {
    // filters can include: user_id, role, category, date
    const params = new URLSearchParams(filters);
    try {
        const response = await fetch(`${API_URL}/complaints?${params}`);
        return response.json();
    } catch (error) {
        return [];
    }
};

export const updateComplaintStatus = async (id, status) => {
    try {
        const response = await fetch(`${API_URL}/complaints/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
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
