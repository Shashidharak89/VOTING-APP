import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const API_URL = `${API_BASE}/auth`;
const ADMIN_API = `${API_BASE}/admin`;

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [loadingVotingStatus, setLoadingVotingStatus] = useState(true);
  const navigate = useNavigate();
  // Fetch voting status on mount
  useEffect(() => {
    const fetchVotingStatus = async () => {
      setLoadingVotingStatus(true);
      try {
        const res = await fetch(`${ADMIN_API}/get-voting-enabled`);
        if (res.ok) {
          const data = await res.json();
          setVotingEnabled(!!data.votingEnabled);
        } else {
          setVotingEnabled(true); // fallback: allow login
        }
      } catch {
        setVotingEnabled(true); // fallback: allow login
      } finally {
        setLoadingVotingStatus(false);
      }
    };
    fetchVotingStatus();
  }, []);

  // Allowed pattern: any email prefix ending with @nmamit.in
  const emailRegex = /^[^\s@]+@nmamit\.in$/i;

  const validateEmail = (val) => {
    if (!val) return true; // don't show error on empty
    return emailRegex.test(val.trim().toLowerCase());
  };

  const handleRequestOtp = async (e) => {
    if (!validateEmail(email)) {
      setEmailValid(false);
      e.preventDefault();
      return;
    }
    setLoading(true);
    e.preventDefault();
    setMessage("");
    try {
      setEmail( email.trim().toLowerCase());
      const res = await fetch(`${API_URL}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoading(false);
        setStep(2);
        setMessage("OTP sent to your email.");
      } else {
        setLoading(false);
        const errMsg = data.message || "Error sending OTP.";
        setMessage(errMsg);
        if (/already voted/i.test(errMsg)) {
          setAlreadyVoted(true);
        }
      }
    } catch {
      setLoading(false);
      setMessage("Network error.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onLogin) onLogin(email, data.token);
        setMessage("OTP verified. Redirecting to vote...");
        // Navigate to vote page
        navigate("/vote");
      } else {
        const errMsg = data.message || "Invalid OTP.";
        setMessage(errMsg);
        if (/already voted/i.test(errMsg)) {
          setAlreadyVoted(true);
        }
      }
    } catch {
      setMessage("Network error.");
    }
  };

  // Show loading spinner while checking voting status
  if (loadingVotingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-primary-100 flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-primary-800 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-lg font-semibold text-text-primary">Checking voting status…</div>
        </div>
      </div>
    );
  }

  if (!votingEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-primary-100 flex flex-col items-center">
          <svg className="h-12 w-12 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
          </svg>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Voting Not Started</h2>
          <p className="text-text-secondary text-center">Voting is currently disabled by the admin.<br />Please check back later.</p>
        </div>
      </div>
    );
  }

  // ...existing code...
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-primary-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img src="/samca_logo.jpeg" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-primary-200" alt="SAMCA Logo" />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">SAMCA Election</h2>
          <p className="text-text-secondary">Login to cast your vote</p>
        </div>
        {/* ...existing code for login form... */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">College Email</label>
              <input
                type="email"
                placeholder="yourname@nmamit.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailValid(true);
                }}
                className="input-field"
                required
              />
              {!emailValid && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  Enter a valid college email ending with @nmamit.in
                </p>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3 text-lg flex items-center justify-center"
              disabled={loading || !email || !emailValid}>
              {loading && (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Request OTP
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Enter OTP</label>
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input-field text-center text-lg tracking-widest"
                required
                maxLength="6"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3 text-lg flex items-center justify-center"
              disabled={message === "OTP verified. Redirecting to vote..."}>
              {message === "" && (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Verify OTP
            </button>
            <button type="button" onClick={() => setStep(1)} className="btn-secondary w-full py-2">
              Back
            </button>
          </form>
        )}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center font-medium ${
              message.includes("sent") || message.includes("successfully") || message.includes("Redirecting")
                ? "bg-accent-50 text-accent-700 border border-accent-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
            {message}
          </div>
        )}
      </div>
      {alreadyVoted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in border border-primary-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Already Voted</h3>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Our records show you have already cast your vote. Each student can vote only once. Thank you for
              participating!
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setAlreadyVoted(false);
                }}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">
                Close
              </button>
              <button
                onClick={() => {
                  setAlreadyVoted(false);
                  navigate("/");
                }}
                className="px-4 py-2 text-sm font-medium bg-primary-800 text-white rounded-lg hover:bg-primary-700">
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
