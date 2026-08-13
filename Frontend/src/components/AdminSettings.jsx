import React, { useState, useEffect } from 'react';
import { adminFetch } from '../utils/adminApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const ADMIN_API = `${API_BASE}/admin`;

export default function AdminSettings() {
  const [message, setMessage] = useState('');
  const [votingWindow, setVotingWindow] = useState({ start: '', end: '' });
  const [savingWindow, setSavingWindow] = useState(false);
  const [registrationDueDate, setRegistrationDueDate] = useState('');
  const [savingDueDate, setSavingDueDate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const fetchVotingWindow = async () => {
    try {
      const res = await adminFetch(`${ADMIN_API}/get-voting-window`);
      if (res.ok) {
        const data = await res.json();
        setVotingWindow({ 
          start: data.start ? data.start.slice(0,16) : '', 
          end: data.end ? data.end.slice(0,16) : '' 
        });
        setVotingEnabled(!!data.votingEnabled);
      }
    } catch (error) {
      setMessage('Error loading voting window');
    }
  };
  const handleToggleVoting = async () => {
    setSavingToggle(true);
    setMessage('');
    try {
      const res = await adminFetch(`${ADMIN_API}/set-voting-enabled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !votingEnabled })
      });
      const data = await res.json();
      if (res.ok) {
        setVotingEnabled(data.votingEnabled);
        setMessage('Voting status updated');
      } else {
        setMessage(data.message || 'Error updating voting status');
      }
    } catch (error) {
      setMessage('Network error updating voting status');
    } finally {
      setSavingToggle(false);
    }
  };

  const fetchRegistrationDueDate = async () => {
    try {
      const res = await adminFetch(`${ADMIN_API}/get-due-date`);
      if (res.ok) {
        const data = await res.json();
        setRegistrationDueDate(data.dueDate ? data.dueDate.slice(0,16) : '');
      }
    } catch (error) {
      setMessage('Error loading due date');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVotingWindow(), fetchRegistrationDueDate()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSaveDueDate = async (e) => {
    e.preventDefault();
    setSavingDueDate(true);
    setMessage('');
    
    try {
      const res = await adminFetch(`${ADMIN_API}/set-due-date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: registrationDueDate })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration due date updated successfully');
      } else {
        setMessage(data.message || 'Error saving due date');
      }
    } catch (error) {
      setMessage('Network error saving due date');
    } finally {
      setSavingDueDate(false);
    }
  };

  const handleSaveVotingWindow = async (e) => {
    e.preventDefault();
    setSavingWindow(true);
    setMessage('');
    
    try {
      const body = { 
        start: votingWindow.start, 
        end: votingWindow.end || undefined 
      };
      
      const res = await adminFetch(`${ADMIN_API}/set-voting-window`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage('Voting window updated successfully');
      } else {
        setMessage(data.message || 'Error saving voting window');
      }
    } catch (error) {
      setMessage('Network error saving voting window');
    } finally {
      setSavingWindow(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Election Settings</h2>
        <p className="text-sm text-gray-600">Configure registration deadlines and voting windows</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('successfully') || message.includes('updated')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Voting Toggle Section */}
        <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-between">
          <div>
            <h3 className="text-md font-semibold text-gray-900">Voting Status</h3>
            <p className="text-sm text-gray-600 mt-1">Enable or disable voting for all users</p>
          </div>
          <button
            onClick={handleToggleVoting}
            disabled={savingToggle}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${votingEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {savingToggle ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              votingEnabled ? 'Voting Enabled' : 'Voting Disabled'
            )}
          </button>
        </div>
        {/* Registration Due Date Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="mb-4">
            <h3 className="text-md font-semibold text-gray-900">Registration Due Date</h3>
            <p className="text-sm text-gray-600 mt-1">
              Candidates cannot register after this date and time
            </p>
          </div>
          
          <form onSubmit={handleSaveDueDate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Deadline
              </label>
              <input
                type="datetime-local"
                value={registrationDueDate}
                onChange={(e) => setRegistrationDueDate(e.target.value)}
                className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={savingDueDate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingDueDate ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Due Date'
              )}
            </button>
          </form>
        </div>

        {/* Voting Window Section */}
        {/* <div className="bg-gray-50 p-6 rounded-lg">
          <div className="mb-4">
            <h3 className="text-md font-semibold text-gray-900">Voting Window</h3>
            <p className="text-sm text-gray-600 mt-1">
              Define when users can request OTP and cast their votes
            </p>
          </div>
          
          <form onSubmit={handleSaveVotingWindow} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voting Start
                </label>
                <input
                  type="datetime-local"
                  value={votingWindow.start}
                  onChange={(e) => setVotingWindow(prev => ({ ...prev, start: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voting End (Optional)
                </label> 
                <input
                  type="datetime-local"
                  value={votingWindow.end}
                  onChange={(e) => setVotingWindow(prev => ({ ...prev, end: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={savingWindow}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingWindow ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Voting Window'
              )}
            </button>
          </form>
        </div>*/}
      </div>
    </div>
  );
}
