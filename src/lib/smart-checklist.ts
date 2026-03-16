// Smart Checklist — auto-generates checklist items based on itinerary state
import type { Itinerary, CheckItem } from './types';

export interface SmartCheckResult {
  text: string;
  category: 'traveler' | 'flight' | 'hotel' | 'transport' | 'custom';
  linkedCount: number;
  isDone: boolean; // auto-calculated based on actual data
}

export function generateSmartChecklist(itin: Itinerary): SmartCheckResult[] {
  const items: SmartCheckResult[] = [];
  const paxCount = itin.passengers || 0;

  // Travelers
  if (paxCount > 0) {
    const addedCount = itin.passengerList.length;
    items.push({
      text: `Add Travelers (${addedCount}/${paxCount})`,
      category: 'traveler',
      linkedCount: paxCount,
      isDone: addedCount >= paxCount,
    });
    // Sub-items for each traveler slot
    for (let i = 0; i < paxCount; i++) {
      const pax = itin.passengerList[i];
      items.push({
        text: pax ? `Traveler ${i + 1}: ${pax.name}` : `Traveler ${i + 1}: Not added yet`,
        category: 'traveler',
        linkedCount: 1,
        isDone: !!pax,
      });
    }
  }

  // Flights
  items.push({
    text: `Add Flights (${itin.flights.length} added)`,
    category: 'flight',
    linkedCount: itin.flights.length,
    isDone: itin.flights.length > 0,
  });

  // Hotels
  items.push({
    text: `Add Hotels (${itin.hotels.length} added)`,
    category: 'hotel',
    linkedCount: itin.hotels.length,
    isDone: itin.hotels.length > 0,
  });

  // Transportation
  items.push({
    text: `Add Transportation (${itin.transport.length} added)`,
    category: 'transport',
    linkedCount: itin.transport.length,
    isDone: itin.transport.length > 0,
  });

  return items;
}

// Check if a smart checklist item should be auto-locked (can't manually check until condition met)
export function isSmartItemLocked(item: SmartCheckResult): boolean {
  return !item.isDone;
}
