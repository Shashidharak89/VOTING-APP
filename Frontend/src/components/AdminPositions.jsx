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
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Positions Management</h2>
          <p className="text-sm text-text-secondary">
            Configure election candidate positions and display ordering rank.
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) setForm({ name: "", displayName: "", order: positions.length + 1 });
          }}
          className="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium">
          {isAdding ? "Cancel" : "+ Add New Position"}
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium border ${
            message.toLowerCase().includes("success")
              ? "bg-accent-50 text-accent-800 border-accent-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
          {message}
        </div>
      )}

      {/* Add Position Form */}
      {isAdding && (
        <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm transition-all duration-200">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Add New Position</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase mb-1">
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
              <label className="block text-xs font-semibold text-text-primary uppercase mb-1">
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
              <label className="block text-xs font-semibold text-text-primary uppercase mb-1">
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
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="btn-primary px-6 py-2 text-sm">
                Save Position
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Positions Table */}
      <div className="bg-white shadow overflow-hidden rounded-xl border border-primary-100">
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary-800 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-text-secondary">Loading positions...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No positions configured yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "+ Add New Position" to create your first election position.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order
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
                      <tr key={pos._id} className="bg-primary-50/50">
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
                            className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700">
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-400">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={pos._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-800">
                        #{pos.order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        {pos.displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-mono">
                        {pos.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            pos.isActive !== false
                              ? "bg-accent-100 text-accent-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                          {pos.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleStartEdit(pos)}
                          className="text-primary-600 hover:text-primary-900 font-medium">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pos._id, pos.displayName)}
                          className="text-red-600 hover:text-red-900 font-medium">
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
