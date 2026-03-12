'use client';

import { useState } from 'react';
import { Icon, StatusBadge, Accordion, FormModal, MiniTable } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { calcFin, fmt, fmtDate, nights, uid } from '@/lib/utils';
import { FLIGHT_FIELDS, HOTEL_FIELDS, TRANSPORT_FIELDS, ATTRACTION_FIELDS, INSURANCE_FIELDS, CAR_RENTAL_FIELDS, PASSENGER_FIELDS } from '@/components/forms/field-configs';
import type { Itinerary, Flight, Hotel, Transport, Attraction, Insurance, CarRental, Passenger, Row } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onBack: () => void;
  onUpdate: (updated: Itinerary) => void;
}

export default function ItineraryDetail({ itin, onBack, onUpdate }: Props) {
  const [tab, setTab] = useState('overview');
  const [addModal, setAddModal] = useState<string | null>(null);
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

  const handleDuplicate = () => {
    const dup: Itinerary = { ...JSON.parse(JSON.stringify(itin)), id: uid(), title: itin.title + ' (Copy)', status: 'Draft', created: new Date().toISOString().split('T')[0] };
    onUpdate(dup);
  };

  const toggleCheck = (id: number) => onUpdate({ ...itin, checklist: itin.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) });
  const addCheckItem = () => { if (!newCheckItem.trim()) return; onUpdate({ ...itin, checklist: [...itin.checklist, { id: uid(), text: newCheckItem.trim(), done: false }] }); setNewCheckItem(''); };
  const deleteCheckItem = (id: number) => onUpdate({ ...itin, checklist: itin.checklist.filter((c) => c.id !== id) });

  const profitRender = (r: Row) => <span style={{ color: GHL.success }} className="font-semibold">{fmt(Number(r.sell) - Number(r.cost))}</span>;
  const costRender = (r: Row) => fmt(Number(r.cost));
  const sellRender = (r: Row) => fmt(Number(r.sell));
  const checkDone = itin.checklist.filter((c) => c.done).length;
  const checkTotal = itin.checklist.length || 1;

  const tabs = [
    { id: 'overview', l: 'Overview' },
    { id: 'passengers', l: 'Passengers', cnt: itin.passengerList.length },
    { id: 'bookings', l: 'Bookings' },
    { id: 'checklist', l: 'Checklist', cnt: itin.checklist.length },
    { id: 'financials', l: 'Financials' },
    { id: 'print', l: 'Print Preview' },
  ];

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
          <p className="text-gray-400 text-sm mt-0.5">{itin.client} \u00b7 {itin.agent} \u00b7 {itin.destination}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleDuplicate} className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Duplicate"><Icon n="copy" c="w-4 h-4" /></button>
          <button onClick={() => setTab('print')} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90" style={{ background: GHL.sidebar }}>
            <Icon n="print" c="w-4 h-4" /> Client View
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {[{ l: 'Revenue', v: fmt(fin.totalSell), c: GHL.text }, { l: 'Profit', v: fmt(fin.profit), c: GHL.success }, { l: 'Margin', v: `${fin.margin}%`, c: GHL.text }, { l: 'Balance Due', v: fmt(fin.balance), c: GHL.warning }, { l: 'Passengers', v: String(itin.passengers), c: GHL.text }, { l: 'Nights', v: String(nights(itin.startDate, itin.endDate)), c: GHL.text }, { l: 'Checklist', v: `${checkDone}/${itin.checklist.length}`, c: checkDone === itin.checklist.length ? GHL.success : GHL.warning }].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{s.l}</p>
            <p className="font-bold text-sm" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap" style={tab === t.id ? { color: GHL.accent, borderBottom: `2px solid ${GHL.accent}`, background: '#f0fdfa' } : { color: '#6b7280' }}>
            {t.l}{t.cnt !== undefined ? <span className="ml-1.5 bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5 text-xs">{t.cnt}</span> : null}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Trip Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[['Client', itin.client], ['Agent', itin.agent], ['Destination', itin.destination], ['Passengers', String(itin.passengers)], ['Departure', fmtDate(itin.startDate)], ['Return', fmtDate(itin.endDate)], ['Status', itin.status], ['Created', fmtDate(itin.created)]].map(([k, v]) => (
                  <div key={k}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="font-semibold text-gray-800">{v}</p></div>
                ))}
              </div>
            </div>
            {itin.notes && (
              <div className="rounded-xl border p-5" style={{ background: '#fefce8', borderColor: '#fde68a' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#d97706' }}>Internal Notes</p>
                <p className="text-sm" style={{ color: '#92400e' }}>{itin.notes}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Components</h3>
              {[{ l: 'Flights', cnt: itin.flights.length, ic: 'plane' }, { l: 'Hotels', cnt: itin.hotels.length, ic: 'hotel' }, { l: 'Transfers', cnt: itin.transport.length, ic: 'car' }, { l: 'Activities', cnt: itin.attractions.length, ic: 'star' }, { l: 'Insurance', cnt: itin.insurance.length, ic: 'shield' }, { l: 'Car Rentals', cnt: itin.carRentals.length, ic: 'car' }].map(({ l, cnt, ic }) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><span style={{ color: GHL.accent }}><Icon n={ic} c="w-4 h-4" /></span>{l}</div>
                  <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={cnt ? { background: '#ccfbf1', color: GHL.accent } : { background: '#f3f4f6', color: '#9ca3af' }}>{cnt}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Checklist Progress</h3>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%`, background: checkDone === itin.checklist.length ? GHL.success : GHL.accent }} />
                </div>
                <span className="text-sm font-semibold text-gray-700">{Math.round((checkDone / checkTotal) * 100)}%</span>
              </div>
              <p className="text-xs text-gray-400">{checkDone} of {itin.checklist.length} tasks completed</p>
            </div>
          </div>
        </div>
      )}

      {/* Passengers */}
      {tab === 'passengers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Passenger Information</h3>
            <button onClick={() => setAddModal('passenger')} className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors" style={{ color: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Add Passenger</button>
          </div>
          {itin.passengerList.length ? itin.passengerList.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: GHL.accent }}>{p.name.split(' ').map((n) => n[0]).join('')}</div>
                  <div><p className="font-bold text-gray-900">{p.name}</p><p className="text-xs text-gray-400">{p.nationality} \u00b7 {p.gender}</p></div>
                </div>
                <button onClick={() => handleDelete('passenger', p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[['DOB', fmtDate(p.dob)], ['Passport', p.passport], ['Expires', fmtDate(p.passportExpiry)], ['Phone', p.phone], ['Email', p.email], ['Requests', p.specialRequests], ['Emergency', p.emergencyContact]].map(([k, v]) => (
                  <div key={k}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="text-gray-700 font-medium truncate">{v || '--'}</p></div>
                ))}
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <Icon n="users" c="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 mb-3">No passengers added yet</p>
              <button onClick={() => setAddModal('passenger')} className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-50" style={{ color: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Add first passenger</button>
            </div>
          )}
        </div>
      )}

      {/* Bookings */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          <Accordion title="Flights" icon="plane" count={itin.flights.length} defaultOpen onAdd={() => setAddModal('flight')}>
            <MiniTable cols={[{ key: 'from', label: 'From' }, { key: 'to', label: 'To' }, { key: 'airline', label: 'Airline' }, { key: 'flightNo', label: 'Flight#' }, { key: 'pnr', label: 'PNR' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }, { key: 'profit', label: 'Profit', render: profitRender }]} rows={itin.flights as unknown as Row[]} addLabel="Add flight" onAdd={() => setAddModal('flight')} onDelete={(id) => handleDelete('flight', id)} />
          </Accordion>
          <Accordion title="Hotels" icon="hotel" count={itin.hotels.length} defaultOpen onAdd={() => setAddModal('hotel')}>
            <MiniTable cols={[{ key: 'name', label: 'Hotel' }, { key: 'city', label: 'City' }, { key: 'checkIn', label: 'Check In', render: (r: Row) => fmtDate(String(r.checkIn)) }, { key: 'checkOut', label: 'Check Out', render: (r: Row) => fmtDate(String(r.checkOut)) }, { key: 'roomType', label: 'Room' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }, { key: 'profit', label: 'Profit', render: profitRender }]} rows={itin.hotels as unknown as Row[]} addLabel="Add hotel" onAdd={() => setAddModal('hotel')} onDelete={(id) => handleDelete('hotel', id)} />
          </Accordion>
          <Accordion title="Transfers" icon="car" count={itin.transport.length} onAdd={() => setAddModal('transport')}>
            <MiniTable cols={[{ key: 'type', label: 'Type' }, { key: 'provider', label: 'Provider' }, { key: 'pickup', label: 'Pickup' }, { key: 'dropoff', label: 'Drop-off' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.transport as unknown as Row[]} addLabel="Add transfer" onAdd={() => setAddModal('transport')} onDelete={(id) => handleDelete('transport', id)} />
          </Accordion>
          <Accordion title="Attractions & Tours" icon="star" count={itin.attractions.length} onAdd={() => setAddModal('attraction')}>
            <MiniTable cols={[{ key: 'name', label: 'Activity' }, { key: 'city', label: 'City' }, { key: 'date', label: 'Date', render: (r: Row) => fmtDate(String(r.date)) }, { key: 'ticketType', label: 'Type' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.attractions as unknown as Row[]} addLabel="Add activity" onAdd={() => setAddModal('attraction')} onDelete={(id) => handleDelete('attraction', id)} />
          </Accordion>
          <Accordion title="Travel Insurance" icon="shield" count={itin.insurance.length} onAdd={() => setAddModal('insurance')}>
            <MiniTable cols={[{ key: 'provider', label: 'Provider' }, { key: 'policy', label: 'Policy#' }, { key: 'coverage', label: 'Coverage' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.insurance as unknown as Row[]} addLabel="Add insurance" onAdd={() => setAddModal('insurance')} onDelete={(id) => handleDelete('insurance', id)} />
          </Accordion>
          <Accordion title="Car Rentals" icon="car" count={itin.carRentals.length} onAdd={() => setAddModal('carRental')}>
            <MiniTable cols={[{ key: 'company', label: 'Company' }, { key: 'vehicle', label: 'Vehicle' }, { key: 'pickup', label: 'Pickup' }, { key: 'cost', label: 'Cost', render: costRender }, { key: 'sell', label: 'Sell', render: sellRender }]} rows={itin.carRentals as unknown as Row[]} addLabel="Add car rental" onAdd={() => setAddModal('carRental')} onDelete={(id) => handleDelete('carRental', id)} />
          </Accordion>
        </div>
      )}

      {/* Checklist */}
      {tab === 'checklist' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Agent Checklist</h3>
            <span className="text-sm font-semibold" style={{ color: checkDone === itin.checklist.length ? GHL.success : GHL.accent }}>{Math.round((checkDone / checkTotal) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%`, background: checkDone === itin.checklist.length ? GHL.success : GHL.accent }} />
          </div>
          <div className="space-y-2">
            {itin.checklist.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <button onClick={() => toggleCheck(c.id)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors" style={c.done ? { background: GHL.success, borderColor: GHL.success } : { borderColor: '#d1d5db' }}>
                  {c.done && <Icon n="check" c="w-3 h-3 text-white" />}
                </button>
                <span className={`flex-1 text-sm ${c.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{c.text}</span>
                <button onClick={() => deleteCheckItem(c.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
                  <Icon n="trash" c="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCheckItem()} placeholder="Add new checklist item..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
            <button onClick={addCheckItem} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button>
          </div>
        </div>
      )}

      {/* Financials */}
      {tab === 'financials' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-5 text-white shadow-sm" style={{ background: GHL.sidebar }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Total Revenue</p><p className="text-2xl font-bold">{fmt(fin.totalSell)}</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Cost</p><p className="text-2xl font-bold text-gray-900">{fmt(fin.totalCost)}</p></div>
            <div className="rounded-xl border p-5 shadow-sm" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: GHL.success }}>Total Profit</p><p className="text-2xl font-bold" style={{ color: GHL.success }}>{fmt(fin.profit)}</p><p className="text-xs mt-1" style={{ color: GHL.success }}>{fin.margin}% margin</p></div>
            <div className="rounded-xl border p-5 shadow-sm" style={{ background: '#fffbeb', borderColor: '#fde68a' }}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: GHL.warning }}>Balance Due</p><p className="text-2xl font-bold" style={{ color: GHL.warning }}>{fmt(fin.balance)}</p><p className="text-xs mt-1 text-gray-400">Deposits: {fmt(fin.deposits)}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr style={{ background: '#f8fafc' }} className="border-b border-gray-100">{['Category', 'Items', 'Cost', 'Selling Price', 'Profit', 'Margin'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {[{ l: 'Flights', items: itin.flights }, { l: 'Hotels', items: itin.hotels }, { l: 'Transport', items: itin.transport }, { l: 'Attractions', items: itin.attractions }, { l: 'Insurance', items: itin.insurance }, { l: 'Car Rentals', items: itin.carRentals }].filter((s) => s.items.length > 0).map((s) => {
                  const sc = s.items.reduce((a, b) => a + (b.cost || 0), 0);
                  const ss = s.items.reduce((a, b) => a + (b.sell || 0), 0);
                  const sp = ss - sc;
                  return (<tr key={s.l} className="hover:bg-gray-50/50"><td className="px-5 py-4 font-medium text-gray-800">{s.l}</td><td className="px-5 py-4 text-gray-500">{s.items.length}</td><td className="px-5 py-4 text-gray-700">{fmt(sc)}</td><td className="px-5 py-4 font-medium text-gray-900">{fmt(ss)}</td><td className="px-5 py-4 font-semibold" style={{ color: GHL.success }}>{fmt(sp)}</td><td className="px-5 py-4 text-gray-500">{ss ? ((sp / ss) * 100).toFixed(1) : 0}%</td></tr>);
                })}
                <tr className="font-bold border-t-2 border-gray-200" style={{ background: '#f8fafc' }}><td className="px-5 py-4">TOTAL</td><td className="px-5 py-4" /><td className="px-5 py-4">{fmt(fin.totalCost)}</td><td className="px-5 py-4">{fmt(fin.totalSell)}</td><td className="px-5 py-4" style={{ color: GHL.success }}>{fmt(fin.profit)}</td><td className="px-5 py-4 text-gray-700">{fin.margin}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Preview */}
      {tab === 'print' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client-Facing Itinerary</p>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90" style={{ background: GHL.sidebar }}><Icon n="print" c="w-4 h-4" /> Print / Export PDF</button>
          </div>
          <div className="p-8 max-w-3xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
            <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: `2px solid ${GHL.sidebar}` }}>
              <div><div className="text-2xl font-bold tracking-tight" style={{ color: GHL.accent }}>KLEEGR</div><div className="text-xs text-gray-500 tracking-widest mt-1">TRAVEL MANAGEMENT</div></div>
              <div className="text-right text-sm text-gray-500"><p>Prepared for: <strong className="text-gray-900">{itin.client}</strong></p><p>{fmtDate(new Date().toISOString())}</p></div>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{itin.title}</h1>
              <p className="text-gray-500">{fmtDate(itin.startDate)} to {fmtDate(itin.endDate)} \u00b7 {itin.destination} \u00b7 {itin.passengers} Passengers</p>
            </div>
            {itin.passengerList.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Travelers</h2>{itin.passengerList.map((p, i) => <div key={i} className="py-2 text-sm border-b border-gray-100 last:border-0"><strong>{p.name}</strong> \u00b7 {p.nationality}</div>)}</div>}
            {itin.flights.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Flights</h2>{itin.flights.map((f, i) => <div key={i} className="flex justify-between py-2 text-sm border-b border-gray-100 last:border-0"><div><strong>{f.airline} {f.flightNo}</strong> \u00b7 {f.from} \u2192 {f.to}</div><div className="text-gray-500">{f.departure} \u00b7 PNR: {f.pnr}</div></div>)}</div>}
            {itin.hotels.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Accommodation</h2>{itin.hotels.map((h, i) => <div key={i} className="py-2 text-sm border-b border-gray-100 last:border-0"><div className="flex justify-between"><strong>{h.name}</strong><span className="text-gray-500">Ref: {h.ref}</span></div><p className="text-gray-500">{h.city} \u00b7 {h.roomType} x{h.rooms} \u00b7 {fmtDate(h.checkIn)} to {fmtDate(h.checkOut)}</p></div>)}</div>}
            {itin.transport.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Transfers</h2>{itin.transport.map((t, i) => <div key={i} className="py-2 text-sm border-b border-gray-100 last:border-0"><div className="flex justify-between"><strong>{t.type}</strong><span className="text-gray-500">{t.pickupDateTime}</span></div><p className="text-gray-500">{t.pickup} \u2192 {t.dropoff} \u00b7 {t.provider}</p></div>)}</div>}
            {itin.attractions.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Activities & Tours</h2>{itin.attractions.map((a, i) => <div key={i} className="py-2 text-sm border-b border-gray-100 last:border-0"><div className="flex justify-between"><strong>{a.name}</strong><span className="text-gray-500">{fmtDate(a.date)} {a.time}</span></div><p className="text-gray-500">{a.city} \u00b7 {a.ticketType}</p></div>)}</div>}
            <div className="mt-8 pt-6 text-center text-xs text-gray-400" style={{ borderTop: `2px solid ${GHL.sidebar}` }}>
              <p className="font-semibold" style={{ color: GHL.accent }}>KLEEGR</p>
              <p className="mt-1">Prepared by {itin.agent} \u00b7 info@kleegr.com</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Modals */}
      {addModal === 'flight' && <FormModal title="Add Flight" subtitle="Add a flight segment" fields={FLIGHT_FIELDS} onSave={(d) => handleAdd('flight', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'hotel' && <FormModal title="Add Hotel" subtitle="Add accommodation" fields={HOTEL_FIELDS} onSave={(d) => handleAdd('hotel', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'transport' && <FormModal title="Add Transfer" subtitle="Add transportation" fields={TRANSPORT_FIELDS} onSave={(d) => handleAdd('transport', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'attraction' && <FormModal title="Add Activity" subtitle="Add tour or attraction" fields={ATTRACTION_FIELDS} onSave={(d) => handleAdd('attraction', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'insurance' && <FormModal title="Add Insurance" subtitle="Add travel insurance" fields={INSURANCE_FIELDS} onSave={(d) => handleAdd('insurance', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'carRental' && <FormModal title="Add Car Rental" subtitle="Add vehicle rental" fields={CAR_RENTAL_FIELDS} onSave={(d) => handleAdd('carRental', d)} onClose={() => setAddModal(null)} />}
      {addModal === 'passenger' && <FormModal title="Add Passenger" subtitle="Add traveler information" fields={PASSENGER_FIELDS} onSave={(d) => handleAdd('passenger', d)} onClose={() => setAddModal(null)} />}
    </div>
  );
}
