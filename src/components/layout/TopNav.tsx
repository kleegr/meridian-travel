'use client';

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
}

export default function TopNav({ navItems, page, onNavigate, agencyProfile, globalSearch, setGlobalSearch, onNewItinerary }: TopNavProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-20 shadow-sm" style={{ borderColor: GHL.border }}>
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 pr-4 border-r" style={{ borderColor: GHL.border }}>
            <div className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-xs" style={{ background: GHL.accent }}>{agencyProfile.name.charAt(0).toUpperCase()}</div>
            <span className="font-bold text-sm hidden sm:block" style={{ color: GHL.text }}>{agencyProfile.name}</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = page === item.id || (page === 'detail' && item.id === 'itineraries');
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={active
                    ? { background: GHL.accentLight, color: GHL.accent }
                    : { color: GHL.muted }
                  }
                >
                  <Icon n={item.icon} c="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + New */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: GHL.muted }}><Icon n="search" c="w-3.5 h-3.5" /></span>
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onBlur={() => setTimeout(() => setGlobalSearch(''), 200)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 border rounded-md text-xs w-44 focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ borderColor: GHL.border }}
            />
          </div>
          <button
            onClick={onNewItinerary}
            className="inline-flex items-center gap-1.5 text-white rounded-md px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
            style={{ background: GHL.accent }}
          >
            <Icon n="plus" c="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Itinerary</span>
          </button>
        </div>
      </div>
    </header>
  );
}
