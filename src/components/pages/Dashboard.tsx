'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL, getStatusMeta } from '@/lib/constants';
import { calcFin, fmt, fmtDate, nights } from '@/lib/utils';
import type { Itinerary, DashWidget } from '@/lib/types';

interface Props { itineraries: Itinerary[]; widgets: DashWidget[]; onToggleWidget: (id: string) => void; agents?: string[]; }

export default function Dashboard({ itineraries, widgets, onToggleWidget }: Props) {
  const stats = useMemo(() => {
    const total = itineraries.length;
    const active = itineraries.filter(i => !['Completed', 'Cancelled'].includes(i.status)).length;
    const vip = itineraries.filter(i => i.isVip).length;
    let totalRev = 0, totalProfit = 0;
    itineraries.forEach(i => { const f = calcFin(i); totalRev += f.totalSell; totalProfit += f.profit; });
    const upcoming = itineraries.filter(i => { const d = new Date(i.startDate); const now = new Date(); const diff = (d.getTime() - now.getTime()) / 86400000; return diff >= 0 && diff <= 30; }).length;
    return { total, active, vip, totalRev, totalProfit, upcoming };
  }, [itineraries]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    itineraries.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [itineraries]);

  const upcomingTrips = useMemo(() => {
    const now = new Date();
    return itineraries.filter(i => new Date(i.startDate) >= now).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 5);
  }, [itineraries]);

  const recentTrips = useMemo(() => {
    return [...itineraries].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()).slice(0, 5);
  }, [itineraries]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Dashboard</h2>
        <p className="text-sm" style={{ color: GHL.muted }}>Overview of your travel business</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Trips', value: stats.total, icon: 'map', color: GHL.accent, bg: GHL.accentLight },
          { label: 'Active', value: stats.active, icon: 'plane', color: '#0369a1', bg: '#e0f2fe' },
          { label: 'VIP Clients', value: stats.vip, icon: 'star', color: '#d97706', bg: '#fef3c7' },
          { label: 'Upcoming (30d)', value: stats.upcoming, icon: 'calendar', color: '#7c3aed', bg: '#f3e8ff' },
          { label: 'Revenue', value: fmt(stats.totalRev), icon: 'dollar', color: '#065f46', bg: '#ecfdf5' },
          { label: 'Profit', value: fmt(stats.totalProfit), icon: 'trend', color: stats.totalProfit >= 0 ? '#065f46' : '#991b1b', bg: stats.totalProfit >= 0 ? '#ecfdf5' : '#fef2f2' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border p-4 shadow-sm transition-all hover:shadow-md" style={{ borderColor: GHL.border }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: m.bg, color: m.color }}><Icon n={m.icon} c="w-4 h-4" /></span>
            </div>
            <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5" style={{ color: GHL.muted }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status breakdown */}
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GHL.text }}>Status Breakdown</h3>
            <div className="space-y-2.5">
              {statusBreakdown.map(([status, count]) => {
                const meta = getStatusMeta(status);
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium" style={{ color: GHL.text }}>{status}</div>
                    <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: GHL.bg }}>
                      <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max(pct, 8)}%`, background: meta.bg }}>
                        <span className="text-[10px] font-bold" style={{ color: meta.color }}>{count}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium w-10 text-right" style={{ color: GHL.muted }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recently created */}
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GHL.text }}>Recent Itineraries</h3>
            <div className="space-y-2">
              {recentTrips.map(trip => {
                const meta = getStatusMeta(trip.status);
                const n = nights(trip.startDate, trip.endDate);
                return (
                  <div key={trip.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50/70 transition-colors" style={{ background: GHL.bg + '60' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: meta.bg, color: meta.color }}>{trip.title.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: GHL.text }}>{trip.title}</p>
                      <p className="text-[10px]" style={{ color: GHL.muted }}>{trip.client} {String.fromCharCode(8226)} {trip.destination} {String.fromCharCode(8226)} {n} nights</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>{trip.status}</span>
                  </div>
                );
              })}
              {recentTrips.length === 0 && <p className="text-sm text-center py-4" style={{ color: GHL.muted }}>No itineraries yet</p>}
            </div>
          </div>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-5">
          {/* Upcoming trips */}
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GHL.text }}>Upcoming Departures</h3>
            <div className="space-y-3">
              {upcomingTrips.map(trip => {
                const daysAway = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000);
                return (
                  <div key={trip.id} className="flex items-center gap-3">
                    <div className="text-center flex-shrink-0" style={{ minWidth: 44 }}>
                      <p className="text-lg font-bold leading-none" style={{ color: daysAway <= 7 ? '#dc2626' : GHL.accent }}>{daysAway}</p>
                      <p className="text-[8px] uppercase font-bold" style={{ color: GHL.muted }}>days</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: GHL.text }}>{trip.title}</p>
                      <p className="text-[10px]" style={{ color: GHL.muted }}>{trip.client} {String.fromCharCode(8226)} {fmtDate(trip.startDate)}</p>
                    </div>
                    {trip.isVip && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#fef3c7', color: '#d97706' }}>VIP</span>}
                  </div>
                );
              })}
              {upcomingTrips.length === 0 && <p className="text-xs text-center py-3" style={{ color: GHL.muted }}>No upcoming trips</p>}
            </div>
          </div>

          {/* Quick stats card */}
          <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${GHL.sidebar}, ${GHL.accent})` }}>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-3">Quick Overview</p>
            <div className="space-y-3">
              {[
                { label: 'Avg trip value', value: stats.total > 0 ? fmt(Math.round(stats.totalRev / stats.total)) : '$0' },
                { label: 'Avg margin', value: stats.totalRev > 0 ? `${Math.round((stats.totalProfit / stats.totalRev) * 100)}%` : '0%' },
                { label: 'VIP rate', value: stats.total > 0 ? `${Math.round((stats.vip / stats.total) * 100)}%` : '0%' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs opacity-80">{s.label}</span>
                  <span className="text-sm font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
