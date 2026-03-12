'use client';

import { useState } from 'react';
import Icon from './Icon';
import GooglePlacesInput from './GooglePlacesInput';
import SmartFlightFields from '@/components/forms/SmartFlightFields';
import { GHL } from '@/lib/constants';
import type { FormField } from '@/lib/types';

interface SmartFormModalProps {
  title: string;
  subtitle?: string;
  fields: FormField[];
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
  initial?: Record<string, string>;
  mode?: 'flight' | 'default';
  onDepartureChange?: (date: string) => void;
}

export default function SmartFormModal({ title, subtitle, fields, onSave, onClose, initial, mode = 'default', onDepartureChange }: SmartFormModalProps) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = initial?.[f.key] || ''; });
    return init;
  });

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    // Smart date: when departure/startDate changes, auto-set return if empty
    if ((k === 'departure' || k === 'startDate') && onDepartureChange) {
      onDepartureChange(v);
    }
    if (k === 'startDate' && v && !form.endDate) {
      // Default return date = departure + 7 days
      const d = new Date(v);
      d.setDate(d.getDate() + 7);
      setForm((f) => ({ ...f, endDate: d.toISOString().split('T')[0] }));
    }
  };

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: GHL.border }}>
          <div><h2 className="text-xl font-bold" style={{ color: GHL.text }}>{title}</h2>{subtitle && <p className="text-sm mt-0.5" style={{ color: GHL.muted }}>{subtitle}</p>}</div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: GHL.muted }}><Icon n="x" c="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          {mode === 'flight' ? (
            <SmartFlightFields form={form} set={set} fields={fields} />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className={f.half === false ? 'col-span-2' : ''}>
                  <label className={lc} style={{ color: GHL.muted }}>{f.label}{f.required ? ' *' : ''}</label>
                  {f.location ? (
                    <GooglePlacesInput value={form[f.key] || ''} onChange={(v) => set(f.key, v)} placeholder={f.placeholder} className={ic + ' pl-9'} />
                  ) : f.type === 'select' ? (
                    <select value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
                  ) : f.type === 'textarea' ? (
                    <textarea value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} rows={3} placeholder={f.placeholder} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} />
                  ) : (
                    <input type={f.type || 'text'} value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className={ic} style={{ borderColor: GHL.border }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-gray-200" style={{ color: GHL.muted }}>Cancel</button>
          <button onClick={() => onSave(form)} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 shadow-sm" style={{ background: GHL.accent }}>
            <span className="flex items-center gap-2"><Icon n="save" c="w-4 h-4" /> Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
