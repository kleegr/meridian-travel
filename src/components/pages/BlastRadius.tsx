'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmt, fmtDate } from '@/lib/utils';
import type { Itinerary } from '@/lib/types';

interface Props { itin: Itinerary; }

type ChangeType = 'cancel_flight' | 'change_date' | 'add_pax' | 'cancel_hotel' | 'change_destination';

interface Impact { severity: 'high' | 'medium' | 'low'; item: string; category: string; description: string; icon: string; }

const CHANGE_OPTIONS: { id: ChangeType; label: string; icon: string; description: string }[] = [
  { id: 'cancel_flight', label: 'Cancel a Flight', icon: 'plane', description: 'What happens if a flight is cancelled or changed?' },
  { id: 'change_date', label: 'Change Trip Dates', icon: 'calendar', description: 'Impact of shifting the entire trip forward or back' },
  { id: 'add_pax', label: 'Add a Passenger', icon: 'users', description: 'What needs updating when adding another traveler?' },
  { id: 'cancel_hotel', label: 'Cancel a Hotel', icon: 'hotel', description: 'Ripple effects of cancelling a hotel booking' },
  { id: 'change_destination', label: 'Change Destination', icon: 'map', description: 'What breaks if you swap out a destination?' },
];

const SEV_COLORS = { high: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '!!' }, medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: '!' }, low: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: '\u2713' } };

export default function BlastRadius({ itin }: Props) {
  const [selectedChange, setSelectedChange] = useState<ChangeType | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);

  const impacts = useMemo(() => {
    if (!selectedChange) return [];
    const results: Impact[] = [];

    if (selectedChange === 'cancel_flight') {
      const flight = itin.flights.find((f) => f.id === selectedFlight) || itin.flights[0];
      if (!flight) return [{ severity: 'low' as const, item: 'No flights', category: 'Info', description: 'No flights to analyze', icon: 'plane' }];
      results.push({ severity: 'high', item: `${flight.airline} ${flight.flightNo}`, category: 'Flight', description: `Flight ${flight.from} \u2192 ${flight.to} would be cancelled. Need to rebook.`, icon: 'plane' });
      const connectedFlights = itin.flights.filter((f) => f.connectionGroup === flight.connectionGroup && f.id !== flight.id);
      connectedFlights.forEach((f) => results.push({ severity: 'high', item: `${f.airline} ${f.flightNo}`, category: 'Connected Flight', description: `Connection flight also affected. ${f.from} \u2192 ${f.to} may need rebooking.`, icon: 'plane' }));
      itin.transport.forEach((t) => results.push({ severity: 'medium', item: `${t.type} - ${t.provider}`, category: 'Transfer', description: `Airport transfer may need new pickup time`, icon: 'car' }));
      if (itin.hotels.length > 0) results.push({ severity: 'medium', item: 'Hotel check-in', category: 'Hotel', description: 'Check-in time may need adjusting if arrival changes', icon: 'hotel' });
      results.push({ severity: 'low', item: 'Client notification', category: 'Communication', description: 'Client must be notified of flight change', icon: 'bell' });
      results.push({ severity: 'medium', item: `Cost impact: ${fmt(flight.cost)}`, category: 'Financial', description: 'Refund/rebooking costs to be calculated', icon: 'dollar' });
    }

    if (selectedChange === 'change_date') {
      itin.flights.forEach((f) => results.push({ severity: 'high', item: `${f.airline} ${f.flightNo}`, category: 'Flight', description: 'Flight dates must be changed or rebooked', icon: 'plane' }));
      itin.hotels.forEach((h) => results.push({ severity: 'high', item: h.name, category: 'Hotel', description: `Check-in/out dates need updating (${h.checkIn} - ${h.checkOut})`, icon: 'hotel' }));
      itin.transport.forEach((t) => results.push({ severity: 'medium', item: `${t.type}`, category: 'Transfer', description: 'Pickup dates/times need adjusting', icon: 'car' }));
      itin.attractions.forEach((a) => results.push({ severity: 'medium', item: a.name, category: 'Activity', description: 'Activity date needs changing, check availability', icon: 'star' }));
      itin.insurance.forEach(() => results.push({ severity: 'low', item: 'Travel insurance', category: 'Insurance', description: 'Policy dates may need updating', icon: 'shield' }));
      results.push({ severity: 'low', item: 'Updated itinerary', category: 'Communication', description: 'Send updated itinerary to client', icon: 'bell' });
    }

    if (selectedChange === 'add_pax') {
      itin.flights.forEach((f) => results.push({ severity: 'high', item: `${f.airline} ${f.flightNo}`, category: 'Flight', description: 'Additional seat needed. Check availability and price.', icon: 'plane' }));
      itin.hotels.forEach((h) => results.push({ severity: 'medium', item: h.name, category: 'Hotel', description: `Room capacity check. May need additional room (${h.rooms} currently).`, icon: 'hotel' }));
      itin.transport.forEach((t) => results.push({ severity: 'medium', item: `${t.type}`, category: 'Transfer', description: 'Vehicle capacity check. May need larger vehicle.', icon: 'car' }));
      itin.attractions.forEach((a) => results.push({ severity: 'low', item: a.name, category: 'Activity', description: 'Additional ticket needed', icon: 'star' }));
      itin.insurance.forEach(() => results.push({ severity: 'medium', item: 'Insurance', category: 'Insurance', description: 'New traveler needs to be added to policy', icon: 'shield' }));
      results.push({ severity: 'low', item: 'Passport & docs', category: 'Documents', description: 'Collect passport and travel documents for new traveler', icon: 'user' });
      const totalCost = itin.flights.reduce((s, f) => s + f.cost, 0) + itin.hotels.reduce((s, h) => s + h.cost, 0);
      results.push({ severity: 'medium', item: `Est. additional cost: ${fmt(totalCost * 0.4)}`, category: 'Financial', description: 'Rough estimate for additional passenger costs', icon: 'dollar' });
    }

    if (selectedChange === 'cancel_hotel') {
      const hotel = itin.hotels.find((h) => h.id === selectedHotel) || itin.hotels[0];
      if (!hotel) return [{ severity: 'low' as const, item: 'No hotels', category: 'Info', description: 'No hotels to analyze', icon: 'hotel' }];
      results.push({ severity: 'high', item: hotel.name, category: 'Hotel', description: `${hotel.city} accommodation cancelled. Need alternative for ${hotel.checkIn} - ${hotel.checkOut}.`, icon: 'hotel' });
      results.push({ severity: 'medium', item: `Cost: ${fmt(hotel.cost)}`, category: 'Financial', description: 'Check cancellation policy and refund eligibility', icon: 'dollar' });
      itin.transport.filter((t) => t.dropoff?.toLowerCase().includes(hotel.city.toLowerCase())).forEach((t) => results.push({ severity: 'medium', item: `${t.type}`, category: 'Transfer', description: 'Drop-off location may change with new hotel', icon: 'car' }));
      itin.attractions.filter((a) => a.city === hotel.city).forEach((a) => results.push({ severity: 'low', item: a.name, category: 'Activity', description: 'Activity still in same city, logistics may change', icon: 'star' }));
    }

    if (selectedChange === 'change_destination') {
      results.push({ severity: 'high', item: 'All flights', category: 'Flights', description: `${itin.flights.length} flights need complete rebooking to new destination`, icon: 'plane' });
      results.push({ severity: 'high', item: 'All hotels', category: 'Hotels', description: `${itin.hotels.length} hotel bookings need cancelling and rebooking`, icon: 'hotel' });
      results.push({ severity: 'high', item: 'All transfers', category: 'Transfers', description: `${itin.transport.length} transfers no longer valid`, icon: 'car' });
      results.push({ severity: 'high', item: 'All activities', category: 'Activities', description: `${itin.attractions.length} activities need replacing`, icon: 'star' });
      itin.insurance.forEach(() => results.push({ severity: 'medium', item: 'Insurance', category: 'Insurance', description: 'Coverage area may need updating', icon: 'shield' }));
      (itin.davening || []).forEach(() => results.push({ severity: 'medium', item: 'Davening locations', category: 'Religious', description: 'Need to find new shuls at destination', icon: 'star' }));
      results.push({ severity: 'high', item: 'Destination info', category: 'Content', description: 'All destination research needs redoing', icon: 'globe' });
      results.push({ severity: 'low', item: 'Client approval', category: 'Communication', description: 'Client must approve the destination change', icon: 'bell' });
    }

    return results;
  }, [selectedChange, selectedFlight, selectedHotel, itin]);

  const highCount = impacts.filter((i) => i.severity === 'high').length;
  const medCount = impacts.filter((i) => i.severity === 'medium').length;
  const lowCount = impacts.filter((i) => i.severity === 'low').length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
        <h3 className="font-semibold text-sm mb-1" style={{ color: GHL.text }}>Blast Radius Analysis</h3>
        <p className="text-xs mb-4" style={{ color: GHL.muted }}>Select a change to see what gets affected across the entire itinerary</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">{CHANGE_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => setSelectedChange(opt.id)} className="p-3 rounded-xl border text-left transition-all hover:shadow-sm" style={selectedChange === opt.id ? { background: GHL.accentLight, borderColor: GHL.accent } : { borderColor: GHL.border }}><div className="flex items-center gap-2 mb-1"><Icon n={opt.icon} c="w-4 h-4" /><span className="text-sm font-semibold" style={{ color: selectedChange === opt.id ? GHL.accent : GHL.text }}>{opt.label}</span></div><p className="text-[10px]" style={{ color: GHL.muted }}>{opt.description}</p></button>))}</div>
      </div>

      {/* Sub-selector for specific items */}
      {selectedChange === 'cancel_flight' && itin.flights.length > 1 && (
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Which flight?</p>
          <div className="flex flex-wrap gap-2">{itin.flights.map((f) => (<button key={f.id} onClick={() => setSelectedFlight(f.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={selectedFlight === f.id ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { borderColor: GHL.border, color: GHL.muted }}>{f.airline} {f.flightNo} ({f.from}\u2192{f.to})</button>))}</div>
        </div>
      )}

      {selectedChange === 'cancel_hotel' && itin.hotels.length > 1 && (
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Which hotel?</p>
          <div className="flex flex-wrap gap-2">{itin.hotels.map((h) => (<button key={h.id} onClick={() => setSelectedHotel(h.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={selectedHotel === h.id ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { borderColor: GHL.border, color: GHL.muted }}>{h.name} ({h.city})</button>))}</div>
        </div>
      )}

      {/* Results */}
      {impacts.length > 0 && (
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: GHL.text }}>Impact Analysis ({impacts.length} items affected)</p>
            <div className="flex gap-2">
              {highCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#fef2f2', color: '#dc2626' }}>{highCount} Critical</span>}
              {medCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#fffbeb', color: '#d97706' }}>{medCount} Warning</span>}
              {lowCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: '#f0fdf4', color: '#16a34a' }}>{lowCount} Info</span>}
            </div>
          </div>
          <div className="space-y-2">{impacts.map((impact, i) => { const sc = SEV_COLORS[impact.severity]; return (<div key={i} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: sc.bg, borderColor: sc.border }}><span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: sc.color + '15', color: sc.color }}><Icon n={impact.icon} c="w-3.5 h-3.5" /></span><div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs font-semibold" style={{ color: sc.color }}>{impact.item}</span><span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: sc.color + '15', color: sc.color }}>{impact.category}</span></div><p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>{impact.description}</p></div><span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: sc.color + '20', color: sc.color }}>{impact.severity}</span></div>); })}</div>
        </div>
      )}
    </div>
  );
}
