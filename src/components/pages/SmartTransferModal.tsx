'use client';

import { useState, useMemo, useEffect } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmtDate, uid } from '@/lib/utils';
import type { Itinerary, Flight, Hotel } from '@/lib/types';

interface Props { itin: Itinerary; onSave: (data: Record<string, string>) => void; onClose: () => void; initial?: Record<string, string>; locationId?: string; }

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

const TIME_OPTIONS = ['5:00 AM','5:30 AM','6:00 AM','6:30 AM','7:00 AM','7:30 AM','8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM','10:30 PM','11:00 PM','11:30 PM','12:00 AM','12:30 AM','1:00 AM','1:30 AM','2:00 AM','2:30 AM','3:00 AM','3:30 AM','4:00 AM','4:30 AM'];

function getAirports(flights: Flight[]) {
  const airports: { code: string; city: string; fullAddress: string; terminal: string; label: string }[] = [];
  const seen = new Set<string>();
  flights.forEach(f => {
    if (f.from && !seen.has(f.from)) { seen.add(f.from); const t = f.depTerminal ? `, Terminal ${f.depTerminal}` : ''; airports.push({ code: f.from, city: f.fromCity || '', fullAddress: `${f.from} International Airport, ${f.fromCity || ''}${t}`, terminal: f.depTerminal || '', label: `${f.from} - ${f.fromCity || ''}` }); }
    if (f.to && !seen.has(f.to)) { seen.add(f.to); const t = f.arrTerminal ? `, Terminal ${f.arrTerminal}` : ''; airports.push({ code: f.to, city: f.toCity || '', fullAddress: `${f.to} International Airport, ${f.toCity || ''}${t}`, terminal: f.arrTerminal || '', label: `${f.to} - ${f.toCity || ''}` }); }
  });
  return airports;
}

function getHotels(hotels: Hotel[]) { return hotels.map(h => ({ name: h.name, address: h.hotelAddress || `${h.name}, ${h.city}`, city: h.city, label: `${h.name} - ${h.city}` })); }
function mapsLink(from: string, to: string) { return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`; }

export default function SmartTransferModal({ itin, onSave, onClose, initial, locationId }: Props) {
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
  const [travelDurationText, setTravelDurationText] = useState('');
  const [driverName, setDriverName] = useState(initial?.driverName || '');
  const [driverPhone, setDriverPhone] = useState(initial?.driverPhone || '');
  const [ref, setRef] = useState(initial?.ref || '');
  const [cost, setCost] = useState(initial?.cost || '');
  const [sell, setSell] = useState(initial?.sell || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [showDriverPreview, setShowDriverPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [fetchingDuration, setFetchingDuration] = useState(false);

  const airports = useMemo(() => getAirports(itin.flights), [itin.flights]);
  const hotels = useMemo(() => getHotels(itin.hotels), [itin.hotels]);
  const scenarioDef = SCENARIOS.find(s => s.value === scenario);
  const linkedFlight = itin.flights.find(f => String(f.id) === linkedFlightId);
  const fromAddr = pickupAddress || pickup;
  const toAddr = dropoffAddress || dropoff;
  const routeLink = (fromAddr && toAddr) ? mapsLink(fromAddr, toAddr) : '';
  const isAirportScenario = scenarioDef && (scenarioDef.pickupType === 'airport' || scenarioDef.dropoffType === 'airport');
  const isToAirport = scenarioDef?.dropoffType === 'airport';

  // Auto-fetch map embed
  useEffect(() => {
    if (!fromAddr || !toAddr) { setEmbedUrl(''); return; }
    const c = new AbortController();
    fetch(`/api/maps-embed?origin=${encodeURIComponent(fromAddr)}&destination=${encodeURIComponent(toAddr)}`, { signal: c.signal })
      .then(r => r.json()).then(d => { if (d.embedUrl) setEmbedUrl(d.embedUrl); }).catch(() => {});
    return () => c.abort();
  }, [fromAddr, toAddr]);

  // AUTO-CALCULATE TRAVEL DURATION when pickup/dropoff change
  useEffect(() => {
    if (!fromAddr || !toAddr) return;
    // Don't overwrite if user already set it manually
    if (travelTime && initial?.estimatedTravelTime === travelTime) return;
    
    setFetchingDuration(true);
    const c = new AbortController();
    fetch(`/api/travel-duration?origin=${encodeURIComponent(fromAddr)}&destination=${encodeURIComponent(toAddr)}`, { signal: c.signal })
      .then(r => r.json())
      .then(d => {
        if (d.durationMinutes) {
          setTravelTime(String(d.durationMinutes));
          setTravelDurationText(d.durationText || '');
          // Auto-calculate recommended pickup time if going to airport
          if (isToAirport && linkedFlight) {
            autoCalcPickup(d.durationMinutes);
          }
        }
        setFetchingDuration(false);
      })
      .catch(() => setFetchingDuration(false));
    return () => c.abort();
  }, [fromAddr, toAddr]);

  // Calculate recommended pickup: flight departure - airport buffer - travel time
  const autoCalcPickup = (travelMin?: number) => {
    if (!linkedFlight) return;
    const depTime = linkedFlight.departure || linkedFlight.scheduledDeparture;
    if (!depTime) return;
    try {
      const dep = new Date(depTime);
      if (isNaN(dep.getTime())) return;
      const bufferMs = 2 * 60 * 60 * 1000; // 2 hours airport buffer
      const travelMs = (travelMin || parseInt(travelTime || '45')) * 60 * 1000;
      const rec = new Date(dep.getTime() - bufferMs - travelMs);
      const h = rec.getHours(); const m = rec.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ts = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
      setRecommendedTime(ts);
      if (!pickupTime) setPickupTime(ts);
    } catch {}
  };

  const selectPickupAirport = (code: string) => { const a = airports.find(x => x.code === code); if (a) { setPickup(`${a.code} Airport`); setPickupAddress(a.fullAddress); } };
  const selectPickupHotel = (name: string) => { const h = hotels.find(x => x.name === name); if (h) { setPickup(h.name); setPickupAddress(h.address); } };
  const selectDropoffAirport = (code: string) => { const a = airports.find(x => x.code === code); if (a) { setDropoff(`${a.code} Airport`); setDropoffAddress(a.fullAddress); } };
  const selectDropoffHotel = (name: string) => { const h = hotels.find(x => x.name === name); if (h) { setDropoff(h.name); setDropoffAddress(h.address); } };
  const selectFlight = (fid: string) => {
    setLinkedFlightId(fid);
    const fl = itin.flights.find(f => String(f.id) === fid); if (!fl) return;
    if (scenarioDef?.pickupType === 'airport') selectPickupAirport(fl.to || fl.from);
    if (scenarioDef?.dropoffType === 'airport') selectDropoffAirport(fl.from || fl.to);
    if (fl.departure) setPickupDate(fl.departure.split('T')[0]);
  };

  const handleSave = () => {
    onSave({ transferScenario: scenario, type: vehicleType, carType, provider, pickup, pickupAddress, dropoff, dropoffAddress, pickupDateTime: pickupDate, pickupTime, recommendedPickupTime: recommendedTime, estimatedTravelTime: travelTime, linkedFlightId, driverName, driverPhone, ref, cost, sell, notes });
  };

  const flightInfo = linkedFlight ? (linkedFlight.airline + ' ' + linkedFlight.flightNo + ' (' + linkedFlight.from + ' > ' + linkedFlight.to + ')') : '';
  const flightDep = linkedFlight?.scheduledDeparture || '';
  const flightTerminal = linkedFlight?.depTerminal ? ('Terminal ' + linkedFlight.depTerminal) : '';

  const driverMsg = [
    'Hi' + (driverName ? (' ' + driverName) : '') + ',', '', 'Please find the transportation details below:', '',
    'Date: ' + (pickupDate ? fmtDate(pickupDate) : 'TBD'), 'Pickup Time: ' + (pickupTime || recommendedTime || 'TBD'), '',
    'PICKUP: ' + pickup, pickupAddress && pickupAddress !== pickup ? pickupAddress : '', '',
    'DROP-OFF: ' + dropoff, dropoffAddress && dropoffAddress !== dropoff ? dropoffAddress : '',
    flightInfo ? '' : '', flightInfo ? ('FLIGHT: ' + flightInfo) : '', flightDep ? ('Departure: ' + flightDep) : '', flightTerminal ? flightTerminal : '', '',
    'PASSENGER: ' + itin.client + ' (' + itin.passengers + ' traveler' + (itin.passengers > 1 ? 's' : '') + ')',
    'Phone: ' + ((itin.clientPhones || [])[0] || 'N/A'), notes ? ('Notes: ' + notes) : '', routeLink ? ('Route: ' + routeLink) : '', '', 'Thank you!',
  ].filter(Boolean).join('\n');

  const handleSendToDriver = async () => {
    if (!driverPhone) { setSendStatus('Please enter the driver phone number first.'); return; }
    setSending(true); setSendStatus('');
    try {
      const res = await fetch('/api/ghl-conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, contactName: driverName || 'Driver', contactPhone: driverPhone, message: driverMsg, type: 'SMS', autoCreate: true }) });
      const data = await res.json();
      if (res.ok && data.success) { setSendStatus('Message sent to ' + (driverName || 'driver') + '!'); }
      else { setSendStatus(data.error || 'Could not send.'); }
    } catch (err: any) { setSendStatus(err?.message || 'Send failed'); }
    setSending(false);
  };

  const ic = 'w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white';
  const lc = 'block text-[9px] font-bold uppercase tracking-wider mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: GHL.border }}>
          <h2 className="text-lg font-bold" style={{ color: GHL.text }}>{initial ? 'Edit Transportation' : 'Add Transportation'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={lc} style={{ color: GHL.muted }}>Transportation Scenario</label>
            <select value={scenario} onChange={e => setScenario(e.target.value)} className={ic + ' text-sm'} style={{ borderColor: GHL.border }}>
              <option value="">Select scenario...</option>
              {SCENARIOS.map(sc => (<option key={sc.value} value={sc.value}>{sc.label}</option>))}
            </select>
          </div>

          {isAirportScenario && itin.flights.length > 0 && (
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Linked Flight</label>
              <select value={linkedFlightId} onChange={e => selectFlight(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                <option value="">Select a flight...</option>
                {itin.flights.map(f => (<option key={f.id} value={String(f.id)}>{f.airline} {f.flightNo} - {f.from || f.fromCity} to {f.to || f.toCity} ({f.scheduledDeparture || fmtDate(f.departure?.split('T')[0] || '')})</option>))}
              </select>
            </div>
          )}

          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lc} style={{ color: GHL.muted }}>Pickup</label>
                {scenarioDef?.pickupType === 'airport' && airports.length > 0 ? (
                  <select value={airports.find(a => pickup.includes(a.code))?.code || ''} onChange={e => selectPickupAirport(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select airport...</option>{airports.map(a => (<option key={a.code} value={a.code}>{a.label}{a.terminal ? ` (T${a.terminal})` : ''}</option>))}</select>
                ) : scenarioDef?.pickupType === 'hotel' && hotels.length > 0 ? (
                  <select value={pickup} onChange={e => selectPickupHotel(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select hotel...</option>{hotels.map(h => (<option key={h.name} value={h.name}>{h.label}</option>))}</select>
                ) : (<input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Enter pickup location" className={ic} style={{ borderColor: GHL.border }} />)}
                {pickupAddress && <p className="text-[9px] mt-1 px-1 flex items-center gap-1" style={{ color: GHL.muted }}><Icon n="map" c="w-2.5 h-2.5" />{pickupAddress}</p>}
              </div>
              <div>
                <label className={lc} style={{ color: GHL.muted }}>Drop-off</label>
                {scenarioDef?.dropoffType === 'airport' && airports.length > 0 ? (
                  <select value={airports.find(a => dropoff.includes(a.code))?.code || ''} onChange={e => selectDropoffAirport(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select airport...</option>{airports.map(a => (<option key={a.code} value={a.code}>{a.label}{a.terminal ? ` (T${a.terminal})` : ''}</option>))}</select>
                ) : scenarioDef?.dropoffType === 'hotel' && hotels.length > 0 ? (
                  <select value={dropoff} onChange={e => selectDropoffHotel(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select hotel...</option>{hotels.map(h => (<option key={h.name} value={h.name}>{h.label}</option>))}</select>
                ) : (<input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Enter drop-off location" className={ic} style={{ borderColor: GHL.border }} />)}
                {dropoffAddress && <p className="text-[9px] mt-1 px-1 flex items-center gap-1" style={{ color: GHL.muted }}><Icon n="map" c="w-2.5 h-2.5" />{dropoffAddress}</p>}
              </div>
            </div>
            {fromAddr && toAddr && routeLink && (
              <a href={routeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 mt-2 rounded-lg border hover:bg-blue-50" style={{ borderColor: GHL.border, color: GHL.accent }}>
                <Icon n="map" c="w-3 h-3" /> View Route on Google Maps
              </a>
            )}
          </div>

          {embedUrl && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: GHL.border }}>
              <iframe src={embedUrl} className="w-full h-48 border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <div className="px-3 py-2 flex items-center justify-between" style={{ background: GHL.bg }}>
                <a href={routeLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium flex items-center gap-1" style={{ color: GHL.accent }}>
                  <Icon n="map" c="w-3 h-3" /> Open in Google Maps
                </a>
                {travelDurationText && <span className="text-[9px] font-semibold" style={{ color: GHL.success }}>Drive: {travelDurationText}</span>}
              </div>
            </div>
          )}

          {/* Auto-calculated timing info */}
          {isToAirport && linkedFlight && travelTime && (
            <div className="rounded-lg p-3 text-[10px] leading-relaxed" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0' }}>
              <strong>Auto-calculated pickup time:</strong><br />
              Flight {linkedFlight.airline} {linkedFlight.flightNo} departs at {linkedFlight.scheduledDeparture || 'TBD'}<br />
              Travel time: {travelTime} min | Airport buffer: 2 hours<br />
              {recommendedTime && <><strong>Recommended pickup: {recommendedTime}</strong></>}
            </div>
          )}

          <div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lc} style={{ color: GHL.muted }}>Pickup Date</label><input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
              <div>
                <label className={lc} style={{ color: GHL.muted }}>Pickup Time</label>
                <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                  <option value="">{recommendedTime ? `Rec: ${recommendedTime}` : 'Select time...'}</option>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lc} style={{ color: GHL.muted }}>Travel Duration</label>
                <div className="flex gap-1 items-center">
                  <input value={travelTime} onChange={e => setTravelTime(e.target.value)} placeholder={fetchingDuration ? 'Calculating...' : 'min'} className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />
                  <span className="text-[9px] whitespace-nowrap" style={{ color: GHL.muted }}>min</span>
                  {fetchingDuration && <span className="text-[8px]" style={{ color: GHL.accent }}>...</span>}
                </div>
                {travelDurationText && <p className="text-[8px] mt-0.5 px-1" style={{ color: GHL.success }}>Google: {travelDurationText}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={lc} style={{ color: GHL.muted }}>Vehicle Type</label><select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option>Private Transfer</option><option>Shared Transfer</option><option>Taxi</option><option>Train</option><option>Bus</option><option>Ferry</option><option>Other</option></select></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Vehicle</label><input value={carType} onChange={e => setCarType(e.target.value)} placeholder="Mercedes V-Class" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Provider</label><input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Roma Transfers" className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lc} style={{ color: GHL.muted }}>Driver Name</label><input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver name" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Driver Phone</label><input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="+39 333 123 4567" type="tel" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Reference</label><input value={ref} onChange={e => setRef(e.target.value)} placeholder="RT-4422" className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lc} style={{ color: GHL.muted }}>Cost ($)</label><input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Sell ($)</label><input type="number" value={sell} onChange={e => setSell(e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>
          <div><label className={lc} style={{ color: GHL.muted }}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Special requests..." className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /></div>

          <div className="border-t pt-4" style={{ borderColor: GHL.border }}>
            <button onClick={() => setShowDriverPreview(!showDriverPreview)} className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: GHL.border, color: showDriverPreview ? GHL.accent : GHL.muted }}>
              <Icon n="car" c="w-3.5 h-3.5" /> {showDriverPreview ? 'Hide' : 'Show'} Driver Message
            </button>
            {showDriverPreview && (
              <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: GHL.border }}>
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: GHL.bg }}>
                  <p className="text-xs font-bold" style={{ color: GHL.text }}>Message to Driver</p>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(driverMsg); setSendStatus('Copied!'); setTimeout(() => setSendStatus(''), 2000); }} className="text-[9px] font-semibold px-2.5 py-1 rounded-lg border hover:bg-white flex items-center gap-1" style={{ borderColor: GHL.border, color: GHL.muted }}><Icon n="copy" c="w-2.5 h-2.5" />Copy</button>
                    <button onClick={handleSendToDriver} disabled={sending || !driverPhone} className="text-[9px] font-semibold px-2.5 py-1 rounded-lg text-white flex items-center gap-1" style={{ background: driverPhone ? GHL.accent : '#9ca3af', opacity: sending ? 0.5 : 1 }}><Icon n="plane" c="w-2.5 h-2.5" />{sending ? 'Sending...' : 'Send via SMS'}</button>
                  </div>
                </div>
                {!driverPhone && <div className="px-4 py-1.5 text-[9px]" style={{ background: '#fef3c7', color: '#92400e' }}>Enter driver phone number above to enable SMS.</div>}
                {sendStatus && <div className="px-4 py-1.5 text-[9px] font-medium" style={{ background: sendStatus.includes('sent') || sendStatus === 'Copied!' ? '#ecfdf5' : '#fef2f2', color: sendStatus.includes('sent') || sendStatus === 'Copied!' ? '#065f46' : '#991b1b' }}>{sendStatus}</div>}
                <div className="p-4 text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: GHL.text }}>{driverMsg}</div>
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
