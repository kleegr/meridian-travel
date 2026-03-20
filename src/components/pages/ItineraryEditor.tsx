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

const TEMPLATES: { id: string; name: string; thumb: string; layout: string; settings: Partial<ClientViewSettings> }[] = [
  { id: 'classic-navy', name: 'Classic Navy', layout: 'classic', thumb: 'linear-gradient(135deg, #093168, #1a5298)', settings: { primaryColor: '#093168', accentColor: '#1a5298', fontFamily: 'serif', layoutStyle: 'classic' } },
  { id: 'classic-gold', name: 'Elegant Gold', layout: 'classic', thumb: 'linear-gradient(135deg, #78350f, #b45309)', settings: { primaryColor: '#78350f', accentColor: '#b45309', fontFamily: 'elegant', layoutStyle: 'classic' } },
  { id: 'classic-dark', name: 'Modern Dark', layout: 'classic', thumb: 'linear-gradient(135deg, #111827, #1f2937)', settings: { primaryColor: '#111827', accentColor: '#374151', fontFamily: 'sans-serif', layoutStyle: 'classic' } },
  { id: 'classic-tropical', name: 'Tropical', layout: 'classic', thumb: 'linear-gradient(135deg, #065f46, #059669)', settings: { primaryColor: '#065f46', accentColor: '#059669', fontFamily: 'clean', layoutStyle: 'classic' } },
  { id: 'classic-coral', name: 'Coral Classic', layout: 'classic', thumb: 'linear-gradient(135deg, #be123c, #f43f5e)', settings: { primaryColor: '#be123c', accentColor: '#f43f5e', fontFamily: 'modern', layoutStyle: 'classic' } },
  { id: 'editorial-forest', name: 'Forest Editorial', layout: 'editorial', thumb: 'linear-gradient(135deg, #14532d, #16a34a)', settings: { primaryColor: '#14532d', accentColor: '#16a34a', fontFamily: 'serif', layoutStyle: 'editorial' } },
  { id: 'editorial-purple', name: 'Royal Purple', layout: 'editorial', thumb: 'linear-gradient(135deg, #4c1d95, #7c3aed)', settings: { primaryColor: '#4c1d95', accentColor: '#7c3aed', fontFamily: 'elegant', layoutStyle: 'editorial' } },
  { id: 'editorial-midnight', name: 'Midnight Edit.', layout: 'editorial', thumb: 'linear-gradient(135deg, #0f172a, #1e40af)', settings: { primaryColor: '#0f172a', accentColor: '#1e40af', fontFamily: 'sans-serif', layoutStyle: 'editorial' } },
  { id: 'editorial-charcoal', name: 'Charcoal Edit.', layout: 'editorial', thumb: 'linear-gradient(135deg, #18181b, #3f3f46)', settings: { primaryColor: '#18181b', accentColor: '#52525b', fontFamily: 'mono', layoutStyle: 'editorial' } },
  { id: 'editorial-denim', name: 'Denim Editorial', layout: 'editorial', thumb: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', settings: { primaryColor: '#1e3a5f', accentColor: '#3b82f6', fontFamily: 'clean', layoutStyle: 'editorial' } },
  { id: 'brochure-ocean', name: 'Ocean Brochure', layout: 'brochure', thumb: 'linear-gradient(135deg, #0c4a6e, #0284c7)', settings: { primaryColor: '#0c4a6e', accentColor: '#0284c7', fontFamily: 'clean', layoutStyle: 'brochure' } },
  { id: 'brochure-sunset', name: 'Sunset Brochure', layout: 'brochure', thumb: 'linear-gradient(135deg, #9a3412, #ea580c)', settings: { primaryColor: '#9a3412', accentColor: '#ea580c', fontFamily: 'modern', layoutStyle: 'brochure' } },
  { id: 'brochure-rose', name: 'Rose Brochure', layout: 'brochure', thumb: 'linear-gradient(135deg, #881337, #e11d48)', settings: { primaryColor: '#881337', accentColor: '#e11d48', fontFamily: 'elegant', layoutStyle: 'brochure' } },
  { id: 'brochure-burgundy', name: 'Burgundy Br.', layout: 'brochure', thumb: 'linear-gradient(135deg, #4a0420, #831843)', settings: { primaryColor: '#4a0420', accentColor: '#831843', fontFamily: 'elegant', layoutStyle: 'brochure' } },
  { id: 'brochure-terra', name: 'Terracotta Br.', layout: 'brochure', thumb: 'linear-gradient(135deg, #7c2d12, #c2410c)', settings: { primaryColor: '#7c2d12', accentColor: '#c2410c', fontFamily: 'serif', layoutStyle: 'brochure' } },
  { id: 'minimal-slate', name: 'Minimal Slate', layout: 'minimal', thumb: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', settings: { primaryColor: '#1e293b', accentColor: '#475569', fontFamily: 'clean', layoutStyle: 'minimal' } },
  { id: 'minimal-arctic', name: 'Arctic Clean', layout: 'minimal', thumb: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', settings: { primaryColor: '#0c4a6e', accentColor: '#0ea5e9', fontFamily: 'clean', layoutStyle: 'minimal' } },
  { id: 'minimal-sage', name: 'Sage Minimal', layout: 'minimal', thumb: 'linear-gradient(135deg, #365314, #4d7c0f)', settings: { primaryColor: '#365314', accentColor: '#4d7c0f', fontFamily: 'serif', layoutStyle: 'minimal' } },
  { id: 'minimal-modern', name: 'Modern Min.', layout: 'minimal', thumb: 'linear-gradient(135deg, #334155, #64748b)', settings: { primaryColor: '#334155', accentColor: '#64748b', fontFamily: 'modern', layoutStyle: 'minimal' } },
  { id: 'minimal-ivory', name: 'Ivory Minimal', layout: 'minimal', thumb: 'linear-gradient(135deg, #fefce8, #fef3c7)', settings: { primaryColor: '#78350f', accentColor: '#d97706', fontFamily: 'elegant', layoutStyle: 'minimal' } },
  { id: 'luxury-noir', name: 'Luxury Noir', layout: 'luxury', thumb: 'linear-gradient(135deg, #0a0a0a, #1c1917)', settings: { primaryColor: '#0a0a0a', accentColor: '#b45309', fontFamily: 'elegant', layoutStyle: 'luxury' } },
  { id: 'luxury-champagne', name: 'Champagne', layout: 'luxury', thumb: 'linear-gradient(135deg, #44403c, #78716c)', settings: { primaryColor: '#44403c', accentColor: '#d4a574', fontFamily: 'elegant', layoutStyle: 'luxury' } },
  { id: 'luxury-sapphire', name: 'Sapphire Lux.', layout: 'luxury', thumb: 'linear-gradient(135deg, #0c1445, #1e3a8a)', settings: { primaryColor: '#0c1445', accentColor: '#3b82f6', fontFamily: 'serif', layoutStyle: 'luxury' } },
  { id: 'luxury-emerald', name: 'Emerald Lux.', layout: 'luxury', thumb: 'linear-gradient(135deg, #052e16, #166534)', settings: { primaryColor: '#052e16', accentColor: '#22c55e', fontFamily: 'elegant', layoutStyle: 'luxury' } },
  { id: 'luxury-rose', name: 'Rose Gold Lux.', layout: 'luxury', thumb: 'linear-gradient(135deg, #1c1917, #44403c)', settings: { primaryColor: '#1c1917', accentColor: '#f43f5e', fontFamily: 'elegant', layoutStyle: 'luxury' } },
  { id: 'gallery-azure', name: 'Azure Gallery', layout: 'gallery', thumb: 'linear-gradient(135deg, #0369a1, #38bdf8)', settings: { primaryColor: '#0369a1', accentColor: '#38bdf8', fontFamily: 'clean', layoutStyle: 'gallery' } },
  { id: 'gallery-earth', name: 'Earth Gallery', layout: 'gallery', thumb: 'linear-gradient(135deg, #713f12, #ca8a04)', settings: { primaryColor: '#713f12', accentColor: '#ca8a04', fontFamily: 'serif', layoutStyle: 'gallery' } },
  { id: 'gallery-violet', name: 'Violet Gallery', layout: 'gallery', thumb: 'linear-gradient(135deg, #581c87, #a855f7)', settings: { primaryColor: '#581c87', accentColor: '#a855f7', fontFamily: 'modern', layoutStyle: 'gallery' } },
  { id: 'gallery-forest', name: 'Forest Gallery', layout: 'gallery', thumb: 'linear-gradient(135deg, #14532d, #4ade80)', settings: { primaryColor: '#14532d', accentColor: '#4ade80', fontFamily: 'clean', layoutStyle: 'gallery' } },
  { id: 'gallery-sunset', name: 'Sunset Gallery', layout: 'gallery', thumb: 'linear-gradient(135deg, #7c2d12, #fb923c)', settings: { primaryColor: '#7c2d12', accentColor: '#fb923c', fontFamily: 'elegant', layoutStyle: 'gallery' } },
  { id: 'timeline-navy', name: 'Navy Timeline', layout: 'timeline', thumb: 'linear-gradient(135deg, #1e3a5f, #2563eb)', settings: { primaryColor: '#1e3a5f', accentColor: '#2563eb', fontFamily: 'clean', layoutStyle: 'timeline' } },
  { id: 'timeline-slate', name: 'Slate Timeline', layout: 'timeline', thumb: 'linear-gradient(135deg, #1e293b, #475569)', settings: { primaryColor: '#1e293b', accentColor: '#475569', fontFamily: 'modern', layoutStyle: 'timeline' } },
  { id: 'timeline-wine', name: 'Wine Timeline', layout: 'timeline', thumb: 'linear-gradient(135deg, #4a0420, #be123c)', settings: { primaryColor: '#4a0420', accentColor: '#be123c', fontFamily: 'serif', layoutStyle: 'timeline' } },
  { id: 'timeline-teal', name: 'Teal Timeline', layout: 'timeline', thumb: 'linear-gradient(135deg, #134e4a, #14b8a6)', settings: { primaryColor: '#134e4a', accentColor: '#14b8a6', fontFamily: 'clean', layoutStyle: 'timeline' } },
  { id: 'timeline-amber', name: 'Amber Timeline', layout: 'timeline', thumb: 'linear-gradient(135deg, #78350f, #f59e0b)', settings: { primaryColor: '#78350f', accentColor: '#f59e0b', fontFamily: 'elegant', layoutStyle: 'timeline' } },
  { id: 'spotlight-indigo', name: 'Indigo Spotlight', layout: 'spotlight', thumb: 'linear-gradient(135deg, #312e81, #6366f1)', settings: { primaryColor: '#312e81', accentColor: '#6366f1', fontFamily: 'sans-serif', layoutStyle: 'spotlight' } },
  { id: 'spotlight-crimson', name: 'Crimson Spot.', layout: 'spotlight', thumb: 'linear-gradient(135deg, #7f1d1d, #dc2626)', settings: { primaryColor: '#7f1d1d', accentColor: '#dc2626', fontFamily: 'modern', layoutStyle: 'spotlight' } },
  { id: 'spotlight-ocean', name: 'Ocean Spotlight', layout: 'spotlight', thumb: 'linear-gradient(135deg, #164e63, #06b6d4)', settings: { primaryColor: '#164e63', accentColor: '#06b6d4', fontFamily: 'clean', layoutStyle: 'spotlight' } },
  { id: 'spotlight-plum', name: 'Plum Spotlight', layout: 'spotlight', thumb: 'linear-gradient(135deg, #4a044e, #c026d3)', settings: { primaryColor: '#4a044e', accentColor: '#c026d3', fontFamily: 'elegant', layoutStyle: 'spotlight' } },
  { id: 'spotlight-olive', name: 'Olive Spotlight', layout: 'spotlight', thumb: 'linear-gradient(135deg, #3f6212, #84cc16)', settings: { primaryColor: '#3f6212', accentColor: '#84cc16', fontFamily: 'serif', layoutStyle: 'spotlight' } },
];

// IMAGE SEARCH: Uses Unsplash source URLs (no API key needed)
// Type a keyword -> get images instantly from Unsplash
function ImagePickerModal({ imageKey, currentUrl, onSelect, onClose }: { imageKey: string; currentUrl: string; onSelect: (url: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  // Curated images by category - these are guaranteed to work
  const categories: Record<string, { label: string; images: string[] }> = {
    destinations: { label: 'Destinations', images: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400','https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400','https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400','https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400','https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400','https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400','https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    ]},
    hotels: { label: 'Hotels & Resorts', images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400','https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400','https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400','https://images.unsplash.com/photo-1590490360182-c33d955e4819?w=400',
    ]},
    airports: { label: 'Airports & Aviation', images: [
      'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400','https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400','https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=400','https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=400',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400','https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=400','https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=400','https://images.unsplash.com/photo-1544016768-982d1554f0b9?w=400',
    ]},
    beach: { label: 'Beach & Ocean', images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400','https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400','https://images.unsplash.com/photo-1509233725247-49e657c54213?w=400','https://images.unsplash.com/photo-1476673160081-cf065607f449?w=400',
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400','https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400','https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=400','https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400',
    ]},
    mountains: { label: 'Mountains & Nature', images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400','https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400','https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400','https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400','https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400','https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=400','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    ]},
    cities: { label: 'Cities & Skylines', images: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400','https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400','https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400','https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400',
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400','https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400','https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=400','https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
    ]},
    luxury: { label: 'Luxury & Premium', images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400','https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400','https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400','https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400','https://images.unsplash.com/photo-1590490360182-c33d955e4819?w=400','https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400',
    ]},
    food: { label: 'Food & Dining', images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400','https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400','https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400','https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    ]},
    travel: { label: 'Travel & Adventure', images: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400','https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400','https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400',
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400','https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400','https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400',
    ]},
    attractions: { label: 'Attractions & Tours', images: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400','https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400','https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400','https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400',
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400','https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400','https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400','https://images.unsplash.com/photo-1548786811-dd6e453ccca7?w=400',
    ]},
  };

  // Search using Unsplash source URL (no API key needed)
  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    setActiveCategory('');
    // Generate 8 Unsplash source URLs for the search query
    // These use Unsplash's free source endpoint
    const results: string[] = [];
    for (let i = 0; i < 8; i++) {
      results.push(`https://source.unsplash.com/600x400/?${encodeURIComponent(query.trim())}&sig=${i}`);
    }
    setSearchResults(results);
    setSearching(false);
  };

  const showImages = activeCategory ? categories[activeCategory]?.images || [] : searchResults;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: GHL.border }}>
          <h3 className="text-sm font-bold" style={{ color: GHL.text }}>Choose Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2">X</button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: GHL.border }}>
          <div className="flex gap-2">
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search images... (e.g. rome hotel, airport terminal, beach sunset)" className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: GHL.border }} />
            <button onClick={handleSearch} disabled={searching} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>{searching ? '...' : 'Search'}</button>
          </div>
        </div>

        {/* Category buttons */}
        <div className="px-5 py-2 flex flex-wrap gap-1.5 border-b flex-shrink-0" style={{ borderColor: GHL.border }}>
          {Object.entries(categories).map(([key, { label }]) => (
            <button key={key} onClick={() => { setActiveCategory(key); setSearchResults([]); }} className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={activeCategory === key ? { background: GHL.accent, color: 'white' } : { background: '#f1f5f9', color: '#475569' }}>{label}</button>
          ))}
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {showImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {showImages.map((url, i) => (
                <button key={url + i} onClick={() => { onSelect(url.replace('w=400', 'w=1200')); onClose(); }} className="aspect-[4/3] rounded-lg overflow-hidden border-2 hover:border-blue-500 hover:shadow-lg transition-all" style={{ borderColor: 'transparent' }}>
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm font-semibold" style={{ color: GHL.muted }}>Search for images or pick a category above</p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Try: "paris", "luxury hotel", "airport", "colosseum"</p>
            </div>
          )}
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

  const handleImageClick = (imageKey: string, currentUrl: string) => setImagePicker({ key: imageKey, url: currentUrl });
  const handleImageSelect = (url: string) => { if (!imagePicker) return; if (imagePicker.key === 'cover') set('coverImage', url); setImagePicker(null); };

  const Tog = ({ label, on, flip }: { label: string; on: boolean; flip: () => void }) => (
    <div className="flex items-center justify-between py-1 cursor-pointer" onClick={flip}>
      <span className="text-[10px]" style={{ color: GHL.text }}>{label}</span>
      <div className="w-7 h-4 rounded-full relative flex-shrink-0" style={{ background: on ? GHL.accent : '#d1d5db' }}><div className="w-3 h-3 rounded-full bg-white absolute top-0.5 shadow-sm" style={{ left: on ? '14px' : '2px', transition: 'left 0.15s' }} /></div>
    </div>
  );

  return (
    <div>
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
              {tab === 'templates' && (<div className="space-y-2"><p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>40 Templates, 8 Layouts</p><div className="grid grid-cols-2 gap-1.5">{TEMPLATES.map(tpl => (<button key={tpl.id} onClick={() => applyTemplate(tpl)} className="rounded-lg overflow-hidden border-2 transition-all hover:scale-105 text-left" style={{ borderColor: cv.primaryColor === tpl.settings.primaryColor && cv.layoutStyle === tpl.settings.layoutStyle ? GHL.accent : 'transparent' }}><div className="h-8 relative" style={{ background: tpl.thumb }}><span className="absolute bottom-0.5 right-1 text-[5px] font-bold uppercase px-1 rounded" style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}>{tpl.layout}</span></div><div className="px-1.5 py-0.5"><p className="text-[7px] font-semibold" style={{ color: GHL.text }}>{tpl.name}</p></div></button>))}</div></div>)}
              {tab === 'design' && (<div className="space-y-3"><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Layout</p><select value={cv.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="classic">Classic</option><option value="editorial">Editorial</option><option value="brochure">Brochure</option><option value="minimal">Minimal</option><option value="luxury">Luxury</option><option value="gallery">Gallery</option><option value="timeline">Timeline</option><option value="spotlight">Spotlight</option></select></div><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Font</p><select value={cv.fontFamily} onChange={e => set('fontFamily', e.target.value)} className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }}><option value="serif">Serif</option><option value="sans-serif">Sans Serif</option><option value="modern">Modern</option><option value="elegant">Elegant</option><option value="clean">Clean</option><option value="mono">Mono</option></select></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Primary</p><input type="color" value={cv.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" /></div><div><p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: GHL.muted }}>Accent</p><input type="color" value={cv.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-full h-8 rounded border cursor-pointer" /></div></div><Tog label="Logo" on={cv.showLogo} flip={() => set('showLogo', !cv.showLogo)} /></div>)}
              {tab === 'sections' && (<div className="space-y-0.5"><Tog label="Overview" on={cv.showOverview} flip={() => set('showOverview', !cv.showOverview)} /><Tog label="Travelers" on={cv.showPassengers} flip={() => set('showPassengers', !cv.showPassengers)} /><Tog label="Flights" on={cv.showFlights} flip={() => set('showFlights', !cv.showFlights)} /><Tog label="Hotels" on={cv.showHotels} flip={() => set('showHotels', !cv.showHotels)} /><Tog label="Transport" on={cv.showTransfers} flip={() => set('showTransfers', !cv.showTransfers)} /><Tog label="Activities" on={cv.showActivities} flip={() => set('showActivities', !cv.showActivities)} /><Tog label="Insurance" on={cv.showInsurance} flip={() => set('showInsurance', !cv.showInsurance)} /><Tog label="Dest. Info" on={cv.showDestinationInfo} flip={() => set('showDestinationInfo', !cv.showDestinationInfo)} /><Tog label="Davening" on={cv.showDavening} flip={() => set('showDavening', !cv.showDavening)} /><Tog label="Mikvah" on={cv.showMikvah} flip={() => set('showMikvah', !cv.showMikvah)} /><Tog label="Notes" on={cv.showNotes} flip={() => set('showNotes', !cv.showNotes)} /><Tog label="Contact" on={cv.showContactInfo} flip={() => set('showContactInfo', !cv.showContactInfo)} /></div>)}
              {tab === 'images' && (<div className="space-y-3"><div><p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Cover</p><input value={cv.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="Click cover in preview to change" className="w-full px-2 py-1.5 border rounded text-[10px]" style={{ borderColor: GHL.border }} />{cv.coverImage && <img src={cv.coverImage} alt="" className="w-full h-16 object-cover rounded mt-1" />}<p className="text-[7px] mt-1" style={{ color: GHL.muted }}>Click any image in the preview to open the image search picker.</p></div></div>)}
            </div>
          </div>
        </div>
      </div>
      <div className="print-itinerary-wrapper"><TemplateRenderer itin={itin} agencyProfile={agencyProfile} /></div>
      {imagePicker && <ImagePickerModal imageKey={imagePicker.key} currentUrl={imagePicker.url} onSelect={handleImageSelect} onClose={() => setImagePicker(null)} />}
    </div>
  );
}
