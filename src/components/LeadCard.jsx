// src/components/LeadCard.jsx
import React from "react";
import { FaEdit, FaTrash, FaCalendarAlt, FaShoppingCart } from "react-icons/fa";

export default function LeadCard({
  visibleLeads,
  openEditLead,
  handleAssign,
  handleDeleteLead,
  onOpenConvertModal,
  setShowCalendarModal,
  onOpenSchedule,
}) {
  return (
    <div className="md:hidden space-y-4">
      {visibleLeads.map((lead) => (
        <div
          key={lead.id}
          className="bg-white p-4 rounded-lg shadow-md border-t-4 border-indigo-600"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-md font-bold text-gray-800">
              {lead.full_name || "Unnamed"}
            </h3>
            <span className="text-xs text-gray-500">
              {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="text-sm text-gray-700">
            <span className="font-semibold">Email:</span> {lead.email || "-"}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Phone:</span>{" "}
            {lead.phone || lead.contact_info || "-"}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Status:</span>{" "}
            <span className="font-bold text-indigo-700">
              {lead.status || "New"}
            </span>
          </div>

          <div className="flex space-x-2 mt-4 text-sm font-semibold">
            <button
              onClick={() => openEditLead(lead)}
              className="flex-1 py-2 px-3 rounded-lg text-primary-blue hover:bg-gray-100 flex items-center justify-center space-x-1"
            >
              <FaEdit className="w-4 h-4" /> <span>Edit</span>
            </button>
            <button
              onClick={() => handleDeleteLead(lead.id)}
              className="flex-1 py-2 px-3 rounded-lg text-red-600 hover:bg-gray-100 flex items-center justify-center space-x-1"
            >
              <FaTrash className="w-4 h-4" /> <span>Delete</span>
            </button>
          </div>

          <div className="flex space-x-2 mt-2 text-sm font-semibold">
            <button
              onClick={() => onOpenSchedule ? onOpenSchedule(lead) : (setShowCalendarModal && setShowCalendarModal(true))}
              className="flex-1 py-2 px-3 rounded-lg text-yellow-600 hover:bg-gray-100 flex items-center justify-center space-x-1"
            >
              <FaCalendarAlt className="w-4 h-4" /> <span>Schedule</span>
            </button>
            <button
              onClick={() => onOpenConvertModal(lead)}
              className="flex-1 py-2 px-3 rounded-lg text-green-600 hover:bg-gray-100 flex items-center justify-center space-x-1"
            >
              <FaShoppingCart className="w-4 h-4" /> <span>Convert</span>
            </button>
          </div>
        </div>
      ))}

      {visibleLeads.length === 0 && (
        <div className="text-center py-8 text-gray-500">No leads to show.</div>
      )}
    </div>
  );
}