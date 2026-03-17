'use client';

import { useState, useCallback, useEffect } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { parseFlightNumber } from '@/lib/flight-lookup';
import { parseFlightPDF } from '@/lib/pdf-parser';
import { lookupFlight, formatEte, fmtIsoTime, getDelayText } from '@/lib/flight-api';
import { fmtDate } from '@/lib/utils';
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
  'Scheduled': { bg: '#dbeafe', text: '#1e40af' },
  'Confirmed': { bg: '#d1fae5', text: '#065f46' },
  'En Route': { bg: '#dbeafe', text: '#1e40af' },
  'Delayed': { bg: '#fef3c7', text: '#92400e' },
  'Cancelled': { bg: '#fef2f2', text: '#991b1b' },
  'In Air': { bg: '#dbeafe', text: '#1e40af' },
  'Landed': { bg: '#d1fae5', text: '#065f46' },
  'Arrived': { bg: '#d1fae5', text: '#065f46' },
  'Boarding': { bg: '#ede9fe', text: '#5b21b6' },
  'Diverted': { bg: '#fef3c7', text: '#92400e' },
};

function getDepDate(departure: string): string {
  if (!departure) return '';
  const d = departure.split('T')[0];
  if (d && d !== 'undefined' && d.length >= 8) return fmtDate(d);
  return '';
}

export default function SmartFlightFields({ form, set, fields, onAddConnections }: Props) {
  const [parsing, setParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [connectionSegments, setConnectionSegments] = useState<ParsedFlightData[]>([]);
  const [showConnections, setShowConnections] = useState(false);
  const [connectionsAutoAdded, setConnectionsAutoAdded] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [dataSource, setDataSource] = useState<'none' | 'live' | 'pdf' | 'manual'>('none');
  const [hasVerifiedData, setHasVerifiedData] = useState(false);

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';
  const sectionTitle = 'text-xs font-bold uppercase tracking-wider mb-3';

  useEffect(() => {
    if (form.from && form.to && form.flightNo && form.status) {
      setHasVerifiedData(true);
      if (form.uploadedPdf) setDataSource('pdf');
      else if (form.source === 'Live Tracking') setDataSource('live');
    }
  }, []);

  useEffect(() => {
    if (connectionSegments.length > 0 && !connectionsAutoAdded && onAddConnections) {
      onAddConnections(connectionSegments);
      setConnectionsAutoAdded(true);
    }
  }, [connectionSegments, connectionsAutoAdded, onAddConnections]);

  const doFlightLookup = useCallback(async (flightNo: string, depDate?: string) => {
    if (!flightNo || flightNo.length < 3) return;
    setLookingUp(true); setLookupError(''); setLookupDone(false);
    try {
      const flights = await lookupFlight(flightNo, depDate);
      if (flights.length > 0) {
        let best = flights[0];
        if (depDate) {
          const target = new Date(depDate + 'T12:00:00Z').getTime();
          best = flights.reduce((a, b) => {
            const da = Math.abs(new Date(a.scheduledOut || '').getTime() - target);
            const db = Math.abs(new Date(b.scheduledOut || '').getTime() - target);
            return da < db ? a : b;
          });
        }
        set('flightNo', best.flightNo || flightNo);
        set('airline', best.airline || ''); set('supplier', best.airline || '');
        set('from', best.from || ''); set('fromCity', best.fromCity || '');
        set('to', best.to || ''); set('toCity', best.toCity || '');
        set('aircraft', best.aircraft || '');
        const depIso = best.actualOut || best.estimatedOut || best.scheduledOut || '';
        const arrIso = best.actualIn || best.estimatedIn || best.scheduledIn || '';
        if (depIso) { set('departure', depIso.replace('Z', '').substring(0, 16)); set('scheduledDeparture', fmtIsoTime(best.scheduledOut)); }
        if (arrIso) { set('arrival', arrIso.replace('Z', '').substring(0, 16)); set('scheduledArrival', fmtIsoTime(best.scheduledIn)); }
        if (best.terminalOrigin) set('depTerminal', best.terminalOrigin);
        if (best.gateOrigin) set('depGate', best.gateOrigin);
        if (best.terminalDestination) set('arrTerminal', best.terminalDestination);
        if (best.gateDestination) set('arrGate', best.gateDestination);
        if (best.filedEte) set('duration', formatEte(best.filedEte));
        const status = best.cancelled ? 'Cancelled' : best.diverted ? 'Diverted' : best.status || 'Scheduled';
        set('status', status);
        set('source', 'Live Tracking');
        setLookupDone(true); setDataSource('live'); setHasVerifiedData(true);
      } else {
        if (dataSource === 'none') {
          const info = parseFlightNumber(flightNo);
          if (info) { set('airline', info.airlineName); set('supplier', info.airlineName); }
        }
        setLookupError('Flight not found. The airline may not have published this schedule yet.');
      }
    } catch { setLookupError('Could not connect to flight tracking service.'); }
    setLookingUp(false);
  }, [set, dataSource]);

  const handleFlightNoChange = useCallback((val: string) => {
    set('flightNo', val);
    if (val.length >= 3) {
      const info = parseFlightNumber(val);
      if (info) { set('airline', info.airlineName); set('supplier', info.airlineName); }
    }
  }, [set]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadedFile(file.name); setParsing(true); setConnectionsAutoAdded(false);
    setLookupError('');
    set('uploadedPdf', file.name);
    try {
      const segments = await parseFlightPDF(file);
      if (segments.length > 0) {
        const first = segments[0];
        Object.entries(first).forEach(([key, val]) => {
          if (val != null && String(val).trim()) {
            const sv = String(val);
            set(key, key === 'departure' || key === 'arrival' ? sv.replace(' ', 'T') : sv);
          }
        });
        if (first.connectionGroup) set('connectionGroup', String(first.connectionGroup));
        if (first.tripType) set('tripType', String(first.tripType));
        if (first.legOrder != null) set('legOrder', String(first.legOrder));
        setDataSource('pdf'); setHasVerifiedData(true);
        if (segments.length > 1) {
          const connGroup = String(first.connectionGroup || first.pnr || 'connection');
          const enrichedSegments = segments.slice(1).map((seg, i) => ({
            ...seg,
            connectionGroup: connGroup,
            tripType: String(first.tripType || 'One Way'),
            legOrder: String(i + 2),
          }));
          setConnectionSegments(enrichedSegments as any);
          setShowConnections(true);
        }
      }
    } catch (err) { console.error('Upload error:', err); }
    setParsing(false);
  }, [set]);

  const flightStatus = form.status || '';
  const showBanner = hasVerifiedData && flightStatus && statusColors[flightStatus];
  const sc = statusColors[flightStatus];
  const depDate = getDepDate(form.departure);
  const routeSummary = connectionSegments.length > 0 ? [form.from, ...connectionSegments.map(s => s.from), connectionSegments[connectionSegments.length - 1]?.to].filter(Boolean).join(' > ') : '';
  const showLookupError = lookupError && dataSource !== 'pdf';

  return (
    <div className="space-y-4">
      {showBanner && sc && <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold flex-wrap" style={{ background: sc.bg, color: sc.text }}><span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: sc.text }} /><span className="text-base font-bold">{form.flightNo}</span><span className="mx-1">-</span><span>{flightStatus}</span>{depDate && <span className="text-xs font-normal opacity-80 px-1.5 py-0.5 rounded" style={{ background: sc.text + '15' }}>{depDate}</span>}{form.scheduledDeparture && <span className="text-xs font-normal opacity-70">Dep: {form.scheduledDeparture}</span>}{form.scheduledArrival && <span className="text-xs font-normal opacity-70">Arr: {form.scheduledArrival}</span>}{form.from && form.to && <span className="text-xs font-normal opacity-70">{form.from} &gt; {form.to}</span>}{form.duration && <span className="ml-auto text-xs font-normal opacity-70">{form.duration}</span>}</div>}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: GHL.border }}>
        <div className="px-4 py-2" style={{ background: GHL.bg }}><p className={sectionTitle} style={{ color: GHL.muted, marginBottom: 0 }}>Import Flight Data</p></div>
        <div className="grid grid-cols-2 divide-x" style={{ borderColor: GHL.border }}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3"><Icon n="globe" c="w-4 h-4" /><p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.text }}>Live Tracking</p>{dataSource === 'live' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#d1fae5', color: '#065f46' }}>Active</span>}</div>
            <div className="flex gap-2 mb-2">
              <input type="text" value={form.flightNo || ''} onChange={(e) => handleFlightNoChange(e.target.value)} placeholder="Flight # (DL401)" className={ic + ' flex-1 font-semibold'} style={{ borderColor: GHL.border }} />
              <button type="button" onClick={() => doFlightLookup(form.flightNo, form.departure?.split('T')[0])} disabled={lookingUp || !form.flightNo} className="px-3 py-2.5 border rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap" style={{ borderColor: lookupDone ? '#10b981' : GHL.accent, color: lookupDone ? '#10b981' : GHL.accent, background: lookupDone ? '#f0fdf4' : 'white', opacity: lookingUp || !form.flightNo ? 0.5 : 1 }}>{lookingUp ? <><div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /> Fetching</> : lookupDone ? <><Icon n="check" c="w-3 h-3" /> Loaded</> : <><Icon n="globe" c="w-3 h-3" /> Fetch</>}</button>
            </div>
            {showLookupError && <p className="text-[10px] leading-relaxed" style={{ color: '#ef4444' }}>{lookupError}</p>}
            {lookupDone && <p className="text-[10px]" style={{ color: '#10b981' }}>All fields auto-filled from live tracking</p>}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3"><Icon n="download" c="w-4 h-4" /><p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.text }}>Upload Confirmation</p>{dataSource === 'pdf' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#d1fae5', color: '#065f46' }}>Active</span>}</div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" id="flight-pdf-upload" />
            {uploadedFile || form.uploadedPdf ? <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}><Icon n="check" c="w-4 h-4 text-green-500" /><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-green-700 truncate">{uploadedFile || form.uploadedPdf}</p><p className="text-[10px] text-green-600">{dataSource === 'pdf' ? 'Fields extracted' : 'File attached'}</p></div><label htmlFor="flight-pdf-upload" className="text-[10px] font-medium cursor-pointer px-2 py-1 rounded hover:bg-green-100" style={{ color: GHL.accent }}>Replace</label></div>
            : <label htmlFor="flight-pdf-upload" className="cursor-pointer block border-2 border-dashed rounded-lg p-3 text-center transition-colors hover:border-blue-300" style={{ borderColor: parsing ? GHL.accent : GHL.border, background: '#fafbfc' }}>{parsing ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /><span className="text-xs" style={{ color: GHL.accent }}>Reading all segments...</span></div> : <div><p className="text-xs font-medium" style={{ color: GHL.text }}>Drop PDF or image here</p><p className="text-[10px] mt-0.5" style={{ color: GHL.muted }}>Auto-extracts ALL flight segments</p></div>}</label>}
          </div>
        </div>
      </div>

      {showConnections && connectionSegments.length > 0 && <div className="rounded-xl border-2 p-4" style={{ borderColor: '#3b82f6', background: '#eff6ff' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Icon n="plane" c="w-4 h-4 text-blue-600" /><p className="font-bold text-sm text-blue-900">Connected Journey - {connectionSegments.length + 1} Segments</p></div>
          <span className="text-[9px] font-bold px-2 py-1 rounded" style={{ background: '#dbeafe', color: '#1e40af' }}>Auto-added on save</span>
        </div>
        {routeSummary && <p className="text-xs font-bold mb-3" style={{ color: '#1e40af' }}>{routeSummary}</p>}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-100 text-xs">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-blue-500">1</span>
            <span className="font-semibold" style={{ color: GHL.text }}>{form.flightNo || '?'}</span>
            <span style={{ color: GHL.muted }}>{form.from} &gt; {form.to}</span>
            {depDate && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: '#dbeafe', color: '#1e40af' }}>{depDate}</span>}
            <span className="ml-auto text-[9px]" style={{ color: GHL.muted }}>{form.scheduledDeparture || ''}</span>
          </div>
          {connectionSegments.map((seg, i) => { const segDate = seg.departure ? getDepDate(String(seg.departure)) : ''; return (<div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-100 text-xs"><span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-blue-500">{i + 2}</span><span className="font-semibold" style={{ color: GHL.text }}>{seg.flightNo || '?'}</span><span style={{ color: GHL.muted }}>{seg.from} &gt; {seg.to}</span>{segDate && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: '#dbeafe', color: '#1e40af' }}>{segDate}</span>}<span className="ml-auto text-[9px]" style={{ color: GHL.muted }}>{seg.scheduledDeparture || ''}</span></div>); })}
        </div>
      </div>}

      <div className="rounded-xl border p-4" style={{ borderColor: GHL.border }}><p className={sectionTitle} style={{ color: GHL.muted }}>Flight Details{connectionSegments.length > 0 ? ' (Leg 1)' : ''}</p><div className="grid grid-cols-3 gap-3 mb-3"><div><label className={lc} style={{ color: GHL.muted }}>Flight Number *</label><input type="text" value={form.flightNo || ''} onChange={(e) => handleFlightNoChange(e.target.value)} placeholder="DL401" className={ic + ' font-bold text-base'} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Airline</label><input value={form.airline || ''} onChange={(e) => set('airline', e.target.value)} placeholder="Auto-filled" className={ic} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Aircraft</label><input value={form.aircraft || ''} onChange={(e) => set('aircraft', e.target.value)} placeholder="B737" className={ic} style={{ borderColor: GHL.border }} /></div></div><div className="grid grid-cols-4 gap-3"><div><label className={lc} style={{ color: GHL.muted }}>From</label><input value={form.from || ''} onChange={(e) => set('from', e.target.value.toUpperCase())} placeholder="JFK" className={ic + ' text-center font-bold text-lg'} style={{ borderColor: GHL.border }} maxLength={4} /></div><div><label className={lc} style={{ color: GHL.muted }}>From City</label><GooglePlacesInput value={form.fromCity || ''} onChange={(v) => set('fromCity', v)} placeholder="New York" className={ic + ' pl-9'} /></div><div><label className={lc} style={{ color: GHL.muted }}>To</label><input value={form.to || ''} onChange={(e) => set('to', e.target.value.toUpperCase())} placeholder="FCO" className={ic + ' text-center font-bold text-lg'} style={{ borderColor: GHL.border }} maxLength={4} /></div><div><label className={lc} style={{ color: GHL.muted }}>To City</label><GooglePlacesInput value={form.toCity || ''} onChange={(v) => set('toCity', v)} placeholder="Rome" className={ic + ' pl-9'} /></div></div></div>

      <div className="grid grid-cols-2 gap-3"><div className="p-4 rounded-xl" style={{ background: GHL.bg }}><p className={sectionTitle} style={{ color: GHL.muted }}>Departure</p><div className="space-y-3"><div><label className={lc} style={{ color: GHL.muted }}>Date/Time</label><input type="datetime-local" value={form.departure || ''} onChange={(e) => set('departure', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Scheduled</label><input value={form.scheduledDeparture || ''} onChange={(e) => set('scheduledDeparture', e.target.value)} placeholder="6:00 PM" className={ic} style={{ borderColor: GHL.border }} /></div><div className="grid grid-cols-2 gap-2"><div><label className={lc} style={{ color: GHL.muted }}>Terminal</label><input value={form.depTerminal || ''} onChange={(e) => set('depTerminal', e.target.value)} placeholder="3" className={ic + ' text-center font-bold'} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Gate</label><input value={form.depGate || ''} onChange={(e) => set('depGate', e.target.value)} placeholder="C4" className={ic + ' text-center font-bold'} style={{ borderColor: GHL.border }} /></div></div></div></div><div className="p-4 rounded-xl" style={{ background: GHL.bg }}><p className={sectionTitle} style={{ color: GHL.muted }}>Arrival</p><div className="space-y-3"><div><label className={lc} style={{ color: GHL.muted }}>Date/Time</label><input type="datetime-local" value={form.arrival || ''} onChange={(e) => set('arrival', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Estimated</label><input value={form.scheduledArrival || ''} onChange={(e) => set('scheduledArrival', e.target.value)} placeholder="10:30 PM" className={ic} style={{ borderColor: GHL.border }} /></div><div className="grid grid-cols-2 gap-2"><div><label className={lc} style={{ color: GHL.muted }}>Terminal</label><input value={form.arrTerminal || ''} onChange={(e) => set('arrTerminal', e.target.value)} placeholder="B" className={ic + ' text-center font-bold'} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Gate</label><input value={form.arrGate || ''} onChange={(e) => set('arrGate', e.target.value)} placeholder="B55" className={ic + ' text-center font-bold'} style={{ borderColor: GHL.border }} /></div></div></div></div></div>

      <div className="grid grid-cols-4 gap-3"><div><label className={lc} style={{ color: GHL.muted }}>Duration</label><input value={form.duration || ''} onChange={(e) => set('duration', e.target.value)} placeholder="3h 51m" className={ic} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Status</label><select value={form.status || ''} onChange={(e) => set('status', e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{['Scheduled', 'Confirmed', 'On Time', 'En Route', 'Delayed', 'Boarding', 'In Air', 'Landed', 'Arrived', 'Cancelled', 'Diverted'].map((s) => <option key={s}>{s}</option>)}</select></div><div><label className={lc} style={{ color: GHL.muted }}>Class</label><select value={form.seatClass || ''} onChange={(e) => set('seatClass', e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{['Economy', 'Premium Economy', 'Business', 'First'].map((s) => <option key={s}>{s}</option>)}</select></div><div><label className={lc} style={{ color: GHL.muted }}>Trip Type</label><select value={form.tripType || ''} onChange={(e) => set('tripType', e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{['Round Trip', 'One Way', 'Multi-City', 'Connection'].map((s) => <option key={s}>{s}</option>)}</select></div></div>

      <div className="rounded-xl border p-4" style={{ borderColor: GHL.border }}><p className={sectionTitle} style={{ color: GHL.muted }}>Booking & Pricing</p><div className="grid grid-cols-3 gap-3 mb-3"><div><label className={lc} style={{ color: GHL.muted }}>PNR / Confirmation</label><input value={form.pnr || ''} onChange={(e) => set('pnr', e.target.value)} placeholder="XKJD82" className={ic + ' font-semibold'} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Source</label><input value={form.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="GDS" className={ic} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Supplier</label><input value={form.supplier || ''} onChange={(e) => set('supplier', e.target.value)} placeholder="Delta" className={ic} style={{ borderColor: GHL.border }} /></div></div><div className="grid grid-cols-2 gap-3"><div><label className={lc} style={{ color: GHL.muted }}>Cost ($)</label><input type="number" value={form.cost || ''} onChange={(e) => set('cost', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div><div><label className={lc} style={{ color: GHL.muted }}>Sell ($)</label><input type="number" value={form.sell || ''} onChange={(e) => set('sell', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div></div></div>

      <div><label className={lc} style={{ color: GHL.muted }}>Notes</label><textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Special requests, delay info..." className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /></div>
    </div>
  );
}
