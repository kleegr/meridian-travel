'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { parseFlightNumber } from '@/lib/flight-lookup';
import { parseFlightPDF } from '@/lib/pdf-parser';
import { lookupFlight, formatEte, fmtIsoTime, fmtIsoDate, getDelayText } from '@/lib/flight-api';
import type { ParsedFlightData } from '@/lib/pdf-parser';
import type { FormField } from '@/lib/types';
import GooglePlacesInput from '@/components/ui/GooglePlacesInput';

interface Props {
  form: Record<string, string>;
  set: (key: string, value: string) => void;
  fields: FormField[];
  onAddConnections?: (segments: ParsedFlightData[]) => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  'On Time': { bg: '#d1fae5', text: '#065f46' },
  'Departing On Time': { bg: '#d1fae5', text: '#065f46' },
  'Scheduled': { bg: '#dbeafe', text: '#1e40af' },
  'En Route / On Time': { bg: '#d1fae5', text: '#065f46' },
  'En Route': { bg: '#dbeafe', text: '#1e40af' },
  'Delayed': { bg: '#fef3c7', text: '#92400e' },
  'Cancelled': { bg: '#fef2f2', text: '#991b1b' },
  'In Air': { bg: '#dbeafe', text: '#1e40af' },
  'Landed': { bg: '#d1fae5', text: '#065f46' },
  'Landed / Taxiing': { bg: '#d1fae5', text: '#065f46' },
  'Arrived': { bg: '#d1fae5', text: '#065f46' },
  'Boarding': { bg: '#ede9fe', text: '#5b21b6' },
  'Diverted': { bg: '#fef3c7', text: '#92400e' },
};

export default function SmartFlightFields({ form, set, fields, onAddConnections }: Props) {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [connectionSegments, setConnectionSegments] = useState<ParsedFlightData[]>([]);
  const [showConnections, setShowConnections] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  // Live flight lookup via FlightAware
  const doFlightLookup = useCallback(async (flightNo: string, depDate?: string) => {
    if (!flightNo || flightNo.length < 3) return;
    setLookingUp(true);
    setLookupError('');
    setLookupDone(false);
    try {
      const flights = await lookupFlight(flightNo, depDate);
      if (flights.length > 0) {
        // Find the best match (closest to date, or first scheduled/en-route)
        let best = flights[0];
        if (depDate) {
          const target = new Date(depDate + 'T12:00:00Z').getTime();
          best = flights.reduce((a, b) => {
            const da = Math.abs(new Date(a.scheduledOut || '').getTime() - target);
            const db = Math.abs(new Date(b.scheduledOut || '').getTime() - target);
            return da < db ? a : b;
          });
        }

        // Fill all form fields from live data
        set('flightNo', best.flightNo || flightNo);
        set('airline', best.airline || '');
        set('supplier', best.airline || '');
        set('from', best.from || '');
        set('fromCity', best.fromCity || '');
        set('to', best.to || '');
        set('toCity', best.toCity || '');
        set('aircraft', best.aircraft || '');

        // Times
        const depIso = best.actualOut || best.estimatedOut || best.scheduledOut || '';
        const arrIso = best.actualIn || best.estimatedIn || best.scheduledIn || '';
        if (depIso) {
          set('departure', depIso.replace('Z', '').substring(0, 16));
          set('scheduledDeparture', fmtIsoTime(best.scheduledOut));
        }
        if (arrIso) {
          set('arrival', arrIso.replace('Z', '').substring(0, 16));
          set('scheduledArrival', fmtIsoTime(best.scheduledIn));
        }

        // Terminals & Gates
        if (best.terminalOrigin) set('depTerminal', best.terminalOrigin);
        if (best.gateOrigin) set('depGate', best.gateOrigin);
        if (best.terminalDestination) set('arrTerminal', best.terminalDestination);
        if (best.gateDestination) set('arrGate', best.gateDestination);

        // Duration
        if (best.filedEte) set('duration', formatEte(best.filedEte));

        // Status
        const status = best.cancelled ? 'Cancelled' : best.diverted ? 'Diverted' : best.status || 'Scheduled';
        set('status', status);

        // Delay info — store in notes if delayed
        const depDelay = getDelayText(best.departureDelay);
        const arrDelay = getDelayText(best.arrivalDelay);
        if (depDelay || arrDelay) {
          const delayNote = [depDelay ? `Dep: ${depDelay}` : '', arrDelay ? `Arr: ${arrDelay}` : ''].filter(Boolean).join(' | ');
          const existing = form.notes || '';
          if (!existing.includes('Delay')) set('notes', existing ? `${existing}\n${delayNote}` : delayNote);
        }

        set('source', 'FlightAware Live');
        setLookupDone(true);
      } else {
        // Fallback to local airline lookup
        const info = parseFlightNumber(flightNo);
        if (info) {
          set('airline', info.airlineName);
          set('supplier', info.airlineName);
        }
        setLookupError('No flight data found. Check the flight number.');
      }
    } catch {
      setLookupError('Could not connect to flight data service.');
    }
    setLookingUp(false);
  }, [form.notes, set]);

  const handleFlightNoChange = useCallback((val: string) => {
    set('flightNo', val);
    // Local airline lookup immediately
    if (val.length >= 3) {
      const info = parseFlightNumber(val);
      if (info) {
        set('airline', info.airlineName);
        set('supplier', info.airlineName);
      }
    }
  }, [set]);

  const handleFlightNoBlur = useCallback(() => {
    const fn = form.flightNo;
    if (fn && fn.length >= 4 && !lookupDone) {
      const depDate = form.departure ? form.departure.split('T')[0] : undefined;
      doFlightLookup(fn, depDate);
    }
  }, [form.flightNo, form.departure, lookupDone, doFlightLookup]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const segments = await parseFlightPDF(file);
      if (segments.length > 0) {
        const first = segments[0];
        Object.entries(first).forEach(([key, val]) => {
          if (val && typeof val === 'string') set(key, key === 'departure' || key === 'arrival' ? String(val).replace(' ', 'T') : String(val));
        });
        setParsed(true);
        if (segments.length > 1) { setConnectionSegments(segments.slice(1)); setShowConnections(true); }
      }
    } catch (err) { console.error('Upload error:', err); }
    setParsing(false);
  }, [set]);

  const flightStatus = form.status || '';
  const sc = statusColors[flightStatus] || (flightStatus.toLowerCase().includes('delay') ? statusColors['Delayed'] : flightStatus.toLowerCase().includes('en route') ? statusColors['En Route'] : null);

  return (
    <div className="space-y-4">
      {/* PDF Upload */}
      <div className="border-2 border-dashed rounded-xl p-4 text-center transition-colors" style={{ borderColor: parsing ? GHL.accent : GHL.border, background: parsed ? '#f0fdf4' : '#fafbfc' }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" id="flight-pdf-upload" />
        <label htmlFor="flight-pdf-upload" className="cursor-pointer block">
          {parsing ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /><span className="text-sm font-medium" style={{ color: GHL.accent }}>Reading document...</span></div>
          : parsed ? <div className="flex items-center justify-center gap-2"><Icon n="check" c="w-5 h-5 text-green-500" /><span className="text-sm font-medium text-green-600">Flight details auto-filled!{connectionSegments.length > 0 ? ` + ${connectionSegments.length} connection(s)` : ''}</span></div>
          : <div><Icon n="download" c="w-6 h-6 mx-auto mb-1" /><p className="text-sm font-medium" style={{ color: GHL.text }}>Upload Flight Confirmation</p><p className="text-xs mt-0.5" style={{ color: GHL.muted }}>PDF or image — auto-fills all fields</p></div>}
        </label>
      </div>

      {/* Connection Flights */}
      {showConnections && connectionSegments.length > 0 && <div className="rounded-xl border-2 p-4" style={{ borderColor: '#3b82f6', background: '#eff6ff' }}><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Icon n="plane" c="w-5 h-5 text-blue-600" /><div><p className="font-bold text-sm text-blue-900">{connectionSegments.length} Connection{connectionSegments.length > 1 ? 's' : ''} Detected</p><p className="text-xs text-blue-600">Will be added as separate flights</p></div></div><button onClick={() => { if (onAddConnections) { onAddConnections(connectionSegments); setShowConnections(false); } }} className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ background: '#3b82f6' }}>Add All</button></div><div className="space-y-2">{connectionSegments.map((seg, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-100"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-500">{i + 2}</span><div className="flex-1"><p className="font-semibold text-sm" style={{ color: GHL.text }}>{seg.flightNo || '?'} — {seg.from || '?'} → {seg.to || '?'}</p><p className="text-xs" style={{ color: GHL.muted }}>{seg.airline || ''} {seg.duration ? `· ${seg.duration}` : ''}</p></div></div>))}</div></div>}

      {/* Live Status Banner */}
      {flightStatus && sc && <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: sc.bg, color: sc.text }}><span className="w-2 h-2 rounded-full" style={{ background: sc.text }} />{form.flightNo} — {flightStatus}{form.duration && <span className="ml-auto text-xs font-normal opacity-70">{form.duration}</span>}</div>}

      {/* Delay Warning */}
      {form.notes && form.notes.includes('Delay') && <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: '#fef3c7', color: '#92400e' }}><span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />⚠ {form.notes.split('\n').find((l) => l.includes('Delay')) || 'Flight delayed'}</div>}

      {/* Flight Number + Airline + Lookup Button */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-4">
          <label className={lc} style={{ color: GHL.muted }}>Flight Number *</label>
          <input type="text" value={form.flightNo || ''} onChange={(e) => handleFlightNoChange(e.target.value)} onBlur={handleFlightNoBlur} placeholder="DL401, UA1047..." className={ic} style={{ borderColor: GHL.border, fontSize: '1rem', fontWeight: 600 }} />
        </div>
        <div className="col-span-4">
          <label className={lc} style={{ color: GHL.muted }}>Airline</label>
          <input type="text" value={form.airline || ''} onChange={(e) => set('airline', e.target.value)} placeholder="Auto-filled" className={ic} style={{ borderColor: GHL.border }} />
        </div>
        <div className="col-span-4">
          <label className={lc} style={{ color: GHL.muted }}>Live Lookup</label>
          <button onClick={() => doFlightLookup(form.flightNo, form.departure?.split('T')[0])} disabled={lookingUp || !form.flightNo} className="w-full px-3 py-2.5 border rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2" style={{ borderColor: lookupDone ? '#10b981' : GHL.accent, color: lookupDone ? '#10b981' : GHL.accent, background: lookupDone ? '#f0fdf4' : 'white', opacity: lookingUp || !form.flightNo ? 0.5 : 1 }}>
            {lookingUp ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /> Fetching...</>
            : lookupDone ? <><Icon n="check" c="w-4 h-4" /> Live Data Loaded</>
            : <><Icon n="globe" c="w-4 h-4" /> Fetch from FlightAware</>}
          </button>
        </div>
      </div>
      {lookupError && <p className="text-xs" style={{ color: '#ef4444' }}>{lookupError}</p>}

      {/* Route */}
      <div className="grid grid-cols-4 gap-3">
        <div><label className={lc} style={{ color: GHL.muted }}>From Code</label><input value={form.from || ''} onChange={(e) => set('from', e.target.value.toUpperCase())} placeholder="JFK" className={ic + ' text-center font-bold text-lg'} style={{ borderColor: GHL.border }} maxLength={4} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>From City</label><GooglePlacesInput value={form.fromCity || ''} onChange={(v) => set('fromCity', v)} placeholder="New York" className={ic + ' pl-9'} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>To Code</label><input value={form.to || ''} onChange={(e) => set('to', e.target.value.toUpperCase())} placeholder="FCO" className={ic + ' text-center font-bold text-lg'} style={{ borderColor: GHL.border }} maxLength={4} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>To City</label><GooglePlacesInput value={form.toCity || ''} onChange={(v) => set('toCity', v)} placeholder="Rome" className={ic + ' pl-9'} /></div>
      </div>

      {/* Departure */}
      <div className="p-4 rounded-xl" style={{ background: GHL.bg }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.muted }}>Departure</p>
        <div className="grid grid-cols-4 gap-3">
          <div><label className={lc} style={{ color: GHL.muted }}>Date/Time</label><input type="datetime-local" value={form.departure || ''} onChange={(e) => set('departure', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Scheduled</label><input value={form.scheduledDeparture || ''} onChange={(e) => set('scheduledDeparture', e.target.value)} placeholder="6:00 PM" className={ic} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Terminal</label><input value={form.depTerminal || ''} onChange={(e) => set('depTerminal', e.target.value)} placeholder="3" className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Gate</label><input value={form.depGate || ''} onChange={(e) => set('depGate', e.target.value)} placeholder="C4" className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
        </div>
      </div>

      {/* Arrival */}
      <div className="p-4 rounded-xl" style={{ background: GHL.bg }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.muted }}>Arrival</p>
        <div className="grid grid-cols-4 gap-3">
          <div><label className={lc} style={{ color: GHL.muted }}>Date/Time</label><input type="datetime-local" value={form.arrival || ''} onChange={(e) => set('arrival', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Estimated</label><input value={form.scheduledArrival || ''} onChange={(e) => set('scheduledArrival', e.target.value)} placeholder="10:30 PM" className={ic} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Terminal</label><input value={form.arrTerminal || ''} onChange={(e) => set('arrTerminal', e.target.value)} placeholder="B" className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Gate</label><input value={form.arrGate || ''} onChange={(e) => set('arrGate', e.target.value)} placeholder="B55" className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
        </div>
      </div>

      {/* Flight info */}
      <div className="grid grid-cols-4 gap-3">
        <div><label className={lc} style={{ color: GHL.muted }}>Duration</label><input value={form.duration || ''} onChange={(e) => set('duration', e.target.value)} placeholder="3h 51m" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Status</label><select value={form.status || ''} onChange={(e) => set('status', e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{['Scheduled', 'On Time', 'Departing On Time', 'En Route', 'En Route / On Time', 'Delayed', 'Boarding', 'In Air', 'Landed', 'Landed / Taxiing', 'Arrived', 'Cancelled', 'Diverted'].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Aircraft</label><input value={form.aircraft || ''} onChange={(e) => set('aircraft', e.target.value)} placeholder="Boeing 737" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Class</label><select value={form.seatClass || ''} onChange={(e) => set('seatClass', e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{['Economy', 'Premium Economy', 'Business', 'First'].map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>

      {/* Trip Type */}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={lc} style={{ color: GHL.muted }}>Trip Type</label><select value={form.tripType || ''} onChange={(e) => set('tripType', e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{['Round Trip', 'One Way', 'Multi-City', 'Connection'].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className={lc} style={{ color: GHL.muted }}>PNR / Confirmation</label><input value={form.pnr || ''} onChange={(e) => set('pnr', e.target.value)} placeholder="XKJD82" className={ic} style={{ borderColor: GHL.border }} /></div>
      </div>

      {/* Booking */}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={lc} style={{ color: GHL.muted }}>Source</label><input value={form.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="GDS" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Supplier</label><input value={form.supplier || ''} onChange={(e) => set('supplier', e.target.value)} placeholder="Delta" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Cost ($)</label><input type="number" value={form.cost || ''} onChange={(e) => set('cost', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Sell ($)</label><input type="number" value={form.sell || ''} onChange={(e) => set('sell', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
      </div>

      <div><label className={lc} style={{ color: GHL.muted }}>Notes</label><textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Special requests..." className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /></div>
    </div>
  );
}
