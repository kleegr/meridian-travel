'use client';

import Icon from '@/components/ui/Icon';
import { GHL } from '@/lib/constants';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
  page: string;
  onNavigate: (id: string) => void;
  sidebarOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  navItems,
  page,
  onNavigate,
  sidebarOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed inset-y-0 left-0 z-40 w-60 shadow-lg transition-transform duration-200 flex flex-col`}
        style={{ background: GHL.sidebar }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm"
              style={{ background: GHL.accent }}
            >
              K
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">
                Kleegr
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                Travel Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              page === item.id ||
              (page === 'detail' && item.id === 'itineraries');
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={
                  active
                    ? { background: GHL.accent, color: '#fff' }
                    : { color: '#94a3b8' }
                }
              >
                <Icon n={item.icon} c="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div
          className="px-3 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: GHL.accent }}
            >
              SC
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Sarah Chen</p>
              <p className="text-xs" style={{ color: '#64748b' }}>
                Senior Agent
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
