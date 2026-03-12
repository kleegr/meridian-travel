import type { FormField } from '@/lib/types';

export const FLIGHT_FIELDS: FormField[] = [
  { key: 'from', label: 'Departure Airport', placeholder: 'JFK', location: true },
  { key: 'to', label: 'Arrival Airport', placeholder: 'FCO', location: true },
  { key: 'airline', label: 'Airline', placeholder: 'Delta' },
  { key: 'flightNo', label: 'Flight Number', placeholder: 'DL401' },
  { key: 'departure', label: 'Departure Date/Time', type: 'datetime-local' },
  { key: 'arrival', label: 'Arrival Date/Time', type: 'datetime-local' },
  { key: 'pnr', label: 'PNR / Confirmation', placeholder: 'XKJD82' },
  { key: 'source', label: 'Booking Source', placeholder: 'GDS' },
  { key: 'supplier', label: 'Supplier', placeholder: 'Delta' },
  { key: 'cost', label: 'Agent Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Client Price ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const HOTEL_FIELDS: FormField[] = [
  { key: 'name', label: 'Hotel Name', placeholder: 'Grand Hotel', half: false },
  { key: 'city', label: 'City', placeholder: 'Rome, Italy', location: true },
  { key: 'checkIn', label: 'Check-In', type: 'date' },
  { key: 'checkOut', label: 'Check-Out', type: 'date' },
  { key: 'roomType', label: 'Room Type', placeholder: 'Deluxe Suite' },
  { key: 'rooms', label: 'Number of Rooms', type: 'number', placeholder: '1' },
  { key: 'ref', label: 'Confirmation #', placeholder: 'GTR-29821' },
  { key: 'source', label: 'Booking Source', placeholder: 'Direct' },
  { key: 'supplier', label: 'Supplier', placeholder: 'Hotel Group' },
  { key: 'cost', label: 'Agent Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Client Price ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const TRANSPORT_FIELDS: FormField[] = [
  { key: 'type', label: 'Transport Type', type: 'select', options: ['Private Transfer', 'Shared Transfer', 'Taxi', 'Seaplane', 'Bush Plane', 'Train', 'Bus', 'Ferry', 'Other'] },
  { key: 'carType', label: 'Vehicle', placeholder: 'Mercedes V-Class' },
  { key: 'provider', label: 'Provider', placeholder: 'Roma Transfers' },
  { key: 'pickup', label: 'Pickup Location', placeholder: 'FCO Airport', location: true },
  { key: 'dropoff', label: 'Drop-off Location', placeholder: 'Hotel de Russie', location: true },
  { key: 'pickupDateTime', label: 'Pickup Date/Time', type: 'datetime-local' },
  { key: 'ref', label: 'Reference #', placeholder: 'RT-4422' },
  { key: 'source', label: 'Booking Source', placeholder: 'Direct' },
  { key: 'cost', label: 'Agent Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Client Price ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const ATTRACTION_FIELDS: FormField[] = [
  { key: 'name', label: 'Activity / Tour Name', placeholder: 'Colosseum VIP Tour', half: false },
  { key: 'city', label: 'City / Location', placeholder: 'Rome, Italy', location: true },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'time', label: 'Time', type: 'time' },
  { key: 'ticketType', label: 'Ticket Type', placeholder: 'VIP' },
  { key: 'source', label: 'Booking Source', placeholder: 'Viator' },
  { key: 'ref', label: 'Confirmation #', placeholder: 'VTR-88221' },
  { key: 'cost', label: 'Agent Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Client Price ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const INSURANCE_FIELDS: FormField[] = [
  { key: 'provider', label: 'Provider', placeholder: 'Allianz Global' },
  { key: 'policy', label: 'Policy Number', placeholder: 'ALZ-992881' },
  { key: 'coverage', label: 'Coverage Type', type: 'select', options: ['Comprehensive', 'Basic', 'Adventure', 'Medical Only', 'Trip Cancellation', 'Other'] },
  { key: 'start', label: 'Start Date', type: 'date' },
  { key: 'end', label: 'End Date', type: 'date' },
  { key: 'insured', label: 'Insured Traveler(s)', placeholder: 'All pax' },
  { key: 'source', label: 'Booking Source', placeholder: 'Direct' },
  { key: 'cost', label: 'Agent Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Client Price ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const CAR_RENTAL_FIELDS: FormField[] = [
  { key: 'company', label: 'Rental Company', placeholder: 'Hertz' },
  { key: 'pickup', label: 'Pickup Location', placeholder: 'FCO Airport', location: true },
  { key: 'dropoff', label: 'Drop-off Location', placeholder: 'Naples', location: true },
  { key: 'pickupDate', label: 'Pickup Date/Time', type: 'datetime-local' },
  { key: 'returnDate', label: 'Return Date/Time', type: 'datetime-local' },
  { key: 'vehicle', label: 'Vehicle Class', placeholder: 'Compact SUV' },
  { key: 'ref', label: 'Confirmation #', placeholder: 'HZ-11223' },
  { key: 'source', label: 'Booking Source', placeholder: 'Direct' },
  { key: 'cost', label: 'Agent Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Client Price ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const PASSENGER_FIELDS: FormField[] = [
  { key: 'name', label: 'Full Name', placeholder: 'John Doe', required: true, half: false },
  { key: 'dob', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'passport', label: 'Passport Number', placeholder: 'US123456' },
  { key: 'passportExpiry', label: 'Passport Expiry', type: 'date' },
  { key: 'nationality', label: 'Nationality', placeholder: 'American' },
  { key: 'phone', label: 'Phone', placeholder: '+1 555-0101' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'john@email.com' },
  { key: 'specialRequests', label: 'Special Requests', placeholder: 'Aisle seat, vegetarian meal...', half: false },
  { key: 'emergencyContact', label: 'Emergency Contact', placeholder: 'Jane Doe 555-0102', half: false },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const DAVENING_FIELDS: FormField[] = [
  { key: 'location', label: 'Shul / Minyan Name', placeholder: 'Great Synagogue', required: true, half: false },
  { key: 'city', label: 'City / Area', placeholder: 'Rome, Italy', location: true },
  { key: 'type', label: 'Type', type: 'select', options: ['Orthodox', 'Chabad', 'Sephardic', 'Reform', 'Conservative', 'Other'] },
  { key: 'shachris', label: 'Shachris Times', placeholder: '6:30 AM, 7:00 AM, 8:00 AM' },
  { key: 'mincha', label: 'Mincha Times', placeholder: '1:30 PM, Sunset -20min' },
  { key: 'mariv', label: 'Maariv Times', placeholder: 'After sunset, 9:00 PM' },
  { key: 'shabbos', label: 'Shabbos Info', placeholder: 'Friday candle lighting 7:12 PM, Shabbos ends 8:15 PM', half: false },
  { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Directions, dress code, contact info...', half: false },
];

export const MIKVAH_FIELDS: FormField[] = [
  { key: 'name', label: 'Mikvah Name', placeholder: 'City Mikvah', required: true, half: false },
  { key: 'city', label: 'City / Area', placeholder: 'Rome, Italy', location: true },
  { key: 'address', label: 'Address', placeholder: 'Via Roma 123', half: false },
  { key: 'hours', label: 'Hours', placeholder: 'Sun-Thu 6AM-10PM, Fri until 2hrs before Shabbos' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Both (separate times)'] },
  { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Contact, appointment required, fees...', half: false },
];

export const ITINERARY_FIELDS: FormField[] = [
  { key: 'title', label: 'Trip Name', placeholder: 'e.g. Amalfi Coast Family Adventure', required: true, half: false },
  { key: 'client', label: 'Client Name', placeholder: 'e.g. Johnson Family', required: true },
  { key: 'agent', label: 'Assigned Agent', type: 'select' },
  { key: 'destination', label: 'Destination', placeholder: 'e.g. Amalfi Coast, Italy', required: true, location: true, half: false },
  { key: 'startDate', label: 'Departure Date', type: 'date' },
  { key: 'endDate', label: 'Return Date', type: 'date' },
  { key: 'passengers', label: 'Passengers', type: 'number', placeholder: '2' },
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'tags', label: 'Tags (comma separated)', placeholder: 'e.g. Luxury, Family, Beach', half: false },
  { key: 'notes', label: 'Internal Notes', type: 'textarea', placeholder: 'Special requests, preferences...', half: false },
];
