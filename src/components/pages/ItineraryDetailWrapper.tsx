'use client';

import { useState } from 'react';
import ItineraryDetail from './ItineraryDetail';
import InvoicesTab from './InvoicesTab';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { Itinerary, AgencyProfile, Pipeline, ChecklistTemplate, FeatureFlags } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onBack: () => void;
  onUpdate: (u: Itinerary) => void;
  onDelete?: () => void;
  agencyProfile: AgencyProfile;
  pipelines?: Pipeline[];
  checklistTemplates?: ChecklistTemplate[];
  agents?: string[];
  featureFlags?: FeatureFlags;
  locationId?: string | null;
  ghlToken?: string | null;
}

export default function ItineraryDetailWrapper(props: Props) {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'invoices'>('itinerary');

  return (
    <div>
      {/* Mini tab bar that adds Invoices as a tab alongside the itinerary */}
      {activeTab === 'invoices' ? (
        <div className="space-y-4">
          {/* Compact header with back to itinerary */}
          <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center px-4 py-2">
              <button onClick={() => setActiveTab('itinerary')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: GHL.muted }}>
                <Icon n="back" c="w-3.5 h-3.5" /> {props.itin.title}
              </button>
              <span className="mx-2 text-xs" style={{ color: GHL.border }}>|</span>
              <span className="text-xs font-semibold" style={{ color: GHL.accent }}>Invoices & Payments</span>
            </div>
          </div>
          <InvoicesTab itin={props.itin} agencyProfile={props.agencyProfile} locationId={props.locationId} ghlToken={props.ghlToken} />
        </div>
      ) : (
        <div>
          <ItineraryDetail {...props as any} />
          {/* Invoices tab button - appears after the tab bar area, anchored at bottom */}
          <div className="mt-3">
            <button onClick={() => setActiveTab('invoices')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:shadow-sm" style={{ borderColor: GHL.accent + '40', color: GHL.accent, background: GHL.accentLight + '20' }}>
              <Icon n="dollar" c="w-4 h-4" /> Invoices & Payments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
