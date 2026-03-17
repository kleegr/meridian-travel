'use client';

import { useState } from 'react';
import Icon from './Icon';
import GooglePlacesInput from './GooglePlacesInput';
import { GHL } from '@/lib/constants';
import type { FormField } from '@/lib/types';

interface FormModalProps {
  title: string;
  subtitle?: string;
  fields: FormField[];
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
  initial?: Record<string, string>;
}

export default function FormModal({ title, subtitle, fields, onSave, onClose, initial }: FormModalProps) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => { init[f.key] = initial?.[f.key] || ''; });
    return init;
  });
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };
  const doSave = () => { onSave(form); setSaved(true); };
  const handleSaveAndClose = () => { onSave(form); onClose(); };

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
          <div className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className={f.half === false ? 'col-span-2' : ''}>
                <label className={lc} style={{ color: GHL.muted }}>{f.label}{f.required ? ' *' : ''}</label>
                {f.location ? <GooglePlacesInput value={form[f.key]} onChange={(v) => set(f.key, v)} placeholder={f.placeholder} className={ic + ' pl-9'} />
                : f.type === 'select' ? <select value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="">Select...</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
                : f.type === 'textarea' ? <textarea value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} rows={3} placeholder={f.placeholder} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} />
                : <input type={f.type || 'text'} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className={ic} style={{ borderColor: GHL.border }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t" style={{ background: GHL.bg, borderColor: GHL.border }}>
          <div>{saved && <p className="text-xs font-medium" style={{ color: '#10b981' }}>Saved!</p>}</div>
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
                <button onClick={() => { doSave(); setShowSaveMenu(false); }} className="block w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded" style={{ color: GHL.text }}>Save (keep editing)</button>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
