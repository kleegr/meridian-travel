'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { Itinerary } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onAddAttraction: (name: string, city: string) => void;
}

interface Suggestion {
  name: string;
  city: string;
  type: 'attraction' | 'restaurant' | 'experience' | 'tip';
  description: string;
  tags: string[];
}

// Curated suggestion database by destination and trip type
const DESTINATION_DB: Record<string, Suggestion[]> = {
  Rome: [
    { name: 'Colosseum & Roman Forum', city: 'Rome', type: 'attraction', description: 'Skip-the-line tickets recommended. Best in early morning.', tags: ['history', 'iconic'] },
    { name: 'Vatican Museums & Sistine Chapel', city: 'Rome', type: 'attraction', description: 'Book weeks ahead. Wednesday audiences with Pope.', tags: ['art', 'religious'] },
    { name: 'Trastevere Food Tour', city: 'Rome', type: 'experience', description: 'Walking food tour through the charming Trastevere neighborhood.', tags: ['food', 'walking'] },
    { name: 'Roscioli Restaurant', city: 'Rome', type: 'restaurant', description: 'Reserve 2 weeks ahead. Famous carbonara and wine cellar.', tags: ['fine dining', 'italian'] },
    { name: 'Borghese Gallery', city: 'Rome', type: 'attraction', description: 'Timed entry only. Bernini sculptures are breathtaking.', tags: ['art', 'museum'] },
    { name: 'Sunset at Pincio Terrace', city: 'Rome', type: 'tip', description: 'Free panoramic view of Rome at sunset. Above Piazza del Popolo.', tags: ['romantic', 'free'] },
  ],
  Florence: [
    { name: 'Uffizi Gallery', city: 'Florence', type: 'attraction', description: 'Book timed tickets. Botticelli\'s Birth of Venus is a must.', tags: ['art', 'museum'] },
    { name: 'Duomo Climb', city: 'Florence', type: 'attraction', description: '463 steps to the top. Stunning views of the city.', tags: ['adventure', 'iconic'] },
    { name: 'Cooking Class in Tuscan Villa', city: 'Florence', type: 'experience', description: 'Half-day pasta making with local chef. Wine included.', tags: ['food', 'hands-on'] },
    { name: 'Trattoria Mario', city: 'Florence', type: 'restaurant', description: 'Cash only. Shared tables. Best bistecca alla fiorentina.', tags: ['local', 'authentic'] },
    { name: 'San Lorenzo Market', city: 'Florence', type: 'tip', description: 'Leather goods shopping. Bargaining expected. Go early.', tags: ['shopping', 'local'] },
  ],
  'Amalfi Coast': [
    { name: 'Path of the Gods Hike', city: 'Amalfi Coast', type: 'experience', description: 'Breathtaking coastal trail. 3-4 hours. Start from Bomerano.', tags: ['adventure', 'nature'] },
    { name: 'Ravello Gardens', city: 'Amalfi Coast', type: 'attraction', description: 'Villa Rufolo and Villa Cimbrone. Stunning clifftop gardens.', tags: ['romantic', 'scenic'] },
    { name: 'Private Boat Tour', city: 'Amalfi Coast', type: 'experience', description: 'Full day boat from Positano. Swim in hidden grottos.', tags: ['luxury', 'water'] },
    { name: 'Da Adolfo Beach Restaurant', city: 'Amalfi Coast', type: 'restaurant', description: 'Boat-access only beach restaurant in Positano. Reserve ahead.', tags: ['beach', 'seafood'] },
  ],
  'Tel Aviv': [
    { name: 'Old Jaffa Walking Tour', city: 'Tel Aviv', type: 'attraction', description: 'Ancient port city with galleries, markets, and cafes.', tags: ['history', 'culture'] },
    { name: 'Carmel Market (Shuk HaCarmel)', city: 'Tel Aviv', type: 'experience', description: 'Vibrant market. Best for spices, produce, street food.', tags: ['food', 'local'] },
    { name: 'HaBasta Restaurant', city: 'Tel Aviv', type: 'restaurant', description: 'Market-fresh Israeli cuisine. Reservations essential.', tags: ['fine dining', 'local'] },
    { name: 'Gordon Beach Sunset', city: 'Tel Aviv', type: 'tip', description: 'Best beach for families. Calm waters, great sunset view.', tags: ['beach', 'free'] },
  ],
  Jerusalem: [
    { name: 'Western Wall & Old City', city: 'Jerusalem', type: 'attraction', description: 'Free entry. Modest dress required. Early morning is quietest.', tags: ['religious', 'history'] },
    { name: 'Machane Yehuda Market', city: 'Jerusalem', type: 'experience', description: 'Bustling market by day, bar scene at night.', tags: ['food', 'nightlife'] },
    { name: 'Mount of Olives', city: 'Jerusalem', type: 'attraction', description: 'Panoramic view of Old City. Best at sunrise.', tags: ['scenic', 'religious'] },
    { name: 'Eucalyptus Restaurant', city: 'Jerusalem', type: 'restaurant', description: 'Biblical-era inspired cuisine. Unique kosher dining.', tags: ['kosher', 'unique'] },
  ],
  'Dead Sea': [
    { name: 'Ein Gedi Nature Reserve', city: 'Dead Sea', type: 'attraction', description: 'Desert oasis with waterfalls. David\'s Cave. 2-3 hour hike.', tags: ['nature', 'hiking'] },
    { name: 'Dead Sea Float & Mud Bath', city: 'Dead Sea', type: 'experience', description: 'Unique floating experience. Mineral-rich mud treatments.', tags: ['wellness', 'unique'] },
    { name: 'Masada Sunrise', city: 'Dead Sea', type: 'experience', description: 'Cable car or hike up. UNESCO site. Spectacular sunrise.', tags: ['history', 'adventure'] },
  ],
};

const TRIP_TYPE_TAGS: Record<string, string[]> = {
  Honeymoon: ['romantic', 'luxury', 'fine dining', 'scenic', 'unique'],
  Family: ['family', 'hands-on', 'nature', 'free', 'beach'],
  Adventure: ['adventure', 'hiking', 'nature', 'water', 'unique'],
  Luxury: ['luxury', 'fine dining', 'iconic', 'art'],
  Religious: ['religious', 'kosher', 'history'],
  Budget: ['free', 'local', 'authentic', 'walking'],
};

const TYPE_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  attraction: { icon: 'star', bg: '#dbeafe', color: '#1d4ed8' },
  restaurant: { icon: 'hotel', bg: '#fef3c7', color: '#d97706' },
  experience: { icon: 'globe', bg: '#ede9fe', color: '#7c3aed' },
  tip: { icon: 'bell', bg: '#ecfdf5', color: '#059669' },
};

export default function AISuggestions({ itin, onAddAttraction }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const suggestions = useMemo(() => {
    const results: Suggestion[] = [];
    const dests = itin.destinations && itin.destinations.length > 0 ? itin.destinations : (itin.destination ? itin.destination.split(',').map((d) => d.trim()) : []);
    
    dests.forEach((dest) => {
      const db = DESTINATION_DB[dest];
      if (db) results.push(...db);
    });

    // Sort by relevance to trip type
    const tripTags = TRIP_TYPE_TAGS[itin.tripType || ''] || [];
    if (tripTags.length > 0) {
      results.sort((a, b) => {
        const aScore = a.tags.filter((t) => tripTags.includes(t)).length;
        const bScore = b.tags.filter((t) => tripTags.includes(t)).length;
        return bScore - aScore;
      });
    }

    // Filter out already-added attractions
    const existingNames = new Set(itin.attractions.map((a) => a.name.toLowerCase()));
    return results.filter((s) => !existingNames.has(s.name.toLowerCase()));
  }, [itin]);

  const filtered = filter === 'all' ? suggestions : suggestions.filter((s) => s.type === filter);

  const handleAdd = (s: Suggestion) => {
    onAddAttraction(s.name, s.city);
    setAddedItems(new Set([...addedItems, s.name]));
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: GHL.border }}>
        <Icon n="star" c="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="font-semibold" style={{ color: GHL.text }}>No suggestions available</p>
        <p className="text-sm mt-1" style={{ color: GHL.muted }}>Add destinations to your itinerary to get AI-powered recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <Icon n="star" c="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-sm" style={{ color: GHL.text }}>AI Suggestions</p>
              <p className="text-[10px]" style={{ color: GHL.muted }}>
                {suggestions.length} recommendations for {(itin.destinations || []).join(', ')}
                {itin.tripType ? ` \u00b7 Optimized for ${itin.tripType}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-4">
          {[{ id: 'all', label: 'All' }, { id: 'attraction', label: 'Sights' }, { id: 'restaurant', label: 'Dining' }, { id: 'experience', label: 'Experiences' }, { id: 'tip', label: 'Tips' }].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={filter === f.id ? { background: GHL.accent, color: 'white' } : { background: GHL.bg, color: GHL.muted }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Suggestion cards */}
        <div className="space-y-2">
          {filtered.map((s, i) => {
            const tc = TYPE_ICONS[s.type];
            const wasAdded = addedItems.has(s.name);
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm" style={{ borderColor: GHL.border, opacity: wasAdded ? 0.5 : 1 }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: tc.bg, color: tc.color }}>
                  <Icon n={tc.icon} c="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: GHL.text }}>{s.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ background: tc.bg, color: tc.color }}>{s.type}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: GHL.muted }}>{s.city} \u2014 {s.description}</p>
                  <div className="flex gap-1 mt-1.5">
                    {s.tags.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: GHL.bg, color: GHL.muted }}>{t}</span>
                    ))}
                  </div>
                </div>
                {s.type !== 'tip' && (
                  <button onClick={() => handleAdd(s)} disabled={wasAdded} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={wasAdded ? { background: '#ecfdf5', color: '#059669' } : { background: GHL.accent, color: 'white' }}>
                    {wasAdded ? '\u2713 Added' : '+ Add'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
