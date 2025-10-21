// src/pages/Leads.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import LeadsTable from "../components/LeadsTable";
import LeadCard from "../components/LeadCard";
import LeadsModals from "../components/LeadsModals";
import ConvertLeadModal from "../components/ConvertLeadModal";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Replace with your real auth info
  const currentUser = { id: 1, name: "Admin User", role: "admin" };
  const isAdmin = (currentUser.role || "").toString().toLowerCase() === "admin";

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [leadsRes, usersRes, productsRes] = await Promise.all([
        axios.get("/sbr-pos/server/api/leads.php"),
        axios.get("/sbr-pos/server/api/users.php"),
        axios.get("/sbr-pos/server/api/products.php"),
      ]);

      const leadsData = leadsRes.data?.data ?? leadsRes.data ?? [];
      setLeads(Array.isArray(leadsData) ? leadsData : []);

      const usersData = usersRes.data?.data ?? usersRes.data ?? [];
      setUsers(usersData);
      setAssignableUsers((usersData || []).filter((u) => ["sales", "admin", "store_incharge"].includes((u.role || "").toString().toLowerCase())));

      const productsData = productsRes.data?.data ?? productsRes.data ?? [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Failed to load data — check backend endpoints.");
    } finally {
      setLoading(false);
    }
  }

  // role filtering
  const leadsForRole = leads.filter((l) => {
    if (isAdmin) return true;
    return Number(l.assigned_to) === Number(currentUser.id);
  });

  // search across name, phone, email, notes
  const visibleLeads = leadsForRole.filter((l) => {
    if (!searchTerm) return true;
    const q = searchTerm.toString().toLowerCase();
    return (
      (l.full_name || "").toString().toLowerCase().includes(q) ||
      (l.phone || l.contact_info || "").toString().toLowerCase().includes(q) ||
      (l.email || "").toString().toLowerCase().includes(q) ||
      (l.notes || "").toString().toLowerCase().includes(q)
    );
  });

  const openEditLead = (lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const handleAssign = async (leadId, userId) => {
    try {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, assigned_to: userId } : l)));
      await axios.put(`/sbr-pos/server/api/leads.php?id=${leadId}`, { assigned_to: userId });
    } catch (err) {
      console.error("assign failed", err);
    }
  };

  const handleUpdateLead = (updatedLead) => {
    setLeads((prev) => {
      // if updatedLead includes id, use it to replace; else, append if created
      if (!updatedLead?.id) return prev;
      const found = prev.find((p) => p.id === updatedLead.id);
      if (found) return prev.map((p) => (p.id === updatedLead.id ? { ...p, ...updatedLead } : p));
      return [updatedLead, ...prev];
    });
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await axios.delete(`/sbr-pos/server/api/leads.php?id=${leadId}`);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      console.error("delete failed", err);
    }
  };

  const openConvertModal = (lead) => {
    setLeadToConvert(lead);
    setShowConvertModal(true);
  };

  const handleConverted = (res) => {
    // backend returns success; update UI
    if (leadToConvert) {
      setLeads((prev) => prev.map((l) => (l.id === leadToConvert.id ? { ...l, status: "Converted" } : l)));
    }
    // optionally you can remove converted lead:
    // setLeads(prev => prev.filter(l => l.id !== leadToConvert.id));
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Leads</h1>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Leads</h1>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen pb-24 md:pb-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Leads</h1>
          <div className="flex flex-col md:flex-row md:gap-2">
            <input
              placeholder="Search leads by name, phone, email or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded px-3 py-2 w-full md:w-64 mb-2 md:mb-0"
            />
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded w-1/2 md:w-auto" onClick={() => setShowImportModal(true)}>
                Import
              </button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded w-1/2 md:w-auto" onClick={() => setShowLeadModal(true)}>
                Add Lead
              </button>
            </div>
          </div>
        </div>

        <LeadsTable
          visibleLeads={visibleLeads}
          assignableUsers={assignableUsers}
          users={users}
          currentUser={currentUser}
          isAdmin={isAdmin}
          openEditLead={openEditLead}
          handleAssign={handleAssign}
          handleDeleteLead={handleDeleteLead}
          onOpenConvertModal={openConvertModal}
        />

        <LeadCard
          visibleLeads={visibleLeads}
          openEditLead={openEditLead}
          handleAssign={handleAssign}
          handleDeleteLead={handleDeleteLead}
          setShowCalendarModal={setShowCalendarModal}
          onOpenConvertModal={openConvertModal}
        />
      </div>

      <LeadsModals
        showLeadModal={showLeadModal}
        setShowLeadModal={setShowLeadModal}
        selectedLead={selectedLead}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        showCalendarModal={showCalendarModal}
        setShowCalendarModal={setShowCalendarModal}
        users={assignableUsers} // The fix is here, passing the correct array
        onSave={(updated) => handleUpdateLead(updated)}
        products={products}
      />

      <ConvertLeadModal
        show={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        lead={leadToConvert}
        products={products}
        apiConvertUrl="/sbr-pos/server/api/convert_lead.php"
        onConverted={(res) => {
          handleConverted(res);
          setShowConvertModal(false);
        }}
      />
    </div>
  );
}