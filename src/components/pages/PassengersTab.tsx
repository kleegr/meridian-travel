'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid, fmtDate } from '@/lib/utils';
import { parsePassportImage } from '@/lib/passport-parser';
import { PASSENGER_FIELDS } from '@/components/forms/field-configs';
import { FormModal } from '@/components/ui';
import type { Itinerary, FormField } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onUpdate: (u: Itinerary) => void;
}

function toFD(item: any): Record<string, string> {
  const d: Record<string, string> = {};
  Object.entries(item).forEach(([k, v]) => { if (v != null) d[k] = String(v); });
  return d;
}

/* Custom passenger form with passport upload at the top */
function PassengerFormModal({ title, initial, onSave, onClose }: { title: string; initial?: Record<string, string>; onSave: (d: Record<string, string>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Record<string, string>>(initial || {});
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const data = await parsePassportImage(file);
      if (data && Object.keys(data).length > 0) {
        if (data.name) set('name', data.name);
        if (data.passport) set('passport', data.passport);
        if (data.passportExpiry) set('passportExpiry', data.passportExpiry);
        if (data.nationality) set('nationality', data.nationality);
        if (data.dob) set('dob', data.dob);
        if (data.gender) set('gender', data.gender);
        setScanned(true);
      }
    } catch (err) { console.error('Passport scan error:', err); }
    setScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: GHL.border }}>
          <div><h2 className="text-xl font-bold" style={{ color: GHL.text }}>{title}</h2><p className="text-sm mt-0.5" style={{ color: GHL.muted }}>Upload passport to auto-fill fields</p></div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Passport Upload Section */}
          <div className="border-2 border-dashed rounded-xl p-4 text-center transition-colors" style={{ borderColor: scanning ? GHL.accent : scanned ? '#10b981' : GHL.border, background: scanned ? '#f0fdf4' : '#fafbfc' }}>
            <input type="file" accept="image/*,.pdf" onChange={handlePassportUpload} className="hidden" id="passport-upload-modal" />
            <label htmlFor="passport-upload-modal" className="cursor-pointer block">
              {scanning ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} />
                  <span className="text-sm font-medium" style={{ color: GHL.accent }}>Scanning passport...</span>
                </div>
              ) : scanned ? (
                <div className="flex items-center justify-center gap-2">
                  <Icon n="check" c="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Passport scanned — fields auto-filled!</span>
                  <span className="text-xs text-green-500 underline ml-2">Upload another</span>
                </div>
              ) : (
                <div>
                  <Icon n="download" c="w-6 h-6 mx-auto mb-1" />
                  <p className="text-sm font-medium" style={{ color: GHL.text }}>Upload Passport Photo</p>
                  <p className="text-xs mt-0.5" style={{ color: GHL.muted }}>Image or PDF — auto-fills name, passport #, DOB, nationality, expiry</p>
                </div>
              )}
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lc} style={{ color: GHL.muted }}>Full Name *</label>
              <input value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="John Doe" className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Date of Birth</label>
              <input type="date" value={form.dob || ''} onChange={(e) => set('dob', e.target.value)} className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Gender</label>
              <select value={form.gender || ''} onChange={(e) => set('gender', e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                <option value="">Select...</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Passport #</label>
              <input value={form.passport || ''} onChange={(e) => set('passport', e.target.value)} placeholder="US123456" className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Passport Expiry</label>
              <input type="date" value={form.passportExpiry || ''} onChange={(e) => set('passportExpiry', e.target.value)} className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Nationality</label>
              <input value={form.nationality || ''} onChange={(e) => set('nationality', e.target.value)} placeholder="American" className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Phone</label>
              <input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555-0101" className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div className="col-span-2">
              <label className={lc} style={{ color: GHL.muted }}>Email</label>
              <input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="john@email.com" className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div className="col-span-2">
              <label className={lc} style={{ color: GHL.muted }}>Special Requests</label>
              <input value={form.specialRequests || ''} onChange={(e) => set('specialRequests', e.target.value)} placeholder="Aisle seat, dietary needs..." className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div className="col-span-2">
              <label className={lc} style={{ color: GHL.muted }}>Emergency Contact</label>
              <input value={form.emergencyContact || ''} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="Jane Doe +1 555-0102" className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div className="col-span-2">
              <label className={lc} style={{ color: GHL.muted }}>Notes</label>
              <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Additional notes..." className={ic + ' resize-none'} style={{ borderColor: GHL.border }} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-200" style={{ color: GHL.muted }}>Cancel</button>
          <button onClick={() => onSave(form)} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 shadow-sm" style={{ background: GHL.accent }}>
            <span className="flex items-center gap-2"><Icon n="save" c="w-4 h-4" /> Save Passenger</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PassengersTab({ itin, onUpdate }: Props) {
  const [addModal, setAddModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const handleAdd = (data: Record<string, string>) => {
    const p = { ...data, id: uid() } as any;
    onUpdate({ ...itin, passengerList: [...itin.passengerList, p], passengers: itin.passengerList.length + 1 });
    setAddModal(false);
  };

  const handleEdit = (data: Record<string, string>) => {
    if (editId === null) return;
    onUpdate({ ...itin, passengerList: itin.passengerList.map((p) => p.id === editId ? { ...p, ...data, id: editId } as any : p) });
    setEditId(null);
  };

  const handleDelete = (id: number) => {
    onUpdate({ ...itin, passengerList: itin.passengerList.filter((p) => p.id !== id), passengers: itin.passengerList.length - 1 });
  };

  const editingPassenger = editId !== null ? itin.passengerList.find((p) => p.id === editId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: GHL.text }}>Passengers</h3>
        <button onClick={() => setAddModal(true)} className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg" style={{ color: GHL.accent }}>
          <Icon n="plus" c="w-4 h-4" /> Add Passenger
        </button>
      </div>

      {itin.passengerList.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: GHL.accent }}>
                {p.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: GHL.text }}>{p.name}</p>
                <p className="text-xs" style={{ color: GHL.muted }}>{p.nationality || 'Nationality not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditId(p.id)} className="p-1.5 rounded hover:bg-blue-50 transition-colors" style={{ color: GHL.muted }} title="Edit passenger">
                <Icon n="edit" c="w-4 h-4" />
              </button>
              <button onClick={() => { if (confirm(`Remove ${p.name}?`)) handleDelete(p.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Remove passenger">
                <Icon n="trash" c="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ['DOB', fmtDate(p.dob)],
              ['Gender', p.gender || '--'],
              ['Passport', p.passport || '--'],
              ['Expiry', fmtDate(p.passportExpiry)],
              ['Phone', p.phone || '--'],
              ['Email', p.email || '--'],
              ['Requests', p.specialRequests || '--'],
              ['Emergency', p.emergencyContact || '--'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs" style={{ color: GHL.muted }}>{k}</p>
                <p className="font-medium truncate" style={{ color: GHL.text }}>{v || '--'}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!itin.passengerList.length && (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: GHL.border }}>
          <Icon n="users" c="w-8 h-8 mx-auto mb-3" />
          <p className="font-semibold" style={{ color: GHL.text }}>No passengers yet</p>
          <p className="text-sm mt-1" style={{ color: GHL.muted }}>Add travelers and upload passport photos to auto-fill</p>
          <button onClick={() => setAddModal(true)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: GHL.accent }}>
            <Icon n="plus" c="w-4 h-4" /> Add Passenger
          </button>
        </div>
      )}

      {/* Add Passenger — custom form with passport upload */}
      {addModal && <PassengerFormModal title="Add Passenger" onSave={handleAdd} onClose={() => setAddModal(false)} />}

      {/* Edit Passenger — custom form with passport upload + pre-filled data */}
      {editId !== null && editingPassenger && <PassengerFormModal title="Edit Passenger" initial={toFD(editingPassenger)} onSave={handleEdit} onClose={() => setEditId(null)} />}
    </div>
  );
}
