'use client';
/* eslint-disable */

import { useState, useCallback, useEffect, useRef } from 'react';
import { TopNav } from '@/components/layout';
import { Dashboard, ItineraryList, ItineraryDetail, Financials, Travelers, Settings, ExploreMap, MarketingGraphics, ItineraryBuilder, ShareableTrip } from '@/components/pages';
import PackageTemplates from '@/components/pages/PackageTemplates';
import AutomationsPanel from '@/components/pages/AutomationsPanel';
import NewItineraryModal from '@/components/modals/NewItineraryModal';
import { GHL, DEFAULT_STATUSES } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { Itinerary, Pipeline, DashWidget, AgencyProfile, CustomField, ChecklistTemplate, FinancialConfig, PackageTemplate, AutomationRule, FeatureFlags } from '@/lib/types';
import { DEFAULT_FINANCIAL_CONFIG, DEFAULT_FEATURE_FLAGS } from '@/lib/types';

let SsoHandler: any = null;
let axios: any = null;
try { SsoHandler = require('@/lib/ssohandler').default; } catch {}
try { axios = require('axios').default || require('axios'); } catch {}

const ALL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'trend' },
  { id: 'itineraries', label: 'Itineraries', icon: 'map' },
  { id: 'packages', label: 'Packages', icon: 'globe', flag: 'packagesEnabled' },
  { id: 'explore', label: 'Explore', icon: 'search' },
  { id: 'marketing', label: 'Marketing', icon: 'star', flag: 'marketingEnabled' },
  { id: 'travelers', label: 'Travelers', icon: 'users' },
  { id: 'financials', label: 'Financials', icon: 'dollar' },
  { id: 'automations', label: 'Automations', icon: 'bell', flag: 'automationsEnabled' },
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

// No demo data: all runtime data comes from /api/* after locationId is resolved.

export default function App() {
  const ssoAvailable = typeof SsoHandler === 'function';
  const ssoResult = ssoAvailable ? SsoHandler() : { SSO: null, checkSSO: () => {} };
  const { SSO, checkSSO } = ssoResult;
  const [locationId, setLocationId] = useState<string | null>(null);
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const hydratedRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [page, setPage] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [dashWidgets, setDashWidgets] = useState<DashWidget[]>(DEFAULT_WIDGETS);
  const [globalSearch, setGlobalSearch] = useState('');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<number>(1);
  const [bookingSources, setBookingSources] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [agencyProfile, setAgencyProfile] = useState<AgencyProfile>({ name: '', email: '', phone: '', address: '', logo: '' });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>(DEFAULT_FINANCIAL_CONFIG);
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [openPackageCreate, setOpenPackageCreate] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [shareItinId, setShareItinId] = useState<number | null>(null);

  // Filter nav items based on feature flags
  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (!item.flag) return true;
    return (featureFlags as any)[item.flag] !== false;
  });

  useEffect(() => { if (!ssoAvailable) return; const appId = process.env.NEXT_PUBLIC_GHL_APP_ID || ''; const ssoKey = process.env.NEXT_PUBLIC_GHL_SSO_KEY || ''; if (appId && ssoKey) checkSSO({ app_id: appId, key: ssoKey }); }, []);
  useEffect(() => { if (!SSO) return; try { const parsed = JSON.parse(SSO); if (parsed.activeLocation) setLocationId(parsed.activeLocation); } catch {} }, [SSO]);
  useEffect(() => {
    if (!locationId || !axios) return;
    setLoading(true);
    const loadData = async () => {
      try {
        const [itinRes, settingsRes, usersRes] = await Promise.allSettled([
          axios.get(`/api/itineraries?locationId=${locationId}`),
          axios.get(`/api/settings?locationId=${locationId}`),
          axios.get(`/api/users?locationId=${locationId}`),
        ]);

        if (itinRes.status === 'fulfilled' && itinRes.value.data?.success) {
          const loaded = itinRes.value.data.itineraries;
          if (Array.isArray(loaded)) setItineraries(loaded);
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success && settingsRes.value.data.settings) {
          const s = settingsRes.value.data.settings;
          if (s.agency_profile) setAgencyProfile(s.agency_profile);
          if (s.pipelines) setPipelines(s.pipelines);
          if (s.active_pipeline_id !== undefined) setActivePipelineId(s.active_pipeline_id);
          if (s.feature_flags) setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...s.feature_flags } as FeatureFlags);
          if (s.booking_sources) setBookingSources(s.booking_sources);
          if (s.suppliers) setSuppliers(s.suppliers);
          if (s.custom_fields) setCustomFields(s.custom_fields);
          if (s.checklist_templates) setChecklistTemplates(s.checklist_templates);
          if (s.financial_config) setFinancialConfig(s.financial_config);
          if (s.automation_rules) setAutomationRules(s.automation_rules);
          if (s.packages) setPackages(s.packages);
          if (s.dash_widgets) setDashWidgets(s.dash_widgets);
        }

        if (usersRes.status === 'fulfilled' && usersRes.value.data?.success) {
          const agentNames = (usersRes.value.data.agents || []).map((a: any) => a.name).filter(Boolean);
          setAgents(agentNames);
        }
      } catch {
        // keep UI empty on failure
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [locationId]);

  // Mark state as ready for persistence after the initial load completes.
  useEffect(() => {
    if (locationId && !loading) hydratedRef.current = true;
  }, [locationId, loading]);

  // Persist settings changes (including packages) per location.
  useEffect(() => {
    if (!locationId || !axios) return;
    if (!hydratedRef.current) return;
    if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);

    persistTimerRef.current = window.setTimeout(async () => {
      try {
        await axios.post('/api/settings', {
          locationId,
          agencyProfile,
          pipelines,
          activePipelineId,
          featureFlags,
          bookingSources,
          suppliers,
          customFields,
          checklistTemplates,
          financialConfig,
          automationRules,
          dashWidgets,
          packages,
        });
      } catch {
        // No-op: next change will retry.
      }
    }, 800);

    return () => {
      if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locationId,
    axios,
    loading,
    agencyProfile,
    pipelines,
    activePipelineId,
    featureFlags,
    bookingSources,
    suppliers,
    customFields,
    checklistTemplates,
    financialConfig,
    automationRules,
    dashWidgets,
    packages,
  ]);

  const saveItinerary = useCallback(async (itin: Itinerary) => {
    if (!locationId || !axios) return false;
    try {
      const res = await axios.post('/api/itineraries', { locationId, itinerary: itin });
      return Boolean(res?.data?.success);
    } catch {
      return false;
    }
  }, [locationId]);
  const deleteItineraryDB = useCallback(async (itineraryId: number) => { if (!locationId || !axios) return; try { await axios.delete('/api/itineraries', { data: { locationId, itineraryId } }); } catch {} }, [locationId]);

  const handleSelect = (id: number) => { setSelectedId(id); setPage('detail'); };
  const handleBack = () => { setPage('itineraries'); setSelectedId(null); };
  const handleNavigate = (id: string) => { setPage(id); setSelectedId(null); setShareItinId(null); };
  const selectedItin = itineraries.find((i) => i.id === selectedId);
  const shareItin = itineraries.find((i) => i.id === shareItinId);

  const handleCreate = useCallback(async (itin: Itinerary) => {
    const ok = await saveItinerary(itin);
    if (!ok) return false;
    setItineraries((prev) => [itin, ...prev]);
    setSelectedId(itin.id);
    setPage('detail');
    return true;
  }, [saveItinerary]);
  const handleUpdate = useCallback((updated: Itinerary) => { setItineraries((prev) => prev.map((i) => (i.id === updated.id ? updated : i))); saveItinerary(updated); }, [saveItinerary]);
  const handleUpdateStatus = useCallback((id: number, newStatus: string) => { setItineraries((prev) => { const next = prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)); const u = next.find((i) => i.id === id); if (u) saveItinerary(u); return next; }); }, [saveItinerary]);
  const handleDelete = useCallback((id: number) => { setItineraries((prev) => prev.filter((i) => i.id !== id)); deleteItineraryDB(id); if (selectedId === id) { setPage('itineraries'); setSelectedId(null); } }, [selectedId, deleteItineraryDB]);
  const toggleWidget = (id: string) => { setDashWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))); };

  const handleCreateFromPackage = useCallback((pkg: PackageTemplate) => {
    const today = new Date(); const endDate = new Date(today); endDate.setDate(today.getDate() + pkg.duration);
    const itin: Itinerary = { id: uid(), title: pkg.name, client: '', agent: agents[0] || 'Sarah Chen', startDate: today.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], destinations: pkg.destinations, destination: pkg.destinations.join(', '), clientPhones: [], clientEmails: [], clientAddresses: [], status: 'Draft', passengers: 2, tags: pkg.tags, notes: pkg.notes, created: today.toISOString().split('T')[0], isVip: false, destinationInfo: [], packageTemplateId: pkg.id, tripType: pkg.tripType, passengerList: [], flights: [], hotels: [], transport: [], attractions: [], insurance: [], carRentals: [], davening: [], mikvah: [], deposits: 0, checklist: pkg.checklist.map((text, i) => ({ id: uid() + i, text, done: false, notes: [] })) };
    setItineraries((prev) => [itin, ...prev]); setSelectedId(itin.id); setPage('detail'); void saveItinerary(itin);
  }, [agents, saveItinerary]);

  const handleNewPackage = useCallback(() => { setOpenPackageCreate(true); setPage('packages'); }, []);
  const handleBuilderComplete = useCallback(async (itin: Itinerary) => {
    const ok = await saveItinerary(itin);
    if (!ok) return false;
    setItineraries((prev) => [itin, ...prev]);
    setSelectedId(itin.id);
    setPage('detail');
    setShowBuilder(false);
    return true;
  }, [saveItinerary]);
  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
  const stages = activePipeline?.stages || DEFAULT_STATUSES;

  const showSkeleton = !locationId || loading;
  if (showBuilder) return (<div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}><TopNav navItems={navItems} page={page} onNavigate={(id) => { setShowBuilder(false); handleNavigate(id); }} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} /><main className="flex-1 p-4 md:p-6 overflow-auto"><ItineraryBuilder onComplete={handleBuilderComplete} onCancel={() => setShowBuilder(false)} /></main></div>);
  if (shareItinId && shareItin) return (<div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}><TopNav navItems={navItems} page={page} onNavigate={handleNavigate} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} /><main className="flex-1 p-4 md:p-6 overflow-auto"><ShareableTrip itin={shareItin} agencyProfile={agencyProfile} onBack={() => setShareItinId(null)} /></main></div>);

  if (showSkeleton) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <TopNav navItems={navItems} page={page} onNavigate={handleNavigate} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="animate-pulse bg-gray-200/60 rounded-xl h-20 w-1/5" />
              <div className="animate-pulse bg-gray-200/60 rounded-xl h-20 w-1/5" />
              <div className="animate-pulse bg-gray-200/60 rounded-xl h-20 w-1/5" />
              <div className="animate-pulse bg-gray-200/60 rounded-xl h-20 w-1/5" />
              <div className="animate-pulse bg-gray-200/60 rounded-xl h-20 w-1/5" />
            </div>
            <div className="bg-white rounded-xl border p-4 animate-pulse" style={{ borderColor: GHL.border }}>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-full mb-3" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="bg-white rounded-xl border p-4 animate-pulse" style={{ borderColor: GHL.border }}>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 rounded mb-2 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <TopNav navItems={navItems} page={page} onNavigate={handleNavigate} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {page === 'dashboard' && <Dashboard itineraries={itineraries} widgets={dashWidgets} onToggleWidget={toggleWidget} onSelectItinerary={handleSelect} />}
        {page === 'itineraries' && <ItineraryList itineraries={itineraries} pipelines={pipelines} activePipelineId={activePipelineId} onSetActivePipeline={setActivePipelineId} onSelect={handleSelect} onCreate={() => setShowNewModal(true)} onNewPackage={handleNewPackage} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />}
        {page === 'packages' && featureFlags.packagesEnabled && <PackageTemplates packages={packages} setPackages={setPackages} onCreateFromPackage={handleCreateFromPackage} openCreate={openPackageCreate} onOpenCreateConsumed={() => setOpenPackageCreate(false)} />}
        {page === 'explore' && <ExploreMap />}
        {page === 'marketing' && featureFlags.marketingEnabled && <MarketingGraphics packages={packages} agencyProfile={agencyProfile} />}
        {page === 'travelers' && <Travelers itineraries={itineraries} onSelectItinerary={handleSelect} onUpdateItinerary={handleUpdate} />}
        {page === 'financials' && <Financials itineraries={itineraries} onSelectItinerary={handleSelect} />}
        {page === 'automations' && featureFlags.automationsEnabled && <AutomationsPanel rules={automationRules} setRules={setAutomationRules} stages={stages} />}
        {page === 'detail' && selectedItin && <ItineraryDetail itin={selectedItin} onBack={handleBack} onUpdate={handleUpdate} onDelete={() => handleDelete(selectedItin.id)} agencyProfile={agencyProfile} pipelines={pipelines} checklistTemplates={checklistTemplates} />}
        {page === 'settings' && <Settings bookingSources={bookingSources} setBookingSources={setBookingSources} suppliers={suppliers} setSuppliers={setSuppliers} pipelines={pipelines} setPipelines={setPipelines} activePipelineId={activePipelineId} setActivePipelineId={setActivePipelineId} agencyProfile={agencyProfile} setAgencyProfile={setAgencyProfile} customFields={customFields} setCustomFields={setCustomFields} checklistTemplates={checklistTemplates} setChecklistTemplates={setChecklistTemplates} financialConfig={financialConfig} setFinancialConfig={setFinancialConfig} packages={packages} featureFlags={featureFlags} setFeatureFlags={setFeatureFlags} dashWidgets={dashWidgets} setDashWidgets={setDashWidgets} />}
      </main>
      {showNewModal && (
        <NewItineraryModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
          checklistTemplates={checklistTemplates}
          packages={packages}
          agents={agents}
          locationId={locationId}
          pipelines={pipelines}
          activePipelineId={activePipelineId}
        />
      )}
    </div>
  );
}