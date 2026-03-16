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
      pts.push({ label: h.name, type: 'hotel', city: h.city, detail: `${h.roomType || 'Room'} \u00b7 ${h.checkIn} to ${h.checkOut}`, date: h.checkIn });
    });
    itin.attractions.forEach((a) => {
      pts.push({ label: a.name, type: 'activity', city: a.city, detail: `${a.ticketType || 'Activity'} \u00b7 ${a.time || ''}`, date: a.date });
    });
    itin.transport.forEach((t) => {
      pts.push({ label: `${t.type} - ${t.provider || ''}`, type: 'transfer', city: t.pickup, detail: `${t.pickup} \u2192 ${t.dropoff}`, date: t.pickupDateTime?.split('T')[0] });
    });
    return pts.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [itin]);

  const cities = useMemo(() => {
    const unique = new Set<string>();
    // First add destinations from the itinerary itself
    if (itin.destinations && itin.destinations.length > 0) {
      itin.destinations.forEach((d) => { if (d.trim()) unique.add(d.trim()); });
    } else if (itin.destination) {
      itin.destination.split(',').forEach((d) => { if (d.trim()) unique.add(d.trim()); });
    }
    // Then add cities from booking components
    points.forEach((p) => { if (p.city) unique.add(p.city); });
    return Array.from(unique);
  }, [itin, points]);

  // Build Google Maps embed URL — use "view" mode with markers for each city
  // This shows destination pins instead of a driving route
  const mapUrl = useMemo(() => {
    if (!apiKey || cities.length === 0) return '';
    if (cities.length === 1) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(cities[0])}&zoom=10`;
    }
    // For multiple cities, use search mode with all cities joined — this shows pins
    // Better than directions mode which forces a driving route
    const query = cities.join(' | ');
    return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(query)}&zoom=4`;
  }, [apiKey, cities]);

  return (
    <div className="space-y-4">
      {/* Map with city pins */}
      <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="px-4 py-2 flex items-center justify-between" style={{ background: GHL.bg }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Trip Map \u2014 {cities.length} Destinations</p>
          <div className="flex gap-3">
            {[{ type: 'flight-dep', label: 'Flights' }, { type: 'hotel', label: 'Hotels' }, { type: 'activity', label: 'Activities' }, { type: 'transfer', label: 'Transfers' }].map(({ type, label }) => {
              const tc = TYPE_COLORS[type];
              return <div key={type} className="flex items-center gap-1 text-[10px]" style={{ color: GHL.muted }}><span className="w-2.5 h-2.5 rounded" style={{ background: tc.bg, border: `1px solid ${tc.border}` }} />{label}</div>;
            })}
          </div>
        </div>
        {mapUrl ? (
          <iframe src={mapUrl} width="100%" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : mapError ? (
          <div className="h-[450px] flex items-center justify-center" style={{ background: GHL.bg }}>
            <div className="text-center">
              <Icon n="map" c="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: GHL.muted }}>Google Maps API key not configured</p>
              <p className="text-xs mt-1" style={{ color: GHL.muted }}>Add GOOGLE_PLACES_API_KEY and enable Maps Embed API</p>
            </div>
          </div>
        ) : (
          <div className="h-[450px] flex items-center justify-center" style={{ background: GHL.bg }}>
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} />
          </div>
        )}
      </div>

      {/* Destination Cities Grid */}
      {cities.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: GHL.border }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.muted }}>Destination Cities</p>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <span key={city} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: GHL.accentLight, color: GHL.accent }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6.999 2.5 2.5 0 0112 11.5z" /></svg>
                {city}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trip Stops Timeline */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: GHL.border }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Trip Route ({points.length} stops)</p>
        <div className="space-y-0">
          {points.map((pt, i) => {
            const tc = TYPE_COLORS[pt.type];
            const isLast = i === points.length - 1;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tc.bg, border: `1.5px solid ${tc.border}` }}>
                    <Icon n={tc.icon} c="w-3.5 h-3.5" />
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 my-1" style={{ background: '#e2e8f0', minHeight: 20 }} />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: GHL.text }}>{pt.label}</p>
                    {pt.date && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: GHL.bg, color: GHL.muted }}>{pt.date}</span>}
                  </div>
                  <p className="text-xs" style={{ color: GHL.muted }}>{pt.city} \u00b7 {pt.detail}</p>
                </div>
              </div>
            );
          })}
          {points.length === 0 && <p className="text-sm text-center py-6" style={{ color: GHL.muted }}>Add flights, hotels, and activities to see them on the map</p>}
        </div>
      </div>
    </div>
  );
}
