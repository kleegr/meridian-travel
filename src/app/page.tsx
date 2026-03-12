"use client";
import { useState, useMemo, useRef } from "react";

const GHL = {
  sidebar: "#1a1f2e", sidebarHover: "#252b3b", accent: "#0d9488",
  accentLight: "#ccfbf1", card: "#ffffff", bg: "#f4f6fa", border: "#e5e7eb",
  text: "#111827", muted: "#6b7280", success: "#10b981", warning: "#f59e0b", danger: "#ef4444",
};

const AGENTS = ["Sarah Chen", "Marco Rossi", "Aisha Okonkwo", "James Liu", "Elena Vasquez"];
const STATUSES = ["Draft", "Confirmed", "In Progress", "Completed", "Cancelled"];
const STATUS_META: Record<string, { color: string; bg: string; dot: string }> = {
  Draft: { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
  Confirmed: { color: "#0d9488", bg: "#ccfbf1", dot: "#0d9488" },
  "In Progress": { color: "#f59e0b", bg: "#fef3c7", dot: "#f59e0b" },
  Completed: { color: "#3b82f6", bg: "#eff6ff", dot: "#3b82f6" },
  Cancelled: { color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
};

interface Passenger { id: number; name: string; dob: string; gender: string; passport: string; passportExpiry: string; nationality: string; phone: string; email: string; specialRequests: string; emergencyContact: string; notes: string; }
interface Flight { id: number; from: string; to: string; airline: string; flightNo: string; departure: string; arrival: string; pnr: string; source: string; supplier: string; cost: number; sell: number; notes: string; }
interface Hotel { id: number; name: string; city: string; checkIn: string; checkOut: string; roomType: string; rooms: number; ref: string; source: string; supplier: string; cost: number; sell: number; notes: string; }
interface Transport { id: number; type: string; carType: string; provider: string; pickup: string; dropoff: string; pickupDateTime: string; ref: string; source: string; cost: number; sell: number; notes: string; }
interface Attraction { id: number; name: string; city: string; date: string; time: string; ticketType: string; source: string; ref: string; cost: number; sell: number; notes: string; }
interface Insurance { id: number; provider: string; policy: string; coverage: string; start: string; end: string; insured: string; source: string; cost: number; sell: number; notes: string; }
interface CarRental { id: number; company: string; pickup: string; dropoff: string; pickupDate: string; returnDate: string; vehicle: string; ref: string; source: string; cost: number; sell: number; notes: string; }
interface Itinerary { id: number; title: string; client: string; agent: string; startDate: string; endDate: string; destination: string; status: string; passengers: number; tags: string[]; notes: string; created: string; passengerList: Passenger[]; flights: Flight[]; hotels: Hotel[]; transport: Transport[]; attractions: Attraction[]; insurance: Insurance[]; carRentals: CarRental[]; deposits: number; }

const SAMPLE: Itinerary[] = [
  { id: 1, title: "Amalfi Coast & Rome", client: "Thompson Family", agent: "Sarah Chen", startDate: "2025-06-12", endDate: "2025-06-22", destination: "Italy", status: "Confirmed", passengers: 4, tags: ["Luxury", "Family"], notes: "Preferred window seats. No seafood.", created: "2025-01-15", passengerList: [{ id: 1, name: "Robert Thompson", dob: "1975-03-12", gender: "Male", passport: "US123456", passportExpiry: "2030-03-12", nationality: "American", phone: "+1 555-0101", email: "rob@email.com", specialRequests: "Aisle seat", emergencyContact: "Mary Thompson 555-0102", notes: "" }], flights: [{ id: 1, from: "JFK", to: "FCO", airline: "Delta", flightNo: "DL401", departure: "2025-06-12 18:00", arrival: "2025-06-13 08:30", pnr: "XKJD82", source: "GDS", supplier: "Delta", cost: 3200, sell: 4800, notes: "Direct" }, { id: 2, from: "FCO", to: "JFK", airline: "Delta", flightNo: "DL402", departure: "2025-06-22 11:00", arrival: "2025-06-22 16:00", pnr: "XKJD83", source: "GDS", supplier: "Delta", cost: 3200, sell: 4800, notes: "Return" }], hotels: [{ id: 1, name: "Grand Hotel Tremezzo", city: "Lake Como", checkIn: "2025-06-13", checkOut: "2025-06-17", roomType: "Deluxe Lake View", rooms: 2, ref: "GTR-29821", source: "Direct", supplier: "Grand Hotel", cost: 4800, sell: 6200, notes: "Breakfast incl." }, { id: 2, name: "Hotel de Russie", city: "Rome", checkIn: "2025-06-17", checkOut: "2025-06-22", roomType: "Superior Room", rooms: 2, ref: "HDR-11029", source: "Amex", supplier: "Rocco Forte", cost: 5500, sell: 7200, notes: "Late checkout" }], transport: [{ id: 1, type: "Private Transfer", carType: "Mercedes V-Class", provider: "Roma Transfers", pickup: "FCO Airport", dropoff: "Hotel de Russie", pickupDateTime: "2025-06-13 09:30", ref: "RT-4422", source: "Direct", cost: 280, sell: 420, notes: "Meet & greet" }], attractions: [{ id: 1, name: "Colosseum VIP Tour", city: "Rome", date: "2025-06-19", time: "10:00", ticketType: "VIP", source: "Viator", ref: "VTR-88221", cost: 320, sell: 520, notes: "Private guide" }], insurance: [{ id: 1, provider: "Allianz Global", policy: "ALZ-992881", coverage: "Comprehensive", start: "2025-06-12", end: "2025-06-22", insured: "All pax", source: "Direct", cost: 480, sell: 650, notes: "" }], carRentals: [], deposits: 8000 },
  { id: 2, title: "Tokyo & Kyoto Explorer", client: "Dr. Amara Singh", agent: "Marco Rossi", startDate: "2025-07-05", endDate: "2025-07-18", destination: "Japan", status: "Draft", passengers: 2, tags: ["Culture", "Honeymoon"], notes: "Anniversary trip. Champagne on arrival.", created: "2025-01-22", passengerList: [], flights: [{ id: 1, from: "LHR", to: "NRT", airline: "ANA", flightNo: "NH212", departure: "2025-07-05 11:30", arrival: "2025-07-06 08:45", pnr: "ANAP91", source: "GDS", supplier: "ANA", cost: 2800, sell: 4200, notes: "Business" }], hotels: [{ id: 1, name: "Park Hyatt Tokyo", city: "Tokyo", checkIn: "2025-07-06", checkOut: "2025-07-11", roomType: "Park Deluxe", rooms: 1, ref: "PHT-3381", source: "Direct", supplier: "Park Hyatt", cost: 3600, sell: 4900, notes: "" }, { id: 2, name: "Amanjiwo", city: "Kyoto", checkIn: "2025-07-11", checkOut: "2025-07-18", roomType: "Suite", rooms: 1, ref: "AMJ-7721", source: "Aman Direct", supplier: "Aman", cost: 8400, sell: 11000, notes: "Anniversary setup" }], transport: [], attractions: [], insurance: [], carRentals: [], deposits: 5000 },
  { id: 3, title: "Maldives Overwater Escape", client: "Williams & Co.", agent: "Aisha Okonkwo", startDate: "2025-08-20", endDate: "2025-08-30", destination: "Maldives", status: "In Progress", passengers: 6, tags: ["Luxury", "Beach"], notes: "Corporate retreat.", created: "2025-02-01", passengerList: [], flights: [{ id: 1, from: "DXB", to: "MLE", airline: "Emirates", flightNo: "EK654", departure: "2025-08-20 08:00", arrival: "2025-08-20 13:30", pnr: "EK98271", source: "GDS", supplier: "Emirates", cost: 5400, sell: 8100, notes: "Business x6" }], hotels: [{ id: 1, name: "One & Only Reethi Rah", city: "North Male Atoll", checkIn: "2025-08-20", checkOut: "2025-08-30", roomType: "Overwater Villa", rooms: 3, ref: "OOR-18821", source: "Direct", supplier: "One & Only", cost: 24000, sell: 31000, notes: "All-inclusive" }], transport: [{ id: 1, type: "Seaplane", carType: "Seaplane", provider: "TMA Maldives", pickup: "Male Airport", dropoff: "Reethi Rah", pickupDateTime: "2025-08-20 15:00", ref: "TMA-9921", source: "Direct", cost: 1800, sell: 2600, notes: "" }], attractions: [], insurance: [], carRentals: [], deposits: 15000 },
  { id: 4, title: "Paris Romantic Getaway", client: "James & Sophia Miller", agent: "Elena Vasquez", startDate: "2025-09-15", endDate: "2025-09-22", destination: "France", status: "Completed", passengers: 2, tags: ["Romance", "Luxury"], notes: "Proposal trip. Ring in safe.", created: "2025-03-01", passengerList: [], flights: [{ id: 1, from: "LAX", to: "CDG", airline: "Air France", flightNo: "AF66", departure: "2025-09-15 19:00", arrival: "2025-09-16 15:00", pnr: "AF7762", source: "GDS", supplier: "Air France", cost: 2400, sell: 3600, notes: "Business" }], hotels: [{ id: 1, name: "Le Bristol Paris", city: "Paris", checkIn: "2025-09-16", checkOut: "2025-09-22", roomType: "Deluxe Suite", rooms: 1, ref: "LBP-44421", source: "Direct", supplier: "Le Bristol", cost: 9800, sell: 13000, notes: "Rose petals, champagne" }], transport: [], attractions: [{ id: 1, name: "Private Eiffel Tower Dinner", city: "Paris", date: "2025-09-18", time: "20:00", ticketType: "Private", source: "Direct", ref: "ET-8821", cost: 1200, sell: 1900, notes: "" }], insurance: [], carRentals: [], deposits: 12000 },
  { id: 5, title: "Safari Kenya & Tanzania", client: "The Okafor Family", agent: "James Liu", startDate: "2026-01-10", endDate: "2026-01-25", destination: "East Africa", status: "Confirmed", passengers: 5, tags: ["Adventure", "Wildlife"], notes: "Kids 8, 10, 12. Child-friendly lodges.", created: "2025-04-15", passengerList: [], flights: [{ id: 1, from: "ORD", to: "NBO", airline: "Kenya Airways", flightNo: "KQ103", departure: "2026-01-10 23:00", arrival: "2026-01-11 21:00", pnr: "KQ98812", source: "GDS", supplier: "Kenya Airways", cost: 6500, sell: 9500, notes: "" }], hotels: [{ id: 1, name: "Mahali Mzuri", city: "Masai Mara", checkIn: "2026-01-11", checkOut: "2026-01-18", roomType: "Tent Suite", rooms: 3, ref: "MM-22193", source: "Direct", supplier: "Mahali Mzuri", cost: 18000, sell: 24000, notes: "All-inclusive safari" }], transport: [{ id: 1, type: "Bush Plane", carType: "Cessna", provider: "Safarilink", pickup: "Nairobi Wilson", dropoff: "Mara North", pickupDateTime: "2026-01-11 10:00", ref: "SL-4421", source: "Direct", cost: 1800, sell: 2800, notes: "" }], attractions: [{ id: 1, name: "Great Migration Drive", city: "Masai Mara", date: "2026-01-13", time: "06:00", ticketType: "Full Day", source: "Included", ref: "GD-881", cost: 0, sell: 0, notes: "Included" }], insurance: [{ id: 1, provider: "World Nomads", policy: "WN-44521", coverage: "Adventure", start: "2026-01-10", end: "2026-01-25", insured: "All pax", source: "Online", cost: 850, sell: 1200, notes: "" }], carRentals: [], deposits: 20000 },
];

function calcFin(i: Itinerary) {
  const all = [...i.flights, ...i.hotels, ...i.transport, ...i.attractions, ...i.insurance, ...i.carRentals];
  const totalCost = all.reduce((a, b) => a + (b.cost || 0), 0);
  const totalSell = all.reduce((a, b) => a + (b.sell || 0), 0);
  const profit = totalSell - totalCost;
  const margin = totalSell ? ((profit / totalSell) * 100).toFixed(1) : "0.0";
  return { totalCost, totalSell, profit, margin, balance: totalSell - (i.deposits || 0), deposits: i.deposits || 0 };
}
function fmt(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n || 0); }
function fmtDate(d: string) { if (!d) return "--"; try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; } }
function nights(s: string, e: string) { try { return Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000); } catch { return 0; } }

const CITIES = ["New York, NY", "London, UK", "Paris, France", "Tokyo, Japan", "Dubai, UAE", "Rome, Italy", "Barcelona, Spain", "Amsterdam, Netherlands", "Sydney, Australia", "Singapore", "Bangkok, Thailand", "Bali, Indonesia", "Cancun, Mexico", "Miami, FL", "Los Angeles, CA", "Chicago, IL", "Las Vegas, NV", "Maldives", "Santorini, Greece", "Istanbul, Turkey", "Cairo, Egypt", "Cape Town, South Africa", "Nairobi, Kenya", "Marrakech, Morocco", "Rio de Janeiro, Brazil", "Kyoto, Japan", "Osaka, Japan", "Seoul, South Korea", "Hong Kong", "Mumbai, India", "Prague, Czech Republic", "Vienna, Austria", "Budapest, Hungary", "Zurich, Switzerland", "Milan, Italy", "Venice, Italy", "Florence, Italy", "Amalfi Coast, Italy", "Lake Como, Italy", "Nice, France", "Lisbon, Portugal", "Madrid, Spain", "Copenhagen, Denmark", "Stockholm, Sweden", "Reykjavik, Iceland", "Dublin, Ireland", "Seychelles", "Mauritius", "JFK Airport, New York", "LAX Airport, Los Angeles", "Heathrow Airport, London", "CDG Airport, Paris", "FCO Airport, Rome", "NRT Airport, Tokyo", "DXB Airport, Dubai"];

function LocationInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const handleChange = (val: string) => {
    onChange(val);
    clearTimeout(t.current);
    if (val.length > 1) {
      t.current = setTimeout(() => {
        const m = CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
        setSuggestions(m); setShow(m.length > 0);
      }, 150);
    } else setShow(false);
  };
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 22s-8-4.5-8-11.8A8 8 0 0120 10.2C20 17.5 12 22 12 22zm0-7a2 2 0 100-4 2 2 0 000 4z"/></svg>
      </span>
      <input value={value} onChange={e => handleChange(e.target.value)} onBlur={() => setTimeout(() => setShow(false), 200)} onFocus={() => value.length > 1 && suggestions.length > 0 && setShow(true)} placeholder={placeholder || "Search location..."} className={className || "w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white"} autoComplete="off" />
      {show && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 mt-1 overflow-hidden">
          {suggestions.map((s, i) => (
            <button key={i} onMouseDown={() => { onChange(s); setShow(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0">
              <svg className="w-3.5 h-3.5 flex-shrink-0" style={{color: GHL.accent}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 22s-8-4.5-8-11.8A8 8 0 0120 10.2C20 17.5 12 22 12 22zm0-7a2 2 0 100-4 2 2 0 000 4z"/></svg>
              <span className="text-gray-700">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewItineraryModal({ onClose, onCreate }: { onClose: () => void; onCreate: (i: Itinerary) => void }) {
  const [form, setForm] = useState({ title: "", client: "", agent: AGENTS[0], destination: "", startDate: "", endDate: "", passengers: "2", status: "Draft", notes: "", tags: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    if (!form.title || !form.client || !form.destination) { alert("Please fill in Trip Name, Client, and Destination."); return; }
    onCreate({ id: Date.now(), title: form.title, client: form.client, agent: form.agent, startDate: form.startDate, endDate: form.endDate, destination: form.destination, status: form.status, passengers: parseInt(form.passengers) || 1, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), notes: form.notes, created: new Date().toISOString().split("T")[0], passengerList: [], flights: [], hotels: [], transport: [], attractions: [], insurance: [], carRentals: [], deposits: 0 });
    onClose();
  };
  const ic = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white transition-all";
  const lc = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div><h2 className="text-xl font-bold text-gray-900">New Itinerary</h2><p className="text-sm text-gray-400 mt-0.5">Create a new trip file</p></div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className={lc}>Trip Name *</label><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Amalfi Coast Family Adventure" className={ic} /></div>
            <div><label className={lc}>Client Name *</label><input value={form.client} onChange={e => set("client", e.target.value)} placeholder="e.g. Johnson Family" className={ic} /></div>
            <div><label className={lc}>Assigned Agent</label><select value={form.agent} onChange={e => set("agent", e.target.value)} className={ic}>{AGENTS.map(a => <option key={a}>{a}</option>)}</select></div>
            <div className="col-span-2"><label className={lc}>Destination *</label><LocationInput value={form.destination} onChange={v => set("destination", v)} placeholder="e.g. Amalfi Coast, Italy" className={ic + " pl-9"} /></div>
            <div><label className={lc}>Departure Date</label><input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className={ic} /></div>
            <div><label className={lc}>Return Date</label><input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} className={ic} /></div>
            <div><label className={lc}>Passengers</label><input type="number" min="1" value={form.passengers} onChange={e => set("passengers", e.target.value)} className={ic} /></div>
            <div><label className={lc}>Status</label><select value={form.status} onChange={e => set("status", e.target.value)} className={ic}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="col-span-2"><label className={lc}>Tags (comma separated)</label><input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. Luxury, Family, Beach" className={ic} /></div>
            <div className="col-span-2"><label className={lc}>Internal Notes</label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Special requests, preferences..." className={ic + " resize-none"} /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors" style={{ background: GHL.accent }}>Create Itinerary</button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.Draft;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: m.color, background: m.bg }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />{status}</span>;
}

function Ic({ n, c = "w-4 h-4" }: { n: string; c?: string }) {
  const paths: Record<string,string> = { plane:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8", hotel:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10", car:"M19 17H5v-3l2.5-6h9l2.5 6v3zM7 17v2m10-2v2M5 14h14", star:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", shield:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75", dollar:"M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", map:"M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 10", settings:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", search:"M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z", plus:"M12 4v16m8-8H4", edit:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", copy:"M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", print:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z", back:"M15 19l-7-7 7-7", grid:"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", list:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01", kanban:"M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4a2 2 0 002-2V5a2 2 0 00-2-2zm10 0h-4a2 2 0 00-2 2v7a2 2 0 002 2h4a2 2 0 002-2V5a2 2 0 00-2-2z", trend:"M22 7l-9.5 9.5-5-5L1 17 M16 7h6v6", check:"M20 6L9 17l-5-5", x:"M18 6L6 18M6 6l12 12", globe:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0 0c-2.5 0-4.5-4.5-4.5-10S9.5 2 12 2s4.5 4.5 4.5 10-2 10-4.5 10zM2 12h20", bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0", chevronDown:"M19 9l-7 7-7-7", chevronRight:"M9 5l7 7-7 7" };
  const p = paths[n] || "";
  return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24">{p.split("M").filter(Boolean).map((seg, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={"M"+seg}/>)}</svg>;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent || GHL.text }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Accordion({ title, icon, count, children, defaultOpen = false }: { title: string; icon: string; count?: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3"><span style={{ color: GHL.accent }}><Ic n={icon} /></span><span className="font-semibold text-gray-800 text-sm">{title}</span>{count !== undefined && <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs">{count}</span>}</div>
        <span className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}><Ic n="chevronDown" /></span>
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-4">{children}</div>}
    </div>
  );
}

type Row = Record<string, unknown>;
function MiniTable({ cols, rows, addLabel }: { cols: { key: string; label: string; render?: (r: Row) => React.ReactNode }[]; rows: Row[]; addLabel?: string }) {
  if (!rows.length) return <div className="text-center py-8"><p className="text-gray-400 text-sm mb-2">No entries yet</p><button className="text-sm font-medium flex items-center gap-1.5 mx-auto" style={{ color: GHL.accent }}><Ic n="plus" /> {addLabel || "Add entry"}</button></div>;
  return <div><div className="overflow-x-auto rounded-lg border border-gray-100"><table className="w-full text-sm"><thead><tr className="bg-gray-50">{cols.map(c => <th key={c.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{c.label}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{rows.map((r, i) => <tr key={i} className="hover:bg-gray-50/50 transition-colors">{cols.map(c => <td key={c.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">{c.render ? c.render(r) : String(r[c.key] ?? "--")}</td>)}</tr>)}</tbody></table></div><button className="mt-3 text-sm font-medium flex items-center gap-1.5" style={{ color: GHL.accent }}><Ic n="plus" /> {addLabel || "Add entry"}</button></div>;
}

function Dashboard({ itineraries }: { itineraries: Itinerary[] }) {
  const allFin = itineraries.map(i => ({ ...i, fin: calcFin(i) }));
  const totalRev = allFin.reduce((a, b) => a + b.fin.totalSell, 0);
  const totalProfit = allFin.reduce((a, b) => a + b.fin.profit, 0);
  const agentStats = AGENTS.map(a => { const ag = allFin.filter(i => i.agent === a); return { name: a, count: ag.length, profit: ag.reduce((x, y) => x + y.fin.profit, 0) }; }).filter(a => a.count > 0).sort((a, b) => b.profit - a.profit);
  return (
    <div className="space-y-7">
      <div><h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2><p className="text-gray-400 text-sm">Agency performance overview</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(totalRev)} sub={`${itineraries.length} itineraries`} />
        <StatCard label="Total Profit" value={fmt(totalProfit)} sub={`${totalRev ? ((totalProfit/totalRev)*100).toFixed(1) : 0}% margin`} accent={GHL.success} />
        <StatCard label="Total Cost" value={fmt(allFin.reduce((a, b) => a + b.fin.totalCost, 0))} />
        <StatCard label="Confirmed" value={String(itineraries.filter(i => i.status === "Confirmed").length)} sub="active bookings" accent={GHL.accent} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5 text-sm uppercase tracking-wider">Agent Performance</h3>
          <div className="space-y-4">{agentStats.map(a => (<div key={a.name} className="flex items-center gap-3"><div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>{a.name.split(" ").map((n: string) => n[0]).join("")}</div><div className="flex-1"><div className="flex justify-between mb-1"><span className="text-sm font-medium text-gray-700">{a.name}</span><span className="text-sm font-semibold" style={{ color: GHL.success }}>{fmt(a.profit)}</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, totalProfit ? (a.profit/totalProfit)*100 : 0)}%`, background: GHL.accent }} /></div></div></div>))}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">Status Breakdown</h3>
          {STATUSES.map(s => { const cnt = itineraries.filter(i => i.status === s).length; const pct = itineraries.length ? (cnt/itineraries.length)*100 : 0; const m = STATUS_META[s]; return (<div key={s} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"><StatusBadge status={s} /><div className="flex items-center gap-3"><div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.dot }} /></div><span className="text-sm font-semibold text-gray-700 w-4 text-right">{cnt}</span></div></div>); })}
        </div>
      </div>
    </div>
  );
}

function ItineraryList({ itineraries, onSelect, onCreate }: { itineraries: Itinerary[]; onSelect: (id: number) => void; onCreate: () => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAgent, setFilterAgent] = useState("All");
  const [view, setView] = useState<"list" | "grid" | "board">("list");
  const filtered = useMemo(() => itineraries.filter(i => { const q = search.toLowerCase(); return (!q || i.title.toLowerCase().includes(q) || i.client.toLowerCase().includes(q) || i.destination.toLowerCase().includes(q)) && (filterStatus === "All" || i.status === filterStatus) && (filterAgent === "All" || i.agent === filterAgent); }), [itineraries, search, filterStatus, filterAgent]);
  const sel = "px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white text-gray-700";
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900 mb-1">Itineraries</h2><p className="text-gray-400 text-sm">{itineraries.length} total records</p></div>
        <button onClick={onCreate} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm" style={{ background: GHL.accent }}><Ic n="plus" c="w-4 h-4" /> New Itinerary</button>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Ic n="search" c="w-4 h-4" /></span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trips, clients, destinations..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none" /></div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={sel}><option value="All">All Statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className={sel}><option value="All">All Agents</option>{AGENTS.map(a => <option key={a}>{a}</option>)}</select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">{(["list","grid","board"] as const).map(v => <button key={v} onClick={() => setView(v)} className="p-2.5 transition-colors" style={view === v ? {background:GHL.accent, color:"white"} : {color:"#9ca3af"}}><Ic n={v==="board"?"kanban":v} c="w-4 h-4" /></button>)}</div>
      </div>
      {view === "list" && <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr style={{background:"#f8fafc"}} className="border-b border-gray-100">{["Trip / Client","Destination","Agent","Dates","Pax","Status","Revenue","Profit"].map(h => <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{filtered.map(i => { const fin = calcFin(i); return <tr key={i.id} onClick={() => onSelect(i.id)} className="hover:bg-teal-50/20 cursor-pointer transition-colors"><td className="px-5 py-4"><p className="font-semibold text-gray-900">{i.title}</p><p className="text-gray-400 text-xs mt-0.5">{i.client}</p></td><td className="px-5 py-4 text-gray-600">{i.destination}</td><td className="px-5 py-4 text-gray-600">{i.agent}</td><td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(i.startDate)}<br/>{fmtDate(i.endDate)}</td><td className="px-5 py-4 text-gray-600">{i.passengers}</td><td className="px-5 py-4"><StatusBadge status={i.status} /></td><td className="px-5 py-4 font-medium text-gray-800">{fmt(fin.totalSell)}</td><td className="px-5 py-4 font-semibold" style={{color:GHL.success}}>{fmt(fin.profit)}</td></tr>; })}</tbody></table></div>}
      {view === "grid" && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map(i => { const fin = calcFin(i); return <div key={i.id} onClick={() => onSelect(i.id)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-all" style={{borderTop:`3px solid ${STATUS_META[i.status]?.dot||"#9ca3af"}`}}><div className="flex items-start justify-between mb-3"><div><h3 className="font-bold text-gray-900">{i.title}</h3><p className="text-gray-400 text-xs mt-0.5">{i.client}</p></div><StatusBadge status={i.status} /></div><div className="flex items-center gap-2 text-xs text-gray-400 mb-3"><Ic n="globe" c="w-3.5 h-3.5" />{i.destination} · {i.passengers} pax</div><div className="flex gap-1.5 flex-wrap mb-4">{i.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>)}</div><div className="border-t border-gray-50 pt-3 flex justify-between"><div><p className="text-xs text-gray-400">Revenue</p><p className="font-semibold text-gray-900 text-sm">{fmt(fin.totalSell)}</p></div><div className="text-right"><p className="text-xs text-gray-400">Profit</p><p className="font-semibold text-sm" style={{color:GHL.success}}>{fmt(fin.profit)}</p></div></div></div>; })}</div>}
      {view === "board" && <div className="flex gap-4 overflow-x-auto pb-4">{STATUSES.map(status => { const cols = filtered.filter(i => i.status === status); const m = STATUS_META[status]; return <div key={status} className="flex-shrink-0 w-72"><div className="flex items-center justify-between mb-3 px-1"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{background:m.dot}} /><span className="font-semibold text-sm text-gray-700">{status}</span></div><span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{cols.length}</span></div><div className="space-y-3">{cols.map(i => { const fin = calcFin(i); return <div key={i.id} onClick={() => onSelect(i.id)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all hover:border-teal-200"><p className="font-semibold text-gray-900 text-sm mb-1">{i.title}</p><p className="text-xs text-gray-400 mb-2">{i.client}</p><div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3"><Ic n="globe" c="w-3 h-3" />{i.destination}</div><div className="flex justify-between items-center pt-2 border-t border-gray-50"><span className="text-xs text-gray-400">{i.agent.split(" ")[0]}</span><span className="text-sm font-bold" style={{color:GHL.success}}>{fmt(fin.profit)}</span></div></div>; })}{cols.length === 0 && <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center"><p className="text-xs text-gray-400">No itineraries</p></div>}</div></div>; })}</div>}
    </div>
  );
}

function ItineraryDetail({ itin, onBack }: { itin: Itinerary; onBack: () => void }) {
  const [tab, setTab] = useState("overview");
  const fin = calcFin(itin);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><Ic n="back" c="w-5 h-5" /></button>
        <div className="flex-1"><div className="flex items-center gap-3 flex-wrap"><h2 className="text-2xl font-bold text-gray-900">{itin.title}</h2><StatusBadge status={itin.status} />{itin.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{t}</span>)}</div><p className="text-gray-400 text-sm mt-0.5">{itin.client} - {itin.agent} - {itin.destination}</p></div>
        <div className="flex gap-2"><button className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Duplicate"><Ic n="copy" c="w-4 h-4" /></button><button className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Edit"><Ic n="edit" c="w-4 h-4" /></button><button onClick={() => setTab("print")} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-sm font-semibold" style={{background:GHL.sidebar}}><Ic n="print" c="w-4 h-4" /> Client View</button></div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">{[{l:"Revenue",v:fmt(fin.totalSell),c:GHL.text},{l:"Profit",v:fmt(fin.profit),c:GHL.success},{l:"Margin",v:`${fin.margin}%`,c:GHL.text},{l:"Balance Due",v:fmt(fin.balance),c:GHL.warning},{l:"Passengers",v:String(itin.passengers),c:GHL.text},{l:"Nights",v:String(nights(itin.startDate,itin.endDate)),c:GHL.text}].map(s => <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm"><p className="text-xs text-gray-400 mb-1">{s.l}</p><p className="font-bold text-sm" style={{color:s.c}}>{s.v}</p></div>)}</div>
      <div className="border-b border-gray-100 flex gap-1">{[{id:"overview",l:"Overview"},{id:"passengers",l:"Passengers",cnt:itin.passengerList.length},{id:"bookings",l:"Bookings"},{id:"financials",l:"Financials"},{id:"print",l:"Print Preview"}].map(t => <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors" style={tab===t.id?{color:GHL.accent,borderBottom:`2px solid ${GHL.accent}`,background:"#f0fdfa"}:{color:"#6b7280"}}>{t.l}{t.cnt!==undefined?<span className="ml-1.5 bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5 text-xs">{t.cnt}</span>:null}</button>)}</div>
      {tab === "overview" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-5"><div className="lg:col-span-2 space-y-4"><div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm"><h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Trip Details</h3><div className="grid grid-cols-2 gap-4 text-sm">{[["Client",itin.client],["Agent",itin.agent],["Destination",itin.destination],["Passengers",String(itin.passengers)],["Departure",fmtDate(itin.startDate)],["Return",fmtDate(itin.endDate)],["Status",itin.status],["Created",fmtDate(itin.created)]].map(([k,v]) => <div key={k}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="font-semibold text-gray-800">{v}</p></div>)}</div></div>{itin.notes && <div className="rounded-xl border p-5" style={{background:"#fefce8",borderColor:"#fde68a"}}><p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color:"#d97706"}}>Internal Notes</p><p className="text-sm" style={{color:"#92400e"}}>{itin.notes}</p></div>}</div><div className="space-y-4"><div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Components</h3>{[{l:"Flights",cnt:itin.flights.length,ic:"plane"},{l:"Hotels",cnt:itin.hotels.length,ic:"hotel"},{l:"Transfers",cnt:itin.transport.length,ic:"car"},{l:"Activities",cnt:itin.attractions.length,ic:"star"},{l:"Insurance",cnt:itin.insurance.length,ic:"shield"},{l:"Car Rentals",cnt:itin.carRentals.length,ic:"car"}].map(({l,cnt,ic}) => <div key={l} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><div className="flex items-center gap-2 text-sm text-gray-600"><span style={{color:GHL.accent}}><Ic n={ic} c="w-4 h-4" /></span>{l}</div><span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={cnt?{background:"#ccfbf1",color:GHL.accent}:{background:"#f3f4f6",color:"#9ca3af"}}>{cnt}</span></div>)}</div></div></div>}
      {tab === "passengers" && <div className="space-y-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-gray-800">Passenger Information</h3><button className="inline-flex items-center gap-2 text-sm font-medium" style={{color:GHL.accent}}><Ic n="plus" c="w-4 h-4" /> Add Passenger</button></div>{itin.passengerList.length ? itin.passengerList.map(p => <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{background:GHL.accent}}>{p.name.split(" ").map((n:string)=>n[0]).join("")}</div><div><p className="font-bold text-gray-900">{p.name}</p><p className="text-xs text-gray-400">{p.nationality} - {p.gender}</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">{[["DOB",p.dob],["Passport",p.passport],["Expires",p.passportExpiry],["Phone",p.phone],["Email",p.email],["Requests",p.specialRequests],["Emergency",p.emergencyContact]].map(([k,v]) => <div key={k}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="text-gray-700 font-medium truncate">{v||"--"}</p></div>)}</div></div>) : <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm"><Ic n="users" c="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">No passengers added yet</p><button className="mt-3 inline-flex items-center gap-2 text-sm font-medium" style={{color:GHL.accent}}><Ic n="plus" c="w-4 h-4" /> Add first passenger</button></div>}</div>}
      {tab === "bookings" && <div className="space-y-4"><Accordion title="Flights" icon="plane" count={itin.flights.length} defaultOpen><MiniTable cols={[{key:"from",label:"From"},{key:"to",label:"To"},{key:"airline",label:"Airline"},{key:"flightNo",label:"Flight#"},{key:"departure",label:"Departure"},{key:"pnr",label:"PNR"},{key:"cost",label:"Cost",render:(r:Row)=>fmt(Number(r.cost))},{key:"sell",label:"Sell",render:(r:Row)=>fmt(Number(r.sell))},{key:"profit",label:"Profit",render:(r:Row)=><span style={{color:GHL.success}} className="font-semibold">{fmt(Number(r.sell)-Number(r.cost))}</span>}]} rows={itin.flights as unknown as Row[]} addLabel="Add flight" /></Accordion><Accordion title="Hotels" icon="hotel" count={itin.hotels.length} defaultOpen><MiniTable cols={[{key:"name",label:"Hotel"},{key:"city",label:"City"},{key:"checkIn",label:"Check In"},{key:"checkOut",label:"Check Out"},{key:"roomType",label:"Room"},{key:"rooms",label:"#"},{key:"cost",label:"Cost",render:(r:Row)=>fmt(Number(r.cost))},{key:"sell",label:"Sell",render:(r:Row)=>fmt(Number(r.sell))},{key:"profit",label:"Profit",render:(r:Row)=><span style={{color:GHL.success}} className="font-semibold">{fmt(Number(r.sell)-Number(r.cost))}</span>}]} rows={itin.hotels as unknown as Row[]} addLabel="Add hotel" /></Accordion><Accordion title="Transfers" icon="car" count={itin.transport.length}><MiniTable cols={[{key:"type",label:"Type"},{key:"provider",label:"Provider"},{key:"pickup",label:"Pickup"},{key:"dropoff",label:"Drop-off"},{key:"cost",label:"Cost",render:(r:Row)=>fmt(Number(r.cost))},{key:"sell",label:"Sell",render:(r:Row)=>fmt(Number(r.sell))}]} rows={itin.transport as unknown as Row[]} addLabel="Add transfer" /></Accordion><Accordion title="Attractions & Tours" icon="star" count={itin.attractions.length}><MiniTable cols={[{key:"name",label:"Activity"},{key:"city",label:"City"},{key:"date",label:"Date"},{key:"ticketType",label:"Type"},{key:"cost",label:"Cost",render:(r:Row)=>fmt(Number(r.cost))},{key:"sell",label:"Sell",render:(r:Row)=>fmt(Number(r.sell))}]} rows={itin.attractions as unknown as Row[]} addLabel="Add activity" /></Accordion><Accordion title="Travel Insurance" icon="shield" count={itin.insurance.length}><MiniTable cols={[{key:"provider",label:"Provider"},{key:"policy",label:"Policy#"},{key:"coverage",label:"Coverage"},{key:"cost",label:"Cost",render:(r:Row)=>fmt(Number(r.cost))},{key:"sell",label:"Sell",render:(r:Row)=>fmt(Number(r.sell))}]} rows={itin.insurance as unknown as Row[]} addLabel="Add insurance" /></Accordion><Accordion title="Car Rentals" icon="car" count={itin.carRentals.length}><MiniTable cols={[{key:"company",label:"Company"},{key:"vehicle",label:"Vehicle"},{key:"pickup",label:"Pickup"},{key:"cost",label:"Cost",render:(r:Row)=>fmt(Number(r.cost))}]} rows={itin.carRentals as unknown as Row[]} addLabel="Add car rental" /></Accordion></div>}
      {tab === "financials" && <div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="rounded-xl p-5 text-white shadow-sm" style={{background:GHL.sidebar}}><p className="text-xs uppercase tracking-wider mb-2" style={{color:"#94a3b8"}}>Total Revenue</p><p className="text-2xl font-bold">{fmt(fin.totalSell)}</p></div><div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Cost</p><p className="text-2xl font-bold text-gray-900">{fmt(fin.totalCost)}</p></div><div className="rounded-xl border p-5 shadow-sm" style={{background:"#f0fdf4",borderColor:"#bbf7d0"}}><p className="text-xs uppercase tracking-wider mb-2" style={{color:GHL.success}}>Total Profit</p><p className="text-2xl font-bold" style={{color:GHL.success}}>{fmt(fin.profit)}</p><p className="text-xs mt-1" style={{color:GHL.success}}>{fin.margin}% margin</p></div><div className="rounded-xl border p-5 shadow-sm" style={{background:"#fffbeb",borderColor:"#fde68a"}}><p className="text-xs uppercase tracking-wider mb-2" style={{color:GHL.warning}}>Balance Due</p><p className="text-2xl font-bold" style={{color:GHL.warning}}>{fmt(fin.balance)}</p><p className="text-xs mt-1 text-gray-400">Deposits: {fmt(fin.deposits)}</p></div></div><div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr style={{background:"#f8fafc"}} className="border-b border-gray-100">{["Category","Items","Cost","Selling Price","Profit","Margin"].map(h => <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{[{l:"Flights",items:itin.flights},{l:"Hotels",items:itin.hotels},{l:"Transport",items:itin.transport},{l:"Attractions",items:itin.attractions},{l:"Insurance",items:itin.insurance},{l:"Car Rentals",items:itin.carRentals}].filter(s=>s.items.length>0).map(s => { const sc=s.items.reduce((a,b)=>a+(b.cost||0),0); const ss=s.items.reduce((a,b)=>a+(b.sell||0),0); const sp=ss-sc; return <tr key={s.l} className="hover:bg-gray-50/50"><td className="px-5 py-4 font-medium text-gray-800">{s.l}</td><td className="px-5 py-4 text-gray-500">{s.items.length}</td><td className="px-5 py-4 text-gray-700">{fmt(sc)}</td><td className="px-5 py-4 font-medium text-gray-900">{fmt(ss)}</td><td className="px-5 py-4 font-semibold" style={{color:GHL.success}}>{fmt(sp)}</td><td className="px-5 py-4 text-gray-500">{ss?((sp/ss)*100).toFixed(1):0}%</td></tr>; })}<tr className="font-bold border-t-2 border-gray-200" style={{background:"#f8fafc"}}><td className="px-5 py-4 text-gray-900">TOTAL</td><td className="px-5 py-4"></td><td className="px-5 py-4">{fmt(fin.totalCost)}</td><td className="px-5 py-4">{fmt(fin.totalSell)}</td><td className="px-5 py-4" style={{color:GHL.success}}>{fmt(fin.profit)}</td><td className="px-5 py-4 text-gray-700">{fin.margin}%</td></tr></tbody></table></div></div>}
      {tab === "print" && <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"><div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client-Facing Itinerary</p><button className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2 text-sm font-medium" style={{background:GHL.sidebar}}><Ic n="print" c="w-4 h-4" /> Export PDF</button></div><div className="p-8 max-w-3xl mx-auto" style={{fontFamily:"Georgia, serif"}}><div className="flex items-center justify-between mb-8 pb-6" style={{borderBottom:`2px solid ${GHL.sidebar}`}}><div><div className="text-2xl font-bold tracking-tight">MERIDIAN TRAVEL</div><div className="text-xs text-gray-500 tracking-widest mt-1">LUXURY TRAVEL SPECIALISTS</div></div><div className="text-right text-sm text-gray-500"><p>Prepared for: <strong className="text-gray-900">{itin.client}</strong></p><p>{fmtDate(new Date().toISOString())}</p></div></div><div className="text-center mb-8"><h1 className="text-3xl font-bold text-gray-900 mb-2">{itin.title}</h1><p className="text-gray-500">{fmtDate(itin.startDate)} to {fmtDate(itin.endDate)} - {itin.destination} - {itin.passengers} Passengers</p></div>{itin.flights.length>0&&<div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Flights</h2>{itin.flights.map((f,i)=><div key={i} className="flex justify-between py-2 text-sm border-b border-gray-100 last:border-0"><div><strong>{f.airline} {f.flightNo}</strong> - {f.from} to {f.to}</div><div className="text-gray-500">{f.departure} - PNR: {f.pnr}</div></div>)}</div>}{itin.hotels.length>0&&<div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Accommodation</h2>{itin.hotels.map((h,i)=><div key={i} className="py-2 text-sm border-b border-gray-100 last:border-0"><div className="flex justify-between"><strong>{h.name}</strong><span className="text-gray-500">Ref: {h.ref}</span></div><p className="text-gray-500">{h.city} - {h.roomType} x{h.rooms} - {fmtDate(h.checkIn)} to {fmtDate(h.checkOut)}</p></div>)}</div>}{itin.transport.length>0&&<div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Transfers</h2>{itin.transport.map((t,i)=><div key={i} className="py-2 text-sm border-b border-gray-100 last:border-0"><div className="flex justify-between"><strong>{t.type}</strong><span className="text-gray-500">{t.pickupDateTime}</span></div><p className="text-gray-500">{t.pickup} to {t.dropoff} - {t.provider}</p></div>)}</div>}{itin.attractions.length>0&&<div className="mb-6"><h2 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase text-sm tracking-widest">Activities & Tours</h2>{itin.attractions.map((a,i)=><div key={i} className="py-2 text-sm border-b border-gray-100 last:border-0"><div className="flex justify-between"><strong>{a.name}</strong><span className="text-gray-500">{a.date} {a.time}</span></div><p className="text-gray-500">{a.city} - {a.ticketType}</p></div>)}</div>}<div className="mt-8 pt-6 text-center text-xs text-gray-400" style={{borderTop:`2px solid ${GHL.sidebar}`}}><p>Prepared by {itin.agent} - Meridian Travel - info@meridiantravel.com</p></div></div></div>}
    </div>
  );
}

function Financials({ itineraries }: { itineraries: Itinerary[] }) {
  const allFin = itineraries.map(i => ({ ...i, fin: calcFin(i) }));
  const totalRev = allFin.reduce((a, b) => a + b.fin.totalSell, 0);
  const totalCost = allFin.reduce((a, b) => a + b.fin.totalCost, 0);
  const totalProfit = allFin.reduce((a, b) => a + b.fin.profit, 0);
  return (
    <div className="space-y-7">
      <div><h2 className="text-2xl font-bold text-gray-900 mb-1">Financials</h2><p className="text-gray-400 text-sm">Global revenue & profit overview</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Total Revenue" value={fmt(totalRev)} /><StatCard label="Total Cost" value={fmt(totalCost)} /><StatCard label="Total Profit" value={fmt(totalProfit)} accent={GHL.success} sub={`${totalRev?((totalProfit/totalRev)*100).toFixed(1):0}% margin`} /><StatCard label="Avg Per Trip" value={fmt(totalProfit/(itineraries.length||1))} accent={GHL.accent} /></div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"><div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Itinerary P&L</h3></div><table className="w-full text-sm"><thead><tr style={{background:"#f8fafc"}} className="border-b border-gray-100">{["Itinerary","Client","Agent","Status","Revenue","Cost","Profit","Margin"].map(h => <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{allFin.map(i => <tr key={i.id} className="hover:bg-gray-50/50"><td className="px-5 py-4 font-medium text-gray-900">{i.title}</td><td className="px-5 py-4 text-gray-600">{i.client}</td><td className="px-5 py-4 text-gray-600">{i.agent}</td><td className="px-5 py-4"><StatusBadge status={i.status} /></td><td className="px-5 py-4 font-medium text-gray-800">{fmt(i.fin.totalSell)}</td><td className="px-5 py-4 text-gray-600">{fmt(i.fin.totalCost)}</td><td className="px-5 py-4 font-semibold" style={{color:GHL.success}}>{fmt(i.fin.profit)}</td><td className="px-5 py-4 text-gray-500">{i.fin.margin}%</td></tr>)}</tbody></table></div>
    </div>
  );
}

export default function App() {
  const [itineraries, setItineraries] = useState<Itinerary[]>(SAMPLE);
  const [page, setPage] = useState("dashboard");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const navItems = [{id:"dashboard",label:"Dashboard",icon:"trend"},{id:"itineraries",label:"Itineraries",icon:"map"},{id:"financials",label:"Financials",icon:"dollar"},{id:"settings",label:"Settings",icon:"settings"}];
  const handleSelect = (id: number) => { setSelectedId(id); setPage("detail"); };
  const handleBack = () => { setPage("itineraries"); setSelectedId(null); };
  const selectedItin = itineraries.find(i => i.id === selectedId);
  const handleCreate = (itin: Itinerary) => { setItineraries(prev => [itin, ...prev]); handleSelect(itin.id); };
  return (
    <div className="min-h-screen flex" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 z-20 shadow-lg" style={{ background: GHL.sidebar }}>
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: GHL.accent }}><Ic n="globe" c="w-5 h-5 text-white" /></div><div><p className="font-bold text-white text-sm leading-none">Meridian</p><p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Travel Platform</p></div></div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => { const active = page === item.id || (page === "detail" && item.id === "itineraries"); return <button key={item.id} onClick={() => { setPage(item.id); setSelectedId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" style={active ? { background: GHL.accent, color: "#fff" } : { color: "#94a3b8" }}><Ic n={item.icon} c="w-4 h-4" />{item.label}</button>; })}
        </nav>
        <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>SC</div><div><p className="text-sm font-semibold text-white">Sarah Chen</p><p className="text-xs" style={{ color: "#64748b" }}>Senior Agent</p></div></div>
        </div>
      </aside>
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h1 className="font-bold text-gray-900 hidden md:block">{page==="dashboard"?"Dashboard":page==="itineraries"?"Itineraries":page==="financials"?"Financials":page==="settings"?"Settings":page==="detail"&&selectedItin?selectedItin.title:""}</h1>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Ic n="search" c="w-4 h-4" /></span><input placeholder="Quick search..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none" /></div>
            <button onClick={() => setShowNewModal(true)} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: GHL.accent }}><Ic n="plus" c="w-4 h-4" /> New Itinerary</button>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8 overflow-auto pb-20 md:pb-8">
          {page === "dashboard" && <Dashboard itineraries={itineraries} />}
          {page === "itineraries" && <ItineraryList itineraries={itineraries} onSelect={handleSelect} onCreate={() => setShowNewModal(true)} />}
          {page === "financials" && <Financials itineraries={itineraries} />}
          {page === "detail" && selectedItin && <ItineraryDetail itin={selectedItin} onBack={handleBack} />}
          {page === "settings" && <div className="space-y-5"><div><h2 className="text-2xl font-bold text-gray-900 mb-1">Settings</h2><p className="text-gray-400 text-sm">Configure your workspace</p></div>{[["Agency Profile","Company name, logo, contact details"],["Agents & Users","Manage agent accounts and roles"],["Custom Fields","Add fields to any module"],["Booking Sources","GDS, OTA, direct channels"],["Supplier Directory","Preferred suppliers"],["Email Templates","Client communication"],["Status Labels","Customize workflow stages"]].map(([t,d]) => <div key={t} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"><div><p className="font-semibold text-gray-900">{t}</p><p className="text-sm text-gray-400 mt-0.5">{d}</p></div><Ic n="chevronRight" c="w-5 h-5 text-gray-300" /></div>)}</div>}
        </div>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20">{navItems.map(item => { const active = page === item.id || (page === "detail" && item.id === "itineraries"); return <button key={item.id} onClick={() => { setPage(item.id); setSelectedId(null); }} className="flex-1 flex flex-col items-center py-3 text-xs font-medium" style={{ color: active ? GHL.accent : "#9ca3af" }}><Ic n={item.icon} c="w-5 h-5 mb-1" />{item.label}</button>; })}</nav>
      </main>
      {showNewModal && <NewItineraryModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
