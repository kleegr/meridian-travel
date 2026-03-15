'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import { parsePassportImage } from '@/lib/passport-parser';
import { PASSENGER_FIELDS } from '@/components/forms/field-configs';
import { FormModal } from '@/components/ui';
import type { Passenger, Itinerary } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onUpdate: (u: Itinerary) => void;
}

function toFD(item: any): Record<string, string> {
  const d: Record<string, string> = {};
  Object.entries(item).forEach(([k, v]) => { if (v != null) d[k] = String(v); });
  return d;
}

export default function PassengersTab({ itin, onUpdate }: Props) {
  const [addModal, setAddModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [scanningId, setScanningId] = useState<number | null>(null);

  const handleAdd = (data: Record<string, string>) => {
    const p = { ...data, id: uid() } as any;
    const u = { ...itin, passengerList: [...itin.passengerList, p], passengers: itin.passengerList.length + 1 };
    onUpdate(u);
    setAddModal(false);
  };

  const handleEdit = (data: Record<string, string>) => {
    if (editId === null) return;
    onUpdate({ ...itin, passengerList: itin.passengerList.map((p) => p.id === editId ? { ...p, ...data, id: editId } as any : p) });
    setEditId(null);
  };

  const handleDelete = (id: number) => {
    const u = { ...itin, passengerList: itin.passengerList.filter((p) => p.id !== id), passengers: itin.passengerList.length - 1 };
    onUpdate(u);
  };

  const handlePassportUpload = useCallback(async (passengerId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningId(passengerId);
    try {
      const data = await parsePassportImage(file);
      if (data && Object.keys(data).length > 0) {
        onUpdate({
          ...itin,
          passengerList: itin.passengerList.map((p) => {
            if (p.id !== passengerId) return p;
            return {
              ...p,
              name: data.name || p.name,
              passport: data.passport || p.passport,
              passportExpiry: data.passportExpiry || p.passportExpiry,
              nationality: data.nationality || p.nationality,
              dob: data.dob || p.dob,
              gender: data.gender || p.gender,
            };
          }),
        });
      }
    } catch (err) { console.error('Passport scan error:', err); }
    setScanningId(null);
  }, [itin, onUpdate]);

  const fmtDate = (d: string) => { if (!d) return '--'; try { return new Date(d + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; } };
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
              {/* Passport Upload */}
              <input type="file" accept="image/*" className="hidden" id={`passport-upload-${p.id}`} onChange={(e) => handlePassportUpload(p.id, e)} />
              <label htmlFor={`passport-upload-${p.id}`} className="p-1.5 rounded hover:bg-blue-50 cursor-pointer transition-colors" style={{ color: scanningId === p.id ? GHL.accent : GHL.muted }} title="Upload passport photo">
                {scanningId === p.id ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /> : <Icon n="download" c="w-4 h-4" />}
              </label>
              {/* Edit */}
              <button onClick={() => setEditId(p.id)} className="p-1.5 rounded hover:bg-blue-50 transition-colors" style={{ color: GHL.muted }} title="Edit passenger">
                <Icon n="edit" c="w-4 h-4" />
              </button>
              {/* Delete */}
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
                <p className="font-medium truncate" style={{ color: GHL.text }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Passport upload hint */}
          {!p.passport && (
            <label htmlFor={`passport-upload-${p.id}`} className="mt-3 flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border-2 border-dashed hover:border-blue-300 transition-colors" style={{ borderColor: GHL.border, background: '#fafbfc' }}>
              <Icon n="download" c="w-4 h-4" />
              <div>
                <p className="text-xs font-medium" style={{ color: GHL.text }}>Upload Passport Photo</p>
                <p className="text-[10px]" style={{ color: GHL.muted }}>Auto-fills name, passport #, DOB, nationality, expiry</p>
              </div>
            </label>
          )}
        </div>
      ))}

      {!itin.passengerList.length && (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: GHL.border }}>
          <Icon n="users" c="w-8 h-8 mx-auto mb-3" />
          <p className="font-semibold" style={{ color: GHL.text }}>No passengers yet</p>
          <p className="text-sm mt-1" style={{ color: GHL.muted }}>Add travelers or upload a passport photo to auto-fill</p>
          <button onClick={() => setAddModal(true)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: GHL.accent }}>
            <Icon n="plus" c="w-4 h-4" /> Add Passenger
          </button>
        </div>
      )}

      {/* Add Modal */}
      {addModal && <FormModal title="Add Passenger" fields={PASSENGER_FIELDS} onSave={handleAdd} onClose={() => setAddModal(false)} />}

      {/* Edit Modal */}
      {editId !== null && editingPassenger && <FormModal title="Edit Passenger" fields={PASSENGER_FIELDS} onSave={handleEdit} onClose={() => setEditId(null)} initial={toFD(editingPassenger)} />}
    </div>
  );
}
