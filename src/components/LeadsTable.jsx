// src/components/LeadsTable.jsx
import React from "react";
import { FaEdit, FaTrash, FaCalendarAlt, FaShoppingCart } from "react-icons/fa";

export default function LeadsTable({
  visibleLeads = [],
  assignableUsers = [],
  users = [],
  currentUser,
  isAdmin,
  openEditLead,
  handleAssign,
  handleDeleteLead,
  onOpenConvertModal,
  onOpenSchedule,
}) {
  return (
    <div className="hidden md:block bg-white rounded-lg shadow-sm border p-4 w-full">
      <div className="mb-3 flex items-center gap-2">
        {/* Search input moved to page; keep empty here */}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">DATE</th>
              <th className="px-4 py-3 text-left">NAME</th>
              <th className="px-4 py-3 text-left">PHONE</th>
              <th className="px-4 py-3 text-left">EMAIL</th>
              <th className="px-4 py-3 text-left">STATUS</th>
              <th className="px-4 py-3 text-left">NOTES</th>
              <th className="px-4 py-3 text-left">ASSIGNED TO</th>
              <th className="px-4 py-3 text-left">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleLeads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3 text-sm text-gray-700">{lead.date || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{lead.full_name || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{lead.phone || lead.contact_info || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{lead.email || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{lead.status || "New"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{lead.notes || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <select
                    value={lead.assigned_to ?? ""}
                    onChange={(e) => handleAssign(lead.id, e.target.value)}
                    className="border rounded p-1"
                    disabled={!isAdmin}
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditLead(lead)} title="Edit">
                      <FaEdit />
                    </button>
                    <button onClick={() => onOpenSchedule ? onOpenSchedule(lead) : null} title="Schedule Follow-up" className="text-blue-600 hover:text-blue-800">
                      <FaCalendarAlt />
                    </button>
                    <button onClick={() => onOpenConvertModal(lead)} title="Open convert modal">
                      <FaShoppingCart />
                    </button>
                    <button onClick={() => handleDeleteLead(lead.id)} title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleLeads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}