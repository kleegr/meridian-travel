'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { TopNav } from '@/components/layout';
import { Dashboard, ItineraryList, ItineraryDetail, Financials, Travelers, Settings, ExploreMap, MarketingGraphics, ItineraryBuilder, ShareableTrip } from '@/components/pages';
import PackageTemplates from '@/components/pages/PackageTemplates';
import AutomationsPanel from '@/components/pages/AutomationsPanel';
import NewItineraryModal from '@/components/modals/NewItineraryModal';
import { GHL, DEFAULT_STATUSES, DEFAULT_CHECKLIST_TEMPLATES } from '@/lib/constants';
import { uid } from '@/lib/utils';
import SsoHandler from '@/lib/ssohandler';
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

// SSO config for this app
const SSO_CONFIG = {
  app_id: process.env.NEXT_PUBLIC_GHL_APP_ID || "",
  key: process.env.NEXT_PUBLIC_SSO_KEY || "",
};

interface SSOData {
  userId: string;
  companyId: string;
  activeLocation: string;
  userName: string;
  email: string;
  role: string;
  type: string;
}

export default function App() {
  // SSO State
  const [locationId, setLocationId] = useState<string | null>(null);
  const [ssoData, setSsoData] = useState<SSOData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { SSO, checkSSO } = SsoHandler();

  // App State
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

  // Debounce timer refs for auto-save
  const saveItinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSettingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── SSO INITIALIZATION ───────────────────────────────────────────
  useEffect(() => {
    checkSSO(SSO_CONFIG);
  }, []);

  useEffect(() => {
    if (SSO) {
      try {
        const data = JSON.parse(SSO) as SSOData;
        setSsoData(data);
        setLocationId(data.activeLocation);
      } catch (e) {
        console.error("Failed to parse SSO data:", e);
        setLoadError("Failed to decrypt SSO data. Please reload.");
        setIsLoading(false);
      }
    }
  }, [SSO]);

  // ─── LOAD DATA FROM SUPABASE ONCE WE HAVE locationId ─────────────
  useEffect(() => {
    if (!locationId) return;
    loadAllData(locationId);
  }, [locationId]);

  const loadAllData = async (locId: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Fetch itineraries and settings in parallel
      const [itinRes, settingsRes] = await Promise.all([
        axios.get(`/api/itineraries?locationId=${encodeURIComponent(locId)}`),
        axios.get(`/api/settings?locationId=${encodeURIComponent(locId)}`),
      ]);

      // Load itineraries
      if (itinRes.data?.success && itinRes.data.itineraries?.length > 0) {
        setItineraries(itinRes.data.itineraries);
      }

      // Load settings
      if (settingsRes.data?.success && settingsRes.data.settings) {
        const s = settingsRes.data.settings;
        if (s.agency_profile && Object.keys(s.agency_profile).length > 0) setAgencyProfile(s.agency_profile);
        if (s.pipelines && s.pipelines.length > 0) setPipelines(s.pipelines);
        if (s.active_pipeline_id) setActivePipelineId(s.active_pipeline_id);
        if (s.booking_sources && s.booking_sources.length > 0) setBookingSources(s.booking_sources);
        if (s.suppliers && s.suppliers.length > 0) setSuppliers(s.suppliers);
        if (s.custom_fields) setCustomFields(s.custom_fields);
        if (s.checklist_templates && s.checklist_templates.length > 0) setChecklistTemplates(s.checklist_templates);
        if (s.financial_config && Object.keys(s.financial_config).length > 0) setFinancialConfig(s.financial_config);
        if (s.automation_rules && s.automation_rules.length > 0) setAutomationRules(s.automation_rules);
        if (s.dash_widgets && s.dash_widgets.length > 0) setDashWidgets(s.dash_widgets);
        if (s.packages && s.packages.length > 0) setPackages(s.packages);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      setLoadError("Failed to load data. Using defaults.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── AUTO-SAVE: Itineraries ───────────────────────────────────────
  const saveItineraries = useCallback((itins: Itinerary[]) => {
    if (!locationId) return;
    if (saveItinTimer.current) clearTimeout(saveItinTimer.current);
    saveItinTimer.current = setTimeout(async () => {
      try {
        await axios.post('/api/itineraries', { locationId, itineraries: itins });
      } catch (e) {
        console.error("Auto-save itineraries failed:", e);
      }
    }, 1500);
  }, [locationId]);

  // ─── AUTO-SAVE: Settings ──────────────────────────────────────────
  const saveSettings = useCallback((overrides?: Record<string, any>) => {
    if (!locationId) return;
    if (saveSettingsTimer.current) clearTimeout(saveSettingsTimer.current);
    saveSettingsTimer.current = setTimeout(async () => {
      try {
        await axios.post('/api/settings', {
          locationId,
          agencyProfile,
          pipelines,
          activePipelineId,
          bookingSources,
          suppliers,
          customFields,
          checklistTemplates,
          financialConfig,
          automationRules,
          dashWidgets,
          packages,
          ...overrides,
        });
      } catch (e) {
        console.error("Auto-save settings failed:", e);
      }
    }, 1500);
  }, [locationId, agencyProfile, pipelines, activePipelineId, bookingSources, suppliers, customFields, checklistTemplates, financialConfig, automationRules, dashWidgets, packages]);

  // ─── SAVE SINGLE ITINERARY (for create/update) ───────────────────
  const saveItinerary = useCallback((itin: Itinerary) => {
    if (!locationId) return;
    axios.post('/api/itineraries', { locationId, itinerary: itin }).catch(e => console.error("Save itinerary failed:", e));
  }, [locationId]);

  // ─── DELETE ITINERARY FROM DB ─────────────────────────────────────
  const deleteItineraryFromDB = useCallback((itineraryId: number) => {
    if (!locationId) return;
    axios.delete('/api/itineraries', { data: { locationId, itineraryId } }).catch(e => console.error("Delete itinerary failed:", e));
  }, [locationId]);

  // ─── HANDLERS (same as before but with DB persistence) ────────────
  const handleSelect = (id: number) => { setSelectedId(id); setPage('detail'); };
  const handleBack = () => { setPage('itineraries'); setSelectedId(null); };
  const handleNavigate = (id: string) => { setPage(id); setSelectedId(null); setShareItinId(null); };
  const selectedItin = itineraries.find((i) => i.id === selectedId);
  const shareItin = itineraries.find((i) => i.id === shareItinId);

  const handleCreate = useCallback((itin: Itinerary) => {
    setItineraries((prev) => {
      const next = [itin, ...prev];
      saveItinerary(itin);
      return next;
    });
    setSelectedId(itin.id);
    setPage('detail');
  }, [saveItinerary]);

  const handleUpdate = useCallback((updated: Itinerary) => {
    setItineraries((prev) => {
      const next = prev.map((i) => (i.id === updated.id ? updated : i));
      saveItinerary(updated);
      return next;
    });
  }, [saveItinerary]);

  const handleUpdateStatus = useCallback((id: number, newStatus: string) => {
    setItineraries((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
      const updated = next.find(i => i.id === id);
      if (updated) saveItinerary(updated);
      return next;
    });
  }, [saveItinerary]);

  const handleDelete = useCallback((id: number) => {
    setItineraries((prev) => prev.filter((i) => i.id !== id));
    deleteItineraryFromDB(id);
    if (selectedId === id) { setPage('itineraries'); setSelectedId(null); }
  }, [selectedId, deleteItineraryFromDB]);

  const toggleWidget = (id: string) => {
    setDashWidgets((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
      saveSettings({ dashWidgets: next });
      return next;
    });
  };

  // Wrapped setters that auto-save settings
  const setBookingSourcesAndSave = useCallback((val: string[] | ((prev: string[]) => string[])) => {
    setBookingSources((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ bookingSources: next });
      return next;
    });
  }, [saveSettings]);

  const setSuppliersAndSave = useCallback((val: string[] | ((prev: string[]) => string[])) => {
    setSuppliers((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ suppliers: next });
      return next;
    });
  }, [saveSettings]);

  const setPipelinesAndSave = useCallback((val: Pipeline[] | ((prev: Pipeline[]) => Pipeline[])) => {
    setPipelines((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ pipelines: next });
      return next;
    });
  }, [saveSettings]);

  const setActivePipelineIdAndSave = useCallback((val: number) => {
    setActivePipelineId(val);
    saveSettings({ activePipelineId: val });
  }, [saveSettings]);

  const setAgencyProfileAndSave = useCallback((val: AgencyProfile | ((prev: AgencyProfile) => AgencyProfile)) => {
    setAgencyProfile((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ agencyProfile: next });
      return next;
    });
  }, [saveSettings]);

  const setCustomFieldsAndSave = useCallback((val: CustomField[] | ((prev: CustomField[]) => CustomField[])) => {
    setCustomFields((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ customFields: next });
      return next;
    });
  }, [saveSettings]);

  const setChecklistTemplatesAndSave = useCallback((val: ChecklistTemplate[] | ((prev: ChecklistTemplate[]) => ChecklistTemplate[])) => {
    setChecklistTemplates((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ checklistTemplates: next });
      return next;
    });
  }, [saveSettings]);

  const setFinancialConfigAndSave = useCallback((val: FinancialConfig | ((prev: FinancialConfig) => FinancialConfig)) => {
    setFinancialConfig((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ financialConfig: next });
      return next;
    });
  }, [saveSettings]);

  const setPackagesAndSave = useCallback((val: PackageTemplate[] | ((prev: PackageTemplate[]) => PackageTemplate[])) => {
    setPackages((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ packages: next });
      return next;
    });
  }, [saveSettings]);

  const setAutomationRulesAndSave = useCallback((val: AutomationRule[] | ((prev: AutomationRule[]) => AutomationRule[])) => {
    setAutomationRules((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      saveSettings({ automationRules: next });
      return next;
    });
  }, [saveSettings]);

  const handleCreateFromPackage = useCallback((pkg: PackageTemplate, mode: 'exact' | 'customize') => {
    const today = new Date();
    const endDate = new Date(today); endDate.setDate(today.getDate() + pkg.duration);
    const itin: Itinerary = {
      id: uid(), title: pkg.name, client: '', agent: ssoData?.userName || 'Agent',
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
    saveItinerary(itin);
    setSelectedId(itin.id);
    setPage('detail');
  }, [ssoData, saveItinerary]);

  const handleNewPackage = useCallback(() => { setOpenPackageCreate(true); setPage('packages'); }, []);
  const handleBuilderComplete = useCallback((itin: Itinerary) => { setItineraries((prev) => [itin, ...prev]); setSelectedId(itin.id); setPage('detail'); setShowBuilder(false); }, []);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
  const stages = activePipeline?.stages || DEFAULT_STATUSES;

  if (showBuilder) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <TopNav navItems={NAV_ITEMS} page={page} onNavigate={(id) => { setShowBuilder(false); handleNavigate(id); }} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} />
        <main className="flex-1 p-4 md:p-6 overflow-auto"><ItineraryBuilder onComplete={handleBuilderComplete} onCancel={() => setShowBuilder(false)} /></main>
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
        {page === 'dashboard' && <Dashboard itineraries={itineraries} widgets={dashWidgets} onToggleWidget={toggleWidget} />}
        {page === 'itineraries' && <ItineraryList itineraries={itineraries} pipelines={pipelines} activePipelineId={activePipelineId} onSetActivePipeline={setActivePipelineId} onSelect={handleSelect} onCreate={() => setShowNewModal(true)} onNewPackage={handleNewPackage} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />}
        {page === 'packages' && <PackageTemplates packages={packages} setPackages={setPackages} onCreateFromPackage={handleCreateFromPackage} openCreate={openPackageCreate} onOpenCreateConsumed={() => setOpenPackageCreate(false)} />}
        {page === 'explore' && <ExploreMap />}
        {page === 'marketing' && <MarketingGraphics packages={packages} agencyProfile={agencyProfile} />}
        {page === 'travelers' && <Travelers itineraries={itineraries} onSelectItinerary={handleSelect} onUpdateItinerary={handleUpdate} />}
        {page === 'financials' && <Financials itineraries={itineraries} onSelectItinerary={handleSelect} />}
        {page === 'automations' && <AutomationsPanel rules={automationRules} setRules={setAutomationRulesAndSave} stages={stages} />}
        {page === 'detail' && selectedItin && <ItineraryDetail itin={selectedItin} onBack={handleBack} onUpdate={handleUpdate} onDelete={() => handleDelete(selectedItin.id)} agencyProfile={agencyProfile} pipelines={pipelines} checklistTemplates={checklistTemplates} />}
        {page === 'settings' && <Settings bookingSources={bookingSources} setBookingSources={setBookingSourcesAndSave} suppliers={suppliers} setSuppliers={setSuppliersAndSave} pipelines={pipelines} setPipelines={setPipelinesAndSave} activePipelineId={activePipelineId} setActivePipelineId={setActivePipelineIdAndSave} agencyProfile={agencyProfile} setAgencyProfile={setAgencyProfileAndSave} customFields={customFields} setCustomFields={setCustomFieldsAndSave} checklistTemplates={checklistTemplates} setChecklistTemplates={setChecklistTemplatesAndSave} financialConfig={financialConfig} setFinancialConfig={setFinancialConfigAndSave} packages={packages} />}
      </main>
      {showNewModal && <NewItineraryModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} checklistTemplates={checklistTemplates} packages={packages} />}
    </div>
  );
}
