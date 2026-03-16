'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { PackageTemplate, AgencyProfile } from '@/lib/types';

interface Props { packages: PackageTemplate[]; agencyProfile: AgencyProfile; }

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'cta';
  x: number; y: number; w: number; h: number;
  text?: string; fontSize?: number; fontWeight?: string; color?: string; align?: string;
  src?: string;
  shape?: 'rect' | 'circle'; fill?: string; opacity?: number; radius?: number;
  zIndex: number;
}

const TEMPLATES = [
  { id: 'elegant', name: 'Elegant', colors: ['#1a1a2e', '#16213e'], accent: '#e2b714', text: '#ffffff' },
  { id: 'tropical', name: 'Tropical', colors: ['#0d9488', '#059669'], accent: '#fef3c7', text: '#ffffff' },
  { id: 'luxury', name: 'Luxury', colors: ['#1c1917', '#44403c'], accent: '#d4a53c', text: '#fafaf9' },
  { id: 'ocean', name: 'Ocean', colors: ['#0c4a6e', '#0369a1'], accent: '#38bdf8', text: '#ffffff' },
  { id: 'sunset', name: 'Sunset', colors: ['#9a3412', '#dc2626'], accent: '#fbbf24', text: '#ffffff' },
  { id: 'minimal', name: 'Minimal', colors: ['#f8fafc', '#e2e8f0'], accent: '#0f172a', text: '#0f172a' },
];

const SIZES = [
  { id: 'insta', name: 'Instagram', w: 1080, h: 1080 },
  { id: 'story', name: 'Story/WA', w: 1080, h: 1920 },
  { id: 'fb', name: 'Facebook', w: 1200, h: 630 },
  { id: 'email', name: 'Email', w: 600, h: 200 },
  { id: 'flyer', name: '8.5x11', w: 2550, h: 3300 },
];

let eid = 1;
const nid = () => `el-${eid++}`;

export default function MarketingGraphics({ packages, agencyProfile }: Props) {
  const [pkg, setPkg] = useState<PackageTemplate | null>(packages[0] || null);
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [sz, setSz] = useState(SIZES[0]);
  const [bgImg, setBgImg] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{id: string; sx: number; sy: number; ox: number; oy: number} | null>(null);
  const [resize, setResize] = useState<{id: string; sx: number; sy: number; ow: number; oh: number} | null>(null);
  const [imgSearch, setImgSearch] = useState('');
  const [imgResults, setImgResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [panel, setPanel] = useState<'elements' | 'images' | 'text' | 'style' | null>('style');
  const [dlMenu, setDlMenu] = useState(false);
  const [editingText, setEditingText] = useState<string | null>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  // Scale for preview
  const maxPw = 420;
  const scale = Math.min(maxPw / sz.w, 340 / sz.h);
  const pw = sz.w * scale;
  const ph = sz.h * scale;

  // Initialize with package content
  useEffect(() => {
    if (!pkg) return;
    const title = pkg.name || 'Your Dream Vacation';
    const sub = pkg.description || '';
    const dests = pkg.destinations?.join(' / ') || '';
    const price = pkg.priceLabel || '';
    const els: CanvasElement[] = [
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.05, w: pw * 0.5, h: 24, text: agencyProfile.name, fontSize: 11, fontWeight: '600', color: tpl.text + 'cc', align: 'left', zIndex: 10 },
      ...(dests ? [{ id: nid(), type: 'text' as const, x: pw * 0.06, y: ph * 0.38, w: pw * 0.88, h: 12, text: dests.toUpperCase(), fontSize: 9, fontWeight: '700', color: tpl.accent, align: 'left', zIndex: 10 }] : []),
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.44, w: pw * 0.88, h: 28, text: title, fontSize: 22, fontWeight: '800', color: bgImg ? '#ffffff' : tpl.text, align: 'left', zIndex: 10 },
      ...(sub ? [{ id: nid(), type: 'text' as const, x: pw * 0.06, y: ph * 0.58, w: pw * 0.8, h: 12, text: sub.length > 120 ? sub.slice(0, 120) + '...' : sub, fontSize: 9, fontWeight: '400', color: (bgImg ? '#ffffff' : tpl.text) + 'aa', align: 'left', zIndex: 10 }] : []),
      ...(price ? [{ id: nid(), type: 'text' as const, x: pw * 0.06, y: ph * 0.82, w: pw * 0.5, h: 16, text: price, fontSize: 14, fontWeight: '800', color: tpl.accent, align: 'left', zIndex: 10 }] : []),
      { id: nid(), type: 'cta', x: pw * 0.62, y: ph * 0.8, w: pw * 0.3, h: ph * 0.06, text: 'Book Now', fontSize: 10, fontWeight: '700', color: '#000000', fill: tpl.accent, radius: 20, zIndex: 10 },
      { id: nid(), type: 'text', x: pw * 0.06, y: ph * 0.92, w: pw * 0.88, h: 10, text: [agencyProfile.phone, agencyProfile.email].filter(Boolean).join('  |  '), fontSize: 7, fontWeight: '400', color: (bgImg ? '#ffffff' : tpl.text) + '80', align: 'center', zIndex: 10 },
    ];
    setElements(els);
    setSelId(null);
  }, [pkg, tpl, sz, bgImg]);

  const selEl = elements.find(e => e.id === selId);

  const updateEl = (id: string, upd: Partial<CanvasElement>) => setElements(p => p.map(e => e.id === id ? { ...e, ...upd } : e));
  const removeEl = (id: string) => { setElements(p => p.filter(e => e.id !== id)); setSelId(null); };
  const addEl = (el: CanvasElement) => { setElements(p => [...p, el]); setSelId(el.id); };

  // Drag
  const onMouseDown = (id: string, e: React.MouseEvent) => { e.stopPropagation(); const el = elements.find(x => x.id === id); if (!el) return; setSelId(id); setDrag({ id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y }); };
  const onResizeDown = (id: string, e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); const el = elements.find(x => x.id === id); if (!el) return; setResize({ id, sx: e.clientX, sy: e.clientY, ow: el.w, oh: el.h }); };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag) setElements(p => p.map(el => el.id === drag.id ? { ...el, x: drag.ox + e.clientX - drag.sx, y: drag.oy + e.clientY - drag.sy } : el));
    if (resize) setElements(p => p.map(el => el.id === resize.id ? { ...el, w: Math.max(20, resize.ow + e.clientX - resize.sx), h: Math.max(15, resize.oh + e.clientY - resize.sy) } : el));
  }, [drag, resize]);
  const onMouseUp = () => { setDrag(null); setResize(null); };

  // Image search
  const searchImages = async () => {
    if (!imgSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(imgSearch)}`);
      const data = await res.json();
      setImgResults(data.images || []);
    } catch { setImgResults([]); }
    setSearching(false);
  };

  const addImageFromUrl = (url: string) => addEl({ id: nid(), type: 'image', x: pw * 0.1, y: ph * 0.1, w: pw * 0.35, h: pw * 0.25, src: url, zIndex: 5 });
  const uploadBg = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setBgImg(r.result as string); r.readAsDataURL(f); };
  const uploadOverlay = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => addEl({ id: nid(), type: 'image', x: pw * 0.1, y: ph * 0.1, w: pw * 0.35, h: pw * 0.25, src: r.result as string, zIndex: 5 }); r.readAsDataURL(f); };

  // Download
  const doDownload = async (fmt: 'png' | 'jpg' | 'webp') => {
    setDlMenu(false);
    const c = document.createElement('canvas'); c.width = sz.w; c.height = sz.h;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const s = 1 / scale;
    // BG
    if (bgImg) {
      try { const img = await loadImg(bgImg); ctx.drawImage(img, 0, 0, sz.w, sz.h); const g = ctx.createLinearGradient(0, 0, 0, sz.h); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, sz.w, sz.h); } catch {}
    } else {
      const g = ctx.createLinearGradient(0, 0, sz.w, sz.h); g.addColorStop(0, tpl.colors[0]); g.addColorStop(1, tpl.colors[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, sz.w, sz.h);
    }
    // Elements sorted by zIndex
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      const ex = el.x * s, ey = el.y * s, ew = el.w * s, eh = el.h * s;
      if (el.type === 'image' && el.src) {
        try { const img = await loadImg(el.src); ctx.drawImage(img, ex, ey, ew, eh); } catch {}
      }
      if (el.type === 'shape') {
        ctx.globalAlpha = el.opacity ?? 1;
        ctx.fillStyle = el.fill || '#000';
        if (el.shape === 'circle') { ctx.beginPath(); ctx.arc(ex + ew / 2, ey + eh / 2, Math.min(ew, eh) / 2, 0, Math.PI * 2); ctx.fill(); }
        else { roundR(ctx, ex, ey, ew, eh, (el.radius || 0) * s); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      if ((el.type === 'text' || el.type === 'cta') && el.text) {
        if (el.type === 'cta' && el.fill) { ctx.fillStyle = el.fill; roundR(ctx, ex, ey, ew, eh, (el.radius || 0) * s); ctx.fill(); }
        ctx.fillStyle = el.color || '#fff';
        ctx.font = `${el.fontWeight || '400'} ${Math.round((el.fontSize || 14) * s)}px 'DM Sans', sans-serif`;
        ctx.textAlign = (el.align as CanvasTextAlign) || 'left';
        const tx = el.align === 'center' ? ex + ew / 2 : el.align === 'right' ? ex + ew : ex;
        const ty = el.type === 'cta' ? ey + eh * 0.65 : ey + (el.fontSize || 14) * s * 0.85;
        if (bgImg && el.type === 'text') { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; }
        wrapAndDraw(ctx, el.text, tx, ty, ew, (el.fontSize || 14) * s * 1.3);
        ctx.shadowBlur = 0; ctx.textAlign = 'left';
      }
    }
    const link = document.createElement('a');
    link.download = `${(pkg?.name || 'ad').replace(/[^a-zA-Z0-9]/g, '_')}.${fmt}`;
    link.href = c.toDataURL(fmt === 'jpg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png', 0.95);
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: pkg?.name || 'Ad', text: pkg?.description || '' }); return; } catch {} }
    try { await navigator.clipboard.writeText(`${pkg?.name || 'Ad'}\n${pkg?.description || ''}\n${agencyProfile.name} | ${agencyProfile.phone}`); alert('Ad text copied!'); } catch {}
  };

  // Toolbar for selected element
  const Toolbar = () => {
    if (!selEl) return null;
    return (
      <div className="bg-white rounded-xl border p-3 shadow-lg" style={{ borderColor: GHL.border }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase" style={{ color: GHL.muted }}>{selEl.type === 'cta' ? 'Button' : selEl.type}</p>
          <div className="flex gap-1">
            <button onClick={() => updateEl(selEl.id, { zIndex: selEl.zIndex + 1 })} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: GHL.border }}>Front</button>
            <button onClick={() => updateEl(selEl.id, { zIndex: Math.max(0, selEl.zIndex - 1) })} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: GHL.border }}>Back</button>
            <button onClick={() => { const d = { ...selEl, id: nid(), x: selEl.x + 10, y: selEl.y + 10 }; addEl(d); }} className="text-[9px] px-1.5 py-0.5 rounded border" style={{ borderColor: GHL.border }}>Dup</button>
            <button onClick={() => removeEl(selEl.id)} className="text-[9px] px-1.5 py-0.5 rounded border text-red-500 border-red-200">Del</button>
          </div>
        </div>
        {(selEl.type === 'text' || selEl.type === 'cta') && (
          <div className="space-y-1.5">
            <input value={selEl.text || ''} onChange={e => updateEl(selEl.id, { text: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" style={{ borderColor: GHL.border }} />
            <div className="flex gap-1 items-center">
              <select value={selEl.fontSize || 14} onChange={e => updateEl(selEl.id, { fontSize: Number(e.target.value) })} className="text-[10px] border rounded px-1 py-0.5 w-14" style={{ borderColor: GHL.border }}>{[7,8,9,10,11,12,14,16,18,20,22,24,28,32,36,40,48].map(s => <option key={s} value={s}>{s}px</option>)}</select>
              <select value={selEl.fontWeight || '400'} onChange={e => updateEl(selEl.id, { fontWeight: e.target.value })} className="text-[10px] border rounded px-1 py-0.5" style={{ borderColor: GHL.border }}><option value="400">Regular</option><option value="600">Semi</option><option value="700">Bold</option><option value="800">Extra</option></select>
              <input type="color" value={selEl.color || '#ffffff'} onChange={e => updateEl(selEl.id, { color: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0" />
              {['left', 'center', 'right'].map(a => <button key={a} onClick={() => updateEl(selEl.id, { align: a })} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: selEl.align === a ? GHL.accentLight : GHL.bg, color: selEl.align === a ? GHL.accent : GHL.muted }}>{a[0].toUpperCase()}</button>)}
            </div>
            {selEl.type === 'cta' && <div className="flex gap-1 items-center"><span className="text-[9px]" style={{ color: GHL.muted }}>BG:</span><input type="color" value={selEl.fill || '#e2b714'} onChange={e => updateEl(selEl.id, { fill: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-0" /><span className="text-[9px]" style={{ color: GHL.muted }}>Radius:</span><input type="range" min={0} max={30} value={selEl.radius || 0} onChange={e => updateEl(selEl.id, { radius: Number(e.target.value) })} className="w-16" /></div>}
          </div>
        )}
        {selEl.type === 'shape' && (
          <div className="flex gap-1 items-center">
            <input type="color" value={selEl.fill || '#000'} onChange={e => updateEl(selEl.id, { fill: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0" />
            <span className="text-[9px]" style={{ color: GHL.muted }}>Opacity:</span>
            <input type="range" min={0} max={100} value={(selEl.opacity ?? 1) * 100} onChange={e => updateEl(selEl.id, { opacity: Number(e.target.value) / 100 })} className="w-20" />
            <span className="text-[9px]">{Math.round((selEl.opacity ?? 1) * 100)}%</span>
          </div>
        )}
        {selEl.type === 'image' && <p className="text-[9px]" style={{ color: GHL.muted }}>Drag to move, corners to resize</p>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Marketing Studio</h2><p className="text-sm" style={{ color: GHL.muted }}>Design ads for your packages</p></div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: GHL.accent, color: GHL.accent }}>Share</button>
          <div className="relative"><button onClick={() => setDlMenu(!dlMenu)} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: GHL.accent }}>Download</button>{dlMenu && <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border p-1 z-30 min-w-[140px]" style={{ borderColor: GHL.border }}><button onClick={() => doDownload('png')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">PNG</button><button onClick={() => doDownload('jpg')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">JPG</button><button onClick={() => doDownload('webp')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">WebP</button></div>}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT SIDEBAR - Tools */}
        <div className="col-span-3 space-y-2">
          {/* Tool buttons */}
          <div className="bg-white rounded-xl border p-2 flex flex-wrap gap-1" style={{ borderColor: GHL.border }}>
            {[{ id: 'style', icon: 'settings', label: 'Style' }, { id: 'text', icon: 'edit', label: 'Text' }, { id: 'images', icon: 'search', label: 'Images' }, { id: 'elements', icon: 'star', label: 'Elements' }].map(t => (
              <button key={t.id} onClick={() => setPanel(panel === t.id as any ? null : t.id as any)} className="flex-1 min-w-[60px] py-2 rounded-lg text-center" style={{ background: panel === t.id ? GHL.accentLight : GHL.bg, color: panel === t.id ? GHL.accent : GHL.muted }}>
                <Icon n={t.icon} c="w-4 h-4 mx-auto" /><p className="text-[8px] font-semibold mt-0.5">{t.label}</p>
              </button>
            ))}
          </div>

          {/* Style panel */}
          {panel === 'style' && <div className="bg-white rounded-xl border p-3 space-y-3" style={{ borderColor: GHL.border }}>
            <div><p className="text-[10px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Package</p><div className="space-y-0.5 max-h-[120px] overflow-y-auto">{packages.map(p => (<button key={p.id} onClick={() => setPkg(p)} className="w-full text-left px-2 py-1 rounded text-xs" style={pkg?.id === p.id ? { background: GHL.accentLight, color: GHL.accent, fontWeight: 600 } : { color: GHL.text }}>{p.name}</button>))}</div></div>
            <div><p className="text-[10px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Size</p><div className="grid grid-cols-3 gap-1">{SIZES.map(s => (<button key={s.id} onClick={() => setSz(s)} className="px-1 py-1 rounded text-[9px] font-medium" style={sz.id === s.id ? { background: GHL.accentLight, color: GHL.accent } : { background: GHL.bg, color: GHL.muted }}>{s.name}</button>))}</div></div>
            <div><p className="text-[10px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Theme</p><div className="grid grid-cols-3 gap-1">{TEMPLATES.map(t => (<button key={t.id} onClick={() => setTpl(t)} className="rounded p-1" style={{ border: tpl.id === t.id ? `2px solid ${GHL.accent}` : '2px solid transparent' }}><div style={{ width: '100%', height: 16, borderRadius: 3, background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }} /><p className="text-[7px] mt-0.5" style={{ color: GHL.text }}>{t.name}</p></button>))}</div></div>
            <div><p className="text-[10px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Background</p><div className="flex gap-2">{bgImg ? <><img src={bgImg} className="w-10 h-10 rounded object-cover" /><button onClick={() => setBgImg(null)} className="text-[9px] text-red-400">Remove</button></> : <button onClick={() => bgRef.current?.click()} className="text-[9px] px-2 py-1 rounded border" style={{ borderColor: GHL.border, color: GHL.accent }}>Upload BG</button>}<input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={uploadBg} /></div></div>
          </div>}

          {/* Text panel */}
          {panel === 'text' && <div className="bg-white rounded-xl border p-3 space-y-2" style={{ borderColor: GHL.border }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: GHL.muted }}>Add Text</p>
            {[{ label: 'Heading', size: 24, weight: '800' }, { label: 'Subheading', size: 16, weight: '600' }, { label: 'Body Text', size: 11, weight: '400' }, { label: 'Caption', size: 8, weight: '400' }].map(t => (
              <button key={t.label} onClick={() => addEl({ id: nid(), type: 'text', x: pw * 0.1, y: ph * 0.3, w: pw * 0.8, h: t.size * 1.5, text: t.label, fontSize: t.size, fontWeight: t.weight, color: bgImg ? '#ffffff' : tpl.text, align: 'left', zIndex: 10 })} className="w-full text-left px-3 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border }}>
                <span style={{ fontSize: Math.min(t.size, 16), fontWeight: t.weight as any, color: GHL.text }}>{t.label}</span>
              </button>
            ))}
            <button onClick={() => addEl({ id: nid(), type: 'cta', x: pw * 0.25, y: ph * 0.7, w: pw * 0.5, h: 32, text: 'Book Now', fontSize: 12, fontWeight: '700', color: '#000', fill: tpl.accent, radius: 20, zIndex: 10 })} className="w-full text-left px-3 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border }}>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: tpl.accent }}>Button</span>
            </button>
          </div>}

          {/* Images panel */}
          {panel === 'images' && <div className="bg-white rounded-xl border p-3 space-y-2" style={{ borderColor: GHL.border }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: GHL.muted }}>Images</p>
            <button onClick={() => imgRef.current?.click()} className="w-full py-2 rounded-lg border text-xs font-medium hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.text }}>Upload Image</button>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={uploadOverlay} />
            <div className="flex gap-1"><input value={imgSearch} onChange={e => setImgSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchImages()} placeholder="Search photos..." className="flex-1 px-2 py-1.5 border rounded text-xs" style={{ borderColor: GHL.border }} /><button onClick={searchImages} disabled={searching} className="px-2 py-1.5 rounded text-xs font-bold text-white" style={{ background: GHL.accent }}>{searching ? '...' : 'Go'}</button></div>
            {imgResults.length > 0 && <div className="grid grid-cols-3 gap-1 max-h-[300px] overflow-y-auto">{imgResults.map((url, i) => (<button key={i} onClick={() => addImageFromUrl(url)} className="rounded overflow-hidden border aspect-square relative hover:opacity-80" style={{ borderColor: GHL.border }}><img src={url} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} /><span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[7px] text-center py-0.5">+ Add</span></button>))}</div>}
          </div>}

          {/* Elements panel */}
          {panel === 'elements' && <div className="bg-white rounded-xl border p-3 space-y-2" style={{ borderColor: GHL.border }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: GHL.muted }}>Shapes</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => addEl({ id: nid(), type: 'shape', shape: 'rect', x: pw * 0.2, y: ph * 0.2, w: 80, h: 60, fill: tpl.accent, opacity: 0.3, radius: 8, zIndex: 2 })} className="aspect-square rounded-lg border flex items-center justify-center hover:bg-gray-50" style={{ borderColor: GHL.border }}><div style={{ width: 30, height: 22, background: tpl.accent, borderRadius: 4, opacity: 0.5 }} /></button>
              <button onClick={() => addEl({ id: nid(), type: 'shape', shape: 'circle', x: pw * 0.3, y: ph * 0.3, w: 60, h: 60, fill: tpl.accent, opacity: 0.3, zIndex: 2 })} className="aspect-square rounded-lg border flex items-center justify-center hover:bg-gray-50" style={{ borderColor: GHL.border }}><div style={{ width: 28, height: 28, background: tpl.accent, borderRadius: '50%', opacity: 0.5 }} /></button>
              <button onClick={() => addEl({ id: nid(), type: 'shape', shape: 'rect', x: 0, y: ph * 0.75, w: pw, h: ph * 0.25, fill: '#000000', opacity: 0.5, radius: 0, zIndex: 1 })} className="aspect-square rounded-lg border flex items-center justify-center hover:bg-gray-50 text-[8px]" style={{ borderColor: GHL.border, color: GHL.muted }}>Overlay</button>
            </div>
            <p className="text-[10px] font-bold uppercase mt-2" style={{ color: GHL.muted }}>Decorative</p>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => addEl({ id: nid(), type: 'shape', shape: 'rect', x: 0, y: 0, w: pw, h: 4, fill: tpl.accent, opacity: 1, radius: 0, zIndex: 15 })} className="px-2 py-1.5 rounded border text-[9px]" style={{ borderColor: GHL.border, color: GHL.muted }}>Top Line</button>
              <button onClick={() => addEl({ id: nid(), type: 'shape', shape: 'rect', x: pw * 0.06, y: ph * 0.88, w: pw * 0.88, h: 1, fill: bgImg ? 'rgba(255,255,255,0.2)' : tpl.accent + '30', opacity: 1, radius: 0, zIndex: 5 })} className="px-2 py-1.5 rounded border text-[9px]" style={{ borderColor: GHL.border, color: GHL.muted }}>Divider</button>
            </div>
          </div>}

          {/* Selection toolbar */}
          {selEl && <Toolbar />}

          {/* Layers */}
          <div className="bg-white rounded-xl border p-2" style={{ borderColor: GHL.border }}>
            <p className="text-[9px] font-bold uppercase mb-1 px-1" style={{ color: GHL.muted }}>Layers ({elements.length})</p>
            <div className="space-y-0.5 max-h-[150px] overflow-y-auto">{[...elements].reverse().map(el => (
              <button key={el.id} onClick={() => setSelId(el.id)} className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[9px] text-left" style={{ background: selId === el.id ? GHL.accentLight : 'transparent', color: selId === el.id ? GHL.accent : GHL.muted }}>
                <Icon n={el.type === 'image' ? 'globe' : el.type === 'shape' ? 'star' : el.type === 'cta' ? 'star' : 'edit'} c="w-2.5 h-2.5" />
                <span className="truncate flex-1">{el.type === 'text' || el.type === 'cta' ? (el.text || '').slice(0, 20) : el.type}</span>
              </button>
            ))}</div>
          </div>
        </div>

        {/* CANVAS */}
        <div className="col-span-9">
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-center rounded-lg" style={{ background: '#e5e7eb', padding: 16 }}>
              <div onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onClick={() => setSelId(null)} style={{ width: pw, height: ph, background: bgImg ? `url(${bgImg}) center/cover` : `linear-gradient(135deg, ${tpl.colors[0]}, ${tpl.colors[1]})`, borderRadius: sz.id === 'flyer' ? 0 : 12, overflow: 'hidden', position: 'relative', cursor: (drag || resize) ? 'grabbing' : 'default', userSelect: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                {bgImg && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.55))' }} />}
                {/* Render elements */}
                {[...elements].sort((a, b) => a.zIndex - b.zIndex).map(el => {
                  const selected = selId === el.id;
                  if (el.type === 'image') return (
                    <div key={el.id} onMouseDown={e => onMouseDown(el.id, e)} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.zIndex, cursor: 'grab', border: selected ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: 6, overflow: 'hidden' }}>
                      <img src={el.src} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                      {selected && <div onMouseDown={e => onResizeDown(el.id, e)} style={{ position: 'absolute', right: -4, bottom: -4, width: 10, height: 10, background: '#3b82f6', borderRadius: 2, cursor: 'nwse-resize' }} />}
                    </div>
                  );
                  if (el.type === 'shape') return (
                    <div key={el.id} onMouseDown={e => onMouseDown(el.id, e)} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.zIndex, cursor: 'grab', border: selected ? '2px solid #3b82f6' : '2px solid transparent' }}>
                      <div style={{ width: '100%', height: '100%', background: el.fill, opacity: el.opacity ?? 1, borderRadius: el.shape === 'circle' ? '50%' : (el.radius || 0) }} />
                      {selected && <div onMouseDown={e => onResizeDown(el.id, e)} style={{ position: 'absolute', right: -4, bottom: -4, width: 10, height: 10, background: '#3b82f6', borderRadius: 2, cursor: 'nwse-resize' }} />}
                    </div>
                  );
                  if (el.type === 'cta') return (
                    <div key={el.id} onMouseDown={e => onMouseDown(el.id, e)} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.zIndex, cursor: 'grab', border: selected ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: el.radius || 0 }}>
                      <div style={{ width: '100%', height: '100%', background: el.fill, borderRadius: el.radius || 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight as any }}>{el.text}</span></div>
                      {selected && <div onMouseDown={e => onResizeDown(el.id, e)} style={{ position: 'absolute', right: -4, bottom: -4, width: 10, height: 10, background: '#3b82f6', borderRadius: 2, cursor: 'nwse-resize' }} />}
                    </div>
                  );
                  return (
                    <div key={el.id} onMouseDown={e => onMouseDown(el.id, e)} style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, zIndex: el.zIndex, cursor: 'grab', border: selected ? '1px dashed #3b82f6' : '1px dashed transparent', padding: 2, borderRadius: 3 }}>
                      <span style={{ color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight as any, textAlign: el.align as any, display: 'block', lineHeight: 1.3, textShadow: bgImg ? '0 1px 4px rgba(0,0,0,0.4)' : 'none', wordWrap: 'break-word' }}>{el.text}</span>
                      {selected && <div onMouseDown={e => onResizeDown(el.id, e)} style={{ position: 'absolute', right: -4, bottom: -4, width: 8, height: 8, background: '#3b82f6', borderRadius: 2, cursor: 'nwse-resize' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function loadImg(src: string): Promise<HTMLImageElement> { return new Promise((r, j) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => r(i); i.onerror = () => j(); i.src = src; }); }
function roundR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
function wrapAndDraw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) { const words = text.split(' '); let line = ''; for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lineH; line = w; } else line = t; } if (line) ctx.fillText(line, x, y); }
