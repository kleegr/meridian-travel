// Timing & Conflict Settings - configurable per agency
// These defaults can be overridden in Agency Settings

export interface TimingSettings {
  // Airport buffer: hours to arrive before flight departure
  airportBufferHours: number;
  // Minimum connection time between connecting flights (minutes)
  minConnectionMinutes: number;
  // Minimum time between hotel checkout and flight (minutes)
  minCheckoutToFlightMinutes: number;
  // Minimum time between flight arrival and hotel checkin (minutes)
  minArrivalToCheckinMinutes: number;
  // Minimum time between activity end and next event (minutes)
  minActivityBufferMinutes: number;
  // Default hotel checkout time (24h format)
  defaultCheckoutTime: string;
  // Default hotel checkin time (24h format)
  defaultCheckinTime: string;
  // Warn if overnight layover without hotel
  warnOvernightWithoutHotel: boolean;
  // Warn if connection flight is tight
  warnTightConnections: boolean;
}

export const DEFAULT_TIMING_SETTINGS: TimingSettings = {
  airportBufferHours: 2,
  minConnectionMinutes: 90,
  minCheckoutToFlightMinutes: 180,
  minArrivalToCheckinMinutes: 60,
  minActivityBufferMinutes: 30,
  defaultCheckoutTime: '11:00',
  defaultCheckinTime: '15:00',
  warnOvernightWithoutHotel: true,
  warnTightConnections: true,
};

// Types for conflict detection results
export interface TimingConflict {
  id: string;
  type: 'connection_too_short' | 'overlap' | 'hotel_checkout_flight' | 'arrival_no_hotel' | 'overnight_no_hotel' | 'activity_overlap' | 'transport_timing' | 'hotel_during_connection';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  items: { type: string; id: number; name: string }[];
  suggestedFix?: string;
}
