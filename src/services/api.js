// src/services/api.js
// Simple stubbed functions returning Promise-resolved sample data.
// Replace these with your real axios/fetch calls.

export async function fetchLeads() {
  return Promise.resolve([
    {
      id: 1,
      date: "2025-09-13 21:59:50",
      full_name: "Ajay Kumar",
      phone: "7209385632",
      email: "ajay@example.com",
      assigned_to: "",
    },
    {
      id: 2,
      date: "2025-09-13 21:59:50",
      full_name: "Bose KS",
      phone: "9962974239",
      email: "bose@example.com",
      assigned_to: "",
    },
  ]);
}

export async function fetchUsers() {
  return Promise.resolve([
    { id: 1, name: "Store In-Charge", role: "sales" },
    { id: 2, name: "Admin User", role: "admin" },
  ]);
}

export async function fetchProducts() {
  return Promise.resolve([
    { id: "p1", name: "Product A" },
    { id: "p2", name: "Product B" },
  ]);
}
