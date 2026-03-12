'use client';

import { useState, useRef, useCallback } from 'react';
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
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const startPos = useRef<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);
  const dragItem = dragId ? itineraries.find((i) => i.id === dragId) : null;

  // Pointer-based drag for smooth experience
  const handlePointerDown = useCallback((e: React.PointerEvent, id: number) => {
    // Only left click
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY, scrollX: window.scrollX, scrollY: window.scrollY };
    setDragId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragId) return;
    e.preventDefault();
    setDragPos({ x: e.clientX, y: e.clientY });

    // Detect which column we're over
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    let foundCol: string | null = null;
    for (const el of els) {
      const col = (el as HTMLElement).dataset?.dropCol;
      if (col) { foundCol = col; break; }
    }
    setOverCol(foundCol);
  }, [dragId]);

  const handlePointerUp = useCallback(() => {
    if (dragId && overCol) {
      const item = itineraries.find((i) => i.id === dragId);
      if (item && item.status !== overCol) {
        onUpdateStatus(dragId, overCol);
      }
    }
    setDragId(null);
    setDragPos(null);
    setOverCol(null);
    startPos.current = null;
  }, [dragId, overCol, itineraries, onUpdateStatus]);

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-4 relative select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {statuses.map((status) => {
        const cols = itineraries.filter((i) => i.status === status);
        const m = getStatusMeta(status);
        const totalVal = cols.reduce((a, b) => a + calcFin(b).totalSell, 0);
        const isOver = overCol === status && dragId !== null;
        const isDragSource = dragItem?.status === status;

        return (
          <div key={status} className="flex-shrink-0 w-[280px] flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {/* Column Header */}
            <div className="rounded-t-xl px-4 py-3 flex-shrink-0" style={{ background: m.bg, borderBottom: `2px solid ${m.dot}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.dot }} />
                  <span className="font-bold text-sm" style={{ color: m.color }}>{status}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: m.dot, color: 'white' }}>
                  {cols.length}
                </span>
              </div>
              <p className="text-xs mt-1.5 font-semibold" style={{ color: m.color }}>{fmt(totalVal)}</p>
            </div>

            {/* Drop Zone */}
            <div
              data-drop-col={status}
              className="flex-1 overflow-y-auto rounded-b-xl p-2 border border-t-0 transition-all duration-200"
              style={{
                borderColor: isOver ? GHL.accent : GHL.border,
                background: isOver ? GHL.accentLight : '#fafbfc',
                minHeight: 120,
                boxShadow: isOver ? `inset 0 0 0 2px ${GHL.accent}` : 'none',
              }}
            >
              {/* Drop indicator */}
              {isOver && !isDragSource && (
                <div className="mb-2 p-3 rounded-lg border-2 border-dashed text-center text-xs font-semibold" style={{ borderColor: GHL.accent, color: GHL.accent, background: 'white' }}>
                  Drop here to move to {status}
                </div>
              )}

              {cols.map((i) => {
                const fin = calcFin(i);
                const done = i.checklist.filter((c) => c.done).length;
                const total = i.checklist.length || 1;
                const isDragging = dragId === i.id;

                return (
                  <div
                    key={i.id}
                    ref={isDragging ? dragRef : undefined}
                    onPointerDown={(e) => handlePointerDown(e, i.id)}
                    onClick={() => { if (!startPos.current) onSelect(i.id); }}
                    className="bg-white rounded-lg border p-3.5 mb-2 group transition-all duration-150"
                    style={{
                      borderColor: isDragging ? GHL.accent : GHL.border,
                      opacity: isDragging ? 0.4 : 1,
                      cursor: 'grab',
                      touchAction: 'none',
                    }}
                  >
                    {/* Grab handle bar */}
                    <div className="flex items-center justify-center mb-2 opacity-30 group-hover:opacity-60 transition-opacity">
                      <div className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                      </div>
                    </div>

                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-sm leading-tight" style={{ color: GHL.text }}>{i.title}</p>
                      <span className="text-xs font-bold ml-2 whitespace-nowrap" style={{ color: GHL.success }}>{fmt(fin.profit)}</span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: GHL.muted }}>{i.client}</p>
                    <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: GHL.muted }}>
                      <Icon n="globe" c="w-3 h-3" />
                      <span>{i.destination}</span>
                      <span className="mx-0.5">&middot;</span>
                      <span>{i.passengers} pax</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden mb-2.5" style={{ background: GHL.bg }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round((done / total) * 100)}%`, background: GHL.accent }} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: GHL.border }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: GHL.accent }}>
                          {i.agent.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-[11px]" style={{ color: GHL.muted }}>{i.agent.split(' ')[0]}</span>
                      </div>
                      <span className="text-[11px]" style={{ color: GHL.muted }}>{fmtDate(i.startDate)}</span>
                    </div>
                  </div>
                );
              })}

              {cols.length === 0 && !isOver && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: GHL.border }}>
                  <Icon n="map" c="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs" style={{ color: GHL.muted }}>No itineraries</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Floating drag ghost */}
      {dragId && dragPos && dragItem && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPos.x - 130,
            top: dragPos.y - 30,
            width: 260,
          }}
        >
          <div
            className="bg-white rounded-lg border-2 p-3 shadow-2xl"
            style={{ borderColor: GHL.accent, transform: 'rotate(-2deg)', opacity: 0.9 }}
          >
            <p className="font-bold text-sm" style={{ color: GHL.text }}>{dragItem.title}</p>
            <p className="text-xs" style={{ color: GHL.muted }}>{dragItem.client} &middot; {dragItem.destination}</p>
          </div>
        </div>
      )}
    </div>
  );
}
