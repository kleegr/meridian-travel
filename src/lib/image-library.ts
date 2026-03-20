// Image Library for the Image Picker
// All images are direct Unsplash photo URLs that load reliably
// No API key needed - these are permanent direct links

export const IMAGE_LIBRARY: Record<string, { label: string; images: string[] }> = {
  destinations: {
    label: 'Destinations',
    images: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=300&fit=crop',
    ],
  },
  hotels: {
    label: 'Hotels & Resorts',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d955e4819?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
    ],
  },
  airports: {
    label: 'Airports & Aviation',
    images: [
      'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544016768-982d1554f0b9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1559268950-2d7ceb2efa3a?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1540339832862-474599807836?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&h=300&fit=crop',
    ],
  },
  beach: {
    label: 'Beach & Ocean',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    ],
  },
  mountains: {
    label: 'Mountains & Nature',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    ],
  },
  cities: {
    label: 'Cities & Skylines',
    images: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&h=300&fit=crop',
    ],
  },
  luxury: {
    label: 'Luxury & Premium',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d955e4819?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
    ],
  },
  food: {
    label: 'Food & Dining',
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop',
    ],
  },
  travel: {
    label: 'Travel & Adventure',
    images: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1502003148287-a82ef80a6abc?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&h=300&fit=crop',
    ],
  },
  attractions: {
    label: 'Attractions & Tours',
    images: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1548786811-dd6e453ccca7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&h=300&fit=crop',
    ],
  },
};

// Get all images across all categories for keyword search
export function searchImages(keyword: string): string[] {
  const lower = keyword.toLowerCase();
  // Match category by keyword
  for (const [key, { images }] of Object.entries(IMAGE_LIBRARY)) {
    if (lower.includes(key) || key.includes(lower)) return images;
  }
  // Keyword mapping
  const keywordMap: Record<string, string> = {
    'hotel': 'hotels', 'resort': 'hotels', 'room': 'hotels', 'lobby': 'hotels', 'pool': 'hotels',
    'airport': 'airports', 'plane': 'airports', 'flight': 'airports', 'terminal': 'airports', 'aviation': 'airports',
    'beach': 'beach', 'ocean': 'beach', 'sea': 'beach', 'tropical': 'beach', 'island': 'beach', 'coast': 'beach',
    'mountain': 'mountains', 'nature': 'mountains', 'forest': 'mountains', 'lake': 'mountains', 'hiking': 'mountains',
    'city': 'cities', 'skyline': 'cities', 'urban': 'cities', 'downtown': 'cities', 'night': 'cities',
    'luxury': 'luxury', 'premium': 'luxury', 'villa': 'luxury', 'mansion': 'luxury', 'suite': 'luxury',
    'food': 'food', 'restaurant': 'food', 'dining': 'food', 'cuisine': 'food', 'meal': 'food',
    'travel': 'travel', 'adventure': 'travel', 'road': 'travel', 'journey': 'travel', 'trip': 'travel',
    'attraction': 'attractions', 'tour': 'attractions', 'monument': 'attractions', 'landmark': 'attractions', 'museum': 'attractions',
    'rome': 'destinations', 'paris': 'destinations', 'london': 'destinations', 'tokyo': 'destinations', 'dubai': 'destinations',
  };
  for (const [word, cat] of Object.entries(keywordMap)) {
    if (lower.includes(word)) return IMAGE_LIBRARY[cat]?.images || [];
  }
  // Default: show travel images
  return IMAGE_LIBRARY['travel'].images;
}
