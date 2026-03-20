'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import TemplateRenderer from './TemplateRenderer';
import type { Itinerary, AgencyProfile, ClientViewSettings } from '@/lib/types';
import { DEFAULT_CLIENT_VIEW_SETTINGS } from '@/lib/types';

interface Props {
  itin: Itinerary;
  agencyProfile: AgencyProfile;
  onUpdate: (settings: ClientViewSettings) => void;
  onEditItem?: (section: string, id: number) => void;
}

const TEMPLATES: { id: string; name: string; thumb: string; layout: string; desc: string; settings: Partial<ClientViewSettings> }[] = [
  { id: 'classic-navy', name: 'Classic Navy', layout: 'classic', desc: 'Full hero cover', thumb: 'linear-gradient(135deg, #093168, #1a5298)', settings: { primaryColor: '#093168', accentColor: '#1a5298', fontFamily: 'serif', layoutStyle: 'classic' } },
  { id: 'editorial-forest', name: 'Forest Editorial', layout: 'editorial', desc: 'Split cover, cards', thumb: 'linear-gradient(135deg, #14532d, #16a34a)', settings: { primaryColor: '#14532d', accentColor: '#16a34a', fontFamily: 'serif', layoutStyle: 'editorial' } },
  { id: 'brochure-ocean', name: 'Ocean Brochure', layout: 'brochure', desc: 'Magazine style', thumb: 'linear-gradient(135deg, #0c4a6e, #0284c7)', settings: { primaryColor: '#0c4a6e', accentColor: '#0284c7', fontFamily: 'clean', layoutStyle: 'brochure' } },
  { id: 'minimal-slate', name: 'Minimal Slate', layout: 'minimal', desc: 'Clean & elegant', thumb: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', settings: { primaryColor: '#1e293b', accentColor: '#475569', fontFamily: 'clean', layoutStyle: 'minimal' } },
  { id: 'editorial-purple', name: 'Royal Purple', layout: 'editorial', desc: 'Split cover, cards', thumb: 'linear-gradient(135deg, #4c1d95, #7c3aed)', settings: { primaryColor: '#4c1d95', accentColor: '#7c3aed', fontFamily: 'elegant', layoutStyle: 'editorial' } },
  { id: 'classic-gold', name: 'Elegant Gold', layout: 'classic', desc: 'Full hero cover', thumb: 'linear-gradient(135deg, #78350f, #b45309)', settings: { primaryColor: '#78350f', accentColor: '#b45309', fontFamily: 'elegant', layoutStyle: 'classic' } },
  { id: 'brochure-sunset', name: 'Sunset Brochure', layout: 'brochure', desc: 'Magazine style', thumb: 'linear-gradient(135deg, #9a3412, #ea580c)', settings: { primaryColor: '#9a3412', accentColor: '#ea580c', fontFamily: 'modern', layoutStyle: 'brochure' } },
  { id: 'minimal-arctic', name: 'Arctic Clean', layout: 'minimal', desc: 'Clean & elegant', thumb: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', settings: { primaryColor: '#0c4a6e', accentColor: '#0ea5e9', fontFamily: 'clean', layoutStyle: 'minimal' } },
  { id: 'classic-dark', name: 'Modern Dark', layout: 'classic', desc: 'Full hero cover', thumb: 'linear-gradient(135deg, #111827, #1f2937)', settings: { primaryColor: '#111827', accentColor: '#374151', fontFamily: 'sans-serif', layoutStyle: 'classic' } },
  { id: 'editorial-midnight', name: 'Midnight Edit.', layout: 'editorial', desc: 'Split cover, cards', thumb: 'linear-gradient(135deg, #0f172a, #1e40af)', settings: { primaryColor: '#0f172a', accentColor: '#1e40af', fontFamily: 'sans-serif', layoutStyle: 'editorial' } },
  { id: 'brochure-rose', name: 'Rose Brochure', layout: 'brochure', desc: 'Magazine style', thumb: 'linear-gradient(135deg, #881337, #e11d48)', settings: { primaryColor: '#881337', accentColor: '#e11d48', fontFamily: 'elegant', layoutStyle: 'brochure' } },
  { id: 'classic-tropical', name: 'Tropical', layout: 'classic', desc: 'Full hero cover', thumb: 'linear-gradient(135deg, #065f46, #059669)', settings: { primaryColor: '#065f46', accentColor: '#059669', fontFamily: 'clean', layoutStyle: 'classic' } },
  { id: 'editorial-charcoal', name: 'Charcoal Edit.', layout: 'editorial', desc: 'Split cover, cards', thumb: 'linear-gradient(135deg, #18181b, #3f3f46)', settings: { primaryColor: '#18181b', accentColor: '#52525b', fontFamily: 'mono', layoutStyle: 'editorial' } },
  { id: 'brochure-burgundy', name: 'Burgundy Broch.', layout: 'brochure', desc: 'Magazine style', thumb: 'linear-gradient(135deg, #4a0420, #831843)', settings: { primaryColor: '#4a0420', accentColor: '#831843', fontFamily: 'elegant', layoutStyle: 'brochure' } },
  { id: 'minimal-sage', name: 'Sage Minimal', layout: 'minimal', desc: 'Clean & elegant', thumb: 'linear-gradient(135deg, #365314, #4d7c0f)', settings: { primaryColor: '#365314', accentColor: '#4d7c0f', fontFamily: 'serif', layoutStyle: 'minimal' } },
  { id: 'classic-coral', name: 'Coral Classic', layout: 'classic', desc: 'Full hero cover', thumb: 'linear-gradient(135deg, #be123c, #f43f5e)', settings: { primaryColor: '#be123c', accentColor: '#f43f5e', fontFamily: 'modern', layoutStyle: 'classic' } },
  { id: 'editorial-denim', name: 'Denim Editorial', layout: 'editorial', desc: 'Split cover, cards', thumb: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', settings: { primaryColor: '#1e3a5f', accentColor: '#3b82f6', fontFamily: 'clean', layoutStyle: 'editorial' } },
  { id: 'classic-espresso', name: 'Espresso', layout: 'classic', desc: 'Full hero cover', thumb: 'linear-gradient(135deg, #422006, #713f12)', settings: { primaryColor: '#422006', accentColor: '#713f12', fontFamily: 'serif', layoutStyle: 'classic' } },
  { id: 'brochure-terra', name: 'Terracotta Br.', layout: 'brochure', desc: 'Magazine style', thumb: 'linear-gradient(135deg, #7c2d12, #c2410c)', settings: { primaryColor: '#7c2d12', accentColor: '#c2410c', fontFamily: 'serif', layoutStyle: 'brochure' } },
  { id: 'minimal-modern', name: 'Modern Min.', layout: 'minimal', desc: 'Clean & elegant', thumb: 'linear-gradient(135deg, #334155, #64748b)', settings: { primaryColor: '#334155', accentColor: '#64748b', fontFamily: 'modern', layoutStyle: 'minimal' } },
];

export default function ItineraryEditor({ itin, agencyProfile, onUpdate, onEditItem }: Props) {
  const cv = itin.clientViewSettings || DEFAULT_CLIENT_VIEW_SETTINGS;
  const set = (key: keyof ClientViewSettings, val: any) => onUpdate({ ...cv, [key]: val });
  const applyTemplate = (tpl: typeof TEMPLATES[0]) => onUpdate({ ...cv, ...tpl.settings });
  const [tab, setTab] = useState<'templates' | 'design' | 'sections' | 'images'>('templates');
  const [enhancing, setEnhancing] = useState(false);

  const Tog = ({ label, on, flip }: { label: string; on: boolean; flip: () => void }) => (
    <div className="flex items-center justify-between py-1 cursor-pointer" onClick={flip}>
      <span className="text-[10px]" style={{ color: GHL.text }}>{label}</span>
      <div className="w-7 h-4 rounded-full relative flex-shrink-0" style={{ background: on ? GHL.accent : '#d1d5db' }}><div className="w-3 h-3 rounded-full bg-white absolute top-0.5 shadow-sm" style={{ left: on ? '14px' : '2px', transition: 'left 0.15s' }} /></div>
    </div>
  );

  const handleAIEnhance = async () => {
    setEnhancing(true);
    try {
      const res = await fetch('/api/ai-enhance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itinerary: { title: itin.title, destination: itin.destination, client: itin.client } }) });
      if (res.ok) { const data = await res.json(); if (data.suggestion) alert('AI: ' + data.suggestion); }
      else alert('AI Enhance not yet connected. Hospitality copy is auto-generated.');
    } catch { alert('AI Enhance not yet connected. Hospitality copy is auto-generated.'); }
    setEnhancing(false);
  };

  return (
    <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* LEFT: Live Preview using TemplateRenderer */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8599B4' }}>Live Preview</p>
            <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: '#f0f5ff', color: '#3b82f6' }}>{cv.layoutStyle} layout</span>
          </div>
          <button onClick={() => window.print()} className="text-white rounded-lg px-3 py-1 text-[9px] font-semibold" style={{ background: cv.primaryColor || '#093168' }}>Print / PDF</button>
        </div>
        <div className="overflow-y-auto rounded-xl border shadow-lg" style={{ maxHeight: 'calc(100vh - 240px)', borderColor: '#D0E2FA' }}>
          <TemplateRenderer itin={itin} agencyProfile={agencyProfile} />
        </div>
      </div>

      {/* RIGHT: Design Controls */}
      <div className="w-72 flex-shrink-0">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
          <div className="flex border-b" style={{ borderColor: GHL.border }}>
            {(['templates', 'design', 'sections', 'images'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 text-[9px] font-semibold capitalize" style={tab === t ? { color: GHL.accent, borderBottom: '2px solid ' + GHL.accent } : { color: GHL.muted }}>{t}</button>
            ))}
          </div>
          <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {tab === 'templates' && (
              <div className="space-y-2">
                <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Choose a Template (20 designs, 4 layouts)</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.id} onClick={() => applyTemplate(tpl)} className="rounded-lg overflow-hidden border-2 transition-all hover:scale-105 text-left" style={{ borderColor: cv.primaryColor === tpl.settings.primaryColor && cv.layoutStyle === tpl.settings.layoutStyle ? GHL.accent : 'transparent' }}>
                      <div className="h-8 relative" style={{ background: tpl.thumb }}>
                        <span className="absolute bottom-0.5 right-1 text-[5px] font-bold uppercase px-1 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}>{tpl.layout}</span>
                      </div>
                      <div className="px-1.5 py-0.5">
                        <p className="text-[7px] font-semibold" style={{ color: GHL.text }}>{tpl.name}</p>
                        <p className="text-[5px]" style={{ color: GHL.muted }}>{tpl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tab === 'design' && (
              <div className="space-y-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Layout Structure</p>
                  <select value={cv.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}>
                    <option value="classic">Classic - Full hero cover, inline timeline</option>
                    <option value="editorial">Editorial - Split cover, showcase cards before timeline</option>
                    <option value="brochure">Brochure - Magazine style, city images in day headers</option>
                    <option value="minimal">Minimal - Text-only cover, clean typography focus</option>
                  </select>
                </div>
                <div><p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Font</p><select value={cv.fontFamily} onChange={e => set('fontFamily', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="serif">Serif (Georgia)</option><option value="sans-serif">Sans Serif (Helvetica)</option><option value="modern">Modern (SF Pro)</option><option value="elegant">Elegant (Playfair)</option><option value="clean">Clean (DM Sans)</option><option value="mono">Monospace (JetBrains)</option></select></div>
                <div className="grid grid-cols-2 gap-2"><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Primary</p><input type="color" value={cv.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" style={{ borderColor: GHL.border }} /></div><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Accent</p><input type="color" value={cv.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" style={{ borderColor: GHL.border }} /></div></div>
                <div><Tog label="Show Logo" on={cv.showLogo} flip={() => set('showLogo', !cv.showLogo)} />{cv.showLogo && <select value={cv.logoPosition} onChange={e => set('logoPosition', e.target.value)} className="w-full px-2 py-1 border rounded text-[10px] mt-1" style={{ borderColor: GHL.border }}><option value="top-left">Left</option><option value="top-center">Center</option><option value="top-right">Right</option></select>}</div>
                <button onClick={handleAIEnhance} disabled={enhancing} className="w-full py-2 rounded-lg text-[10px] font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', opacity: enhancing ? 0.5 : 1 }}><Icon n="star" c="w-3 h-3" /> {enhancing ? 'Enhancing...' : 'AI Enhance Copy'}</button>
                <p className="text-[7px]" style={{ color: GHL.muted }}>Hospitality copy is auto-generated. Destination images are auto-selected based on your cities.</p>
              </div>
            )}
            {tab === 'sections' && (
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Show / Hide Sections</p>
                <Tog label="Trip Overview" on={cv.showOverview} flip={() => set('showOverview', !cv.showOverview)} />
                <Tog label="Travelers" on={cv.showPassengers} flip={() => set('showPassengers', !cv.showPassengers)} />
                <Tog label="Flights" on={cv.showFlights} flip={() => set('showFlights', !cv.showFlights)} />
                <Tog label="Hotels" on={cv.showHotels} flip={() => set('showHotels', !cv.showHotels)} />
                <Tog label="Transportation" on={cv.showTransfers} flip={() => set('showTransfers', !cv.showTransfers)} />
                <Tog label="Activities" on={cv.showActivities} flip={() => set('showActivities', !cv.showActivities)} />
                <Tog label="Insurance" on={cv.showInsurance} flip={() => set('showInsurance', !cv.showInsurance)} />
                <Tog label="Destination Info" on={cv.showDestinationInfo} flip={() => set('showDestinationInfo', !cv.showDestinationInfo)} />
                <Tog label="Davening" on={cv.showDavening} flip={() => set('showDavening', !cv.showDavening)} />
                <Tog label="Mikvah" on={cv.showMikvah} flip={() => set('showMikvah', !cv.showMikvah)} />
                <Tog label="Notes" on={cv.showNotes} flip={() => set('showNotes', !cv.showNotes)} />
                <Tog label="Contact Info" on={cv.showContactInfo} flip={() => set('showContactInfo', !cv.showContactInfo)} />
              </div>
            )}
            {tab === 'images' && (
              <div className="space-y-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Cover Image Override</p>
                  <input value={cv.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="Paste image URL (auto-selected if empty)" className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }} />
                  {cv.coverImage && <img src={cv.coverImage} alt="" className="w-full h-20 object-cover rounded mt-1" />}
                  <p className="text-[7px] mt-1" style={{ color: GHL.muted }}>Leave empty to auto-select based on destination. Images for hotels, destinations, and day headers are chosen automatically.</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Quick Backgrounds</p>
                  <div className="grid grid-cols-3 gap-1">
                    {['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600','https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600','https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600','https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600','https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600'].map((url, i) => (
                      <button key={i} onClick={() => set('coverImage', url)} className="h-12 rounded overflow-hidden border-2 hover:border-blue-400" style={{ borderColor: cv.coverImage === url ? GHL.accent : 'transparent' }}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
