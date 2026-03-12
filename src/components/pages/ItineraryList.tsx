'use client';

import { useState, useMemo } from 'react';
import { Icon, StatusBadge } from '@/components/ui';
import BoardView from './BoardView';
import { GHL, AGENTS, STATUS_META } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
import type { Itinerary, Pipeline } from '@/lib/types';

interface ItineraryListProps {
  itineraries: Itinerary[];
  pipelines: Pipeline[];
  activePipelineId: number;
  onSetActivePipeline: (id: number) => void;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onUpdateStatus: (id: number, newStatus: string) => void;
}

export default function ItineraryList({ itineraries, pipelines, activePipelineId, onSetActivePipeline, onSelect, onCreate, onUpdateStatus }: ItineraryListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAgent, setFilterAgent] = useState('All');
  const [view, setView] = useState<'list' | 'grid' | 'board'>('board');

  const activePipeline = pipelines.find((p) => p.id === activePipelineId);
  const statusLabels = activePipeline?.stages || ['Draft', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

  const filtered = useMemo(() => itineraries.filter((i) => {
    const q = search.toLowerCase();
    return (!q || i.title.toLowerCase().includes(q) || i.client.toLowerCase().includes(q) || i.destination.toLowerCase().includes(q) || i.passengerList.some((p) => p.name.toLowerCase().includes(q))) && (filterStatus === 'All' || i.status === filterStatus) && (filterAgent === 'All' || i.agent === filterAgent);
  }), [itineraries, search, filterStatus, filterAgent]);

  const sel = 'px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-2xl font-bold mb-1" style={{ color: GHL.text }}>Itineraries</h2><p className="text-sm" style={{ color: GHL.muted }}>{itineraries.length} total &middot; {filtered.length} shown</p></div>
        <button onClick={onCreate} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> New Itinerary</button>
      </div>

      {/* Pipeline switcher + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]"><span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: GHL.muted }}><Icon n="search" c="w-4 h-4" /></span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips, clients, travelers..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /></div>
        {pipelines.length > 1 && (
          <select value={activePipelineId} onChange={(e) => onSetActivePipeline(Number(e.target.value))} className={sel} style={{ borderColor: GHL.border, color: GHL.accent, fontWeight: 600 }}>
            {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel} style={{ borderColor: GHL.border, color: GHL.text }}><option value="All">All Stages</option>{statusLabels.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className={sel} style={{ borderColor: GHL.border, color: GHL.text }}><option value="All">All Agents</option>{AGENTS.map((a) => <option key={a}>{a}</option>)}</select>
        <div className="flex rounded-lg border overflow-hidden bg-white" style={{ borderColor: GHL.border }}>{(['board', 'list', 'grid'] as const).map((v) => (<button key={v} onClick={() => setView(v)} className="p-2.5 transition-colors" style={view === v ? { background: GHL.accent, color: 'white' } : { color: GHL.muted }}><Icon n={v === 'board' ? 'kanban' : v} c="w-4 h-4" /></button>))}</div>
      </div>

      {/* Pipeline name indicator */}
      {activePipeline && <div className="flex items-center gap-2 text-xs" style={{ color: GHL.muted }}><Icon n="pipeline" c="w-3.5 h-3.5" /><span>Pipeline: <strong style={{ color: GHL.text }}>{activePipeline.name}</strong> &middot; {activePipeline.stages.length} stages</span></div>}

      {view === 'board' && <BoardView itineraries={filtered} statuses={statusLabels} onSelect={onSelect} onUpdateStatus={onUpdateStatus} />}

      {view === 'list' && <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}><table className="w-full text-sm"><thead><tr style={{ background: GHL.bg }}>{['Trip / Client', 'Destination', 'Agent', 'Dates', 'Pax', 'Status', 'Revenue', 'Profit'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: GHL.muted }}>{h}</th>)}</tr></thead><tbody className="divide-y" style={{ borderColor: GHL.border }}>{filtered.map((i) => { const fin = calcFin(i); return (<tr key={i.id} onClick={() => onSelect(i.id)} className="hover:bg-blue-50/30 cursor-pointer transition-colors"><td className="px-5 py-4"><p className="font-semibold" style={{ color: GHL.text }}>{i.title}</p><p className="text-xs mt-0.5" style={{ color: GHL.muted }}>{i.client}</p></td><td className="px-5 py-4" style={{ color: GHL.text }}>{i.destination}</td><td className="px-5 py-4" style={{ color: GHL.text }}>{i.agent}</td><td className="px-5 py-4 text-xs" style={{ color: GHL.muted }}>{fmtDate(i.startDate)}<br />{fmtDate(i.endDate)}</td><td className="px-5 py-4" style={{ color: GHL.text }}>{i.passengers}</td><td className="px-5 py-4"><StatusBadge status={i.status} /></td><td className="px-5 py-4 font-medium" style={{ color: GHL.text }}>{fmt(fin.totalSell)}</td><td className="px-5 py-4 font-semibold" style={{ color: GHL.success }}>{fmt(fin.profit)}</td></tr>); })}</tbody></table></div>}

      {view === 'grid' && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((i) => { const fin = calcFin(i); const m = STATUS_META[i.status]; return (<div key={i.id} onClick={() => onSelect(i.id)} className="bg-white rounded-xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all" style={{ borderColor: GHL.border, borderTop: `3px solid ${m?.dot || GHL.accent}` }}><div className="flex items-start justify-between mb-3"><div><h3 className="font-bold" style={{ color: GHL.text }}>{i.title}</h3><p className="text-xs mt-0.5" style={{ color: GHL.muted }}>{i.client}</p></div><StatusBadge status={i.status} /></div><div className="flex items-center gap-2 text-xs mb-3" style={{ color: GHL.muted }}><Icon n="globe" c="w-3.5 h-3.5" />{i.destination} &middot; {i.passengers} pax</div><div className="border-t pt-3 flex justify-between" style={{ borderColor: GHL.border }}><div><p className="text-xs" style={{ color: GHL.muted }}>Revenue</p><p className="font-semibold text-sm" style={{ color: GHL.text }}>{fmt(fin.totalSell)}</p></div><div className="text-right"><p className="text-xs" style={{ color: GHL.muted }}>Profit</p><p className="font-semibold text-sm" style={{ color: GHL.success }}>{fmt(fin.profit)}</p></div></div></div>); })}</div>}
    </div>
  );
}
