# Expense Tracker (PERN Stack)

A production-grade expense tracker built with **PostgreSQL, Express, React, and Node.js**.

## Key Features
* **Network Reliability:** Implemented **Idempotency Keys** (UUIDs) to prevent duplicate charges if a user retries a request during a network failure.
* **Data Correctness:** Stored all monetary values as **Integers (cents)** to avoid floating-point math errors.
* **Filtering & Sorting:** Server-side filtering for performance and scalability.

## Tech Stack
* **Frontend:** React (Vite)
* **Backend:** Node.js (Express)
* **Database:** Supabase (PostgreSQL)

## Design Decisions
1.  **Why PostgreSQL?**
    The assignment required "production-like" quality. SQL provides ACID compliance, which is critical for financial data to ensure integrity.
2.  **Why Idempotency Keys?**
    To satisfy the requirement of handling "unreliable networks" and "browser refreshes." The frontend generates a UUID for each form session. If the network fails and the client retries, the backend detects the duplicate key and returns the original result without creating a second record.

## How to Run
1.  **Backend:** `cd backend && npm install && node index.js`

2.  **Frontend:** `cd frontend && npm install && npm run dev`
