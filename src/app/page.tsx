'use client';
/* eslint-disable */

import { useState, useCallback, useEffect, useRef } from 'react';
import { TopNav } from '@/components/layout';
import { Dashboard, ItineraryList, Financials, Travelers, Settings, ExploreMap, MarketingGraphics, ItineraryBuilder, ShareableTrip } from '@/components/pages';
import ItineraryDetailWrapper from '@/components/pages/ItineraryDetailWrapper';
import PackageTemplates from '@/components/pages/PackageTemplates';
import AutomationsPanel from '@/components/pages/AutomationsPanel';
import NewItineraryModal from '@/components/modals/NewItineraryModal';
import { GHL, DEFAULT_STATUSES, DEFAULT_CHECKLIST_TEMPLATES } from '@/lib/constants';
import { SAMPLE_ITINERARIES } from '@/lib/sample-data';
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
const SAMPLE_PACKAGES: PackageTemplate[] = [
  { id: 1, name: 'Italy Honeymoon - 10 Nights', description: 'Rome, Florence, Amalfi Coast.', destinations: ['Rome', 'Florence', 'Amalfi Coast'], duration: 10, tripType: 'Honeymoon', tags: ['Honeymoon', 'Luxury', 'Italy'], flights: [], hotels: [], transport: [], attractions: [], insurance: [], carRentals: [], davening: [], mikvah: [], checklist: ['Confirm passports', 'Book flights', 'Book hotels'], notes: '', price: 8500, priceLabel: 'From $8,500/pp', created: '2026-01-15' },
  { id: 2, name: 'Israel Family - 7 Nights', description: 'Tel Aviv, Jerusalem, Dead Sea.', destinations: ['Tel Aviv', 'Jerusalem', 'Dead Sea'], duration: 7, tripType: 'Family', tags: ['Family', 'Israel'], flights: [], hotels: [], transport: [], attractions: [], insurance: [], carRentals: [], davening: [], mikvah: [], checklist: ['Confirm passports', 'Book flights'], notes: '', price: 4200, priceLabel: 'From $4,200/pp', created: '2026-02-01' },
];
const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  { id: 1, name: 'Delayed Flight > Attention', enabled: true, trigger: { type: 'flight_status', value: 'Delayed' }, action: { type: 'change_status', value: 'Attention Needed' } },
  { id: 2, name: 'Checklist Done > Completed', enabled: true, trigger: { type: 'checklist_complete' }, action: { type: 'change_status', value: 'Completed' } },
];

export default function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ssoAvailable = typeof SsoHandler === 'function';
  const ssoResult = ssoAvailable ? SsoHandler() : { SSO: null, checkSSO: () => {} };
  const { SSO, checkSSO } = ssoResult;
  const [locationId, setLocationId] = useState<string | null>(null);
  const [agents, setAgents] = useState<string[]>([]);
  const dataLoadedRef = useRef(false);

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
  const [financialConfig, setFinancialConfig] = useState<FinancialConfig>(DEFAULT_FINANCIAL_CONFIG);
  const [packages, setPackages] = useState<PackageTemplate[]>(SAMPLE_PACKAGES);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATIONS);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [openPackageCreate, setOpenPackageCreate] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [shareItinId, setShareItinId] = useState<number | null>(null);
  // Resolved locationId - from SSO or from Supabase token fallback
  const [resolvedLocationId, setResolvedLocationId] = useState<string | null>(null);

  const navItems = ALL_NAV_ITEMS.filter(item => { if (!item.flag) return true; return (featureFlags as any)[item.flag] !== false; });

  useEffect(() => { if (!ssoAvailable) return; const appId = process.env.NEXT_PUBLIC_GHL_APP_ID || ''; const ssoKey = process.env.NEXT_PUBLIC_GHL_SSO_KEY || ''; if (appId && ssoKey) checkSSO({ app_id: appId, key: ssoKey }); }, []);
  useEffect(() => { if (!SSO) return; try { const parsed = JSON.parse(SSO); if (parsed.activeLocation) { setLocationId(parsed.activeLocation); setResolvedLocationId(parsed.activeLocation); } } catch {} }, [SSO]);

  useEffect(() => {
    if (!locationId || dataLoadedRef.current || !axios) return;
    dataLoadedRef.current = true;
    const loadData = async () => {
      try {
        const [itinRes, settingsRes, usersRes, bizRes] = await Promise.allSettled([
          axios.get(`/api/itineraries?locationId=${locationId}`),
          axios.get(`/api/settings?locationId=${locationId}`),
          axios.get(`/api/users?locationId=${locationId}`),
          fetch(`/api/ghl-business?locationId=${locationId}`).then(r => r.json()),
        ]);
        if (itinRes.status === 'fulfilled' && itinRes.value.data?.success) {
          const loaded = itinRes.value.data.itineraries;
          if (Array.isArray(loaded) && loaded.length > 0) setItineraries(loaded);
        }
        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success && settingsRes.value.data.settings) {
          const s = settingsRes.value.data.settings;
          if (s.agency_profile) setAgencyProfile(s.agency_profile);
          if (s.pipelines) setPipelines(s.pipelines);
          if (s.feature_flags) setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...s.feature_flags });
          if (s.booking_sources) setBookingSources(s.booking_sources);
          if (s.suppliers) setSuppliers(s.suppliers);
          if (s.checklist_templates) setChecklistTemplates(s.checklist_templates);
          if (s.financial_config) setFinancialConfig(s.financial_config);
          if (s.dash_widgets) setDashWidgets(s.dash_widgets);
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.data?.success) {
          const agentNames = (usersRes.value.data.agents || []).map((a: any) => a.name).filter(Boolean);
          if (agentNames.length > 0) setAgents(agentNames);
        }
        if (bizRes.status === 'fulfilled') {
          const biz = (bizRes as any).value;
          if (biz?.success && biz.business) {
            const b = biz.business;
            setAgencyProfile(prev => ({
              name: prev.name && prev.name !== 'Kleegr Travel' ? prev.name : (b.name || prev.name),
              email: prev.email && prev.email !== 'info@kleegr.com' ? prev.email : (b.email || prev.email),
              phone: prev.phone && prev.phone !== '+1 (800) 555-TRAVEL' ? prev.phone : (b.phone || prev.phone),
              address: prev.address && prev.address !== 'New York, NY' ? prev.address : ([b.address, b.city, b.state, b.postalCode].filter(Boolean).join(', ') || prev.address),
              logo: b.logoUrl || prev.logo || '',
            }));
          }
        }
      } catch {}
    };
    loadData();
  }, [locationId]);

  // Without SSO: try to get locationId from Supabase tokens + load GHL business info
  useEffect(() => {
    if (locationId || dataLoadedRef.current) return;
    const loadBiz = async () => {
      try {
        const res = await fetch('/api/ghl-business');
        const data = await res.json();
        if (data?.success && data.business) {
          const b = data.business;
          setAgencyProfile(prev => ({
            name: b.name || prev.name,
            email: b.email || prev.email,
            phone: b.phone || prev.phone,
            address: [b.address, b.city, b.state, b.postalCode].filter(Boolean).join(', ') || prev.address,
            logo: b.logoUrl || prev.logo || '',
          }));
        }
        // Also try to get the locationId from the token for contact search
        const tokenRes = await fetch('/api/ghl-business');
        // The ghl-business endpoint returns locationId indirectly - let's get it from a simpler check
        const invRes = await fetch('/api/ghl-invoices');
        // We need the locationId for contact search - get from tokens table
        const locRes = await fetch('/api/ghl-invoice-test');
        const locData = await locRes.json();
        if (locData?.locationId) {
          setResolvedLocationId(locData.locationId);
        }
      } catch {}
    };
    loadBiz();
  }, [locationId]);

  // Use either SSO locationId or resolved one
  const effectiveLocationId = locationId || resolvedLocationId;

  const saveItinerary = useCallback(async (itin: Itinerary) => { if (!locationId || !axios) return; try { await axios.post('/api/itineraries', { locationId, itinerary: itin }); } catch {} }, [locationId]);
  const deleteItineraryDB = useCallback(async (itineraryId: number) => { if (!locationId || !axios) return; try { await axios.delete('/api/itineraries', { data: { locationId, itineraryId } }); } catch {} }, [locationId]);

  const handleSelect = (id: number) => { setSelectedId(id); setPage('detail'); };
  const handleBack = () => { setPage('itineraries'); setSelectedId(null); };
  const handleNavigate = (id: string) => { setPage(id); setSelectedId(null); setShareItinId(null); };
  const selectedItin = itineraries.find((i) => i.id === selectedId);

  const handleCreate = useCallback((itin: Itinerary) => { setItineraries((prev) => [itin, ...prev]); setSelectedId(itin.id); setPage('detail'); saveItinerary(itin); }, [saveItinerary]);
  const handleUpdate = useCallback((updated: Itinerary) => { setItineraries((prev) => prev.map((i) => (i.id === updated.id ? updated : i))); saveItinerary(updated); }, [saveItinerary]);
  const handleUpdateStatus = useCallback((id: number, newStatus: string) => { setItineraries((prev) => { const next = prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)); const u = next.find((i) => i.id === id); if (u) saveItinerary(u); return next; }); }, [saveItinerary]);
  const handleDelete = useCallback((id: number) => { setItineraries((prev) => prev.filter((i) => i.id !== id)); deleteItineraryDB(id); if (selectedId === id) { setPage('itineraries'); setSelectedId(null); } }, [selectedId, deleteItineraryDB]);
  const toggleWidget = (id: string) => { setDashWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))); };

  const handleCreateFromPackage = useCallback((pkg: PackageTemplate) => {
    const today = new Date(); const endDate = new Date(today); endDate.setDate(today.getDate() + pkg.duration);
    const itin: Itinerary = { id: uid(), title: pkg.name, client: '', agent: agents[0] || '', startDate: today.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], destinations: pkg.destinations, destination: pkg.destinations.join(', '), clientPhones: [], clientEmails: [], clientAddresses: [], status: 'Draft', passengers: 2, tags: pkg.tags, notes: pkg.notes, created: today.toISOString().split('T')[0], isVip: false, destinationInfo: [], packageTemplateId: pkg.id, tripType: pkg.tripType, passengerList: [], flights: [], hotels: [], transport: [], attractions: [], insurance: [], carRentals: [], davening: [], mikvah: [], deposits: 0, checklist: pkg.checklist.map((text, i) => ({ id: uid() + i, text, done: false, notes: [] })) };
    setItineraries((prev) => [itin, ...prev]); setSelectedId(itin.id); setPage('detail'); saveItinerary(itin);
  }, [agents, saveItinerary]);

  const handleNewPackage = useCallback(() => { setOpenPackageCreate(true); setPage('packages'); }, []);
  const handleBuilderComplete = useCallback((itin: Itinerary) => { setItineraries((prev) => [itin, ...prev]); setSelectedId(itin.id); setPage('detail'); setShowBuilder(false); saveItinerary(itin); }, [saveItinerary]);
  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
  const stages = activePipeline?.stages || DEFAULT_STATUSES;

  if (!mounted) {
    return (<div className="min-h-screen flex items-center justify-center" style={{ background: GHL.bg }}><div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /><span className="text-sm font-medium" style={{ color: GHL.muted }}>Loading...</span></div></div>);
  }

  if (showBuilder) return (<div className="min-h-screen flex flex-col" style={{ background: GHL.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}><TopNav navItems={navItems} page={page} onNavigate={(id) => { setShowBuilder(false); handleNavigate(id); }} agencyProfile={agencyProfile} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onNewItinerary={() => setShowNewModal(true)} onNewPackage={handleNewPackage} /><main className="flex-1 p-4 md:p-6 overflow-auto"><ItineraryBuilder onComplete={handleBuilderComplete} onCancel={() => setShowBuilder(false)} /></main></div>);

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
        {page === 'detail' && selectedItin && <ItineraryDetailWrapper itin={selectedItin} onBack={handleBack} onUpdate={handleUpdate} onDelete={() => handleDelete(selectedItin.id)} agencyProfile={agencyProfile} pipelines={pipelines} checklistTemplates={checklistTemplates} featureFlags={featureFlags} locationId={effectiveLocationId} />}
        {page === 'settings' && <Settings bookingSources={bookingSources} setBookingSources={setBookingSources} suppliers={suppliers} setSuppliers={setSuppliers} pipelines={pipelines} setPipelines={setPipelines} activePipelineId={activePipelineId} setActivePipelineId={setActivePipelineId} agencyProfile={agencyProfile} setAgencyProfile={setAgencyProfile} customFields={customFields} setCustomFields={setCustomFields} checklistTemplates={checklistTemplates} setChecklistTemplates={setChecklistTemplates} financialConfig={financialConfig} setFinancialConfig={setFinancialConfig} packages={packages} featureFlags={featureFlags} setFeatureFlags={setFeatureFlags} dashWidgets={dashWidgets} setDashWidgets={setDashWidgets} />}
      </main>
      {showNewModal && <NewItineraryModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} checklistTemplates={checklistTemplates} packages={packages} locationId={effectiveLocationId} agents={agents} pipelines={pipelines} activePipelineId={activePipelineId} />}
    </div>
  );
}
