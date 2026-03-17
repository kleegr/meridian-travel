'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui';
import GooglePlacesInput from '@/components/ui/GooglePlacesInput';
import { STATUSES, GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { Itinerary, ChecklistTemplate, PackageTemplate } from '@/lib/types';

let axios: any = null;
try { axios = require('axios').default || require('axios'); } catch {}

interface GHLContact { id: string; name: string; email: string; phone: string; tags: string[]; address?: string; city?: string; state?: string; country?: string; }
interface Props { onClose: () => void; onCreate: (i: Itinerary) => void; checklistTemplates: ChecklistTemplate[]; packages?: PackageTemplate[]; agents?: string[]; locationId?: string | null; }

function MultiFieldGeo({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>{label}</label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <GooglePlacesInput value={v} onChange={(nv) => { const a = [...values]; a[i] = nv; onChange(a); }} placeholder={placeholder} className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          {values.length > 1 && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(values.filter((_, j) => j !== i)); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex-shrink-0"><Icon n="trash" c="w-3.5 h-3.5" /></button>}
        </div>
      ))}
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange([...values, '']); }} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}><Icon n="plus" c="w-3 h-3" /> Add</button>
    </div>
  );
}

function MultiField({ label, values, onChange, placeholder, type }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string; type?: string }) {
  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>{label}</label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input type={type || 'text'} value={v} onChange={(e) => { const nv = [...values]; nv[i] = e.target.value; onChange(nv); }} placeholder={placeholder} className={ic} style={{ borderColor: GHL.border }} />
          {values.length > 1 && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(values.filter((_, j) => j !== i)); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex-shrink-0"><Icon n="trash" c="w-3.5 h-3.5" /></button>}
        </div>
      ))}
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange([...values, '']); }} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}><Icon n="plus" c="w-3 h-3" /> Add</button>
    </div>
  );
}

function DestinationField({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>{label}</label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <GooglePlacesInput value={v} onChange={(nv) => { const a = [...values]; a[i] = nv; onChange(a); }} placeholder={placeholder} className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" types="(cities)" />
          {values.length > 1 && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(values.filter((_, j) => j !== i)); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex-shrink-0"><Icon n="trash" c="w-3.5 h-3.5" /></button>}
        </div>
      ))}
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange([...values, '']); }} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}><Icon n="plus" c="w-3 h-3" /> Add Destination</button>
    </div>
  );
}

export default function NewItineraryModal({ onClose, onCreate, checklistTemplates, packages = [], agents = [], locationId }: Props) {
  const [destinations, setDestinations] = useState<string[]>(['']);
  const [phones, setPhones] = useState<string[]>(['']);
  const [emails, setEmails] = useState<string[]>(['']);
  const [addresses, setAddresses] = useState<string[]>(['']);
  const [isVip, setIsVip] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(checklistTemplates[0]?.id || 0);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');

  const selectPackage = (pkg: PackageTemplate | null) => {
    if (!pkg) { setSelectedPackageId(null); setSelectedTags([]); return; }
    setSelectedPackageId(pkg.id);
    setDestinations(pkg.destinations.length > 0 ? [...pkg.destinations] : ['']);
    setSelectedTags(pkg.tags || []);
  };

  const fields = [
    { key: 'title', label: 'Trip Name', placeholder: 'e.g. Amalfi Coast Adventure', required: true, half: false },
    { key: 'agent', label: 'Agent', type: 'select', options: agents.length > 0 ? agents : ['Sarah Chen'] },
    { key: 'startDate', label: 'Departure', type: 'date' },
    { key: 'endDate', label: 'Return', type: 'date' },
    { key: 'passengers', label: 'Passengers', type: 'number', placeholder: '2' },
    { key: 'status', label: 'Status', type: 'select', options: STATUSES },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Special requests...', half: false },
  ];

  const handleSave = async (data: Record<string, string>) => {
    if (!data.title || !clientName) { alert('Please fill in Trip Name and Client.'); return; }
    const dests = destinations.filter((d) => d.trim());
    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    let checklistItems: string[] = [];
    if (selectedPkg) { checklistItems = selectedPkg.checklist; } else { const tpl = checklistTemplates.find((t) => t.id === selectedTemplate); checklistItems = tpl?.items || []; }
    const checklist = checklistItems.map((text, i) => ({ id: uid() + i, text, done: false, notes: [] }));
    if (isVip && !checklist.some((c) => c.text.toLowerCase().includes('vip'))) checklist.push({ id: uid(), text: 'Send VIP welcome gift', done: false, notes: [] });

    let endDate = data.endDate;
    if (!endDate && selectedPkg && data.startDate) { const d = new Date(data.startDate); d.setDate(d.getDate() + selectedPkg.duration); endDate = d.toISOString().split('T')[0]; }

    const finalPhones = phones.filter((p) => p.trim());
    const finalEmails = emails.filter((e) => e.trim());
    const finalAddresses = addresses.filter((a) => a.trim());

    // Upsert contact to GHL if available
    if (locationId && clientName && axios) {
      const nameParts = clientName.trim().split(/\s+/);
      const addrParts = finalAddresses[0]?.split(',').map((s) => s.trim()) || [];
      axios.post('/api/contacts', { locationId, firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '', email: finalEmails[0] || '', phone: finalPhones[0] || '', tags: selectedTags, tripName: data.title, destinations: dests.join(', '), startDate: data.startDate, endDate, status: data.status || 'Draft', agent: data.agent || agents[0] || '', passengers: data.passengers || '2', notes: data.notes || '', isVip, address1: addrParts[0] || '', city: addrParts[1] || '', state: addrParts[2] || '', country: addrParts[3] || '' }).catch(() => {});
    }

    onCreate({
      id: uid(), title: data.title, client: clientName, agent: data.agent || agents[0] || '',
      startDate: data.startDate, endDate,
      destinations: dests.length > 0 ? dests : [''], destination: dests.join(', ') || '',
      clientPhones: finalPhones, clientEmails: finalEmails, clientAddresses: finalAddresses,
      status: data.status || 'Draft', passengers: parseInt(data.passengers) || 2,
      tags: selectedTags, notes: data.notes, created: new Date().toISOString().split('T')[0],
      isVip, destinationInfo: [],
      checklistTemplateId: selectedPkg ? undefined : selectedTemplate,
      packageTemplateId: selectedPkg?.id, tripType: selectedPkg?.tripType,
      passengerList: [], flights: [], hotels: [], transport: [], attractions: [],
      insurance: [], carRentals: [], davening: [], mikvah: [], deposits: 0, checklist,
    });
    onClose();
  };

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: GHL.border }}>
          <div><h2 className="text-xl font-bold" style={{ color: GHL.text }}>New Itinerary</h2><p className="text-sm mt-0.5" style={{ color: GHL.muted }}>Create a new trip file</p></div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Package Selector */}
          {packages.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>Start from Package <span className="font-normal normal-case">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => selectPackage(null)} className="px-3 py-2 rounded-lg text-sm font-medium border transition-all" style={!selectedPackageId ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}>Blank</button>
                {packages.map((pkg) => (
                  <button key={pkg.id} onClick={() => selectPackage(pkg)} className="px-3 py-2 rounded-lg text-sm font-medium border transition-all" style={selectedPackageId === pkg.id ? { background: '#ecfdf5', borderColor: '#10b981', color: '#059669' } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}>
                    <Icon n="globe" c="w-3 h-3 inline mr-1" />{pkg.name} <span className="text-xs opacity-60">({pkg.duration}N)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Destinations with Google Places */}
          <DestinationField label="Destination(s) *" values={destinations} onChange={setDestinations} placeholder="Search city..." />

          {/* VIP toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: isVip ? '#fefce8' : GHL.bg, border: isVip ? '1px solid #fde68a' : `1px solid ${GHL.border}` }} onClick={() => setIsVip(!isVip)}><button className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={isVip ? { background: '#d97706', borderColor: '#d97706' } : { borderColor: '#d1d5db' }}>{isVip && <Icon n="check" c="w-3 h-3 text-white" />}</button><div><p className="text-sm font-semibold" style={{ color: GHL.text }}>VIP Client</p><p className="text-xs" style={{ color: GHL.muted }}>Adds gift reminder to checklist</p></div></div>

          {/* Checklist template */}
          {!selectedPackageId && checklistTemplates.length > 0 && (
            <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>Checklist Template</label><div className="flex flex-wrap gap-2">{checklistTemplates.map((tpl) => (<button key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)} className="px-3 py-2 rounded-lg text-sm font-medium border transition-all" style={selectedTemplate === tpl.id ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}>{tpl.name} <span className="text-xs opacity-60">({tpl.items.length})</span></button>))}</div></div>
          )}

          {/* Client Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>Client Name *</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Johnson Family" className={ic} style={{ borderColor: GHL.border }} />
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-4">{fields.map((f) => (<div key={f.key} className={(f as any).half === false ? 'col-span-2' : ''} id={`nif-${f.key}`}><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>{f.label}{f.required ? ' *' : ''}</label>{f.type === 'select' ? <select defaultValue={f.options?.[0]} className={ic + ' bg-white'} style={{ borderColor: GHL.border }}><option value="">Select...</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select> : f.type === 'textarea' ? <textarea rows={3} placeholder={f.placeholder} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /> : <input type={f.type || 'text'} placeholder={f.placeholder} className={ic} style={{ borderColor: GHL.border }} />}</div>))}</div>

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-4">
            <MultiField label="Phone Number(s)" values={phones} onChange={setPhones} placeholder="+1 555-0101" type="tel" />
            <MultiField label="Email Address(es)" values={emails} onChange={setEmails} placeholder="client@email.com" type="email" />
          </div>

          {/* Address with Google Places */}
          <MultiFieldGeo label="Address(es)" values={addresses} onChange={setAddresses} placeholder="Search address..." />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-200" style={{ color: GHL.muted }}>Cancel</button>
          <button onClick={() => { const data: Record<string, string> = {}; fields.forEach((f) => { const el = document.getElementById(`nif-${f.key}`); if (el) { const input = el.querySelector('input, select, textarea') as HTMLInputElement; if (input) data[f.key] = input.value; } }); handleSave(data); }} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 shadow-sm" style={{ background: GHL.accent }}>Create Itinerary</button>
        </div>
      </div>
    </div>
  );
}
