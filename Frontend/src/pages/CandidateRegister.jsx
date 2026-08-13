import React, { useState, useEffect } from "react";

// Use relative /api in dev (Vite proxy) to avoid CORS; allow override with VITE_API_BASE_URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const API_URL = `${API_BASE}/candidate`;
const POSITION_API = `${API_BASE}/position`;

export default function CandidateRegister() {
  // Replaced gender with phone field (required)
  const [form, setForm] = useState({ name: "", usn: "", email: "", position: "", phone: "" });
  const [usnError, setUsnError] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch(`${POSITION_API}`);
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        const text = await response.text();
        console.error("Position fetch failed", response.status, text.slice(0, 200));
        throw new Error(`HTTP ${response.status}`);
      }
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Expected JSON but got:", contentType, text.slice(0, 200));
        throw new Error("Non-JSON response (likely SPA fallback; rewrite not applied)");
      }
      const data = await response.json();
      setPositions(data.positions || []);
    } catch (error) {
      console.error("Error fetching positions:", error);
      setMessage("Error loading positions");
    }
  };

  const USN_REGEX = /^nu25mca(?:[1-9]|[1-9][0-9]|1[0-7][0-9]|180)$/i; // 1-180 inclusive

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    if (name === 'usn') {
      // live normalize to lowercase without spaces
      next.usn = value.toLowerCase().trim();
      if (next.usn && !USN_REGEX.test(next.usn)) {
        setUsnError('USN must start with nu25mca and end with a number 1-180 (e.g. nu25mca12)');
      } else {
        setUsnError('');
      }
    }
    setForm(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.position) return setMessage("Please select a position");
    if (!form.usn || !USN_REGEX.test(form.usn)) {
      setUsnError('Enter a valid USN in range nu25mca1 - nu25mca180');
      return setMessage('Please fix the highlighted errors.');
    }
    setMessage("");
    setSubmitting(true);
    try {
      const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => v && fd.append(k, v)); // includes phone now
      if (photo) fd.append("photo", photo);
      const res = await fetch(`${API_URL}/register`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setMessage("Registered successfully and pending approval.");
  setForm({ name: "", usn: "", email: "", position: "", phone: "" });
  setUsnError('');
        setPhoto(null);
      } else setMessage(data.message || "Error registering candidate.");
    } catch (err) {
      // eslint-disable-line no-unused-vars
      setMessage("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 w-full max-w-xl border border-primary-100">
        <div className="flex justify-center mb-3">
          <img src="/samca_logo.jpeg" className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-primary-200" alt="SAMCA Logo" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary-800 to-accent-600">
          Candidate Registration
        </h2>
        <p className="text-sm text-text-secondary text-center mb-6">
          Fill in accurate details. Each candidate can only be contested for one position.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-primary uppercase">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input-field mt-1" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-primary uppercase">USN</label>
              <input
                name="usn"
                value={form.usn}
                onChange={handleChange}
                required
                className={`input-field mt-1 ${usnError ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="nu25mca***"
                aria-invalid={!!usnError}
              />
              {usnError && <p className="mt-1 text-xs text-red-600">{usnError}</p>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-primary uppercase">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-primary uppercase">Position</label>
              <select
                name="position"
                value={form.position}
                onChange={handleChange}
                required
                className="input-field mt-1 bg-white">
                <option value="">Select Position</option>
                {positions.map((position) => (
                  <option key={position.name} value={position.displayName}>
                    {position.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-primary uppercase">Phone Number</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                title="Enter a 10 digit phone number"
                className="input-field mt-1"
                placeholder="10 digit number"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-primary uppercase">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                required
                className="mt-1 w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-800 hover:file:bg-primary-100"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              disabled={submitting}
              type="submit"
              className="w-full relative overflow-hidden group bg-gradient-to-r from-primary-800 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center">
              {submitting && (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span className="relative z-10">{submitting ? "Submitting..." : "Submit Registration"}</span>
              <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
            </button>
          </div>
        </form>
        {message && (
          <p
            className={`mt-6 text-center text-sm font-medium px-4 py-2 rounded-lg ${
              message.includes("success")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
