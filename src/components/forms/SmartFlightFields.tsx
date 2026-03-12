'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { parseFlightNumber } from '@/lib/flight-lookup';
import { parseFlightPDF } from '@/lib/pdf-parser';
import type { FormField } from '@/lib/types';
import GooglePlacesInput from '@/components/ui/GooglePlacesInput';

interface Props {
  form: Record<string, string>;
  set: (key: string, value: string) => void;
  fields: FormField[];
}

const statusColors: Record<string, { bg: string; text: string }> = {
  'On Time': { bg: '#d1fae5', text: '#065f46' },
  'Departing On Time': { bg: '#d1fae5', text: '#065f46' },
  'Delayed': { bg: '#fef3c7', text: '#92400e' },
  'Cancelled': { bg: '#fef2f2', text: '#991b1b' },
  'In Air': { bg: '#dbeafe', text: '#1e40af' },
  'Landed': { bg: '#d1fae5', text: '#065f46' },
  'Boarding': { bg: '#ede9fe', text: '#5b21b6' },
};

export default function SmartFlightFields({ form, set, fields }: Props) {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  const handleFlightNoChange = useCallback((val: string) => {
    set('flightNo', val);
    if (val.length >= 3) {
      const info = parseFlightNumber(val);
      if (info) {
        set('airline', info.airlineName);
        set('supplier', info.airlineName);
        set('source', 'GDS');
      }
    }
  }, [set]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const data = await parseFlightPDF(file);
      // Fill ALL fields from parsed data
      Object.entries(data).forEach(([key, val]) => {
        if (val && typeof val === 'string') {
          if (key === 'departure' || key === 'arrival') {
            set(key, String(val).replace(' ', 'T'));
          } else {
            set(key, String(val));
          }
        }
      });
      setParsed(true);
    } catch (err) {
      console.error('Upload error:', err);
    }
    setParsing(false);
  }, [set]);

  const flightStatus = form.status || '';
  const sc = statusColors[flightStatus];

  return (
    <div className="space-y-4">
      {/* PDF Upload */}
      <div className="border-2 border-dashed rounded-xl p-4 text-center transition-colors" style={{ borderColor: parsing ? GHL.accent : GHL.border, background: parsed ? '#f0fdf4' : '#fafbfc' }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" id="flight-pdf-upload" />
        <label htmlFor="flight-pdf-upload" className="cursor-pointer block">
          {parsing ? (
            <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /><span className="text-sm font-medium" style={{ color: GHL.accent }}>Reading document...</span></div>
          ) : parsed ? (
            <div className="flex items-center justify-center gap-2"><Icon n="check" c="w-5 h-5 text-green-500" /><span className="text-sm font-medium text-green-600">All fields auto-filled!</span></div>
          ) : (
            <div><Icon n="download" c="w-6 h-6 mx-auto mb-1" /><p className="text-sm font-medium" style={{ color: GHL.text }}>Upload Flight Confirmation</p><p className="text-xs mt-0.5" style={{ color: GHL.muted }}>PDF, image, or e-ticket &mdash; all fields filled automatically including terminal, gate, status</p></div>
          )}
        </label>
      </div>

      {/* Live Status Banner */}
      {flightStatus && sc && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: sc.bg, color: sc.text }}>
          <span className="w-2 h-2 rounded-full" style={{ background: sc.text }} />
          {form.flightNo} &mdash; {flightStatus}
          {form.duration && <span className="ml-auto text-xs font-normal opacity-70">{form.duration}</span>}
        </div>
      )}

      {/* Flight Number + Airline row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lc} style={{ color: GHL.muted }}>Flight Number *</label>
          <input type="text" value={form.flightNo || ''} onChange={(e) => handleFlightNoChange(e.target.value)} placeholder="UA1047, DL401..." className={ic} style={{ borderColor: GHL.border, fontSize: '1rem', fontWeight: 600 }} />
        </div>
        <div>
          <label className={lc} style={{ color: GHL.muted }}>Airline</label>
          <input type="text" value={form.airline || ''} onChange={(e) => set('airline', e.target.value)} placeholder="Auto-filled" className={ic} style={{ borderColor: GHL.border }} />
        </div>
      </div>

      {/* Route: From -> To */}
      <div className="grid grid-cols-4 gap-3">
        <div><label className={lc} style={{ color: GHL.muted }}>From Code</label><input value={form.from || ''} onChange={(e) => set('from', e.target.value.toUpperCase())} placeholder="CUN" className={ic + ' text-center font-bold text-lg'} style={{ borderColor: GHL.border }} maxLength={4} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>From City</label><GooglePlacesInput value={form.fromCity || ''} onChange={(v) => set('fromCity', v)} placeholder="Cancun" className={ic + ' pl-9'} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>To Code</label><input value={form.to || ''} onChange={(e) => set('to', e.target.value.toUpperCase())} placeholder="EWR" className={ic + ' text-center font-bold text-lg'} style={{ borderColor: GHL.border }} maxLength={4} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>To City</label><GooglePlacesInput value={form.toCity || ''} onChange={(v) => set('toCity', v)} placeholder="Newark" className={ic + ' pl-9'} /></div>
      </div>

      {/* Departure details */}
      <div className="p-4 rounded-xl" style={{ background: GHL.bg }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.muted }}>Departure</p>
        <div className="grid grid-cols-4 gap-3">
          <div><label className={lc} style={{ color: GHL.muted }}>Date/Time</label><input type="datetime-local" value={form.departure || ''} onChange={(e) => set('departure', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Scheduled</label><input value={form.scheduledDeparture || ''} onChange={(e) => set('scheduledDeparture', e.target.value)} placeholder="6:00 PM" className={ic} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Terminal</label><input value={form.depTerminal || ''} onChange={(e) => set('depTerminal', e.target.value)} placeholder="3" className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Gate</label><input value={form.depGate || ''} onChange={(e) => set('depGate', e.target.value)} placeholder="C4" className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
        </div>
      </div>

      {/* Arrival details */}
      <div className="p-4 rounded-xl" style={{ background: GHL.bg }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.muted }}>Arrival</p>
        <div className="grid grid-cols-4 gap-3">
          <div><label className={lc} style={{ color: GHL.muted }}>Date/Time</label><input type="datetime-local" value={form.arrival || ''} onChange={(e) => set('arrival', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Estimated</label><input value={form.scheduledArrival || ''} onChange={(e) => set('scheduledArrival', e.target.value)} placeholder="10:30 PM" className={ic} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Terminal</label><input value={form.arrTerminal || ''} onChange={(e) => set('arrTerminal', e.target.value)} placeholder="B" className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
          <div><label className={lc} style={{ color: GHL.muted }}>Gate</label><input value={form.arrGate || ''} onChange={(e) => set('arrGate', e.target.value)} placeholder="B55" className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
        </div>
      </div>

      {/* Flight info row */}
      <div className="grid grid-cols-4 gap-3">
        <div><label className={lc} style={{ color: GHL.muted }}>Duration</label><input value={form.duration || ''} onChange={(e) => set('duration', e.target.value)} placeholder="3h 51m" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Status</label><select value={form.status || ''} onChange={(e) => set('status', e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{['Scheduled', 'On Time', 'Departing On Time', 'Delayed', 'Boarding', 'In Air', 'Landed', 'Arrived', 'Cancelled', 'Diverted'].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Aircraft</label><input value={form.aircraft || ''} onChange={(e) => set('aircraft', e.target.value)} placeholder="Boeing 737-800" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Class</label><select value={form.seatClass || ''} onChange={(e) => set('seatClass', e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{['Economy', 'Premium Economy', 'Business', 'First'].map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>

      {/* Booking details */}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={lc} style={{ color: GHL.muted }}>PNR / Confirmation</label><input value={form.pnr || ''} onChange={(e) => set('pnr', e.target.value)} placeholder="XKJD82" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Source</label><input value={form.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="GDS" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Cost ($)</label><input type="number" value={form.cost || ''} onChange={(e) => set('cost', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Sell ($)</label><input type="number" value={form.sell || ''} onChange={(e) => set('sell', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
      </div>

      {/* Notes */}
      <div><label className={lc} style={{ color: GHL.muted }}>Notes</label><textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Special requests, meal preferences..." className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /></div>
    </div>
  );
}
