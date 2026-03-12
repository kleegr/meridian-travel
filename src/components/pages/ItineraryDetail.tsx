'use client';

import { useState } from 'react';
import { Icon, StatusBadge, Accordion, FormModal, SmartFormModal, MiniTable } from '@/components/ui';
import PrintView from './PrintView';
import { GHL, AGENTS, STATUSES } from '@/lib/constants';
import { calcFin, fmt, fmtDate, nights, uid } from '@/lib/utils';
import { FLIGHT_FIELDS, HOTEL_FIELDS, TRANSPORT_FIELDS, ATTRACTION_FIELDS, INSURANCE_FIELDS, CAR_RENTAL_FIELDS, PASSENGER_FIELDS, DAVENING_FIELDS, MIKVAH_FIELDS, ITINERARY_FIELDS } from '@/components/forms/field-configs';
import type { Itinerary, Flight, Hotel, Transport, Attraction, Insurance, CarRental, Passenger, Davening, Mikvah, Row, AgencyProfile, FormField } from '@/lib/types';

interface Props { itin: Itinerary; onBack: () => void; onUpdate: (updated: Itinerary) => void; onDelete?: () => void; agencyProfile: AgencyProfile; }

export default function ItineraryDetail({ itin, onBack, onUpdate, onDelete, agencyProfile }: Props) {
  const [tab, setTab] = useState('overview');
  const [addModal, setAddModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const fin = calcFin(itin);

  const toggleVip = () => {
    const updated = { ...itin, isVip: !itin.isVip };
    // If turning ON VIP and no gift checklist item exists, add one
    if (!itin.isVip && !itin.checklist.some((c) => c.text.toLowerCase().includes('vip'))) {
      updated.checklist = [...itin.checklist, { id: uid(), text: 'Send VIP welcome gift', done: false }];
    }
    onUpdate(updated);
  };

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
      case 'davening': updated.davening = [...(itin.davening||[]), { ...entry, id: uid() } as unknown as Davening]; break;
      case 'mikvah': updated.mikvah = [...(itin.mikvah||[]), { ...entry, id: uid() } as unknown as Mikvah]; break;
    }
    onUpdate(updated); setAddModal(null);
  };

  const handleAddMultipleFlights = (flights: Record<string, string>[]) => {
    const newFlights = flights.map((data) => ({ ...data, id: uid(), cost: parseFloat(data.cost) || 0, sell: parseFloat(data.sell) || 0 } as unknown as Flight));
    const updated = { ...itin };
    updated.flights = [...itin.flights, ...newFlights];
    onUpdate(updated);
  };

  const handleFlightSaveWithConnections = (data: Record<string, string>) => {
    const mainFlight = { ...data, id: uid(), cost: parseFloat(data.cost) || 0, sell: parseFloat(data.sell) || 0 } as unknown as Flight;
    const updated = { ...itin };
    updated.flights = [...itin.flights, mainFlight];
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
      case 'davening': updated.davening = (itin.davening||[]).filter((d) => d.id !== id); break;
      case 'mikvah': updated.mikvah = (itin.mikvah||[]).filter((m) => m.id !== id); break;
    }
    onUpdate(updated);
  };

  const handleDuplicate = () => { onUpdate({ ...JSON.parse(JSON.stringify(itin)), id: uid(), title: itin.title + ' (Copy)', status: 'Draft', created: new Date().toISOString().split('T')[0] }); };
  const handleEditSave = (data: Record<string, string>) => { onUpdate({ ...itin, title: data.title || itin.title, client: data.client || itin.client, agent: data.agent || itin.agent, destination: data.destination || itin.destination, startDate: data.startDate || itin.startDate, endDate: data.endDate || itin.endDate, passengers: parseInt(data.passengers) || itin.passengers, status: data.status || itin.status, tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : itin.tags, notes: data.notes ?? itin.notes, isVip: data.isVip === 'true' }); setEditModal(false); };
  const toggleCheck = (id: number) => onUpdate({ ...itin, checklist: itin.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) });
  const addCheckItem = () => { if (!newCheckItem.trim()) return; onUpdate({ ...itin, checklist: [...itin.checklist, { id: uid(), text: newCheckItem.trim(), done: false }] }); setNewCheckItem(''); };
  const deleteCheckItem = (id: number) => onUpdate({ ...itin, checklist: itin.checklist.filter((c) => c.id !== id) });

  const profitRender = (r: Row) => <span style={{ color: GHL.success }} className="font-semibold">{fmt(Number(r.sell) - Number(r.cost))}</span>;
  const costRender = (r: Row) => fmt(Number(r.cost));
  const sellRender = (r: Row) => fmt(Number(r.sell));
  const checkDone = itin.checklist.filter((c) => c.done).length;
  const checkTotal = itin.checklist.length || 1;
  const editFields: FormField[] = ITINERARY_FIELDS.map((f) => { if (f.key === 'agent') return { ...f, options: AGENTS }; if (f.key === 'status') return { ...f, options: STATUSES }; return f; });
  const editInitial = { title: itin.title, client: itin.client, agent: itin.agent, destination: itin.destination, startDate: itin.startDate, endDate: itin.endDate, passengers: String(itin.passengers), status: itin.status, tags: itin.tags.join(', '), notes: itin.notes, isVip: itin.isVip ? 'true' : '' };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: GHL.muted }}><Icon n="back" c="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold truncate" style={{ color: GHL.text }}>{itin.title}</h2>
            <StatusBadge status={itin.status} />
            {itin.isVip && <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>VIP</span>}
            {itin.tags.map((t) => <span key={t} className="text-xs px-2 py-1 rounded-full" style={{ background: GHL.accentLight, color: GHL.accent }}>{t}</span>)}
          </div>
          <p className="text-sm mt-0.5" style={{ color: GHL.muted }}>{itin.client} &middot; {itin.agent} &middot; {(itin.destinations && itin.destinations.length > 1) ? itin.destinations.join(', ') : itin.destination}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setEditModal(true)} className="p-2.5 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }} title="Edit"><Icon n="edit" c="w-4 h-4" /></button>
          <button onClick={handleDuplicate} className="p-2.5 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }} title="Duplicate"><Icon n="copy" c="w-4 h-4" /></button>
          {onDelete && <button onClick={() => { if (confirm('Delete this itinerary permanently?')) onDelete(); }} className="p-2.5 rounded-lg border hover:bg-red-50 hover:border-red-200" style={{ borderColor: GHL.border, color: GHL.muted }} title="Delete"><Icon n="trash" c="w-4 h-4" /></button>}
          <button onClick={() => setTab('print')} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90" style={{ background: GHL.sidebar }}><Icon n="print" c="w-4 h-4" /> Client View</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">{[{ l: 'Revenue', v: fmt(fin.totalSell), c: GHL.text }, { l: 'Profit', v: fmt(fin.profit), c: GHL.success }, { l: 'Margin', v: `${fin.margin}%`, c: GHL.text }, { l: 'Balance', v: fmt(fin.balance), c: GHL.warning }, { l: 'Pax', v: String(itin.passengers), c: GHL.text }, { l: 'Nights', v: String(nights(itin.startDate, itin.endDate)), c: GHL.text }, { l: 'Tasks', v: `${checkDone}/${itin.checklist.length}`, c: checkDone === itin.checklist.length ? GHL.success : GHL.warning }].map((s) => (<div key={s.l} className="bg-white rounded-xl border p-3 text-center shadow-sm" style={{ borderColor: GHL.border }}><p className="text-xs mb-1" style={{ color: GHL.muted }}>{s.l}</p><p className="font-bold text-sm" style={{ color: s.c }}>{s.v}</p></div>))}</div>

      {/* Tabs */}
      <div className="border-b flex gap-1 overflow-x-auto" style={{ borderColor: GHL.border }}>{[{ id: 'overview', l: 'Overview' }, { id: 'passengers', l: 'Passengers', cnt: itin.passengerList.length }, { id: 'bookings', l: 'Bookings' }, { id: 'checklist', l: 'Checklist', cnt: itin.checklist.length }, { id: 'financials', l: 'Financials' }, { id: 'print', l: 'Client Itinerary' }].map((t) => (<button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap" style={tab === t.id ? { color: GHL.accent, borderBottom: `2px solid ${GHL.accent}`, background: GHL.accentLight } : { color: GHL.muted }}>{t.l}{t.cnt !== undefined ? <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs" style={{ background: GHL.bg, color: GHL.muted }}>{t.cnt}</span> : null}</button>))}</div>

      {/* Overview */}
      {tab === 'overview' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: GHL.text }}>Trip Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[['Client', itin.client], ['Agent', itin.agent], ['Destination', (itin.destinations && itin.destinations.length > 1) ? itin.destinations.join(', ') : itin.destination], ['Passengers', String(itin.passengers)], ['Departure', fmtDate(itin.startDate)], ['Return', fmtDate(itin.endDate)], ['Status', itin.status], ['Created', fmtDate(itin.created)]].map(([k, v]) => (
                <div key={k}><p className="text-xs mb-0.5" style={{ color: GHL.muted }}>{k}</p><p className="font-semibold" style={{ color: GHL.text }}>{v}</p></div>
              ))}
            </div>
          </div>

          {/* VIP Toggle */}
          <div
            className="rounded-xl border p-4 flex items-center justify-between cursor-pointer transition-all"
            style={{ background: itin.isVip ? '#fefce8' : 'white', borderColor: itin.isVip ? '#fde68a' : GHL.border }}
            onClick={toggleVip}
          >
            <div className="flex items-center gap-3">
              <button className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors" style={itin.isVip ? { background: '#d97706', borderColor: '#d97706' } : { borderColor: '#d1d5db' }}>
                {itin.isVip && <Icon n="check" c="w-4 h-4 text-white" />}
              </button>
              <div>
                <p className="font-semibold text-sm" style={{ color: GHL.text }}>VIP Client</p>
                <p className="text-xs" style={{ color: GHL.muted }}>
                  {itin.isVip ? 'This client is marked as VIP \u2014 gift reminder is on the checklist' : 'Mark as VIP to add a gift reminder to the checklist'}
                </p>
              </div>
            </div>
            {itin.isVip && <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>VIP</span>}
          </div>

          {itin.notes && <div className="rounded-xl border p-5" style={{ background: '#fefce8', borderColor: '#fde68a' }}><p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#d97706' }}>Internal Notes</p><p className="text-sm" style={{ color: '#92400e' }}>{itin.notes}</p></div>}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: GHL.text }}>Components</h3>
            {[{ l: 'Flights', cnt: itin.flights.length, ic: 'plane' }, { l: 'Hotels', cnt: itin.hotels.length, ic: 'hotel' }, { l: 'Transfers', cnt: itin.transport.length, ic: 'car' }, { l: 'Activities', cnt: itin.attractions.length, ic: 'star' }, { l: 'Insurance', cnt: itin.insurance.length, ic: 'shield' }, { l: 'Car Rentals', cnt: itin.carRentals.length, ic: 'car' }, { l: 'Davening', cnt: (itin.davening||[]).length, ic: 'star' }, { l: 'Mikvah', cnt: (itin.mikvah||[]).length, ic: 'globe' }].map(({ l, cnt, ic }) => (
              <div key={l} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><div className="flex items-center gap-2 text-sm" style={{ color: GHL.text }}><span style={{ color: GHL.accent }}><Icon n={ic} c="w-4 h-4" /></span>{l}</div><span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={cnt ? { background: GHL.accentLight, color: GHL.accent } : { background: GHL.bg, color: GHL.muted }}>{cnt}</span></div>
            ))}
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: GHL.text }}>Checklist</h3>
            <div className="flex items-center gap-3 mb-2"><div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: GHL.bg }}><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%`, background: checkDone === itin.checklist.length ? GHL.success : GHL.accent }} /></div><span className="text-sm font-semibold" style={{ color: GHL.text }}>{Math.round((checkDone / checkTotal) * 100)}%</span></div>
            <p className="text-xs" style={{ color: GHL.muted }}>{checkDone} of {itin.checklist.length} tasks</p>
          </div>
        </div>
      </div>}

      {/* Passengers */}
      {tab === 'passengers' && <div className="space-y-4"><div className="flex items-center justify-between"><h3 className="font-semibold" style={{ color: GHL.text }}>Passengers</h3><button onClick={() => setAddModal('passenger')} className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:opacity-80" style={{ color: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Add</button></div>{itin.passengerList.length ? itin.passengerList.map((p) => (<div key={p.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: GHL.accent }}>{p.name.split(' ').map((n) => n[0]).join('')}</div><div><p className="font-bold" style={{ color: GHL.text }}>{p.name}</p><p className="text-xs" style={{ color: GHL.muted }}>{p.nationality} &middot; {p.gender}</p></div></div><button onClick={() => handleDelete('passenger', p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-4 h-4" /></button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">{[['DOB', fmtDate(p.dob)], ['Passport', p.passport], ['Expires', fmtDate(p.passportExpiry)], ['Phone', p.phone], ['Email', p.email], ['Requests', p.specialRequests], ['Emergency', p.emergencyContact]].map(([k, v]) => (<div key={k}><p className="text-xs mb-0.5" style={{ color: GHL.muted }}>{k}</p><p className="font-medium truncate" style={{ color: GHL.text }}>{v || '--'}</p></div>))}</div></div>)) : <div className="bg-white rounded-xl border p-12 text-center shadow-sm" style={{ borderColor: GHL.border }}><Icon n="users" c="w-10 h-10 mx-auto mb-3" /><p className="mb-3" style={{ color: GHL.muted }}>No passengers yet</p><button onClick={() => setAddModal('passenger')} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg hover:opacity-80" style={{ color: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Add first passenger</button></div>}</div>}

      {/* Bookings */}
      {tab === 'bookings' && <div className="space-y-4">
        <Accordion title="Flights" icon="plane" count={itin.flights.length} defaultOpen onAdd={() => setAddModal('flight')}><MiniTable cols={[{ key: 'from', label: 'From' }, { key: 'to', label: 'To' }, { key: 'airline', label: 'Airline' }, { key: 'flightNo', label: 'Flight#' }, { key: 'tripType', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'depTerminal', label: 'Term' }, { key: 'duration', label: 'Dur.' }, { key: 'pnr', label: 'PNR' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }, { key: 'profit', label: 'Profit', render: profitRender }]} rows={itin.flights as unknown as Row[]} addLabel="Add flight" onAdd={() => setAddModal('flight')} onDelete={(id) => handleDelete('flight', id)} /></Accordion>
        <Accordion title="Hotels" icon="hotel" count={itin.hotels.length} defaultOpen onAdd={() => setAddModal('hotel')}><MiniTable cols={[{ key: 'name', label: 'Hotel' }, { key: 'city', label: 'City' }, { key: 'checkIn', label: 'In', render: (r: Row) => fmtDate(String(r.checkIn)) }, { key: 'checkOut', label: 'Out', render: (r: Row) => fmtDate(String(r.checkOut)) }, { key: 'roomType', label: 'Room' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.hotels as unknown as Row[]} addLabel="Add hotel" onAdd={() => setAddModal('hotel')} onDelete={(id) => handleDelete('hotel', id)} /></Accordion>
        <Accordion title="Transfers" icon="car" count={itin.transport.length} onAdd={() => setAddModal('transport')}><MiniTable cols={[{ key: 'type', label: 'Type' }, { key: 'provider', label: 'Provider' }, { key: 'pickup', label: 'Pickup' }, { key: 'dropoff', label: 'Drop-off' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.transport as unknown as Row[]} addLabel="Add transfer" onAdd={() => setAddModal('transport')} onDelete={(id) => handleDelete('transport', id)} /></Accordion>
        <Accordion title="Activities" icon="star" count={itin.attractions.length} onAdd={() => setAddModal('attraction')}><MiniTable cols={[{ key: 'name', label: 'Activity' }, { key: 'city', label: 'City' }, { key: 'date', label: 'Date', render: (r: Row) => fmtDate(String(r.date)) }, { key: 'ticketType', label: 'Type' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.attractions as unknown as Row[]} addLabel="Add activity" onAdd={() => setAddModal('attraction')} onDelete={(id) => handleDelete('attraction', id)} /></Accordion>
        <Accordion title="Insurance" icon="shield" count={itin.insurance.length} onAdd={() => setAddModal('insurance')}><MiniTable cols={[{ key: 'provider', label: 'Provider' }, { key: 'policy', label: 'Policy#' }, { key: 'coverage', label: 'Coverage' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.insurance as unknown as Row[]} addLabel="Add insurance" onAdd={() => setAddModal('insurance')} onDelete={(id) => handleDelete('insurance', id)} /></Accordion>
        <Accordion title="Car Rentals" icon="car" count={itin.carRentals.length} onAdd={() => setAddModal('carRental')}><MiniTable cols={[{ key: 'company', label: 'Company' }, { key: 'vehicle', label: 'Vehicle' }, { key: 'pickup', label: 'Pickup' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.carRentals as unknown as Row[]} addLabel="Add car rental" onAdd={() => setAddModal('carRental')} onDelete={(id) => handleDelete('carRental', id)} /></Accordion>
        <Accordion title="Davening / Minyan" icon="star" count={(itin.davening||[]).length} onAdd={() => setAddModal('davening')}><MiniTable cols={[{ key: 'location', label: 'Shul' }, { key: 'city', label: 'Area' }, { key: 'type', label: 'Type' }, { key: 'shachris', label: 'Shachris' }, { key: 'mincha', label: 'Mincha' }, { key: 'mariv', label: 'Maariv' }]} rows={(itin.davening||[]) as unknown as Row[]} addLabel="Add minyan" onAdd={() => setAddModal('davening')} onDelete={(id) => handleDelete('davening', id)} /></Accordion>
        <Accordion title="Mikvah" icon="globe" count={(itin.mikvah||[]).length} onAdd={() => setAddModal('mikvah')}><MiniTable cols={[{ key: 'name', label: 'Mikvah' }, { key: 'city', label: 'Area' }, { key: 'address', label: 'Address' }, { key: 'hours', label: 'Hours' }, { key: 'gender', label: 'For' }]} rows={(itin.mikvah||[]) as unknown as Row[]} addLabel="Add mikvah" onAdd={() => setAddModal('mikvah')} onDelete={(id) => handleDelete('mikvah', id)} /></Accordion>
      </div>}

      {/* Checklist */}
      {tab === 'checklist' && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><div className="flex items-center justify-between mb-4"><h3 className="font-semibold" style={{ color: GHL.text }}>Agent Checklist</h3><span className="text-sm font-semibold" style={{ color: checkDone === itin.checklist.length ? GHL.success : GHL.accent }}>{Math.round((checkDone / checkTotal) * 100)}%</span></div><div className="h-2 rounded-full overflow-hidden mb-6" style={{ background: GHL.bg }}><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%`, background: checkDone === itin.checklist.length ? GHL.success : GHL.accent }} /></div><div className="space-y-2">{itin.checklist.map((c) => (<div key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group"><button onClick={() => toggleCheck(c.id)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={c.done ? { background: GHL.success, borderColor: GHL.success } : { borderColor: '#d1d5db' }}>{c.done && <Icon n="check" c="w-3 h-3 text-white" />}</button><span className={`flex-1 text-sm ${c.done ? 'line-through' : ''}`} style={{ color: c.done ? GHL.muted : GHL.text }}>{c.text}</span><button onClick={() => deleteCheckItem(c.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>))}</div><div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: GHL.border }}><input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCheckItem()} placeholder="Add new checklist item..." className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /><button onClick={addCheckItem} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div></div>}

      {/* Financials */}
      {tab === 'financials' && <div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="rounded-xl p-5 text-white shadow-sm" style={{ background: GHL.sidebar }}><p className="text-xs uppercase tracking-wider mb-2 opacity-70">Revenue</p><p className="text-2xl font-bold">{fmt(fin.totalSell)}</p></div><div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Cost</p><p className="text-2xl font-bold" style={{ color: GHL.text }}>{fmt(fin.totalCost)}</p></div><div className="rounded-xl border p-5 shadow-sm" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: GHL.success }}>Profit</p><p className="text-2xl font-bold" style={{ color: GHL.success }}>{fmt(fin.profit)}</p><p className="text-xs mt-1" style={{ color: GHL.success }}>{fin.margin}%</p></div><div className="rounded-xl border p-5 shadow-sm" style={{ background: '#fffbeb', borderColor: '#fde68a' }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: GHL.warning }}>Balance</p><p className="text-2xl font-bold" style={{ color: GHL.warning }}>{fmt(fin.balance)}</p></div></div><div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}><table className="w-full text-sm"><thead><tr style={{ background: GHL.bg }}>{['Category', 'Items', 'Cost', 'Sell', 'Profit', 'Margin'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: GHL.muted }}>{h}</th>)}</tr></thead><tbody className="divide-y">{[{ l: 'Flights', items: itin.flights }, { l: 'Hotels', items: itin.hotels }, { l: 'Transport', items: itin.transport }, { l: 'Activities', items: itin.attractions }, { l: 'Insurance', items: itin.insurance }, { l: 'Car Rentals', items: itin.carRentals }].filter((s) => s.items.length > 0).map((s) => { const sc = s.items.reduce((a, b) => a + (b.cost || 0), 0); const ss = s.items.reduce((a, b) => a + (b.sell || 0), 0); const sp = ss - sc; return (<tr key={s.l}><td className="px-5 py-4 font-medium" style={{ color: GHL.text }}>{s.l}</td><td className="px-5 py-4" style={{ color: GHL.muted }}>{s.items.length}</td><td className="px-5 py-4">{fmt(sc)}</td><td className="px-5 py-4">{fmt(ss)}</td><td className="px-5 py-4 font-semibold" style={{ color: GHL.success }}>{fmt(sp)}</td><td className="px-5 py-4" style={{ color: GHL.muted }}>{ss ? ((sp / ss) * 100).toFixed(1) : 0}%</td></tr>); })}<tr className="font-bold" style={{ background: GHL.bg }}><td className="px-5 py-4">TOTAL</td><td className="px-5 py-4" /><td className="px-5 py-4">{fmt(fin.totalCost)}</td><td className="px-5 py-4">{fmt(fin.totalSell)}</td><td className="px-5 py-4" style={{ color: GHL.success }}>{fmt(fin.profit)}</td><td className="px-5 py-4">{fin.margin}%</td></tr></tbody></table></div></div>}

      {/* Print View */}
      {tab === 'print' && <PrintView itin={itin} agencyProfile={agencyProfile} />}

      {/* Modals */}
      {addModal === 'flight' && <SmartFormModal title="Add Flight" subtitle="Upload a PDF or enter flight number" fields={FLIGHT_FIELDS} onSave={(d) => handleFlightSaveWithConnections(d)} onClose={() => setAddModal(null)} mode="flight" onSaveMultipleFlights={(connections) => handleAddMultipleFlights(connections)} />}
      {addModal === 'hotel' && <SmartFormModal title="Add Hotel" subtitle="Search for a hotel to auto-fill" fields={HOTEL_FIELDS} onSave={(d) => handleAdd('hotel', d)} onClose={() => setAddModal(null)} mode="hotel" />}
      {addModal === 'transport' && <FormModal title="Add Transfer" fields={TRANSPORT_FIELDS} onSave={(d) => handleAdd('transport', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'attraction' && <FormModal title="Add Activity" fields={ATTRACTION_FIELDS} onSave={(d) => handleAdd('attraction', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'insurance' && <FormModal title="Add Insurance" fields={INSURANCE_FIELDS} onSave={(d) => handleAdd('insurance', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'carRental' && <FormModal title="Add Car Rental" fields={CAR_RENTAL_FIELDS} onSave={(d) => handleAdd('carRental', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'passenger' && <FormModal title="Add Passenger" fields={PASSENGER_FIELDS} onSave={(d) => handleAdd('passenger', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'davening' && <FormModal title="Add Davening / Minyan" subtitle="Shachris, Mincha, Maariv and Shabbos" fields={DAVENING_FIELDS} onSave={(d) => handleAdd('davening', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'mikvah' && <FormModal title="Add Mikvah" subtitle="Location, hours and details" fields={MIKVAH_FIELDS} onSave={(d) => handleAdd('mikvah', d)} onClose={() => setAddModal(null)} />}
      {editModal && <SmartFormModal title="Edit Itinerary" subtitle="Update trip details" fields={editFields} onSave={handleEditSave} onClose={() => setEditModal(false)} initial={editInitial} />}
    </div>
  );
}
