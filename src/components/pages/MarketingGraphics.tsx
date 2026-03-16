'use client';

import { useState, useRef, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { PackageTemplate, AgencyProfile } from '@/lib/types';

interface Props { packages: PackageTemplate[]; agencyProfile: AgencyProfile; }

interface AdImage { id: number; src: string; x: number; y: number; width: number; height: number; label: string; }
interface AdText { id: number; text: string; x: number; y: number; fontSize: number; color: string; fontWeight: string; }

const TEMPLATES = [
  { id: 'elegant', name: 'Elegant', bg: 'linear-gradient(135deg, #1a1a2e, #16213e)', accent: '#e2b714', textColor: '#ffffff' },
  { id: 'tropical', name: 'Tropical', bg: 'linear-gradient(135deg, #0d9488, #059669)', accent: '#fef3c7', textColor: '#ffffff' },
  { id: 'luxury', name: 'Luxury Gold', bg: 'linear-gradient(135deg, #1c1917, #44403c)', accent: '#d4a53c', textColor: '#fafaf9' },
  { id: 'ocean', name: 'Ocean Blue', bg: 'linear-gradient(135deg, #0c4a6e, #0369a1)', accent: '#38bdf8', textColor: '#ffffff' },
  { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg, #9a3412, #dc2626)', accent: '#fbbf24', textColor: '#ffffff' },
  { id: 'modern', name: 'Modern', bg: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', accent: '#0f172a', textColor: '#0f172a' },
];

const SIZES = [
  { id: 'instagram', name: 'Instagram Post', w: 1080, h: 1080, scale: 0.3 },
  { id: 'story', name: 'IG / WA Story', w: 1080, h: 1920, scale: 0.18 },
  { id: 'facebook', name: 'Facebook Post', w: 1200, h: 630, scale: 0.35 },
  { id: 'banner', name: 'Email Banner', w: 600, h: 200, scale: 0.6 },
  { id: 'flyer', name: 'Flyer 8.5x11', w: 2550, h: 3300, scale: 0.12 },
];

let counter = 1;

export default function MarketingGraphics({ packages, agencyProfile }: Props) {
  const [selectedPkg, setSelectedPkg] = useState<PackageTemplate | null>(packages[0] || null);
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [customSub, setCustomSub] = useState('');
  const [showCta, setShowCta] = useState(true);
  const [ctaText, setCtaText] = useState('Book Now');
  const [ctaLink, setCtaLink] = useState('');
  const [showContact, setShowContact] = useState(true);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [images, setImages] = useState<AdImage[]>([]);
  const [texts, setTexts] = useState<AdText[]>([]);
  const [selImg, setSelImg] = useState<number | null>(null);
  const [selTxt, setSelTxt] = useState<number | null>(null);
  const [imgSearch, setImgSearch] = useState('');
  const [imgResults, setImgResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [drag, setDrag] = useState<{ type: 'img' | 'txt'; id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [showDlMenu, setShowDlMenu] = useState(false);
  const [newTxtInput, setNewTxtInput] = useState('');
  const bgRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const title = customTitle || selectedPkg?.name || 'Your Dream Vacation';
  const subtitle = customSub || selectedPkg?.description || 'Experience luxury travel like never before';
  const price = selectedPkg?.priceLabel || '';
  const dests = selectedPkg?.destinations?.join(' / ') || '';

  // --- Image handlers ---
  const uploadBg = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setBgImage(r.result as string); r.readAsDataURL(f); };
  const uploadImg = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const pw = size.w * size.scale; setImages(p => [...p, { id: counter++, src: r.result as string, x: pw * 0.1, y: 20, width: pw * 0.3, height: pw * 0.22, label: f.name }]); }; r.readAsDataURL(f); };

  const searchImages = async () => {
    if (!imgSearch.trim()) return;
    setSearching(true); setImgResults([]);
    try {
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(imgSearch)}`);
      const data = await res.json();
      setImgResults(data.images || []);
    } catch {
      // Fallback: use placeholder images
      const urls: string[] = [];
      for (let i = 0; i < 6; i++) urls.push(`https://picsum.photos/seed/${imgSearch.replace(/\s/g,'')}${i}/400/300`);
      setImgResults(urls);
    }
    setSearching(false);
  };

  const addFromUrl = (url: string) => { const pw = size.w * size.scale; setImages(p => [...p, { id: counter++, src: url, x: pw * 0.1, y: 20, width: pw * 0.3, height: pw * 0.22, label: 'Search image' }]); };
  const rmImg = (id: number) => { setImages(p => p.filter(i => i.id !== id)); if (selImg === id) setSelImg(null); };
  const resizeImg = (id: number, d: number) => setImages(p => p.map(i => i.id === id ? { ...i, width: Math.max(20, i.width + d), height: Math.max(15, i.height + d * (i.height / i.width)) } : i));

  // --- Text handlers ---
  const addText = () => { const t = newTxtInput.trim() || 'Custom Text'; const pw = size.w * size.scale; setTexts(p => [...p, { id: counter++, text: t, x: pw * 0.1, y: pw * 0.3, fontSize: 16, color: bgImage ? '#ffffff' : tpl.textColor, fontWeight: '700' }]); setNewTxtInput(''); };
  const rmTxt = (id: number) => { setTexts(p => p.filter(t => t.id !== id)); if (selTxt === id) setSelTxt(null); };
  const updateTxt = (id: number, updates: Partial<AdText>) => setTexts(p => p.map(t => t.id === id ? { ...t, ...updates } : t));

  // --- Drag handlers ---
  const startDrag = (type: 'img' | 'txt', id: number, e: React.MouseEvent) => {
    e.preventDefault();
    const item = type === 'img' ? images.find(i => i.id === id) : texts.find(t => t.id === id);
    if (!item) return;
    if (type === 'img') setSelImg(id); else setSelTxt(id);
    setDrag({ type, id, sx: e.clientX, sy: e.clientY, ox: item.x, oy: item.y });
  };
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (drag.type === 'img') setImages(p => p.map(i => i.id === drag.id ? { ...i, x: drag.ox + dx, y: drag.oy + dy } : i));
    else setTexts(p => p.map(t => t.id === drag.id ? { ...t, x: drag.ox + dx, y: drag.oy + dy } : t));
  }, [drag]);
  const endDrag = () => setDrag(null);

  // --- Canvas download ---
  const doDownload = async (format: 'png' | 'jpg' | 'webp') => {
    setShowDlMenu(false);
    const canvas = document.createElement('canvas');
    canvas.width = size.w; canvas.height = size.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sc = size.w / (size.w * size.scale);

    // BG
    if (bgImage) {
      try { const img = await loadImg(bgImage); ctx.drawImage(img, 0, 0, size.w, size.h); const g = ctx.createLinearGradient(0, 0, 0, size.h); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = g; ctx.fillRect(0, 0, size.w, size.h); } catch {}
    } else {
      const g = ctx.createLinearGradient(0, 0, size.w, size.h); const cs = tpl.bg.match(/#[0-9a-f]{6}/gi) || ['#1a1a2e', '#16213e']; g.addColorStop(0, cs[0]); g.addColorStop(1, cs[1] || cs[0]); ctx.fillStyle = g; ctx.fillRect(0, 0, size.w, size.h);
    }

    const tc = bgImage ? '#fff' : tpl.textColor;
    const ac = bgImage ? '#fbbf24' : tpl.accent;
    const pad = size.w * 0.06;

    // Logo
    ctx.fillStyle = ac;
    roundRect(ctx, pad, pad, 80 * sc / 3, 80 * sc / 3, 12); ctx.fill();
    ctx.fillStyle = '#000'; ctx.font = `bold ${Math.round(36 * sc / 3)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.fillText(agencyProfile.name.charAt(0), pad + 40 * sc / 3, pad + 55 * sc / 3);
    ctx.fillStyle = tc; ctx.font = `600 ${Math.round(33 * sc / 3)}px sans-serif`;
    ctx.textAlign = 'left'; ctx.globalAlpha = 0.9; ctx.fillText(agencyProfile.name, pad + 100 * sc / 3, pad + 55 * sc / 3); ctx.globalAlpha = 1;

    // Dests
    if (dests) { ctx.fillStyle = ac; ctx.font = `bold ${Math.round(30 * sc / 3)}px sans-serif`; ctx.fillText(dests.toUpperCase(), pad, size.h * 0.42); }

    // Title
    ctx.fillStyle = tc; ctx.font = `800 ${Math.round(66 * sc / 3)}px sans-serif`;
    if (bgImage) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; }
    let ty = size.h * 0.48;
    wrapText(ctx, title, size.w - pad * 2).forEach(l => { ctx.fillText(l, pad, ty); ty += 70 * sc / 3; });
    ctx.shadowBlur = 0;

    // Sub
    ctx.fillStyle = tc; ctx.globalAlpha = bgImage ? 0.85 : 0.7;
    ctx.font = `400 ${Math.round(30 * sc / 3)}px sans-serif`;
    wrapText(ctx, subtitle.length > 200 ? subtitle.slice(0, 200) + '...' : subtitle, size.w * 0.85 - pad).forEach(l => { ctx.fillText(l, pad, ty + 10); ty += 40 * sc / 3; });
    ctx.globalAlpha = 1;

    // Price
    if (price) { ctx.fillStyle = ac; ctx.font = `800 ${Math.round(42 * sc / 3)}px sans-serif`; ctx.fillText(price, pad, size.h - pad - (showContact ? 80 * sc / 3 : 20)); }

    // CTA
    if (showCta) { const tw = ctx.measureText(ctaText).width + 60 * sc / 3; const cx = size.w - pad - tw; const cy = size.h - pad - (showContact ? 100 * sc / 3 : 40); ctx.fillStyle = bgImage ? '#fff' : tpl.accent; roundRect(ctx, cx, cy, tw, 50 * sc / 3, 25 * sc / 3); ctx.fill(); ctx.fillStyle = bgImage ? '#000' : (tpl.id === 'modern' ? '#fff' : '#000'); ctx.font = `700 ${Math.round(28 * sc / 3)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(ctaText, cx + tw / 2, cy + 33 * sc / 3); ctx.textAlign = 'left'; }

    // Contact
    if (showContact) { const cy2 = size.h - pad; ctx.strokeStyle = bgImage ? 'rgba(255,255,255,0.2)' : (tpl.accent + '30'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, cy2 - 30 * sc / 3); ctx.lineTo(size.w - pad, cy2 - 30 * sc / 3); ctx.stroke(); ctx.fillStyle = tc; ctx.globalAlpha = bgImage ? 0.7 : 0.5; ctx.font = `400 ${Math.round(22 * sc / 3)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText([agencyProfile.phone, agencyProfile.email, agencyProfile.address].filter(Boolean).join('  |  '), size.w / 2, cy2 - 5); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }

    // Overlay images
    for (const img of images) { try { const i = await loadImg(img.src); ctx.drawImage(i, img.x * sc, img.y * sc, img.width * sc, img.height * sc); } catch {} }

    // Overlay texts
    for (const t of texts) { ctx.fillStyle = t.color; ctx.font = `${t.fontWeight} ${Math.round(t.fontSize * sc)}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText(t.text, t.x * sc, t.y * sc + t.fontSize * sc * 0.8); }

    const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const ext = format;
    const link = document.createElement('a');
    link.download = `${(selectedPkg?.name || 'ad').replace(/[^a-zA-Z0-9]/g, '_')}_${size.id}.${ext}`;
    link.href = canvas.toDataURL(mime, 0.95);
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) { try { await navigator.share({ title, text: `${title} - ${subtitle}`, url: ctaLink || location.href }); return; } catch {} }
    const txt = `${title}\n${subtitle}\n${price ? price + '\n' : ''}${ctaLink || ''}\n${agencyProfile.name} | ${agencyProfile.phone} | ${agencyProfile.email}`;
    try { await navigator.clipboard.writeText(txt); alert('Ad text copied to clipboard!'); } catch { alert('Please screenshot the preview.'); }
  };

  // --- Preview ---
  const pw = size.w * size.scale, ph = size.h * size.scale, pad = pw * 0.06;
  const isFlyer = size.id === 'flyer', isBanner = size.id === 'banner';
  const ts = isFlyer ? 26 : isBanner ? 18 : 22, ss = isFlyer ? 11 : 10, ps = isFlyer ? 16 : 13;

  const ic = 'w-full px-2.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold mb-1" style={{ color: GHL.text }}>Marketing Graphics</h2><p className="text-sm" style={{ color: GHL.muted }}>Create branded ads for your packages</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT PANEL */}
        <div className="lg:col-span-1 space-y-3">
          {/* Package */}
          <Panel title="Package">
            <div className="space-y-1">{packages.map(p => (<button key={p.id} onClick={() => { setSelectedPkg(p); setCustomTitle(''); setCustomSub(''); }} className="w-full text-left px-3 py-1.5 rounded-lg text-sm" style={selectedPkg?.id === p.id ? { background: GHL.accentLight, color: GHL.accent, fontWeight: 600 } : { color: GHL.text }}>{p.name}</button>))}</div>
          </Panel>

          {/* Size */}
          <Panel title="Size">
            <div className="grid grid-cols-2 gap-1.5">{SIZES.map(s => (<button key={s.id} onClick={() => setSize(s)} className="px-2 py-1.5 rounded-lg text-xs font-medium" style={size.id === s.id ? { background: GHL.accentLight, color: GHL.accent, border: `1px solid ${GHL.accent}` } : { background: GHL.bg, color: GHL.muted, border: `1px solid ${GHL.border}` }}>{s.name}</button>))}</div>
          </Panel>

          {/* Style */}
          {!bgImage && <Panel title="Style"><div className="grid grid-cols-3 gap-1.5">{TEMPLATES.map(t => (<button key={t.id} onClick={() => setTpl(t)} className="rounded-lg p-1.5 text-center" style={{ background: tpl.id === t.id ? GHL.accentLight : GHL.bg, border: tpl.id === t.id ? `2px solid ${GHL.accent}` : '2px solid transparent' }}><div style={{ width: '100%', height: 20, borderRadius: 3, background: t.bg }} /><p className="text-[8px] mt-0.5" style={{ color: GHL.text }}>{t.name}</p></button>))}</div></Panel>}

          {/* Images */}
          <Panel title="Images">
            <div className="space-y-2">
              <div><p className="text-[10px] font-semibold mb-1" style={{ color: GHL.muted }}>Background</p><div className="flex gap-2">{bgImage ? (<><div className="w-10 h-10 rounded overflow-hidden border" style={{ borderColor: GHL.border }}><img src={bgImage} className="w-full h-full object-cover" /></div><button onClick={() => setBgImage(null)} className="text-[10px] text-red-400">Remove</button></>) : (<button onClick={() => bgRef.current?.click()} className="text-[10px] px-2 py-1 rounded border" style={{ borderColor: GHL.border, color: GHL.accent }}>Upload</button>)}<input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={uploadBg} /></div></div>
              <div className="flex gap-1.5">
                <button onClick={() => imgRef.current?.click()} className="flex-1 text-[10px] font-medium py-1.5 rounded-lg border text-center" style={{ borderColor: GHL.border, color: GHL.text }}>+ Upload</button>
                <button onClick={() => setShowSearch(!showSearch)} className="flex-1 text-[10px] font-medium py-1.5 rounded-lg border text-center" style={{ borderColor: GHL.border, color: GHL.text }}>Search</button>
                <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={uploadImg} />
              </div>
              {showSearch && (<div className="border rounded-lg p-2" style={{ borderColor: GHL.border, background: GHL.bg }}>
                <div className="flex gap-1 mb-2"><input value={imgSearch} onChange={e => setImgSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchImages()} placeholder="e.g. beach, rome..." className="flex-1 px-2 py-1 border rounded text-xs" style={{ borderColor: GHL.border }} /><button onClick={searchImages} disabled={searching} className="px-2 py-1 rounded text-xs font-bold text-white" style={{ background: GHL.accent }}>{searching ? '...' : 'Go'}</button></div>
                {imgResults.length > 0 && <div className="grid grid-cols-3 gap-1">{imgResults.map((url, i) => (<button key={i} onClick={() => addFromUrl(url)} className="rounded overflow-hidden border aspect-square relative hover:opacity-80" style={{ borderColor: GHL.border }}><img src={url} className="w-full h-full object-cover" crossOrigin="anonymous" /><span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[7px] text-center py-0.5">+ Add</span></button>))}</div>}
                {imgResults.length === 0 && !searching && <p className="text-[8px] text-center" style={{ color: GHL.muted }}>Search for photos</p>}
              </div>)}
              {images.length > 0 && <div className="space-y-1">{images.map(img => (<div key={img.id} className="flex items-center gap-1.5 p-1 rounded" style={{ background: selImg === img.id ? GHL.accentLight : GHL.bg }}><div className="w-7 h-7 rounded overflow-hidden flex-shrink-0"><img src={img.src} className="w-full h-full object-cover" /></div><span className="flex-1 text-[9px] truncate">{img.label}</span><button onClick={() => resizeImg(img.id, -8)} className="text-[10px] text-gray-400">-</button><button onClick={() => resizeImg(img.id, 8)} className="text-[10px] text-gray-400">+</button><button onClick={() => rmImg(img.id)} className="text-[10px] text-red-400">X</button></div>))}<p className="text-[7px]" style={{ color: GHL.muted }}>Drag to position, +/- to resize</p></div>}
            </div>
          </Panel>

          {/* Text blocks */}
          <Panel title="Text Blocks">
            <div className="flex gap-1 mb-2"><input value={newTxtInput} onChange={e => setNewTxtInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addText()} placeholder="Enter text..." className="flex-1 px-2 py-1.5 border rounded text-xs" style={{ borderColor: GHL.border }} /><button onClick={addText} className="px-2 py-1.5 rounded text-xs font-bold text-white" style={{ background: GHL.accent }}>Add</button></div>
            {texts.map(t => (<div key={t.id} className="p-2 rounded-lg mb-1 border" style={{ borderColor: selTxt === t.id ? GHL.accent : GHL.border, background: selTxt === t.id ? GHL.accentLight : 'white' }}>
              <div className="flex items-center gap-1 mb-1"><input value={t.text} onChange={e => updateTxt(t.id, { text: e.target.value })} className="flex-1 text-xs px-1 py-0.5 border rounded" style={{ borderColor: GHL.border }} /><button onClick={() => rmTxt(t.id)} className="text-[10px] text-red-400 px-1">X</button></div>
              <div className="flex items-center gap-1">
                <select value={t.fontSize} onChange={e => updateTxt(t.id, { fontSize: Number(e.target.value) })} className="text-[10px] border rounded px-1 py-0.5" style={{ borderColor: GHL.border }}>{[10,12,14,16,18,20,24,28,32,40].map(s => <option key={s} value={s}>{s}px</option>)}</select>
                <select value={t.fontWeight} onChange={e => updateTxt(t.id, { fontWeight: e.target.value })} className="text-[10px] border rounded px-1 py-0.5" style={{ borderColor: GHL.border }}><option value="400">Normal</option><option value="600">Semi</option><option value="700">Bold</option><option value="800">Extra</option></select>
                <input type="color" value={t.color} onChange={e => updateTxt(t.id, { color: e.target.value })} className="w-5 h-5 rounded border-0 cursor-pointer" />
              </div>
            </div>))}
          </Panel>

          {/* Content */}
          <Panel title="Content">
            <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Custom headline..." className={ic + ' mb-1.5'} style={{ borderColor: GHL.border }} />
            <input value={customSub} onChange={e => setCustomSub(e.target.value)} placeholder="Custom subtitle..." className={ic + ' mb-2'} style={{ borderColor: GHL.border }} />
            <Chk checked={showCta} onChange={() => setShowCta(!showCta)} label="CTA Button" />
            {showCta && <div className="ml-5 space-y-1 mt-1"><input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Button text" className={ic} style={{ borderColor: GHL.border }} /><input value={ctaLink} onChange={e => setCtaLink(e.target.value)} placeholder="Link URL" className={ic} style={{ borderColor: GHL.border }} /></div>}
            <Chk checked={showContact} onChange={() => setShowContact(!showContact)} label="Company contact" />
          </Panel>
        </div>

        {/* PREVIEW */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Preview</p>
              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: GHL.accent, color: GHL.accent }}><Icon n="globe" c="w-3 h-3" /> Share</button>
                <div className="relative">
                  <button onClick={() => setShowDlMenu(!showDlMenu)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: GHL.accent }}><Icon n="download" c="w-3 h-3" /> Download</button>
                  {showDlMenu && <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border p-1 z-20" style={{ borderColor: GHL.border }}>
                    <button onClick={() => doDownload('png')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">PNG (best quality)</button>
                    <button onClick={() => doDownload('jpg')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">JPG (smaller file)</button>
                    <button onClick={() => doDownload('webp')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 rounded">WebP (web optimal)</button>
                  </div>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center p-4 rounded-xl" style={{ background: '#f8f9fb', minHeight: 280 }}>
              {/* Live preview */}
              <div onMouseMove={onMove} onMouseUp={endDrag} onMouseLeave={endDrag} style={{ width: pw, height: ph, background: bgImage ? `url(${bgImage}) center/cover` : tpl.bg, borderRadius: isFlyer ? 0 : 16, overflow: 'hidden', position: 'relative', padding: pad, fontFamily: "'DM Sans', sans-serif", cursor: drag ? 'grabbing' : 'default', userSelect: 'none' }}>
                {bgImage && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.6))' }} />}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 24, height: 24, borderRadius: 5, background: tpl.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 10, fontWeight: 800 }}>{agencyProfile.name.charAt(0)}</div><span style={{ color: bgImage ? '#fff' : tpl.textColor, fontSize: 10, fontWeight: 600, opacity: 0.9 }}>{agencyProfile.name}</span></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {dests && <p style={{ color: bgImage ? '#fbbf24' : tpl.accent, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{dests}</p>}
                    <h2 style={{ color: bgImage ? '#fff' : tpl.textColor, fontSize: ts, fontWeight: 800, lineHeight: 1.2, marginBottom: 6, textShadow: bgImage ? '0 2px 6px rgba(0,0,0,0.5)' : 'none' }}>{title}</h2>
                    <p style={{ color: bgImage ? 'rgba(255,255,255,0.85)' : tpl.textColor, fontSize: ss, opacity: bgImage ? 1 : 0.7, lineHeight: 1.4, maxWidth: '85%' }}>{subtitle.length > (isFlyer ? 200 : 100) ? subtitle.slice(0, isFlyer ? 200 : 100) + '...' : subtitle}</p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showContact ? 8 : 0 }}>
                      {price && <p style={{ color: bgImage ? '#fbbf24' : tpl.accent, fontSize: ps, fontWeight: 800 }}>{price}</p>}
                      {showCta && <span style={{ background: bgImage ? '#fff' : tpl.accent, color: bgImage ? '#000' : (tpl.id === 'modern' ? '#fff' : '#000'), padding: '4px 12px', borderRadius: 16, fontSize: 9, fontWeight: 700 }}>{ctaText}</span>}
                    </div>
                    {showContact && <div style={{ borderTop: `1px solid ${bgImage ? 'rgba(255,255,255,0.2)' : (tpl.accent + '30')}`, paddingTop: 6, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>{[agencyProfile.phone, agencyProfile.email, agencyProfile.address].filter(Boolean).map((c, i) => <span key={i} style={{ color: bgImage ? 'rgba(255,255,255,0.7)' : tpl.textColor, fontSize: 7, opacity: bgImage ? 1 : 0.5 }}>{c}</span>)}</div>}
                  </div>
                </div>
                {/* Overlay images */}
                {images.map(img => (<div key={img.id} onMouseDown={e => startDrag('img', img.id, e)} style={{ position: 'absolute', left: img.x, top: img.y, width: img.width, height: img.height, zIndex: 10, cursor: drag?.id === img.id ? 'grabbing' : 'grab', border: selImg === img.id ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: 6, overflow: 'hidden' }}><img src={img.src} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /></div>))}
                {/* Overlay texts */}
                {texts.map(t => (<div key={t.id} onMouseDown={e => startDrag('txt', t.id, e)} style={{ position: 'absolute', left: t.x, top: t.y, zIndex: 11, cursor: drag?.id === t.id ? 'grabbing' : 'grab', border: selTxt === t.id ? '1px dashed #3b82f6' : '1px dashed transparent', padding: '2px 4px', borderRadius: 3 }}><span style={{ color: t.color, fontSize: t.fontSize, fontWeight: t.fontWeight as any, whiteSpace: 'nowrap', textShadow: bgImage ? '0 1px 4px rgba(0,0,0,0.5)' : 'none' }}>{t.text}</span></div>))}
                {!bgImage && <><div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: tpl.accent, opacity: 0.05 }} /><div style={{ position: 'absolute', bottom: -20, left: -20, width: 70, height: 70, borderRadius: '50%', background: tpl.accent, opacity: 0.08 }} /></>}
              </div>
            </div>
            <p className="text-[10px] text-center mt-2" style={{ color: GHL.muted }}>Drag elements to reposition. Download at full resolution.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border p-3 shadow-sm" style={{ borderColor: '#e5e7eb' }}><p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>{title}</p>{children}</div>;
}

function Chk({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <div className="flex items-center gap-2 mt-2 cursor-pointer" onClick={onChange}><div className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0" style={checked ? { background: '#3b82f6', borderColor: '#3b82f6' } : { borderColor: '#d1d5db' }}>{checked && <span className="text-white text-[8px] font-bold">V</span>}</div><span className="text-xs" style={{ color: '#1f2937' }}>{label}</span></div>;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => rej(); i.src = src; });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' '); const lines: string[] = []; let cur = '';
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
