'use client';

// Wrapper that adds Invoices tab to ItineraryDetail
// ItineraryDetail is 40KB and can't be easily modified via API
// This wrapper adds the tab outside the main component

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
  const [showInvoices, setShowInvoices] = useState(false);

  if (showInvoices) {
    return (
      <div className="space-y-5">
        {/* Back to itinerary header */}
        <div className="bg-white rounded-xl border shadow-sm p-4" style={{ borderColor: GHL.border }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowInvoices(false)} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: GHL.muted }}>
              <Icon n="back" c="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold" style={{ color: GHL.text }}>{props.itin.title}</h2>
              <p className="text-xs" style={{ color: GHL.muted }}>Invoices & Payments</p>
            </div>
            <button onClick={() => setShowInvoices(false)} className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }}>
              Back to Itinerary
            </button>
          </div>
        </div>
        <InvoicesTab itin={props.itin} agencyProfile={props.agencyProfile} locationId={props.locationId} ghlToken={props.ghlToken} />
      </div>
    );
  }

  return (
    <div>
      {/* Invoice quick-access button - floats above ItineraryDetail */}
      <div className="flex justify-end mb-2">
        <button onClick={() => setShowInvoices(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold hover:bg-blue-50 transition-colors" style={{ borderColor: GHL.accent + '40', color: GHL.accent, background: GHL.accentLight + '40' }}>
          <Icon n="dollar" c="w-4 h-4" />
          Invoices & Payments
        </button>
      </div>
      <ItineraryDetail {...props as any} />
    </div>
  );
}
