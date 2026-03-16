'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { PackageTemplate, AgencyProfile } from '@/lib/types';

interface Props { packages: PackageTemplate[]; agencyProfile: AgencyProfile; }

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
  { id: 'story', name: 'Instagram Story', w: 1080, h: 1920, scale: 0.2 },
  { id: 'facebook', name: 'Facebook Post', w: 1200, h: 630, scale: 0.35 },
  { id: 'banner', name: 'Email Banner', w: 600, h: 200, scale: 0.6 },
];

export default function MarketingGraphics({ packages, agencyProfile }: Props) {
  const [selectedPkg, setSelectedPkg] = useState<PackageTemplate | null>(packages[0] || null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [showCta, setShowCta] = useState(true);
  const [ctaText, setCtaText] = useState('Book Now');

  const title = customTitle || selectedPkg?.name || 'Your Dream Vacation';
  const subtitle = customSubtitle || selectedPkg?.description || 'Experience luxury travel like never before';
  const price = selectedPkg?.priceLabel || '';
  const destinations = selectedPkg?.destinations?.join(' \u2022 ') || '';

  const renderPreview = () => {
    const s = selectedSize;
    const t = selectedTemplate;
    return (
      <div id="marketing-preview" style={{ width: s.w * s.scale, height: s.h * s.scale, background: t.bg, borderRadius: 16, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: s.w * s.scale * 0.06, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Agency logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.id === 'modern' ? '#fff' : '#000', fontSize: 12, fontWeight: 800 }}>{agencyProfile.name.charAt(0)}</div>
          <span style={{ color: t.textColor, fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{agencyProfile.name}</span>
        </div>
        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {destinations && <p style={{ color: t.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{destinations}</p>}
          <h2 style={{ color: t.textColor, fontSize: s.id === 'banner' ? 18 : 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>{title}</h2>
          <p style={{ color: t.textColor, fontSize: 10, opacity: 0.7, lineHeight: 1.4, maxWidth: '85%' }}>{subtitle.length > 100 ? subtitle.slice(0, 100) + '...' : subtitle}</p>
        </div>
        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {price && <p style={{ color: t.accent, fontSize: 13, fontWeight: 800 }}>{price}</p>}
          {showCta && <span style={{ background: t.accent, color: t.id === 'modern' ? '#fff' : '#000', padding: '6px 16px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{ctaText}</span>}
        </div>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: t.accent, opacity: 0.05 }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: t.accent, opacity: 0.08 }} />
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold mb-1" style={{ color: GHL.text }}>Marketing Graphics</h2><p className="text-sm" style={{ color: GHL.muted }}>Generate branded marketing materials for your packages</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Package selector */}
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Package</p>
            <div className="space-y-1">{packages.map((pkg) => (<button key={pkg.id} onClick={() => { setSelectedPkg(pkg); setCustomTitle(''); setCustomSubtitle(''); }} className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all" style={selectedPkg?.id === pkg.id ? { background: GHL.accentLight, color: GHL.accent, fontWeight: 600 } : { color: GHL.text }}>{pkg.name}</button>))}
            {packages.length === 0 && <p className="text-xs" style={{ color: GHL.muted }}>Create packages first</p>}</div>
          </div>
          {/* Style */}
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Style</p>
            <div className="grid grid-cols-3 gap-2">{TEMPLATES.map((t) => (<button key={t.id} onClick={() => setSelectedTemplate(t)} className="rounded-lg p-2 text-center transition-all" style={{ background: selectedTemplate.id === t.id ? GHL.accentLight : GHL.bg, border: selectedTemplate.id === t.id ? `2px solid ${GHL.accent}` : '2px solid transparent' }}><div style={{ width: '100%', height: 24, borderRadius: 4, background: t.bg }} /><p className="text-[9px] mt-1" style={{ color: GHL.text }}>{t.name}</p></button>))}</div>
          </div>
          {/* Size */}
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Size</p>
            <div className="grid grid-cols-2 gap-2">{SIZES.map((s) => (<button key={s.id} onClick={() => setSelectedSize(s)} className="px-3 py-2 rounded-lg text-xs font-medium transition-all" style={selectedSize.id === s.id ? { background: GHL.accentLight, color: GHL.accent, border: `1px solid ${GHL.accent}` } : { background: GHL.bg, color: GHL.muted, border: `1px solid ${GHL.border}` }}>{s.name}<br /><span className="text-[9px] opacity-60">{s.w}x{s.h}</span></button>))}</div>
          </div>
          {/* Custom text */}
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Customize</p>
            <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Custom headline..." className="w-full px-3 py-2 border rounded-lg text-sm mb-2" style={{ borderColor: GHL.border }} />
            <input value={customSubtitle} onChange={(e) => setCustomSubtitle(e.target.value)} placeholder="Custom subtitle..." className="w-full px-3 py-2 border rounded-lg text-sm mb-2" style={{ borderColor: GHL.border }} />
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCta(!showCta)} className="w-4 h-4 rounded border flex items-center justify-center" style={showCta ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{showCta && <Icon n="check" c="w-2.5 h-2.5 text-white" />}</button>
              <span className="text-xs" style={{ color: GHL.text }}>Show CTA button</span>
            </div>
            {showCta && <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="CTA text" className="w-full px-3 py-2 border rounded-lg text-sm mt-2" style={{ borderColor: GHL.border }} />}
          </div>
        </div>
        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Preview</p>
              <p className="text-[10px]" style={{ color: GHL.muted }}>{selectedSize.w} x {selectedSize.h}px</p>
            </div>
            <div className="flex items-center justify-center p-6 rounded-xl" style={{ background: '#f8f9fb', minHeight: 300 }}>
              {renderPreview()}
            </div>
            <p className="text-xs text-center mt-3" style={{ color: GHL.muted }}>Right-click the preview to save as image, or use screenshot tools</p>
          </div>
        </div>
      </div>
    </div>
  );
}
