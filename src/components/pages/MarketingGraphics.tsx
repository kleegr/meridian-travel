'use client';

import { useState, useRef, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { PackageTemplate, AgencyProfile } from '@/lib/types';

interface Props { packages: PackageTemplate[]; agencyProfile: AgencyProfile; }

interface AdImage { id: number; src: string; x: number; y: number; width: number; height: number; label: string; }

const TEMPLATES = [
  { id: 'elegant', name: 'Elegant', bg: 'linear-gradient(135deg, #1a1a2e, #16213e)', accent: '#e2b714', textColor: '#ffffff' },
  { id: 'tropical', name: 'Tropical', bg: 'linear-gradient(135deg, #0d9488, #059669)', accent: '#fef3c7', textColor: '#ffffff' },
  { id: 'luxury', name: 'Luxury Gold', bg: 'linear-gradient(135deg, #1c1917, #44403c)', accent: '#d4a53c', textColor: '#fafaf9' },
  { id: 'ocean', name: 'Ocean Blue', bg: 'linear-gradient(135deg, #0c4a6e, #0369a1)', accent: '#38bdf8', textColor: '#ffffff' },
  { id: 'sunset', name: 'Sunset', bg: 'linear-gradient(135deg, #9a3412, #dc2626)', accent: '#fbbf24', textColor: '#ffffff' },
  { id: 'modern', name: 'Modern Minimal', bg: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', accent: '#0f172a', textColor: '#0f172a' },
];

const SIZES = [
  { id: 'instagram', name: 'Instagram Post', w: 1080, h: 1080, scale: 0.3 },
  { id: 'story', name: 'Instagram Story', w: 1080, h: 1920, scale: 0.18 },
  { id: 'whatsapp', name: 'WhatsApp Status', w: 1080, h: 1920, scale: 0.18 },
  { id: 'facebook', name: 'Facebook Post', w: 1200, h: 630, scale: 0.35 },
  { id: 'banner', name: 'Email Banner', w: 600, h: 200, scale: 0.6 },
  { id: 'flyer', name: 'Flyer (8.5x11)', w: 2550, h: 3300, scale: 0.12 },
];

let imgIdCounter = 1;

export default function MarketingGraphics({ packages, agencyProfile }: Props) {
  const [selectedPkg, setSelectedPkg] = useState<PackageTemplate | null>(packages[0] || null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [showCta, setShowCta] = useState(true);
  const [ctaText, setCtaText] = useState('Book Now');
  const [ctaLink, setCtaLink] = useState('');
  const [showContact, setShowContact] = useState(true);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [adImages, setAdImages] = useState<AdImage[]>([]);
  const [selectedImgId, setSelectedImgId] = useState<number | null>(null);
  const [imgSearch, setImgSearch] = useState('');
  const [imgResults, setImgResults] = useState<{ src: string; label: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showImgPanel, setShowImgPanel] = useState(false);
  const [dragging, setDragging] = useState<{ id: number; startX: number; startY: number; imgX: number; imgY: number } | null>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const title = customTitle || selectedPkg?.name || 'Your Dream Vacation';
  const subtitle = customSubtitle || selectedPkg?.description || 'Experience luxury travel like never before';
  const price = selectedPkg?.priceLabel || '';
  const destinations = selectedPkg?.destinations?.join(' / ') || '';

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const s = selectedSize;
      const pw = s.w * s.scale;
      setAdImages((prev) => [...prev, { id: imgIdCounter++, src: reader.result as string, x: pw * 0.1, y: 10, width: pw * 0.35, height: pw * 0.25, label: file.name }]);
    };
    reader.readAsDataURL(file);
  };

  const handleSearchImages = async () => {
    if (!imgSearch.trim()) return;
    setSearching(true);
    try {
      // Use Unsplash source for free images (no API key needed)
      const results = [];
      const terms = imgSearch.trim().replace(/\s+/g, ',');
      for (let i = 0; i < 6; i++) {
        results.push({ src: `https://source.unsplash.com/800x600/?${terms}&sig=${Date.now() + i}`, label: `${imgSearch} ${i + 1}` });
      }
      setImgResults(results);
    } catch { setImgResults([]); }
    setSearching(false);
  };

  const addImageFromUrl = (src: string, label: string) => {
    const s = selectedSize;
    const pw = s.w * s.scale;
    setAdImages((prev) => [...prev, { id: imgIdCounter++, src, x: pw * 0.1, y: 10, width: pw * 0.35, height: pw * 0.25, label }]);
  };

  const removeImage = (id: number) => {
    setAdImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImgId === id) setSelectedImgId(null);
  };

  const resizeImage = (id: number, delta: number) => {
    setAdImages((prev) => prev.map((img) => img.id === id ? { ...img, width: Math.max(30, img.width + delta), height: Math.max(20, img.height + delta * (img.height / img.width)) } : img));
  };

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    const img = adImages.find((i) => i.id === id);
    if (!img) return;
    setSelectedImgId(id);
    setDragging({ id, startX: e.clientX, startY: e.clientY, imgX: img.x, imgY: img.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    setAdImages((prev) => prev.map((img) => img.id === dragging.id ? { ...img, x: dragging.imgX + dx, y: dragging.imgY + dy } : img));
  }, [dragging]);

  const handleMouseUp = () => setDragging(null);

  // Canvas-based download that actually works
  const handleDownload = async () => {
    const s = selectedSize;
    const t = selectedTemplate;
    const canvas = document.createElement('canvas');
    canvas.width = s.w; canvas.height = s.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { alert('Canvas not supported'); return; }

    const scale = s.w / (s.w * s.scale);

    // Draw background
    if (bgImage) {
      try {
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = bgImage; });
        ctx.drawImage(img, 0, 0, s.w, s.h);
        // overlay
        const grad = ctx.createLinearGradient(0, 0, 0, s.h);
        grad.addColorStop(0, 'rgba(0,0,0,0.3)'); grad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, s.w, s.h);
      } catch { /* fallback to gradient */ }
    } else {
      // Parse gradient
      const grd = ctx.createLinearGradient(0, 0, s.w, s.h);
      const colors = t.bg.match(/#[0-9a-f]{6}/gi) || ['#1a1a2e', '#16213e'];
      grd.addColorStop(0, colors[0]); grd.addColorStop(1, colors[1] || colors[0]);
      ctx.fillStyle = grd; ctx.fillRect(0, 0, s.w, s.h);
    }

    const tc = bgImage ? '#ffffff' : t.textColor;
    const ac = bgImage ? '#fbbf24' : t.accent;
    const pad = s.w * 0.06;

    // Agency name
    ctx.fillStyle = ac; ctx.fillRect(pad, pad, 80 * scale / 3, 80 * scale / 3);
    ctx.fillStyle = '#000'; ctx.font = `bold ${Math.round(36 * scale / 3)}px DM Sans, sans-serif`;
    ctx.textAlign = 'center'; ctx.fillText(agencyProfile.name.charAt(0), pad + 40 * scale / 3, pad + 55 * scale / 3);
    ctx.fillStyle = tc; ctx.font = `600 ${Math.round(33 * scale / 3)}px DM Sans, sans-serif`;
    ctx.textAlign = 'left'; ctx.globalAlpha = 0.9;
    ctx.fillText(agencyProfile.name, pad + 100 * scale / 3, pad + 55 * scale / 3);
    ctx.globalAlpha = 1;

    // Destinations
    if (destinations) {
      ctx.fillStyle = ac; ctx.font = `bold ${Math.round(30 * scale / 3)}px DM Sans, sans-serif`;
      ctx.letterSpacing = '3px'; ctx.fillText(destinations.toUpperCase(), pad, s.h * 0.42);
    }

    // Title
    ctx.fillStyle = tc; ctx.font = `800 ${Math.round(66 * scale / 3)}px DM Sans, sans-serif`;
    if (bgImage) ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = bgImage ? 16 : 0;
    const titleLines = wrapText(ctx, title, s.w - pad * 2);
    let ty = s.h * 0.48;
    titleLines.forEach((line) => { ctx.fillText(line, pad, ty); ty += 70 * scale / 3; });
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = tc; ctx.globalAlpha = bgImage ? 0.85 : 0.7;
    ctx.font = `400 ${Math.round(30 * scale / 3)}px DM Sans, sans-serif`;
    const subLines = wrapText(ctx, subtitle.length > 200 ? subtitle.slice(0, 200) + '...' : subtitle, s.w * 0.85 - pad);
    subLines.forEach((line) => { ctx.fillText(line, pad, ty + 10); ty += 40 * scale / 3; });
    ctx.globalAlpha = 1;

    // Price
    if (price) {
      ctx.fillStyle = ac; ctx.font = `800 ${Math.round(42 * scale / 3)}px DM Sans, sans-serif`;
      ctx.fillText(price, pad, s.h - pad - (showContact ? 80 * scale / 3 : 20));
    }

    // CTA
    if (showCta) {
      const ctaW = ctx.measureText(ctaText).width + 60 * scale / 3;
      const ctaX = s.w - pad - ctaW; const ctaY = s.h - pad - (showContact ? 100 * scale / 3 : 40);
      ctx.fillStyle = bgImage ? '#ffffff' : t.accent;
      roundRect(ctx, ctaX, ctaY, ctaW, 50 * scale / 3, 25 * scale / 3);
      ctx.fill();
      ctx.fillStyle = bgImage ? '#000' : (t.id === 'modern' ? '#fff' : '#000');
      ctx.font = `700 ${Math.round(28 * scale / 3)}px DM Sans, sans-serif`;
      ctx.textAlign = 'center'; ctx.fillText(ctaText, ctaX + ctaW / 2, ctaY + 33 * scale / 3);
      ctx.textAlign = 'left';
    }

    // Contact
    if (showContact) {
      const contactY = s.h - pad;
      ctx.strokeStyle = bgImage ? 'rgba(255,255,255,0.2)' : (t.accent + '30');
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, contactY - 30 * scale / 3); ctx.lineTo(s.w - pad, contactY - 30 * scale / 3); ctx.stroke();
      ctx.fillStyle = tc; ctx.globalAlpha = bgImage ? 0.7 : 0.5;
      ctx.font = `400 ${Math.round(22 * scale / 3)}px DM Sans, sans-serif`;
      ctx.textAlign = 'center';
      const contact = [agencyProfile.phone, agencyProfile.email, agencyProfile.address].filter(Boolean).join('  |  ');
      ctx.fillText(contact, s.w / 2, contactY - 5);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }

    // Overlay images
    for (const adImg of adImages) {
      try {
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = adImg.src; });
        ctx.drawImage(img, adImg.x * scale, adImg.y * scale, adImg.width * scale, adImg.height * scale);
      } catch { /* skip broken images */ }
    }

    // Download
    const link = document.createElement('a');
    link.download = `${(selectedPkg?.name || 'marketing').replace(/[^a-zA-Z0-9]/g, '_')}_${s.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    // Try native share API first
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: title, text: `${title} - ${subtitle}`, url: ctaLink || window.location.href });
        return;
      } catch { /* fallback */ }
    }
    // Fallback: copy link
    const text = `${title}\n${subtitle}\n${price ? price + '\n' : ''}${ctaLink ? ctaLink + '\n' : ''}${agencyProfile.name} | ${agencyProfile.phone} | ${agencyProfile.email}`;
    try {
      await navigator.clipboard.writeText(text);
      alert('Ad text copied to clipboard! You can paste it into WhatsApp, email, etc.');
    } catch {
      alert('Could not copy. Please take a screenshot of the preview.');
    }
  };

  const renderPreview = () => {
    const s = selectedSize;
    const t = selectedTemplate;
    const pw = s.w * s.scale;
    const ph = s.h * s.scale;
    const pad = pw * 0.06;
    const isFlyer = s.id === 'flyer';
    const isBanner = s.id === 'banner';
    const titleSize = isFlyer ? 26 : isBanner ? 18 : 22;
    const subSize = isFlyer ? 11 : 10;
    const priceSize = isFlyer ? 16 : 13;

    return (
      <div id="marketing-preview" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ width: pw, height: ph, background: bgImage ? `url(${bgImage}) center/cover no-repeat` : t.bg, borderRadius: isFlyer ? 0 : 16, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: pad, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: dragging ? 'grabbing' : 'default' }}>
        {bgImage && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)' }} />}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {agencyProfile.logo ? (<img src={agencyProfile.logo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />) : (<div style={{ width: 28, height: 28, borderRadius: 6, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.id === 'modern' && !bgImage ? '#fff' : '#000', fontSize: 12, fontWeight: 800 }}>{agencyProfile.name.charAt(0)}</div>)}
            <span style={{ color: bgImage ? '#ffffff' : t.textColor, fontSize: 11, fontWeight: 600, opacity: 0.9 }}>{agencyProfile.name}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {destinations && <p style={{ color: bgImage ? '#fbbf24' : t.accent, fontSize: isFlyer ? 11 : 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{destinations}</p>}
            <h2 style={{ color: bgImage ? '#ffffff' : t.textColor, fontSize: titleSize, fontWeight: 800, lineHeight: 1.2, marginBottom: 8, textShadow: bgImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none' }}>{title}</h2>
            <p style={{ color: bgImage ? 'rgba(255,255,255,0.85)' : t.textColor, fontSize: subSize, opacity: bgImage ? 1 : 0.7, lineHeight: 1.5, maxWidth: '85%' }}>{subtitle.length > (isFlyer ? 200 : 100) ? subtitle.slice(0, isFlyer ? 200 : 100) + '...' : subtitle}</p>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showContact ? 10 : 0 }}>
              {price && <p style={{ color: bgImage ? '#fbbf24' : t.accent, fontSize: priceSize, fontWeight: 800 }}>{price}</p>}
              {showCta && (<span style={{ background: bgImage ? '#ffffff' : t.accent, color: bgImage ? '#000' : (t.id === 'modern' ? '#fff' : '#000'), padding: '6px 16px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{ctaText}</span>)}
            </div>
            {showContact && (<div style={{ borderTop: `1px solid ${bgImage ? 'rgba(255,255,255,0.2)' : (t.accent + '30')}`, paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isFlyer ? 16 : 10, flexWrap: 'wrap' }}>{agencyProfile.phone && <span style={{ color: bgImage ? 'rgba(255,255,255,0.7)' : t.textColor, fontSize: 8, opacity: bgImage ? 1 : 0.5 }}>{agencyProfile.phone}</span>}{agencyProfile.email && <span style={{ color: bgImage ? 'rgba(255,255,255,0.7)' : t.textColor, fontSize: 8, opacity: bgImage ? 1 : 0.5 }}>{agencyProfile.email}</span>}{agencyProfile.address && <span style={{ color: bgImage ? 'rgba(255,255,255,0.7)' : t.textColor, fontSize: 8, opacity: bgImage ? 1 : 0.5 }}>{agencyProfile.address}</span>}</div>)}
          </div>
        </div>
        {/* Overlay images - draggable */}
        {adImages.map((img) => (<div key={img.id} onMouseDown={(e) => handleMouseDown(e, img.id)} onClick={() => setSelectedImgId(img.id)} style={{ position: 'absolute', left: img.x, top: img.y, width: img.width, height: img.height, zIndex: 10, cursor: dragging?.id === img.id ? 'grabbing' : 'grab', border: selectedImgId === img.id ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: 8, overflow: 'hidden' }}><img src={img.src} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /></div>))}
        {!bgImage && <><div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: t.accent, opacity: 0.05 }} /><div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: t.accent, opacity: 0.08 }} /></>}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold mb-1" style={{ color: GHL.text }}>Marketing Graphics</h2><p className="text-sm" style={{ color: GHL.muted }}>Generate branded marketing materials for your packages</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          {/* Package */}
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Package</p>
            <div className="space-y-1">{packages.map((pkg) => (<button key={pkg.id} onClick={() => { setSelectedPkg(pkg); setCustomTitle(''); setCustomSubtitle(''); }} className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all" style={selectedPkg?.id === pkg.id ? { background: GHL.accentLight, color: GHL.accent, fontWeight: 600 } : { color: GHL.text }}>{pkg.name}</button>))}{packages.length === 0 && <p className="text-xs" style={{ color: GHL.muted }}>Create packages first</p>}</div>
          </div>

          {/* Images section - Background + overlay images + search */}
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Images</p>
              <button onClick={() => setShowImgPanel(!showImgPanel)} className="text-[10px] font-medium px-2 py-1 rounded" style={{ color: GHL.accent, background: showImgPanel ? GHL.accentLight : 'transparent' }}>{showImgPanel ? 'Close Search' : 'Search Images'}</button>
            </div>

            {/* Background */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold mb-1" style={{ color: GHL.muted }}>Background</p>
              <div className="flex items-center gap-2">
                {bgImage ? (<div className="w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: GHL.border }}><img src={bgImage} alt="" className="w-full h-full object-cover" /></div>) : (<div className="w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-blue-300" style={{ borderColor: GHL.border }} onClick={() => bgFileRef.current?.click()}><Icon n="plus" c="w-3.5 h-3.5" /></div>)}
                <div>
                  <button onClick={() => bgFileRef.current?.click()} className="text-[10px] font-medium px-2 py-1 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.accent }}>{bgImage ? 'Change' : 'Upload'}</button>
                  {bgImage && <button onClick={() => setBgImage(null)} className="text-[10px] ml-1 text-red-400">Remove</button>}
                </div>
              </div>
              <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
            </div>

            {/* Add overlay image */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold mb-1" style={{ color: GHL.muted }}>Add Picture to Ad</p>
              <div className="flex gap-2">
                <button onClick={() => imgFileRef.current?.click()} className="flex-1 text-[10px] font-medium px-2 py-2 rounded-lg border hover:bg-gray-50 text-center" style={{ borderColor: GHL.border, color: GHL.text }}><Icon n="plus" c="w-3 h-3 inline mr-1" />Upload Image</button>
                <button onClick={() => setShowImgPanel(!showImgPanel)} className="flex-1 text-[10px] font-medium px-2 py-2 rounded-lg border hover:bg-gray-50 text-center" style={{ borderColor: GHL.border, color: GHL.text }}><Icon n="search" c="w-3 h-3 inline mr-1" />Search</button>
              </div>
              <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleImgUpload} />
            </div>

            {/* Image search panel */}
            {showImgPanel && (
              <div className="border rounded-lg p-3 mb-3" style={{ borderColor: GHL.border, background: GHL.bg }}>
                <div className="flex gap-1 mb-2">
                  <input value={imgSearch} onChange={(e) => setImgSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchImages()} placeholder="Search images (e.g. beach sunset)" className="flex-1 px-2 py-1.5 border rounded text-xs" style={{ borderColor: GHL.border }} />
                  <button onClick={handleSearchImages} disabled={searching} className="px-2 py-1.5 rounded text-xs font-semibold text-white" style={{ background: GHL.accent }}>{searching ? '...' : 'Go'}</button>
                </div>
                {imgResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-1">
                    {imgResults.map((r, i) => (<button key={i} onClick={() => addImageFromUrl(r.src, r.label)} className="relative rounded overflow-hidden border hover:border-blue-400 aspect-square" style={{ borderColor: GHL.border }}><img src={r.src} alt={r.label} className="w-full h-full object-cover" /><span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[7px] px-1 py-0.5 truncate">+ Add</span></button>))}
                  </div>
                )}
                {imgResults.length === 0 && !searching && <p className="text-[9px] text-center" style={{ color: GHL.muted }}>Search for travel photos to add to your ad</p>}
              </div>
            )}

            {/* Overlay images list */}
            {adImages.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold mb-1" style={{ color: GHL.muted }}>Pictures on Ad ({adImages.length})</p>
                <div className="space-y-1">{adImages.map((img) => (<div key={img.id} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: selectedImgId === img.id ? GHL.accentLight : GHL.bg }}>
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0"><img src={img.src} alt="" className="w-full h-full object-cover" /></div>
                  <span className="flex-1 text-[10px] truncate" style={{ color: GHL.text }}>{img.label}</span>
                  <button onClick={() => resizeImage(img.id, -10)} className="text-[10px] px-1 py-0.5 rounded" style={{ color: GHL.muted }}>-</button>
                  <button onClick={() => resizeImage(img.id, 10)} className="text-[10px] px-1 py-0.5 rounded" style={{ color: GHL.muted }}>+</button>
                  <button onClick={() => removeImage(img.id)} className="text-[10px] text-red-400 px-1">X</button>
                </div>))}</div>
                <p className="text-[8px] mt-1" style={{ color: GHL.muted }}>Drag images on the preview to position them. Use +/- to resize.</p>
              </div>
            )}
          </div>

          {/* Style */}
          {!bgImage && (<div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Style</p><div className="grid grid-cols-3 gap-2">{TEMPLATES.map((t) => (<button key={t.id} onClick={() => setSelectedTemplate(t)} className="rounded-lg p-2 text-center transition-all" style={{ background: selectedTemplate.id === t.id ? GHL.accentLight : GHL.bg, border: selectedTemplate.id === t.id ? `2px solid ${GHL.accent}` : '2px solid transparent' }}><div style={{ width: '100%', height: 24, borderRadius: 4, background: t.bg }} /><p className="text-[9px] mt-1" style={{ color: GHL.text }}>{t.name}</p></button>))}</div></div>)}

          {/* Size */}
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Size</p>
            <div className="grid grid-cols-2 gap-2">{SIZES.map((s) => (<button key={s.id} onClick={() => setSelectedSize(s)} className="px-3 py-2 rounded-lg text-xs font-medium transition-all" style={selectedSize.id === s.id ? { background: GHL.accentLight, color: GHL.accent, border: `1px solid ${GHL.accent}` } : { background: GHL.bg, color: GHL.muted, border: `1px solid ${GHL.border}` }}>{s.name}<br /><span className="text-[9px] opacity-60">{s.id === 'flyer' ? '8.5 x 11 in' : `${s.w}x${s.h}`}</span></button>))}</div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Content</p>
            <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Custom headline..." className="w-full px-3 py-2 border rounded-lg text-sm mb-2" style={{ borderColor: GHL.border }} />
            <input value={customSubtitle} onChange={(e) => setCustomSubtitle(e.target.value)} placeholder="Custom subtitle..." className="w-full px-3 py-2 border rounded-lg text-sm mb-3" style={{ borderColor: GHL.border }} />
            <div className="flex items-center gap-2 mb-2"><button onClick={() => setShowCta(!showCta)} className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0" style={showCta ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{showCta && <Icon n="check" c="w-2.5 h-2.5 text-white" />}</button><span className="text-xs" style={{ color: GHL.text }}>CTA Button</span></div>
            {showCta && (<div className="space-y-2 ml-6"><input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Button text" className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="Link URL" className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /></div>)}
            <div className="flex items-center gap-2 mt-3"><button onClick={() => setShowContact(!showContact)} className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0" style={showContact ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{showContact && <Icon n="check" c="w-2.5 h-2.5 text-white" />}</button><span className="text-xs" style={{ color: GHL.text }}>Show company contact info</span></div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Preview</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px]" style={{ color: GHL.muted }}>{selectedSize.id === 'flyer' ? '8.5 x 11 in' : `${selectedSize.w}x${selectedSize.h}px`}</p>
                <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: GHL.accent, color: GHL.accent }}><Icon n="globe" c="w-3 h-3" /> Share</button>
                <button onClick={handleDownload} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: GHL.accent }}><Icon n="download" c="w-3 h-3" /> Download</button>
              </div>
            </div>
            <div className="flex items-center justify-center p-6 rounded-xl" style={{ background: '#f8f9fb', minHeight: 300 }}>{renderPreview()}</div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs" style={{ color: GHL.muted }}>{adImages.length > 0 ? 'Drag images to reposition. Download saves at full resolution.' : 'Download saves at full resolution.'}</p>
              {ctaLink && <p className="text-[10px] px-2 py-1 rounded" style={{ background: GHL.bg, color: GHL.muted }}>CTA: {ctaLink}</p>}
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Helper: wrap text to fit width
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Helper: rounded rectangle
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
