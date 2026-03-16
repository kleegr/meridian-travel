'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui';
import GooglePlacesInput from '@/components/ui/GooglePlacesInput';
import { GHL } from '@/lib/constants';

interface SavedPlace {
  id: number;
  name: string;
  address: string;
  timestamp: string;
}

export default function ExploreMap() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapQuery, setMapQuery] = useState('New York');
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/places?action=key')
      .then((r) => r.json())
      .then((d) => { if (d.key) setApiKey(d.key); else setMapError(true); })
      .catch(() => setMapError(true));
  }, []);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setMapQuery(query.trim());
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== query.trim().toLowerCase());
      return [query.trim(), ...filtered].slice(0, 10);
    });
  }, []);

  const handleSavePlace = () => {
    if (!mapQuery.trim()) return;
    if (savedPlaces.some((p) => p.address.toLowerCase() === mapQuery.toLowerCase())) return;
    setSavedPlaces((prev) => [{
      id: Date.now(),
      name: mapQuery.split(',')[0].trim(),
      address: mapQuery,
      timestamp: new Date().toISOString(),
    }, ...prev]);
  };

  const removePlace = (id: number) => {
    setSavedPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const mapUrl = apiKey && mapQuery
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(mapQuery)}&zoom=14`
    : '';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: GHL.text }}>Explore Map</h2>
        <p className="text-sm" style={{ color: GHL.muted }}>Search for hotels, landmarks, airports, and destinations worldwide</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex gap-3">
          <div className="flex-1">
            <GooglePlacesInput
              value={searchQuery}
              onChange={(v) => { setSearchQuery(v); if (v) handleSearch(v); }}
              placeholder="Search for a place, hotel, airport, or address..."
              className="w-full pl-9 pr-3 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            />
          </div>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="px-5 py-3 text-sm font-semibold text-white rounded-xl hover:opacity-90 shadow-sm"
            style={{ background: GHL.accent }}
          >
            <Icon n="search" c="w-4 h-4" />
          </button>
          <button
            onClick={handleSavePlace}
            className="px-4 py-3 text-sm font-medium rounded-xl border hover:bg-yellow-50"
            style={{ borderColor: GHL.border, color: '#d97706' }}
            title="Save this place"
          >
            <Icon n="star" c="w-4 h-4" />
          </button>
        </div>

        {/* Quick search chips for recent searches */}
        {recentSearches.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider self-center mr-1" style={{ color: GHL.muted }}>Recent:</span>
            {recentSearches.slice(0, 6).map((s, i) => (
              <button key={i} onClick={() => { setSearchQuery(s); handleSearch(s); }} className="text-xs px-2.5 py-1 rounded-lg hover:shadow-sm transition-all" style={{ background: GHL.bg, color: GHL.text, border: `1px solid ${GHL.border}` }}>
                {s.length > 25 ? s.slice(0, 25) + '...' : s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="px-4 py-2 flex items-center justify-between" style={{ background: GHL.bg }}>
              <div className="flex items-center gap-2">
                <Icon n="map" c="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Map View</p>
              </div>
              <p className="text-xs" style={{ color: GHL.muted }}>{mapQuery}</p>
            </div>
            {mapUrl ? (
              <iframe
                src={mapUrl}
                width="100%"
                height="550"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : mapError ? (
              <div className="h-[550px] flex items-center justify-center" style={{ background: GHL.bg }}>
                <div className="text-center">
                  <Icon n="map" c="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm" style={{ color: GHL.muted }}>Google Maps API key not configured</p>
                  <p className="text-xs mt-1" style={{ color: GHL.muted }}>Add GOOGLE_PLACES_API_KEY to enable maps</p>
                </div>
              </div>
            ) : (
              <div className="h-[550px] flex items-center justify-center" style={{ background: GHL.bg }}>
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — Saved Places */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Saved Places</p>
              <span className="text-xs" style={{ color: GHL.muted }}>{savedPlaces.length}</span>
            </div>
            {savedPlaces.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: GHL.muted }}>Search and save places you find. They'll appear here.</p>
            ) : (
              <div className="space-y-2">
                {savedPlaces.map((place) => (
                  <div key={place.id} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-blue-50/50 cursor-pointer group" style={{ background: GHL.bg }} onClick={() => { setMapQuery(place.address); setSearchQuery(place.address); }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#fef3c7', color: '#d97706' }}>
                      <Icon n="star" c="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: GHL.text }}>{place.name}</p>
                      <p className="text-[10px] truncate" style={{ color: GHL.muted }}>{place.address}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removePlace(place.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                      <Icon n="x" c="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.muted }}>Quick Search</p>
            <div className="space-y-1.5">
              {[
                { label: 'Hotels near me', query: 'Hotels', icon: 'hotel' },
                { label: 'Airports', query: 'Airports', icon: 'plane' },
                { label: 'Synagogues', query: 'Synagogues', icon: 'star' },
                { label: 'Kosher Restaurants', query: 'Kosher restaurants', icon: 'star' },
                { label: 'Car Rental', query: 'Car rental', icon: 'car' },
                { label: 'Tourist Attractions', query: 'Tourist attractions', icon: 'globe' },
              ].map((item) => (
                <button key={item.label} onClick={() => { setSearchQuery(item.query); handleSearch(item.query); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors text-left" style={{ color: GHL.text }}>
                  <Icon n={item.icon} c="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
