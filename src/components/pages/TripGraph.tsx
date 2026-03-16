'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { Itinerary } from '@/lib/types';

interface Props { itin: Itinerary; }

interface GraphNode { id: string; label: string; type: 'city' | 'flight' | 'hotel' | 'activity' | 'transfer'; x: number; y: number; color: string; bg: string; icon: string; detail: string; }
interface GraphEdge { from: string; to: string; label: string; }

const NODE_COLORS = { city: { color: '#093168', bg: '#D0E2FA', icon: 'map' }, flight: { color: '#3b82f6', bg: '#dbeafe', icon: 'plane' }, hotel: { color: '#f59e0b', bg: '#fef3c7', icon: 'hotel' }, activity: { color: '#ec4899', bg: '#fce7f3', icon: 'star' }, transfer: { color: '#8b5cf6', bg: '#ede9fe', icon: 'car' } };

export default function TripGraph({ itin }: Props) {
  const { nodes, edges } = useMemo(() => {
    const n: GraphNode[] = [];
    const e: GraphEdge[] = [];
    const cities = new Set<string>();
    const dests = itin.destinations?.length > 0 ? itin.destinations : (itin.destination ? itin.destination.split(',').map((d) => d.trim()) : []);

    // City nodes
    dests.forEach((city, i) => {
      if (!city.trim()) return;
      cities.add(city);
      const nc = NODE_COLORS.city;
      n.push({ id: `city-${city}`, label: city, type: 'city', x: 80 + i * 200, y: 60, color: nc.color, bg: nc.bg, icon: nc.icon, detail: 'Destination' });
    });

    // Flight nodes
    itin.flights.forEach((f, i) => {
      const nc = NODE_COLORS.flight;
      const fId = `flight-${f.id}`;
      n.push({ id: fId, label: `${f.airline} ${f.flightNo}`, type: 'flight', x: 60 + i * 180, y: 180, color: nc.color, bg: nc.bg, icon: nc.icon, detail: `${f.from} \u2192 ${f.to}` });
      const fromCity = dests.find((c) => c.toLowerCase().includes((f.fromCity || f.from || '').toLowerCase().slice(0, 3)));
      const toCity = dests.find((c) => c.toLowerCase().includes((f.toCity || f.to || '').toLowerCase().slice(0, 3)));
      if (fromCity) e.push({ from: `city-${fromCity}`, to: fId, label: 'departs' });
      if (toCity) e.push({ from: fId, to: `city-${toCity}`, label: 'arrives' });
    });

    // Hotel nodes
    itin.hotels.forEach((h, i) => {
      const nc = NODE_COLORS.hotel;
      const hId = `hotel-${h.id}`;
      n.push({ id: hId, label: h.name, type: 'hotel', x: 100 + i * 200, y: 300, color: nc.color, bg: nc.bg, icon: nc.icon, detail: `${h.checkIn} - ${h.checkOut}` });
      const city = dests.find((c) => c.toLowerCase() === h.city.toLowerCase());
      if (city) e.push({ from: `city-${city}`, to: hId, label: 'stays at' });
    });

    // Activity nodes
    itin.attractions.forEach((a, i) => {
      const nc = NODE_COLORS.activity;
      const aId = `act-${a.id}`;
      n.push({ id: aId, label: a.name, type: 'activity', x: 60 + i * 160, y: 420, color: nc.color, bg: nc.bg, icon: nc.icon, detail: a.city });
      const city = dests.find((c) => c.toLowerCase() === a.city.toLowerCase());
      if (city) e.push({ from: `city-${city}`, to: aId, label: 'visit' });
    });

    // Transport nodes
    itin.transport.forEach((t, i) => {
      const nc = NODE_COLORS.transfer;
      const tId = `trans-${t.id}`;
      n.push({ id: tId, label: `${t.type}`, type: 'transfer', x: 140 + i * 180, y: 540, color: nc.color, bg: nc.bg, icon: nc.icon, detail: `${t.pickup} \u2192 ${t.dropoff}` });
    });

    // Connect cities in order
    const cityList = Array.from(cities);
    for (let i = 0; i < cityList.length - 1; i++) {
      e.push({ from: `city-${cityList[i]}`, to: `city-${cityList[i + 1]}`, label: 'next' });
    }

    return { nodes: n, edges: e };
  }, [itin]);

  const svgWidth = Math.max(700, nodes.reduce((max, n) => Math.max(max, n.x + 160), 0));
  const svgHeight = Math.max(400, nodes.reduce((max, n) => Math.max(max, n.y + 80), 0));

  const getNodePos = (id: string) => { const node = nodes.find((n) => n.id === id); return node ? { x: node.x, y: node.y } : { x: 0, y: 0 }; };

  if (nodes.length === 0) {
    return (<div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: GHL.border }}><Icon n="globe" c="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="font-semibold" style={{ color: GHL.text }}>No trip data to visualize</p><p className="text-sm mt-1" style={{ color: GHL.muted }}>Add destinations, flights, and hotels to see the trip graph</p></div>);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: GHL.bg }}>
          <div><p className="text-sm font-semibold" style={{ color: GHL.text }}>Trip Graph</p><p className="text-[10px]" style={{ color: GHL.muted }}>Visual map of all trip components and connections</p></div>
          <div className="flex gap-3">{Object.entries(NODE_COLORS).map(([type, c]) => (<div key={type} className="flex items-center gap-1 text-[10px]" style={{ color: GHL.muted }}><span className="w-3 h-3 rounded" style={{ background: c.bg, border: `1px solid ${c.color}` }} />{type}</div>))}</div>
        </div>
        <div className="overflow-auto" style={{ maxHeight: 600 }}>
          <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="block">
            {/* Edges */}
            {edges.map((edge, i) => { const from = getNodePos(edge.from); const to = getNodePos(edge.to); return (<line key={i} x1={from.x + 60} y1={from.y + 20} x2={to.x + 60} y2={to.y + 20} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />); })}
            {/* Nodes */}
            {nodes.map((node) => (<g key={node.id}><rect x={node.x} y={node.y} width={120} height={40} rx={10} fill={node.bg} stroke={node.color} strokeWidth={1.5} /><text x={node.x + 60} y={node.y + 18} textAnchor="middle" fontSize={10} fontWeight={600} fill={node.color}>{node.label.length > 14 ? node.label.slice(0, 14) + '...' : node.label}</text><text x={node.x + 60} y={node.y + 32} textAnchor="middle" fontSize={8} fill="#94a3b8">{node.detail.length > 18 ? node.detail.slice(0, 18) + '...' : node.detail}</text></g>))}
          </svg>
        </div>
      </div>
    </div>
  );
}
