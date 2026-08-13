import React, { useState, useEffect } from "react";
import { adminFetch } from "../utils/adminApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const CANDIDATE_API = `${API_BASE}/candidate`;

export default function AdminRegistrations() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [actionId, setActionId] = useState(null); // candidate id currently being acted on

  const fetchAllCandidates = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`${CANDIDATE_API}/all`);
      const data = await res.json();
      if (res.ok) {
        setCandidates(data.candidates);
        setMessage("");
      } else {
        setMessage(data.message || "Error loading candidates");
      }
    } catch {
      setMessage("Network error loading candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCandidates();
  }, []);

  const handleAction = async (id, action) => {
    setMessage("");
    setActionId(id);
    try {
      const res = await adminFetch(`${CANDIDATE_API}/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Candidate ${action}d successfully`);
        // Update only the affected candidate locally
        setCandidates((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: action === "approve" ? "approved" : "rejected" } : c))
        );
      } else {
        setMessage(data.message || `Error ${action}ing candidate`);
      }
    } catch {
      setMessage(`Network error ${action}ing candidate`);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) {
      return;
    }

    setMessage("");
    setActionId(id);
    try {
      const res = await adminFetch(`${CANDIDATE_API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage("Candidate deleted successfully");
        // Remove candidate locally
        setCandidates((prev) => prev.filter((c) => c._id !== id));
      } else {
        setMessage(data.message || "Error deleting candidate");
      }
    } catch {
      setMessage("Network error deleting candidate");
    } finally {
      setActionId(null);
    }
  };


  // Group candidates by position
  const filteredCandidates = candidates.filter((candidate) => {
    if (filter === "all") return true;
    return candidate.status === filter;
  });

  const candidatesByPosition = filteredCandidates.reduce((acc, candidate) => {
    if (!acc[candidate.position]) acc[candidate.position] = [];
    acc[candidate.position].push(candidate);
    return acc;
  }, {});

  const getStatusCounts = () => {
    const pending = candidates.filter((c) => c.status === "pending").length;
    const approved = candidates.filter((c) => c.status === "approved").length;
    const rejected = candidates.filter((c) => c.status === "rejected").length;
    return { pending, approved, rejected, total: candidates.length };
  };

  const counts = getStatusCounts();

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-accent-100 text-accent-800 border-accent-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const ActionButtons = ({ candidate }) => (
    <div className="flex space-x-2">
      {candidate.status !== "approved" && (
        <button
          onClick={() => handleAction(candidate._id, "approve")}
          disabled={actionId === candidate._id}
          className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 ${
            actionId === candidate._id ? "bg-accent-400 cursor-not-allowed" : "bg-accent-600 hover:bg-accent-700"
          }`}>
          {actionId === candidate._id ? "..." : "Approve"}
        </button>
      )}
      {candidate.status !== "rejected" && (
        <button
          onClick={() => handleAction(candidate._id, "reject")}
          disabled={actionId === candidate._id}
          className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
            actionId === candidate._id ? "bg-yellow-400 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"
          }`}>
          {actionId === candidate._id ? "..." : "Reject"}
        </button>
      )}
      <button
        onClick={() => handleDelete(candidate._id)}
        disabled={actionId === candidate._id}
        className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
          actionId === candidate._id ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
        }`}>
        {actionId === candidate._id ? "..." : "Delete"}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Candidate Registrations</h2>
            <p className="text-sm text-gray-600 mt-1">Manage candidate applications and approvals</p>
          </div>
          <button
            onClick={fetchAllCandidates}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex space-x-4 mb-4">
          {[
            { key: "all", label: "All", count: counts.total },
            { key: "pending", label: "Pending", count: counts.pending },
            { key: "approved", label: "Approved", count: counts.approved },
            { key: "rejected", label: "Rejected", count: counts.rejected },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-accent-100 text-accent-700 border border-accent-200 hover:bg-accent-200"
                  : "text-white bg-primary-900 hover:text-accent-700 hover:bg-accent-100 border border-transparent"
              }`}>
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.includes("successfully")
              ? "bg-accent-50 text-accent-800 border border-accent-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
          {message}
        </div>
      )}

      {/* Candidates Table Grouped by Position */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === "all" ? "No candidates yet" : `No ${filter} candidates`}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "all"
                ? "Candidates will appear here once they register"
                : `No candidates with ${filter} status found`}
            </p>
          </div>
        ) : (
          <div>
            {/* Sort positions by order if available */}
            {Object.keys(candidatesByPosition)
              .sort((a, b) => {
                // Find the minimum order for each position group
                const caOrder = Math.min(...(candidatesByPosition[a].map(c => c.order || 999)));
                const cbOrder = Math.min(...(candidatesByPosition[b].map(c => c.order || 999)));
                return caOrder - cbOrder;
              })
              .map((position) => (
                <div key={position} className="mb-8">
                  <h3 className="text-lg font-bold text-accent-700 mb-4">{position}</h3>
                  <ul className="divide-y divide-gray-200">
                    {candidatesByPosition[position].map((candidate) => (
                    <li key={candidate._id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Photo */}
                          <div className="flex-shrink-0">
                            {candidate.photoUrl ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                src={candidate.photoUrl}
                                alt={candidate.name}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Candidate Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-3">
                              <p className="text-sm font-medium text-gray-900 truncate">{candidate.name}</p>
                              <StatusBadge status={candidate.status} />
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500">USN: {candidate.usn}</p>
                              <span className="text-gray-300">•</span>
                              <p className="text-xs text-gray-500">{candidate.email}</p>
                              <span className="text-gray-300">•</span>
                              <p className="text-xs text-gray-500">Phone: {candidate.phone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <ActionButtons candidate={candidate} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
