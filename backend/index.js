require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;
console.log("Start");
// Middleware
app.use(cors({
    origin: '*', // For testing, allows all origins. 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database Connection
// ... imports

// 1. Force SSL in the connection string logic
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for Supabase to accept the connection
    },
});

// ---------------------------------------------------------
// ROUTE 1: GET /expenses
// Supports: Filtering by category, Sorting by date
// ---------------------------------------------------------
app.get('/expenses', async (req, res) => {
    try {
        const { category, sort } = req.query;

        let queryText = 'SELECT * FROM expenses';
        let queryParams = [];
        let conditions = [];

        // 1. Dynamic Filtering
        if (category) {
            conditions.push(`category = $${queryParams.length + 1}`);
            queryParams.push(category);
        }

        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }

        // 2. Sorting
        if (sort === 'date_desc') {
            queryText += ' ORDER BY date DESC';
        } else {
            // Default sort (optional, but good for stability)
            queryText += ' ORDER BY created_at DESC';
        }

        const result = await pool.query(queryText, queryParams);
        res.json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ---------------------------------------------------------
// ROUTE 2: POST /expenses
// CRITICAL: Handles "Idempotency" for unreliable networks
// ---------------------------------------------------------
app.post('/expenses', async (req, res) => {
    try {
        const { description, amount_cents, category, date, idempotency_key } = req.body;

        // Basic Validation
        if (!description || !amount_cents || !category || !date || !idempotency_key) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Attempt to insert the new expense
        const newExpense = await pool.query(
            `INSERT INTO expenses (description, amount_cents, category, date, idempotency_key) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [description, amount_cents, category, date, idempotency_key]
        );

        res.json(newExpense.rows[0]);

    } catch (err) {
        // 2. Handle Duplicate Requests (Idempotency)
        // Error code '23505' is PostgreSQL for "Unique Violation"
        if (err.code === '23505' && err.constraint.includes('idempotency_key')) {
            console.log("Duplicate request detected. Returning existing record.");

            // Fetch the ALREADY existing record
            const existingExpense = await pool.query(
                'SELECT * FROM expenses WHERE idempotency_key = $1',
                [req.body.idempotency_key]
            );

            // Return it as if it were a success (200 OK)
            return res.json(existingExpense.rows[0]);
        }

        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});