'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmtDate, uid } from '@/lib/utils';
import type { Itinerary, Flight, Hotel } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
  initial?: Record<string, string>;
  onSendToDriver?: (message: string) => void;
}

const SCENARIOS = [
  { value: 'airport-pickup', label: 'Airport Pickup', pickupType: 'airport', dropoffType: 'hotel' },
  { value: 'airport-dropoff', label: 'Airport Drop-off', pickupType: 'hotel', dropoffType: 'airport' },
  { value: 'hotel-to-airport', label: 'Hotel to Airport', pickupType: 'hotel', dropoffType: 'airport' },
  { value: 'airport-to-hotel', label: 'Airport to Hotel', pickupType: 'airport', dropoffType: 'hotel' },
  { value: 'airport-to-airport', label: 'Airport to Airport', pickupType: 'airport', dropoffType: 'airport' },
  { value: 'hotel-to-hotel', label: 'Hotel to Hotel', pickupType: 'hotel', dropoffType: 'hotel' },
  { value: 'attraction', label: 'Attraction Transportation', pickupType: 'custom', dropoffType: 'custom' },
  { value: 'general', label: 'General Transportation', pickupType: 'custom', dropoffType: 'custom' },
  { value: 'custom', label: 'Custom Route', pickupType: 'custom', dropoffType: 'custom' },
];

function getAirports(flights: Flight[]): { code: string; city: string; fullAddress: string; terminal: string; label: string }[] {
  const airports: { code: string; city: string; fullAddress: string; terminal: string; label: string }[] = [];
  const seen = new Set<string>();
  flights.forEach(f => {
    if (f.from && !seen.has(f.from)) {
      seen.add(f.from);
      const terminal = f.depTerminal ? `, Terminal ${f.depTerminal}` : '';
      airports.push({ code: f.from, city: f.fromCity || '', fullAddress: `${f.from} Airport, ${f.fromCity || ''}${terminal}`, terminal: f.depTerminal || '', label: `${f.from} - ${f.fromCity || 'Departure'}` });
    }
    if (f.to && !seen.has(f.to)) {
      seen.add(f.to);
      const terminal = f.arrTerminal ? `, Terminal ${f.arrTerminal}` : '';
      airports.push({ code: f.to, city: f.toCity || '', fullAddress: `${f.to} Airport, ${f.toCity || ''}${terminal}`, terminal: f.arrTerminal || '', label: `${f.to} - ${f.toCity || 'Arrival'}` });
    }
  });
  return airports;
}

function getHotels(hotels: Hotel[]): { name: string; address: string; city: string; label: string }[] {
  return hotels.map(h => ({ name: h.name, address: h.hotelAddress || `${h.name}, ${h.city}`, city: h.city, label: `${h.name} - ${h.city}` }));
}

function mapsLink(from: string, to: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}

export default function SmartTransferModal({ itin, onSave, onClose, initial, onSendToDriver }: Props) {
  const [scenario, setScenario] = useState(initial?.transferScenario || '');
  const [linkedFlightId, setLinkedFlightId] = useState(initial?.linkedFlightId || '');
  const [pickup, setPickup] = useState(initial?.pickup || '');
  const [pickupAddress, setPickupAddress] = useState(initial?.pickupAddress || '');
  const [dropoff, setDropoff] = useState(initial?.dropoff || '');
  const [dropoffAddress, setDropoffAddress] = useState(initial?.dropoffAddress || '');
  const [vehicleType, setVehicleType] = useState(initial?.type || 'Private Transfer');
  const [carType, setCarType] = useState(initial?.carType || '');
  const [provider, setProvider] = useState(initial?.provider || '');
  const [pickupDate, setPickupDate] = useState(initial?.pickupDateTime || '');
  const [pickupTime, setPickupTime] = useState(initial?.pickupTime || '');
  const [recommendedTime, setRecommendedTime] = useState(initial?.recommendedPickupTime || '');
  const [travelTime, setTravelTime] = useState(initial?.estimatedTravelTime || '');
  const [driverName, setDriverName] = useState(initial?.driverName || '');
  const [driverPhone, setDriverPhone] = useState(initial?.driverPhone || '');
  const [ref, setRef] = useState(initial?.ref || '');
  const [cost, setCost] = useState(initial?.cost || '');
  const [sell, setSell] = useState(initial?.sell || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [showDriverPreview, setShowDriverPreview] = useState(false);

  const airports = useMemo(() => getAirports(itin.flights), [itin.flights]);
  const hotels = useMemo(() => getHotels(itin.hotels), [itin.hotels]);
  const scenarioDef = SCENARIOS.find(s => s.value === scenario);
  const linkedFlight = itin.flights.find(f => String(f.id) === linkedFlightId);

  // Google Maps route link
  const routeLink = (pickupAddress && dropoffAddress) ? mapsLink(pickupAddress, dropoffAddress) : (pickup && dropoff) ? mapsLink(pickup, dropoff) : '';

  // Auto-calculate recommended pickup
  const calcRecommended = () => {
    if (!linkedFlight) return;
    const depTime = linkedFlight.departure || linkedFlight.scheduledDeparture;
    if (!depTime) return;
    try {
      const dep = new Date(depTime);
      const bufferMs = 2 * 60 * 60 * 1000;
      const travelMs = parseInt(travelTime || '45') * 60 * 1000;
      const recommended = new Date(dep.getTime() - bufferMs - travelMs);
      const h = recommended.getHours();
      const m = recommended.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const timeStr = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
      setRecommendedTime(timeStr);
      if (!pickupTime) setPickupTime(timeStr);
    } catch {}
  };

  const selectPickupAirport = (code: string) => {
    const ap = airports.find(a => a.code === code);
    if (ap) { setPickup(`${ap.code} Airport`); setPickupAddress(ap.fullAddress); }
  };

  const selectPickupHotel = (name: string) => {
    const h = hotels.find(ht => ht.name === name);
    if (h) { setPickup(h.name); setPickupAddress(h.address); }
  };

  const selectDropoffAirport = (code: string) => {
    const ap = airports.find(a => a.code === code);
    if (ap) { setDropoff(`${ap.code} Airport`); setDropoffAddress(ap.fullAddress); }
  };

  const selectDropoffHotel = (name: string) => {
    const h = hotels.find(ht => ht.name === name);
    if (h) { setDropoff(h.name); setDropoffAddress(h.address); }
  };

  const selectFlight = (flightIdStr: string) => {
    setLinkedFlightId(flightIdStr);
    const fl = itin.flights.find(f => String(f.id) === flightIdStr);
    if (!fl) return;
    if (scenarioDef?.pickupType === 'airport') selectPickupAirport(fl.to || fl.from);
    if (scenarioDef?.dropoffType === 'airport') selectDropoffAirport(fl.from || fl.to);
    if (fl.departure) setPickupDate(fl.departure.split('T')[0]);
  };

  const handleSave = () => {
    onSave({
      transferScenario: scenario, type: vehicleType,
      carType, provider, pickup, pickupAddress, dropoff, dropoffAddress,
      pickupDateTime: pickupDate, pickupTime,
      recommendedPickupTime: recommendedTime, estimatedTravelTime: travelTime,
      linkedFlightId, driverName, driverPhone, ref, cost, sell, notes,
    });
  };

  // Build driver message with full addresses, terminal, and Google Maps link
  const flightTerminal = linkedFlight ? (linkedFlight.depTerminal ? `Terminal ${linkedFlight.depTerminal}` : '') : '';
  const driverMsg = [
    `TRANSPORTATION DETAILS`,
    ``,
    `Client: ${itin.client}`,
    `Phone: ${(itin.clientPhones || [])[0] || 'N/A'}`,
    ``,
    `Type: ${scenarioDef?.label || scenario || 'Transportation'}`,
    `Date: ${pickupDate ? fmtDate(pickupDate) : 'TBD'}`,
    `Pickup Time: ${pickupTime || recommendedTime || 'TBD'}`,
    ``,
    `PICKUP: ${pickup}`,
    pickupAddress ? `Address: ${pickupAddress}` : '',
    ``,
    `DROP-OFF: ${dropoff}`,
    dropoffAddress ? `Address: ${dropoffAddress}` : '',
    linkedFlight ? `\nFLIGHT: ${linkedFlight.airline} ${linkedFlight.flightNo}` : '',
    linkedFlight ? `Route: ${linkedFlight.from} > ${linkedFlight.to}` : '',
    linkedFlight ? `Departure: ${linkedFlight.scheduledDeparture || ''}` : '',
    flightTerminal ? `Terminal: ${flightTerminal}` : '',
    notes ? `\nNotes: ${notes}` : '',
    routeLink ? `\nRoute Map: ${routeLink}` : '',
    ``,
    `Itinerary: ${itin.title}`,
    `Travelers: ${itin.passengers}`,
  ].filter(Boolean).join('\n');

  const ic = 'w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white';
  const lc = 'block text-[9px] font-bold uppercase tracking-wider mb-1';
  const isAirportScenario = scenarioDef && (scenarioDef.pickupType === 'airport' || scenarioDef.dropoffType === 'airport');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: GHL.border }}>
          <h2 className="text-lg font-bold" style={{ color: GHL.text }}>{initial ? 'Edit Transportation' : 'Add Transportation'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Scenario - DROPDOWN */}
          <div>
            <label className={lc} style={{ color: GHL.muted }}>Transportation Scenario</label>
            <select value={scenario} onChange={e => setScenario(e.target.value)} className={ic + ' text-sm'} style={{ borderColor: GHL.border }}>
              <option value="">Select scenario...</option>
              {SCENARIOS.map(sc => (<option key={sc.value} value={sc.value}>{sc.label}</option>))}
            </select>
          </div>

          {/* Linked Flight - only for airport scenarios */}
          {isAirportScenario && itin.flights.length > 0 && (
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Linked Flight</label>
              <select value={linkedFlightId} onChange={e => selectFlight(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                <option value="">Select a flight...</option>
                {itin.flights.map(f => (<option key={f.id} value={String(f.id)}>{f.airline} {f.flightNo} - {f.from} to {f.to} ({f.scheduledDeparture || fmtDate(f.departure?.split('T')[0] || '')})</option>))}
              </select>
            </div>
          )}

          {/* Pickup & Dropoff */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Pickup</label>
              {scenarioDef?.pickupType === 'airport' && airports.length > 0 ? (
                <select value={airports.find(a => pickup.includes(a.code))?.code || ''} onChange={e => selectPickupAirport(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">Select airport...</option>
                  {airports.map(a => (<option key={a.code} value={a.code}>{a.label}{a.terminal ? ` (T${a.terminal})` : ''}</option>))}
                </select>
              ) : scenarioDef?.pickupType === 'hotel' && hotels.length > 0 ? (
                <select value={pickup} onChange={e => selectPickupHotel(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">Select hotel...</option>
                  {hotels.map(h => (<option key={h.name} value={h.name}>{h.label}</option>))}
                </select>
              ) : (
                <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Enter pickup location" className={ic} style={{ borderColor: GHL.border }} />
              )}
              {pickupAddress && <p className="text-[9px] mt-1 px-1 flex items-center gap-1" style={{ color: GHL.muted }}><Icon n="map" c="w-2.5 h-2.5" />{pickupAddress}</p>}
              {scenario === 'custom' && <input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} placeholder="Full pickup address" className={ic + ' mt-1'} style={{ borderColor: GHL.border }} />}
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Drop-off</label>
              {scenarioDef?.dropoffType === 'airport' && airports.length > 0 ? (
                <select value={airports.find(a => dropoff.includes(a.code))?.code || ''} onChange={e => selectDropoffAirport(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">Select airport...</option>
                  {airports.map(a => (<option key={a.code} value={a.code}>{a.label}{a.terminal ? ` (T${a.terminal})` : ''}</option>))}
                </select>
              ) : scenarioDef?.dropoffType === 'hotel' && hotels.length > 0 ? (
                <select value={dropoff} onChange={e => selectDropoffHotel(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">Select hotel...</option>
                  {hotels.map(h => (<option key={h.name} value={h.name}>{h.label}</option>))}
                </select>
              ) : (
                <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Enter drop-off location" className={ic} style={{ borderColor: GHL.border }} />
              )}
              {dropoffAddress && <p className="text-[9px] mt-1 px-1 flex items-center gap-1" style={{ color: GHL.muted }}><Icon n="map" c="w-2.5 h-2.5" />{dropoffAddress}</p>}
              {scenario === 'custom' && <input value={dropoffAddress} onChange={e => setDropoffAddress(e.target.value)} placeholder="Full drop-off address" className={ic + ' mt-1'} style={{ borderColor: GHL.border }} />}
            </div>
          </div>

          {/* Google Maps Route Link */}
          {routeLink && (
            <a href={routeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-lg border hover:bg-blue-50" style={{ borderColor: GHL.border, color: GHL.accent }}>
              <Icon n="map" c="w-3 h-3" /> View Route on Google Maps
            </a>
          )}

          {/* Pickup Time Section */}
          <div>
            {(scenarioDef?.value === 'hotel-to-airport' || scenarioDef?.value === 'airport-dropoff') && linkedFlight && (
              <div className="rounded-lg p-2.5 mb-3 text-[10px] leading-relaxed" style={{ background: '#eff6ff', color: '#1e40af' }}>
                <strong>Pickup time calculation:</strong> Flight departure minus 2-hour airport buffer minus travel time from pickup to airport.
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lc} style={{ color: GHL.muted }}>Pickup Date</label><input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
              <div>
                <label className={lc} style={{ color: GHL.muted }}>Pickup Time</label>
                <input value={pickupTime} onChange={e => setPickupTime(e.target.value)} placeholder={recommendedTime || '9:30 AM'} className={ic} style={{ borderColor: GHL.border }} />
                {pickupTime && recommendedTime && pickupTime !== recommendedTime && <p className="text-[9px] mt-0.5 px-1" style={{ color: '#d97706' }}>Recommended: {recommendedTime} (manual override)</p>}
              </div>
              <div>
                <label className={lc} style={{ color: GHL.muted }}>Travel Time (minutes)</label>
                <div className="flex gap-1">
                  <input value={travelTime} onChange={e => setTravelTime(e.target.value)} placeholder="45" className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />
                  {(scenarioDef?.value === 'hotel-to-airport' || scenarioDef?.value === 'airport-dropoff') && linkedFlight && (
                    <button type="button" onClick={calcRecommended} className="px-2 py-1 text-[9px] font-semibold rounded-lg whitespace-nowrap" style={{ background: GHL.accentLight, color: GHL.accent }}>Calculate</button>
                  )}
                </div>
                {recommendedTime && <p className="text-[9px] mt-0.5 px-1" style={{ color: GHL.success }}>Recommended: {recommendedTime}</p>}
              </div>
            </div>
          </div>

          {/* Vehicle + Driver */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lc} style={{ color: GHL.muted }}>Vehicle Type</label><select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option>Private Transfer</option><option>Shared Transfer</option><option>Taxi</option><option>Train</option><option>Bus</option><option>Ferry</option><option>Other</option></select></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Vehicle Details</label><input value={carType} onChange={e => setCarType(e.target.value)} placeholder="Mercedes V-Class" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Provider</label><input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Roma Transfers" className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lc} style={{ color: GHL.muted }}>Driver Name</label><input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Marco" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Driver Phone</label><input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="+39 333 123 4567" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Reference Number</label><input value={ref} onChange={e => setRef(e.target.value)} placeholder="RT-4422" className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lc} style={{ color: GHL.muted }}>Cost ($)</label><input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Sell ($)</label><input type="number" value={sell} onChange={e => setSell(e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>

          <div><label className={lc} style={{ color: GHL.muted }}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Special requests..." className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /></div>

          {/* Driver Communication */}
          <div className="border-t pt-4" style={{ borderColor: GHL.border }}>
            <button onClick={() => setShowDriverPreview(!showDriverPreview)} className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: GHL.border, color: showDriverPreview ? GHL.accent : GHL.muted }}>
              <Icon n="car" c="w-3.5 h-3.5" /> {showDriverPreview ? 'Hide' : 'Preview'} Driver Message
            </button>
            {showDriverPreview && (
              <div className="mt-3 rounded-xl border p-4" style={{ borderColor: GHL.border, background: GHL.bg }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: GHL.text }}>Message to Driver</p>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(driverMsg)} className="text-[9px] font-semibold px-2.5 py-1 rounded-lg border hover:bg-white" style={{ borderColor: GHL.border, color: GHL.muted }}><Icon n="copy" c="w-2.5 h-2.5 inline mr-1" />Copy</button>
                    {onSendToDriver && <button onClick={() => onSendToDriver(driverMsg)} className="text-[9px] font-semibold px-2.5 py-1 rounded-lg text-white" style={{ background: GHL.accent }}><Icon n="plane" c="w-2.5 h-2.5 inline mr-1" />Send to Driver</button>}
                  </div>
                </div>
                <pre className="text-[10px] whitespace-pre-wrap leading-relaxed" style={{ color: GHL.text }}>{driverMsg}</pre>
                {routeLink && <a href={routeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[9px] font-medium" style={{ color: GHL.accent }}><Icon n="map" c="w-2.5 h-2.5" />Open Route in Google Maps</a>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 text-xs font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Save Transportation</button>
        </div>
      </div>
    </div>
  );
}
