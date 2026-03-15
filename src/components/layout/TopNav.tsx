'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { GHL } from '@/lib/constants';
import type { AgencyProfile } from '@/lib/types';

interface NavItem { id: string; label: string; icon: string; }
interface TopNavProps {
  navItems: NavItem[];
  page: string;
  onNavigate: (id: string) => void;
  agencyProfile: AgencyProfile;
  globalSearch: string;
  setGlobalSearch: (v: string) => void;
  onNewItinerary: () => void;
  showBanner?: boolean;
}

function AirplaneBanner() {
  const [pos, setPos] = useState(-10);
  useEffect(() => {
    const interval = setInterval(() => setPos((p) => p >= 110 ? -10 : p + 0.15), 30);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 38, background: 'linear-gradient(90deg, #093168 0%, #1a4f9e 50%, #093168 100%)' }}>
      {[12, 28, 45, 62, 78, 88].map((l, i) => (
        <div key={i} className="absolute rounded-full animate-pulse" style={{ left: `${l}%`, top: i % 2 === 0 ? 6 : 22, width: 2, height: 2, background: 'rgba(255,255,255,0.4)', animationDelay: `${i * 0.3}s` }} />
      ))}
      {[20, 55, 80].map((l, i) => (
        <div key={`c${i}`} className="absolute" style={{ left: `${l}%`, top: i % 2 === 0 ? 4 : 18, opacity: 0.08 }}>
          <svg width="40" height="20" viewBox="0 0 40 20" fill="white"><ellipse cx="20" cy="14" rx="18" ry="6" /><ellipse cx="14" cy="10" rx="10" ry="8" /><ellipse cx="26" cy="10" rx="10" ry="8" /></svg>
        </div>
      ))}
      {/* Moving airplane — rotated 90° to fly RIGHT */}
      <div className="absolute" style={{ left: `${pos}%`, top: 5, transform: 'translateX(-50%)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))', transform: 'rotate(90deg)' }}>
          <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="white" />
        </svg>
      </div>
      {/* Trail behind airplane */}
      <div className="absolute" style={{ left: `${Math.max(0, pos - 18)}%`, top: 18, width: `${Math.min(18, pos + 10)}%`, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(255,255,255,0.3))' }} />
      <p className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.25em' }}>Your Journey Starts Here</p>
    </div>
  );
}

export default function TopNav({ navItems, page, onNavigate, agencyProfile, globalSearch, setGlobalSearch, onNewItinerary, showBanner = true }: TopNavProps) {
  return (
    <>
      {showBanner && <AirplaneBanner />}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex items-center justify-between px-4 py-2" dir="rtl">
          <div className="flex items-center gap-6" dir="rtl">
            <div className="flex items-center gap-2 pl-4 border-l" dir="ltr" style={{ borderColor: GHL.border }}>
              <div className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-xs" style={{ background: GHL.accent }}>{agencyProfile.name.charAt(0).toUpperCase()}</div>
              <span className="font-bold text-sm hidden sm:block" style={{ color: GHL.text }}>{agencyProfile.name}</span>
            </div>
            <nav className="flex items-center gap-1" dir="ltr">
              {navItems.map((item) => {
                const active = page === item.id || (page === 'detail' && item.id === 'itineraries');
                return <button key={item.id} onClick={() => onNavigate(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all" style={active ? { background: GHL.accentLight, color: GHL.accent } : { color: GHL.muted }}><Icon n={item.icon} c="w-3.5 h-3.5" /><span className="hidden md:inline">{item.label}</span></button>;
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2" dir="ltr">
            <div className="relative hidden sm:block"><span className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: GHL.muted }}><Icon n="search" c="w-3.5 h-3.5" /></span><input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} onBlur={() => setTimeout(() => setGlobalSearch(''), 200)} placeholder="Search..." className="pl-8 pr-3 py-1.5 border rounded-md text-xs w-44 focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /></div>
            <button onClick={onNewItinerary} className="inline-flex items-center gap-1.5 text-white rounded-md px-3 py-1.5 text-xs font-semibold hover:opacity-90" style={{ background: GHL.accent }}><Icon n="plus" c="w-3.5 h-3.5" /><span className="hidden sm:inline">New Itinerary</span></button>
          </div>
        </div>
      </header>
    </>
  );
}
