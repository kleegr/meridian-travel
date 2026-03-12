'use client';

import { useState, useMemo } from 'react';
import { Icon, StatusBadge, Accordion, FormModal, MiniTable } from '@/components/ui';
import { GHL, AGENTS, STATUSES } from '@/lib/constants';
import { calcFin, fmt, fmtDate, nights, uid } from '@/lib/utils';
import { FLIGHT_FIELDS, HOTEL_FIELDS, TRANSPORT_FIELDS, ATTRACTION_FIELDS, INSURANCE_FIELDS, CAR_RENTAL_FIELDS, PASSENGER_FIELDS, ITINERARY_FIELDS } from '@/components/forms/field-configs';
import type { Itinerary, Flight, Hotel, Transport, Attraction, Insurance, CarRental, Passenger, Row, AgencyProfile, FormField } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onBack: () => void;
  onUpdate: (updated: Itinerary) => void;
  agencyProfile: AgencyProfile;
}

interface TimelineEvent {
  date: string;
  sortKey: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  detail?: string;
  time?: string;
}

function buildTimeline(itin: Itinerary): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  itin.flights.forEach((f) => {
    const d = f.departure.split(' ')[0] || f.departure;
    events.push({ date: d, sortKey: f.departure, type: 'Flight', icon: 'plane', title: `${f.airline} ${f.flightNo}`, subtitle: `${f.from} \u2192 ${f.to}`, detail: `PNR: ${f.pnr}`, time: f.departure.split(' ')[1] || '' });
  });
  itin.hotels.forEach((h) => {
    events.push({ date: h.checkIn, sortKey: h.checkIn + ' 14:00', type: 'Check-in', icon: 'hotel', title: h.name, subtitle: `${h.city} \u00b7 ${h.roomType} x${h.rooms}`, detail: `Ref: ${h.ref}`, time: '14:00' });
    events.push({ date: h.checkOut, sortKey: h.checkOut + ' 11:00', type: 'Check-out', icon: 'hotel', title: h.name, subtitle: h.city, time: '11:00' });
  });
  itin.transport.forEach((t) => {
    const d = t.pickupDateTime.split(' ')[0] || t.pickupDateTime;
    events.push({ date: d, sortKey: t.pickupDateTime, type: 'Transfer', icon: 'car', title: t.type, subtitle: `${t.pickup} \u2192 ${t.dropoff}`, detail: t.provider, time: t.pickupDateTime.split(' ')[1] || '' });
  });
  itin.attractions.forEach((a) => {
    events.push({ date: a.date, sortKey: a.date + ' ' + (a.time || '09:00'), type: 'Activity', icon: 'star', title: a.name, subtitle: `${a.city} \u00b7 ${a.ticketType}`, time: a.time });
  });
  return events.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export default function ItineraryDetail({ itin, onBack, onUpdate, agencyProfile }: Props) {
  const [tab, setTab] = useState('overview');
  const [addModal, setAddModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const fin = calcFin(itin);

  const handleAdd = (section: string, data: Record<string, string>) => {
    const entry = { ...data, id: uid(), cost: parseFloat(data.cost) || 0, sell: parseFloat(data.sell) || 0 };
    const updated = { ...itin };
    switch (section) {
      case 'flight': updated.flights = [...itin.flights, entry as unknown as Flight]; break;
      case 'hotel': updated.hotels = [...itin.hotels, { ...entry, rooms: parseInt(data.rooms) || 1 } as unknown as Hotel]; break;
      case 'transport': updated.transport = [...itin.transport, entry as unknown as Transport]; break;
      case 'attraction': updated.attractions = [...itin.attractions, entry as unknown as Attraction]; break;
      case 'insurance': updated.insurance = [...itin.insurance, entry as unknown as Insurance]; break;
      case 'carRental': updated.carRentals = [...itin.carRentals, entry as unknown as CarRental]; break;
      case 'passenger': updated.passengerList = [...itin.passengerList, { ...entry, id: uid() } as unknown as Passenger]; updated.passengers = updated.passengerList.length; break;
    }
    onUpdate(updated);
    setAddModal(null);
  };

  const handleDelete = (section: string, id: number) => {
    const updated = { ...itin };
    switch (section) {
      case 'flight': updated.flights = itin.flights.filter((f) => f.id !== id); break;
      case 'hotel': updated.hotels = itin.hotels.filter((h) => h.id !== id); break;
      case 'transport': updated.transport = itin.transport.filter((t) => t.id !== id); break;
      case 'attraction': updated.attractions = itin.attractions.filter((a) => a.id !== id); break;
      case 'insurance': updated.insurance = itin.insurance.filter((x) => x.id !== id); break;
      case 'carRental': updated.carRentals = itin.carRentals.filter((c) => c.id !== id); break;
      case 'passenger': updated.passengerList = itin.passengerList.filter((p) => p.id !== id); updated.passengers = updated.passengerList.length; break;
    }
    onUpdate(updated);
  };

  const handleDuplicate = () => { onUpdate({ ...JSON.parse(JSON.stringify(itin)), id: uid(), title: itin.title + ' (Copy)', status: 'Draft', created: new Date().toISOString().split('T')[0] }); };

  const handleEditSave = (data: Record<string, string>) => {
    onUpdate({ ...itin, title: data.title || itin.title, client: data.client || itin.client, agent: data.agent || itin.agent, destination: data.destination || itin.destination, startDate: data.startDate || itin.startDate, endDate: data.endDate || itin.endDate, passengers: parseInt(data.passengers) || itin.passengers, status: data.status || itin.status, tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : itin.tags, notes: data.notes ?? itin.notes });
    setEditModal(false);
  };

  const toggleCheck = (id: number) => onUpdate({ ...itin, checklist: itin.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) });
  const addCheckItem = () => { if (!newCheckItem.trim()) return; onUpdate({ ...itin, checklist: [...itin.checklist, { id: uid(), text: newCheckItem.trim(), done: false }] }); setNewCheckItem(''); };
  const deleteCheckItem = (id: number) => onUpdate({ ...itin, checklist: itin.checklist.filter((c) => c.id !== id) });

  const profitRender = (r: Row) => <span style={{ color: GHL.success }} className="font-semibold">{fmt(Number(r.sell) - Number(r.cost))}</span>;
  const costRender = (r: Row) => fmt(Number(r.cost));
  const sellRender = (r: Row) => fmt(Number(r.sell));
  const checkDone = itin.checklist.filter((c) => c.done).length;
  const checkTotal = itin.checklist.length || 1;

  const timeline = useMemo(() => buildTimeline(itin), [itin]);
  const timelineDays = useMemo(() => {
    const days = new Map<string, TimelineEvent[]>();
    timeline.forEach((e) => { const d = e.date; if (!days.has(d)) days.set(d, []); days.get(d)!.push(e); });
    return Array.from(days.entries());
  }, [timeline]);

  const editFields: FormField[] = ITINERARY_FIELDS.map((f) => {
    if (f.key === 'agent') return { ...f, options: AGENTS };
    if (f.key === 'status') return { ...f, options: STATUSES };
    return f;
  });
  const editInitial = { title: itin.title, client: itin.client, agent: itin.agent, destination: itin.destination, startDate: itin.startDate, endDate: itin.endDate, passengers: String(itin.passengers), status: itin.status, tags: itin.tags.join(', '), notes: itin.notes };

  const iconColors: Record<string, string> = { plane: '#3b82f6', hotel: '#f59e0b', car: '#8b5cf6', star: '#ec4899' };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><Icon n="back" c="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900 truncate">{itin.title}</h2>
            <StatusBadge status={itin.status} />
            {itin.tags.map((t) => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{t}</span>)}
          </div>
          <p className="text-gray-400 text-sm mt-0.5">{itin.client} &middot; {itin.agent} &middot; {itin.destination}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setEditModal(true)} className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Edit Itinerary"><Icon n="edit" c="w-4 h-4" /></button>
          <button onClick={handleDuplicate} className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Duplicate"><Icon n="copy" c="w-4 h-4" /></button>
          <button onClick={() => setTab('print')} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90" style={{ background: GHL.sidebar }}>
            <Icon n="print" c="w-4 h-4" /> Client View
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {[{ l: 'Revenue', v: fmt(fin.totalSell), c: GHL.text }, { l: 'Profit', v: fmt(fin.profit), c: GHL.success }, { l: 'Margin', v: `${fin.margin}%`, c: GHL.text }, { l: 'Balance Due', v: fmt(fin.balance), c: GHL.warning }, { l: 'Passengers', v: String(itin.passengers), c: GHL.text }, { l: 'Nights', v: String(nights(itin.startDate, itin.endDate)), c: GHL.text }, { l: 'Checklist', v: `${checkDone}/${itin.checklist.length}`, c: checkDone === itin.checklist.length ? GHL.success : GHL.warning }].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm"><p className="text-xs text-gray-400 mb-1">{s.l}</p><p className="font-bold text-sm" style={{ color: s.c }}>{s.v}</p></div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 flex gap-1 overflow-x-auto">
        {[{ id: 'overview', l: 'Overview' }, { id: 'passengers', l: 'Passengers', cnt: itin.passengerList.length }, { id: 'bookings', l: 'Bookings' }, { id: 'checklist', l: 'Checklist', cnt: itin.checklist.length }, { id: 'financials', l: 'Financials' }, { id: 'print', l: 'Client Itinerary' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap" style={tab === t.id ? { color: GHL.accent, borderBottom: `2px solid ${GHL.accent}`, background: '#f0fdfa' } : { color: '#6b7280' }}>
            {t.l}{t.cnt !== undefined ? <span className="ml-1.5 bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5 text-xs">{t.cnt}</span> : null}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-5"><div className="lg:col-span-2 space-y-4"><div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"><h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Trip Details</h3><div className="grid grid-cols-2 gap-4 text-sm">{[['Client', itin.client], ['Agent', itin.agent], ['Destination', itin.destination], ['Passengers', String(itin.passengers)], ['Departure', fmtDate(itin.startDate)], ['Return', fmtDate(itin.endDate)], ['Status', itin.status], ['Created', fmtDate(itin.created)]].map(([k, v]) => (<div key={k}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="font-semibold text-gray-800">{v}</p></div>))}</div></div>{itin.notes && <div className="rounded-xl border p-5" style={{ background: '#fefce8', borderColor: '#fde68a' }}><p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#d97706' }}>Internal Notes</p><p className="text-sm" style={{ color: '#92400e' }}>{itin.notes}</p></div>}</div><div className="space-y-4"><div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Components</h3>{[{ l: 'Flights', cnt: itin.flights.length, ic: 'plane' }, { l: 'Hotels', cnt: itin.hotels.length, ic: 'hotel' }, { l: 'Transfers', cnt: itin.transport.length, ic: 'car' }, { l: 'Activities', cnt: itin.attractions.length, ic: 'star' }, { l: 'Insurance', cnt: itin.insurance.length, ic: 'shield' }, { l: 'Car Rentals', cnt: itin.carRentals.length, ic: 'car' }].map(({ l, cnt, ic }) => (<div key={l} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><div className="flex items-center gap-2 text-sm text-gray-600"><span style={{ color: GHL.accent }}><Icon n={ic} c="w-4 h-4" /></span>{l}</div><span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={cnt ? { background: '#ccfbf1', color: GHL.accent } : { background: '#f3f4f6', color: '#9ca3af' }}>{cnt}</span></div>))}</div><div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Checklist Progress</h3><div className="flex items-center gap-3 mb-2"><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%`, background: checkDone === itin.checklist.length ? GHL.success : GHL.accent }} /></div><span className="text-sm font-semibold text-gray-700">{Math.round((checkDone / checkTotal) * 100)}%</span></div><p className="text-xs text-gray-400">{checkDone} of {itin.checklist.length} tasks completed</p></div></div></div>}

      {/* Passengers */}
      {tab === 'passengers' && <div className="space-y-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-gray-800">Passenger Information</h3><button onClick={() => setAddModal('passenger')} className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors" style={{ color: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Add Passenger</button></div>{itin.passengerList.length ? itin.passengerList.map((p) => (<div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: GHL.accent }}>{p.name.split(' ').map((n) => n[0]).join('')}</div><div><p className="font-bold text-gray-900">{p.name}</p><p className="text-xs text-gray-400">{p.nationality} &middot; {p.gender}</p></div></div><button onClick={() => handleDelete('passenger', p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-4 h-4" /></button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">{[['DOB', fmtDate(p.dob)], ['Passport', p.passport], ['Expires', fmtDate(p.passportExpiry)], ['Phone', p.phone], ['Email', p.email], ['Requests', p.specialRequests], ['Emergency', p.emergencyContact]].map(([k, v]) => (<div key={k}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="text-gray-700 font-medium truncate">{v || '--'}</p></div>))}</div></div>)) : <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm"><Icon n="users" c="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 mb-3">No passengers added yet</p><button onClick={() => setAddModal('passenger')} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-50" style={{ color: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Add first passenger</button></div>}</div>}

      {/* Bookings */}
      {tab === 'bookings' && <div className="space-y-4">
        <Accordion title="Flights" icon="plane" count={itin.flights.length} defaultOpen onAdd={() => setAddModal('flight')}><MiniTable cols={[{ key: 'from', label: 'From' }, { key: 'to', label: 'To' }, { key: 'airline', label: 'Airline' }, { key: 'flightNo', label: 'Flight#' }, { key: 'pnr', label: 'PNR' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }, { key: 'profit', label: 'Profit', render: profitRender }]} rows={itin.flights as unknown as Row[]} addLabel="Add flight" onAdd={() => setAddModal('flight')} onDelete={(id) => handleDelete('flight', id)} /></Accordion>
        <Accordion title="Hotels" icon="hotel" count={itin.hotels.length} defaultOpen onAdd={() => setAddModal('hotel')}><MiniTable cols={[{ key: 'name', label: 'Hotel' }, { key: 'city', label: 'City' }, { key: 'checkIn', label: 'Check In', render: (r: Row) => fmtDate(String(r.checkIn)) }, { key: 'checkOut', label: 'Check Out', render: (r: Row) => fmtDate(String(r.checkOut)) }, { key: 'roomType', label: 'Room' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }, { key: 'profit', label: 'Profit', render: profitRender }]} rows={itin.hotels as unknown as Row[]} addLabel="Add hotel" onAdd={() => setAddModal('hotel')} onDelete={(id) => handleDelete('hotel', id)} /></Accordion>
        <Accordion title="Transfers" icon="car" count={itin.transport.length} onAdd={() => setAddModal('transport')}><MiniTable cols={[{ key: 'type', label: 'Type' }, { key: 'provider', label: 'Provider' }, { key: 'pickup', label: 'Pickup' }, { key: 'dropoff', label: 'Drop-off' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.transport as unknown as Row[]} addLabel="Add transfer" onAdd={() => setAddModal('transport')} onDelete={(id) => handleDelete('transport', id)} /></Accordion>
        <Accordion title="Attractions &amp; Tours" icon="star" count={itin.attractions.length} onAdd={() => setAddModal('attraction')}><MiniTable cols={[{ key: 'name', label: 'Activity' }, { key: 'city', label: 'City' }, { key: 'date', label: 'Date', render: (r: Row) => fmtDate(String(r.date)) }, { key: 'ticketType', label: 'Type' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.attractions as unknown as Row[]} addLabel="Add activity" onAdd={() => setAddModal('attraction')} onDelete={(id) => handleDelete('attraction', id)} /></Accordion>
        <Accordion title="Travel Insurance" icon="shield" count={itin.insurance.length} onAdd={() => setAddModal('insurance')}><MiniTable cols={[{ key: 'provider', label: 'Provider' }, { key: 'policy', label: 'Policy#' }, { key: 'coverage', label: 'Coverage' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.insurance as unknown as Row[]} addLabel="Add insurance" onAdd={() => setAddModal('insurance')} onDelete={(id) => handleDelete('insurance', id)} /></Accordion>
        <Accordion title="Car Rentals" icon="car" count={itin.carRentals.length} onAdd={() => setAddModal('carRental')}><MiniTable cols={[{ key: 'company', label: 'Company' }, { key: 'vehicle', label: 'Vehicle' }, { key: 'pickup', label: 'Pickup' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.carRentals as unknown as Row[]} addLabel="Add car rental" onAdd={() => setAddModal('carRental')} onDelete={(id) => handleDelete('carRental', id)} /></Accordion>
      </div>}

      {/* Checklist */}
      {tab === 'checklist' && <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-800">Agent Checklist</h3><span className="text-sm font-semibold" style={{ color: checkDone === itin.checklist.length ? GHL.success : GHL.accent }}>{Math.round((checkDone / checkTotal) * 100)}% Complete</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6"><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%`, background: checkDone === itin.checklist.length ? GHL.success : GHL.accent }} /></div><div className="space-y-2">{itin.checklist.map((c) => (<div key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group"><button onClick={() => toggleCheck(c.id)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors" style={c.done ? { background: GHL.success, borderColor: GHL.success } : { borderColor: '#d1d5db' }}>{c.done && <Icon n="check" c="w-3 h-3 text-white" />}</button><span className={`flex-1 text-sm ${c.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{c.text}</span><button onClick={() => deleteCheckItem(c.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>))}</div><div className="flex gap-2 mt-4 pt-4 border-t border-gray-100"><input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCheckItem()} placeholder="Add new checklist item..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" /><button onClick={addCheckItem} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div></div>}

      {/* Financials */}
      {tab === 'financials' && <div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="rounded-xl p-5 text-white shadow-sm" style={{ background: GHL.sidebar }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Total Revenue</p><p className="text-2xl font-bold">{fmt(fin.totalSell)}</p></div><div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Cost</p><p className="text-2xl font-bold text-gray-900">{fmt(fin.totalCost)}</p></div><div className="rounded-xl border p-5 shadow-sm" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: GHL.success }}>Total Profit</p><p className="text-2xl font-bold" style={{ color: GHL.success }}>{fmt(fin.profit)}</p><p className="text-xs mt-1" style={{ color: GHL.success }}>{fin.margin}% margin</p></div><div className="rounded-xl border p-5 shadow-sm" style={{ background: '#fffbeb', borderColor: '#fde68a' }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: GHL.warning }}>Balance Due</p><p className="text-2xl font-bold" style={{ color: GHL.warning }}>{fmt(fin.balance)}</p><p className="text-xs mt-1 text-gray-400">Deposits: {fmt(fin.deposits)}</p></div></div><div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr style={{ background: '#f8fafc' }} className="border-b border-gray-100">{['Category', 'Items', 'Cost', 'Selling Price', 'Profit', 'Margin'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{[{ l: 'Flights', items: itin.flights }, { l: 'Hotels', items: itin.hotels }, { l: 'Transport', items: itin.transport }, { l: 'Attractions', items: itin.attractions }, { l: 'Insurance', items: itin.insurance }, { l: 'Car Rentals', items: itin.carRentals }].filter((s) => s.items.length > 0).map((s) => { const sc = s.items.reduce((a, b) => a + (b.cost || 0), 0); const ss = s.items.reduce((a, b) => a + (b.sell || 0), 0); const sp = ss - sc; return (<tr key={s.l} className="hover:bg-gray-50/50"><td className="px-5 py-4 font-medium text-gray-800">{s.l}</td><td className="px-5 py-4 text-gray-500">{s.items.length}</td><td className="px-5 py-4 text-gray-700">{fmt(sc)}</td><td className="px-5 py-4 font-medium text-gray-900">{fmt(ss)}</td><td className="px-5 py-4 font-semibold" style={{ color: GHL.success }}>{fmt(sp)}</td><td className="px-5 py-4 text-gray-500">{ss ? ((sp / ss) * 100).toFixed(1) : 0}%</td></tr>); })}<tr className="font-bold border-t-2 border-gray-200" style={{ background: '#f8fafc' }}><td className="px-5 py-4">TOTAL</td><td className="px-5 py-4" /><td className="px-5 py-4">{fmt(fin.totalCost)}</td><td className="px-5 py-4">{fmt(fin.totalSell)}</td><td className="px-5 py-4" style={{ color: GHL.success }}>{fmt(fin.profit)}</td><td className="px-5 py-4 text-gray-700">{fin.margin}%</td></tr></tbody></table></div></div>}

      {/* Modern Print/Timeline View */}
      {tab === 'print' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between no-print">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client-Facing Itinerary</p>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90" style={{ background: GHL.sidebar }}><Icon n="print" c="w-4 h-4" /> Print / Export PDF</button>
          </div>
          <div className="p-8 max-w-3xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
            {/* Header with agency branding */}
            <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: `3px solid ${GHL.accent}` }}>
              <div>
                <div className="text-2xl font-bold tracking-tight" style={{ color: GHL.accent }}>{agencyProfile.name.toUpperCase()}</div>
                <div className="text-xs text-gray-500 tracking-widest mt-1">{agencyProfile.email} &middot; {agencyProfile.phone}</div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Prepared for: <strong className="text-gray-900">{itin.client}</strong></p>
                <p>{fmtDate(new Date().toISOString())}</p>
              </div>
            </div>

            {/* Trip title */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{itin.title}</h1>
              <p className="text-gray-500 text-lg">{fmtDate(itin.startDate)} &ndash; {fmtDate(itin.endDate)}</p>
              <p className="text-gray-400 text-sm mt-1">{itin.destination} &middot; {itin.passengers} Travelers &middot; {nights(itin.startDate, itin.endDate)} Nights</p>
            </div>

            {/* Travelers */}
            {itin.passengerList.length > 0 && (
              <div className="mb-8">
                <h2 className="font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-4 uppercase text-xs tracking-[0.2em]">Travelers</h2>
                <div className="grid grid-cols-2 gap-3">
                  {itin.passengerList.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>{p.name.split(' ').map((n) => n[0]).join('')}</div>
                      <div><p className="font-semibold text-gray-900 text-sm">{p.name}</p><p className="text-xs text-gray-400">{p.nationality}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day-by-day timeline */}
            {timelineDays.length > 0 && (
              <div className="mb-8">
                <h2 className="font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-6 uppercase text-xs tracking-[0.2em]">Your Day-by-Day Itinerary</h2>
                <div className="space-y-6">
                  {timelineDays.map(([date, events], dayIdx) => (
                    <div key={date} className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: GHL.sidebar }}>
                          {new Date(date + 'T12:00').toLocaleDateString('en-US', { day: 'numeric' })}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{new Date(date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          <p className="text-xs text-gray-400">Day {dayIdx + 1}</p>
                        </div>
                      </div>
                      <div className="ml-5 pl-8 border-l-2 border-gray-100 space-y-3">
                        {events.map((ev, i) => (
                          <div key={i} className="relative flex gap-3 pb-2">
                            <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 border-white" style={{ background: iconColors[ev.icon] || GHL.accent }} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-gray-900 text-sm">{ev.title}</p>
                                {ev.time && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{ev.time}</span>}
                              </div>
                              <p className="text-sm text-gray-500">{ev.subtitle}</p>
                              {ev.detail && <p className="text-xs text-gray-400 mt-0.5">{ev.detail}</p>}
                              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: (iconColors[ev.icon] || GHL.accent) + '15', color: iconColors[ev.icon] || GHL.accent }}>{ev.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance */}
            {itin.insurance.length > 0 && (
              <div className="mb-8">
                <h2 className="font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-4 uppercase text-xs tracking-[0.2em]">Travel Insurance</h2>
                {itin.insurance.map((ins, i) => (
                  <div key={i} className="py-2 text-sm"><strong>{ins.provider}</strong> &middot; {ins.coverage} &middot; Policy: {ins.policy}</div>
                ))}
              </div>
            )}

            {/* Important Notes */}
            {itin.notes && (
              <div className="mb-8 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Important Notes</p>
                <p className="text-sm text-amber-800">{itin.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 pt-6 text-center" style={{ borderTop: `3px solid ${GHL.accent}` }}>
              <p className="font-bold text-lg" style={{ color: GHL.accent }}>{agencyProfile.name.toUpperCase()}</p>
              <p className="text-sm text-gray-500 mt-1">{agencyProfile.email} &middot; {agencyProfile.phone}</p>
              <p className="text-xs text-gray-400 mt-2">Prepared by {itin.agent}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {addModal === 'flight' && <FormModal title="Add Flight" fields={FLIGHT_FIELDS} onSave={(d) => handleAdd('flight', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'hotel' && <FormModal title="Add Hotel" fields={HOTEL_FIELDS} onSave={(d) => handleAdd('hotel', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'transport' && <FormModal title="Add Transfer" fields={TRANSPORT_FIELDS} onSave={(d) => handleAdd('transport', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'attraction' && <FormModal title="Add Activity" fields={ATTRACTION_FIELDS} onSave={(d) => handleAdd('attraction', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'insurance' && <FormModal title="Add Insurance" fields={INSURANCE_FIELDS} onSave={(d) => handleAdd('insurance', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'carRental' && <FormModal title="Add Car Rental" fields={CAR_RENTAL_FIELDS} onSave={(d) => handleAdd('carRental', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'passenger' && <FormModal title="Add Passenger" fields={PASSENGER_FIELDS} onSave={(d) => handleAdd('passenger', d)} onClose={() => setAddModal(null)} />}
      {editModal && <FormModal title="Edit Itinerary" subtitle="Update trip details" fields={editFields} onSave={handleEditSave} onClose={() => setEditModal(false)} initial={editInitial} />}
    </div>
  );
}
