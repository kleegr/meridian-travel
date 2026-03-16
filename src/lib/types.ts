export interface Passenger { id: number; name: string; dob: string; gender: string; passport: string; passportExpiry: string; nationality: string; phone: string; email: string; specialRequests: string; emergencyContact: string; notes: string; passportImage?: string; }

export interface Flight {
  id: number; from: string; to: string; fromCity: string; toCity: string; airline: string; flightNo: string; departure: string; arrival: string; scheduledDeparture: string; scheduledArrival: string; depTerminal: string; depGate: string; arrTerminal: string; arrGate: string; duration: string; status: string; aircraft: string; pnr: string; source: string; supplier: string; seatClass: string; tripType: string; legOrder: number; connectionGroup: string; cost: number; sell: number; notes: string; uploadedPdf?: string;
}

export interface Hotel { id: number; name: string; city: string; checkIn: string; checkOut: string; checkInTime: string; checkOutTime: string; roomType: string; rooms: number; ref: string; source: string; supplier: string; cost: number; sell: number; notes: string; hotelAddress?: string; hotelPhone?: string; hotelWebsite?: string; hotelRating?: string; hotelPhotos?: string[]; }
export interface Transport { id: number; type: string; carType: string; provider: string; pickup: string; dropoff: string; pickupDateTime: string; pickupTime: string; ref: string; source: string; cost: number; sell: number; notes: string; }
export interface Attraction { id: number; name: string; city: string; date: string; time: string; ticketType: string; source: string; ref: string; cost: number; sell: number; notes: string; }
export interface Insurance { id: number; provider: string; policy: string; coverage: string; start: string; end: string; insured: string; source: string; cost: number; sell: number; notes: string; }
export interface CarRental { id: number; company: string; pickup: string; dropoff: string; pickupDate: string; returnDate: string; vehicle: string; ref: string; source: string; cost: number; sell: number; notes: string; }
export interface Davening { id: number; location: string; city: string; type: string; shachris: string; mincha: string; mariv: string; shabbos: string; notes: string; }
export interface Mikvah { id: number; name: string; city: string; address: string; hours: string; gender: string; notes: string; }

export interface CheckNote { id: number; text: string; author: string; date: string; }
export interface CheckItem { id: number; text: string; done: boolean; notes: CheckNote[]; category?: 'traveler' | 'flight' | 'hotel' | 'transport' | 'custom'; linkedCount?: number; autoLock?: boolean; }
export interface DestinationInfo { id: number; name: string; description: string; showOnItinerary: boolean; }
export interface ChecklistTemplate { id: number; name: string; items: string[]; }

export interface BannerConfig { enabled: boolean; text: string; style: 'airplane' | 'minimal' | 'none'; }

// Package / Reusable Template
export interface PackageTemplate {
  id: number;
  name: string;
  description: string;
  destinations: string[];
  duration: number; // nights
  tripType: string; // honeymoon, family, adventure, luxury, etc.
  tags: string[];
  coverImage?: string;
  // Template data (pre-filled itinerary structure)
  flights: Partial<Flight>[];
  hotels: Partial<Hotel>[];
  transport: Partial<Transport>[];
  attractions: Partial<Attraction>[];
  insurance: Partial<Insurance>[];
  carRentals: Partial<CarRental>[];
  davening: Partial<Davening>[];
  mikvah: Partial<Mikvah>[];
  checklist: string[]; // checklist item texts
  notes: string;
  // Marketing
  marketingTitle?: string;
  marketingDescription?: string;
  price?: number;
  priceLabel?: string; // 'From $X,XXX per person'
  created: string;
}

// Automation Rule
export interface AutomationRule {
  id: number;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
}

export interface AutomationTrigger {
  type: 'flight_status' | 'checklist_complete' | 'days_before_departure' | 'status_change' | 'pax_added' | 'all_travelers_added' | 'all_flights_added';
  value?: string; // e.g. 'Delayed', '30', 'Confirmed'
}

export interface AutomationAction {
  type: 'change_status' | 'add_checklist_item' | 'send_notification' | 'add_tag';
  value: string; // e.g. 'Attention Needed', 'Follow up with client'
}

// Feature Flags (Settings)
export interface FeatureFlags {
  packagesEnabled: boolean;
  marketingEnabled: boolean;
  automationsEnabled: boolean;
  mapViewEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  shareableTripPageEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  packagesEnabled: true,
  marketingEnabled: true,
  automationsEnabled: true,
  mapViewEnabled: true,
  aiSuggestionsEnabled: true,
  shareableTripPageEnabled: true,
};

export type PricingMode =
  | 'cost_and_sell'
  | 'markup_percentage'
  | 'sell_minus_commission'
  | 'cost_plus_fixed'
  | 'sell_only'
  | 'package_fee';

export interface CategoryMarkup {
  category: 'flight' | 'hotel' | 'transport' | 'attraction' | 'insurance' | 'carRental';
  markupType: 'percentage' | 'fixed';
  value: number;
}

export interface FinancialConfig {
  pricingMode: PricingMode;
  defaultMarkupPercent: number;
  categoryMarkups: CategoryMarkup[];
  useCategoryMarkups: boolean;
  defaultCommissionPercent: number;
  defaultFixedFee: number;
  showCostToAgent: boolean;
  showProfitToAgent: boolean;
  showMarkupPercent: boolean;
}

export const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  pricingMode: 'cost_and_sell',
  defaultMarkupPercent: 15,
  categoryMarkups: [],
  useCategoryMarkups: false,
  defaultCommissionPercent: 10,
  defaultFixedFee: 50,
  showCostToAgent: true,
  showProfitToAgent: true,
  showMarkupPercent: false,
};

export interface Itinerary {
  id: number; title: string; client: string; agent: string; startDate: string; endDate: string;
  destinations: string[]; destination: string;
  clientPhones: string[]; clientEmails: string[]; clientAddresses: string[];
  status: string; passengers: number; tags: string[]; notes: string; created: string;
  isVip: boolean; destinationInfo: DestinationInfo[];
  checklistTemplateId?: number;
  packageTemplateId?: number;
  tripType?: string;
  passengerList: Passenger[]; flights: Flight[]; hotels: Hotel[]; transport: Transport[]; attractions: Attraction[]; insurance: Insurance[]; carRentals: CarRental[]; davening: Davening[]; mikvah: Mikvah[]; deposits: number; checklist: CheckItem[];
  packageFee?: number;
}

export interface StageColor { stage: string; color: string; bg: string; }
export interface Pipeline { id: number; name: string; stages: string[]; stageColors?: StageColor[]; }
export interface DashWidget { id: string; label: string; enabled: boolean; }
export interface CardViewConfig { showProfit: boolean; showChecklist: boolean; showAgent: boolean; showDate: boolean; showCreated: boolean; showDestination: boolean; showPax: boolean; showVip: boolean; showStageAmount: boolean; showFlightStatus: boolean; }
export interface FormField { key: string; label: string; type?: string; placeholder?: string; required?: boolean; options?: string[]; location?: boolean; half?: boolean; }
export interface AgencyProfile { name: string; email: string; phone: string; address: string; logo: string; }
export interface CustomField { id: number; name: string; module: string; type: string; }
export type Row = Record<string, unknown>;
