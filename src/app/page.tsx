'use client';
/* eslint-disable */

import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { TopNav } from '@/components/layout';
import { Dashboard, ItineraryList, ItineraryDetail, Financials, Travelers, Settings, ExploreMap, MarketingGraphics, ItineraryBuilder, ShareableTrip } from '@/components/pages';
import PackageTemplates from '@/components/pages/PackageTemplates';
import AutomationsPanel from '@/components/pages/AutomationsPanel';
import NewItineraryModal from '@/components/modals/NewItineraryModal';
import SsoHandler from '@/lib/ssohandler';
import { GHL, DEFAULT_STATUSES, DEFAULT_CHECKLIST_TEMPLATES } from '@/lib/constants';
import { SAMPLE_ITINERARIES } from '@/lib/sample-data';
import { uid } from '@/lib/utils';
import type { Itinerary, Pipeline, DashWidget, AgencyProfile, CustomField, ChecklistTemplate, FinancialConfig, PackageTemplate, AutomationRule } from '@/lib/types';
import { DEFAULT_FINANCIAL_CONFIG } from '@/lib/types';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'trend' },
  { id: 'itineraries', label: 'Itineraries', icon: 'map' },
  { id: 'packages', label: 'Packages', icon: 'globe' },
  { id: 'explore', label: 'Explore', icon: 'search' },
  { id: 'marketing', label: 'Marketing', icon: 'star' },
  { id: 'travelers', label: 'Travelers', icon: 'users' },
  { id: 'financials', label: 'Financials', icon: 'dollar' },
  { id: 'automations', label: 'Automations', icon: 'bell' },
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

const SAMPLE_PACKAGES: PackageTemplate[] = [
  {
    id: 1, name: 'Italy Honeymoon - 10 Nights', description: 'Rome, Florence, Amalfi Coast. The ultimate romantic Italian experience with luxury hotels, private tours, and Michelin dining.',
    destinations: ['Rome', 'Florence', 'Amalfi Coast'], duration: 10, tripType: 'Honeymoon', tags: ['Honeymoon', 'Luxury', 'Italy'],
    flights: [], hotels: [], transport: [], attractions: [], insurance: [], carRentals: [], davening: [], mikvah: [],
    checklist: ['Confirm passports valid', 'Book flights', 'Book hotels', 'Arrange transfers', 'Book private tours', 'Restaurant reservations', 'Send itinerary to client'],
    notes: '', price: 8500, priceLabel: 'From $8,500 per person', created: '2026-01-15',
  },
  {
    id: 2, name: 'Israel Family Adventure - 7 Nights', description: 'Tel Aviv, Jerusalem, Dead Sea, Masada. Perfect for families with kids - educational and fun.',
    destinations: ['Tel Aviv', 'Jerusalem', 'Dead Sea'], duration: 7, tripType: 'Family', tags: ['Family', 'Israel', 'Adventure'],
    flights: [], hotels: [], transport: [], attractions: [], insurance: [], carRentals: [], davening: [], mikvah: [],
    checklist: ['Confirm passports', 'Book flights', 'Book hotels', 'Arrange car rental', 'Book tour guides', 'Kosher restaurant list'],
    notes: '', price: 4200, priceLabel: 'From $4,200 per person', created: '2026-02-01',
  },
];

const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  { id: 1, name: 'Delayed Flight > Attention Needed', enabled: true, trigger: { type: 'flight_status', value: 'Delayed' }, action: { type: 'change_status', value: 'Attention Needed' } },
  { id: 2, name: 'All Checklist Done > Completed', enabled: true, trigger: { type: 'checklist_complete' }, action: { type: 'change_status', value: 'Completed' } },
];

export default function App() {
  // ─── SSO & Location ───
  const { SSO, checkSSO } = SsoHandler();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [agents, setAgents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);

  // ─── Core state ───
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
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
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>(DEFAULT_FINANCIAL_CONFIG);
  const [packages, setPackages] = useState<PackageTemplate[]>(SAMPLE_PACKAGES);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATIONS);
  const [openPackageCreate, setOpenPackageCreate] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [shareItinId, setShareItinId] = useState<number | null>(null);

  // ─── Auto-save timers ───
  const itinSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Step 1: Initialize SSO ───
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_GHL_APP_ID || '';
    const ssoKey = process.env.NEXT_PUBLIC_GHL_SSO_KEY || '';

    if (appId && ssoKey) {
      checkSSO({ app_id: appId, key: ssoKey });
    }

    // Dev fallback: use env var if SSO not available (e.g. local testing)
    const devLocationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
    if (devLocationId) {
      const fallbackTimer = setTimeout(() => {
        setLocationId((prev) => {
          if (!prev) {
            console.log('Using dev fallback locationId:', devLocationId);
            return devLocationId;
          }
          return prev;
        });
      }, 2000);
      return () => clearTimeout(fallbackTimer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step 2: Parse SSO data to extract activeLocation ───
  useEffect(() => {
    if (!SSO) return;
    try {
      const parsed = JSON.parse(SSO);

      console.log('Parsed SSO data:', parsed);
      // SSO shape: { userId, companyId, activeLocation, userName, email, role, type }
      if (parsed.activeLocation) {
        console.log('SSO activeLocation:', parsed.activeLocation);
        setLocationId(parsed.activeLocation);
      }
    } catch (e) {
      console.error('Failed to parse SSO data:', e);
    }
  }, [SSO]);

  // ─── Step 3: Load data from Supabase when locationId is available ───
  useEffect(() => {
    if (!locationId || dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Load itineraries, settings, and users in parallel
        const [itinRes, settingsRes, usersRes] = await Promise.allSettled([
          axios.get(`/api/itineraries?locationId=${locationId}`),
          axios.get(`/api/settings?locationId=${locationId}`),
          axios.get(`/api/users?locationId=${locationId}`),
        ]);

        // Process itineraries
        if (itinRes.status === 'fulfilled' && itinRes.value.data?.success) {
          const loaded = itinRes.value.data.itineraries;
          if (Array.isArray(loaded) && loaded.length > 0) {
            setItineraries(loaded);
          } else {
            // No saved itineraries — use samples as starting point
            setItineraries(SAMPLE_ITINERARIES);
          }
        } else {
          setItineraries(SAMPLE_ITINERARIES);
        }

        // Process settings
        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success) {
          const s = settingsRes.value.data.settings;
          if (s) {
            if (s.agency_profile) setAgencyProfile(s.agency_profile);
            if (s.pipelines) setPipelines(s.pipelines);
            if (s.active_pipeline_id) setActivePipelineId(s.active_pipeline_id);
            if (s.booking_sources) setBookingSources(s.booking_sources);
            if (s.suppliers) setSuppliers(s.suppliers);
            if (s.custom_fields) setCustomFields(s.custom_fields);
            if (s.checklist_templates) setChecklistTemplates(s.checklist_templates);
            if (s.financial_config) setFinancialConfig(s.financial_config);
            if (s.automation_rules) setAutomationRules(s.automation_rules);
            if (s.dash_widgets) setDashWidgets(s.dash_widgets);
            if (s.packages) setPackages(s.packages);
          }
        }

        // Process users/agents
        if (usersRes.status === 'fulfilled' && usersRes.value.data?.success) {
          const agentList = usersRes.value.data.agents || [];
          setAgents(agentList.map((a: any) => a.name).filter(Boolean));
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setLoadError(err.message || 'Failed to load data');
        setItineraries(SAMPLE_ITINERARIES);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [locationId]);

  // ─── Save helpers ───
  const saveItinerary = useCallback(async (itin: Itinerary) => {
    if (!locationId) return;
    try {
      await axios.post('/api/itineraries', { locationId, itinerary: itin });
    } catch (e: any) {
      console.error('Failed to save itinerary:', e.message);
    }
  }, [locationId]);

  const deleteItinerary = useCallback(async (itineraryId: number) => {
    if (!locationId) return;
    try {
      await axios.delete('/api/itineraries', { data: { locationId, itineraryId } });
    } catch (e: any) {
      console.error('Failed to delete itinerary:', e.message);
    }
  }, [locationId]);

  const saveAllSettings = useCallback(async () => {
    if (!locationId) return;
    try {
      await axios.post('/api/settings', {
        locationId,
        agencyProfile, pipelines, activePipelineId, bookingSources, suppliers,
        customFields, checklistTemplates, financialConfig, automationRules,
        dashWidgets, packages,
      });
    } catch (e: any) {
      console.error('Failed to save settings:', e.message);
    }
  }, [locationId, agencyProfile, pipelines, activePipelineId, bookingSources, suppliers, customFields, checklistTemplates, financialConfig, automationRules, dashWidgets, packages]);

  // ─── Auto-save itineraries (debounced) ───
  const debouncedSaveItineraries = useCallback(() => {
    if (!locationId) return;
    if (itinSaveTimer.current) clearTimeout(itinSaveTimer.current);
    itinSaveTimer.current = setTimeout(async () => {
      try {
        await axios.post('/api/itineraries', { locationId, itineraries });
      } catch (e: any) {
        console.error('Auto-save itineraries failed:', e.message);
      }
    }, 3000);
  }, [locationId, itineraries]);

  // ─── Auto-save settings (debounced) ───
  const debouncedSaveSettings = useCallback(() => {
    if (!locationId) return;
    if (settingsSaveTimer.current) clearTimeout(settingsSaveTimer.current);
    settingsSaveTimer.current = setTimeout(() => {
      saveAllSettings();
    }, 3000);
  }, [locationId, saveAllSettings]);

  // Trigger settings auto-save when any settings state changes
  const settingsInitRef = useRef(false);
  useEffect(() => {
    if (!settingsInitRef.current) {
      settingsInitRef.current = true;
      return;
    }
    debouncedSaveSettings();
  }, [agencyProfile, pipelines, activePipelineId, bookingSources, suppliers, customFields, checklistTemplates, financialConfig, automationRules, dashWidgets, packages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ───
  const handleSelect = (id: number) => { setSelectedId(id); setPage('detail'); };
  const handleBack = () => { setPage('itineraries'); setSelectedId(null); };
  const handleNavigate = (id: string) => { setPage(id); setSelectedId(null); setShareItinId(null); };
  const selectedItin = itineraries.find((i) => i.id === selectedId);
  const shareItin = itineraries.find((i) => i.id === shareItinId);

  const handleCreate = useCallback((itin: Itinerary) => {
    setItineraries((prev) => [itin, ...prev]);
    setSelectedId(itin.id);
    setPage('detail');
    saveItinerary(itin);
  }, [saveItinerary]);

  const handleUpdate = useCallback((updated: Itinerary) => {
    setItineraries((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    saveItinerary(updated);
  }, [saveItinerary]);

  const handleUpdateStatus = useCallback((id: number, newStatus: string) => {
    setItineraries((prev) => {
      const updated = prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
      const changed = updated.find((i) => i.id === id);
      if (changed) saveItinerary(changed);
      return updated;
    });
  }, [saveItinerary]);

  const handleDelete = useCallback((id: number) => {
    setItineraries((prev) => prev.filter((i) => i.id !== id));
    deleteItinerary(id);
    if (selectedId === id) { setPage('itineraries'); setSelectedId(null); }
  }, [selectedId, deleteItinerary]);

  const toggleWidget = (id: string) => { setDashWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))); };

  const handleCreateFromPackage = useCallback((pkg: PackageTemplate) => {
    const today = new Date();
    const endDate = new Date(today); endDate.setDate(today.getDate() + pkg.duration);
    const itin: Itinerary = {
      id: uid(), title: pkg.name, client: '', agent: agents[0] || 'Sarah Chen',
      startDate: today.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0],
      destinations: pkg.destinations, destination: pkg.destinations.join(', '),
      clientPhones: [], clientEmails: [], clientAddresses: [],
      status: 'Draft', passengers: 2, tags: pkg.tags, notes: pkg.notes,
      created: today.toISOString().split('T')[0], isVip: false,
      destinationInfo: [], checklistTemplateId: undefined, packageTemplateId: pkg.id,
      tripType: pkg.tripType,
      passengerList: [], flights: [], hotels: [], transport: [], attractions: [],
      insurance: [], carRentals: [], davening: [], mikvah: [],
      deposits: 0,
      checklist: pkg.checklist.map((text, i) => ({ id: uid() + i, text, done: false, notes: [] })),
    };
    setItineraries((prev) => [itin, ...prev]);
    setSelectedId(itin.id);
    setPage('detail');
    saveItinerary(itin);
  }, [agents, saveItinerary]);

  const handleNewPackage = useCallback(() => { setOpenPackageCreate(true); setPage('packages'); }, []);

  const handleBuilderComplete = useCallback((itin: Itinerary) => {
    setItineraries((prev) => [itin, ...prev]);
    setSelectedId(itin.id);
    setPage('detail');
    setShowBuilder(false);
    saveItinerary(itin);
  }, [saveItinerary]);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
  const stages = activePipeline?.stages || DEFAULT_STATUSES;

  // ─── Loading screen ───
  if (isLoading && !itineraries.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading your data...</p>
        {loadError && <p className="text-red-400 text-xs mt-2">{loadError}</p>}
      </div>
    );
  }

  if (showBuilder) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <TopNav navItems={NAV_ITEMS} page={page} onNavigate={(id) => { setShowBuilder(false); handleNavigate(id); }} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} />
        <main className="flex-1 p-4 md:p-6 overflow-auto"><ItineraryBuilder onComplete={handleBuilderComplete} onCancel={() => setShowBuilder(false)} agents={agents} /></main>
      </div>
    );
  }

  if (shareItinId && shareItin) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <TopNav navItems={NAV_ITEMS} page={page} onNavigate={handleNavigate} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} />
        <main className="flex-1 p-4 md:p-6 overflow-auto"><ShareableTrip itin={shareItin} agencyProfile={agencyProfile} onBack={() => setShareItinId(null)} /></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <TopNav navItems={NAV_ITEMS} page={page} onNavigate={handleNavigate} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {page === 'dashboard' && <Dashboard itineraries={itineraries} widgets={dashWidgets} onToggleWidget={toggleWidget} agents={agents} />}
        {page === 'itineraries' && <ItineraryList itineraries={itineraries} pipelines={pipelines} activePipelineId={activePipelineId} onSetActivePipeline={setActivePipelineId} onSelect={handleSelect} onCreate={() => setShowNewModal(true)} onNewPackage={handleNewPackage} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} agents={agents} />}
        {page === 'packages' && <PackageTemplates packages={packages} setPackages={setPackages} onCreateFromPackage={handleCreateFromPackage} openCreate={openPackageCreate} onOpenCreateConsumed={() => setOpenPackageCreate(false)} />}
        {page === 'explore' && <ExploreMap />}
        {page === 'marketing' && <MarketingGraphics packages={packages} agencyProfile={agencyProfile} />}
        {page === 'travelers' && <Travelers itineraries={itineraries} onSelectItinerary={handleSelect} onUpdateItinerary={handleUpdate} />}
        {page === 'financials' && <Financials itineraries={itineraries} onSelectItinerary={handleSelect} agents={agents} />}
        {page === 'automations' && <AutomationsPanel rules={automationRules} setRules={setAutomationRules} stages={stages} />}
        {page === 'detail' && selectedItin && <ItineraryDetail itin={selectedItin} onBack={handleBack} onUpdate={handleUpdate} onDelete={() => handleDelete(selectedItin.id)} agencyProfile={agencyProfile} pipelines={pipelines} checklistTemplates={checklistTemplates} agents={agents} />}
        {page === 'settings' && <Settings bookingSources={bookingSources} setBookingSources={setBookingSources} suppliers={suppliers} setSuppliers={setSuppliers} pipelines={pipelines} setPipelines={setPipelines} activePipelineId={activePipelineId} setActivePipelineId={setActivePipelineId} agencyProfile={agencyProfile} setAgencyProfile={setAgencyProfile} customFields={customFields} setCustomFields={setCustomFields} checklistTemplates={checklistTemplates} setChecklistTemplates={setChecklistTemplates} financialConfig={financialConfig} setFinancialConfig={setFinancialConfig} packages={packages} />}
      </main>
      {showNewModal && <NewItineraryModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} checklistTemplates={checklistTemplates} packages={packages} agents={agents} locationId={locationId} />}
    </div>
  );
}
