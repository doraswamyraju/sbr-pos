// src/pages/UserSettings.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Complete, replaceable component for editing a user profile (self or admin editing other users)
// - GET /api/user_settings.php[?id=...] (requires session)
// - PUT /api/user_settings.php[?id=...] (requires session)
// Pass currentUser prop (object) for authorization/UI decisions

export default function UserSettings({ currentUser }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetIdFromQuery = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    lead_notifications: false,
    notification_email: '',
    role: '',
    printer_type: 'auto' // default to auto
  });
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  // Determine which user we are editing:
  // - if admin and ?id= present, edit that user
  // - otherwise edit currentUser
  const canEditOther = (() => {
    const role = (currentUser?.role ?? '').toString().toLowerCase();
    return !!currentUser?.is_admin || role.includes('admin') || role.includes('super');
  })();

  const targetId = canEditOther && targetIdFromQuery ? targetIdFromQuery : (currentUser?.id ?? null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setMessage(null);
      setErrors({});
      try {
        let url = '/api/user_settings.php';
        if (targetId && !(targetId === String(currentUser?.id))) {
          url += `?id=${encodeURIComponent(targetId)}`;
        }
        const res = await axios.get(url, { withCredentials: true });
        const data = res?.data?.data ?? null;
        if (!data) {
          if (isMounted) setMessage({ type: 'error', text: 'User not found or unauthorized.' });
          return;
        }
        if (isMounted) setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          lead_notifications: !!data.lead_notifications,
          notification_email: data.notification_email ?? '',
          role: data.role ?? '',
          printer_type: data.printer_type ?? 'auto'
        });
      } catch (err) {
        console.error('load user', err);
        if (isMounted) setMessage({ type: 'error', text: 'Failed to load user.' });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [targetId, currentUser]);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Enter a name (min 2 chars)';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (form.notification_email && !/^\S+@\S+\.\S+$/.test(form.notification_email)) e.notification_email = 'Invalid notification email';
    if (form.phone && !/^[-+0-9()\s]{6,20}$/.test(form.phone)) e.phone = 'Invalid phone';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setSaving(true);
    try {
      let url = '/api/user_settings.php';
      if (canEditOther && targetIdFromQuery) url += `?id=${encodeURIComponent(targetIdFromQuery)}`;

      // Only include role when current user is admin
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        lead_notifications: !!form.lead_notifications,
        notification_email: form.notification_email,
        printer_type: form.printer_type
      };
      if (canEditOther) payload.role = form.role;

      const res = await axios.put(url, payload, { withCredentials: true });
      const ok = res?.data?.success || res.status === 200;
      if (ok) {
        setMessage({ type: 'success', text: 'Saved successfully.' });
        // if the current user updated their own profile, update localStorage pos_user so header reflects changes
        try {
          const raw = localStorage.getItem('pos_user');
          if (raw) {
            const u = JSON.parse(raw);
            const editingSelf = (!targetIdFromQuery) || String(targetIdFromQuery) === String(u.id);
            if (editingSelf) {
              const updated = { ...u, name: form.name, email: form.email, phone: form.phone, printer_type: form.printer_type };
              localStorage.setItem('pos_user', JSON.stringify(updated));
            }
          }
        } catch (e) { /* ignore */ }
      } else {
        setMessage({ type: 'error', text: (res?.data?.error) || 'Save failed.' });
      }
    } catch (err) {
      console.error('save user', err);
      setMessage({ type: 'error', text: 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading user...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">User Profile</h2>
        <div>
          <button onClick={() => navigate(-1)} className="px-3 py-1 border rounded">Back</button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="mt-1 w-full p-2 border rounded" />
          {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="mt-1 w-full p-2 border rounded" />
          {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="mt-1 w-full p-2 border rounded" />
          {errors.phone && <div className="text-red-600 text-sm mt-1">{errors.phone}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Printer preference</label>
          <select value={form.printer_type} onChange={(e) => handleChange('printer_type', e.target.value)} className="mt-1 w-full p-2 border rounded">
            <option value="auto">Auto (Default - A4)</option>
            <option value="thermal-3in">3" Thermal (3×2 in)</option>
            <option value="regular-a4">Regular (A4, 3 labels / row)</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">This preference will be used when printing labels. Admins can edit other users' preferences.</div>
        </div>

        <div className="flex items-center space-x-3">
          <input id="ln" type="checkbox" checked={!!form.lead_notifications} onChange={(e) => handleChange('lead_notifications', e.target.checked)} />
          <label htmlFor="ln" className="text-sm">Enable lead notification emails</label>
        </div>

        <div>
          <label className="block text-sm font-medium">Notification email (optional)</label>
          <input type="email" value={form.notification_email} onChange={(e) => handleChange('notification_email', e.target.value)} className="mt-1 w-full p-2 border rounded" />
          {errors.notification_email && <div className="text-red-600 text-sm mt-1">{errors.notification_email}</div>}
          <div className="text-xs text-gray-500 mt-1">If set, this email will be used for lead notifications. Otherwise account email is used.</div>
        </div>

        {canEditOther && (
          <div>
            <label className="block text-sm font-medium">Role</label>
            <input value={form.role} onChange={(e) => handleChange('role', e.target.value)} className="mt-1 w-full p-2 border rounded" />
            <div className="text-xs text-gray-500 mt-1">Only admins can change role values. Use role keys like <code>admin</code> or <code>store_incharge</code>.</div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button type="button" onClick={() => { setMessage(null); setErrors({}); }} className="px-4 py-2 border rounded">Reset</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
