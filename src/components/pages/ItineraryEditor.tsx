'use client';

import { useState } from 'react';
import { GHL } from '@/lib/constants';
import TemplateRenderer from './TemplateRenderer';
import { IMAGE_LIBRARY, searchImages } from '@/lib/image-library';
import type { Itinerary, AgencyProfile, ClientViewSettings } from '@/lib/types';
import { DEFAULT_CLIENT_VIEW_SETTINGS } from '@/lib/types';

interface Props { itin: Itinerary; agencyProfile: AgencyProfile; onUpdate: (settings: ClientViewSettings) => void; onEditItem?: (section: string, id: number) => void; }

const T = (id: string, name: string, layout: string, thumb: string, s: Partial<ClientViewSettings>) => ({ id, name, layout, thumb, settings: s });
const TEMPLATES = [
  T('cl-1','Classic Navy','classic','linear-gradient(135deg,#093168,#1a5298)',{primaryColor:'#093168',accentColor:'#1a5298',fontFamily:'serif',layoutStyle:'classic'}),
  T('cl-2','Elegant Gold','classic','linear-gradient(135deg,#78350f,#b45309)',{primaryColor:'#78350f',accentColor:'#b45309',fontFamily:'elegant',layoutStyle:'classic'}),
  T('cl-3','Modern Dark','classic','linear-gradient(135deg,#111827,#1f2937)',{primaryColor:'#111827',accentColor:'#374151',fontFamily:'sans-serif',layoutStyle:'classic'}),
  T('cl-4','Tropical','classic','linear-gradient(135deg,#065f46,#059669)',{primaryColor:'#065f46',accentColor:'#059669',fontFamily:'clean',layoutStyle:'classic'}),
  T('cl-5','Coral Classic','classic','linear-gradient(135deg,#be123c,#f43f5e)',{primaryColor:'#be123c',accentColor:'#f43f5e',fontFamily:'modern',layoutStyle:'classic'}),
  T('ed-1','Forest Editorial','editorial','linear-gradient(135deg,#14532d,#16a34a)',{primaryColor:'#14532d',accentColor:'#16a34a',fontFamily:'serif',layoutStyle:'editorial'}),
  T('ed-2','Royal Purple','editorial','linear-gradient(135deg,#4c1d95,#7c3aed)',{primaryColor:'#4c1d95',accentColor:'#7c3aed',fontFamily:'elegant',layoutStyle:'editorial'}),
  T('ed-3','Midnight Edit.','editorial','linear-gradient(135deg,#0f172a,#1e40af)',{primaryColor:'#0f172a',accentColor:'#1e40af',fontFamily:'sans-serif',layoutStyle:'editorial'}),
  T('ed-4','Charcoal Edit.','editorial','linear-gradient(135deg,#18181b,#3f3f46)',{primaryColor:'#18181b',accentColor:'#52525b',fontFamily:'mono',layoutStyle:'editorial'}),
  T('ed-5','Denim Editorial','editorial','linear-gradient(135deg,#1e3a5f,#3b82f6)',{primaryColor:'#1e3a5f',accentColor:'#3b82f6',fontFamily:'clean',layoutStyle:'editorial'}),
  T('br-1','Ocean Brochure','brochure','linear-gradient(135deg,#0c4a6e,#0284c7)',{primaryColor:'#0c4a6e',accentColor:'#0284c7',fontFamily:'clean',layoutStyle:'brochure'}),
  T('br-2','Sunset Brochure','brochure','linear-gradient(135deg,#9a3412,#ea580c)',{primaryColor:'#9a3412',accentColor:'#ea580c',fontFamily:'modern',layoutStyle:'brochure'}),
  T('br-3','Rose Brochure','brochure','linear-gradient(135deg,#881337,#e11d48)',{primaryColor:'#881337',accentColor:'#e11d48',fontFamily:'elegant',layoutStyle:'brochure'}),
  T('br-4','Burgundy Br.','brochure','linear-gradient(135deg,#4a0420,#831843)',{primaryColor:'#4a0420',accentColor:'#831843',fontFamily:'elegant',layoutStyle:'brochure'}),
  T('br-5','Terracotta Br.','brochure','linear-gradient(135deg,#7c2d12,#c2410c)',{primaryColor:'#7c2d12',accentColor:'#c2410c',fontFamily:'serif',layoutStyle:'brochure'}),
  T('mn-1','Minimal Slate','minimal','linear-gradient(135deg,#f8fafc,#e2e8f0)',{primaryColor:'#1e293b',accentColor:'#475569',fontFamily:'clean',layoutStyle:'minimal'}),
  T('mn-2','Arctic Clean','minimal','linear-gradient(135deg,#e0f2fe,#bae6fd)',{primaryColor:'#0c4a6e',accentColor:'#0ea5e9',fontFamily:'clean',layoutStyle:'minimal'}),
  T('mn-3','Sage Minimal','minimal','linear-gradient(135deg,#365314,#4d7c0f)',{primaryColor:'#365314',accentColor:'#4d7c0f',fontFamily:'serif',layoutStyle:'minimal'}),
  T('mn-4','Modern Min.','minimal','linear-gradient(135deg,#334155,#64748b)',{primaryColor:'#334155',accentColor:'#64748b',fontFamily:'modern',layoutStyle:'minimal'}),
  T('mn-5','Ivory Minimal','minimal','linear-gradient(135deg,#fefce8,#fef3c7)',{primaryColor:'#78350f',accentColor:'#d97706',fontFamily:'elegant',layoutStyle:'minimal'}),
  T('lx-1','Luxury Noir','luxury','linear-gradient(135deg,#0a0a0a,#1c1917)',{primaryColor:'#0a0a0a',accentColor:'#b45309',fontFamily:'elegant',layoutStyle:'luxury'}),
  T('lx-2','Champagne','luxury','linear-gradient(135deg,#44403c,#78716c)',{primaryColor:'#44403c',accentColor:'#d4a574',fontFamily:'elegant',layoutStyle:'luxury'}),
  T('lx-3','Sapphire Lux.','luxury','linear-gradient(135deg,#0c1445,#1e3a8a)',{primaryColor:'#0c1445',accentColor:'#3b82f6',fontFamily:'serif',layoutStyle:'luxury'}),
  T('lx-4','Emerald Lux.','luxury','linear-gradient(135deg,#052e16,#166534)',{primaryColor:'#052e16',accentColor:'#22c55e',fontFamily:'elegant',layoutStyle:'luxury'}),
  T('lx-5','Rose Gold Lux.','luxury','linear-gradient(135deg,#1c1917,#44403c)',{primaryColor:'#1c1917',accentColor:'#f43f5e',fontFamily:'elegant',layoutStyle:'luxury'}),
  T('gl-1','Azure Gallery','gallery','linear-gradient(135deg,#0369a1,#38bdf8)',{primaryColor:'#0369a1',accentColor:'#38bdf8',fontFamily:'clean',layoutStyle:'gallery'}),
  T('gl-2','Earth Gallery','gallery','linear-gradient(135deg,#713f12,#ca8a04)',{primaryColor:'#713f12',accentColor:'#ca8a04',fontFamily:'serif',layoutStyle:'gallery'}),
  T('gl-3','Violet Gallery','gallery','linear-gradient(135deg,#581c87,#a855f7)',{primaryColor:'#581c87',accentColor:'#a855f7',fontFamily:'modern',layoutStyle:'gallery'}),
  T('gl-4','Forest Gallery','gallery','linear-gradient(135deg,#14532d,#4ade80)',{primaryColor:'#14532d',accentColor:'#4ade80',fontFamily:'clean',layoutStyle:'gallery'}),
  T('gl-5','Sunset Gallery','gallery','linear-gradient(135deg,#7c2d12,#fb923c)',{primaryColor:'#7c2d12',accentColor:'#fb923c',fontFamily:'elegant',layoutStyle:'gallery'}),
  T('tl-1','Navy Timeline','timeline','linear-gradient(135deg,#1e3a5f,#2563eb)',{primaryColor:'#1e3a5f',accentColor:'#2563eb',fontFamily:'clean',layoutStyle:'timeline'}),
  T('tl-2','Slate Timeline','timeline','linear-gradient(135deg,#1e293b,#475569)',{primaryColor:'#1e293b',accentColor:'#475569',fontFamily:'modern',layoutStyle:'timeline'}),
  T('tl-3','Wine Timeline','timeline','linear-gradient(135deg,#4a0420,#be123c)',{primaryColor:'#4a0420',accentColor:'#be123c',fontFamily:'serif',layoutStyle:'timeline'}),
  T('tl-4','Teal Timeline','timeline','linear-gradient(135deg,#134e4a,#14b8a6)',{primaryColor:'#134e4a',accentColor:'#14b8a6',fontFamily:'clean',layoutStyle:'timeline'}),
  T('tl-5','Amber Timeline','timeline','linear-gradient(135deg,#78350f,#f59e0b)',{primaryColor:'#78350f',accentColor:'#f59e0b',fontFamily:'elegant',layoutStyle:'timeline'}),
  T('sp-1','Indigo Spotlight','spotlight','linear-gradient(135deg,#312e81,#6366f1)',{primaryColor:'#312e81',accentColor:'#6366f1',fontFamily:'sans-serif',layoutStyle:'spotlight'}),
  T('sp-2','Crimson Spot.','spotlight','linear-gradient(135deg,#7f1d1d,#dc2626)',{primaryColor:'#7f1d1d',accentColor:'#dc2626',fontFamily:'modern',layoutStyle:'spotlight'}),
  T('sp-3','Ocean Spotlight','spotlight','linear-gradient(135deg,#164e63,#06b6d4)',{primaryColor:'#164e63',accentColor:'#06b6d4',fontFamily:'clean',layoutStyle:'spotlight'}),
  T('sp-4','Plum Spotlight','spotlight','linear-gradient(135deg,#4a044e,#c026d3)',{primaryColor:'#4a044e',accentColor:'#c026d3',fontFamily:'elegant',layoutStyle:'spotlight'}),
  T('sp-5','Olive Spotlight','spotlight','linear-gradient(135deg,#3f6212,#84cc16)',{primaryColor:'#3f6212',accentColor:'#84cc16',fontFamily:'serif',layoutStyle:'spotlight'}),
];

function ImagePickerModal({ imageKey, currentUrl, onSelect, onClose }: { imageKey: string; currentUrl: string; onSelect: (url: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [cat, setCat] = useState('destinations');

  const handleSearch = () => {
    if (!query.trim()) return;
    setCat('');
    setResults(searchImages(query));
  };

  const imgs = cat ? IMAGE_LIBRARY[cat]?.images || [] : results.length > 0 ? results : IMAGE_LIBRARY['destinations'].images;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: GHL.border }}>
          <h3 className="text-sm font-bold" style={{ color: GHL.text }}>Choose Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2">X</button>
        </div>
        <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: GHL.border }}>
          <div className="flex gap-2">
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search... (hotel, airport, beach, rome, luxury)" className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: GHL.border }} />
            <button onClick={handleSearch} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Search</button>
          </div>
        </div>
        <div className="px-5 py-2 flex flex-wrap gap-1.5 border-b flex-shrink-0" style={{ borderColor: GHL.border }}>
          {Object.entries(IMAGE_LIBRARY).map(([k, { label }]) => (
            <button key={k} onClick={() => { setCat(k); setResults([]); }} className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={cat === k ? { background: GHL.accent, color: 'white' } : { background: '#f1f5f9', color: '#475569' }}>{label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2">
            {imgs.map((u, i) => (
              <button key={u + i} onClick={() => { onSelect(u.replace('w=400', 'w=1200').replace('h=300', 'h=900')); onClose(); }} className="aspect-[4/3] rounded-lg overflow-hidden border-2 hover:border-blue-500 hover:shadow-lg transition-all" style={{ borderColor: 'transparent' }}>
                <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryEditor({ itin, agencyProfile, onUpdate, onEditItem }: Props) {
  const cv = itin.clientViewSettings || DEFAULT_CLIENT_VIEW_SETTINGS;
  const set = (key: keyof ClientViewSettings, val: any) => onUpdate({ ...cv, [key]: val });
  const [tab, setTab] = useState<'templates' | 'design' | 'sections' | 'images'>('templates');
  const [imagePicker, setImagePicker] = useState<{ key: string; url: string } | null>(null);
  const handleImageClick = (k: string, u: string) => setImagePicker({ key: k, url: u });
  const handleImageSelect = (u: string) => { if (!imagePicker) return; if (imagePicker.key === 'cover') set('coverImage', u); setImagePicker(null); };
  const Tog = ({ label, on, flip }: { label: string; on: boolean; flip: () => void }) => (<div className="flex items-center justify-between py-1 cursor-pointer" onClick={flip}><span className="text-[10px]" style={{ color: GHL.text }}>{label}</span><div className="w-7 h-4 rounded-full relative flex-shrink-0" style={{ background: on ? GHL.accent : '#d1d5db' }}><div className="w-3 h-3 rounded-full bg-white absolute top-0.5 shadow-sm" style={{ left: on ? '14px' : '2px', transition: 'left 0.15s' }} /></div></div>);

  return (
    <div>
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3"><p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8599B4' }}>Preview</p><span className="text-[8px] px-2 py-0.5 rounded" style={{ background: '#f0f5ff', color: '#3b82f6' }}>{cv.layoutStyle}</span><span className="text-[8px]" style={{ color: '#94a3b8' }}>Click items to edit</span></div>
            <button onClick={() => window.print()} className="text-white rounded-lg px-3 py-1 text-[9px] font-semibold no-print" style={{ background: cv.primaryColor || '#093168' }}>Print / PDF</button>
          </div>
          <div className="overflow-y-auto rounded-xl border shadow-lg" style={{ maxHeight: 'calc(100vh - 240px)', borderColor: '#D0E2FA' }}>
            <TemplateRenderer itin={itin} agencyProfile={agencyProfile} onImageClick={handleImageClick} onEditItem={onEditItem} />
          </div>
        </div>
        <div className="w-72 flex-shrink-0 no-print">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
            <div className="flex border-b" style={{ borderColor: GHL.border }}>{(['templates','design','sections','images'] as const).map(t => (<button key={t} onClick={() => setTab(t)} className="flex-1 py-2 text-[9px] font-semibold capitalize" style={tab === t ? { color: GHL.accent, borderBottom: '2px solid ' + GHL.accent } : { color: GHL.muted }}>{t}</button>))}</div>
            <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {tab === 'templates' && (<div className="space-y-2"><p className="text-[8px] font-bold uppercase" style={{ color: GHL.muted }}>40 Templates, 8 Layouts</p><div className="grid grid-cols-2 gap-1.5">{TEMPLATES.map(tpl => (<button key={tpl.id} onClick={() => onUpdate({ ...cv, ...tpl.settings })} className="rounded-lg overflow-hidden border-2 hover:scale-105 text-left" style={{ borderColor: cv.layoutStyle === tpl.settings.layoutStyle && cv.primaryColor === tpl.settings.primaryColor ? GHL.accent : 'transparent' }}><div className="h-7 relative" style={{ background: tpl.thumb }}><span className="absolute bottom-0.5 right-0.5 text-[5px] font-bold uppercase px-1 rounded" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>{tpl.layout}</span></div><p className="text-[6px] font-semibold px-1 py-0.5 truncate" style={{ color: GHL.text }}>{tpl.name}</p></button>))}</div></div>)}
              {tab === 'design' && (<div className="space-y-3"><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Layout</p><select value={cv.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="classic">Classic</option><option value="editorial">Editorial</option><option value="brochure">Brochure</option><option value="minimal">Minimal</option><option value="luxury">Luxury</option><option value="gallery">Gallery</option><option value="timeline">Timeline</option><option value="spotlight">Spotlight</option></select></div><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Font</p><select value={cv.fontFamily} onChange={e => set('fontFamily', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="serif">Serif</option><option value="sans-serif">Sans Serif</option><option value="modern">Modern</option><option value="elegant">Elegant</option><option value="clean">Clean</option><option value="mono">Mono</option></select></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Primary</p><input type="color" value={cv.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" /></div><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Accent</p><input type="color" value={cv.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" /></div></div><Tog label="Logo" on={cv.showLogo} flip={() => set('showLogo', !cv.showLogo)} /></div>)}
              {tab === 'sections' && (<div className="space-y-0.5"><Tog label="Overview" on={cv.showOverview} flip={() => set('showOverview', !cv.showOverview)} /><Tog label="Travelers" on={cv.showPassengers} flip={() => set('showPassengers', !cv.showPassengers)} /><Tog label="Flights" on={cv.showFlights} flip={() => set('showFlights', !cv.showFlights)} /><Tog label="Hotels" on={cv.showHotels} flip={() => set('showHotels', !cv.showHotels)} /><Tog label="Transport" on={cv.showTransfers} flip={() => set('showTransfers', !cv.showTransfers)} /><Tog label="Activities" on={cv.showActivities} flip={() => set('showActivities', !cv.showActivities)} /><Tog label="Insurance" on={cv.showInsurance} flip={() => set('showInsurance', !cv.showInsurance)} /><Tog label="Dest. Info" on={cv.showDestinationInfo} flip={() => set('showDestinationInfo', !cv.showDestinationInfo)} /><Tog label="Davening" on={cv.showDavening} flip={() => set('showDavening', !cv.showDavening)} /><Tog label="Mikvah" on={cv.showMikvah} flip={() => set('showMikvah', !cv.showMikvah)} /><Tog label="Notes" on={cv.showNotes} flip={() => set('showNotes', !cv.showNotes)} /><Tog label="Contact" on={cv.showContactInfo} flip={() => set('showContactInfo', !cv.showContactInfo)} /></div>)}
              {tab === 'images' && (<div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Cover</p><input value={cv.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="Click cover in preview to change" className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }} />{cv.coverImage && <img src={cv.coverImage} alt="" className="w-full h-16 object-cover rounded mt-1" />}<p className="text-[7px] mt-1" style={{ color: GHL.muted }}>Click any image in the preview to search and replace it.</p></div>)}
            </div>
          </div>
        </div>
      </div>
      <div className="print-itinerary-wrapper"><TemplateRenderer itin={itin} agencyProfile={agencyProfile} /></div>
      {imagePicker && <ImagePickerModal imageKey={imagePicker.key} currentUrl={imagePicker.url} onSelect={handleImageSelect} onClose={() => setImagePicker(null)} />}
    </div>
  );
}
