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
  const set = (key: keyof ClientViewSettings, val: any) => onChange({ ...s, [key]: val });

  const Tog = ({ label, on, flip }: { label: string; on: boolean; flip: () => void }) => (
    <div className="flex items-center justify-between py-0.5 cursor-pointer select-none" onClick={flip}>
      <span className="text-[9px]" style={{ color: GHL.text }}>{label}</span>
      <div className="w-6 h-3.5 rounded-full relative flex-shrink-0" style={{ background: on ? GHL.accent : '#d1d5db' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 shadow-sm" style={{ left: on ? '12px' : '2px', transition: 'left 0.15s' }} />
      </div>
    </div>
  );

  if (!open) {
    return (
      <div className="no-print mb-2">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[9px] font-semibold hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }}>
          <Icon n="settings" c="w-2.5 h-2.5" /> Customize
        </button>
      </div>
    );
  }

  return (
    <div className="no-print mb-3">
      <div className="bg-white rounded-lg border text-[9px]" style={{ borderColor: GHL.border }}>
        <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: GHL.border }}>
          <span className="font-bold text-[10px]" style={{ color: GHL.text }}>Customize Client View</span>
          <button onClick={() => setOpen(false)} className="p-0.5 rounded hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-3 h-3" /></button>
        </div>
        <div className="grid grid-cols-5 gap-2 px-3 py-2">
          {/* Design */}
          <div>
            <p className="text-[7px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Design</p>
            <select value={s.layoutStyle} onChange={e => set('layoutStyle', e.target.value as any)} className="w-full px-1.5 py-0.5 border rounded text-[9px] mb-1" style={{ borderColor: GHL.border }}>
              <option value="classic">Classic</option><option value="editorial">Editorial</option><option value="minimal">Minimal</option><option value="brochure">Brochure</option>
            </select>
            <select value={s.fontFamily} onChange={e => set('fontFamily', e.target.value as any)} className="w-full px-1.5 py-0.5 border rounded text-[9px]" style={{ borderColor: GHL.border }}>
              <option value="serif">Serif</option><option value="sans-serif">Sans Serif</option><option value="modern">Modern</option><option value="elegant">Elegant</option><option value="clean">Clean</option><option value="mono">Monospace</option>
            </select>
          </div>
          {/* Colors */}
          <div>
            <p className="text-[7px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Colors</p>
            <div className="flex gap-1 mb-1">
              <div className="flex-1"><label className="text-[6px] uppercase" style={{ color: GHL.muted }}>Primary</label><input type="color" value={s.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-full h-5 rounded border cursor-pointer block" style={{ borderColor: GHL.border }} /></div>
              <div className="flex-1"><label className="text-[6px] uppercase" style={{ color: GHL.muted }}>Accent</label><input type="color" value={s.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-full h-5 rounded border cursor-pointer block" style={{ borderColor: GHL.border }} /></div>
            </div>
            <Tog label="Logo" on={s.showLogo} flip={() => set('showLogo', !s.showLogo)} />
          </div>
          {/* Brand */}
          <div>
            <p className="text-[7px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Brand</p>
            {s.showLogo && <select value={s.logoPosition} onChange={e => set('logoPosition', e.target.value as any)} className="w-full px-1.5 py-0.5 border rounded text-[9px] mb-1" style={{ borderColor: GHL.border }}><option value="top-left">Logo Left</option><option value="top-center">Logo Center</option><option value="top-right">Logo Right</option></select>}
            <input value={s.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="Cover image URL" className="w-full px-1.5 py-0.5 border rounded text-[9px]" style={{ borderColor: GHL.border }} />
          </div>
          {/* Sections col 1 */}
          <div>
            <p className="text-[7px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Show / Hide</p>
            <Tog label="Overview" on={s.showOverview} flip={() => set('showOverview', !s.showOverview)} />
            <Tog label="Travelers" on={s.showPassengers} flip={() => set('showPassengers', !s.showPassengers)} />
            <Tog label="Flights" on={s.showFlights} flip={() => set('showFlights', !s.showFlights)} />
            <Tog label="Hotels" on={s.showHotels} flip={() => set('showHotels', !s.showHotels)} />
            <Tog label="Transport" on={s.showTransfers} flip={() => set('showTransfers', !s.showTransfers)} />
            <Tog label="Activities" on={s.showActivities} flip={() => set('showActivities', !s.showActivities)} />
          </div>
          {/* Sections col 2 */}
          <div>
            <p className="text-[7px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>&nbsp;</p>
            <Tog label="Insurance" on={s.showInsurance} flip={() => set('showInsurance', !s.showInsurance)} />
            <Tog label="Dest. Info" on={s.showDestinationInfo} flip={() => set('showDestinationInfo', !s.showDestinationInfo)} />
            <Tog label="Davening" on={s.showDavening} flip={() => set('showDavening', !s.showDavening)} />
            <Tog label="Mikvah" on={s.showMikvah} flip={() => set('showMikvah', !s.showMikvah)} />
            <Tog label="Notes" on={s.showNotes} flip={() => set('showNotes', !s.showNotes)} />
            <Tog label="Contact" on={s.showContactInfo} flip={() => set('showContactInfo', !s.showContactInfo)} />
          </div>
        </div>
      </div>
    </div>
  );
}
