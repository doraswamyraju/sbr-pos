// src/components/LeadsModals.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function LeadsModals({
  showLeadModal,
  setShowLeadModal,
  selectedLead,
  showImportModal,
  setShowImportModal,
  showCalendarModal,
  setShowCalendarModal,
  users = [],
  onSave = () => {},
  products = [],
}) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    assigned_to: "",
    status: "New",
    notes: "",
    address: "",
    source: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedLead) {
      setForm({
        full_name: selectedLead.full_name || "",
        phone: selectedLead.phone || selectedLead.contact_info || "",
        email: selectedLead.email || "",
        assigned_to: selectedLead.assigned_to || "",
        status: selectedLead.status || "New",
        notes: selectedLead.notes || "",
        address: selectedLead.address || "",
        source: selectedLead.source || "",
      });
    } else {
      setForm({
        full_name: "",
        phone: "",
        email: "",
        assigned_to: "",
        status: "New",
        notes: "",
        address: "",
        source: "",
      });
    }
  }, [selectedLead]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedLead && selectedLead.id) {
        const res = await axios.put(`/sbr-pos/server/api/leads.php?id=${selectedLead.id}`, form);
        if (res.data?.status === "success") {
          onSave({ id: selectedLead.id, ...form });
        } else {
          onSave({ id: selectedLead.id, ...form });
        }
      } else {
        const res = await axios.post(`/sbr-pos/server/api/leads.php`, form);
        if (res.data?.status === "success") {
          onSave(res.data.data);
        }
      }
      setShowLeadModal(false);
    } catch (err) {
      console.error("save lead failed", err);
      alert("Failed to save lead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {showLeadModal && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-3">{selectedLead ? "Edit Lead" : "Add Lead"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border p-2 rounded" placeholder="Full name" value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} />
              <input className="border p-2 rounded" placeholder="Phone" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
              <input className="border p-2 rounded" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
              <select className="border p-2 rounded text-gray-900" value={form.assigned_to} onChange={(e) => setForm((s) => ({ ...s, assigned_to: e.target.value }))}>
                <option value="">Assign to</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <select className="border p-2 rounded" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>

              <input className="border p-2 rounded" placeholder="Source (e.g. Meta Ads)" value={form.source} onChange={(e) => setForm((s) => ({ ...s, source: e.target.value }))} />
            </div>

            <div className="mt-3">
              <textarea className="border p-2 rounded w-full" rows={3} placeholder="Notes" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
            </div>

            <div className="mt-3">
              <input className="border p-2 rounded w-full" placeholder="Address" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setShowLeadModal(false)}>
                Cancel
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-3">Import Leads (CSV)</h2>
            <input type="file" accept=".csv" />
            <div className="mt-4 flex justify-end">
              <button className="px-3 py-1 border rounded" onClick={() => setShowImportModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-3">Schedule / Calendar</h2>
            <p className="text-sm text-gray-600">(Place your calendar component here)</p>
            <div className="mt-4 flex justify-end">
              <button className="px-3 py-1 border rounded" onClick={() => setShowCalendarModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}