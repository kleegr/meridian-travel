'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { AGENTS, STATUSES, GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { Itinerary, ChecklistTemplate } from '@/lib/types';

interface Props { onClose: () => void; onCreate: (i: Itinerary) => void; checklistTemplates: ChecklistTemplate[]; }

export default function NewItineraryModal({ onClose, onCreate, checklistTemplates }: Props) {
  const [destinations, setDestinations] = useState<string[]>(['']);
  const [isVip, setIsVip] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(checklistTemplates[0]?.id || 0);

  const fields = [
    { key: 'title', label: 'Trip Name', placeholder: 'e.g. Amalfi Coast Adventure', required: true, half: false },
    { key: 'client', label: 'Client', placeholder: 'Johnson Family', required: true },
    { key: 'agent', label: 'Agent', type: 'select', options: AGENTS },
    { key: 'startDate', label: 'Departure', type: 'date' },
    { key: 'endDate', label: 'Return', type: 'date' },
    { key: 'passengers', label: 'Passengers', type: 'number', placeholder: '2' },
    { key: 'status', label: 'Status', type: 'select', options: STATUSES },
    { key: 'tags', label: 'Tags', placeholder: 'Luxury, Family', half: false },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Special requests...', half: false },
  ];

  const handleSave = (data: Record<string, string>) => {
    if (!data.title || !data.client) { alert('Please fill in Trip Name and Client.'); return; }
    const dests = destinations.filter((d) => d.trim());
    const tpl = checklistTemplates.find((t) => t.id === selectedTemplate);
    const checklist = (tpl?.items || []).map((text, i) => ({ id: uid() + i, text, done: false }));
    if (isVip && !checklist.some((c) => c.text.toLowerCase().includes('vip'))) checklist.push({ id: uid(), text: 'Send VIP welcome gift', done: false });
    onCreate({
      id: uid(), title: data.title, client: data.client, agent: data.agent || AGENTS[0],
      startDate: data.startDate, endDate: data.endDate,
      destinations: dests.length > 0 ? dests : [''], destination: dests.join(', ') || '',
      status: data.status || 'Draft', passengers: parseInt(data.passengers) || 2,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: data.notes, created: new Date().toISOString().split('T')[0],
      isVip, destinationInfo: [], checklistTemplateId: selectedTemplate,
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
          {/* Destinations */}
          <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>Destination(s) *</label>{destinations.map((d, i) => (<div key={i} className="flex gap-2 mb-2"><input value={d} onChange={(e) => { const nd = [...destinations]; nd[i] = e.target.value; setDestinations(nd); }} placeholder={`Destination ${i + 1}`} className={ic} style={{ borderColor: GHL.border }} />{destinations.length > 1 && <button onClick={() => setDestinations(destinations.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-4 h-4" /></button>}</div>))}<button onClick={() => setDestinations([...destinations, ''])} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: GHL.accent }}><Icon n="plus" c="w-3.5 h-3.5" /> Add Destination</button></div>

          {/* VIP */}
          <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: isVip ? '#fefce8' : GHL.bg, border: isVip ? '1px solid #fde68a' : `1px solid ${GHL.border}` }} onClick={() => setIsVip(!isVip)}><button className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={isVip ? { background: '#d97706', borderColor: '#d97706' } : { borderColor: '#d1d5db' }}>{isVip && <Icon n="check" c="w-3 h-3 text-white" />}</button><div><p className="text-sm font-semibold" style={{ color: GHL.text }}>VIP Client</p><p className="text-xs" style={{ color: GHL.muted }}>Adds gift reminder to checklist</p></div></div>

          {/* Checklist Template Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>Checklist Template</label>
            <div className="flex flex-wrap gap-2">
              {checklistTemplates.map((tpl) => (
                <button key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)} className="px-3 py-2 rounded-lg text-sm font-medium border transition-all" style={selectedTemplate === tpl.id ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}>
                  {tpl.name}
                  <span className="ml-1 text-xs opacity-60">({tpl.items.length})</span>
                </button>
              ))}
            </div>
            {selectedTemplate > 0 && (() => { const tpl = checklistTemplates.find((t) => t.id === selectedTemplate); return tpl ? <div className="mt-2 p-3 rounded-lg text-xs" style={{ background: GHL.bg }}><p className="font-semibold mb-1" style={{ color: GHL.text }}>{tpl.name} includes:</p><p style={{ color: GHL.muted }}>{tpl.items.join(' \u2022 ')}</p></div> : null; })()}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">{fields.map((f) => (<div key={f.key} className={(f as any).half === false ? 'col-span-2' : ''} id={`nif-${f.key}`}><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>{f.label}{f.required ? ' *' : ''}</label>{f.type === 'select' ? <select defaultValue={f.options?.[0]} className={ic + ' bg-white'} style={{ borderColor: GHL.border }}><option value="">Select...</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select> : f.type === 'textarea' ? <textarea rows={3} placeholder={f.placeholder} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /> : <input type={f.type || 'text'} placeholder={f.placeholder} className={ic} style={{ borderColor: GHL.border }} />}</div>))}</div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-200" style={{ color: GHL.muted }}>Cancel</button>
          <button onClick={() => { const data: Record<string, string> = {}; fields.forEach((f) => { const el = document.getElementById(`nif-${f.key}`); if (el) { const input = el.querySelector('input, select, textarea') as HTMLInputElement; if (input) data[f.key] = input.value; } }); handleSave(data); }} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 shadow-sm" style={{ background: GHL.accent }}>Create Itinerary</button>
        </div>
      </div>
    </div>
  );
}
