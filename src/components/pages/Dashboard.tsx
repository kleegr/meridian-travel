'use client';

import { useState } from 'react';
import { Icon, StatusBadge, StatCard } from '@/components/ui';
import { GHL, STATUSES, STATUS_META } from '@/lib/constants';
import { calcFin, fmt, fmtDate } from '@/lib/utils';
import type { Itinerary, DashWidget } from '@/lib/types';

interface DashboardProps {
  itineraries: Itinerary[];
  widgets: DashWidget[];
  onToggleWidget: (id: string) => void;
  agents?: string[];
}

export default function Dashboard({ itineraries, widgets, onToggleWidget, agents = [] }: DashboardProps) {
  const allFin = itineraries.map((i) => ({ ...i, fin: calcFin(i) }));
  const totalRev = allFin.reduce((a, b) => a + b.fin.totalSell, 0);
  const totalProfit = allFin.reduce((a, b) => a + b.fin.profit, 0);
  const totalCost = allFin.reduce((a, b) => a + b.fin.totalCost, 0);
  const totalOutstanding = allFin.reduce((a, b) => a + b.fin.balance, 0);
  const agentNames = agents.length > 0 ? agents : [...new Set(itineraries.map((i) => i.agent).filter(Boolean))];
  const agentStats = agentNames.map((a) => { const ag = allFin.filter((i) => i.agent === a); return { name: a, count: ag.length, profit: ag.reduce((x, y) => x + y.fin.profit, 0) }; }).filter((a) => a.count > 0).sort((a, b) => b.profit - a.profit);
  const [showCustomize, setShowCustomize] = useState(false);
  const upcoming = itineraries.filter((i) => new Date(i.startDate) > new Date() && i.status !== 'Cancelled').sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 5);
  const w = (id: string) => widgets.find((x) => x.id === id)?.enabled !== false;

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold mb-1" style={{ color: GHL.text }}>Dashboard</h2><p style={{ color: GHL.muted }} className="text-sm">Agency performance overview</p></div>
        <button onClick={() => setShowCustomize(!showCustomize)} className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors" style={{ borderColor: GHL.border, color: GHL.muted }}><Icon n="settings" c="w-4 h-4" />{showCustomize ? 'Done' : 'Customize'}</button>
      </div>

      {showCustomize && <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-1 text-sm" style={{ color: GHL.text }}>Toggle Dashboard Widgets</h3><p className="text-xs mb-3" style={{ color: GHL.muted }}>Show or hide any section</p><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{widgets.map((wg) => (<button key={wg.id} onClick={() => onToggleWidget(wg.id)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors" style={wg.enabled ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: '#f3f4f6', borderColor: '#e5e7eb', color: '#9ca3af' }}><span className="w-4 h-4 rounded border flex items-center justify-center" style={wg.enabled ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{wg.enabled && <Icon n="check" c="w-3 h-3 text-white" />}</span>{wg.label}</button>))}</div></div>}

      {w('overview') && <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl p-5 text-white shadow-sm" style={{ background: GHL.sidebar }}><p className="text-xs uppercase tracking-wider mb-2 opacity-70">Revenue</p><p className="text-xl font-bold">{fmt(totalRev)}</p><p className="text-xs opacity-50 mt-1">{itineraries.length} itineraries</p></div>
        <div className="rounded-xl p-5 text-white shadow-sm" style={{ background: GHL.accent }}><p className="text-xs uppercase tracking-wider mb-2 opacity-70">Profit</p><p className="text-xl font-bold">{fmt(totalProfit)}</p><p className="text-xs opacity-50 mt-1">{totalRev ? ((totalProfit / totalRev) * 100).toFixed(1) : 0}% margin</p></div>
        <StatCard label="Cost" value={fmt(totalCost)} />
        <StatCard label="Outstanding" value={fmt(totalOutstanding)} accent={GHL.warning} />
        <StatCard label="Confirmed" value={String(itineraries.filter((i) => i.status === 'Confirmed').length)} sub="active bookings" accent={GHL.accent} />
      </div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {w('agents') && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: GHL.text }}>Agent Performance</h3><div className="space-y-4">{agentStats.map((a) => (<div key={a.name} className="flex items-center gap-3"><div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>{a.name.split(' ').map((n) => n[0]).join('')}</div><div className="flex-1"><div className="flex justify-between mb-1"><span className="text-sm font-medium" style={{ color: GHL.text }}>{a.name}</span><span className="text-sm font-semibold" style={{ color: GHL.success }}>{fmt(a.profit)}</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, totalProfit ? (a.profit / totalProfit) * 100 : 0)}%`, background: GHL.accent }} /></div></div></div>))}</div></div>}
        {w('status') && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: GHL.text }}>Status Breakdown</h3>{STATUSES.map((s) => { const cnt = itineraries.filter((i) => i.status === s).length; const pct = itineraries.length ? (cnt / itineraries.length) * 100 : 0; const m = STATUS_META[s]; return m ? (<div key={s} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"><StatusBadge status={s} /><div className="flex items-center gap-3"><div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.dot }} /></div><span className="text-sm font-semibold w-4 text-right" style={{ color: GHL.text }}>{cnt}</span></div></div>) : null; })}</div>}
      </div>

      {w('upcoming') && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: GHL.text }}>Upcoming Trips</h3>{upcoming.length ? <div className="space-y-3">{upcoming.map((i) => (<div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GHL.accentLight }}><Icon n="plane" c="w-4 h-4" /></div><div><p className="font-semibold text-sm" style={{ color: GHL.text }}>{i.title}</p><p className="text-xs" style={{ color: GHL.muted }}>{i.client} &middot; {i.destination}</p></div></div><div className="text-right"><p className="text-sm font-medium" style={{ color: GHL.text }}>{fmtDate(i.startDate)}</p><StatusBadge status={i.status} /></div></div>))}</div> : <p className="text-sm" style={{ color: GHL.muted }}>No upcoming trips</p>}</div>}

      {w('checklist') && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: GHL.text }}>Itinerary Completion</h3><div className="space-y-2">{itineraries.filter((i) => i.status !== 'Cancelled' && i.status !== 'Completed').slice(0, 5).map((i) => { const done = i.checklist.filter((c) => c.done).length; const total = i.checklist.length || 1; const pct = Math.round((done / total) * 100); return (<div key={i.id} className="flex items-center gap-3"><div className="flex-1"><div className="flex justify-between mb-1"><span className="text-sm font-medium" style={{ color: GHL.text }}>{i.title}</span><span className="text-xs" style={{ color: GHL.muted }}>{done}/{total}</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? GHL.success : GHL.accent }} /></div></div></div>); })}</div></div>}
    </div>
  );
}
