'use client';

import { useState, useEffect, useRef } from 'react';
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
  onNewPackage?: () => void;
  showBanner?: boolean;
}

// Group nav items for better visual hierarchy
const NAV_GROUPS = [
  { items: ['dashboard', 'itineraries', 'packages'], label: 'Core' },
  { items: ['explore', 'marketing', 'travelers'], label: 'Tools' },
  { items: ['financials', 'automations', 'settings'], label: 'System' },
];

export default function TopNav({ navItems, page, onNavigate, agencyProfile, globalSearch, setGlobalSearch, onNewItinerary, onNewPackage, showBanner = true }: TopNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="bg-white border-b sticky top-0 z-20" style={{ borderColor: GHL.border }}>
      {/* Main nav bar */}
      <div className="flex items-center justify-between px-5 h-14">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 pr-5 border-r" style={{ borderColor: GHL.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-sm" style={{ background: `linear-gradient(135deg, ${GHL.sidebar}, ${GHL.accent})` }}>{agencyProfile.name.charAt(0).toUpperCase()}</div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm leading-tight" style={{ color: GHL.text }}>{agencyProfile.name}</p>
              <p className="text-[9px] leading-tight" style={{ color: GHL.muted }}>Travel CRM</p>
            </div>
          </div>

          {/* Desktop Nav - grouped with subtle separators */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item, i) => {
              const active = page === item.id || (page === 'detail' && item.id === 'itineraries');
              const isGroupStart = NAV_GROUPS.some(g => g.items[0] === item.id && i > 0);
              return (
                <div key={item.id} className="flex items-center">
                  {isGroupStart && <div className="w-px h-5 mx-1.5" style={{ background: GHL.border }} />}
                  <button onClick={() => onNavigate(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-gray-50" style={active ? { background: GHL.accentLight, color: GHL.accent, fontWeight: 600 } : { color: GHL.muted }}>
                    <Icon n={item.icon} c="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-2 rounded-lg hover:bg-gray-50" style={{ color: GHL.muted }}>
            <Icon n={showMobileMenu ? 'x' : 'list'} c="w-5 h-5" />
          </button>
        </div>

        {/* Right: Search + New */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: GHL.muted }}><Icon n="search" c="w-3.5 h-3.5" /></span>
            <input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Search itineraries..." className="pl-9 pr-3 py-2 border rounded-lg text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:w-64 transition-all" style={{ borderColor: GHL.border }} />
          </div>
          <div className="relative" ref={dropRef}>
            <button onClick={() => setShowDropdown(!showDropdown)} className="inline-flex items-center gap-1.5 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 shadow-sm transition-all" style={{ background: GHL.accent }}>
              <Icon n="plus" c="w-4 h-4" /><span className="hidden sm:inline">New</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-0.5"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border shadow-xl z-50 overflow-hidden" style={{ borderColor: GHL.border }}>
                <button onClick={() => { setShowDropdown(false); onNewItinerary(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-blue-50/50 transition-colors text-left" style={{ color: GHL.text }}>
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: GHL.accentLight, color: GHL.accent }}><Icon n="map" c="w-4 h-4" /></span>
                  <div><p className="font-semibold text-xs">New Itinerary</p><p className="text-[10px]" style={{ color: GHL.muted }}>Create a trip from scratch</p></div>
                </button>
                <div className="h-px mx-3" style={{ background: GHL.border }} />
                <button onClick={() => { setShowDropdown(false); onNewPackage?.(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-blue-50/50 transition-colors text-left" style={{ color: GHL.text }}>
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#ecfdf5', color: '#10b981' }}><Icon n="globe" c="w-4 h-4" /></span>
                  <div><p className="font-semibold text-xs">New Package</p><p className="text-[10px]" style={{ color: GHL.muted }}>Reusable trip template</p></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t p-3" style={{ borderColor: GHL.border, background: GHL.bg }}>
          <div className="grid grid-cols-3 gap-1">
            {navItems.map((item) => {
              const active = page === item.id;
              return (
                <button key={item.id} onClick={() => { onNavigate(item.id); setShowMobileMenu(false); }} className="flex flex-col items-center gap-1 py-3 rounded-lg" style={{ background: active ? GHL.accentLight : 'transparent', color: active ? GHL.accent : GHL.muted }}>
                  <Icon n={item.icon} c="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
