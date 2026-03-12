'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { parseFlightNumber } from '@/lib/flight-lookup';
import { parseFlightPDF } from '@/lib/pdf-parser';
import type { FormField } from '@/lib/types';
import GooglePlacesInput from '@/components/ui/GooglePlacesInput';

interface SmartFlightFieldsProps {
  form: Record<string, string>;
  set: (key: string, value: string) => void;
  fields: FormField[];
}

export default function SmartFlightFields({ form, set, fields }: SmartFlightFieldsProps) {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  // Auto-fill from flight number
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

  // Parse uploaded PDF
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const data = await parseFlightPDF(file);
      if (data.from) set('from', data.from);
      if (data.to) set('to', data.to);
      if (data.airline) set('airline', data.airline);
      if (data.flightNo) set('flightNo', data.flightNo);
      if (data.departure) set('departure', data.departure.replace(' ', 'T'));
      if (data.arrival) set('arrival', data.arrival.replace(' ', 'T'));
      if (data.pnr) set('pnr', data.pnr);
      if (data.supplier) set('supplier', data.supplier);
      setParsed(true);
    } catch (err) {
      console.error('Upload parse error:', err);
    }
    setParsing(false);
  }, [set]);

  return (
    <div className="space-y-4">
      {/* PDF Upload Zone */}
      <div className="border-2 border-dashed rounded-xl p-4 text-center transition-colors" style={{ borderColor: parsing ? GHL.accent : GHL.border, background: parsed ? '#f0fdf4' : '#fafbfc' }}>
        <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="flight-pdf-upload" />
        <label htmlFor="flight-pdf-upload" className="cursor-pointer block">
          {parsing ? (
            <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /><span className="text-sm font-medium" style={{ color: GHL.accent }}>Reading PDF...</span></div>
          ) : parsed ? (
            <div className="flex items-center justify-center gap-2"><Icon n="check" c="w-5 h-5 text-green-500" /><span className="text-sm font-medium text-green-600">Fields auto-filled from PDF!</span></div>
          ) : (
            <div><Icon n="download" c="w-6 h-6 mx-auto mb-1" /><p className="text-sm font-medium" style={{ color: GHL.text }}>Upload Flight Confirmation PDF</p><p className="text-xs mt-0.5" style={{ color: GHL.muted }}>Drop a PDF or click to browse &mdash; all fields will be filled automatically</p></div>
          )}
        </label>
      </div>

      {/* Flight Number with auto-lookup */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={lc} style={{ color: GHL.muted }}>Flight Number <span className="text-xs font-normal">(auto-fills airline)</span></label>
          <input type="text" value={form.flightNo || ''} onChange={(e) => handleFlightNoChange(e.target.value)} placeholder="e.g. DL401, BA215, EK654" className={ic} style={{ borderColor: GHL.border, fontSize: '1rem', fontWeight: 600 }} />
        </div>

        {/* Regular fields */}
        {fields.filter((f) => f.key !== 'flightNo').map((f) => (
          <div key={f.key} className={f.half === false ? 'col-span-2' : ''}>
            <label className={lc} style={{ color: GHL.muted }}>{f.label}{f.required ? ' *' : ''}</label>
            {f.location ? (
              <GooglePlacesInput value={form[f.key] || ''} onChange={(v) => set(f.key, v)} placeholder={f.placeholder} className={ic + ' pl-9'} />
            ) : f.type === 'select' ? (
              <select value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                <option value="">Select...</option>
                {f.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} rows={3} placeholder={f.placeholder} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} />
            ) : (
              <input type={f.type || 'text'} value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className={ic} style={{ borderColor: GHL.border }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
