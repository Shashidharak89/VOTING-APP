import React, { useEffect, useState, useCallback } from "react";
import { adminFetch } from "../utils/adminApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const ADMIN_API = `${API_BASE}/admin`;

export default function AdminVotedUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [debounceTimer, setDebounceTimer] = useState(null);

  const fetchUsers = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setMessage("");
      try {
        const params = new URLSearchParams({
          page: (opts.page || page).toString(),
          limit: limit.toString(),
        });
        if (opts.search !== undefined ? opts.search : search) {
          params.set("search", opts.search !== undefined ? opts.search : search);
        }
        const res = await adminFetch(`${ADMIN_API}/voted-users?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users || []);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || 0);
        } else {
          setMessage(data.message || "Error loading voted users");
        }
      } catch {
        setMessage("Network error loading users");
      } finally {
        setLoading(false);
      }
    },
    [search, page, limit]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => {
      fetchUsers({ page: 1, search: val });
    }, 400);
    setDebounceTimer(t);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    fetchUsers({ page: p });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Voted Students</h2>
          <p className="text-sm text-gray-600 mt-1">List of users who have successfully cast a vote</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={handleSearchChange}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <button
            onClick={() => fetchUsers({ page: 1 })}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            message.toLowerCase().includes("error")
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-green-50 text-green-800 border border-green-200"
          }`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        {loading ? (
          <div className="p-6 animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-sm font-medium text-gray-900">No voted users found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voted At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u, idx) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">{(page - 1) * limit + idx + 1}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 break-all">{u.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-600">
            Page {page} of {totalPages} • Total {total}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 border rounded-md ${
                page === 1
                  ? "text-gray-300 border-gray-200 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-50 border-gray-300"
              }`}>
              Prev
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className={`px-3 py-1 border rounded-md ${
                page === totalPages
                  ? "text-gray-300 border-gray-200 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-50 border-gray-300"
              }`}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
