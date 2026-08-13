import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const API_URL = `${API_BASE}/vote`;

export default function Vote({ userEmail, token, onVoted }) {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState({});
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({}); // { [position]: true }
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/positions-candidates`)
      .then(res => res.json())
      .then(data => {
        console.log(data);
        setPositions(data.positions);
        setCandidates(data.candidates);
      });
  }, []);

  const handleVoteChange = (position, candidateId) => {
    setVotes({ ...votes, [position]: candidateId });
    // Clear validation error for this position when a choice is made
    if (validationErrors[position]) {
      const next = { ...validationErrors };
      delete next[position];
      setValidationErrors(next);
    }
  };
  console.log(positions);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    // Validate: ensure a candidate is selected for each position
    const missing = positions.filter((p) => !votes[p]);
    if (missing.length > 0) {
      const errs = missing.reduce((acc, p) => ({ ...acc, [p]: true }), {});
      setValidationErrors(errs);
      setMessage('Please select a candidate for all positions.');
      return; // Do not proceed
    }

  

    setLoading(true);
    const voteArr = Object.entries(votes).map(([position, candidateId]) => ({ position, candidateId }));
    try {
      const res = await fetch(`${API_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ votes: voteArr })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setMessage('Vote submitted successfully!');
      } else {
        setMessage(data.message || 'Error submitting vote.');
      }
    } catch (err) {
      setMessage('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // After submission: countdown, clear session then redirect
  useEffect(() => {
    if (!submitted) return;
    const interval = setInterval(() => {
      setRedirectSeconds(s => {
        if (s <= 1) {
          clearInterval(interval);
          // Now clear auth/session and then redirect
          if (onVoted) onVoted();
          navigate('/vote');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, onVoted, navigate]);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full border border-primary-100">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">Thank You!</h2>
            <p className="text-text-secondary mb-4">Your vote has been successfully submitted.</p>
            <p className="text-sm text-text-muted">Redirecting to vote page in {redirectSeconds}s…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className=" mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-primary-100">
          <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white p-6 flex flex-col items-center">
            <img src="/samca_logo.jpeg" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white/30 mb-3" alt="SAMCA Logo" />
            <h2 className="text-3xl text-white font-bold text-center">Cast Your Vote</h2>
            <p className="text-center mt-2 opacity-90">SAMCA Election 2026</p>
          </div>
          
          <form onSubmit={handleSubmit} noValidate className="p-6">
            <div className="grid gap-8">
              {positions.map(position => (
                <div key={position} className={`bg-primary-50 rounded-lg p-6 border-l-4 ${validationErrors[position] ? 'border-red-500' : 'border-primary-800'}`}>
                  <h4 className="text-xl font-semibold text-text-primary mb-4 capitalize">
                    {position.replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  {validationErrors[position] && (
                    <p className="text-sm text-red-600 -mt-2 mb-4">Please select a candidate for this position.</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {candidates.filter(c => c.position === position).map(c => {
                      const selected = votes[position] === c._id;
                      return (
                        <label
                          key={c._id}
                          className={`flex flex-col items-center p-6  rounded-2xl border-2 transition-all cursor-pointer shadow-sm duration-200 hover:shadow-md
                            ${selected ? 'border-accent-500 bg-accent-200/70 ring-2 ring-accent-300 shadow-lg' : 'border-primary-200 bg-white hover:border-accent-400'}`}
                        >
                          <input
                            type="radio"
                            name={position}
                            value={c._id}
                            checked={selected}
                            onChange={() => handleVoteChange(position, c._id)}
                            className="hidden"
                            aria-invalid={!!validationErrors[position]}
                          />
                          {c.photoUrl && (
                            <img
                              src={c.photoUrl}
                              alt={c.name}
                              className={`w-52 h-52 object-cover rounded-full border-4 mb-4 ${selected ? 'border-accent-500' : 'border-primary-200'}`}
                              loading="lazy"
                            />
                          )}
                          <span className="text-text-primary font-semibold text-lg text-center">
                            {c.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <button 
                type="submit"
                className={`bg-gradient-to-r from-primary-800 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Vote'}
              </button>
            </div>
          </form>
          
          {message && (
            <div className={`mx-6 mb-6 p-4 rounded-lg text-center font-medium ${
              message.includes('successfully') 
                ? 'bg-accent-50 text-accent-700 border border-accent-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
