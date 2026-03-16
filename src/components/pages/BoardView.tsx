'use client';

import { useState, useRef, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL, getStatusMeta } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
import type { Itinerary, CardViewConfig } from '@/lib/types';

interface BoardViewProps {
  itineraries: Itinerary[];
  statuses: string[];
  onSelect: (id: number) => void;
  onUpdateStatus: (id: number, newStatus: string) => void;
  cardConfig: CardViewConfig;
}

const flightStatusColors: Record<string, { bg: string; text: string }> = {
  'On Time': { bg: '#d1fae5', text: '#065f46' },
  'Scheduled': { bg: '#dbeafe', text: '#1e40af' },
  'En Route': { bg: '#dbeafe', text: '#1e40af' },
  'Delayed': { bg: '#fef3c7', text: '#92400e' },
  'Cancelled': { bg: '#fef2f2', text: '#991b1b' },
  'In Air': { bg: '#dbeafe', text: '#1e40af' },
  'Landed': { bg: '#d1fae5', text: '#065f46' },
  'Arrived': { bg: '#d1fae5', text: '#065f46' },
  'Boarding': { bg: '#ede9fe', text: '#5b21b6' },
  'Diverted': { bg: '#fef3c7', text: '#92400e' },
};

export default function BoardView({ itineraries, statuses, onSelect, onUpdateStatus, cardConfig }: BoardViewProps) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);
  const dragItem = dragId ? itineraries.find((i) => i.id === dragId) : null;

  const handlePointerDown = useCallback((e: React.PointerEvent, id: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    hasMoved.current = false;
    setDragId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragId) return;
    e.preventDefault();
    hasMoved.current = true;
    setDragPos({ x: e.clientX, y: e.clientY });
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    let foundCol: string | null = null;
    for (const el of els) { const col = (el as HTMLElement).dataset?.dropCol; if (col) { foundCol = col; break; } }
    setOverCol(foundCol);
  }, [dragId]);

  const handlePointerUp = useCallback(() => {
    if (dragId && overCol && hasMoved.current) {
      const item = itineraries.find((i) => i.id === dragId);
      if (item && item.status !== overCol) onUpdateStatus(dragId, overCol);
    } else if (dragId && !hasMoved.current) {
      onSelect(dragId);
    }
    setDragId(null); setDragPos(null); setOverCol(null);
  }, [dragId, overCol, itineraries, onUpdateStatus, onSelect]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 relative select-none" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      {statuses.map((status) => {
        const cols = itineraries.filter((i) => i.status === status);
        const m = getStatusMeta(status);
        const totalVal = cols.reduce((a, b) => a + calcFin(b).totalSell, 0);
        const isOver = overCol === status && dragId !== null;

        return (
          <div key={status} className="flex-shrink-0 w-[270px] flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="rounded-t-xl px-4 py-3 flex-shrink-0" style={{ background: m.bg, borderBottom: `2px solid ${m.dot}` }}>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: m.dot }} /><span className="font-bold text-sm" style={{ color: m.color }}>{status}</span></div><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: m.dot, color: 'white' }}>{cols.length}</span></div>
              {cardConfig.showStageAmount && <p className="text-xs mt-1.5 font-semibold" style={{ color: m.color }}>{fmt(totalVal)}</p>}
            </div>
            <div data-drop-col={status} className="flex-1 rounded-b-xl p-2 border border-t-0 transition-all duration-200" style={{ borderColor: isOver ? GHL.accent : GHL.border, background: isOver ? GHL.accentLight : '#fafbfc', minHeight: 120, boxShadow: isOver ? `inset 0 0 0 2px ${GHL.accent}` : 'none', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
              {isOver && <div className="mb-2 p-3 rounded-lg border-2 border-dashed text-center text-xs font-semibold" style={{ borderColor: GHL.accent, color: GHL.accent, background: 'white' }}>Drop here</div>}
              {cols.map((i) => {
                const fin = calcFin(i);
                const done = i.checklist.filter((c) => c.done).length;
                const total = i.checklist.length || 1;
                const allDone = done === i.checklist.length && i.checklist.length > 0;
                const isDragging = dragId === i.id;
                const nextFlight = i.flights.length > 0 ? i.flights.sort((a, b) => a.departure.localeCompare(b.departure))[0] : null;
                const flightStatus = nextFlight?.status || '';
                const fsc = flightStatusColors[flightStatus] || (flightStatus.toLowerCase().includes('delay') ? flightStatusColors['Delayed'] : null);
                return (
                  <div key={i.id} onPointerDown={(e) => handlePointerDown(e, i.id)} className="bg-white rounded-lg border p-3.5 mb-2 group transition-all duration-150" style={{ borderColor: isDragging ? GHL.accent : GHL.border, opacity: isDragging ? 0.4 : 1, cursor: 'grab', touchAction: 'none' }}>
                    <div className="flex items-center justify-center mb-1.5 opacity-25 group-hover:opacity-50"><div className="flex gap-0.5">{[1,2,3,4,5].map((d) => <span key={d} className="w-1 h-1 rounded-full bg-gray-400" />)}</div></div>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm leading-tight" style={{ color: GHL.text }}>{i.title}</p>
                        {cardConfig.showVip && i.isVip && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>VIP</span>}
                      </div>
                      {cardConfig.showProfit && <span className="text-xs font-bold ml-2 whitespace-nowrap" style={{ color: GHL.success }}>{fmt(fin.profit)}</span>}
                    </div>
                    <p className="text-xs mb-1.5" style={{ color: GHL.muted }}>{i.client}</p>
                    {cardConfig.showDestination && <div className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: GHL.muted }}><Icon n="globe" c="w-3 h-3" /><span>{(i.destinations && i.destinations.length > 1) ? i.destinations.join(', ') : i.destination}</span>{cardConfig.showPax && <><span>&middot;</span><span>{i.passengers} pax</span></>}</div>}
                    {cardConfig.showFlightStatus && nextFlight && flightStatus && fsc && (
                      <div className="flex items-center gap-1.5 mb-1.5 px-2 py-1 rounded text-[10px] font-semibold" style={{ background: fsc.bg, color: fsc.text }}>
                        <Icon n="plane" c="w-3 h-3" />
                        <span>{nextFlight.flightNo}</span>
                        <span className="mx-0.5">&middot;</span>
                        <span>{flightStatus}</span>
                        {nextFlight.scheduledDeparture && <span className="ml-auto text-[9px] font-normal opacity-70">{nextFlight.scheduledDeparture}</span>}
                      </div>
                    )}
                    {cardConfig.showChecklist && <div className="mb-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: GHL.bg }}><div className="h-full rounded-full" style={{ width: `${Math.round((done / total) * 100)}%`, background: allDone ? GHL.success : GHL.accent }} /></div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px]" style={{ color: allDone ? GHL.success : GHL.muted }}>{done}/{i.checklist.length}</span>
                        {!allDone && i.checklist.length > 0 && <span className="text-[9px] font-semibold" style={{ color: '#ef4444' }}>List Not Done</span>}
                      </div>
                    </div>}
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: GHL.border }}>
                      {cardConfig.showAgent && <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: GHL.accent }}>{i.agent.split(' ').map((n) => n[0]).join('')}</div><span className="text-[11px]" style={{ color: GHL.muted }}>{i.agent.split(' ')[0]}</span></div>}
                      <div className="flex items-center gap-2">
                        {cardConfig.showDate && <span className="text-[10px]" style={{ color: GHL.muted }}>{fmtDate(i.startDate)}</span>}
                        {cardConfig.showCreated && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: GHL.bg, color: GHL.muted }}>Created {fmtDate(i.created)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {cols.length === 0 && !isOver && <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: GHL.border }}><Icon n="map" c="w-6 h-6 mx-auto mb-1" /><p className="text-xs" style={{ color: GHL.muted }}>No itineraries</p></div>}
            </div>
          </div>
        );
      })}
      {dragId && dragPos && dragItem && <div className="fixed pointer-events-none z-50" style={{ left: dragPos.x - 130, top: dragPos.y - 30, width: 260 }}><div className="bg-white rounded-lg border-2 p-3 shadow-2xl" style={{ borderColor: GHL.accent, transform: 'rotate(-2deg)', opacity: 0.9 }}><div className="flex items-center gap-1.5"><p className="font-bold text-sm" style={{ color: GHL.text }}>{dragItem.title}</p>{dragItem.isVip && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706' }}>VIP</span>}</div><p className="text-xs" style={{ color: GHL.muted }}>{dragItem.client}</p></div></div>}
      <style jsx>{`
        div[data-drop-col]::-webkit-scrollbar { width: 6px; }
        div[data-drop-col]::-webkit-scrollbar-track { background: transparent; }
        div[data-drop-col]::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        div[data-drop-col]::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
