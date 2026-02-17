import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:5000';

// 1. Generate a fresh key when the app loads
let currentIdempotencyKey = uuidv4();

// 2. Helper to refresh the key (call this ONLY after a successful submit)
export const refreshIdempotencyKey = () => {
    currentIdempotencyKey = uuidv4();
    console.log("♻️  New Idempotency Key Generated:", currentIdempotencyKey);
};

export const createExpense = async (data) => {
    try {
        // 3. Attach the key to every request automatically
        const response = await axios.post(`${API_URL}/expenses`, {
            ...data,
            idempotency_key: currentIdempotencyKey
        });

        // If successful, we need a NEW key for the *next* expense
        refreshIdempotencyKey();
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        // CRITICAL: If the request fails (network error), we DO NOT refresh the key.
        // This ensures the user can retry safely without double-charging!
        throw error;
    }
};

export const getExpenses = async (category, sort) => {
    const params = {};
    if (category) params.category = category;
    if (sort) params.sort = sort;

    const res = await axios.get(`${API_URL}/expenses`, { params });
    return res.data;
};