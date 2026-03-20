// Destination Image System
// Maps destinations to curated Unsplash images for automatic visual content
// Provides fallback images by region and category

const DEST_IMAGES: Record<string, string> = {
  // Europe
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
  'italy': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200',
  'milan': 'https://images.unsplash.com/photo-1520440229-6469625e4920?w=1200',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
  'france': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
  'england': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
  'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200',
  'spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1200',
  'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200',
  'prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200',
  'vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200',
  'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200',
  'germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200',
  'zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1200',
  'switzerland': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=1200',
  'greece': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200',
  'santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200',
  'portugal': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200',
  'lisbon': 'https://images.unsplash.com/photo-1588162256227-baad82a3b996?w=1200',
  // Middle East
  'israel': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1200',
  'jerusalem': 'https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=1200',
  'tel aviv': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1200',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
  'morocco': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200',
  // Americas
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
  'miami': 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=1200',
  'los angeles': 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=1200',
  'cancun': 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200',
  'mexico': 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200',
  'caribbean': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200',
  // Asia
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
  'japan': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
  'thailand': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200',
  'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200',
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200',
  // Fallback categories
  'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
  'mountain': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200',
  'city': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200',
  'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200',
};

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200',
];

const FALLBACK_HOTEL = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
const FALLBACK_ATTRACTION = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800';
const FALLBACK_FLIGHT = 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800';

export function getDestinationImage(destination: string, coverImage?: string): string {
  if (coverImage) return coverImage;
  const lower = destination.toLowerCase().trim();
  // Try exact match
  if (DEST_IMAGES[lower]) return DEST_IMAGES[lower];
  // Try partial match
  for (const [key, url] of Object.entries(DEST_IMAGES)) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }
  // Deterministic fallback
  let hash = 0;
  for (let i = 0; i < lower.length; i++) hash = ((hash << 5) - hash) + lower.charCodeAt(i);
  return FALLBACK_COVERS[Math.abs(hash) % FALLBACK_COVERS.length];
}

export function getCityImage(city: string): string {
  const lower = city.toLowerCase().trim();
  if (DEST_IMAGES[lower]) return DEST_IMAGES[lower];
  for (const [key, url] of Object.entries(DEST_IMAGES)) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }
  return DEST_IMAGES['city'];
}

export function getHotelImage(hotelName: string, city: string, photos?: string[]): string {
  if (photos && photos.length > 0) return photos[0];
  return getCityImage(city) || FALLBACK_HOTEL;
}

export function getAttractionImage(name: string, city: string): string {
  return getCityImage(city) || FALLBACK_ATTRACTION;
}

export function getFlightImage(): string {
  return FALLBACK_FLIGHT;
}

export { FALLBACK_COVERS, FALLBACK_HOTEL, FALLBACK_ATTRACTION };
