'use client';

import { Icon } from '@/components/ui';
import { STATUSES, STATUS_META, GHL } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
import type { Itinerary } from '@/lib/types';

interface BoardViewProps {
  itineraries: Itinerary[];
  onSelect: (id: number) => void;
  onUpdateStatus: (id: number, newStatus: string) => void;
}

export default function BoardView({ itineraries, onSelect, onUpdateStatus }: BoardViewProps) {
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('itinerary-id', String(id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData('itinerary-id'));
    if (id) onUpdateStatus(id, status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
      {STATUSES.map((status) => {
        const cols = itineraries.filter((i) => i.status === status);
        const m = STATUS_META[status];
        const totalVal = cols.reduce((a, b) => a + calcFin(b).totalSell, 0);

        return (
          <div key={status} className="flex-shrink-0 w-[280px]">
            <div className="rounded-t-xl px-4 py-3" style={{ background: m.bg, borderBottom: `2px solid ${m.dot}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.dot }} />
                  <span className="font-bold text-sm" style={{ color: m.color }}>{status}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: m.dot, color: 'white' }}>{cols.length}</span>
              </div>
              <p className="text-xs mt-1.5 font-semibold" style={{ color: m.color }}>{fmt(totalVal)}</p>
            </div>

            <div
              className="space-y-0 bg-gray-50/50 rounded-b-xl p-2 min-h-[400px] border border-gray-100 border-t-0 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              {cols.map((i) => {
                const fin = calcFin(i);
                const done = i.checklist.filter((c) => c.done).length;
                const total = i.checklist.length || 1;

                return (
                  <div
                    key={i.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i.id)}
                    onClick={() => onSelect(i.id)}
                    className="bg-white rounded-lg border border-gray-100 p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-teal-200 transition-all mb-2 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-gray-900 text-sm leading-tight group-hover:text-teal-700 transition-colors">{i.title}</p>
                      <span className="text-xs font-bold ml-2 whitespace-nowrap" style={{ color: GHL.success }}>{fmt(fin.profit)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{i.client}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                      <Icon n="globe" c="w-3 h-3" />
                      <span>{i.destination}</span>
                      <span className="mx-1">&middot;</span>
                      <span>{i.passengers} pax</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2.5">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((done / total) * 100)}%`, background: GHL.accent }} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: GHL.accent }}>
                          {i.agent.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-[11px] text-gray-400">{i.agent.split(' ')[0]}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">{fmtDate(i.startDate)}</span>
                    </div>
                  </div>
                );
              })}
              {cols.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Icon n="map" c="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Drop itineraries here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
