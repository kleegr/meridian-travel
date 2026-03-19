'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Icon } from '@/components/ui';
import ContactSearch, { type GHLContact } from '@/components/ui/ContactSearch';
import { STATUSES, GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { Itinerary, ChecklistTemplate, PackageTemplate, Pipeline } from '@/lib/types';

interface Props {
  onClose: () => void;
  onCreate: (i: Itinerary) => Promise<boolean | void>;
  checklistTemplates: ChecklistTemplate[];
  packages?: PackageTemplate[];
  agents?: string[];
  locationId?: string | null;
  pipelines?: Pipeline[];
  activePipelineId?: number;
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

function TagSelector({ locationId, selectedTags, onTagsChange }: { locationId?: string | null; selectedTags: string[]; onTagsChange: (tags: string[]) => void }) {
  const [ghlTags, setGhlTags] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!locationId) return;
    setLoadingTags(true);
    axios.get(`/api/tags?locationId=${locationId}`)
      .then((res) => { if (res.data?.success && Array.isArray(res.data.tags)) setGhlTags(res.data.tags); })
      .catch(() => {})
      .finally(() => setLoadingTags(false));
  }, [locationId]);

  useEffect(() => { const handler = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowDropdown(false); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, []);

  const removeTag = (t: string) => onTagsChange(selectedTags.filter((s) => s !== t));
  const addTag = (t: string) => { if (!selectedTags.some((s) => s.toLowerCase() === t.toLowerCase())) onTagsChange([...selectedTags, t]); setSearch(''); };
  const handleCreateTag = () => { const t = search.trim(); if (!t) return; if (!ghlTags.find((g) => g.name.toLowerCase() === t.toLowerCase())) setGhlTags((p) => [...p, { id: `new-${Date.now()}`, name: t }]); addTag(t); };
  const filtered = ghlTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) && !selectedTags.some((s) => s.toLowerCase() === t.name.toLowerCase()));
  const exactMatch = ghlTags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase()) || selectedTags.some((t) => t.toLowerCase() === search.trim().toLowerCase());

  return (
    <div ref={wrapRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>Tags</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {selectedTags.map((tag) => (<span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent, border: `1px solid ${GHL.accent}` }}>{tag}<button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 ml-0.5">&times;</button></span>))}
        {selectedTags.length === 0 && <span className="text-xs py-1" style={{ color: GHL.muted }}>No tags selected</span>}
      </div>
      <div className="relative">
        <input ref={inputRef} type="text" value={search} onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!exactMatch && search.trim()) handleCreateTag(); else if (filtered.length > 0) addTag(filtered[0].name); } if (e.key === 'Escape') setShowDropdown(false); if (e.key === 'Backspace' && !search && selectedTags.length > 0) removeTag(selectedTags[selectedTags.length - 1]); }} placeholder={loadingTags ? 'Loading tags...' : 'Search or create tags...'} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} />
        {showDropdown && (search || ghlTags.length > 0) && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ borderColor: GHL.border }}>
            {filtered.length === 0 && !search.trim() && <div className="px-3 py-2 text-xs" style={{ color: GHL.muted }}>Type to search tags...</div>}
            {filtered.slice(0, 50).map((tag) => (<button key={tag.id} type="button" onClick={() => { addTag(tag.name); setShowDropdown(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors" style={{ color: GHL.text }}>{tag.name}</button>))}
            {search.trim() && !exactMatch && (<button type="button" onClick={() => { handleCreateTag(); setShowDropdown(false); }} className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-green-50 border-t" style={{ color: GHL.accent, borderColor: GHL.border }}><Icon n="plus" c="w-3 h-3 inline mr-1" /> Create &quot;{search.trim()}&quot;</button>)}
            {filtered.length === 0 && search.trim() && exactMatch && <div className="px-3 py-2 text-xs" style={{ color: GHL.muted }}>Tag already added</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewItineraryModal({ onClose, onCreate, checklistTemplates, packages = [], agents = [], locationId, pipelines = [], activePipelineId }: Props) {
  const [destinations, setDestinations] = useState<string[]>(['']);
  const [phones, setPhones] = useState<string[]>(['']);
  const [emails, setEmails] = useState<string[]>(['']);
  const [addresses, setAddresses] = useState<string[]>(['']);
  const [isVip, setIsVip] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(checklistTemplates[0]?.id || 0);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [selectedContact, setSelectedContact] = useState<GHLContact | null>(null);
  const [creating, setCreating] = useState(false);
  const [pipelineId, setPipelineId] = useState<number | null>(activePipelineId ?? (pipelines[0]?.id || null));
  const selectedPipeline = (pipelineId !== null ? pipelines.find((p) => p.id === pipelineId) : null) || pipelines[0];
  const stageOptions = selectedPipeline?.stages?.length ? selectedPipeline.stages : STATUSES;
  const [statusValue, setStatusValue] = useState<string>(stageOptions[0] || 'Draft');
  const [startDateValue, setStartDateValue] = useState<string>('');
  const [endDateValue, setEndDateValue] = useState<string>('');

  useEffect(() => { if (!stageOptions.includes(statusValue)) setStatusValue(stageOptions[0] || 'Draft'); }, [pipelineId]);

  const selectPackage = (pkg: PackageTemplate | null) => {
    if (!pkg) { setSelectedPackageId(null); setSelectedTags([]); return; }
    setSelectedPackageId(pkg.id);
    setDestinations(pkg.destinations.length > 0 ? [...pkg.destinations] : ['']);
    setSelectedTags(pkg.tags || []);
  };

  const handleContactSelect = (contact: GHLContact) => {
    setSelectedContact(contact);
    setClientName(contact.name);
    if (contact.phone) setPhones([contact.phone]);
    if (contact.email) setEmails([contact.email]);
    if (contact.address) {
      const fullAddr = [contact.address, contact.city, contact.state, contact.country].filter(Boolean).join(', ');
      setAddresses([fullAddr]);
    }
    if (contact.tags?.length) {
      setSelectedTags((prev) => { const merged = [...prev]; contact.tags.forEach((t) => { if (!merged.some((m) => m.toLowerCase() === t.toLowerCase())) merged.push(t); }); return merged; });
    }
  };

  const fields = [
    { key: 'title', label: 'Trip Name', placeholder: 'e.g. Amalfi Coast Adventure', required: true, half: false },
    { key: 'agent', label: 'Agent', type: 'select', options: agents, half: false },
    { key: 'pipelineId', label: 'Pipeline', type: 'select', options: [] },
    { key: 'status', label: 'Status', type: 'select', options: stageOptions },
    { key: 'startDate', label: 'Departure', type: 'date' },
    { key: 'endDate', label: 'Return', type: 'date' },
    { key: 'passengers', label: 'Passengers', type: 'number', placeholder: '2' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Special requests...', half: false },
  ];

  const handleSave = async (data: Record<string, string>) => {
    if (!data.title || !clientName) { alert('Please fill in Trip Name and Client.'); return false; }
    let contactIdForItinerary: string | undefined = selectedContact?.id;
    const dests = destinations.filter((d) => d.trim());
    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    let checklistItems: string[] = selectedPkg ? selectedPkg.checklist : (checklistTemplates.find((t) => t.id === selectedTemplate)?.items || []);
    const checklist = checklistItems.map((text, i) => ({ id: uid() + i, text, done: false, notes: [] }));
    if (isVip && !checklist.some((c) => c.text.toLowerCase().includes('vip'))) checklist.push({ id: uid(), text: 'Send VIP welcome gift', done: false, notes: [] });

    let endDate = data.endDate;
    if (!endDate && selectedPkg && data.startDate) { const d = new Date(data.startDate); d.setDate(d.getDate() + selectedPkg.duration); endDate = d.toISOString().split('T')[0]; }

    const finalPhones = phones.filter((p) => p.trim());
    const finalEmails = emails.filter((e) => e.trim());
    const finalAddresses = addresses.filter((a) => a.trim());

    if (locationId && clientName) {
      const nameParts = clientName.trim().split(/\s+/);
      try {
        const resp = await axios.post('/api/contacts', {
          locationId, firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '',
          email: finalEmails[0] || '', phone: finalPhones[0] || '', tags: selectedTags,
          tripName: data.title, destinations: dests.join(', '), startDate: data.startDate, endDate,
          status: data.status || 'Draft', agent: data.agent || agents[0] || '', passengers: data.passengers || '2',
          tripType: selectedPkg?.tripType || '', notes: data.notes || '', isVip,
          additionalEmails: finalEmails.slice(1).filter(Boolean),
          additionalPhones: finalPhones.slice(1).filter(Boolean).map((p: string) => ({ phone: p, phoneLabel: null })),
          address1: finalAddresses[0]?.split(',')[0]?.trim() || '',
          city: finalAddresses[0]?.split(',')[1]?.trim() || '',
          state: finalAddresses[0]?.split(',')[2]?.trim() || '',
          country: finalAddresses[0]?.split(',')[3]?.trim() || '',
        });
        contactIdForItinerary = resp?.data?.contact?.id || resp?.data?.data?.id || contactIdForItinerary;
      } catch (e) { console.error('Contact upsert failed:', e); }
    }

    const itinerary: Itinerary = {
      id: uid(), title: data.title, client: clientName, agent: data.agent || agents[0] || '',
      startDate: data.startDate, endDate, contactId: contactIdForItinerary,
      destinations: dests.length > 0 ? dests : [''], destination: dests.join(', ') || '',
      clientPhones: finalPhones, clientEmails: finalEmails, clientAddresses: finalAddresses,
      status: data.status || 'Draft', passengers: parseInt(data.passengers) || 2, tags: selectedTags,
      notes: data.notes, created: new Date().toISOString().split('T')[0], isVip, destinationInfo: [],
      checklistTemplateId: selectedPkg ? undefined : selectedTemplate, packageTemplateId: selectedPkg?.id,
      tripType: selectedPkg?.tripType, passengerList: [], flights: [], hotels: [], transport: [],
      attractions: [], insurance: [], carRentals: [], davening: [], mikvah: [], deposits: 0, checklist,
    };

    const result = await onCreate(itinerary);
    if (result === false) return false;
    onClose();
    return true;
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
          {packages.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>Start from Package <span className="font-normal normal-case">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => selectPackage(null)} className="px-3 py-2 rounded-lg text-sm font-medium border transition-all" style={!selectedPackageId ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}>Blank</button>
                {packages.map((pkg) => (<button key={pkg.id} onClick={() => selectPackage(pkg)} className="px-3 py-2 rounded-lg text-sm font-medium border transition-all" style={selectedPackageId === pkg.id ? { background: '#ecfdf5', borderColor: '#10b981', color: '#059669' } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}><Icon n="globe" c="w-3 h-3 inline mr-1" />{pkg.name} <span className="text-xs opacity-60">({pkg.duration}N)</span></button>))}
              </div>
              {selectedPackageId && (() => { const pkg = packages.find((p) => p.id === selectedPackageId); return pkg ? (<div className="mt-2 p-3 rounded-lg text-xs" style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#065f46' }}><span className="font-semibold">Using: {pkg.name}</span> — {pkg.destinations.join(', ')} · {pkg.duration} nights · {pkg.checklist.length} checklist items</div>) : null; })()}
            </div>
          )}

          <MultiField label="Destination(s) *" values={destinations} onChange={setDestinations} placeholder="Italy" />

          <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: isVip ? '#fefce8' : GHL.bg, border: isVip ? '1px solid #fde68a' : `1px solid ${GHL.border}` }} onClick={() => setIsVip(!isVip)}><button className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={isVip ? { background: '#d97706', borderColor: '#d97706' } : { borderColor: '#d1d5db' }}>{isVip && <Icon n="check" c="w-3 h-3 text-white" />}</button><div><p className="text-sm font-semibold" style={{ color: GHL.text }}>VIP Client</p><p className="text-xs" style={{ color: GHL.muted }}>Adds gift reminder to checklist</p></div></div>

          {!selectedPackageId && (
            <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>Checklist Template</label><div className="flex flex-wrap gap-2">{checklistTemplates.map((tpl) => (<button key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)} className="px-3 py-2 rounded-lg text-sm font-medium border transition-all" style={selectedTemplate === tpl.id ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}>{tpl.name} <span className="text-xs opacity-60">({tpl.items.length})</span></button>))}</div></div>
          )}

          {/* Client Name - search contacts with auto-fill */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>
              Client Name *
            </label>
            {locationId ? (
              <ContactSearch
                locationId={locationId}
                value={clientName}
                onChange={setClientName}
                onSelect={handleContactSelect}
                placeholder="Search by name, email, or phone..."
              />
            ) : (
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Johnson Family" className={ic} style={{ borderColor: GHL.border }} />
            )}
            {selectedContact && (
              <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: GHL.success }}>
                <Icon n="check" c="w-3 h-3" /> Contact linked — phone and email auto-filled
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className={(f as any).half === false ? 'col-span-2' : ''} id={`nif-${f.key}`}>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>{f.label}{f.required ? ' *' : ''}</label>
                {f.key === 'pipelineId' ? (<select value={pipelineId ?? ''} onChange={(e) => setPipelineId(e.target.value ? Number(e.target.value) : null)} className={ic + ' bg-white'} style={{ borderColor: GHL.border }}><option value="">Select pipeline...</option>{pipelines.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select>
                ) : f.key === 'status' ? (<select value={statusValue} onChange={(e) => setStatusValue(e.target.value)} className={ic + ' bg-white'} style={{ borderColor: GHL.border }}>{stageOptions.map((s) => (<option key={s} value={s}>{s}</option>))}</select>
                ) : f.key === 'startDate' ? (<input type="date" value={startDateValue} onChange={(e) => { setStartDateValue(e.target.value); if (endDateValue && e.target.value && endDateValue < e.target.value) setEndDateValue(''); }} className={ic} style={{ borderColor: GHL.border }} />
                ) : f.key === 'endDate' ? (<input type="date" value={endDateValue} onChange={(e) => { if (startDateValue && e.target.value && e.target.value < startDateValue) setEndDateValue(''); else setEndDateValue(e.target.value); }} min={startDateValue || undefined} disabled={!startDateValue} className={ic} style={{ borderColor: GHL.border }} />
                ) : f.type === 'select' ? (<select defaultValue={f.options?.[0]} className={ic + ' bg-white'} style={{ borderColor: GHL.border }}><option value="">Select...</option>{f.options?.map((o) => (<option key={o}>{o}</option>))}</select>
                ) : f.type === 'textarea' ? (<textarea rows={3} placeholder={f.placeholder} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} />
                ) : (<input type={f.type || 'text'} placeholder={f.placeholder} className={ic} style={{ borderColor: GHL.border }} />)}
              </div>
            ))}
          </div>

          <TagSelector locationId={locationId} selectedTags={selectedTags} onTagsChange={setSelectedTags} />

          <div className="grid grid-cols-2 gap-4">
            <MultiField label="Phone Number(s)" values={phones} onChange={setPhones} placeholder="+1 555-0101" type="tel" />
            <MultiField label="Email Address(es)" values={emails} onChange={setEmails} placeholder="client@email.com" type="email" />
          </div>
          <MultiField label="Address(es)" values={addresses} onChange={setAddresses} placeholder="123 Main St, City, State" />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-200" style={{ color: GHL.muted }}>Cancel</button>
          <button
            onClick={async () => {
              if (creating) return; setCreating(true);
              try {
                const data: Record<string, string> = {};
                fields.forEach((f) => { const el = document.getElementById(`nif-${f.key}`); if (el) { const input = el.querySelector('input, select, textarea') as HTMLInputElement; if (input) data[f.key] = input.value; } });
                const ok = await handleSave(data);
                if (!ok) alert('Failed to save. Please try again.');
              } finally { setCreating(false); }
            }}
            disabled={creating}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 shadow-sm disabled:opacity-60"
            style={{ background: GHL.accent }}
          >
            {creating ? (<span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/70 border-t-white rounded-full animate-spin" />Saving...</span>) : 'Create Itinerary'}
          </button>
        </div>
      </div>
    </div>
  );
}
