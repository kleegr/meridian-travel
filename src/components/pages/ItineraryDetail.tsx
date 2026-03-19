'use client';

import { useState } from 'react';
import { Icon, StatusBadge, Accordion, FormModal, SmartFormModal, MiniTable } from '@/components/ui';
import PrintView from './PrintView';
import PassengersTab from './PassengersTab';
import ItineraryMapView from './ItineraryMapView';
import DestinationInfoSection from './DestinationInfoSection';
import FlightGroupView from './FlightGroupView';
import AISuggestions from './AISuggestions';
import BlastRadius from './BlastRadius';
import SmartTransferModal from './SmartTransferModal';
import ItineraryEditor from './ItineraryEditor';
import { GHL, STATUSES, getStatusMeta } from '@/lib/constants';
import { calcFin, fmt, fmtDate, fmtDateTime12, nights, uid } from '@/lib/utils';
import { generateSmartChecklist } from '@/lib/smart-checklist';
import { FLIGHT_FIELDS, HOTEL_FIELDS, TRANSPORT_FIELDS, ATTRACTION_FIELDS, INSURANCE_FIELDS, CAR_RENTAL_FIELDS, PASSENGER_FIELDS, DAVENING_FIELDS, MIKVAH_FIELDS, ITINERARY_FIELDS } from '@/components/forms/field-configs';
import type { Itinerary, Row, AgencyProfile, FormField, Pipeline, ChecklistTemplate, CheckNote, ClientViewSettings } from '@/lib/types';
import { DEFAULT_CLIENT_VIEW_SETTINGS } from '@/lib/types';

interface Props { itin: Itinerary; onBack: () => void; onUpdate: (u: Itinerary) => void; onDelete?: () => void; agencyProfile: AgencyProfile; pipelines?: Pipeline[]; checklistTemplates?: ChecklistTemplate[]; agents?: string[]; }
function toFD(item: any): Record<string, string> { const d: Record<string, string> = {}; Object.entries(item).forEach(([k, v]) => { if (v != null) d[k] = String(v); }); return d; }

function ContactListEditor({ icon, label, values, onChange, placeholder, type }: { icon: string; label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string; type?: string }) {
  const items = values.length > 0 ? values : [''];
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>{label}</p>
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5 mb-1">
          {i === 0 && <Icon n={icon} c="w-3 h-3 flex-shrink-0" style={{ color: GHL.muted }} />}
          {i > 0 && <span className="w-3" />}
          <input value={v} onChange={(e) => { const nv = [...items]; nv[i] = e.target.value; onChange(nv); }} placeholder={placeholder} type={type || 'text'} className="flex-1 px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-200 min-w-0" style={{ borderColor: GHL.border, color: GHL.text }} />
          {items.length > 1 && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(items.filter((_, j) => j !== i)); }} className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"><Icon n="x" c="w-2.5 h-2.5" /></button>}
        </div>
      ))}
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange([...items, '']); }} className="inline-flex items-center gap-1 text-[9px] font-semibold ml-4 mt-0.5 hover:bg-blue-50 px-1.5 py-0.5 rounded" style={{ color: GHL.accent }}><Icon n="plus" c="w-2 h-2" /> Add</button>
    </div>
  );
}

export default function ItineraryDetail({ itin, onBack, onUpdate, onDelete, agencyProfile, pipelines, checklistTemplates = [], agents = [] }: Props) {
  const [tab, setTab] = useState('overview');
  const [addModal, setAddModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState<{ section: string; id: number } | null>(null);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [expandedCheckId, setExpandedCheckId] = useState<number | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [contactExpanded, setContactExpanded] = useState(false);
  const fin = calcFin(itin);
  const uStages = [...new Set(pipelines?.flatMap((p) => p.stages) || STATUSES)];
  const statusMeta = getStatusMeta(itin.status);
  const cvSettings = itin.clientViewSettings || DEFAULT_CLIENT_VIEW_SETTINGS;

  const toggleVip = () => { const u = { ...itin, isVip: !itin.isVip }; if (!itin.isVip) { if (!itin.checklist.some((c) => c.text.toLowerCase().includes('vip'))) u.checklist = [...itin.checklist, { id: uid(), text: 'Send VIP welcome gift', done: false, notes: [] }]; } else { u.checklist = itin.checklist.filter((c) => !c.text.toLowerCase().includes('vip')); } onUpdate(u); };
  const handleAdd = (s: string, data: Record<string, string>) => { const e = { ...data, id: uid(), cost: parseFloat(data.cost) || 0, sell: parseFloat(data.sell) || 0 }; const u = { ...itin }; switch (s) { case 'flight': u.flights = [...itin.flights, e as any]; break; case 'hotel': u.hotels = [...itin.hotels, { ...e, rooms: parseInt(data.rooms) || 1 } as any]; break; case 'transport': u.transport = [...itin.transport, e as any]; break; case 'attraction': u.attractions = [...itin.attractions, e as any]; break; case 'insurance': u.insurance = [...itin.insurance, e as any]; break; case 'carRental': u.carRentals = [...itin.carRentals, e as any]; break; case 'davening': u.davening = [...(itin.davening||[]), { ...e, id: uid() } as any]; break; case 'mikvah': u.mikvah = [...(itin.mikvah||[]), { ...e, id: uid() } as any]; break; } onUpdate(u); setAddModal(null); };
  const handleMultiF = (fl: Record<string, string>[]) => { onUpdate({ ...itin, flights: [...itin.flights, ...fl.map((d) => ({ ...d, id: uid(), cost: parseFloat(d.cost) || 0, sell: parseFloat(d.sell) || 0 } as any))] }); };
  const handleFS = (data: Record<string, string>) => { onUpdate({ ...itin, flights: [...itin.flights, { ...data, id: uid(), cost: parseFloat(data.cost) || 0, sell: parseFloat(data.sell) || 0 } as any] }); setAddModal(null); };
  const handleEditS = (data: Record<string, string>) => { if (!editItem) return; const { section: s, id } = editItem; const m = { ...data, id, cost: parseFloat(data.cost) || 0, sell: parseFloat(data.sell) || 0 }; const u = { ...itin }; switch (s) { case 'flight': u.flights = itin.flights.map((f) => f.id === id ? { ...f, ...m } as any : f); break; case 'hotel': u.hotels = itin.hotels.map((h) => h.id === id ? { ...h, ...m, rooms: parseInt(data.rooms) || 1 } as any : h); break; case 'transport': u.transport = itin.transport.map((t) => t.id === id ? { ...t, ...m } as any : t); break; case 'attraction': u.attractions = itin.attractions.map((a) => a.id === id ? { ...a, ...m } as any : a); break; case 'insurance': u.insurance = itin.insurance.map((x) => x.id === id ? { ...x, ...m } as any : x); break; case 'carRental': u.carRentals = itin.carRentals.map((c) => c.id === id ? { ...c, ...m } as any : c); break; case 'davening': u.davening = (itin.davening||[]).map((d) => d.id === id ? { ...d, ...data, id } as any : d); break; case 'mikvah': u.mikvah = (itin.mikvah||[]).map((x) => x.id === id ? { ...x, ...data, id } as any : x); break; } onUpdate(u); setEditItem(null); };
  const getED = (): { fields: FormField[]; initial: Record<string, string>; title: string; mode?: 'flight' | 'hotel' | 'default'; section?: string } | null => { if (!editItem) return null; const { section: s, id } = editItem; const m: Record<string, [any[], any, string, string?]> = { flight: [itin.flights, FLIGHT_FIELDS, 'Edit Flight', 'flight'], hotel: [itin.hotels, HOTEL_FIELDS, 'Edit Hotel', 'hotel'], transport: [itin.transport, TRANSPORT_FIELDS, 'Edit Transportation'], attraction: [itin.attractions, ATTRACTION_FIELDS, 'Edit Activity'], insurance: [itin.insurance, INSURANCE_FIELDS, 'Edit Insurance'], carRental: [itin.carRentals, CAR_RENTAL_FIELDS, 'Edit Car Rental'], davening: [(itin.davening||[]), DAVENING_FIELDS, 'Edit Davening'], mikvah: [(itin.mikvah||[]), MIKVAH_FIELDS, 'Edit Mikvah'] }; const cfg = m[s]; if (!cfg) return null; const item = cfg[0].find((x: any) => x.id === id); return item ? { fields: cfg[1], initial: toFD(item), title: cfg[2], mode: cfg[3] as any, section: s } : null; };
  const handleDel = (s: string, id: number) => { const u = { ...itin }; switch (s) { case 'flight': u.flights = itin.flights.filter((f) => f.id !== id); break; case 'hotel': u.hotels = itin.hotels.filter((h) => h.id !== id); break; case 'transport': u.transport = itin.transport.filter((t) => t.id !== id); break; case 'attraction': u.attractions = itin.attractions.filter((a) => a.id !== id); break; case 'insurance': u.insurance = itin.insurance.filter((x) => x.id !== id); break; case 'carRental': u.carRentals = itin.carRentals.filter((c) => c.id !== id); break; case 'davening': u.davening = (itin.davening||[]).filter((d) => d.id !== id); break; case 'mikvah': u.mikvah = (itin.mikvah||[]).filter((m) => m.id !== id); break; } onUpdate(u); };
  const handleDuplicate = () => { onUpdate({ ...JSON.parse(JSON.stringify(itin)), id: uid(), title: itin.title + ' (Copy)', status: 'Draft', created: new Date().toISOString().split('T')[0] }); };
  const handleItinEdit = (data: Record<string, string>) => { onUpdate({ ...itin, title: data.title || itin.title, client: data.client || itin.client, agent: data.agent || itin.agent, destination: data.destination || itin.destination, startDate: data.startDate || itin.startDate, endDate: data.endDate || itin.endDate, passengers: parseInt(data.passengers) || itin.passengers, status: data.status || itin.status, tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : itin.tags, notes: data.notes ?? itin.notes, isVip: data.isVip === 'true' }); setEditModal(false); };
  const toggleCheck = (id: number) => onUpdate({ ...itin, checklist: itin.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) });
  const addCheckItem = () => { if (!newCheckItem.trim()) return; onUpdate({ ...itin, checklist: [...itin.checklist, { id: uid(), text: newCheckItem.trim(), done: false, notes: [] }] }); setNewCheckItem(''); };
  const delCheckItem = (id: number) => onUpdate({ ...itin, checklist: itin.checklist.filter((c) => c.id !== id) });
  const applyTemplate = (tpl: ChecklistTemplate) => { if (!confirm(`Apply "${tpl.name}" template?`)) return; const cl = tpl.items.map((text, i) => ({ id: uid() + i, text, done: false, notes: [] as CheckNote[] })); if (itin.isVip && !cl.some((c) => c.text.toLowerCase().includes('vip'))) cl.push({ id: uid(), text: 'Send VIP welcome gift', done: false, notes: [] }); onUpdate({ ...itin, checklist: cl, checklistTemplateId: tpl.id }); };
  const addNote = (checkId: number) => { const text = (noteInputs[checkId] || '').trim(); if (!text) return; const note: CheckNote = { id: uid(), text, author: itin.agent || 'Agent', date: new Date().toISOString() }; onUpdate({ ...itin, checklist: itin.checklist.map((c) => c.id === checkId ? { ...c, notes: [...(c.notes || []), note] } : c) }); setNoteInputs({ ...noteInputs, [checkId]: '' }); };
  const delNote = (checkId: number, noteId: number) => { onUpdate({ ...itin, checklist: itin.checklist.map((c) => c.id === checkId ? { ...c, notes: (c.notes || []).filter((n) => n.id !== noteId) } : c) }); };
  const setPhones = (v: string[]) => onUpdate({ ...itin, clientPhones: v });
  const setEmails = (v: string[]) => onUpdate({ ...itin, clientEmails: v });
  const setAddresses = (v: string[]) => onUpdate({ ...itin, clientAddresses: v });
  const updateClientViewSettings = (s: ClientViewSettings) => onUpdate({ ...itin, clientViewSettings: s });
  const cR = (r: Row) => fmt(Number(r.cost)); const sR = (r: Row) => fmt(Number(r.sell));
  const ck = itin.checklist.filter((c) => c.done).length; const ct = itin.checklist.length || 1;
  const di = (itin.destinationInfo || []).length;
  const ef: FormField[] = ITINERARY_FIELDS.map((f) => { if (f.key === 'agent') return { ...f, options: agents.length > 0 ? agents : [itin.agent].filter(Boolean) }; if (f.key === 'status') return { ...f, options: uStages }; return f; });
  const ei = { title: itin.title, client: itin.client, agent: itin.agent, destination: itin.destination, startDate: itin.startDate, endDate: itin.endDate, passengers: String(itin.passengers), status: itin.status, tags: itin.tags.join(', '), notes: itin.notes, isVip: itin.isVip ? 'true' : '' };
  const ed = getED();
  const currentTpl = checklistTemplates.find((t) => t.id === itin.checklistTemplateId);
  const smartItems = generateSmartChecklist(itin);
  const smartDone = smartItems.filter((s) => s.isDone).length;
  const smartTotal = smartItems.length;
  const handleAddSuggestion = (name: string, city: string) => { const newA = { id: uid(), name, city, date: itin.startDate || '', time: '', ticketType: 'General', source: 'AI Suggestion', ref: '', cost: 0, sell: 0, notes: '' }; onUpdate({ ...itin, attractions: [...itin.attractions, newA] }); };
  const n = nights(itin.startDate, itin.endDate);

  const hasContact = (itin.clientPhones?.some(p => p.trim()) || itin.clientEmails?.some(e => e.trim()));
  const contactSummary = [...(itin.clientPhones || []).filter(Boolean), ...(itin.clientEmails || []).filter(Boolean)].join(' | ');

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'passengers', label: 'Passengers', icon: 'users', count: itin.passengerList.length },
    { id: 'bookings', label: 'Bookings', icon: 'plane' },
    { id: 'destinations', label: 'Destination Information', icon: 'globe', count: di },
    { id: 'suggestions', label: 'Suggestions', icon: 'search' },
    { id: 'checklist', label: 'Checklist', icon: 'checkSquare', count: itin.checklist.length },
    { id: 'financials', label: 'Financials', icon: 'dollar' },
    { id: 'blast', label: 'Blast Radius', icon: 'bell' },
    { id: 'print', label: 'Client View', icon: 'print' },
    { id: 'map', label: 'Map', icon: 'map' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0 mt-0.5" style={{ color: GHL.muted }}><Icon n="back" c="w-5 h-5" /></button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-xl font-bold" style={{ color: GHL.text }}>{itin.title}</h2>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: statusMeta.bg, color: statusMeta.color }}>{itin.status}</span>
                {itin.isVip && <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706' }}>VIP</span>}
                {itin.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: GHL.accentLight, color: GHL.accent }}>{t}</span>)}
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: GHL.muted }}>
                <span>{itin.client}</span><span style={{ opacity: 0.3 }}>{String.fromCharCode(8226)}</span>
                <span>{itin.agent}</span><span style={{ opacity: 0.3 }}>{String.fromCharCode(8226)}</span>
                <span>{(itin.destinations?.length > 1) ? itin.destinations.join(', ') : itin.destination}</span><span style={{ opacity: 0.3 }}>{String.fromCharCode(8226)}</span>
                <span>{fmtDate(itin.startDate)} - {fmtDate(itin.endDate)} ({n} nights)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setEditModal(true)} className="p-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }} title="Edit"><Icon n="edit" c="w-4 h-4" /></button>
              <button onClick={handleDuplicate} className="p-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }} title="Duplicate"><Icon n="copy" c="w-4 h-4" /></button>
              {onDelete && <button onClick={() => { if (confirm('Delete this itinerary?')) onDelete(); }} className="p-2 rounded-lg border hover:bg-red-50" style={{ borderColor: GHL.border, color: GHL.muted }} title="Delete"><Icon n="trash" c="w-4 h-4" /></button>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 border-t" style={{ borderColor: GHL.border, background: GHL.bg + '80' }}>
          {[{ l: 'Revenue', v: fmt(fin.totalSell), c: GHL.text }, { l: 'Profit', v: fmt(fin.profit), c: GHL.success }, { l: 'Margin', v: `${fin.margin}%`, c: GHL.text }, { l: 'Balance', v: fmt(fin.balance), c: fin.balance > 0 ? GHL.warning : GHL.success }, { l: 'Pax', v: String(itin.passengers), c: GHL.text }, { l: 'Nights', v: String(n), c: GHL.text }, { l: 'Tasks', v: `${ck}/${itin.checklist.length}`, c: ck === itin.checklist.length ? GHL.success : GHL.warning }].map((s) => (
            <div key={s.l} className="px-4 py-3 text-center border-r last:border-r-0" style={{ borderColor: GHL.border + '80' }}>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: GHL.muted }}>{s.l}</p>
              <p className="font-bold text-sm mt-0.5" style={{ color: s.c }}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex gap-0 overflow-x-auto px-2 py-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap mx-0.5" style={tab === t.id ? { background: GHL.accentLight, color: GHL.accent, fontWeight: 600 } : { color: GHL.muted }}>
              <Icon n={t.icon} c="w-3.5 h-3.5" /><span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && <span className="ml-0.5 text-[9px] rounded-full px-1.5 py-0" style={tab === t.id ? { background: GHL.accent + '20', color: GHL.accent } : { background: GHL.bg, color: GHL.muted }}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GHL.text }}>Trip Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[['Client', itin.client], ['Agent', itin.agent], ['Destination', (itin.destinations?.length > 1) ? itin.destinations.join(', ') : itin.destination], ['Passengers', String(itin.passengers)], ['Departure', fmtDate(itin.startDate)], ['Return', fmtDate(itin.endDate)], ['Status', itin.status], ['Created', fmtDate(itin.created)]].map(([k, v]) => (
                  <div key={k}><p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: GHL.muted }}>{k}</p><p className="font-semibold" style={{ color: GHL.text }}>{v}</p></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
              <button onClick={() => setContactExpanded(!contactExpanded)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2"><h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: GHL.text }}>Client Contact</h3>{!contactExpanded && hasContact && <span className="text-[10px] truncate max-w-xs" style={{ color: GHL.muted }}>{contactSummary}</span>}</div>
                <Icon n={contactExpanded ? 'chevronDown' : 'chevronRight'} c="w-3.5 h-3.5" />
              </button>
              {contactExpanded && (<div className="px-5 pb-4 border-t" style={{ borderColor: GHL.border }}><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3"><ContactListEditor icon="user" label="Phone Numbers" values={itin.clientPhones || []} onChange={setPhones} placeholder="+1 555-0101" type="tel" /><ContactListEditor icon="bell" label="Email Addresses" values={itin.clientEmails || []} onChange={setEmails} placeholder="client@email.com" type="email" /><div className="md:col-span-2"><ContactListEditor icon="map" label="Addresses" values={itin.clientAddresses || []} onChange={setAddresses} placeholder="123 Main St, City" /></div></div></div>)}
            </div>
            <div className="rounded-xl border px-4 py-2.5 flex items-center justify-between cursor-pointer transition-all hover:shadow-sm" style={{ background: itin.isVip ? '#fefce8' : 'white', borderColor: itin.isVip ? '#fde68a' : GHL.border }} onClick={toggleVip}>
              <div className="flex items-center gap-2.5"><button className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={itin.isVip ? { background: '#d97706', borderColor: '#d97706' } : { borderColor: '#d1d5db' }}>{itin.isVip && <Icon n="check" c="w-3 h-3 text-white" />}</button><span className="text-xs font-medium" style={{ color: GHL.text }}>VIP Client</span></div>
              {itin.isVip && <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706' }}>Active</span>}
            </div>
            {itin.notes && <div className="rounded-xl border px-4 py-3" style={{ background: '#fefce8', borderColor: '#fde68a' }}><p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#d97706' }}>Notes</p><p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>{itin.notes}</p></div>}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GHL.text }}>Components</h3>
              <div className="space-y-1.5">{[{ l: 'Flights', cnt: itin.flights.length, ic: 'plane' }, { l: 'Hotels', cnt: itin.hotels.length, ic: 'hotel' }, { l: 'Transportation', cnt: itin.transport.length, ic: 'car' }, { l: 'Activities', cnt: itin.attractions.length, ic: 'star' }, { l: 'Insurance', cnt: itin.insurance.length, ic: 'shield' }, { l: 'Car Rentals', cnt: itin.carRentals.length, ic: 'car' }].map(({ l, cnt, ic }) => (<div key={l} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: cnt > 0 ? GHL.bg + '80' : 'transparent' }}><div className="flex items-center gap-2 text-xs" style={{ color: GHL.text }}><span style={{ color: cnt > 0 ? GHL.accent : GHL.muted }}><Icon n={ic} c="w-3.5 h-3.5" /></span>{l}</div><span className="text-xs font-bold rounded-full px-2 py-0.5" style={cnt > 0 ? { background: GHL.accentLight, color: GHL.accent } : { color: GHL.muted }}>{cnt}</span></div>))}</div>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
              <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: GHL.text }}>Checklist</h3><span className="text-sm font-bold" style={{ color: ck === itin.checklist.length ? GHL.success : GHL.accent }}>{Math.round((ck / ct) * 100)}%</span></div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: GHL.bg }}><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((ck / ct) * 100)}%`, background: ck === itin.checklist.length ? GHL.success : GHL.accent }} /></div>
              <p className="text-[10px] mt-2" style={{ color: GHL.muted }}>{ck} of {itin.checklist.length} tasks completed</p>
            </div>
            <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${GHL.sidebar}, ${GHL.accent})` }}>
              <p className="text-[10px] font-medium uppercase tracking-wider opacity-70 mb-3">Financial Summary</p>
              <div className="space-y-2.5">{[['Revenue', fmt(fin.totalSell)], ['Cost', fmt(fin.totalCost)], ['Profit', fmt(fin.profit)], ['Margin', `${fin.margin}%`]].map(([k, v]) => (<div key={k} className="flex items-center justify-between"><span className="text-xs opacity-80">{k}</span><span className="text-sm font-bold">{v}</span></div>))}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'passengers' && <PassengersTab itin={itin} onUpdate={onUpdate} />}

      {tab === 'bookings' && <div className="space-y-4">
        <Accordion title="Flights" icon="plane" count={itin.flights.length} defaultOpen onAdd={() => setAddModal('flight')}><FlightGroupView flights={itin.flights} onEdit={(id) => setEditItem({ section: 'flight', id })} onDelete={(id) => handleDel('flight', id)} onAdd={() => setAddModal('flight')} /></Accordion>
        <Accordion title="Hotels" icon="hotel" count={itin.hotels.length} defaultOpen onAdd={() => setAddModal('hotel')}><MiniTable cols={[{ key: 'name', label: 'Hotel' }, { key: 'city', label: 'City' }, { key: 'checkIn', label: 'Check In', render: (r: Row) => fmtDate(String(r.checkIn)) }, { key: 'checkOut', label: 'Check Out', render: (r: Row) => fmtDate(String(r.checkOut)) }, { key: 'roomType', label: 'Room' }, { key: 'cost', label: 'Cost', render: cR }, { key: 'sell', label: 'Sell', render: sR }]} rows={itin.hotels as unknown as Row[]} addLabel="Add Hotel" onAdd={() => setAddModal('hotel')} onEdit={(id) => setEditItem({ section: 'hotel', id })} onDelete={(id) => handleDel('hotel', id)} /></Accordion>
        <Accordion title="Transportation" icon="car" count={itin.transport.length} onAdd={() => setAddModal('transport')}><MiniTable cols={[{ key: 'transferScenario', label: 'Scenario' }, { key: 'type', label: 'Vehicle' }, { key: 'pickup', label: 'Pickup' }, { key: 'dropoff', label: 'Drop-off' }, { key: 'pickupTime', label: 'Time' }, { key: 'cost', label: 'Cost', render: cR }, { key: 'sell', label: 'Sell', render: sR }]} rows={itin.transport as unknown as Row[]} addLabel="Add Transportation" onAdd={() => setAddModal('transport')} onEdit={(id) => setEditItem({ section: 'transport', id })} onDelete={(id) => handleDel('transport', id)} /></Accordion>
        <Accordion title="Activities" icon="star" count={itin.attractions.length} onAdd={() => setAddModal('attraction')}><MiniTable cols={[{ key: 'name', label: 'Activity' }, { key: 'city', label: 'City' }, { key: 'date', label: 'Date', render: (r: Row) => fmtDate(String(r.date)) }, { key: 'cost', label: 'Cost', render: cR }, { key: 'sell', label: 'Sell', render: sR }]} rows={itin.attractions as unknown as Row[]} addLabel="Add Activity" onAdd={() => setAddModal('attraction')} onEdit={(id) => setEditItem({ section: 'attraction', id })} onDelete={(id) => handleDel('attraction', id)} /></Accordion>
        <Accordion title="Insurance" icon="shield" count={itin.insurance.length} onAdd={() => setAddModal('insurance')}><MiniTable cols={[{ key: 'provider', label: 'Provider' }, { key: 'coverage', label: 'Type' }, { key: 'cost', label: 'Cost', render: cR }, { key: 'sell', label: 'Sell', render: sR }]} rows={itin.insurance as unknown as Row[]} addLabel="Add Insurance" onAdd={() => setAddModal('insurance')} onEdit={(id) => setEditItem({ section: 'insurance', id })} onDelete={(id) => handleDel('insurance', id)} /></Accordion>
        <Accordion title="Car Rentals" icon="car" count={itin.carRentals.length} onAdd={() => setAddModal('carRental')}><MiniTable cols={[{ key: 'company', label: 'Company' }, { key: 'vehicle', label: 'Vehicle' }, { key: 'cost', label: 'Cost', render: cR }, { key: 'sell', label: 'Sell', render: sR }]} rows={itin.carRentals as unknown as Row[]} addLabel="Add Car Rental" onAdd={() => setAddModal('carRental')} onEdit={(id) => setEditItem({ section: 'carRental', id })} onDelete={(id) => handleDel('carRental', id)} /></Accordion>
        <Accordion title="Davening" icon="star" count={(itin.davening||[]).length} onAdd={() => setAddModal('davening')}><MiniTable cols={[{ key: 'location', label: 'Shul' }, { key: 'city', label: 'Area' }, { key: 'shachris', label: 'Shachris' }, { key: 'mincha', label: 'Mincha' }]} rows={(itin.davening||[]) as unknown as Row[]} addLabel="Add Davening" onAdd={() => setAddModal('davening')} onEdit={(id) => setEditItem({ section: 'davening', id })} onDelete={(id) => handleDel('davening', id)} /></Accordion>
        <Accordion title="Mikvah" icon="globe" count={(itin.mikvah||[]).length} onAdd={() => setAddModal('mikvah')}><MiniTable cols={[{ key: 'name', label: 'Mikvah' }, { key: 'city', label: 'Area' }, { key: 'hours', label: 'Hours' }]} rows={(itin.mikvah||[]) as unknown as Row[]} addLabel="Add Mikvah" onAdd={() => setAddModal('mikvah')} onEdit={(id) => setEditItem({ section: 'mikvah', id })} onDelete={(id) => handleDel('mikvah', id)} /></Accordion>
      </div>}

      {tab === 'destinations' && <DestinationInfoSection itin={itin} onUpdate={onUpdate} />}
      {tab === 'suggestions' && <AISuggestions itin={itin} onAddAttraction={handleAddSuggestion} />}
      {tab === 'blast' && <BlastRadius itin={itin} onEditFlight={(id) => setEditItem({ section: 'flight', id })} onEditHotel={(id) => setEditItem({ section: 'hotel', id })} onEditTransport={(id) => setEditItem({ section: 'transport', id })} onEditAttraction={(id) => setEditItem({ section: 'attraction', id })} />}

      {tab === 'checklist' && (
        <div className="space-y-4">
          {smartItems.length > 0 && (<div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: smartDone === smartTotal ? '#ecfdf5' : '#eff6ff', color: smartDone === smartTotal ? GHL.success : GHL.accent }}><Icon n="star" c="w-4 h-4" /></span><div><p className="text-sm font-semibold" style={{ color: GHL.text }}>Progress Tracker</p><p className="text-[10px]" style={{ color: GHL.muted }}>Auto-updates based on bookings</p></div></div><span className="text-sm font-bold" style={{ color: smartDone === smartTotal ? GHL.success : GHL.accent }}>{smartDone}/{smartTotal}</span></div><div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: GHL.bg }}><div className="h-full rounded-full transition-all" style={{ width: `${smartTotal > 0 ? Math.round((smartDone / smartTotal) * 100) : 0}%`, background: smartDone === smartTotal ? GHL.success : GHL.accent }} /></div><div className="space-y-1">{smartItems.map((si, idx) => { const isChild = si.text.startsWith('Traveler '); return (<div key={idx} className={`flex items-center gap-2.5 py-1.5 rounded-lg ${isChild ? 'ml-7 px-2' : 'px-3'}`} style={{ background: si.isDone ? '#f0fdf4' : GHL.bg }}><span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={si.isDone ? { background: GHL.success } : { background: '#e5e7eb' }}>{si.isDone && <Icon n="check" c="w-2.5 h-2.5 text-white" />}</span><span className={`text-xs ${isChild ? '' : 'font-medium'}`} style={{ color: si.isDone ? GHL.success : GHL.text }}>{si.text}</span>{si.category !== 'custom' && (<span className="text-[9px] px-1.5 py-0.5 rounded ml-auto" style={{ background: si.isDone ? '#dcfce7' : '#f3f4f6', color: si.isDone ? '#166534' : '#9ca3af' }}>{si.isDone ? 'Done' : 'Pending'}</span>)}</div>); })}</div></div>)}
          {checklistTemplates.length > 0 && (<div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}><div className="flex items-center justify-between mb-3"><p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Apply Template</p>{currentTpl && <span className="text-xs px-2 py-1 rounded-lg" style={{ background: GHL.accentLight, color: GHL.accent }}>Current: {currentTpl.name}</span>}</div><div className="flex flex-wrap gap-2">{checklistTemplates.map((tpl) => (<button key={tpl.id} onClick={() => applyTemplate(tpl)} className="px-3 py-2 rounded-lg text-xs font-medium border transition-all" style={itin.checklistTemplateId === tpl.id ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}>{tpl.name} <span className="text-[10px] opacity-60">({tpl.items.length})</span></button>))}</div></div>)}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-sm" style={{ color: GHL.text }}>Agent Checklist</h3><span className="text-sm font-bold" style={{ color: ck === itin.checklist.length ? GHL.success : GHL.accent }}>{Math.round((ck / ct) * 100)}%</span></div>
            <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: GHL.bg }}><div className="h-full rounded-full" style={{ width: `${Math.round((ck / ct) * 100)}%`, background: ck === itin.checklist.length ? GHL.success : GHL.accent }} /></div>
            <div className="space-y-0.5">{itin.checklist.map((c) => { const nc = (c.notes || []).length; const isOpen = expandedCheckId === c.id; return (<div key={c.id} className="rounded-lg" style={{ border: isOpen ? `1px solid ${GHL.border}` : '1px solid transparent' }}><div className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 group rounded-lg"><button onClick={() => toggleCheck(c.id)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={c.done ? { background: GHL.success, borderColor: GHL.success } : { borderColor: '#d1d5db' }}>{c.done && <Icon n="check" c="w-3 h-3 text-white" />}</button><span className={`flex-1 text-sm ${c.done ? 'line-through' : ''}`} style={{ color: c.done ? GHL.muted : GHL.text }}>{c.text}</span>{nc > 0 && !isOpen && <button onClick={() => setExpandedCheckId(c.id)} className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: '#dbeafe', color: '#1e40af' }}><Icon n="message" c="w-2.5 h-2.5" />{nc}</button>}<button onClick={() => setExpandedCheckId(isOpen ? null : c.id)} className={`p-1 rounded transition-colors ${isOpen ? '' : 'opacity-0 group-hover:opacity-100'}`} style={{ color: GHL.muted }}><Icon n="message" c="w-3.5 h-3.5" /></button><button onClick={() => delCheckItem(c.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>{isOpen && (<div className="px-11 pb-3">{(c.notes || []).length > 0 && (<div className="space-y-1.5 mb-2">{(c.notes || []).map((note) => (<div key={note.id} className="flex gap-2 group/note"><div className="w-0.5 rounded-full flex-shrink-0 mt-1" style={{ background: GHL.accentLight, minHeight: 16 }} /><div className="flex-1 min-w-0"><p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{note.text}</p><p className="text-[10px] mt-0.5" style={{ color: GHL.muted }}>{note.author} {String.fromCharCode(8226)} {fmtDateTime12(note.date)}</p></div><button onClick={() => delNote(c.id, note.id)} className="opacity-0 group-hover/note:opacity-100 p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0"><Icon n="x" c="w-2.5 h-2.5" /></button></div>))}</div>)}<div className="flex gap-1.5"><input value={noteInputs[c.id] || ''} onChange={(e) => setNoteInputs({ ...noteInputs, [c.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addNote(c.id)} placeholder="Add a note..." className="flex-1 px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-200" style={{ borderColor: GHL.border }} /><button onClick={() => addNote(c.id)} className="px-2.5 py-1.5 text-[10px] font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div></div>)}</div>); })}</div>
            <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: GHL.border }}><input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCheckItem()} placeholder="Add checklist item..." className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /><button onClick={addCheckItem} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div>
          </div>
        </div>
      )}

      {tab === 'financials' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-5 text-white shadow-sm" style={{ background: GHL.sidebar }}><p className="text-[10px] uppercase tracking-wider mb-2 opacity-70">Revenue</p><p className="text-2xl font-bold">{fmt(fin.totalSell)}</p></div>
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}><p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Cost</p><p className="text-2xl font-bold" style={{ color: GHL.text }}>{fmt(fin.totalCost)}</p></div>
            <div className="rounded-xl border p-5 shadow-sm" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}><p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: GHL.success }}>Profit</p><p className="text-2xl font-bold" style={{ color: GHL.success }}>{fmt(fin.profit)}</p></div>
            <div className="rounded-xl border p-5 shadow-sm" style={{ background: '#fffbeb', borderColor: '#fde68a' }}><p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: GHL.warning }}>Balance</p><p className="text-2xl font-bold" style={{ color: GHL.warning }}>{fmt(fin.balance)}</p></div>
          </div>
        </div>
      )}

      {tab === 'print' && <ItineraryEditor itin={itin} agencyProfile={agencyProfile} onUpdate={updateClientViewSettings} onEditItem={(section, id) => setEditItem({ section, id })} />}
      {tab === 'map' && <ItineraryMapView itin={itin} />}

      {addModal === 'flight' && <SmartFormModal title="Add Flight" fields={FLIGHT_FIELDS} onSave={handleFS} onClose={() => setAddModal(null)} mode="flight" onSaveMultipleFlights={handleMultiF} />}
      {addModal === 'hotel' && <SmartFormModal title="Add Hotel" fields={HOTEL_FIELDS} onSave={(d) => handleAdd('hotel', d)} onClose={() => setAddModal(null)} mode="hotel" />}
      {addModal === 'transport' && <SmartTransferModal itin={itin} onSave={(d) => handleAdd('transport', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'attraction' && <FormModal title="Add Activity" fields={ATTRACTION_FIELDS} onSave={(d) => handleAdd('attraction', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'insurance' && <FormModal title="Add Insurance" fields={INSURANCE_FIELDS} onSave={(d) => handleAdd('insurance', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'carRental' && <FormModal title="Add Car Rental" fields={CAR_RENTAL_FIELDS} onSave={(d) => handleAdd('carRental', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'davening' && <FormModal title="Add Davening" fields={DAVENING_FIELDS} onSave={(d) => handleAdd('davening', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'mikvah' && <FormModal title="Add Mikvah" fields={MIKVAH_FIELDS} onSave={(d) => handleAdd('mikvah', d)} onClose={() => setAddModal(null)} />}
      {editItem && ed && ed.section === 'transport' ? (
        <SmartTransferModal itin={itin} onSave={handleEditS} onClose={() => setEditItem(null)} initial={ed.initial} />
      ) : editItem && ed && (ed.mode === 'flight' || ed.mode === 'hotel' ? <SmartFormModal title={ed.title} fields={ed.fields} onSave={handleEditS} onClose={() => setEditItem(null)} initial={ed.initial} mode={ed.mode} /> : ed && <FormModal title={ed.title} fields={ed.fields} onSave={handleEditS} onClose={() => setEditItem(null)} initial={ed.initial} />)}
      {editModal && <SmartFormModal title="Edit Itinerary" fields={ef} onSave={handleItinEdit} onClose={() => setEditModal(false)} initial={ei} />}
    </div>
  );
}
