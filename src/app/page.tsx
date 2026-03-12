'use client';

import { useState, useCallback } from 'react';
import { Sidebar, Header, MobileNav } from '@/components/layout';
import { Dashboard, ItineraryList, ItineraryDetail, Financials, Travelers, Pipelines, Settings } from '@/components/pages';
import NewItineraryModal from '@/components/modals/NewItineraryModal';
import { GHL, STATUSES } from '@/lib/constants';
import { SAMPLE_ITINERARIES } from '@/lib/sample-data';
import type { Itinerary, Pipeline, DashWidget, AgencyProfile, CustomField } from '@/lib/types';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'trend' },
  { id: 'itineraries', label: 'Itineraries', icon: 'map' },
  { id: 'travelers', label: 'Travelers', icon: 'users' },
  { id: 'financials', label: 'Financials', icon: 'dollar' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const DEFAULT_WIDGETS: DashWidget[] = [
  { id: 'stats', label: 'Stats Cards', enabled: true },
  { id: 'agents', label: 'Agent Performance', enabled: true },
  { id: 'status', label: 'Status Breakdown', enabled: true },
  { id: 'upcoming', label: 'Upcoming Trips', enabled: true },
  { id: 'checklist', label: 'Checklist Progress', enabled: true },
];

const DEFAULT_PIPELINES: Pipeline[] = [
  { id: 1, name: 'Sales Pipeline', stages: ['Lead', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
  { id: 2, name: 'Trip Planning', stages: ['Inquiry', 'Quoting', 'Booked', 'Ticketed', 'Completed'] },
];

export default function App() {
  const [itineraries, setItineraries] = useState<Itinerary[]>(SAMPLE_ITINERARIES);
  const [page, setPage] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>(DEFAULT_PIPELINES);
  const [dashWidgets, setDashWidgets] = useState<DashWidget[]>(DEFAULT_WIDGETS);
  const [globalSearch, setGlobalSearch] = useState('');

  const [bookingSources, setBookingSources] = useState(['GDS', 'Direct', 'Amex', 'Viator', 'Online', 'Aman Direct']);
  const [suppliers, setSuppliers] = useState(['Delta', 'ANA', 'Emirates', 'Air France', 'Kenya Airways', 'Grand Hotel', 'Park Hyatt', 'One & Only', 'Le Bristol', 'Mahali Mzuri']);
  const [statusLabels, setStatusLabels] = useState([...STATUSES]);
  const [agencyProfile, setAgencyProfile] = useState<AgencyProfile>({ name: 'Kleegr Travel', email: 'info@kleegr.com', phone: '+1 (800) 555-TRAVEL', address: 'New York, NY' });
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: 1, name: 'Loyalty Number', module: 'Itinerary', type: 'Text' },
    { id: 2, name: 'VIP Level', module: 'Itinerary', type: 'Dropdown' },
  ]);

  const handleSelect = (id: number) => { setSelectedId(id); setPage('detail'); };
  const handleBack = () => { setPage('itineraries'); setSelectedId(null); };
  const handleNavigate = (id: string) => { setPage(id); setSelectedId(null); };
  const selectedItin = itineraries.find((i) => i.id === selectedId);

  const handleCreate = useCallback((itin: Itinerary) => { setItineraries((prev) => [itin, ...prev]); setSelectedId(itin.id); setPage('detail'); }, []);
  const handleUpdate = useCallback((updated: Itinerary) => { setItineraries((prev) => { const exists = prev.find((i) => i.id === updated.id); if (exists) return prev.map((i) => (i.id === updated.id ? updated : i)); return [updated, ...prev]; }); }, []);
  const handleUpdateStatus = useCallback((id: number, newStatus: string) => { setItineraries((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))); }, []);
  const toggleWidget = (id: string) => { setDashWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))); };

  const pageTitle = page === 'dashboard' ? 'Dashboard' : page === 'itineraries' ? 'Itineraries' : page === 'travelers' ? 'Travelers' : page === 'pipelines' ? 'Manage Stages' : page === 'financials' ? 'Financials' : page === 'settings' ? 'Settings' : page === 'detail' && selectedItin ? selectedItin.title : '';

  return (
    <div className="min-h-screen flex" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Sidebar navItems={NAV_ITEMS} page={page} onNavigate={handleNavigate} sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} agencyProfile={agencyProfile} />
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        <Header page={page} pageTitle={pageTitle} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} itineraries={itineraries} onSelectItinerary={handleSelect} onNavigate={handleNavigate} onNewItinerary={() => setShowNewModal(true)} onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
          {page === 'dashboard' && <Dashboard itineraries={itineraries} widgets={dashWidgets} onToggleWidget={toggleWidget} />}
          {page === 'itineraries' && <ItineraryList itineraries={itineraries} onSelect={handleSelect} onCreate={() => setShowNewModal(true)} onUpdateStatus={handleUpdateStatus} onManagePipeline={() => setPage('pipelines')} />}
          {page === 'travelers' && <Travelers itineraries={itineraries} onSelectItinerary={handleSelect} />}
          {page === 'pipelines' && <Pipelines pipelines={pipelines} onUpdate={setPipelines} />}
          {page === 'financials' && <Financials itineraries={itineraries} />}
          {page === 'detail' && selectedItin && <ItineraryDetail itin={selectedItin} onBack={handleBack} onUpdate={handleUpdate} agencyProfile={agencyProfile} />}
          {page === 'settings' && <Settings bookingSources={bookingSources} setBookingSources={setBookingSources} suppliers={suppliers} setSuppliers={setSuppliers} statusLabels={statusLabels} setStatusLabels={setStatusLabels} agencyProfile={agencyProfile} setAgencyProfile={setAgencyProfile} customFields={customFields} setCustomFields={setCustomFields} />}
        </div>
        <MobileNav navItems={NAV_ITEMS} page={page} onNavigate={handleNavigate} />
      </main>
      {showNewModal && <NewItineraryModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
