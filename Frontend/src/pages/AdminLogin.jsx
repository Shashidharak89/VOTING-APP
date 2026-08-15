import React, { useState } from 'react';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE = rawApiBase.replace(/\/$/, "");

export default function AdminLogin({ onAdminLogin }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!password) return setMessage('Password required');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password.trim()}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Authenticated. Redirecting...');
        localStorage.setItem('adminPassword', password.trim());
        localStorage.setItem('adminAuthed', 'true');
        onAdminLogin(password.trim());
      } else {
        setMessage(data.message || 'Invalid admin password');
      }
    } catch (err) {
      console.error('[AdminLogin] Verification error:', err);
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        setMessage('Unable to connect to backend server. Please verify backend is running.');
      } else {
        setMessage('Server error connecting to backend');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm border border-primary-100">
        <div className="flex justify-center mb-4">
          <img src="/samca_logo.jpeg" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-primary-200" alt="SAMCA Logo" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Admin Login</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter admin password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Login'
            )}
          </button>
        </form>
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${
            message.startsWith('Authenticated') ? 'bg-accent-50 text-accent-700 border border-accent-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
