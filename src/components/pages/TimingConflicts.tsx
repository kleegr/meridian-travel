'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { detectTimingConflicts } from '@/lib/timing-conflicts';
import type { Itinerary } from '@/lib/types';

interface Props { itin: Itinerary; }

export default function TimingConflicts({ itin }: Props) {
  const conflicts = useMemo(() => detectTimingConflicts(itin), [itin]);

  if (conflicts.length === 0) return null;

  const errors = conflicts.filter(c => c.severity === 'error');
  const warnings = conflicts.filter(c => c.severity === 'warning');

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: errors.length > 0 ? '#fca5a5' : '#fde68a', background: errors.length > 0 ? '#fef2f2' : '#fffbeb' }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: errors.length > 0 ? '#fee2e2' : '#fef3c7' }}>
        <Icon n="bell" c="w-3.5 h-3.5" />
        <span className="text-xs font-bold" style={{ color: errors.length > 0 ? '#991b1b' : '#92400e' }}>
          {errors.length > 0 ? `${errors.length} Timing Conflict${errors.length > 1 ? 's' : ''}` : ''}
          {errors.length > 0 && warnings.length > 0 ? ' + ' : ''}
          {warnings.length > 0 ? `${warnings.length} Warning${warnings.length > 1 ? 's' : ''}` : ''}
        </span>
        <span className="text-[9px] ml-auto" style={{ color: errors.length > 0 ? '#991b1b' : '#92400e' }}>Review before confirming</span>
      </div>
      <div className="px-4 py-2 space-y-1.5">
        {errors.map((c, i) => (
          <div key={`e${i}`} className="flex gap-2 py-1">
            <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white mt-0.5" style={{ background: '#ef4444' }}>!</span>
            <div>
              <p className="text-[10px] font-semibold" style={{ color: '#991b1b' }}>{c.message}</p>
              {c.items.map((item, j) => <p key={j} className="text-[9px]" style={{ color: '#b91c1c' }}>{item}</p>)}
            </div>
          </div>
        ))}
        {warnings.map((c, i) => (
          <div key={`w${i}`} className="flex gap-2 py-1">
            <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold mt-0.5" style={{ background: '#f59e0b', color: 'white' }}>?</span>
            <div>
              <p className="text-[10px] font-semibold" style={{ color: '#92400e' }}>{c.message}</p>
              {c.items.map((item, j) => <p key={j} className="text-[9px]" style={{ color: '#a16207' }}>{item}</p>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
