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

export default function Accordion({
  title,
  icon,
  count,
  children,
  defaultOpen = false,
  onAdd,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span style={{ color: GHL.accent }}>
            <Icon n={icon} />
          </span>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          {count !== undefined && (
            <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAdd && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="p-1 rounded-md hover:bg-teal-50 transition-colors cursor-pointer"
              style={{ color: GHL.accent }}
            >
              <Icon n="plus" c="w-4 h-4" />
            </span>
          )}
          <span
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <Icon n="chevronDown" />
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 py-4">{children}</div>
      )}
    </div>
  );
}
