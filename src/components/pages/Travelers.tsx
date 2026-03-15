'use client';

import { useState, useMemo } from 'react';
import { Icon, StatusBadge } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
import { PASSENGER_FIELDS } from '@/components/forms/field-configs';
import { FormModal } from '@/components/ui';
import type { Itinerary, Passenger } from '@/lib/types';

interface TravelersProps {
  itineraries: Itinerary[];
  onSelectItinerary: (id: number) => void;
  onUpdateItinerary?: (updated: Itinerary) => void;
}

function toFD(item: any): Record<string, string> { const d: Record<string, string> = {}; Object.entries(item).forEach(([k, v]) => { if (v != null) d[k] = String(v); }); return d; }

export default function Travelers({ itineraries, onSelectItinerary, onUpdateItinerary }: TravelersProps) {
  const [search, setSearch] = useState('');
  const [selectedTraveler, setSelectedTraveler] = useState<{ name: string; trips: Itinerary[]; passenger: Passenger } | null>(null);
  const [editModal, setEditModal] = useState(false);

  const travelers = useMemo(() => {
    const map = new Map<string, { passenger: Passenger; trips: Itinerary[] }>();
    itineraries.forEach((i) => { i.passengerList.forEach((p) => { const key = p.name.toLowerCase(); if (!map.has(key)) map.set(key, { passenger: p, trips: [] }); map.get(key)!.trips.push(i); }); });
    return Array.from(map.values()).filter((t) => !search || t.passenger.name.toLowerCase().includes(search.toLowerCase()) || t.passenger.email.toLowerCase().includes(search.toLowerCase()));
  }, [itineraries, search]);

  const handleEditSave = (data: Record<string, string>) => {
    if (!selectedTraveler || !onUpdateItinerary) return;
    // Update this traveler across ALL their itineraries
    const oldName = selectedTraveler.passenger.name.toLowerCase();
    selectedTraveler.trips.forEach((itin) => {
      const updated = {
        ...itin,
        passengerList: itin.passengerList.map((p) =>
          p.name.toLowerCase() === oldName ? { ...p, ...data, id: p.id } as any : p
        ),
      };
      onUpdateItinerary(updated);
    });
    // Update local state
    setSelectedTraveler({ ...selectedTraveler, passenger: { ...selectedTraveler.passenger, ...data } as any });
    setEditModal(false);
  };

  if (selectedTraveler) {
    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedTraveler(null)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><Icon n="back" c="w-4 h-4" /> Back to Travelers</button>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg" style={{ background: GHL.accent }}>{selectedTraveler.passenger.name.split(' ').map((n) => n[0]).join('')}</div>
              <div><h2 className="text-xl font-bold text-gray-900">{selectedTraveler.passenger.name}</h2><p className="text-gray-400 text-sm">{selectedTraveler.passenger.nationality} &middot; {selectedTraveler.passenger.email}</p></div>
            </div>
            {onUpdateItinerary && <button onClick={() => setEditModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.accent }}><Icon n="edit" c="w-4 h-4" /> Edit Traveler</button>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[['Phone', selectedTraveler.passenger.phone], ['DOB', fmtDate(selectedTraveler.passenger.dob)], ['Passport', selectedTraveler.passenger.passport], ['Expires', fmtDate(selectedTraveler.passenger.passportExpiry)], ['Gender', selectedTraveler.passenger.gender], ['Emergency', selectedTraveler.passenger.emergencyContact], ['Requests', selectedTraveler.passenger.specialRequests]].map(([k, v]) => (
              <div key={k}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="font-semibold text-gray-800">{v || '--'}</p></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Associated Itineraries ({selectedTraveler.trips.length})</h3></div>
          {selectedTraveler.trips.map((i) => { const fin = calcFin(i); return (
            <div key={i.id} onClick={() => onSelectItinerary(i.id)} className="flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-teal-50/20 cursor-pointer transition-colors">
              <div><p className="font-semibold text-gray-900">{i.title}</p><p className="text-xs text-gray-400">{i.destination} &middot; {fmtDate(i.startDate)} to {fmtDate(i.endDate)}</p></div>
              <div className="flex items-center gap-3"><StatusBadge status={i.status} /><span className="font-semibold text-sm" style={{ color: GHL.success }}>{fmt(fin.profit)}</span></div>
            </div>
          ); })}
        </div>
        {editModal && <FormModal title="Edit Traveler" fields={PASSENGER_FIELDS} initial={toFD(selectedTraveler.passenger)} onSave={handleEditSave} onClose={() => setEditModal(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold text-gray-900 mb-1">Travelers</h2><p className="text-gray-400 text-sm">{travelers.length} travelers found</p></div>
      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icon n="search" c="w-4 h-4" /></span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search travelers by name or email..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {travelers.map((t) => (
          <div key={t.passenger.name} onClick={() => setSelectedTraveler({ name: t.passenger.name, trips: t.trips, passenger: t.passenger })} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: GHL.accent }}>{t.passenger.name.split(' ').map((n) => n[0]).join('')}</div>
              <div><p className="font-bold text-gray-900">{t.passenger.name}</p><p className="text-xs text-gray-400">{t.passenger.nationality} &middot; {t.passenger.email || '--'}</p></div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2"><Icon n="map" c="w-3.5 h-3.5" />{t.trips.length} trip{t.trips.length !== 1 ? 's' : ''}</div>
            <div className="flex gap-1 flex-wrap">{t.trips.map((tr) => (<span key={tr.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">{tr.title}</span>))}</div>
          </div>
        ))}
        {travelers.length === 0 && <div className="col-span-full bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm"><Icon n="users" c="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">No travelers found. Add passengers to itineraries first.</p></div>}
      </div>
    </div>
  );
}
