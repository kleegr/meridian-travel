'use client';

import { useState, useMemo } from 'react';
import { Icon, StatusBadge } from '@/components/ui';
import BoardView from './BoardView';
import { GHL, STATUSES, AGENTS, STATUS_META } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
import type { Itinerary } from '@/lib/types';

interface ItineraryListProps {
  itineraries: Itinerary[];
  onSelect: (id: number) => void;
  onCreate: () => void;
  onUpdateStatus: (id: number, newStatus: string) => void;
  onManagePipeline: () => void;
}

export default function ItineraryList({ itineraries, onSelect, onCreate, onUpdateStatus, onManagePipeline }: ItineraryListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAgent, setFilterAgent] = useState('All');
  const [view, setView] = useState<'list' | 'grid' | 'board'>('board');

  const filtered = useMemo(
    () =>
      itineraries.filter((i) => {
        const q = search.toLowerCase();
        return (
          (!q ||
            i.title.toLowerCase().includes(q) ||
            i.client.toLowerCase().includes(q) ||
            i.destination.toLowerCase().includes(q) ||
            i.passengerList.some((p) => p.name.toLowerCase().includes(q))) &&
          (filterStatus === 'All' || i.status === filterStatus) &&
          (filterAgent === 'All' || i.agent === filterAgent)
        );
      }),
    [itineraries, search, filterStatus, filterAgent]
  );

  const sel = 'px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white text-gray-700';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Itineraries</h2>
          <p className="text-gray-400 text-sm">{itineraries.length} total &middot; {filtered.length} shown</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onManagePipeline} className="inline-flex items-center gap-2 text-gray-600 rounded-lg px-4 py-2.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
            <Icon n="settings" c="w-4 h-4" /> Manage Stages
          </button>
          <button onClick={onCreate} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity" style={{ background: GHL.accent }}>
            <Icon n="plus" c="w-4 h-4" /> New Itinerary
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icon n="search" c="w-4 h-4" /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips, clients, travelers..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel}>
          <option value="All">All Statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className={sel}>
          <option value="All">All Agents</option>
          {AGENTS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          {(['board', 'list', 'grid'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className="p-2.5 transition-colors" style={view === v ? { background: GHL.accent, color: 'white' } : { color: '#9ca3af' }}>
              <Icon n={v === 'board' ? 'kanban' : v} c="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {view === 'board' && <BoardView itineraries={filtered} onSelect={onSelect} onUpdateStatus={onUpdateStatus} />}

      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8fafc' }} className="border-b border-gray-100">
                {['Trip / Client', 'Destination', 'Agent', 'Dates', 'Pax', 'Status', 'Revenue', 'Profit'].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((i) => {
                const fin = calcFin(i);
                return (
                  <tr key={i.id} onClick={() => onSelect(i.id)} className="hover:bg-teal-50/30 cursor-pointer transition-colors">
                    <td className="px-5 py-4"><p className="font-semibold text-gray-900">{i.title}</p><p className="text-gray-400 text-xs mt-0.5">{i.client}</p></td>
                    <td className="px-5 py-4 text-gray-600">{i.destination}</td>
                    <td className="px-5 py-4 text-gray-600">{i.agent}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(i.startDate)}<br />{fmtDate(i.endDate)}</td>
                    <td className="px-5 py-4 text-gray-600">{i.passengers}</td>
                    <td className="px-5 py-4"><StatusBadge status={i.status} /></td>
                    <td className="px-5 py-4 font-medium text-gray-800">{fmt(fin.totalSell)}</td>
                    <td className="px-5 py-4 font-semibold" style={{ color: GHL.success }}>{fmt(fin.profit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((i) => {
            const fin = calcFin(i);
            return (
              <div key={i.id} onClick={() => onSelect(i.id)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-all" style={{ borderTop: `3px solid ${STATUS_META[i.status]?.dot || '#9ca3af'}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div><h3 className="font-bold text-gray-900">{i.title}</h3><p className="text-gray-400 text-xs mt-0.5">{i.client}</p></div>
                  <StatusBadge status={i.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3"><Icon n="globe" c="w-3.5 h-3.5" />{i.destination} &middot; {i.passengers} pax</div>
                <div className="border-t border-gray-50 pt-3 flex justify-between">
                  <div><p className="text-xs text-gray-400">Revenue</p><p className="font-semibold text-gray-900 text-sm">{fmt(fin.totalSell)}</p></div>
                  <div className="text-right"><p className="text-xs text-gray-400">Profit</p><p className="font-semibold text-sm" style={{ color: GHL.success }}>{fmt(fin.profit)}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
