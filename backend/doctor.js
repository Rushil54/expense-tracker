require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkHealth() {
    console.log("-----------------------------------------");
    console.log("🚑 DATABASE CONNECTION DOCTOR");
    console.log("-----------------------------------------");
    console.log("Target URL:", process.env.DATABASE_URL.split('@')[1]); // Hides password

    try {
        // 1. Test Basic Connection
        console.log("Testing connection...");
        const res = await pool.query('SELECT NOW()');
        console.log("✅ Connection Successful! Database Time:", res.rows[0].now);

        // 2. Test Table Existence
        console.log("Checking 'expenses' table...");
        const tableCheck = await pool.query("SELECT * FROM expenses LIMIT 1");
        console.log("✅ Table exists!");

        // 3. Test Columns
        console.log("Checking columns...");
        // This will fail if 'amount_cents' or 'idempotency_key' are missing
        const columnCheck = await pool.query("INSERT INTO expenses (description, amount_cents, category, date, idempotency_key) VALUES ('Test', 100, 'Test', NOW(), $1) RETURNING *", ['test-key-' + Date.now()]);
        console.log("✅ Insert worked! ID:", columnCheck.rows[0].id);

        // Clean up
        await pool.query("DELETE FROM expenses WHERE id = $1", [columnCheck.rows[0].id]);
        console.log("✅ Cleanup successful.");
        console.log("-----------------------------------------");
        console.log("🎉 EVERYTHING LOOKS GOOD.");

    } catch (err) {
        console.log("\n❌ DIAGNOSIS: FAILED");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);

        if (err.message.includes('password')) {
            console.log("💡 TIP: Check your .env password. If it has special chars, URL encode them.");
        }
        if (err.message.includes('relation "expenses" does not exist')) {
            console.log("💡 TIP: You need to run the SQL CREATE TABLE command in Supabase.");
        }
        if (err.message.includes('column')) {
            console.log("💡 TIP: Your table columns don't match the code. Did you use amount instead of amount_cents?");
        }
    } finally {
        pool.end();
    }
}

checkHealth();