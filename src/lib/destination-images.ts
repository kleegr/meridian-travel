// Destination & Airport Image System
// Maps destinations, cities, and airports to curated Unsplash images

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
  'florence': 'https://images.unsplash.com/photo-1543429257-3eb0b65d9c58?w=1200',
  'venice': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1200',
  'naples': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200',
  'amalfi': 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=1200',
  'dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200',
  'edinburgh': 'https://images.unsplash.com/photo-1506377585622-bedcbb5f6f5f?w=1200',
  'budapest': 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=1200',
  'krakow': 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=1200',
  'copenhagen': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1200',
  'stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1200',
  // Middle East
  'israel': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1200',
  'jerusalem': 'https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=1200',
  'tel aviv': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1200',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
  'morocco': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200',
  'jordan': 'https://images.unsplash.com/photo-1548786811-dd6e453ccca7?w=1200',
  'turkey': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200',
  'istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200',
  // Americas
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
  'miami': 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=1200',
  'los angeles': 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=1200',
  'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200',
  'cancun': 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200',
  'mexico': 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200',
  'caribbean': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200',
  'costa rica': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=1200',
  'hawaii': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=1200',
  'orlando': 'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?w=1200',
  'las vegas': 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200',
  'chicago': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200',
  'toronto': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1200',
  // Asia
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
  'japan': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
  'kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
  'thailand': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200',
  'bangkok': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200',
  'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200',
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200',
  'hong kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1200',
  'india': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200',
  // Africa
  'cape town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200',
  'safari': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200',
  'kenya': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200',
  // Oceania
  'australia': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200',
  'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200',
  'new zealand': 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=1200',
  // Fallbacks
  'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
  'mountain': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200',
  'city': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200',
  'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200',
};

// Airport images by IATA code and city
const AIRPORT_IMAGES: Record<string, string> = {
  // Major US airports
  'jfk': 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800',
  'ewr': 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800',
  'lga': 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800',
  'lax': 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800',
  'ord': 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
  'mia': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
  'sfo': 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800',
  'atl': 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
  // European
  'lhr': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'cdg': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'fco': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'mxp': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'ams': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'fra': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'mad': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'bcn': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'zrh': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'ist': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  // Middle East
  'tlv': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
  'dxb': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
  // Asia
  'nrt': 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800',
  'hnd': 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800',
  'sin': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
  'hkg': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
  'bkk': 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800',
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
  if (DEST_IMAGES[lower]) return DEST_IMAGES[lower];
  for (const [key, url] of Object.entries(DEST_IMAGES)) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }
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

export function getAirportImage(code: string): string {
  const lower = code.toLowerCase().trim();
  if (AIRPORT_IMAGES[lower]) return AIRPORT_IMAGES[lower];
  return FALLBACK_FLIGHT;
}

export function getFlightImage(fromCode?: string, toCode?: string): string {
  if (fromCode && AIRPORT_IMAGES[fromCode.toLowerCase()]) return AIRPORT_IMAGES[fromCode.toLowerCase()];
  if (toCode && AIRPORT_IMAGES[toCode.toLowerCase()]) return AIRPORT_IMAGES[toCode.toLowerCase()];
  return FALLBACK_FLIGHT;
}

export { FALLBACK_COVERS, FALLBACK_HOTEL, FALLBACK_ATTRACTION, FALLBACK_FLIGHT, AIRPORT_IMAGES };
