'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { analyzeTimingConflicts } from '@/lib/timing-analyzer';
import type { TimingSettings } from '@/lib/timing-settings';
import { DEFAULT_TIMING_SETTINGS } from '@/lib/timing-settings';
import type { Itinerary } from '@/lib/types';

interface Props {
  itin: Itinerary;
  settings?: TimingSettings;
  onEditItem?: (section: string, id: number) => void;
}

const SEVERITY_STYLES = {
  error: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: 'x', iconBg: '#fee2e2' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: 'bell', iconBg: '#fef3c7' },
  info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'info', iconBg: '#dbeafe' },
};

export default function TimingConflictsPanel({ itin, settings, onEditItem }: Props) {
  const s = settings || DEFAULT_TIMING_SETTINGS;
  const conflicts = useMemo(() => analyzeTimingConflicts(itin, s), [itin, s]);

  if (conflicts.length === 0) {
    return (
      <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
          <Icon n="check" c="w-4 h-4" style={{ color: '#16a34a' }} />
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#166534' }}>No timing conflicts detected</p>
          <p className="text-[10px]" style={{ color: '#4ade80' }}>All flights, hotels, and activities are properly timed.</p>
        </div>
      </div>
    );
  }

  const errors = conflicts.filter(c => c.severity === 'error').length;
  const warnings = conflicts.filter(c => c.severity === 'warning').length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="rounded-xl border p-3 flex items-center justify-between" style={{ background: errors > 0 ? '#fef2f2' : '#fffbeb', borderColor: errors > 0 ? '#fecaca' : '#fde68a' }}>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: errors > 0 ? '#fee2e2' : '#fef3c7' }}>
            <Icon n="bell" c="w-3.5 h-3.5" style={{ color: errors > 0 ? '#dc2626' : '#d97706' }} />
          </span>
          <div>
            <p className="text-xs font-bold" style={{ color: errors > 0 ? '#991b1b' : '#92400e' }}>{conflicts.length} Timing Issue{conflicts.length > 1 ? 's' : ''} Found</p>
            <p className="text-[9px]" style={{ color: errors > 0 ? '#ef4444' : '#f59e0b' }}>
              {errors > 0 && `${errors} critical`}{errors > 0 && warnings > 0 && ', '}{warnings > 0 && `${warnings} warning${warnings > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Conflict cards */}
      {conflicts.map(conflict => {
        const style = SEVERITY_STYLES[conflict.severity];
        return (
          <div key={conflict.id} className="rounded-xl border overflow-hidden" style={{ borderColor: style.border }}>
            <div className="px-4 py-3 flex items-start gap-3" style={{ background: style.bg }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: style.iconBg }}>
                <Icon n={style.icon} c="w-3 h-3" style={{ color: style.color }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: style.color }}>{conflict.title}</p>
                <p className="text-[10px] leading-relaxed mt-1" style={{ color: style.color + 'cc' }}>{conflict.description}</p>
                {conflict.suggestedFix && (
                  <p className="text-[9px] mt-2 px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.5)', color: style.color }}>
                    <strong>Suggestion:</strong> {conflict.suggestedFix}
                  </p>
                )}
                {conflict.items.length > 0 && onEditItem && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {conflict.items.map((item, i) => (
                      <button key={i} onClick={() => onEditItem(item.type, item.id)} className="text-[9px] font-semibold px-2 py-0.5 rounded border hover:bg-white" style={{ borderColor: style.border, color: style.color }}>
                        Edit {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
