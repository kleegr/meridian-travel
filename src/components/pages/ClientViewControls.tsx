'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { ClientViewSettings } from '@/lib/types';
import { DEFAULT_CLIENT_VIEW_SETTINGS } from '@/lib/types';

interface Props {
  settings: ClientViewSettings;
  onChange: (s: ClientViewSettings) => void;
  logoUrl?: string;
}

export default function ClientViewControls({ settings, onChange, logoUrl }: Props) {
  const [open, setOpen] = useState(false);
  const s = settings || DEFAULT_CLIENT_VIEW_SETTINGS;
  const set = (key: keyof ClientViewSettings, val: any) => {
    const updated = { ...s, [key]: val };
    onChange(updated);
  };

  const Toggle = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
    <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-gray-50 cursor-pointer select-none">
      <span className="text-[10px]" style={{ color: GHL.text }}>{label}</span>
      <div onClick={e => { e.preventDefault(); onToggle(); }} className="w-7 h-4 rounded-full relative cursor-pointer flex-shrink-0" style={{ background: checked ? GHL.accent : '#d1d5db' }}>
        <div className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all shadow-sm" style={{ left: checked ? '14px' : '2px' }} />
      </div>
    </label>
  );

  if (!open) {
    return (
      <div className="no-print flex items-center gap-3 mb-3">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-semibold hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }}>
          <Icon n="settings" c="w-3 h-3" /> Customize
        </button>
        <span className="text-[9px]" style={{ color: GHL.muted }}>{s.layoutStyle} \u00b7 {s.fontFamily}</span>
      </div>
    );
  }

  return (
    <div className="no-print mb-4">
      <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: GHL.border }}>
          <span className="text-xs font-bold" style={{ color: GHL.text }}>Customize Client Itinerary</span>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-3.5 h-3.5" /></button>
        </div>

        <div className="grid grid-cols-4 gap-3 p-3">
          {/* Col 1: Layout */}
          <div className="space-y-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Layout</p>
            <select value={s.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className="w-full px-2 py-1 border rounded text-[10px]" style={{ borderColor: GHL.border }}>
              <option value="classic">Classic</option><option value="editorial">Editorial</option><option value="hero-split">Hero Split</option><option value="minimal">Minimal</option><option value="brochure">Brochure</option>
            </select>
            <select value={s.fontFamily} onChange={e => set('fontFamily', e.target.value)} className="w-full px-2 py-1 border rounded text-[10px]" style={{ borderColor: GHL.border }}>
              <option value="serif">Serif</option><option value="sans-serif">Sans Serif</option><option value="modern">Modern</option>
            </select>
            <div className="flex gap-1.5">
              <div className="flex-1"><label className="text-[7px] uppercase" style={{ color: GHL.muted }}>Primary</label><input type="color" value={s.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-full h-6 rounded border cursor-pointer" style={{ borderColor: GHL.border }} /></div>
              <div className="flex-1"><label className="text-[7px] uppercase" style={{ color: GHL.muted }}>Accent</label><input type="color" value={s.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-full h-6 rounded border cursor-pointer" style={{ borderColor: GHL.border }} /></div>
            </div>
          </div>

          {/* Col 2: Branding */}
          <div className="space-y-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Branding</p>
            <Toggle label="Show Logo" checked={s.showLogo} onToggle={() => set('showLogo', !s.showLogo)} />
            {s.showLogo && <select value={s.logoPosition} onChange={e => set('logoPosition', e.target.value)} className="w-full px-2 py-1 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="top-left">Left</option><option value="top-center">Center</option><option value="top-right">Right</option></select>}
            <div><label className="text-[7px] uppercase" style={{ color: GHL.muted }}>Cover Image</label><input value={s.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="https://..." className="w-full px-2 py-1 border rounded text-[10px]" style={{ borderColor: GHL.border }} /></div>
          </div>

          {/* Col 3-4: Sections */}
          <div className="col-span-2">
            <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Visible Sections</p>
            <div className="grid grid-cols-2 gap-x-3">
              <Toggle label="Trip Overview" checked={s.showOverview} onToggle={() => set('showOverview', !s.showOverview)} />
              <Toggle label="Travelers" checked={s.showPassengers} onToggle={() => set('showPassengers', !s.showPassengers)} />
              <Toggle label="Flights" checked={s.showFlights} onToggle={() => set('showFlights', !s.showFlights)} />
              <Toggle label="Hotels" checked={s.showHotels} onToggle={() => set('showHotels', !s.showHotels)} />
              <Toggle label="Transportation" checked={s.showTransfers} onToggle={() => set('showTransfers', !s.showTransfers)} />
              <Toggle label="Activities" checked={s.showActivities} onToggle={() => set('showActivities', !s.showActivities)} />
              <Toggle label="Insurance" checked={s.showInsurance} onToggle={() => set('showInsurance', !s.showInsurance)} />
              <Toggle label="Destination Info" checked={s.showDestinationInfo} onToggle={() => set('showDestinationInfo', !s.showDestinationInfo)} />
              <Toggle label="Davening" checked={s.showDavening} onToggle={() => set('showDavening', !s.showDavening)} />
              <Toggle label="Mikvah" checked={s.showMikvah} onToggle={() => set('showMikvah', !s.showMikvah)} />
              <Toggle label="Notes" checked={s.showNotes} onToggle={() => set('showNotes', !s.showNotes)} />
              <Toggle label="Contact Info" checked={s.showContactInfo} onToggle={() => set('showContactInfo', !s.showContactInfo)} />
            </div>
          </div>
        </div>

        {/* AI Button - compact */}
        <div className="px-4 py-2 border-t flex items-center gap-3" style={{ borderColor: GHL.border }}>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
            <Icon n="star" c="w-3 h-3" /> AI Enhance
          </button>
          <span className="text-[8px]" style={{ color: GHL.muted }}>Polish descriptions and improve copy</span>
        </div>
      </div>
    </div>
  );
}
