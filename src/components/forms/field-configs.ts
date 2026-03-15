import type { FormField } from '@/lib/types';

export const FLIGHT_FIELDS: FormField[] = [
  { key: 'tripType', label: 'Trip Type', type: 'select', options: ['Round Trip', 'One Way', 'Multi-City', 'Connection'] },
  { key: 'flightNo', label: 'Flight Number', placeholder: 'e.g. UA1047', required: true },
  { key: 'airline', label: 'Airline', placeholder: 'Auto-filled from flight number' },
  { key: 'from', label: 'Dep Airport Code', placeholder: 'JFK' },
  { key: 'fromCity', label: 'Departure City', placeholder: 'New York', location: true },
  { key: 'to', label: 'Arr Airport Code', placeholder: 'LHR' },
  { key: 'toCity', label: 'Arrival City', placeholder: 'London', location: true },
  { key: 'departure', label: 'Departure Date/Time', type: 'datetime-local' },
  { key: 'arrival', label: 'Arrival Date/Time', type: 'datetime-local' },
  { key: 'scheduledDeparture', label: 'Departure Time', placeholder: '6:00 PM' },
  { key: 'scheduledArrival', label: 'Arrival Time', placeholder: '10:30 PM' },
  { key: 'depTerminal', label: 'Dep Terminal', placeholder: '3' },
  { key: 'depGate', label: 'Dep Gate', placeholder: 'C4' },
  { key: 'arrTerminal', label: 'Arr Terminal', placeholder: 'B' },
  { key: 'arrGate', label: 'Arr Gate', placeholder: 'B55' },
  { key: 'duration', label: 'Duration', placeholder: '3h 51m' },
  { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'On Time', 'Delayed', 'Boarding', 'In Air', 'Landed', 'Cancelled'] },
  { key: 'aircraft', label: 'Aircraft', placeholder: 'Boeing 737-800' },
  { key: 'seatClass', label: 'Class', type: 'select', options: ['Economy', 'Premium Economy', 'Business', 'First'] },
  { key: 'pnr', label: 'PNR', placeholder: 'XKJD82' },
  { key: 'source', label: 'Source', placeholder: 'GDS' },
  { key: 'supplier', label: 'Supplier', placeholder: 'United Airlines' },
  { key: 'cost', label: 'Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Sell ($)', type: 'number', placeholder: '0' },
  { key: 'uploadedPdf', label: 'Attached PDF', placeholder: '' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const HOTEL_FIELDS: FormField[] = [
  { key: 'name', label: 'Hotel Name', placeholder: 'Grand Hotel', half: false },
  { key: 'city', label: 'City', placeholder: 'Rome, Italy', location: true },
  { key: 'hotelAddress', label: 'Address', placeholder: 'Auto-filled from lookup', half: false },
  { key: 'hotelPhone', label: 'Phone', placeholder: 'Auto-filled' },
  { key: 'hotelWebsite', label: 'Website', placeholder: 'Auto-filled' },
  { key: 'checkIn', label: 'Check-In Date', type: 'date' },
  { key: 'checkInTime', label: 'Check-In Time', placeholder: '3:00 PM' },
  { key: 'checkOut', label: 'Check-Out Date', type: 'date' },
  { key: 'checkOutTime', label: 'Check-Out Time', placeholder: '11:00 AM' },
  { key: 'roomType', label: 'Room Type', placeholder: 'Deluxe Suite' },
  { key: 'rooms', label: 'Rooms', type: 'number', placeholder: '1' },
  { key: 'ref', label: 'Confirmation #', placeholder: 'GTR-29821' },
  { key: 'source', label: 'Source', placeholder: 'Direct' },
  { key: 'supplier', label: 'Supplier', placeholder: 'Hotel Group' },
  { key: 'hotelRating', label: 'Rating', placeholder: '4.5' },
  { key: 'cost', label: 'Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Sell ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const TRANSPORT_FIELDS: FormField[] = [
  { key: 'type', label: 'Type', type: 'select', options: ['Private Transfer', 'Shared Transfer', 'Taxi', 'Seaplane', 'Bush Plane', 'Train', 'Bus', 'Ferry', 'Other'] },
  { key: 'carType', label: 'Vehicle', placeholder: 'Mercedes V-Class' },
  { key: 'provider', label: 'Provider', placeholder: 'Roma Transfers' },
  { key: 'pickup', label: 'Pickup', placeholder: 'FCO Airport', location: true },
  { key: 'dropoff', label: 'Drop-off', placeholder: 'Hotel de Russie', location: true },
  { key: 'pickupDateTime', label: 'Pickup Date', type: 'date' },
  { key: 'pickupTime', label: 'Pickup Time', placeholder: '9:30 AM' },
  { key: 'ref', label: 'Reference #', placeholder: 'RT-4422' },
  { key: 'source', label: 'Source', placeholder: 'Direct' },
  { key: 'cost', label: 'Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Sell ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const ATTRACTION_FIELDS: FormField[] = [
  { key: 'name', label: 'Activity', placeholder: 'Colosseum VIP Tour', half: false },
  { key: 'city', label: 'City', placeholder: 'Rome', location: true },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'time', label: 'Time', placeholder: '10:00 AM' },
  { key: 'ticketType', label: 'Ticket Type', placeholder: 'VIP' },
  { key: 'source', label: 'Source', placeholder: 'Viator' },
  { key: 'ref', label: 'Confirmation #', placeholder: 'VTR-88221' },
  { key: 'cost', label: 'Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Sell ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const INSURANCE_FIELDS: FormField[] = [
  { key: 'provider', label: 'Provider', placeholder: 'Allianz' },
  { key: 'policy', label: 'Policy #', placeholder: 'ALZ-992881' },
  { key: 'coverage', label: 'Coverage', type: 'select', options: ['Comprehensive', 'Basic', 'Adventure', 'Medical Only', 'Trip Cancellation'] },
  { key: 'start', label: 'Start', type: 'date' },
  { key: 'end', label: 'End', type: 'date' },
  { key: 'insured', label: 'Insured', placeholder: 'All pax' },
  { key: 'source', label: 'Source', placeholder: 'Direct' },
  { key: 'cost', label: 'Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Sell ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const CAR_RENTAL_FIELDS: FormField[] = [
  { key: 'company', label: 'Company', placeholder: 'Hertz' },
  { key: 'pickup', label: 'Pickup', placeholder: 'FCO Airport', location: true },
  { key: 'dropoff', label: 'Drop-off', placeholder: 'Naples', location: true },
  { key: 'pickupDate', label: 'Pickup Date', type: 'datetime-local' },
  { key: 'returnDate', label: 'Return Date', type: 'datetime-local' },
  { key: 'vehicle', label: 'Vehicle', placeholder: 'Compact SUV' },
  { key: 'ref', label: 'Confirmation #', placeholder: 'HZ-11223' },
  { key: 'source', label: 'Source', placeholder: 'Direct' },
  { key: 'cost', label: 'Cost ($)', type: 'number', placeholder: '0' },
  { key: 'sell', label: 'Sell ($)', type: 'number', placeholder: '0' },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const PASSENGER_FIELDS: FormField[] = [
  { key: 'name', label: 'Full Name', placeholder: 'John Doe', required: true, half: false },
  { key: 'dob', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'passport', label: 'Passport #', placeholder: 'US123456' },
  { key: 'passportExpiry', label: 'Passport Expiry', type: 'date' },
  { key: 'nationality', label: 'Nationality', placeholder: 'American' },
  { key: 'phone', label: 'Phone', placeholder: '+1 555-0101' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'john@email.com' },
  { key: 'specialRequests', label: 'Requests', placeholder: 'Aisle seat...', half: false },
  { key: 'emergencyContact', label: 'Emergency Contact', placeholder: 'Jane 555-0102', half: false },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const DAVENING_FIELDS: FormField[] = [
  { key: 'location', label: 'Shul / Minyan', placeholder: 'Great Synagogue', required: true, half: false },
  { key: 'city', label: 'City', placeholder: 'Rome', location: true },
  { key: 'type', label: 'Type', type: 'select', options: ['Orthodox', 'Chabad', 'Sephardic', 'Reform', 'Conservative', 'Other'] },
  { key: 'shachris', label: 'Shachris', placeholder: '7:00 AM' },
  { key: 'mincha', label: 'Mincha', placeholder: '1:30 PM' },
  { key: 'mariv', label: 'Maariv', placeholder: '9:00 PM' },
  { key: 'shabbos', label: 'Shabbos Info', placeholder: 'Candle lighting 7:12 PM', half: false },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const MIKVAH_FIELDS: FormField[] = [
  { key: 'name', label: 'Mikvah Name', placeholder: 'City Mikvah', required: true, half: false },
  { key: 'city', label: 'City', placeholder: 'Rome', location: true },
  { key: 'address', label: 'Address', placeholder: 'Via Roma 123', half: false },
  { key: 'hours', label: 'Hours', placeholder: 'Sun-Thu 6AM-10PM' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Both (separate times)'] },
  { key: 'notes', label: 'Notes', type: 'textarea', half: false },
];

export const ITINERARY_FIELDS: FormField[] = [
  { key: 'title', label: 'Trip Name', placeholder: 'e.g. Amalfi Coast Adventure', required: true, half: false },
  { key: 'client', label: 'Client', placeholder: 'Johnson Family', required: true },
  { key: 'agent', label: 'Agent', type: 'select' },
  { key: 'destination', label: 'Destination(s)', placeholder: 'Italy', required: true, location: true, half: false },
  { key: 'startDate', label: 'Departure', type: 'date' },
  { key: 'endDate', label: 'Return', type: 'date' },
  { key: 'passengers', label: 'Passengers', type: 'number', placeholder: '2' },
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'isVip', label: 'VIP Client', type: 'checkbox' },
  { key: 'tags', label: 'Tags', placeholder: 'Luxury, Family', half: false },
  { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Special requests...', half: false },
];
