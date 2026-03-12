'use client';

import { useState, useMemo } from 'react';
import { StatusBadge, StatCard } from '@/components/ui';
import { GHL, AGENTS, STATUSES } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
import type { Itinerary } from '@/lib/types';

export default function Financials({ itineraries }: { itineraries: Itinerary[] }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterAgent, setFilterAgent] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDest, setFilterDest] = useState('All');

  const destinations = useMemo(() => [...new Set(itineraries.map((i) => i.destination))], [itineraries]);
  const filtered = useMemo(() => itineraries.filter((i) => {
    if (dateFrom && i.startDate < dateFrom) return false;
    if (dateTo && i.startDate > dateTo) return false;
    if (filterAgent !== 'All' && i.agent !== filterAgent) return false;
    if (filterStatus !== 'All' && i.status !== filterStatus) return false;
    if (filterDest !== 'All' && i.destination !== filterDest) return false;
    return true;
  }), [itineraries, dateFrom, dateTo, filterAgent, filterStatus, filterDest]);

  const allFin = filtered.map((i) => ({ ...i, fin: calcFin(i) }));
  const totalRev = allFin.reduce((a, b) => a + b.fin.totalSell, 0);
  const totalCost = allFin.reduce((a, b) => a + b.fin.totalCost, 0);
  const totalProfit = allFin.reduce((a, b) => a + b.fin.profit, 0);
  const agentProfit = AGENTS.map((a) => ({ name: a, profit: allFin.filter((i) => i.agent === a).reduce((x, y) => x + y.fin.profit, 0) })).filter((a) => a.profit > 0).sort((a, b) => b.profit - a.profit);
  const sel = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white text-gray-700';

  return (
    <div className="space-y-7">
      <div><h2 className="text-2xl font-bold text-gray-900 mb-1">Financials</h2><p className="text-gray-400 text-sm">Global revenue &amp; profit overview &middot; {filtered.length} of {itineraries.length} itineraries</p></div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={sel} /></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={sel} /></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Agent</label><select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className={sel}><option value="All">All</option>{AGENTS.map((a) => <option key={a}>{a}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={sel}><option value="All">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Destination</label><select value={filterDest} onChange={(e) => setFilterDest(e.target.value)} className={sel}><option value="All">All</option>{destinations.map((d) => <option key={d}>{d}</option>)}</select></div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterAgent('All'); setFilterStatus('All'); setFilterDest('All'); }} className="px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Clear</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Revenue" value={fmt(totalRev)} sub={`${filtered.length} trips`} />
        <StatCard label="Cost" value={fmt(totalCost)} />
        <StatCard label="Profit" value={fmt(totalProfit)} accent={GHL.success} sub={`${totalRev ? ((totalProfit / totalRev) * 100).toFixed(1) : 0}% margin`} />
        <StatCard label="Avg Per Trip" value={fmt(totalProfit / (filtered.length || 1))} accent={GHL.accent} />
        <StatCard label="Outstanding" value={fmt(allFin.reduce((a, b) => a + b.fin.balance, 0))} accent={GHL.warning} />
      </div>
      {agentProfit.length > 0 && <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"><h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">Profit by Agent</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{agentProfit.map((a) => (<div key={a.name} className="text-center p-3 rounded-lg bg-gray-50"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto mb-2" style={{ background: GHL.accent }}>{a.name.split(' ').map((n) => n[0]).join('')}</div><p className="text-xs text-gray-500">{a.name}</p><p className="font-bold text-sm" style={{ color: GHL.success }}>{fmt(a.profit)}</p></div>))}</div></div>}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Itinerary P&amp;L</h3></div>
        <table className="w-full text-sm">
          <thead><tr style={{ background: '#f8fafc' }} className="border-b border-gray-100">{['Itinerary', 'Client', 'Agent', 'Dates', 'Status', 'Revenue', 'Cost', 'Profit', 'Margin'].map((h) => <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">{allFin.map((i) => (<tr key={i.id} className="hover:bg-gray-50/50"><td className="px-5 py-4 font-medium text-gray-900">{i.title}</td><td className="px-5 py-4 text-gray-600">{i.client}</td><td className="px-5 py-4 text-gray-600">{i.agent}</td><td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(i.startDate)}</td><td className="px-5 py-4"><StatusBadge status={i.status} /></td><td className="px-5 py-4 font-medium text-gray-800">{fmt(i.fin.totalSell)}</td><td className="px-5 py-4 text-gray-600">{fmt(i.fin.totalCost)}</td><td className="px-5 py-4 font-semibold" style={{ color: GHL.success }}>{fmt(i.fin.profit)}</td><td className="px-5 py-4 text-gray-500">{i.fin.margin}%</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
