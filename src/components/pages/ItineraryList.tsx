'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Icon, StatusBadge } from '@/components/ui';
import BoardView from './BoardView';
import CalendarView from './CalendarView';
import { GHL, getStatusMeta } from '@/lib/constants';
import { calcFin, fmt, fmtDate, nights } from '@/lib/utils';
import type { Itinerary, Pipeline, CardViewConfig } from '@/lib/types';

interface ItineraryListProps {
  itineraries: Itinerary[];
  pipelines: Pipeline[];
  activePipelineId: number;
  onSetActivePipeline: (id: number) => void;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onNewPackage?: () => void;
  onUpdateStatus: (id: number, newStatus: string) => void;
  onDelete: (id: number) => void;
  agents?: string[];
}

const DEFAULT_CARD_CONFIG: CardViewConfig = { showProfit: true, showChecklist: true, showAgent: true, showDate: true, showCreated: false, showDestination: true, showPax: true, showVip: true, showStageAmount: true, showFlightStatus: true };

export default function ItineraryList({ itineraries, pipelines, activePipelineId, onSetActivePipeline, onSelect, onCreate, onNewPackage, onUpdateStatus, onDelete, agents = [] }: ItineraryListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAgent, setFilterAgent] = useState('All');
  const [view, setView] = useState<'list' | 'grid' | 'board' | 'calendar'>('board');
  const [cardConfig, setCardConfig] = useState<CardViewConfig>(DEFAULT_CARD_CONFIG);
  const [showCardConfig, setShowCardConfig] = useState(false);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
  const statusLabels = activePipeline?.stages || ['Draft', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

  const filtered = useMemo(() => itineraries.filter((i) => {
    const q = search.toLowerCase();
    return (!q || i.title.toLowerCase().includes(q) || i.client.toLowerCase().includes(q) || i.destination.toLowerCase().includes(q) || i.passengerList.some((p) => p.name.toLowerCase().includes(q))) && (filterStatus === 'All' || i.status === filterStatus) && (filterAgent === 'All' || i.agent === filterAgent);
  }), [itineraries, search, filterStatus, filterAgent]);

  const sel = 'px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const toggleCard = (key: keyof CardViewConfig) => setCardConfig((c) => ({ ...c, [key]: !c[key] }));
  const cR = (r: any) => fmt(Number(r.cost));
  const sR = (r: any) => fmt(Number(r.sell));

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Itineraries</h2>
          <p className="text-sm" style={{ color: GHL.muted }}>{itineraries.length} total {String.fromCharCode(8226)} {filtered.length} shown</p>
        </div>
        <button onClick={onCreate} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition-all" style={{ background: GHL.accent }}>
          <Icon n="plus" c="w-4 h-4" /> New Itinerary
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: GHL.muted }}><Icon n="search" c="w-4 h-4" /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips, clients, travelers..." className="w-full pl-9 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} />
          </div>

          {/* Filters */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel} style={{ borderColor: GHL.border, color: GHL.text }}>
            <option value="All">All Stages</option>{statusLabels.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className={sel} style={{ borderColor: GHL.border, color: GHL.text }}>
            <option value="All">All Agents</option>{(agents.length > 0 ? agents : [...new Set(itineraries.map((i) => i.agent).filter(Boolean))]).map((a) => <option key={a}>{a}</option>)}
          </select>

          {/* Divider */}
          <div className="w-px h-6" style={{ background: GHL.border }} />

          {/* View switcher */}
          <div className="flex rounded-lg border overflow-hidden bg-white" style={{ borderColor: GHL.border }}>
            {([['board', 'kanban', 'Board'], ['list', 'list', 'List'], ['grid', 'grid', 'Grid'], ['calendar', 'calendar', 'Cal']] as const).map(([v, ic, label]) => (
              <button key={v} onClick={() => setView(v as any)} className="flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors" style={view === v ? { background: GHL.accent, color: 'white' } : { color: GHL.muted }}>
                <Icon n={ic} c="w-3.5 h-3.5" /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {view === 'board' && (
            <button onClick={() => setShowCardConfig(!showCardConfig)} className="p-2 rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: GHL.border, color: showCardConfig ? GHL.accent : GHL.muted }}>
              <Icon n="settings" c="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Board config panel */}
        {showCardConfig && view === 'board' && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: GHL.border }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Show on Cards</p>
            <div className="flex flex-wrap gap-1.5">
              {([['showProfit', 'Profit'], ['showChecklist', 'Checklist'], ['showAgent', 'Agent'], ['showDate', 'Trip Date'], ['showCreated', 'Created'], ['showDestination', 'Destination'], ['showPax', 'Passengers'], ['showVip', 'VIP'], ['showStageAmount', 'Stage Total'], ['showFlightStatus', 'Flight Status']] as [keyof CardViewConfig, string][]).map(([key, label]) => (
                <button key={key} onClick={() => toggleCard(key)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors" style={cardConfig[key] ? { background: GHL.accentLight, borderColor: GHL.accent + '60', color: GHL.accent } : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#9ca3af' }}>
                  <span className="w-3 h-3 rounded border flex items-center justify-center" style={cardConfig[key] ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{cardConfig[key] && <Icon n="check" c="w-2 h-2 text-white" />}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pipeline tabs */}
      {pipelines.length > 1 && (
        <div className="flex items-center gap-2">
          {pipelines.map((p) => (
            <button key={p.id} onClick={() => onSetActivePipeline(p.id)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={activePipelineId === p.id ? { background: GHL.accent, color: 'white' } : { background: 'white', color: GHL.muted, border: `1px solid ${GHL.border}` }}>
              {p.name} <span className="text-xs opacity-60">({p.stages.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Views */}
      {view === 'board' && <BoardView itineraries={filtered} statuses={statusLabels} onSelect={onSelect} onUpdateStatus={onUpdateStatus} cardConfig={cardConfig} />}
      {view === 'calendar' && <CalendarView itineraries={filtered} onSelect={onSelect} />}

      {view === 'list' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: GHL.bg }}>
              {['Trip / Client', 'Destination', 'Agent', 'Dates', 'Pax', 'Stage', 'Revenue', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: GHL.border + '80' }}>
              {filtered.map((i) => {
                const fin = calcFin(i);
                const meta = getStatusMeta(i.status);
                return (
                  <tr key={i.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => onSelect(i.id)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: GHL.text }}>{i.title}</p>
                        {i.isVip && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706' }}>VIP</span>}
                      </div>
                      <p className="text-xs" style={{ color: GHL.muted }}>{i.client}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: GHL.text }}>{(i.destinations && i.destinations.length > 1) ? i.destinations.join(', ') : i.destination}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: GHL.muted }}>{i.agent}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs" style={{ color: GHL.text }}>{fmtDate(i.startDate)}</p>
                      <p className="text-[10px]" style={{ color: GHL.muted }}>{nights(i.startDate, i.endDate)} nights</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-center" style={{ color: GHL.text }}>{i.passengers}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: meta.bg, color: meta.color }}>{i.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: GHL.text }}>{fmt(fin.totalSell)}</p>
                      <p className="text-[10px]" style={{ color: GHL.success }}>+{fmt(fin.profit)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) onDelete(i.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-8 text-sm" style={{ color: GHL.muted }}>No itineraries match your filters</p>}
        </div>
      )}

      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((i) => {
            const fin = calcFin(i);
            const done = i.checklist.filter((c) => c.done).length;
            const total = i.checklist.length || 1;
            const meta = getStatusMeta(i.status);
            const n = nights(i.startDate, i.endDate);
            return (
              <div key={i.id} onClick={() => onSelect(i.id)} className="bg-white rounded-xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all group" style={{ borderColor: GHL.border }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm truncate" style={{ color: GHL.text }}>{i.title}</h3>
                      {i.isVip && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: '#fef3c7', color: '#d97706' }}>VIP</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: GHL.muted }}>{i.client}</p>
                  </div>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2" style={{ background: meta.bg, color: meta.color }}>{i.status}</span>
                </div>

                <div className="flex items-center gap-3 text-xs mb-3" style={{ color: GHL.muted }}>
                  <span className="flex items-center gap-1"><Icon n="map" c="w-3 h-3" />{(i.destinations?.length > 1) ? i.destinations.join(', ') : i.destination}</span>
                  <span>{n} nights</span>
                  <span>{i.passengers} pax</span>
                </div>

                {/* Checklist progress */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: GHL.bg }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((done / total) * 100)}%`, background: done === i.checklist.length ? GHL.success : GHL.accent }} />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: done === i.checklist.length ? GHL.success : GHL.muted }}>{done}/{i.checklist.length}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: GHL.border }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: GHL.text }}>{fmt(fin.totalSell)}</p>
                    <p className="text-[10px]" style={{ color: GHL.success }}>Profit: {fmt(fin.profit)}</p>
                  </div>
                  <p className="text-[10px]" style={{ color: GHL.muted }}>{fmtDate(i.startDate)}</p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="col-span-3 text-center py-8 text-sm" style={{ color: GHL.muted }}>No itineraries match your filters</p>}
        </div>
      )}
    </div>
  );
}
