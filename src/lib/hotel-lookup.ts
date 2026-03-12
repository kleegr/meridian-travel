// Hotel lookup via our Next.js API route that proxies Google Places

export interface HotelSearchResult {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  priceLevel: number;
  photo: string | null;
  location: { lat: number; lng: number };
}

export interface HotelDetails {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  totalRatings: number;
  priceLevel: number;
  location: { lat: number; lng: number };
  photos: { ref: string; width: number; height: number }[];
  reviews: { author: string; rating: number; text: string; time: string }[];
  hours: string[];
}

export async function searchHotels(query: string): Promise<HotelSearchResult[]> {
  try {
    const res = await fetch(`/api/places?action=search&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Hotel search error:', err);
    return [];
  }
}

export async function getHotelDetails(placeId: string): Promise<HotelDetails | null> {
  try {
    const res = await fetch(`/api/places?action=details&placeId=${encodeURIComponent(placeId)}`);
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch (err) {
    console.error('Hotel details error:', err);
    return null;
  }
}

export function getPhotoUrl(ref: string, maxWidth = 800): string {
  return `/api/places?action=photo&ref=${encodeURIComponent(ref)}&maxWidth=${maxWidth}`;
}
