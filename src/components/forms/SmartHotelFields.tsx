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

const COMMON_ROOM_TYPES = [
  'Standard Room', 'Superior Room', 'Deluxe Room', 'Deluxe Suite',
  'Junior Suite', 'Executive Suite', 'Presidential Suite', 'Penthouse Suite',
  'Studio', 'Family Room', 'Connecting Rooms', 'Accessible Room',
  'Ocean View', 'Garden View', 'Pool View', 'City View', 'Mountain View',
  'Overwater Villa', 'Beach Villa', 'Pool Villa', 'Private Villa',
  'Bungalow', 'Cottage', 'Tent Suite', 'Treehouse',
  'Single', 'Double', 'Twin', 'Triple', 'Quad',
  'King Room', 'Queen Room', 'Park Deluxe', 'Club Room', 'Loft',
];

export default function SmartHotelFields({ form, set }: Props) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [details, setDetails] = useState<HotelDetails | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  const handleSearch = useCallback(async () => {
    const query = `${form.name || ''} ${form.city || ''} hotel`.trim();
    if (query.length < 3) return;
    setSearching(true);
    const res = await searchHotels(query);
    setResults(res); setShowResults(true); setSearching(false);
  }, [form.name, form.city]);

  const handleSelectHotel = useCallback(async (hotel: HotelSearchResult) => {
    set('name', hotel.name);
    const parts = hotel.address.split(',');
    if (parts.length >= 2) set('city', parts.slice(-2).join(',').trim());
    setShowResults(false);

    const d = await getHotelDetails(hotel.placeId);
    if (d) {
      setDetails(d);
      if (d.address) set('hotelAddress', d.address);
      if (d.phone) set('hotelPhone', d.phone);
      if (d.website) set('hotelWebsite', d.website);
      if (d.rating) set('hotelRating', String(d.rating));
      // Store photo refs so they persist on the hotel record and show on itinerary
      if (d.photos.length > 0) {
        const photoUrls = d.photos.map((p) => getPhotoUrl(p.ref, 600));
        set('hotelPhotos', JSON.stringify(photoUrls));
      }
    }
  }, [set]);

  const stars = (n: number) => '\u2605'.repeat(Math.round(n)) + '\u2606'.repeat(5 - Math.round(n));

  // Parse stored photos
  const storedPhotos: string[] = form.hotelPhotos ? (() => { try { return JSON.parse(form.hotelPhotos); } catch { return []; } })() : [];
  const displayPhotos = details?.photos.length ? details.photos.map((p) => getPhotoUrl(p.ref, 400)) : storedPhotos;

  return (
    <div className="space-y-4">
      {/* Hotel Name + Search */}
      <div>
        <label className={lc} style={{ color: GHL.muted }}>Hotel Name *</label>
        <div className="flex gap-2">
          <input value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Start typing hotel name..." className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />
          <button type="button" onClick={handleSearch} disabled={searching} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 flex items-center gap-2" style={{ background: GHL.accent }}>
            {searching ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <Icon n="search" c="w-4 h-4" />}
            Lookup
          </button>
        </div>
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && <div className="border rounded-xl overflow-hidden" style={{ borderColor: GHL.border }}>
        <p className="px-4 py-2 text-xs font-semibold uppercase" style={{ background: GHL.bg, color: GHL.muted }}>Select a hotel</p>
        {results.map((h) => (
          <div key={h.placeId} onClick={() => handleSelectHotel(h)} className="flex items-center gap-3 px-4 py-3 border-t cursor-pointer hover:bg-blue-50/40" style={{ borderColor: GHL.border }}>
            {h.photo ? <img src={getPhotoUrl(h.photo, 100)} alt={h.name} className="w-16 h-12 rounded-lg object-cover flex-shrink-0" /> : <div className="w-16 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: GHL.bg }}><Icon n="hotel" c="w-5 h-5" /></div>}
            <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate" style={{ color: GHL.text }}>{h.name}</p><p className="text-xs truncate" style={{ color: GHL.muted }}>{h.address}</p>{h.rating && <p className="text-xs mt-0.5"><span style={{ color: '#f59e0b' }}>{stars(h.rating)}</span> <span style={{ color: GHL.muted }}>{h.rating} ({h.totalRatings})</span></p>}</div>
          </div>
        ))}
      </div>}

      {/* Hotel Photos — from Google Places (persist to itinerary) */}
      {displayPhotos.length > 0 && <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Hotel Photos <span className="font-normal normal-case">(shown on client itinerary)</span></p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayPhotos.map((url, i) => (
            <div key={i} className="relative flex-shrink-0">
              <img src={url} alt="Hotel" className={`w-36 h-28 rounded-lg object-cover cursor-pointer transition-all ${selectedPhotoIdx === i ? 'ring-2 ring-blue-500 scale-105' : 'hover:opacity-80'}`} onClick={() => setSelectedPhotoIdx(selectedPhotoIdx === i ? null : i)} />
              {i === 0 && <span className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">Main</span>}
            </div>
          ))}
        </div>
        {selectedPhotoIdx !== null && <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: GHL.border }}><img src={displayPhotos[selectedPhotoIdx]} alt="Hotel" className="w-full h-64 object-cover" /></div>}
      </div>}

      {/* Hotel info card */}
      {details && <div className="p-4 rounded-xl" style={{ background: GHL.bg }}>
        <p className="font-bold text-sm mb-2" style={{ color: GHL.text }}>{details.name}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {details.address && <div className="col-span-2"><span style={{ color: GHL.muted }}>Address: </span><span style={{ color: GHL.text }}>{details.address}</span></div>}
          {details.phone && <div><span style={{ color: GHL.muted }}>Phone: </span><span style={{ color: GHL.text }}>{details.phone}</span></div>}
          {details.website && <div><a href={details.website} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: GHL.accent }}>Visit Website</a></div>}
          {details.rating && <div><span style={{ color: '#f59e0b' }}>{stars(details.rating)}</span> {details.rating} ({details.totalRatings} reviews)</div>}
        </div>
      </div>}

      {/* Form fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>City / Location</label><GooglePlacesInput value={form.city || ''} onChange={(v) => set('city', v)} placeholder="Rome, Italy" className={ic + ' pl-9'} /></div>
        <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Hotel Address</label><input value={form.hotelAddress || ''} onChange={(e) => set('hotelAddress', e.target.value)} placeholder="Auto-filled from lookup" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Phone</label><input value={form.hotelPhone || ''} onChange={(e) => set('hotelPhone', e.target.value)} placeholder="Auto-filled" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Website</label><input value={form.hotelWebsite || ''} onChange={(e) => set('hotelWebsite', e.target.value)} placeholder="Auto-filled" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Check-In</label><input type="date" value={form.checkIn || ''} onChange={(e) => set('checkIn', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Check-Out</label><input type="date" value={form.checkOut || ''} onChange={(e) => set('checkOut', e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Check-In Time</label><input value={form.checkInTime || ''} onChange={(e) => set('checkInTime', e.target.value)} placeholder="3:00 PM" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Check-Out Time</label><input value={form.checkOutTime || ''} onChange={(e) => set('checkOutTime', e.target.value)} placeholder="11:00 AM" className={ic} style={{ borderColor: GHL.border }} /></div>

        {/* Room Type — dropdown with common types + custom input */}
        <div>
          <label className={lc} style={{ color: GHL.muted }}>Room Type</label>
          <div className="relative">
            <input value={form.roomType || ''} onChange={(e) => set('roomType', e.target.value)} placeholder="Select or type..." className={ic} style={{ borderColor: GHL.border }} list="room-types-list" />
            <datalist id="room-types-list">{COMMON_ROOM_TYPES.map((rt) => <option key={rt} value={rt} />)}</datalist>
          </div>
        </div>
        <div><label className={lc} style={{ color: GHL.muted }}>Rooms</label><input type="number" value={form.rooms || ''} onChange={(e) => set('rooms', e.target.value)} placeholder="1" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Confirmation #</label><input value={form.ref || ''} onChange={(e) => set('ref', e.target.value)} placeholder="GTR-29821" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Source</label><input value={form.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="Direct" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Supplier</label><input value={form.supplier || ''} onChange={(e) => set('supplier', e.target.value)} placeholder="Hotel Group" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Rating</label><input value={form.hotelRating || ''} onChange={(e) => set('hotelRating', e.target.value)} placeholder="4.5" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Cost ($)</label><input type="number" value={form.cost || ''} onChange={(e) => set('cost', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div><label className={lc} style={{ color: GHL.muted }}>Sell ($)</label><input type="number" value={form.sell || ''} onChange={(e) => set('sell', e.target.value)} placeholder="0" className={ic} style={{ borderColor: GHL.border }} /></div>
        <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Notes</label><textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Special requests..." className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /></div>
      </div>
    </div>
  );
}
