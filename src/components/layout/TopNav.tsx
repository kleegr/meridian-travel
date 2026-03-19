'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import { GHL } from '@/lib/constants';
import type { AgencyProfile } from '@/lib/types';

interface NavItem { id: string; label: string; icon: string; }
interface TopNavProps {
  navItems: NavItem[]; page: string; onNavigate: (id: string) => void;
  agencyProfile: AgencyProfile; globalSearch: string; setGlobalSearch: (v: string) => void;
  onNewItinerary: () => void; onNewPackage?: () => void; showBanner?: boolean;
}

const CORE_IDS = ['dashboard', 'itineraries'];
const GROUPS = [
  { label: 'Plan', icon: 'globe', ids: ['packages', 'explore', 'marketing'] },
  { label: 'Manage', icon: 'users', ids: ['travelers', 'financials', 'automations'] },
];
const ALWAYS_VISIBLE = ['settings'];

function AirplaneBanner() {
  const [pos, setPos] = useState(-10);
  useEffect(() => { const i = setInterval(() => setPos(p => p >= 110 ? -10 : p + 0.15), 30); return () => clearInterval(i); }, []);
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 38, background: 'linear-gradient(90deg, #093168 0%, #1a4f9e 50%, #093168 100%)' }}>
      {[12, 28, 45, 62, 78, 88].map((l, i) => (<div key={i} className="absolute rounded-full animate-pulse" style={{ left: `${l}%`, top: i % 2 === 0 ? 6 : 22, width: 2, height: 2, background: 'rgba(255,255,255,0.4)', animationDelay: `${i * 0.3}s` }} />))}
      {[20, 55, 80].map((l, i) => (<div key={`c${i}`} className="absolute" style={{ left: `${l}%`, top: i % 2 === 0 ? 4 : 18, opacity: 0.08 }}><svg width="40" height="20" viewBox="0 0 40 20" fill="white"><ellipse cx="20" cy="14" rx="18" ry="6" /><ellipse cx="14" cy="10" rx="10" ry="8" /><ellipse cx="26" cy="10" rx="10" ry="8" /></svg></div>))}
      <div className="absolute" style={{ left: `${pos}%`, top: 5, transform: 'translateX(-50%)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))', transform: 'rotate(90deg)' }}><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="white" /></svg>
      </div>
      <div className="absolute" style={{ left: `${Math.max(0, pos - 18)}%`, top: 18, width: `${Math.min(18, pos + 10)}%`, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(255,255,255,0.3))' }} />
      <p className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Your Journey Starts Here</p>
    </div>
  );
}

function NavDropdown({ label, icon, items, page, onNavigate, allNavItems }: { label: string; icon: string; items: string[]; page: string; onNavigate: (id: string) => void; allNavItems: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const activeInGroup = items.includes(page);
  const visibleItems = allNavItems.filter(n => items.includes(n.id));
  if (visibleItems.length === 0) return null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all" style={activeInGroup ? { background: GHL.accentLight, color: GHL.accent } : { color: GHL.muted }}>
        <Icon n={icon} c="w-3.5 h-3.5" /><span className="hidden md:inline">{label}</span>
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className="ml-0.5 opacity-50"><path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl border shadow-xl z-50 overflow-hidden py-1" style={{ borderColor: GHL.border }}>
          {visibleItems.map(item => (
            <button key={item.id} onClick={() => { onNavigate(item.id); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-blue-50/50 transition-colors text-left" style={{ color: page === item.id ? GHL.accent : GHL.text, background: page === item.id ? GHL.accentLight : 'transparent' }}>
              <Icon n={item.icon} c="w-3.5 h-3.5" />{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopNav({ navItems, page, onNavigate, agencyProfile, globalSearch, setGlobalSearch, onNewItinerary, onNewPackage, showBanner = true }: TopNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const coreItems = navItems.filter(n => CORE_IDS.includes(n.id));
  const alwaysItems = navItems.filter(n => ALWAYS_VISIBLE.includes(n.id));
  const hasLogo = agencyProfile.logo && agencyProfile.logo.startsWith('http');

  return (
    <>
      {showBanner && <AirplaneBanner />}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex items-center justify-between px-4 py-2" dir="rtl">
          <div className="flex items-center gap-4" dir="rtl">
            <div className="flex items-center gap-2 pl-4 border-l" dir="ltr" style={{ borderColor: GHL.border }}>
              {/* Show GHL logo if available, otherwise letter initial */}
              {hasLogo ? (
                <img src={agencyProfile.logo} alt={agencyProfile.name} className="w-7 h-7 rounded-md object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-xs" style={{ background: GHL.accent }}>{(agencyProfile.name || 'K').charAt(0).toUpperCase()}</div>
              )}
              <span className="font-bold text-sm hidden sm:block" style={{ color: GHL.text }}>{agencyProfile.name}</span>
            </div>
            <nav className="flex items-center gap-0.5" dir="ltr">
              {coreItems.map(item => {
                const active = page === item.id || (page === 'detail' && item.id === 'itineraries');
                return <button key={item.id} onClick={() => onNavigate(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all" style={active ? { background: GHL.accentLight, color: GHL.accent } : { color: GHL.muted }}><Icon n={item.icon} c="w-3.5 h-3.5" /><span className="hidden md:inline">{item.label}</span></button>;
              })}
              {GROUPS.map(g => <NavDropdown key={g.label} label={g.label} icon={g.icon} items={g.ids} page={page} onNavigate={onNavigate} allNavItems={navItems} />)}
              {alwaysItems.map(item => {
                const active = page === item.id;
                return <button key={item.id} onClick={() => onNavigate(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all" style={active ? { background: GHL.accentLight, color: GHL.accent } : { color: GHL.muted }}><Icon n={item.icon} c="w-3.5 h-3.5" /><span className="hidden md:inline">{item.label}</span></button>;
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2" dir="ltr">
            <div className="relative hidden sm:block"><span className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: GHL.muted }}><Icon n="search" c="w-3.5 h-3.5" /></span><input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} onBlur={() => setTimeout(() => setGlobalSearch(''), 200)} placeholder="Search..." className="pl-8 pr-3 py-1.5 border rounded-md text-xs w-44 focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /></div>
            <div className="relative" ref={dropRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} className="inline-flex items-center gap-1.5 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 shadow-sm" style={{ background: GHL.accent }}>
                <Icon n="plus" c="w-4 h-4" /><span className="hidden sm:inline">New</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-0.5"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border shadow-xl z-50 overflow-hidden" style={{ borderColor: GHL.border }}>
                  <button onClick={() => { setShowDropdown(false); onNewItinerary(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors text-left" style={{ color: GHL.text }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GHL.accentLight, color: GHL.accent }}><Icon n="map" c="w-4 h-4" /></span>
                    <div><p className="font-semibold text-xs">New Itinerary</p><p className="text-[10px]" style={{ color: GHL.muted }}>Create from scratch</p></div>
                  </button>
                  <div className="h-px mx-3" style={{ background: GHL.border }} />
                  <button onClick={() => { setShowDropdown(false); onNewPackage?.(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors text-left" style={{ color: GHL.text }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#ecfdf5', color: '#10b981' }}><Icon n="globe" c="w-4 h-4" /></span>
                    <div><p className="font-semibold text-xs">New Package</p><p className="text-[10px]" style={{ color: GHL.muted }}>Reusable template</p></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
