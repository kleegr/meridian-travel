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

const SEARCH_IMAGES: Record<string, string[]> = {
  'beach': ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600','https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600','https://images.unsplash.com/photo-1509233725247-49e657c54213?w=600','https://images.unsplash.com/photo-1476673160081-cf065607f449?w=600'],
  'mountain': ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600','https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600','https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600','https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600'],
  'city': ['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600','https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600','https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600','https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600'],
  'hotel': ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600','https://images.unsplash.com/photo-1590490360182-c33d955e4819?w=600'],
  'travel': ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600','https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600','https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600'],
  'luxury': ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600','https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600','https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600'],
  'airport': ['https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600','https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600','https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=600','https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=600'],
  'food': ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600'],
};

function ImagePickerModal({ imageKey, currentUrl, onSelect, onClose }: { imageKey: string; currentUrl: string; onSelect: (url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [cat, setCat] = useState('travel');
  const imgs = SEARCH_IMAGES[cat] || SEARCH_IMAGES['travel'];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: GHL.border }}>
          <h3 className="text-sm font-bold" style={{ color: GHL.text }}>Change Image: {imageKey}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">X</button>
        </div>
        <div className="p-4 space-y-3">
          {currentUrl && <img src={currentUrl} alt="" className="w-full h-24 object-cover rounded" />}
          <div className="flex gap-2">
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste image URL..." className="flex-1 px-2 py-1.5 border rounded text-xs" style={{ borderColor: GHL.border }} />
            <button onClick={() => { if (url) { onSelect(url); onClose(); } }} className="px-3 py-1.5 text-xs font-semibold text-white rounded" style={{ background: GHL.accent }}>Apply</button>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">{Object.keys(SEARCH_IMAGES).map(c => (<button key={c} onClick={() => setCat(c)} className="px-2 py-0.5 rounded text-[9px] font-medium capitalize" style={cat === c ? { background: GHL.accent, color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}>{c}</button>))}</div>
          <div className="grid grid-cols-4 gap-1.5">{imgs.map((u, i) => (<button key={i} onClick={() => { onSelect(u); onClose(); }} className="h-16 rounded overflow-hidden border-2 hover:border-blue-400" style={{ borderColor: 'transparent' }}><img src={u} alt="" className="w-full h-full object-cover" /></button>))}</div>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryEditor({ itin, agencyProfile, onUpdate, onEditItem }: Props) {
  const cv = itin.clientViewSettings || DEFAULT_CLIENT_VIEW_SETTINGS;
  const set = (key: keyof ClientViewSettings, val: any) => onUpdate({ ...cv, [key]: val });
  const applyTemplate = (tpl: typeof TEMPLATES[0]) => onUpdate({ ...cv, ...tpl.settings });
  const [tab, setTab] = useState<'templates' | 'design' | 'sections' | 'images'>('templates');
  const [imagePicker, setImagePicker] = useState<{ key: string; url: string } | null>(null);

  // Image click handler - opens picker, does NOT open edit modal
  const handleImageClick = (imageKey: string, currentUrl: string) => {
    setImagePicker({ key: imageKey, url: currentUrl });
  };

  const handleImageSelect = (url: string) => {
    if (!imagePicker) return;
    if (imagePicker.key === 'cover') {
      set('coverImage', url);
    }
    setImagePicker(null);
  };

  const Tog = ({ label, on, flip }: { label: string; on: boolean; flip: () => void }) => (
    <div className="flex items-center justify-between py-1 cursor-pointer" onClick={flip}>
      <span className="text-[10px]" style={{ color: GHL.text }}>{label}</span>
      <div className="w-7 h-4 rounded-full relative flex-shrink-0" style={{ background: on ? GHL.accent : '#d1d5db' }}><div className="w-3 h-3 rounded-full bg-white absolute top-0.5 shadow-sm" style={{ left: on ? '14px' : '2px', transition: 'left 0.15s' }} /></div>
    </div>
  );

  return (
    <div>
      {/* SCREEN: Editor */}
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8599B4' }}>Live Preview</p>
              <span className="text-[8px] px-2 py-0.5 rounded" style={{ background: '#f0f5ff', color: '#3b82f6' }}>{cv.layoutStyle}</span>
              <span className="text-[8px]" style={{ color: '#94a3b8' }}>Click items to edit</span>
            </div>
            <button onClick={() => window.print()} className="text-white rounded-lg px-3 py-1 text-[9px] font-semibold no-print" style={{ background: cv.primaryColor || '#093168' }}>Print / PDF</button>
          </div>
          <div className="overflow-y-auto rounded-xl border shadow-lg" style={{ maxHeight: 'calc(100vh - 240px)', borderColor: '#D0E2FA' }}>
            <TemplateRenderer itin={itin} agencyProfile={agencyProfile} onImageClick={handleImageClick} onEditItem={onEditItem} />
          </div>
        </div>
        <div className="w-72 flex-shrink-0 no-print">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
            <div className="flex border-b" style={{ borderColor: GHL.border }}>{(['templates', 'design', 'sections', 'images'] as const).map(t => (<button key={t} onClick={() => setTab(t)} className="flex-1 py-2 text-[9px] font-semibold capitalize" style={tab === t ? { color: GHL.accent, borderBottom: '2px solid ' + GHL.accent } : { color: GHL.muted }}>{t}</button>))}</div>
            <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {tab === 'templates' && (<div className="space-y-2"><p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>20 Templates, 4 Layouts</p><div className="grid grid-cols-2 gap-1.5">{TEMPLATES.map(tpl => (<button key={tpl.id} onClick={() => applyTemplate(tpl)} className="rounded-lg overflow-hidden border-2 transition-all hover:scale-105 text-left" style={{ borderColor: cv.primaryColor === tpl.settings.primaryColor && cv.layoutStyle === tpl.settings.layoutStyle ? GHL.accent : 'transparent' }}><div className="h-8 relative" style={{ background: tpl.thumb }}><span className="absolute bottom-0.5 right-1 text-[5px] font-bold uppercase px-1 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}>{tpl.layout}</span></div><div className="px-1.5 py-0.5"><p className="text-[7px] font-semibold" style={{ color: GHL.text }}>{tpl.name}</p></div></button>))}</div></div>)}
              {tab === 'design' && (<div className="space-y-3"><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Layout</p><select value={cv.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="classic">Classic - Full hero cover</option><option value="editorial">Editorial - Split cover, cards</option><option value="brochure">Brochure - Magazine, airport images</option><option value="minimal">Minimal - Clean typography</option></select></div><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Font</p><select value={cv.fontFamily} onChange={e => set('fontFamily', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="serif">Serif</option><option value="sans-serif">Sans Serif</option><option value="modern">Modern</option><option value="elegant">Elegant</option><option value="clean">Clean</option><option value="mono">Mono</option></select></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Primary</p><input type="color" value={cv.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" /></div><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Accent</p><input type="color" value={cv.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" /></div></div><Tog label="Logo" on={cv.showLogo} flip={() => set('showLogo', !cv.showLogo)} /></div>)}
              {tab === 'sections' && (<div className="space-y-0.5"><Tog label="Overview" on={cv.showOverview} flip={() => set('showOverview', !cv.showOverview)} /><Tog label="Travelers" on={cv.showPassengers} flip={() => set('showPassengers', !cv.showPassengers)} /><Tog label="Flights" on={cv.showFlights} flip={() => set('showFlights', !cv.showFlights)} /><Tog label="Hotels" on={cv.showHotels} flip={() => set('showHotels', !cv.showHotels)} /><Tog label="Transport" on={cv.showTransfers} flip={() => set('showTransfers', !cv.showTransfers)} /><Tog label="Activities" on={cv.showActivities} flip={() => set('showActivities', !cv.showActivities)} /><Tog label="Insurance" on={cv.showInsurance} flip={() => set('showInsurance', !cv.showInsurance)} /><Tog label="Dest. Info" on={cv.showDestinationInfo} flip={() => set('showDestinationInfo', !cv.showDestinationInfo)} /><Tog label="Davening" on={cv.showDavening} flip={() => set('showDavening', !cv.showDavening)} /><Tog label="Mikvah" on={cv.showMikvah} flip={() => set('showMikvah', !cv.showMikvah)} /><Tog label="Notes" on={cv.showNotes} flip={() => set('showNotes', !cv.showNotes)} /><Tog label="Contact" on={cv.showContactInfo} flip={() => set('showContactInfo', !cv.showContactInfo)} /></div>)}
              {tab === 'images' && (<div className="space-y-3"><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Cover</p><input value={cv.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="URL or click cover in preview" className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }} />{cv.coverImage && <img src={cv.coverImage} alt="" className="w-full h-16 object-cover rounded mt-1" />}</div><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Quick</p><div className="grid grid-cols-3 gap-1">{['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600','https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600','https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600','https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600','https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600'].map((u, i) => (<button key={i} onClick={() => set('coverImage', u)} className="h-10 rounded overflow-hidden border-2 hover:border-blue-400" style={{ borderColor: cv.coverImage === u ? GHL.accent : 'transparent' }}><img src={u} alt="" className="w-full h-full object-cover" /></button>))}</div></div></div>)}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT: Full itinerary - height:0 on screen, visible in print */}
      <div className="print-itinerary-wrapper">
        <TemplateRenderer itin={itin} agencyProfile={agencyProfile} />
      </div>

      {/* Image Picker Modal */}
      {imagePicker && <ImagePickerModal imageKey={imagePicker.key} currentUrl={imagePicker.url} onSelect={handleImageSelect} onClose={() => setImagePicker(null)} />}
    </div>
  );
}
