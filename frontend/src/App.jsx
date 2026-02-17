import { useState, useEffect } from 'react';
import { createExpense, getExpenses } from './api';
import './App.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('created_at_desc');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  useEffect(() => {
    loadExpenses();
  }, [filter, sort]);

  const loadExpenses = async () => {
    try {
      const data = await getExpenses(filter, sort);
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // Convert dollars to cents for the backend (Money Handling Best Practice)
      const amountInCents = Math.round(parseFloat(formData.amount) * 100);

      await createExpense({
        description: formData.description,
        amount_cents: amountInCents,
        category: formData.category,
        date: formData.date
      });

      setStatus('success');
      setFormData({ ...formData, description: '', amount: '' }); // Clear form
      loadExpenses(); // Refresh list immediately

      // Reset success message after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);

    } catch (err) {
      setStatus('error');
    }
  };

  // Calculate Total (Display Logic)
  const total = expenses.reduce((sum, item) => sum + item.amount_cents, 0) / 100;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>💰 Expense Tracker</h1>

      {/* --- FORM --- */}
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Add New Expense</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            placeholder="Description (e.g. Coffee)"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
            style={{ padding: '8px' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number" step="0.01" placeholder="Amount ($)"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              required
              style={{ flex: 1, padding: '8px' }}
            />
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              style={{ flex: 1, padding: '8px' }}
            >
              <option>Food</option>
              <option>Transport</option>
              <option>Utilities</option>
              <option>Entertainment</option>
              <option>Other</option>
            </select>
          </div>
          <input
            type="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            required
            style={{ padding: '8px' }}
          />

          <button type="submit" disabled={status === 'submitting'} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {status === 'submitting' ? 'Saving...' : 'Add Expense'}
          </button>

          {status === 'error' && <p style={{ color: 'red', margin: 0 }}>❌ Network Error! Check console.</p>}
          {status === 'success' && <p style={{ color: 'green', margin: 0 }}>✅ Saved successfully!</p>}
        </form>
      </div>

      {/* --- FILTERS & TOTAL --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <select onChange={e => setFilter(e.target.value)} value={filter} style={{ marginRight: '10px', padding: '5px' }}>
            <option value="">All Categories</option>
            <option>Food</option>
            <option>Transport</option>
            <option>Utilities</option>
            <option>Entertainment</option>
          </select>
          <select onChange={e => setSort(e.target.value)} value={sort} style={{ padding: '5px' }}>
            <option value="created_at_desc">Newest Added</option>
            <option value="date_desc">Date (Newest First)</option>
          </select>
        </div>
        <h2 style={{ margin: 0 }}>Total: ${total.toFixed(2)}</h2>
      </div>

      {/* --- LIST --- */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {expenses.map(expense => (
          <li key={expense.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{expense.description}</strong> <span style={{ color: '#666', fontSize: '0.9em' }}>({expense.category})</span>
              <div style={{ fontSize: '0.8em', color: '#999' }}>{new Date(expense.date).toLocaleDateString()}</div>
            </div>
            <div style={{ fontWeight: 'bold' }}>
              ${(expense.amount_cents / 100).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;