'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { searchHotels, getHotelDetails, getPhotoUrl } from '@/lib/hotel-lookup';
import type { HotelSearchResult, HotelDetails } from '@/lib/hotel-lookup';
import type { FormField } from '@/lib/types';
import GooglePlacesInput from '@/components/ui/GooglePlacesInput';

interface Props {
  form: Record<string, string>;
  set: (key: string, value: string) => void;
  fields: FormField[];
}

export default function SmartHotelFields({ form, set }: Props) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [details, setDetails] = useState<HotelDetails | null>(null);
  const [showResults, setShowResults] = useState(false);

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  // Search hotels when name + city entered
  const handleSearch = useCallback(async () => {
    const query = `${form.name || ''} ${form.city || ''} hotel`.trim();
    if (query.length < 3) return;
    setSearching(true);
    const res = await searchHotels(query);
    setResults(res);
    setShowResults(true);
    setSearching(false);
  }, [form.name, form.city]);

  // Select a hotel from results
  const handleSelectHotel = useCallback(async (hotel: HotelSearchResult) => {
    set('name', hotel.name);
    set('city', hotel.address.split(',').slice(-2).join(',').trim());
    setShowResults(false);

    // Fetch full details
    const d = await getHotelDetails(hotel.placeId);
    if (d) {
      setDetails(d);
      if (d.phone) set('notes', `Phone: ${d.phone}${d.website ? ` | ${d.website}` : ''}`);
    }
  }, [set]);

  const stars = (n: number) => '\u2605'.repeat(Math.round(n)) + '\u2606'.repeat(5 - Math.round(n));

  return (
    <div className="space-y-4">
      {/* Hotel Name with search button */}
      <div>
        <label className={lc} style={{ color: GHL.muted }}>Hotel Name *</label>
        <div className="flex gap-2">
          <input value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Start typing hotel name..." className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />
          <button onClick={handleSearch} disabled={searching} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2" style={{ background: GHL.accent }}>
            {searching ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <Icon n="search" c="w-4 h-4" />}
            Lookup
          </button>
        </div>
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: GHL.border }}>
          <p className="px-4 py-2 text-xs font-semibold uppercase" style={{ background: GHL.bg, color: GHL.muted }}>Select a hotel</p>
          {results.map((h) => (
            <div key={h.placeId} onClick={() => handleSelectHotel(h)} className="flex items-center gap-3 px-4 py-3 border-t cursor-pointer hover:bg-blue-50/40 transition-colors" style={{ borderColor: GHL.border }}>
              {h.photo && <img src={getPhotoUrl(h.photo, 100)} alt={h.name} className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />}
              {!h.photo && <div className="w-16 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: GHL.bg }}><Icon n="hotel" c="w-5 h-5" /></div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: GHL.text }}>{h.name}</p>
                <p className="text-xs truncate" style={{ color: GHL.muted }}>{h.address}</p>
                {h.rating && <p className="text-xs mt-0.5"><span style={{ color: '#f59e0b' }}>{stars(h.rating)}</span> <span style={{ color: GHL.muted }}>{h.rating} ({h.totalRatings})</span></p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showResults && results.length === 0 && !searching && (
        <p className="text-sm text-center py-3" style={{ color: GHL.muted }}>No hotels found. Try a different name or city.</p>
      )}

      {/* Hotel photos from Google */}
      {details && details.photos.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Hotel Photos</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {details.photos.map((p, i) => (
              <img key={i} src={getPhotoUrl(p.ref, 300)} alt="Hotel" className="w-32 h-24 rounded-lg object-cover flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      {/* Hotel info card */}
      {details && (
        <div className="p-4 rounded-xl" style={{ background: GHL.bg }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-sm" style={{ color: GHL.text }}>{details.name}</p>
              <p className="text-xs" style={{ color: GHL.muted }}>{details.address}</p>
              {details.rating && <p className="text-xs mt-1"><span style={{ color: '#f59e0b' }}>{stars(details.rating)}</span> {details.rating} ({details.totalRatings} reviews)</p>}
            </div>
            {details.website && <a href={details.website} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: GHL.accent }}>Website</a>}
          </div>
          {details.reviews.length > 0 && (
            <div className="mt-3 space-y-2">
              {details.reviews.map((r, i) => (
                <div key={i} className="text-xs"><span className="font-semibold" style={{ color: GHL.text }}>{r.author}</span> <span style={{ color: '#f59e0b' }}>{'\u2605'.repeat(r.rating)}</span> <span style={{ color: GHL.muted }}>{r.time}</span><p className="mt-0.5" style={{ color: GHL.muted }}>{r.text}</p></div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>City</label><GooglePlacesInput value={form.city || ''} onChange={(v) => set('city', v)} placeholder="Rome, Italy" className={ic + ' pl-9'} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Check-In</label><input type="date" value={form.checkIn || ''} onChange={(e) => set('checkIn', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Check-Out</label><input type="date" value={form.checkOut || ''} onChange={(e) => set('checkOut', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Room Type</label><input value={form.roomType || ''} onChange={(e) => set('roomType', e.target.value)} placeholder="Deluxe Suite" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Rooms</label><input type="number" value={form.rooms || ''} onChange={(e) => set('rooms', e.target.value)} placeholder="1" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Confirmation #</label><input value={form.ref || ''} onChange={(e) => set('ref', e.target.value)} placeholder="GTR-29821" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Source</label><input value={form.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="Direct" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Supplier</label><input value={form.supplier || ''} onChange={(e) => set('supplier', e.target.value)} placeholder="Hotel Group" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Cost ($)</label><input type="number" value={form.cost || ''} onChange={(e) => set('cost', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Sell ($)</label><input type="number" value={form.sell || ''} onChange={(e) => set('sell', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Notes</label><textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Special requests..." className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /></div>
      </div>
    </div>
  );
}
