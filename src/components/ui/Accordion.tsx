'use client';

import { useState } from 'react';
import Icon from './Icon';
import { GHL } from '@/lib/constants';

interface AccordionProps {
  title: string;
  icon: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onAdd?: () => void;
}

export default function Accordion({ title, icon, count, children, defaultOpen = false, onAdd }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-sm border" style={{ borderColor: GHL.border }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: open ? GHL.accentLight : GHL.bg, color: GHL.accent }}>
            <Icon n={icon} c="w-4 h-4" />
          </span>
          <span className="font-semibold text-sm" style={{ color: GHL.text }}>{title}</span>
          {count !== undefined && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={count > 0 ? { background: GHL.accentLight, color: GHL.accent } : { background: GHL.bg, color: GHL.muted }}>
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAdd && (
            <span onClick={(e) => { e.stopPropagation(); onAdd(); }} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer" style={{ color: GHL.accent }}>
              <Icon n="plus" c="w-4 h-4" />
            </span>
          )}
          <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: GHL.muted }}>
            <Icon n="chevronDown" c="w-4 h-4" />
          </span>
        </div>
      </button>
      {open && <div className="border-t px-5 py-4" style={{ borderColor: GHL.border }}>{children}</div>}
    </div>
  );
}
