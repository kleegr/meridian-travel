'use client';

import { useState, useCallback } from 'react';
import { TopNav } from '@/components/layout';
import { Dashboard, ItineraryList, ItineraryDetail, Financials, Travelers, Settings } from '@/components/pages';
import CalendarView from '@/components/pages/CalendarView';
import NewItineraryModal from '@/components/modals/NewItineraryModal';
import { GHL, DEFAULT_STATUSES, DEFAULT_CHECKLIST_TEMPLATES } from '@/lib/constants';
import { SAMPLE_ITINERARIES } from '@/lib/sample-data';
import type { Itinerary, Pipeline, DashWidget, AgencyProfile, CustomField, ChecklistTemplate } from '@/lib/types';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'trend' },
  { id: 'itineraries', label: 'Itineraries', icon: 'map' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'travelers', label: 'Travelers', icon: 'users' },
  { id: 'financials', label: 'Financials', icon: 'dollar' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const DEFAULT_WIDGETS: DashWidget[] = [
  { id: 'overview', label: 'Overview Cards', enabled: true },
  { id: 'agents', label: 'Agent Performance', enabled: true },
  { id: 'status', label: 'Status Breakdown', enabled: true },
  { id: 'upcoming', label: 'Upcoming Trips', enabled: true },
  { id: 'checklist', label: 'Checklist Progress', enabled: true },
];

const DEFAULT_PIPELINES: Pipeline[] = [{ id: 1, name: 'Itinerary Status', stages: [...DEFAULT_STATUSES] }];

export default function App() {
  const [itineraries, setItineraries] = useState<Itinerary[]>(SAMPLE_ITINERARIES);
  const [page, setPage] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [dashWidgets, setDashWidgets] = useState<DashWidget[]>(DEFAULT_WIDGETS);
  const [globalSearch, setGlobalSearch] = useState('');
  const [pipelines, setPipelines] = useState<Pipeline[]>(DEFAULT_PIPELINES);
  const [activePipelineId, setActivePipelineId] = useState<number>(1);
  const [bookingSources, setBookingSources] = useState(['GDS', 'Direct', 'Amex', 'Viator', 'Online']);
  const [suppliers, setSuppliers] = useState(['Delta', 'ANA', 'Emirates', 'Air France', 'Kenya Airways']);
  const [agencyProfile, setAgencyProfile] = useState<AgencyProfile>({ name: 'Kleegr Travel', email: 'info@kleegr.com', phone: '+1 (800) 555-TRAVEL', address: 'New York, NY', logo: '' });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>(DEFAULT_CHECKLIST_TEMPLATES);

  const handleSelect = (id: number) => { setSelectedId(id); setPage('detail'); };
  const handleBack = () => { setPage('itineraries'); setSelectedId(null); };
  const handleNavigate = (id: string) => { setPage(id); setSelectedId(null); };
  const selectedItin = itineraries.find((i) => i.id === selectedId);
  const handleCreate = useCallback((itin: Itinerary) => { setItineraries((prev) => [itin, ...prev]); setSelectedId(itin.id); setPage('detail'); }, []);
  const handleUpdate = useCallback((updated: Itinerary) => { setItineraries((prev) => prev.map((i) => (i.id === updated.id ? updated : i))); }, []);
  const handleUpdateStatus = useCallback((id: number, newStatus: string) => { setItineraries((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))); }, []);
  const handleDelete = useCallback((id: number) => { setItineraries((prev) => prev.filter((i) => i.id !== id)); if (selectedId === id) { setPage('itineraries'); setSelectedId(null); } }, [selectedId]);
  const toggleWidget = (id: string) => { setDashWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))); };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <TopNav navItems={NAV_ITEMS} page={page} onNavigate={handleNavigate} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {page === 'dashboard' && <Dashboard itineraries={itineraries} widgets={dashWidgets} onToggleWidget={toggleWidget} />}
        {page === 'itineraries' && <ItineraryList itineraries={itineraries} pipelines={pipelines} activePipelineId={activePipelineId} onSetActivePipeline={setActivePipelineId} onSelect={handleSelect} onCreate={() => setShowNewModal(true)} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />}
        {page === 'calendar' && <CalendarView itineraries={itineraries} onSelect={handleSelect} />}
        {page === 'travelers' && <Travelers itineraries={itineraries} onSelectItinerary={handleSelect} />}
        {page === 'financials' && <Financials itineraries={itineraries} onSelectItinerary={handleSelect} />}
        {page === 'detail' && selectedItin && <ItineraryDetail itin={selectedItin} onBack={handleBack} onUpdate={handleUpdate} onDelete={() => handleDelete(selectedItin.id)} agencyProfile={agencyProfile} pipelines={pipelines} checklistTemplates={checklistTemplates} />}
        {page === 'settings' && <Settings bookingSources={bookingSources} setBookingSources={setBookingSources} suppliers={suppliers} setSuppliers={setSuppliers} pipelines={pipelines} setPipelines={setPipelines} activePipelineId={activePipelineId} setActivePipelineId={setActivePipelineId} agencyProfile={agencyProfile} setAgencyProfile={setAgencyProfile} customFields={customFields} setCustomFields={setCustomFields} checklistTemplates={checklistTemplates} setChecklistTemplates={setChecklistTemplates} />}
      </main>
      {showNewModal && <NewItineraryModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} checklistTemplates={checklistTemplates} />}
    </div>
  );
}
