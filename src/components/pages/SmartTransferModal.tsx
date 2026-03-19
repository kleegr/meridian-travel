'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmtDate, uid } from '@/lib/utils';
import type { Itinerary, Flight, Hotel, Transport } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
  initial?: Record<string, string>;
}

const SCENARIOS = [
  { value: 'airport-pickup', label: 'Airport Pickup', pickupType: 'airport', dropoffType: 'hotel' },
  { value: 'airport-dropoff', label: 'Airport Drop-off', pickupType: 'hotel', dropoffType: 'airport' },
  { value: 'hotel-to-airport', label: 'Hotel to Airport', pickupType: 'hotel', dropoffType: 'airport' },
  { value: 'airport-to-hotel', label: 'Airport to Hotel', pickupType: 'airport', dropoffType: 'hotel' },
  { value: 'airport-to-airport', label: 'Airport to Airport', pickupType: 'airport', dropoffType: 'airport' },
  { value: 'hotel-to-hotel', label: 'Hotel to Hotel', pickupType: 'hotel', dropoffType: 'hotel' },
  { value: 'attraction', label: 'Attraction Transfer', pickupType: 'custom', dropoffType: 'custom' },
  { value: 'general', label: 'General Transportation', pickupType: 'custom', dropoffType: 'custom' },
  { value: 'custom', label: 'Custom Route', pickupType: 'custom', dropoffType: 'custom' },
];

function getAirports(flights: Flight[]): { code: string; city: string; label: string }[] {
  const airports: { code: string; city: string; label: string }[] = [];
  const seen = new Set<string>();
  flights.forEach(f => {
    if (f.from && !seen.has(f.from)) { seen.add(f.from); airports.push({ code: f.from, city: f.fromCity || '', label: `${f.from} - ${f.fromCity || 'Departure'}` }); }
    if (f.to && !seen.has(f.to)) { seen.add(f.to); airports.push({ code: f.to, city: f.toCity || '', label: `${f.to} - ${f.toCity || 'Arrival'}` }); }
  });
  return airports;
}

function getHotels(hotels: Hotel[]): { name: string; address: string; city: string; label: string }[] {
  return hotels.map(h => ({ name: h.name, address: h.hotelAddress || '', city: h.city, label: `${h.name} - ${h.city}` }));
}

export default function SmartTransferModal({ itin, onSave, onClose, initial }: Props) {
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

  // Auto-calculate recommended pickup for hotel-to-airport
  const calcRecommended = () => {
    if (!linkedFlight) return;
    const depTime = linkedFlight.departure || linkedFlight.scheduledDeparture;
    if (!depTime) return;
    // Parse departure time, subtract 2 hours buffer, subtract travel time
    try {
      const dep = new Date(depTime);
      const bufferMs = 2 * 60 * 60 * 1000; // 2 hours
      const travelMs = parseInt(travelTime || '45') * 60 * 1000; // default 45 min
      const recommended = new Date(dep.getTime() - bufferMs - travelMs);
      const h = recommended.getHours();
      const m = recommended.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      setRecommendedTime(`${h12}:${String(m).padStart(2, '0')} ${ampm}`);
      if (!pickupTime) setPickupTime(`${h12}:${String(m).padStart(2, '0')} ${ampm}`);
    } catch {}
  };

  // When selecting airport for pickup
  const selectPickupAirport = (code: string) => {
    const ap = airports.find(a => a.code === code);
    setPickup(ap ? `${ap.code} Airport` : code);
    setPickupAddress(ap ? `${ap.label} Airport` : '');
  };

  // When selecting hotel for pickup
  const selectPickupHotel = (name: string) => {
    const h = hotels.find(ht => ht.name === name);
    setPickup(h ? h.name : name);
    setPickupAddress(h ? h.address || `${h.name}, ${h.city}` : '');
  };

  // When selecting airport for dropoff
  const selectDropoffAirport = (code: string) => {
    const ap = airports.find(a => a.code === code);
    setDropoff(ap ? `${ap.code} Airport` : code);
    setDropoffAddress(ap ? `${ap.label} Airport` : '');
  };

  // When selecting hotel for dropoff
  const selectDropoffHotel = (name: string) => {
    const h = hotels.find(ht => ht.name === name);
    setDropoff(h ? h.name : name);
    setDropoffAddress(h ? h.address || `${h.name}, ${h.city}` : '');
  };

  // When selecting a linked flight
  const selectFlight = (flightIdStr: string) => {
    setLinkedFlightId(flightIdStr);
    const fl = itin.flights.find(f => String(f.id) === flightIdStr);
    if (!fl) return;
    // Auto-populate based on scenario
    if (scenarioDef?.pickupType === 'airport') {
      selectPickupAirport(fl.to || fl.from);
    }
    if (scenarioDef?.dropoffType === 'airport') {
      selectDropoffAirport(fl.from || fl.to);
    }
    // Set pickup date from flight
    if (fl.departure) {
      setPickupDate(fl.departure.split('T')[0]);
    }
  };

  const handleSave = () => {
    onSave({
      transferScenario: scenario,
      type: vehicleType,
      carType, provider, pickup, pickupAddress, dropoff, dropoffAddress,
      pickupDateTime: pickupDate, pickupTime,
      recommendedPickupTime: recommendedTime,
      estimatedTravelTime: travelTime,
      linkedFlightId, driverName, driverPhone, ref,
      cost, sell, notes,
    });
  };

  // Driver communication preview
  const driverMsg = `Transfer Details\n\nClient: ${itin.client}\nPhone: ${(itin.clientPhones || [])[0] || 'N/A'}\n\nScenario: ${scenarioDef?.label || scenario}\nDate: ${pickupDate ? fmtDate(pickupDate) : 'TBD'}\nPickup Time: ${pickupTime || recommendedTime || 'TBD'}\nPickup: ${pickup}${pickupAddress ? '\nAddress: ' + pickupAddress : ''}\nDrop-off: ${dropoff}${dropoffAddress ? '\nAddress: ' + dropoffAddress : ''}\n${linkedFlight ? `\nFlight: ${linkedFlight.airline} ${linkedFlight.flightNo}\nRoute: ${linkedFlight.from} > ${linkedFlight.to}\nDeparture: ${linkedFlight.scheduledDeparture || ''}\n` : ''}${notes ? '\nNotes: ' + notes : ''}\n\nItinerary: ${itin.title}\nTravelers: ${itin.passengers}\n\nThank you.`;

  const ic = 'w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white';
  const lc = 'block text-[9px] font-bold uppercase tracking-wider mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: GHL.border }}>
          <h2 className="text-lg font-bold" style={{ color: GHL.text }}>{initial ? 'Edit Transfer' : 'Add Transfer'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Scenario Selector */}
          <div>
            <label className={lc} style={{ color: GHL.muted }}>Transfer Scenario</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SCENARIOS.map(sc => (
                <button key={sc.value} onClick={() => setScenario(sc.value)} className="px-2.5 py-2 rounded-lg text-[10px] font-medium border transition-all text-left" style={scenario === sc.value ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { borderColor: GHL.border, color: GHL.muted }}>
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Linked Flight */}
          {scenarioDef && (scenarioDef.pickupType === 'airport' || scenarioDef.dropoffType === 'airport') && itin.flights.length > 0 && (
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
                <select value={pickup} onChange={e => selectPickupAirport(e.target.value.replace(' Airport', ''))} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">Select airport...</option>
                  {airports.map(a => (<option key={a.code} value={`${a.code} Airport`}>{a.label}</option>))}
                  <option value="__custom">Custom location...</option>
                </select>
              ) : scenarioDef?.pickupType === 'hotel' && hotels.length > 0 ? (
                <select value={pickup} onChange={e => selectPickupHotel(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">Select hotel...</option>
                  {hotels.map(h => (<option key={h.name} value={h.name}>{h.label}</option>))}
                  <option value="__custom">Custom location...</option>
                </select>
              ) : (
                <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Pickup location" className={ic} style={{ borderColor: GHL.border }} />
              )}
              {pickupAddress && <p className="text-[9px] mt-1 px-1" style={{ color: GHL.muted }}>{pickupAddress}</p>}
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Drop-off</label>
              {scenarioDef?.dropoffType === 'airport' && airports.length > 0 ? (
                <select value={dropoff} onChange={e => selectDropoffAirport(e.target.value.replace(' Airport', ''))} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">Select airport...</option>
                  {airports.map(a => (<option key={a.code} value={`${a.code} Airport`}>{a.label}</option>))}
                  <option value="__custom">Custom location...</option>
                </select>
              ) : scenarioDef?.dropoffType === 'hotel' && hotels.length > 0 ? (
                <select value={dropoff} onChange={e => selectDropoffHotel(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">Select hotel...</option>
                  {hotels.map(h => (<option key={h.name} value={h.name}>{h.label}</option>))}
                  <option value="__custom">Custom location...</option>
                </select>
              ) : (
                <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Drop-off location" className={ic} style={{ borderColor: GHL.border }} />
              )}
              {dropoffAddress && <p className="text-[9px] mt-1 px-1" style={{ color: GHL.muted }}>{dropoffAddress}</p>}
            </div>
          </div>

          {/* Date/Time + Recommended */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lc} style={{ color: GHL.muted }}>Pickup Date</label><input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Pickup Time</label>
              <input value={pickupTime} onChange={e => setPickupTime(e.target.value)} placeholder={recommendedTime || '9:30 AM'} className={ic} style={{ borderColor: GHL.border }} />
              {pickupTime && recommendedTime && pickupTime !== recommendedTime && <p className="text-[9px] mt-0.5 px-1" style={{ color: '#d97706' }}>Recommended: {recommendedTime} (manual override)</p>}
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Estimated Travel Time</label>
              <div className="flex gap-1">
                <input value={travelTime} onChange={e => setTravelTime(e.target.value)} placeholder="45 min" className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />
                {(scenarioDef?.value === 'hotel-to-airport' || scenarioDef?.value === 'airport-dropoff') && linkedFlight && (
                  <button type="button" onClick={calcRecommended} className="px-2 py-1 text-[9px] font-semibold rounded-lg whitespace-nowrap" style={{ background: GHL.accentLight, color: GHL.accent }}>Calculate</button>
                )}
              </div>
              {recommendedTime && <p className="text-[9px] mt-0.5 px-1" style={{ color: GHL.success }}>Recommended pickup: {recommendedTime}</p>}
            </div>
          </div>

          {/* Vehicle */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lc} style={{ color: GHL.muted }}>Vehicle Type</label><select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option>Private Transfer</option><option>Shared Transfer</option><option>Taxi</option><option>Train</option><option>Bus</option><option>Ferry</option><option>Other</option></select></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Vehicle Details</label><input value={carType} onChange={e => setCarType(e.target.value)} placeholder="Mercedes V-Class" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Provider</label><input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Roma Transfers" className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>

          {/* Driver */}
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

          {/* Driver Communication Preview */}
          <div className="border-t pt-4" style={{ borderColor: GHL.border }}>
            <button onClick={() => setShowDriverPreview(!showDriverPreview)} className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: GHL.border, color: showDriverPreview ? GHL.accent : GHL.muted }}>
              <Icon n="plane" c="w-3.5 h-3.5" /> {showDriverPreview ? 'Hide' : 'Preview'} Driver Communication
            </button>
            {showDriverPreview && (
              <div className="mt-3 rounded-xl border p-4" style={{ borderColor: GHL.border, background: GHL.bg }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: GHL.text }}>Message to Driver</p>
                  <button onClick={() => navigator.clipboard.writeText(driverMsg)} className="text-[9px] font-semibold px-2 py-1 rounded hover:bg-white" style={{ color: GHL.accent }}>Copy</button>
                </div>
                <pre className="text-[10px] whitespace-pre-wrap leading-relaxed" style={{ color: GHL.text }}>{driverMsg}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 text-xs font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Save Transfer</button>
        </div>
      </div>
    </div>
  );
}
