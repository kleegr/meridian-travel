'use client';

import Icon from '@/components/ui/Icon';
import { GHL } from '@/lib/constants';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface MobileNavProps {
  navItems: NavItem[];
  page: string;
  onNavigate: (id: string) => void;
}

export default function MobileNav({
  navItems,
  page,
  onNavigate,
}: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20 shadow-lg">
      {navItems.slice(0, 5).map((item) => {
        const active =
          page === item.id ||
          (page === 'detail' && item.id === 'itineraries');
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex-1 flex flex-col items-center py-3 text-xs font-medium"
            style={{ color: active ? GHL.accent : '#9ca3af' }}
          >
            <Icon n={item.icon} c="w-5 h-5 mb-1" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
