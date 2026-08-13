import React, { useState, useEffect } from "react";
import { adminFetch } from "../utils/adminApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const POSITIONS_API = `${API_BASE}/position`;

export default function AdminPositions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // New Position Form State
  const [form, setForm] = useState({ name: "", displayName: "", order: 1 });

  // Edit Position State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", displayName: "", order: 1, isActive: true });

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(POSITIONS_API);
      if (res.ok) {
        const data = await res.json();
        setPositions(data.positions || []);
      } else {
        setMessage("Failed to load positions.");
      }
    } catch (err) {
      console.error("[AdminPositions] fetchPositions error:", err);
      setMessage("Error loading positions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!form.name || !form.displayName) {
      return setMessage("Name and Display Name are required.");
    }

    try {
      const res = await adminFetch(POSITIONS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim().toLowerCase().replace(/\s+/g, "_"),
          displayName: form.displayName.trim(),
          order: Number(form.order) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Position added successfully!");
        setForm({ name: "", displayName: "", order: positions.length + 2 });
        setIsAdding(false);
        fetchPositions();
      } else {
        setMessage(data.message || "Failed to add position.");
      }
    } catch (err) {
      console.error("[AdminPositions] handleAddSubmit error:", err);
      setMessage("Error adding position.");
    }
  };

  const handleStartEdit = (pos) => {
    setEditingId(pos._id);
    setEditForm({
      name: pos.name,
      displayName: pos.displayName,
      order: pos.order,
      isActive: pos.isActive !== undefined ? pos.isActive : true,
    });
  };

  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await adminFetch(`${POSITIONS_API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim().toLowerCase().replace(/\s+/g, "_"),
          displayName: editForm.displayName.trim(),
          order: Number(editForm.order),
          isActive: editForm.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Position updated successfully!");
        setEditingId(null);
        fetchPositions();
      } else {
        setMessage(data.message || "Failed to update position.");
      }
    } catch (err) {
      console.error("[AdminPositions] handleEditSubmit error:", err);
      setMessage("Error updating position.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the position "${name}"?`)) return;
    setMessage("");

    try {
      const res = await adminFetch(`${POSITIONS_API}/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Position deleted successfully!");
        fetchPositions();
      } else {
        setMessage(data.message || "Failed to delete position.");
      }
    } catch (err) {
      console.error("[AdminPositions] handleDelete error:", err);
      setMessage("Error deleting position.");
    }
  };

  return (
    <div className="p-6">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Positions Management</h2>
          <p className="text-sm text-gray-600">
            Configure election candidate positions and display ordering rank.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) setForm({ name: "", displayName: "", order: positions.length + 1 });
          }}
          className="btn-primary inline-flex items-center text-sm font-medium">
          {isAdding ? "Cancel" : "+ Add New Position"}
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-md text-sm font-medium border ${
            message.toLowerCase().includes("success")
              ? "bg-accent-50 text-accent-800 border-accent-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
          {message}
        </div>
      )}

      {/* Add Position Form Card */}
      {isAdding && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm mb-6 transition-all duration-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Add New Position</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vice President"
                value={form.displayName}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    displayName: val,
                    name: val.toLowerCase().trim().replace(/\s+/g, "_"),
                  });
                }}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Identifier (Name)
              </label>
              <input
                type="text"
                placeholder="e.g. vice_president"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Rank
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="input-field"
                required
                min="1"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-secondary text-sm">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-sm">
                Save Position
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Positions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary-800 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-500">Loading positions...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No positions configured yet</h3>
            <p className="mt-1 text-sm text-gray-500">Click "+ Add New Position" to create your first election position.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Internal Identifier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {positions.map((pos) => {
                  const isEditing = editingId === pos._id;

                  if (isEditing) {
                    return (
                      <tr key={pos._id} className="bg-accent-50/40">
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.order}
                            onChange={(e) => setEditForm({ ...editForm, order: e.target.value })}
                            className="input-field w-20 text-sm"
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                            className="input-field text-sm"
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="input-field text-sm"
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editForm.isActive ? "true" : "false"}
                            onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
                            className="input-field text-sm">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={(e) => handleEditSubmit(e, pos._id)}
                            className="btn-primary text-xs py-1 px-3">
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="btn-secondary text-xs py-1 px-3">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={pos._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                          #{pos.order}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pos.displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {pos.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            pos.isActive !== false
                              ? "bg-accent-50 text-accent-800 border-accent-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}>
                          {pos.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleStartEdit(pos)}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-accent-50 text-accent-700 hover:bg-accent-100 border border-accent-200 transition-colors">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pos._id, pos.displayName)}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
