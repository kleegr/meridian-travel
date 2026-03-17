'use client';

import { useState } from 'react';
import Icon from './Icon';
import GooglePlacesInput from './GooglePlacesInput';
import SmartFlightFields from '@/components/forms/SmartFlightFields';
import SmartHotelFields from '@/components/forms/SmartHotelFields';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { FormField } from '@/lib/types';
import type { ParsedFlightData } from '@/lib/pdf-parser';

interface SmartFormModalProps {
  title: string;
  subtitle?: string;
  fields: FormField[];
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
  initial?: Record<string, string>;
  mode?: 'flight' | 'hotel' | 'default';
  onSaveMultipleFlights?: (flights: Record<string, string>[]) => void;
}

export default function SmartFormModal({ title, subtitle, fields, onSave, onClose, initial, mode = 'default', onSaveMultipleFlights }: SmartFormModalProps) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = initial?.[f.key] || ''; });
    return init;
  });
  const [pendingConnections, setPendingConnections] = useState<ParsedFlightData[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
    if (k === 'startDate' && v && !form.endDate) {
      const d = new Date(v); d.setDate(d.getDate() + 7);
      setForm((f) => ({ ...f, endDate: d.toISOString().split('T')[0] }));
    }
    if (k === 'checkIn' && v && !form.checkOut) {
      const d = new Date(v); d.setDate(d.getDate() + 3);
      setForm((f) => ({ ...f, checkOut: d.toISOString().split('T')[0] }));
    }
  };

  const handleAddConnections = (segments: ParsedFlightData[]) => setPendingConnections(segments);

  const doSave = () => {
    if (pendingConnections.length > 0 && onSaveMultipleFlights) {
      const allFlights: Record<string, string>[] = [];
      allFlights.push({ ...form });
      pendingConnections.forEach((seg) => {
        const entry: Record<string, string> = {};
        Object.entries(seg).forEach(([key, val]) => {
          if (val != null && String(val).trim()) {
            const sv = String(val);
            entry[key] = (key === 'departure' || key === 'arrival') ? sv.replace(' ', 'T') : sv;
          }
        });
        allFlights.push(entry);
      });
      onSaveMultipleFlights(allFlights);
    } else {
      onSave(form);
    }
    setSaved(true);
  };

  const handleSave = () => { doSave(); };
  const handleSaveAndClose = () => { doSave(); onClose(); };

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: GHL.border }}>
          <div><h2 className="text-xl font-bold" style={{ color: GHL.text }}>{title}</h2>{subtitle && <p className="text-sm mt-0.5" style={{ color: GHL.muted }}>{subtitle}</p>}</div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {mode === 'flight' ? <SmartFlightFields form={form} set={set} fields={fields} onAddConnections={handleAddConnections} />
          : mode === 'hotel' ? <SmartHotelFields form={form} set={set} fields={fields} />
          : <div className="grid grid-cols-2 gap-4">
            {fields.map((f) => {
              if (f.type === 'checkbox') {
                return <div key={f.key} className="col-span-2 flex items-center gap-3 p-3 rounded-lg" style={{ background: form[f.key] === 'true' ? '#fefce8' : GHL.bg, border: form[f.key] === 'true' ? '1px solid #fde68a' : `1px solid ${GHL.border}` }}>
                  <button onClick={() => set(f.key, form[f.key] === 'true' ? '' : 'true')} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={form[f.key] === 'true' ? { background: '#d97706', borderColor: '#d97706' } : { borderColor: '#d1d5db' }}>{form[f.key] === 'true' && <Icon n="check" c="w-3 h-3 text-white" />}</button>
                  <span className="text-sm font-medium" style={{ color: GHL.text }}>{f.label}</span>
                </div>;
              }
              return <div key={f.key} className={f.half === false ? 'col-span-2' : ''}>
                <label className={lc} style={{ color: GHL.muted }}>{f.label}{f.required ? ' *' : ''}</label>
                {f.location ? <GooglePlacesInput value={form[f.key] || ''} onChange={(v) => set(f.key, v)} placeholder={f.placeholder} className={ic + ' pl-9'} />
                : f.type === 'select' ? <select value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
                : f.type === 'textarea' ? <textarea value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} rows={3} placeholder={f.placeholder} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} />
                : <input type={f.type || 'text'} value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className={ic} style={{ borderColor: GHL.border }} />}
              </div>;
            })}
          </div>}
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <div className="flex items-center gap-2">
            {pendingConnections.length > 0 && <p className="text-xs font-medium" style={{ color: '#3b82f6' }}>Will save {pendingConnections.length + 1} flights total</p>}
            {saved && <p className="text-xs font-medium" style={{ color: '#10b981' }}>Saved!</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-200" style={{ color: GHL.muted }}>Cancel</button>
            <div className="relative flex">
              <button onClick={handleSaveAndClose} className="px-5 py-2.5 text-sm font-semibold text-white rounded-l-lg hover:opacity-90 shadow-sm" style={{ background: GHL.accent }}>
                <span className="flex items-center gap-2"><Icon n="save" c="w-4 h-4" /> Save & Close</span>
              </button>
              <button onClick={() => setShowSaveMenu(!showSaveMenu)} className="px-2 py-2.5 text-white rounded-r-lg hover:opacity-90 border-l border-white/20" style={{ background: GHL.accent }}>
                <Icon n="chevronDown" c="w-3 h-3" />
              </button>
              {showSaveMenu && <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-xl border p-1 min-w-[160px] z-10" style={{ borderColor: GHL.border }}>
                <button onClick={() => { handleSaveAndClose(); setShowSaveMenu(false); }} className="block w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded" style={{ color: GHL.text }}>Save & Close</button>
                <button onClick={() => { handleSave(); setShowSaveMenu(false); }} className="block w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded" style={{ color: GHL.text }}>Save (keep editing)</button>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
