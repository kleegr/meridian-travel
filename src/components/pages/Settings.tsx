'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { AgencyProfile, CustomField } from '@/lib/types';

interface SettingsProps {
  bookingSources: string[];
  setBookingSources: (v: string[]) => void;
  suppliers: string[];
  setSuppliers: (v: string[]) => void;
  statusLabels: string[];
  setStatusLabels: (v: string[]) => void;
  agencyProfile: AgencyProfile;
  setAgencyProfile: (v: AgencyProfile) => void;
  customFields: CustomField[];
  setCustomFields: (v: CustomField[]) => void;
}

const SECTIONS = [
  ['Agency Profile', 'Company name, contact details &mdash; shown in sidebar and print view', 'globe'],
  ['Status Labels', 'These become your itinerary board columns &mdash; add, remove or reorder', 'kanban'],
  ['Custom Fields', 'Add extra fields to any module', 'edit'],
  ['Booking Sources', 'GDS, OTA, direct channels', 'plane'],
  ['Supplier Directory', 'Preferred suppliers list', 'hotel'],
];

export default function Settings(props: SettingsProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');

  const addToList = (list: string[], setList: (v: string[]) => void) => { if (!newItem.trim()) return; setList([...list, newItem.trim()]); setNewItem(''); };
  const removeFromList = (list: string[], setList: (v: string[]) => void, idx: number) => { setList(list.filter((_, i) => i !== idx)); };

  if (activeSection) {
    return (
      <div className="space-y-5">
        <button onClick={() => { setActiveSection(null); setNewItem(''); }} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><Icon n="back" c="w-4 h-4" /> Back to Settings</button>

        {activeSection === 'Agency Profile' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1 text-lg">Agency Profile</h3>
            <p className="text-sm text-gray-400 mb-4">This information appears in the sidebar and on printed itineraries</p>
            <div className="grid grid-cols-2 gap-4">
              {[['name', 'Agency Name'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address']].map(([k, l]) => (
                <div key={k}><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{l}</label><input value={(props.agencyProfile as any)[k]} onChange={(e) => props.setAgencyProfile({ ...props.agencyProfile, [k]: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white" /></div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'Status Labels' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1 text-lg">Status Labels</h3>
            <p className="text-sm text-gray-400 mb-4">These labels become the columns on your Itinerary board. Drag itineraries between columns to change status.</p>
            <div className="space-y-2 mb-4">
              {props.statusLabels.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>{idx + 1}</span>
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                  <button onClick={() => removeFromList(props.statusLabels, props.setStatusLabels, idx)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addToList(props.statusLabels, props.setStatusLabels)} placeholder="Add new status label..." className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
              <button onClick={() => addToList(props.statusLabels, props.setStatusLabels)} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button>
            </div>
          </div>
        )}

        {['Booking Sources', 'Supplier Directory'].includes(activeSection) && (() => {
          const list = activeSection === 'Booking Sources' ? props.bookingSources : props.suppliers;
          const setList = activeSection === 'Booking Sources' ? props.setBookingSources : props.setSuppliers;
          return (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">{activeSection}</h3>
              <div className="space-y-2 mb-4">{list.map((item, idx) => (<div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><span className="text-sm text-gray-700">{item}</span><button onClick={() => removeFromList(list, setList, idx)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>))}</div>
              <div className="flex gap-2"><input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addToList(list, setList)} placeholder="Add new..." className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" /><button onClick={() => addToList(list, setList)} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div>
            </div>
          );
        })()}

        {activeSection === 'Custom Fields' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Custom Fields</h3>
            <div className="space-y-2 mb-4">{props.customFields.map((f) => (<div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50"><div><span className="text-sm font-medium text-gray-700">{f.name}</span><span className="text-xs text-gray-400 ml-2">{f.module} &middot; {f.type}</span></div><button onClick={() => props.setCustomFields(props.customFields.filter((x) => x.id !== f.id))} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>))}</div>
            <div className="flex gap-2">
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Field name..." className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
              <select id="cf-module" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"><option>Itinerary</option><option>Flight</option><option>Hotel</option><option>Transport</option></select>
              <select id="cf-type" className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"><option>Text</option><option>Number</option><option>Date</option><option>Dropdown</option><option>Checkbox</option></select>
              <button onClick={() => { if (!newItem.trim()) return; const mod = (document.getElementById('cf-module') as HTMLSelectElement).value; const tp = (document.getElementById('cf-type') as HTMLSelectElement).value; props.setCustomFields([...props.customFields, { id: uid(), name: newItem.trim(), module: mod, type: tp }]); setNewItem(''); }} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold text-gray-900 mb-1">Settings</h2><p className="text-gray-400 text-sm">Configure your workspace</p></div>
      {SECTIONS.map(([t, d, ic]) => (
        <div key={t} onClick={() => setActiveSection(t)} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <span style={{ color: GHL.accent }}><Icon n={ic} c="w-5 h-5" /></span>
            <div><p className="font-semibold text-gray-900">{t}</p><p className="text-sm text-gray-400 mt-0.5" dangerouslySetInnerHTML={{ __html: d }} /></div>
          </div>
          <Icon n="chevronRight" c="w-5 h-5 text-gray-300" />
        </div>
      ))}
    </div>
  );
}
