'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Icon, StatusBadge } from '@/components/ui';
import BoardView from './BoardView';
import CalendarView from './CalendarView';
import { GHL } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
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
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowNewDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
  const statusLabels = activePipeline?.stages || ['Draft', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

  const filtered = useMemo(() => itineraries.filter((i) => {
    const q = search.toLowerCase();
    return (!q || i.title.toLowerCase().includes(q) || i.client.toLowerCase().includes(q) || i.destination.toLowerCase().includes(q) || i.passengerList.some((p) => p.name.toLowerCase().includes(q))) && (filterStatus === 'All' || i.status === filterStatus) && (filterAgent === 'All' || i.agent === filterAgent);
  }), [itineraries, search, filterStatus, filterAgent]);

  const sel = 'px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const toggleCard = (key: keyof CardViewConfig) => setCardConfig((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-2xl font-bold mb-1" style={{ color: GHL.text }}>Itineraries</h2><p className="text-sm" style={{ color: GHL.muted }}>{itineraries.length} total &middot; {filtered.length} shown</p></div>
        {/* Plus button with dropdown */}
        <div className="relative" ref={dropRef}>
          <button onClick={() => setShowNewDropdown(!showNewDropdown)} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90" style={{ background: GHL.accent }}>
            <Icon n="plus" c="w-5 h-5" /> New
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-0.5"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {showNewDropdown && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border shadow-xl z-50 overflow-hidden" style={{ borderColor: GHL.border }}>
              <button onClick={() => { setShowNewDropdown(false); onCreate(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors text-left" style={{ color: GHL.text }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GHL.accentLight, color: GHL.accent }}><Icon n="map" c="w-4 h-4" /></span>
                New Itinerary
              </button>
              <div className="h-px" style={{ background: GHL.border }} />
              <button onClick={() => { setShowNewDropdown(false); onNewPackage?.(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-blue-50 transition-colors text-left" style={{ color: GHL.text }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#ecfdf5', color: '#10b981' }}><Icon n="globe" c="w-4 h-4" /></span>
                New Package
              </button>
            </div>
          )}
        </div>
      </div>

      {pipelines.length > 0 && <div className="flex items-center gap-2 flex-wrap">{pipelines.map((p) => (<button key={p.id} onClick={() => onSetActivePipeline(p.id)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={activePipelineId === p.id ? { background: GHL.accent, color: 'white', boxShadow: '0 2px 8px rgba(20,63,119,0.3)' } : { background: 'white', color: GHL.muted, border: `1px solid ${GHL.border}` }}>{p.name}<span className="ml-1.5 text-xs opacity-70">({p.stages.length})</span></button>))}</div>}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]"><span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: GHL.muted }}><Icon n="search" c="w-4 h-4" /></span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips, clients, travelers..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /></div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel} style={{ borderColor: GHL.border, color: GHL.text }}><option value="All">All Stages</option>{statusLabels.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className={sel} style={{ borderColor: GHL.border, color: GHL.text }}><option value="All">All Agents</option>{(agents.length > 0 ? agents : [...new Set(itineraries.map((i) => i.agent).filter(Boolean))]).map((a) => <option key={a}>{a}</option>)}</select>
        <div className="flex rounded-lg border overflow-hidden bg-white" style={{ borderColor: GHL.border }}>
          {([['board', 'kanban'], ['list', 'list'], ['grid', 'grid'], ['calendar', 'calendar']] as const).map(([v, ic]) => (
            <button key={v} onClick={() => setView(v as any)} className="p-2.5 transition-colors" style={view === v ? { background: GHL.accent, color: 'white' } : { color: GHL.muted }}><Icon n={ic} c="w-4 h-4" /></button>
          ))}
        </div>
        {view === 'board' && <button onClick={() => setShowCardConfig(!showCardConfig)} className="p-2.5 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: showCardConfig ? GHL.accent : GHL.muted }}><Icon n="settings" c="w-4 h-4" /></button>}
      </div>

      {showCardConfig && view === 'board' && <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}><p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.muted }}>Customize Board View</p><div className="flex flex-wrap gap-2">{([['showProfit', 'Profit'], ['showChecklist', 'Checklist'], ['showAgent', 'Agent'], ['showDate', 'Trip Date'], ['showCreated', 'Created Date'], ['showDestination', 'Destination'], ['showPax', 'Passengers'], ['showVip', 'VIP Badge'], ['showStageAmount', 'Stage Total $'], ['showFlightStatus', 'Flight Status']] as [keyof CardViewConfig, string][]).map(([key, label]) => (<button key={key} onClick={() => toggleCard(key)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors" style={cardConfig[key] ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: '#f3f4f6', borderColor: '#e5e7eb', color: '#9ca3af' }}><span className="w-3.5 h-3.5 rounded border flex items-center justify-center" style={cardConfig[key] ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{cardConfig[key] && <Icon n="check" c="w-2.5 h-2.5 text-white" />}</span>{label}</button>))}</div></div>}

      {view === 'board' && <BoardView itineraries={filtered} statuses={statusLabels} onSelect={onSelect} onUpdateStatus={onUpdateStatus} cardConfig={cardConfig} />}

      {view === 'calendar' && <CalendarView itineraries={filtered} onSelect={onSelect} />}

      {view === 'list' && <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}><table className="w-full text-sm"><thead><tr style={{ background: GHL.bg }}>{['Trip / Client', 'Destination', 'Agent', 'Dates', 'Created', 'Pax', 'Stage', 'Revenue', ''].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: GHL.muted }}>{h}</th>)}</tr></thead><tbody className="divide-y">{filtered.map((i) => { const fin = calcFin(i); return (<tr key={i.id} className="hover:bg-blue-50/30 transition-colors"><td className="px-5 py-4 cursor-pointer" onClick={() => onSelect(i.id)}><div className="flex items-center gap-1.5"><p className="font-semibold" style={{ color: GHL.text }}>{i.title}</p>{i.isVip && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706' }}>VIP</span>}</div><p className="text-xs mt-0.5" style={{ color: GHL.muted }}>{i.client}</p></td><td className="px-5 py-4 cursor-pointer" onClick={() => onSelect(i.id)} style={{ color: GHL.text }}>{(i.destinations && i.destinations.length > 1) ? i.destinations.join(', ') : i.destination}</td><td className="px-5 py-4" style={{ color: GHL.text }}>{i.agent}</td><td className="px-5 py-4 text-xs" style={{ color: GHL.muted }}>{fmtDate(i.startDate)}<br />{fmtDate(i.endDate)}</td><td className="px-5 py-4 text-xs" style={{ color: GHL.muted }}>{fmtDate(i.created)}</td><td className="px-5 py-4" style={{ color: GHL.text }}>{i.passengers}</td><td className="px-5 py-4"><StatusBadge status={i.status} /></td><td className="px-5 py-4 font-medium" style={{ color: GHL.text }}>{fmt(fin.totalSell)}</td><td className="px-5 py-4"><button onClick={() => { if (confirm('Delete this itinerary?')) onDelete(i.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Icon n="trash" c="w-4 h-4" /></button></td></tr>); })}</tbody></table></div>}

      {view === 'grid' && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((i) => { const fin = calcFin(i); const done = i.checklist.filter((c) => c.done).length; const allDone = done === i.checklist.length && i.checklist.length > 0; return (<div key={i.id} onClick={() => onSelect(i.id)} className="bg-white rounded-xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all relative" style={{ borderColor: GHL.border }}>{i.isVip && <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706' }}>VIP</span>}<h3 className="font-bold" style={{ color: GHL.text }}>{i.title}</h3><p className="text-xs mt-0.5 mb-2" style={{ color: GHL.muted }}>{i.client}</p><div className="flex items-center gap-2 text-xs mb-2" style={{ color: GHL.muted }}><span>{(i.destinations?.length > 1) ? i.destinations.join(', ') : i.destination}</span><span>&middot;</span><span>{i.passengers} pax</span></div><div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: GHL.bg }}><div className="h-full rounded-full" style={{ width: `${Math.round((done / (i.checklist.length || 1)) * 100)}%`, background: allDone ? GHL.success : GHL.accent }} /></div><div className="flex items-center justify-between mb-2"><span className="text-[10px]" style={{ color: allDone ? GHL.success : GHL.muted }}>{done}/{i.checklist.length}</span>{!allDone && i.checklist.length > 0 && <span className="text-[9px] font-semibold" style={{ color: '#ef4444' }}>List Not Done</span>}</div><div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderColor: GHL.border, color: GHL.muted }}><span>{fmtDate(i.startDate)}</span><span>Created {fmtDate(i.created)}</span></div></div>); })}</div>}
    </div>
  );
}
