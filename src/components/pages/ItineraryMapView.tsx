'use client';

import { useMemo, useState, useEffect } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { Itinerary } from '@/lib/types';

interface Props {
  itin: Itinerary;
}

interface MapPoint {
  label: string;
  type: 'flight-dep' | 'flight-arr' | 'hotel' | 'activity' | 'transfer';
  city: string;
  detail: string;
  date?: string;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  'flight-dep': { bg: '#dbeafe', border: '#3b82f6', icon: 'plane' },
  'flight-arr': { bg: '#dbeafe', border: '#3b82f6', icon: 'plane' },
  hotel: { bg: '#fef3c7', border: '#f59e0b', icon: 'hotel' },
  activity: { bg: '#fce7f3', border: '#ec4899', icon: 'star' },
  transfer: { bg: '#ede9fe', border: '#8b5cf6', icon: 'car' },
};

export default function ItineraryMapView({ itin }: Props) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);

  // Fetch API key from server
  useEffect(() => {
    fetch('/api/places?action=key')
      .then((r) => r.json())
      .then((d) => { if (d.key) setApiKey(d.key); else setMapError(true); })
      .catch(() => setMapError(true));
  }, []);

  const points = useMemo(() => {
    const pts: MapPoint[] = [];
    itin.flights.forEach((f) => {
      pts.push({ label: `${f.airline} ${f.flightNo}`, type: 'flight-dep', city: f.fromCity || f.from, detail: `Departs ${f.scheduledDeparture || ''}`, date: f.departure?.split('T')[0] });
      pts.push({ label: `${f.airline} ${f.flightNo}`, type: 'flight-arr', city: f.toCity || f.to, detail: `Arrives ${f.scheduledArrival || ''}`, date: f.arrival?.split('T')[0] });
    });
    itin.hotels.forEach((h) => {
      pts.push({ label: h.name, type: 'hotel', city: h.city, detail: `${h.roomType || 'Room'} · ${h.checkIn} to ${h.checkOut}`, date: h.checkIn });
    });
    itin.attractions.forEach((a) => {
      pts.push({ label: a.name, type: 'activity', city: a.city, detail: `${a.ticketType || 'Activity'} · ${a.time || ''}`, date: a.date });
    });
    itin.transport.forEach((t) => {
      pts.push({ label: `${t.type} - ${t.provider || ''}`, type: 'transfer', city: t.pickup, detail: `${t.pickup} \u2192 ${t.dropoff}`, date: t.pickupDateTime?.split('T')[0] });
    });
    return pts.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [itin]);

  // Get unique cities for the map
  const cities = useMemo(() => {
    const unique = new Set<string>();
    points.forEach((p) => { if (p.city) unique.add(p.city); });
    return Array.from(unique);
  }, [points]);

  // Build Google Maps embed URL with all cities as waypoints
  const mapUrl = useMemo(() => {
    if (!apiKey || cities.length === 0) return '';
    if (cities.length === 1) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(cities[0])}&zoom=12`;
    }
    const origin = encodeURIComponent(cities[0]);
    const destination = encodeURIComponent(cities[cities.length - 1]);
    const waypoints = cities.length > 2 ? cities.slice(1, -1).map(encodeURIComponent).join('|') : '';
    return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&mode=flying`;
  }, [apiKey, cities]);

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: GHL.border }}>
        {mapUrl ? (
          <iframe src={mapUrl} width="100%" height="400" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : mapError ? (
          <div className="h-[400px] flex items-center justify-center" style={{ background: GHL.bg }}>
            <div className="text-center">
              <Icon n="map" c="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: GHL.muted }}>Google Maps API key not configured</p>
              <p className="text-xs mt-1" style={{ color: GHL.muted }}>Add GOOGLE_PLACES_API_KEY and enable Maps Embed API</p>
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center" style={{ background: GHL.bg }}>
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} />
          </div>
        )}
      </div>

      {/* Trip Stops List */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: GHL.border }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.muted }}>Trip Stops ({points.length})</p>
        <div className="space-y-1.5">
          {points.map((pt, i) => {
            const tc = TYPE_COLORS[pt.type];
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
                  <Icon n={tc.icon} c="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: GHL.text }}>{pt.label}</p>
                  <p className="text-[10px] truncate" style={{ color: GHL.muted }}>{pt.city} · {pt.detail}</p>
                </div>
                {pt.date && <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: GHL.bg, color: GHL.muted }}>{pt.date}</span>}
              </div>
            );
          })}
          {points.length === 0 && <p className="text-sm text-center py-4" style={{ color: GHL.muted }}>Add flights, hotels, and activities to see them on the map</p>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {[{ type: 'flight-dep', label: 'Flights' }, { type: 'hotel', label: 'Hotels' }, { type: 'activity', label: 'Activities' }, { type: 'transfer', label: 'Transfers' }].map(({ type, label }) => {
          const tc = TYPE_COLORS[type];
          return (
            <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: GHL.muted }}>
              <span className="w-3 h-3 rounded" style={{ background: tc.bg, border: `1px solid ${tc.border}` }} />
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
