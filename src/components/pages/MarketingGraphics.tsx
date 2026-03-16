'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { PackageTemplate, AgencyProfile } from '@/lib/types';

interface Props { packages: PackageTemplate[]; agencyProfile: AgencyProfile; }

interface CanvasElement {
  id: string; type: 'text' | 'image' | 'shape' | 'cta';
  x: number; y: number; w: number; h: number;
  text?: string; fontSize?: number; fontWeight?: string; color?: string; align?: string;
  src?: string; shape?: 'rect' | 'circle'; fill?: string; opacity?: number; radius?: number;
  zIndex: number;
}

const TEMPLATES = [
  { id: 'elegant', name: 'Elegant', colors: ['#1a1a2e', '#16213e'], accent: '#e2b714', text: '#ffffff' },
  { id: 'tropical', name: 'Tropical', colors: ['#0d9488', '#059669'], accent: '#fef3c7', text: '#ffffff' },
  { id: 'luxury', name: 'Luxury', colors: ['#1c1917', '#44403c'], accent: '#d4a53c', text: '#fafaf9' },
  { id: 'ocean', name: 'Ocean', colors: ['#0c4a6e', '#0369a1'], accent: '#38bdf8', text: '#ffffff' },
  { id: 'sunset', name: 'Sunset', colors: ['#9a3412', '#dc2626'], accent: '#fbbf24', text: '#ffffff' },
  { id: 'minimal', name: 'Light', colors: ['#f8fafc', '#e2e8f0'], accent: '#0f172a', text: '#0f172a' },
];

const SIZES = [
  { id: 'insta', name: 'Instagram', w: 1080, h: 1080 },
  { id: 'story', name: 'Story/WA', w: 1080, h: 1920 },
  { id: 'fb', name: 'Facebook', w: 1200, h: 630 },
  { id: 'email', name: 'Email', w: 600, h: 200 },
  { id: 'flyer', name: '8.5x11', w: 2550, h: 3300 },
];

// Ad layout presets (like the attached example)
const AD_LAYOUTS = [
  { id: 'hotel-deal', name: 'Hotel Deal', desc: 'Hero photo, price, package includes, footer' },
  { id: 'destination', name: 'Destination', desc: 'Scenic imagery with trip details' },
  { id: 'minimal-text', name: 'Minimal', desc: 'Clean text-focused design' },
  { id: 'custom', name: 'Custom', desc: 'Build from scratch' },
];

let eid = 1;
const nid = () => `el-${eid++}`;
const dot = String.fromCharCode(8226);

export default function MarketingGraphics({ packages, agencyProfile }: Props) {
  const [pkg, setPkg] = useState<PackageTemplate | null>(packages[0] || null);
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [sz, setSz] = useState(SIZES[1]); // Default to Story size like the example
  const [bgImg, setBgImg] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{id: string; sx: number; sy: number; ox: number; oy: number} | null>(null);
  const [resize, setResize] = useState<{id: string; sx: number; sy: number; ow: number; oh: number} | null>(null);
  const [imgSearch, setImgSearch] = useState('');
  const [imgResults, setImgResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [panel, setPanel] = useState<'layout' | 'style' | 'text' | 'images' | 'elements' | null>('layout');
  const [dlMenu, setDlMenu] = useState(false);
  const [activeLayout, setActiveLayout] = useState('hotel-deal');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [thumbImages, setThumbImages] = useState<string[]>([]);
  const [adTitle, setAdTitle] = useState('');
  const [adLocation, setAdLocation] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [adDates, setAdDates] = useState('');
  const [adIncludes, setAdIncludes] = useState<string[]>([]);
  const [refImage, setRefImage] = useState<string | null>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);

  // Preview scale
  const maxPw = 380;
  const scale = Math.min(maxPw / sz.w, 580 / sz.h);
  const pw = sz.w * scale;
  const ph = sz.h * scale;

  // Fill from package
  useEffect(() => {
    if (!pkg) return;
    setAdTitle(pkg.name || '');
    setAdLocation(pkg.destinations?.join(', ') || '');
    setAdPrice(pkg.price ? `$${pkg.price.toLocaleString()}` : '');
    setAdDates('');
    const inc: string[] = [];
    if (pkg.duration) inc.push(`${pkg.duration + 1} days / ${pkg.duration} nights`);
    if (pkg.flights?.length) inc.push('Airfare included');
    if (pkg.hotels?.length) inc.push(pkg.hotels[0]?.roomType || 'Hotel Room');
    if (inc.length === 0) {
      inc.push('Airfare for 2', `${(pkg.duration || 7) + 1} days / ${pkg.duration || 7} nights`, 'Hotel Room', 'Daily Breakfast');
    }
    setAdIncludes(inc);
  }, [pkg]);

  // Generate hotel-deal layout elements
  const generateHotelDealLayout = useCallback(() => {
    const els: CanvasElement[] = [];
    const isStory = sz.h > sz.w;
    const footerH = isStory ? ph * 0.1 : ph * 0.15;
    const heroH = isStory ? ph * 0.3 : ph * 0.4;
    const thumbH = isStory ? ph * 0.1 : 0;
    const contentStart = heroH + thumbH;
    const tc = '#1a2744';
    const ac = '#c8a45c';

    // Background - white body
    els.push({ id: nid(), type: 'shape', shape: 'rect', x: 0, y: 0, w: pw, h: ph, fill: '#ffffff', opacity: 1, radius: 0, zIndex: 0 });

    // Hero image placeholder
    if (heroImage) {
      els.push({ id: nid(), type: 'image', x: 4, y: 4, w: pw - 8, h: heroH - 4, src: heroImage, zIndex: 2 });
    } else {
      els.push({ id: nid(), type: 'shape', shape: 'rect', x: 4, y: 4, w: pw - 8, h: heroH - 4, fill: '#e0e7ef', opacity: 1, radius: 8, zIndex: 1 });
      els.push({ id: nid(), type: 'text', x: pw * 0.2, y: heroH * 0.4, w: pw * 0.6, h: 14, text: 'Upload hero image', fontSize: 11, fontWeight: '600', color: '#94a3b8', align: 'center', zIndex: 3 });
    }

    // Thumbnail images row
    if (isStory) {
      const tw = (pw - 12) / 3;
      for (let i = 0; i < 3; i++) {
        if (thumbImages[i]) {
          els.push({ id: nid(), type: 'image', x: 4 + i * (tw + 2), y: heroH, w: tw, h: thumbH - 4, src: thumbImages[i], zIndex: 2 });
        } else {
          els.push({ id: nid(), type: 'shape', shape: 'rect', x: 4 + i * (tw + 2), y: heroH, w: tw, h: thumbH - 4, fill: '#e0e7ef', opacity: 1, radius: 6, zIndex: 1 });
        }
      }
    }

    // Hotel name
    els.push({ id: nid(), type: 'text', x: pw * 0.06, y: contentStart + ph * 0.02, w: pw * 0.88, h: 26, text: adTitle || 'Hotel Name', fontSize: isStory ? 22 : 18, fontWeight: '700', color: tc, align: 'center', zIndex: 10 });

    // Location
    els.push({ id: nid(), type: 'text', x: pw * 0.1, y: contentStart + ph * (isStory ? 0.065 : 0.08), w: pw * 0.8, h: 14, text: adLocation || 'City, Country', fontSize: isStory ? 13 : 11, fontWeight: '500', color: '#5a7a9a', align: 'center', zIndex: 10 });

    // Divider line
    els.push({ id: nid(), type: 'shape', shape: 'rect', x: pw * 0.1, y: contentStart + ph * (isStory ? 0.1 : 0.12), w: pw * 0.8, h: 1, fill: '#e2e8f0', opacity: 1, radius: 0, zIndex: 5 });

    // Price box
    els.push({ id: nid(), type: 'shape', shape: 'rect', x: pw * 0.1, y: contentStart + ph * (isStory ? 0.12 : 0.15), w: pw * 0.8, h: isStory ? ph * 0.08 : ph * 0.12, fill: 'transparent', opacity: 1, radius: 4, zIndex: 5 });
    els.push({ id: nid(), type: 'text', x: pw * 0.12, y: contentStart + ph * (isStory ? 0.13 : 0.16), w: pw * 0.4, h: 22, text: adPrice || '$2,277', fontSize: isStory ? 26 : 20, fontWeight: '700', color: ac, align: 'left', zIndex: 10 });
    els.push({ id: nid(), type: 'text', x: pw * 0.5, y: contentStart + ph * (isStory ? 0.135 : 0.165), w: pw * 0.38, h: 10, text: adDates || 'SUN 03.22 - THU 03.26', fontSize: 8, fontWeight: '600', color: '#475569', align: 'left', zIndex: 10 });
    els.push({ id: nid(), type: 'text', x: pw * 0.5, y: contentStart + ph * (isStory ? 0.155 : 0.185), w: pw * 0.38, h: 8, text: 'INCL ALL TAXES + FEES', fontSize: 6, fontWeight: '600', color: '#94a3b8', align: 'left', zIndex: 10 });

    // Package includes section
    const incY = contentStart + ph * (isStory ? 0.22 : 0.3);
    els.push({ id: nid(), type: 'text', x: pw * 0.15, y: incY, w: pw * 0.7, h: 12, text: 'Package includes:', fontSize: 11, fontWeight: '500', color: '#334155', align: 'center', zIndex: 10 });

    adIncludes.forEach((inc, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ix = col === 0 ? pw * 0.08 : pw * 0.52;
      const iy = incY + ph * 0.04 + row * (isStory ? ph * 0.035 : ph * 0.06);
      els.push({ id: nid(), type: 'text', x: ix, y: iy, w: pw * 0.42, h: 11, text: `${dot} ${inc}`, fontSize: 10, fontWeight: '700', color: tc, align: 'left', zIndex: 10 });
    });

    // Footer bar
    els.push({ id: nid(), type: 'shape', shape: 'rect', x: 0, y: ph - footerH, w: pw, h: footerH, fill: tc, opacity: 1, radius: 0, zIndex: 8 });
    const contactParts = [agencyProfile.email, agencyProfile.phone].filter(Boolean);
    els.push({ id: nid(), type: 'text', x: pw * 0.05, y: ph - footerH + footerH * 0.25, w: pw * 0.9, h: 10, text: contactParts.join('    '), fontSize: 8, fontWeight: '500', color: '#ffffff', align: 'center', zIndex: 10 });
    els.push({ id: nid(), type: 'text', x: pw * 0.15, y: ph - footerH + footerH * 0.55, w: pw * 0.7, h: 14, text: agencyProfile.name.toUpperCase(), fontSize: 12, fontWeight: '800', color: ac, align: 'center', zIndex: 10 });

    setElements(els);
    setSelId(null);
  }, [pw, ph, sz, heroImage, thumbImages, adTitle, adLocation, adPrice, adDates, adIncludes, agencyProfile]);

  // Generate destination layout
  const generateDestLayout = useCallback(() => {
    const tc = bgImg ? '#ffffff' : tpl.text;
    const els: CanvasElement[] = [
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.04, w: pw * 0.5, h: 24, text: agencyProfile.name, fontSize: 12, fontWeight: '600', color: tc + 'cc', align: 'left', zIndex: 10 },
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.36, w: pw * 0.88, h: 14, text: (pkg?.destinations?.join(' / ') || '').toUpperCase(), fontSize: 10, fontWeight: '700', color: tpl.accent, align: 'left', zIndex: 10 },
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.42, w: pw * 0.88, h: 32, text: adTitle || pkg?.name || 'Your Trip', fontSize: 26, fontWeight: '800', color: tc, align: 'left', zIndex: 10 },
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.56, w: pw * 0.82, h: 14, text: (pkg?.description || '').slice(0, 120), fontSize: 10, fontWeight: '400', color: tc + 'aa', align: 'left', zIndex: 10 },
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.82, w: pw * 0.5, h: 18, text: pkg?.priceLabel || '', fontSize: 16, fontWeight: '800', color: tpl.accent, align: 'left', zIndex: 10 },
      { id: nid(), type: 'cta', x: pw * 0.6, y: ph * 0.8, w: pw * 0.32, h: ph * 0.065, text: 'Book Now', fontSize: 11, fontWeight: '700', color: '#000', fill: tpl.accent, radius: 20, zIndex: 10 },
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.93, w: pw * 0.88, h: 10, text: [agencyProfile.phone, agencyProfile.email].filter(Boolean).join('  |  '), fontSize: 8, fontWeight: '400', color: tc + '70', align: 'center', zIndex: 10 },
    ];
    setElements(els); setSelId(null);
  }, [pw, ph, bgImg, tpl, pkg, adTitle, agencyProfile]);

  // Regenerate when layout changes
  useEffect(() => {
    if (activeLayout === 'hotel-deal') generateHotelDealLayout();
    else if (activeLayout === 'destination') generateDestLayout();
    else if (activeLayout === 'custom') { setElements([]); }
  }, [activeLayout, generateHotelDealLayout, generateDestLayout]);

  const selEl = elements.find(e => e.id === selId);
  const updateEl = (id: string, upd: Partial<CanvasElement>) => setElements(p => p.map(e => e.id === id ? { ...e, ...upd } : e));
  const removeEl = (id: string) => { setElements(p => p.filter(e => e.id !== id)); setSelId(null); };
  const addEl = (el: CanvasElement) => { setElements(p => [...p, el]); setSelId(el.id); };

  const onMouseDown = (id: string, e: React.MouseEvent) => { e.stopPropagation(); const el = elements.find(x => x.id === id); if (!el) return; setSelId(id); setDrag({ id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y }); };
  const onResizeDown = (id: string, e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); const el = elements.find(x => x.id === id); if (!el) return; setResize({ id, sx: e.clientX, sy: e.clientY, ow: el.w, oh: el.h }); };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag) setElements(p => p.map(el => el.id === drag.id ? { ...el, x: drag.ox + e.clientX - drag.sx, y: drag.oy + e.clientY - drag.sy } : el));
    if (resize) setElements(p => p.map(el => el.id === resize.id ? { ...el, w: Math.max(20, resize.ow + e.clientX - resize.sx), h: Math.max(15, resize.oh + e.clientY - resize.sy) } : el));
  }, [drag, resize]);
  const onMouseUp = () => { setDrag(null); setResize(null); };

  const searchImages = async () => {
    if (!imgSearch.trim()) return; setSearching(true);
    try { const res = await fetch(`/api/image-search?q=${encodeURIComponent(imgSearch)}`); const data = await res.json(); setImgResults(data.images || []); } catch { setImgResults([]); }
    setSearching(false);
  };

  const addImageFromUrl = (url: string) => addEl({ id: nid(), type: 'image', x: pw * 0.1, y: ph * 0.1, w: pw * 0.4, h: pw * 0.3, src: url, zIndex: 5 });
  const uploadBg = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setBgImg(r.result as string); r.readAsDataURL(f); };
  const uploadOverlay = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => addEl({ id: nid(), type: 'image', x: pw * 0.1, y: ph * 0.1, w: pw * 0.4, h: pw * 0.3, src: r.result as string, zIndex: 5 }); r.readAsDataURL(f); };
  const uploadHero = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setHeroImage(r.result as string); }; r.readAsDataURL(f); };
  const uploadThumb = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setThumbImages(p => [...p.slice(0, 2), r.result as string].slice(0, 3)); }; r.readAsDataURL(f); };
  const uploadRef = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setRefImage(r.result as string); r.readAsDataURL(f); };

  const doDownload = async (fmt: 'png' | 'jpg' | 'webp') => {
    setDlMenu(false);
    const c = document.createElement('canvas'); c.width = sz.w; c.height = sz.h;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const s = 1 / scale;
    if (bgImg) { try { const img = await loadImg(bgImg); ctx.drawImage(img, 0, 0, sz.w, sz.h); const g = ctx.createLinearGradient(0, 0, 0, sz.h); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, sz.w, sz.h); } catch {} }
    else if (activeLayout === 'hotel-deal') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sz.w, sz.h); }
    else { const g = ctx.createLinearGradient(0, 0, sz.w, sz.h); g.addColorStop(0, tpl.colors[0]); g.addColorStop(1, tpl.colors[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, sz.w, sz.h); }
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      const ex = el.x * s, ey = el.y * s, ew = el.w * s, eh = el.h * s;
      if (el.type === 'image' && el.src) { try { const img = await loadImg(el.src); ctx.save(); if (el.radius) { roundR(ctx, ex, ey, ew, eh, (el.radius || 0) * s); ctx.clip(); } ctx.drawImage(img, ex, ey, ew, eh); ctx.restore(); } catch {} }
      if (el.type === 'shape') { ctx.globalAlpha = el.opacity ?? 1; ctx.fillStyle = el.fill || '#000'; if (el.fill === 'transparent') { ctx.strokeStyle = '#c8a45c'; ctx.lineWidth = 2 * s; roundR(ctx, ex, ey, ew, eh, (el.radius || 0) * s); ctx.stroke(); } else if (el.shape === 'circle') { ctx.beginPath(); ctx.arc(ex + ew / 2, ey + eh / 2, Math.min(ew, eh) / 2, 0, Math.PI * 2); ctx.fill(); } else { roundR(ctx, ex, ey, ew, eh, (el.radius || 0) * s); ctx.fill(); } ctx.globalAlpha = 1; }
      if ((el.type === 'text' || el.type === 'cta') && el.text) {
        if (el.type === 'cta' && el.fill) { ctx.fillStyle = el.fill; roundR(ctx, ex, ey, ew, eh, (el.radius || 0) * s); ctx.fill(); }
        ctx.fillStyle = el.color || '#fff'; ctx.font = `${el.fontWeight || '400'} ${Math.round((el.fontSize || 14) * s)}px 'DM Sans', sans-serif`; ctx.textAlign = (el.align as CanvasTextAlign) || 'left';
        const tx = el.align === 'center' ? ex + ew / 2 : el.align === 'right' ? ex + ew : ex;
        const ty = el.type === 'cta' ? ey + eh * 0.65 : ey + (el.fontSize || 14) * s * 0.85;
        if (bgImg && el.type === 'text') { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; }
        wrapDraw(ctx, el.text, tx, ty, ew, (el.fontSize || 14) * s * 1.3); ctx.shadowBlur = 0; ctx.textAlign = 'left';
      }
    }
    const link = document.createElement('a'); link.download = `${(adTitle || pkg?.name || 'ad').replace(/[^a-zA-Z0-9]/g, '_')}.${fmt}`;
    link.href = c.toDataURL(fmt === 'jpg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png', 0.95); link.click();
  };

  const ic = 'w-full px-2 py-1.5 border rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold" style={{ color: GHL.text }}>Marketing Studio</h2><p className="text-xs" style={{ color: GHL.muted }}>Create ads like a pro</p></div>
        <div className="flex gap-2">
          <div className="relative"><button onClick={() => setDlMenu(!dlMenu)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: GHL.accent }}>Download</button>{dlMenu && <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border p-1 z-30 min-w-[120px]" style={{ borderColor: GHL.border }}><button onClick={() => doDownload('png')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">PNG</button><button onClick={() => doDownload('jpg')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">JPG</button><button onClick={() => doDownload('webp')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">WebP</button></div>}</div>
        </div>
      </div>

      <div className="flex gap-3" style={{ minHeight: 620 }}>
        {/* LEFT SIDEBAR */}
        <div className="w-[260px] flex-shrink-0 space-y-2 overflow-y-auto" style={{ maxHeight: 700 }}>
          {/* Tool tabs */}
          <div className="bg-white rounded-xl border p-1 grid grid-cols-5 gap-0.5" style={{ borderColor: GHL.border }}>
            {[{ id: 'layout', icon: 'star', l: 'Layout' }, { id: 'style', icon: 'settings', l: 'Style' }, { id: 'text', icon: 'edit', l: 'Text' }, { id: 'images', icon: 'search', l: 'Photos' }, { id: 'elements', icon: 'globe', l: 'Shape' }].map(t => (
              <button key={t.id} onClick={() => setPanel(panel === t.id as any ? null : t.id as any)} className="py-1.5 rounded-lg text-center" style={{ background: panel === t.id ? GHL.accentLight : 'transparent', color: panel === t.id ? GHL.accent : GHL.muted }}>
                <Icon n={t.icon} c="w-3 h-3 mx-auto" /><p className="text-[6px] font-bold mt-0.5">{t.l}</p>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border overflow-y-auto" style={{ borderColor: GHL.border, maxHeight: 520 }}>
            {/* LAYOUT panel - choose ad type and fill content */}
            {panel === 'layout' && <div className="p-3 space-y-3">
              <div><p className="text-[9px] font-bold uppercase mb-1.5" style={{ color: GHL.muted }}>Ad Layout</p>
                <div className="grid grid-cols-2 gap-1">{AD_LAYOUTS.map(l => (<button key={l.id} onClick={() => setActiveLayout(l.id)} className="px-2 py-2 rounded-lg text-left border" style={{ borderColor: activeLayout === l.id ? GHL.accent : GHL.border, background: activeLayout === l.id ? GHL.accentLight : 'white' }}><p className="text-[9px] font-bold" style={{ color: activeLayout === l.id ? GHL.accent : GHL.text }}>{l.name}</p><p className="text-[7px]" style={{ color: GHL.muted }}>{l.desc}</p></button>))}</div>
              </div>
              <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Package</p>{packages.map(p => (<button key={p.id} onClick={() => setPkg(p)} className="w-full text-left px-2 py-1 rounded text-[10px]" style={pkg?.id === p.id ? { background: GHL.accentLight, color: GHL.accent, fontWeight: 600 } : { color: GHL.text }}>{p.name}</button>))}</div>

              {activeLayout === 'hotel-deal' && <>
                <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Hero Image</p><input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={uploadHero} />{heroImage ? <div className="flex items-center gap-2"><img src={heroImage} className="w-12 h-8 rounded object-cover" /><button onClick={() => heroRef.current?.click()} className="text-[8px] text-blue-500">Replace</button><button onClick={() => setHeroImage(null)} className="text-[8px] text-red-400">Remove</button></div> : <button onClick={() => heroRef.current?.click()} className="w-full py-2 rounded border text-[9px] text-center" style={{ borderColor: GHL.border, color: GHL.accent }}>Upload Hero Photo</button>}</div>
                <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Thumbnail Photos ({thumbImages.length}/3)</p><input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={uploadThumb} /><div className="flex gap-1 items-center">{thumbImages.map((t, i) => <img key={i} src={t} className="w-10 h-8 rounded object-cover" />)}{thumbImages.length < 3 && <button onClick={() => thumbRef.current?.click()} className="w-10 h-8 rounded border border-dashed flex items-center justify-center text-[10px]" style={{ borderColor: GHL.border, color: GHL.muted }}>+</button>}</div></div>
                <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Ad Content</p>
                  <input value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="Hotel / Package Name" className={ic} style={{ borderColor: GHL.border }} />
                  <input value={adLocation} onChange={e => setAdLocation(e.target.value)} placeholder="City, State" className={ic + ' mt-1'} style={{ borderColor: GHL.border }} />
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <input value={adPrice} onChange={e => setAdPrice(e.target.value)} placeholder="$2,277" className={ic} style={{ borderColor: GHL.border }} />
                    <input value={adDates} onChange={e => setAdDates(e.target.value)} placeholder="SUN 03.22 - THU 03.26" className={ic} style={{ borderColor: GHL.border }} />
                  </div>
                </div>
                <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Package Includes</p>
                  {adIncludes.map((inc, i) => <div key={i} className="flex gap-1 mb-0.5"><input value={inc} onChange={e => { const n = [...adIncludes]; n[i] = e.target.value; setAdIncludes(n); }} className="flex-1 px-1.5 py-1 border rounded text-[9px]" style={{ borderColor: GHL.border }} /><button onClick={() => setAdIncludes(p => p.filter((_, j) => j !== i))} className="text-[9px] text-red-400 px-1">x</button></div>)}
                  <button onClick={() => setAdIncludes(p => [...p, 'New item'])} className="text-[8px] text-blue-500 mt-0.5">+ Add item</button>
                </div>
              </>}

              {/* Reference image upload */}
              <div className="border-t pt-2" style={{ borderColor: GHL.border }}>
                <p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Reference Ad (optional)</p>
                <input ref={refRef} type="file" accept="image/*" className="hidden" onChange={uploadRef} />
                {refImage ? <div className="flex items-center gap-2"><img src={refImage} className="w-16 h-20 rounded object-cover border" style={{ borderColor: GHL.border }} /><div><p className="text-[8px]" style={{ color: GHL.muted }}>Reference uploaded</p><button onClick={() => refRef.current?.click()} className="text-[8px] text-blue-500">Replace</button><button onClick={() => setRefImage(null)} className="text-[8px] text-red-400 ml-1">Remove</button></div></div>
                : <button onClick={() => refRef.current?.click()} className="w-full py-2 rounded border-2 border-dashed text-[9px] text-center" style={{ borderColor: GHL.border, color: GHL.muted }}>Upload an example ad to match its style</button>}
              </div>
            </div>}

            {panel === 'style' && <div className="p-3 space-y-3">
              <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Size</p><div className="grid grid-cols-3 gap-1">{SIZES.map(s => (<button key={s.id} onClick={() => setSz(s)} className="px-1 py-1 rounded text-[8px] font-medium" style={sz.id === s.id ? { background: GHL.accentLight, color: GHL.accent } : { background: GHL.bg, color: GHL.muted }}>{s.name}</button>))}</div></div>
              {activeLayout !== 'hotel-deal' && <><div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Theme</p><div className="grid grid-cols-3 gap-1">{TEMPLATES.map(t => (<button key={t.id} onClick={() => setTpl(t)} className="rounded p-1" style={{ border: tpl.id === t.id ? `2px solid ${GHL.accent}` : '2px solid transparent' }}><div style={{ width: '100%', height: 14, borderRadius: 2, background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }} /><p className="text-[6px] mt-0.5" style={{ color: GHL.text }}>{t.name}</p></button>))}</div></div>
              <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Background Image</p><div className="flex gap-2">{bgImg ? <><img src={bgImg} className="w-8 h-8 rounded object-cover" /><button onClick={() => setBgImg(null)} className="text-[8px] text-red-400">Remove</button></> : <button onClick={() => bgRef.current?.click()} className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: GHL.border, color: GHL.accent }}>Upload BG</button>}<input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={uploadBg} /></div></div></>}
            </div>}

            {panel === 'text' && <div className="p-3 space-y-1.5">
              <p className="text-[9px] font-bold uppercase" style={{ color: GHL.muted }}>Add Text</p>
              {[{ l: 'Heading', s: 24, w: '800' }, { l: 'Subheading', s: 16, w: '600' }, { l: 'Body', s: 11, w: '400' }, { l: 'Small', s: 8, w: '400' }].map(t => (
                <button key={t.l} onClick={() => addEl({ id: nid(), type: 'text', x: pw * 0.1, y: ph * 0.3, w: pw * 0.8, h: t.s * 1.5, text: t.l, fontSize: t.s, fontWeight: t.w, color: activeLayout === 'hotel-deal' ? '#1a2744' : (bgImg ? '#fff' : tpl.text), align: 'left', zIndex: 10 })} className="w-full text-left px-2 py-1.5 rounded border hover:bg-gray-50" style={{ borderColor: GHL.border }}>
                  <span style={{ fontSize: Math.min(t.s, 14), fontWeight: t.w as any }}>{t.l}</span>
                </button>
              ))}
              <button onClick={() => addEl({ id: nid(), type: 'cta', x: pw * 0.2, y: ph * 0.6, w: pw * 0.6, h: 34, text: 'Book Now', fontSize: 12, fontWeight: '700', color: '#000', fill: '#c8a45c', radius: 20, zIndex: 10 })} className="w-full text-left px-2 py-1.5 rounded border hover:bg-gray-50" style={{ borderColor: GHL.border }}>
                <span className="text-[10px] font-bold px-3 py-0.5 rounded-full" style={{ background: '#c8a45c' }}>CTA Button</span>
              </button>
            </div>}

            {panel === 'images' && <div className="p-3 space-y-2">
              <p className="text-[9px] font-bold uppercase" style={{ color: GHL.muted }}>Photos</p>
              <button onClick={() => imgRef.current?.click()} className="w-full py-1.5 rounded border text-[10px] font-medium hover:bg-gray-50" style={{ borderColor: GHL.border }}>Upload Image</button>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={uploadOverlay} />
              <div className="flex gap-1"><input value={imgSearch} onChange={e => setImgSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchImages()} placeholder="Search photos..." className="flex-1 px-2 py-1 border rounded text-[10px]" style={{ borderColor: GHL.border }} /><button onClick={searchImages} disabled={searching} className="px-2 py-1 rounded text-[10px] font-bold text-white" style={{ background: GHL.accent }}>{searching ? '...' : 'Go'}</button></div>
              {imgResults.length > 0 && <div className="grid grid-cols-2 gap-1 max-h-[250px] overflow-y-auto">{imgResults.map((url, i) => (<button key={i} onClick={() => addImageFromUrl(url)} className="rounded overflow-hidden border aspect-video relative hover:opacity-80" style={{ borderColor: GHL.border }}><img src={url} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /><span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[7px] text-center py-0.5">+ Add</span></button>))}</div>}
            </div>}

            {panel === 'elements' && <div className="p-3 space-y-2">
              <p className="text-[9px] font-bold uppercase" style={{ color: GHL.muted }}>Shapes</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => addEl({ id: nid(), type: 'shape', shape: 'rect', x: pw * 0.2, y: ph * 0.2, w: 100, h: 70, fill: '#c8a45c', opacity: 0.3, radius: 8, zIndex: 2 })} className="aspect-square rounded border flex items-center justify-center hover:bg-gray-50" style={{ borderColor: GHL.border }}><div style={{ width: 28, height: 20, background: '#c8a45c', borderRadius: 4, opacity: 0.5 }} /></button>
                <button onClick={() => addEl({ id: nid(), type: 'shape', shape: 'circle', x: pw * 0.3, y: ph * 0.3, w: 70, h: 70, fill: '#c8a45c', opacity: 0.3, zIndex: 2 })} className="aspect-square rounded border flex items-center justify-center hover:bg-gray-50" style={{ borderColor: GHL.border }}><div style={{ width: 24, height: 24, background: '#c8a45c', borderRadius: '50%', opacity: 0.5 }} /></button>
                <button onClick={() => addEl({ id: nid(), type: 'shape', shape: 'rect', x: 0, y: ph * 0.75, w: pw, h: ph * 0.25, fill: '#1a2744', opacity: 1, radius: 0, zIndex: 1 })} className="aspect-square rounded border flex items-center justify-center hover:bg-gray-50 text-[7px]" style={{ borderColor: GHL.border, color: GHL.muted }}>Bar</button>
              </div>
            </div>}
          </div>

          {/* Selection toolbar */}
          {selEl && <div className="bg-white rounded-xl border p-2" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[8px] font-bold uppercase" style={{ color: GHL.muted }}>{selEl.type}</p>
              <div className="flex gap-0.5">
                <button onClick={() => updateEl(selEl.id, { zIndex: selEl.zIndex + 1 })} className="text-[7px] px-1 py-0.5 rounded border" style={{ borderColor: GHL.border }}>Fwd</button>
                <button onClick={() => updateEl(selEl.id, { zIndex: Math.max(0, selEl.zIndex - 1) })} className="text-[7px] px-1 py-0.5 rounded border" style={{ borderColor: GHL.border }}>Bck</button>
                <button onClick={() => addEl({ ...selEl, id: nid(), x: selEl.x + 10, y: selEl.y + 10 })} className="text-[7px] px-1 py-0.5 rounded border" style={{ borderColor: GHL.border }}>Dup</button>
                <button onClick={() => removeEl(selEl.id)} className="text-[7px] px-1 py-0.5 rounded border text-red-500">Del</button>
              </div>
            </div>
            {(selEl.type === 'text' || selEl.type === 'cta') && <>
              <input value={selEl.text || ''} onChange={e => updateEl(selEl.id, { text: e.target.value })} className="w-full px-1.5 py-1 border rounded text-[10px] mb-1" style={{ borderColor: GHL.border }} />
              <div className="flex gap-1 items-center flex-wrap">
                <select value={selEl.fontSize || 14} onChange={e => updateEl(selEl.id, { fontSize: Number(e.target.value) })} className="text-[9px] border rounded px-0.5 py-0.5 w-12" style={{ borderColor: GHL.border }}>{[6,7,8,9,10,11,12,14,16,18,20,22,24,28,32,40].map(s => <option key={s} value={s}>{s}</option>)}</select>
                <select value={selEl.fontWeight || '400'} onChange={e => updateEl(selEl.id, { fontWeight: e.target.value })} className="text-[9px] border rounded px-0.5 py-0.5" style={{ borderColor: GHL.border }}><option value="400">Reg</option><option value="500">Med</option><option value="600">Semi</option><option value="700">Bold</option><option value="800">XBold</option></select>
                <input type="color" value={selEl.color || '#fff'} onChange={e => updateEl(selEl.id, { color: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-0" />
                {['left', 'center', 'right'].map(a => <button key={a} onClick={() => updateEl(selEl.id, { align: a })} className="text-[7px] px-1 py-0.5 rounded" style={{ background: selEl.align === a ? GHL.accentLight : GHL.bg }}>{a[0].toUpperCase()}</button>)}
              </div>
              {selEl.type === 'cta' && <div className="flex gap-1 items-center mt-1"><span className="text-[8px]" style={{ color: GHL.muted }}>BG:</span><input type="color" value={selEl.fill || '#c8a45c'} onChange={e => updateEl(selEl.id, { fill: e.target.value })} className="w-4 h-4 rounded cursor-pointer border-0" /><span className="text-[8px]" style={{ color: GHL.muted }}>Round:</span><input type="range" min={0} max={30} value={selEl.radius || 0} onChange={e => updateEl(selEl.id, { radius: Number(e.target.value) })} className="w-14" /></div>}
            </>}
            {selEl.type === 'shape' && <div className="flex gap-1 items-center"><input type="color" value={selEl.fill || '#000'} onChange={e => updateEl(selEl.id, { fill: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-0" /><span className="text-[8px]" style={{ color: GHL.muted }}>Op:</span><input type="range" min={0} max={100} value={(selEl.opacity ?? 1) * 100} onChange={e => updateEl(selEl.id, { opacity: Number(e.target.value) / 100 })} className="w-14" /><span className="text-[8px]">{Math.round((selEl.opacity ?? 1) * 100)}%</span></div>}
          </div>}

          {/* Layers */}
          <div className="bg-white rounded-xl border p-2" style={{ borderColor: GHL.border }}>
            <p className="text-[8px] font-bold uppercase mb-1 px-1" style={{ color: GHL.muted }}>Layers ({elements.length})</p>
            <div className="space-y-0.5 max-h-[100px] overflow-y-auto">{[...elements].reverse().map(el => (
              <button key={el.id} onClick={() => setSelId(el.id)} className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] text-left" style={{ background: selId === el.id ? GHL.accentLight : 'transparent', color: selId === el.id ? GHL.accent : GHL.muted }}>
                <span className="truncate flex-1">{el.type === 'text' || el.type === 'cta' ? (el.text || '').slice(0, 18) : el.type}</span>
              </button>
            ))}</div>
          </div>
        </div>

        {/* CANVAS + reference side by side */}
        <div className="flex-1 flex gap-3">
          <div className="flex-1 bg-white rounded-xl border shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-center h-full p-4" style={{ background: '#dfe3e8', borderRadius: 12, minHeight: ph + 32 }}>
              <div onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onClick={() => setSelId(null)} style={{ width: pw, height: ph, background: activeLayout === 'hotel-deal' ? '#ffffff' : (bgImg ? `url(${bgImg}) center/cover` : `linear-gradient(135deg, ${tpl.colors[0]}, ${tpl.colors[1]})`), borderRadius: 12, overflow: 'hidden', position: 'relative', cursor: (drag || resize) ? 'grabbing' : 'default', userSelect: 'none', boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>
                {bgImg && activeLayout !== 'hotel-deal' && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.55))' }} />}
                {[...elements].sort((a, b) => a.zIndex - b.zIndex).map(el => {
                  const sel = selId === el.id;
                  const common = { position: 'absolute' as const, left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.zIndex, cursor: 'grab' as const };
                  const handle = sel ? <div onMouseDown={e => onResizeDown(el.id, e)} style={{ position: 'absolute', right: -4, bottom: -4, width: 10, height: 10, background: '#3b82f6', borderRadius: 2, cursor: 'nwse-resize' }} /> : null;
                  if (el.type === 'image') return <div key={el.id} onMouseDown={e => onMouseDown(el.id, e)} style={{ ...common, border: sel ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: 6, overflow: 'hidden' }}><img src={el.src} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />{handle}</div>;
                  if (el.type === 'shape') return <div key={el.id} onMouseDown={e => onMouseDown(el.id, e)} style={{ ...common, border: sel ? '2px solid #3b82f6' : '2px solid transparent' }}><div style={{ width: '100%', height: '100%', background: el.fill === 'transparent' ? 'transparent' : el.fill, opacity: el.opacity ?? 1, borderRadius: el.shape === 'circle' ? '50%' : (el.radius || 0), border: el.fill === 'transparent' ? '1.5px solid #c8a45c' : 'none' }} />{handle}</div>;
                  if (el.type === 'cta') return <div key={el.id} onMouseDown={e => onMouseDown(el.id, e)} style={{ ...common, border: sel ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: el.radius || 0 }}><div style={{ width: '100%', height: '100%', background: el.fill, borderRadius: el.radius || 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight as any }}>{el.text}</span></div>{handle}</div>;
                  return <div key={el.id} onMouseDown={e => onMouseDown(el.id, e)} style={{ ...common, height: 'auto', border: sel ? '1px dashed #3b82f6' : '1px dashed transparent', padding: 2, borderRadius: 3 }}><span style={{ color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight as any, textAlign: el.align as any, display: 'block', lineHeight: 1.3, wordWrap: 'break-word' }}>{el.text}</span>{handle}</div>;
                })}
              </div>
            </div>
          </div>
          {/* Reference image panel */}
          {refImage && <div className="w-[160px] flex-shrink-0">
            <div className="bg-white rounded-xl border p-2" style={{ borderColor: GHL.border }}>
              <p className="text-[8px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Reference</p>
              <img src={refImage} className="w-full rounded" />
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}

function loadImg(src: string): Promise<HTMLImageElement> { return new Promise((r, j) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => r(i); i.onerror = () => j(); i.src = src; }); }
function roundR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
function wrapDraw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) { const words = text.split(' '); let line = ''; for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lineH; line = w; } else line = t; } if (line) ctx.fillText(line, x, y); }
