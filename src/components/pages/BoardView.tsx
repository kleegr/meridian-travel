'use client';

import { Icon } from '@/components/ui';
import { GHL, getStatusMeta } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
import type { Itinerary } from '@/lib/types';

interface BoardViewProps {
  itineraries: Itinerary[];
  statuses: string[];
  onSelect: (id: number) => void;
  onUpdateStatus: (id: number, newStatus: string) => void;
}

export default function BoardView({ itineraries, statuses, onSelect, onUpdateStatus }: BoardViewProps) {
  const handleDragStart = (e: React.DragEvent, id: number) => { e.dataTransfer.setData('itinerary-id', String(id)); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, status: string) => { e.preventDefault(); const id = parseInt(e.dataTransfer.getData('itinerary-id')); if (id) onUpdateStatus(id, status); };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const cols = itineraries.filter((i) => i.status === status);
        const m = getStatusMeta(status);
        const totalVal = cols.reduce((a, b) => a + calcFin(b).totalSell, 0);
        return (
          <div key={status} className="flex-shrink-0 w-[280px] flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {/* Column Header */}
            <div className="rounded-t-xl px-4 py-3 flex-shrink-0" style={{ background: m.bg, borderBottom: `2px solid ${m.dot}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: m.dot }} /><span className="font-bold text-sm" style={{ color: m.color }}>{status}</span></div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: m.dot, color: 'white' }}>{cols.length}</span>
              </div>
              <p className="text-xs mt-1.5 font-semibold" style={{ color: m.color }}>{fmt(totalVal)}</p>
            </div>
            {/* Scrollable Cards Container */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 rounded-b-xl p-2 border border-t-0" style={{ borderColor: GHL.border, minHeight: 200 }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
              {cols.map((i) => {
                const fin = calcFin(i);
                const done = i.checklist.filter((c) => c.done).length;
                const total = i.checklist.length || 1;
                return (
                  <div key={i.id} draggable onDragStart={(e) => handleDragStart(e, i.id)} onClick={() => onSelect(i.id)} className="bg-white rounded-lg border p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all mb-2 group" style={{ borderColor: GHL.border }}>
                    <div className="flex items-start justify-between mb-2"><p className="font-bold text-sm leading-tight transition-colors" style={{ color: GHL.text }}>{i.title}</p><span className="text-xs font-bold ml-2 whitespace-nowrap" style={{ color: GHL.success }}>{fmt(fin.profit)}</span></div>
                    <p className="text-xs mb-2" style={{ color: GHL.muted }}>{i.client}</p>
                    <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: GHL.muted }}><Icon n="globe" c="w-3 h-3" /><span>{i.destination}</span><span className="mx-1">&middot;</span><span>{i.passengers} pax</span></div>
                    <div className="h-1 rounded-full overflow-hidden mb-2.5" style={{ background: GHL.bg }}><div className="h-full rounded-full" style={{ width: `${Math.round((done / total) * 100)}%`, background: GHL.accent }} /></div>
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: GHL.border }}>
                      <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: GHL.accent }}>{i.agent.split(' ').map((n) => n[0]).join('')}</div><span className="text-[11px]" style={{ color: GHL.muted }}>{i.agent.split(' ')[0]}</span></div>
                      <span className="text-[11px]" style={{ color: GHL.muted }}>{fmtDate(i.startDate)}</span>
                    </div>
                  </div>
                );
              })}
              {cols.length === 0 && <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: GHL.border }}><Icon n="map" c="w-8 h-8 mx-auto mb-2" /><p className="text-xs" style={{ color: GHL.muted }}>Drop itineraries here</p></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
