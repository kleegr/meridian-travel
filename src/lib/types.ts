export interface Passenger {
  id: number;
  name: string;
  dob: string;
  gender: string;
  passport: string;
  passportExpiry: string;
  nationality: string;
  phone: string;
  email: string;
  specialRequests: string;
  emergencyContact: string;
  notes: string;
}

export interface Flight {
  id: number;
  from: string;
  to: string;
  airline: string;
  flightNo: string;
  departure: string;
  arrival: string;
  pnr: string;
  source: string;
  supplier: string;
  cost: number;
  sell: number;
  notes: string;
}

export interface Hotel {
  id: number;
  name: string;
  city: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  rooms: number;
  ref: string;
  source: string;
  supplier: string;
  cost: number;
  sell: number;
  notes: string;
}

export interface Transport {
  id: number;
  type: string;
  carType: string;
  provider: string;
  pickup: string;
  dropoff: string;
  pickupDateTime: string;
  ref: string;
  source: string;
  cost: number;
  sell: number;
  notes: string;
}

export interface Attraction {
  id: number;
  name: string;
  city: string;
  date: string;
  time: string;
  ticketType: string;
  source: string;
  ref: string;
  cost: number;
  sell: number;
  notes: string;
}

export interface Insurance {
  id: number;
  provider: string;
  policy: string;
  coverage: string;
  start: string;
  end: string;
  insured: string;
  source: string;
  cost: number;
  sell: number;
  notes: string;
}

export interface CarRental {
  id: number;
  company: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  returnDate: string;
  vehicle: string;
  ref: string;
  source: string;
  cost: number;
  sell: number;
  notes: string;
}

export interface CheckItem {
  id: number;
  text: string;
  done: boolean;
}

export interface Itinerary {
  id: number;
  title: string;
  client: string;
  agent: string;
  startDate: string;
  endDate: string;
  destination: string;
  status: string;
  passengers: number;
  tags: string[];
  notes: string;
  created: string;
  passengerList: Passenger[];
  flights: Flight[];
  hotels: Hotel[];
  transport: Transport[];
  attractions: Attraction[];
  insurance: Insurance[];
  carRentals: CarRental[];
  deposits: number;
  checklist: CheckItem[];
}

export interface Pipeline {
  id: number;
  name: string;
  stages: string[];
}

export interface DashWidget {
  id: string;
  label: string;
  enabled: boolean;
}

export interface FormField {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  location?: boolean;
  half?: boolean;
}

export interface AgencyProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface CustomField {
  id: number;
  name: string;
  module: string;
  type: string;
}

export type Row = Record<string, unknown>;
