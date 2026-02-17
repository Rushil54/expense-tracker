const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // Make sure you ran: npm install uuid

const API_URL = 'http://localhost:5000/expenses';

// Helper if you don't have the 'uuid' lib installed yet:
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function testIdempotency() {
    // GENERATE A REAL UUID
    const testKey = generateUUID();

    const payload = {
        description: "Test Coffee",
        amount_cents: 450,
        category: "Food",
        date: "2023-10-27",
        idempotency_key: testKey // Now sending a valid UUID!
    };

    console.log(`--- Testing with Key: ${testKey} ---`);

    console.log("\n--- ATTEMPT 1: Sending Request ---");
    try {
        const res1 = await axios.post(API_URL, payload);
        console.log("✅ Success! Created Entry ID:", res1.data.id);
    } catch (e) {
        console.error("❌ Failed:", e.message);
        if (e.response) console.error(e.response.data);
    }

    console.log("\n--- ATTEMPT 2: Sending DUPLICATE Request (Same Key) ---");
    try {
        const res2 = await axios.post(API_URL, payload);
        console.log("✅ Success! Received Entry ID:", res2.data.id);

        if (res1 && res2 && res1.data.id === res2.data.id) {
            console.log("🎉 IDEMPOTENCY PASSED: The API returned the SAME record ID.");
        }
    } catch (e) {
        console.error("❌ FAILED: The API threw an error instead of handling the duplicate.");
        if (e.response) console.error(e.response.data);
    }
}

testIdempotency();