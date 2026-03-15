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
export interface CheckItem { id: number; text: string; done: boolean; notes: CheckNote[]; }
export interface DestinationInfo { id: number; name: string; description: string; showOnItinerary: boolean; }
export interface ChecklistTemplate { id: number; name: string; items: string[]; }

export interface BannerConfig { enabled: boolean; text: string; style: 'airplane' | 'minimal' | 'none'; }

// ═══════ FINANCIAL CONFIGURATION ═══════
// Supports ALL travel agency pricing models worldwide
export type PricingMode =
  | 'cost_and_sell'         // Manual: agent enters cost + sell per item (default)
  | 'markup_percentage'     // Agent enters cost, sell auto-calculated: cost × (1 + markup%)
  | 'commission_on_sell'    // Agent enters sell, profit = sell × commission%
  | 'cost_plus_fixed'       // Agent enters cost, sell = cost + fixed fee
  | 'sell_only'             // Agent only enters total sell price (no cost tracking)
  | 'package_fee';          // Single fee on entire package, not per-item

export interface CategoryMarkup {
  category: 'flight' | 'hotel' | 'transport' | 'attraction' | 'insurance' | 'carRental';
  markupType: 'percentage' | 'fixed';
  value: number;  // percentage (e.g. 15) or fixed amount (e.g. 50)
}

export interface ServiceFee {
  id: number;
  name: string;         // e.g. "Planning Fee", "Booking Fee", "VIP Surcharge"
  type: 'fixed' | 'percentage'; // fixed dollar or % of total
  value: number;
  applyTo: 'all' | 'flight' | 'hotel' | 'package'; // which bookings it applies to
  taxable: boolean;
}

export interface FinancialConfig {
  // Primary pricing mode
  pricingMode: PricingMode;

  // Default markup (when mode is markup_percentage)
  defaultMarkupPercent: number;        // e.g. 15 = 15%

  // Per-category markups (override default)
  categoryMarkups: CategoryMarkup[];
  useCategoryMarkups: boolean;         // enable per-category overrides

  // Commission mode settings
  defaultCommissionPercent: number;     // e.g. 10 = 10%

  // Fixed fee mode
  defaultFixedFee: number;             // flat $ per booking item

  // Service fees (planning fees, booking fees, etc.)
  serviceFees: ServiceFee[];

  // Currency
  currency: string;                    // 'USD', 'EUR', 'GBP', etc.
  currencySymbol: string;              // '$', '€', '£', etc.

  // Tax settings
  taxEnabled: boolean;
  taxRate: number;                     // percentage, e.g. 17 = 17%
  taxLabel: string;                    // 'VAT', 'GST', 'Sales Tax', etc.
  taxOnServiceFees: boolean;           // charge tax on service fees?

  // Display settings
  showCostToAgent: boolean;            // show cost column in tables (some agents hide it)
  showProfitToAgent: boolean;          // show profit column
  showMarkupPercent: boolean;          // show markup % in financials
  roundToNearest: number;              // 1 = exact, 5 = round to $5, 10 = round to $10

  // Payment tracking
  trackDeposits: boolean;
  trackPayments: boolean;
  defaultDepositPercent: number;       // e.g. 30 = 30% deposit required

  // Host agency split (for ICs under a host)
  hostSplitEnabled: boolean;
  hostSplitPercent: number;            // e.g. 30 = host takes 30% of commission
}

export const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  pricingMode: 'cost_and_sell',
  defaultMarkupPercent: 15,
  categoryMarkups: [],
  useCategoryMarkups: false,
  defaultCommissionPercent: 10,
  defaultFixedFee: 50,
  serviceFees: [],
  currency: 'USD',
  currencySymbol: '$',
  taxEnabled: false,
  taxRate: 0,
  taxLabel: 'Tax',
  taxOnServiceFees: false,
  showCostToAgent: true,
  showProfitToAgent: true,
  showMarkupPercent: false,
  roundToNearest: 1,
  trackDeposits: true,
  trackPayments: false,
  defaultDepositPercent: 30,
  hostSplitEnabled: false,
  hostSplitPercent: 30,
};

export interface Itinerary {
  id: number; title: string; client: string; agent: string; startDate: string; endDate: string;
  destinations: string[]; destination: string;
  clientPhones: string[]; clientEmails: string[]; clientAddresses: string[];
  status: string; passengers: number; tags: string[]; notes: string; created: string;
  isVip: boolean; destinationInfo: DestinationInfo[];
  checklistTemplateId?: number;
  passengerList: Passenger[]; flights: Flight[]; hotels: Hotel[]; transport: Transport[]; attractions: Attraction[]; insurance: Insurance[]; carRentals: CarRental[]; davening: Davening[]; mikvah: Mikvah[]; deposits: number; checklist: CheckItem[];
  // Package-level service fee override
  packageFee?: number;
}

export interface StageColor { stage: string; color: string; bg: string; }
export interface Pipeline { id: number; name: string; stages: string[]; stageColors?: StageColor[]; }
export interface DashWidget { id: string; label: string; enabled: boolean; }
export interface CardViewConfig { showProfit: boolean; showChecklist: boolean; showAgent: boolean; showDate: boolean; showCreated: boolean; showDestination: boolean; showPax: boolean; showVip: boolean; }
export interface FormField { key: string; label: string; type?: string; placeholder?: string; required?: boolean; options?: string[]; location?: boolean; half?: boolean; }
export interface AgencyProfile { name: string; email: string; phone: string; address: string; logo: string; }
export interface CustomField { id: number; name: string; module: string; type: string; }
export type Row = Record<string, unknown>;
