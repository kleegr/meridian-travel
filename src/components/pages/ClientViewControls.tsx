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
  const ic = 'w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white';
  const lc = 'text-[9px] font-bold uppercase tracking-wider mb-1';

  const Toggle = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
      <span className="text-xs" style={{ color: GHL.text }}>{label}</span>
      <div className="w-8 h-4.5 rounded-full transition-colors relative" style={{ background: checked ? GHL.accent : '#d1d5db' }}>
        <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm" style={{ left: checked ? '17px' : '2px' }} />
      </div>
    </div>
  );

  return (
    <div className="no-print">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold" style={{ borderColor: GHL.border, color: open ? GHL.accent : GHL.muted, background: open ? GHL.accentLight : 'white' }}>
        <Icon n="settings" c="w-3.5 h-3.5" /> Customize View
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-xl border shadow-lg p-5" style={{ borderColor: GHL.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: GHL.text }}>Client Itinerary Settings</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="x" c="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Layout & Design */}
            <div>
              <p className={lc} style={{ color: GHL.muted }}>Layout & Design</p>
              <div className="space-y-2">
                <div><label className="text-[9px] font-medium" style={{ color: GHL.muted }}>Layout Style</label>
                  <select value={s.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                    <option value="classic">Classic</option><option value="editorial">Editorial</option><option value="hero-split">Hero Split</option><option value="minimal">Minimal</option><option value="brochure">Brochure</option>
                  </select>
                </div>
                <div><label className="text-[9px] font-medium" style={{ color: GHL.muted }}>Typography</label>
                  <select value={s.fontFamily} onChange={e => set('fontFamily', e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                    <option value="serif">Serif (Classic)</option><option value="sans-serif">Sans Serif (Modern)</option><option value="modern">Modern (Clean)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[9px] font-medium" style={{ color: GHL.muted }}>Primary Color</label><input type="color" value={s.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-full h-8 rounded-lg border cursor-pointer" style={{ borderColor: GHL.border }} /></div>
                  <div><label className="text-[9px] font-medium" style={{ color: GHL.muted }}>Accent Color</label><input type="color" value={s.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-full h-8 rounded-lg border cursor-pointer" style={{ borderColor: GHL.border }} /></div>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div>
              <p className={lc} style={{ color: GHL.muted }}>Branding</p>
              <div className="space-y-2">
                <Toggle label="Show Logo" checked={s.showLogo} onToggle={() => set('showLogo', !s.showLogo)} />
                {s.showLogo && (
                  <div><label className="text-[9px] font-medium" style={{ color: GHL.muted }}>Logo Position</label>
                    <select value={s.logoPosition} onChange={e => set('logoPosition', e.target.value)} className={ic} style={{ borderColor: GHL.border }}>
                      <option value="top-left">Top Left</option><option value="top-center">Top Center</option><option value="top-right">Top Right</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[9px] font-medium" style={{ color: GHL.muted }}>Cover Image URL</label>
                  <input value={s.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="https://..." className={ic} style={{ borderColor: GHL.border }} />
                </div>
                {logoUrl && <div className="mt-2 p-2 rounded-lg" style={{ background: GHL.bg }}><p className="text-[9px]" style={{ color: GHL.muted }}>Using company logo from settings</p><img src={logoUrl} alt="Logo" className="h-8 mt-1 object-contain" /></div>}
              </div>
            </div>

            {/* Section Visibility */}
            <div>
              <p className={lc} style={{ color: GHL.muted }}>Visible Sections</p>
              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                <Toggle label="Trip Overview" checked={s.showOverview} onToggle={() => set('showOverview', !s.showOverview)} />
                <Toggle label="Travelers" checked={s.showPassengers} onToggle={() => set('showPassengers', !s.showPassengers)} />
                <Toggle label="Flights" checked={s.showFlights} onToggle={() => set('showFlights', !s.showFlights)} />
                <Toggle label="Hotels" checked={s.showHotels} onToggle={() => set('showHotels', !s.showHotels)} />
                <Toggle label="Transfers" checked={s.showTransfers} onToggle={() => set('showTransfers', !s.showTransfers)} />
                <Toggle label="Activities" checked={s.showActivities} onToggle={() => set('showActivities', !s.showActivities)} />
                <Toggle label="Insurance" checked={s.showInsurance} onToggle={() => set('showInsurance', !s.showInsurance)} />
                <Toggle label="Destination Information" checked={s.showDestinationInfo} onToggle={() => set('showDestinationInfo', !s.showDestinationInfo)} />
                <Toggle label="Davening / Minyan" checked={s.showDavening} onToggle={() => set('showDavening', !s.showDavening)} />
                <Toggle label="Mikvah" checked={s.showMikvah} onToggle={() => set('showMikvah', !s.showMikvah)} />
                <Toggle label="Notes" checked={s.showNotes} onToggle={() => set('showNotes', !s.showNotes)} />
                <Toggle label="Contact Information" checked={s.showContactInfo} onToggle={() => set('showContactInfo', !s.showContactInfo)} />
              </div>
            </div>
          </div>

          {/* AI Enhance Button */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: GHL.border }}>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
              <Icon n="star" c="w-3.5 h-3.5" /> AI Enhance Itinerary Copy
            </button>
            <p className="text-[9px] mt-1" style={{ color: GHL.muted }}>Uses AI to polish descriptions and suggest improvements</p>
          </div>
        </div>
      )}
    </div>
  );
}
