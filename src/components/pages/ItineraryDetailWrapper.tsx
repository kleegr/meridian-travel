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

// This wrapper injects the Invoices tab into the ItineraryDetail tab system
// by intercepting the tab state and adding our own tab
export default function ItineraryDetailWrapper(props: Props) {
  const [showInvoices, setShowInvoices] = useState(false);

  if (showInvoices) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: GHL.border }}>
          <div className="flex items-center px-4 py-2">
            <button onClick={() => setShowInvoices(false)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50" style={{ color: GHL.muted }}>
              <Icon n="back" c="w-3.5 h-3.5" /> {props.itin.title}
            </button>
            <span className="mx-2 text-xs" style={{ color: GHL.border }}>|</span>
            <span className="text-xs font-semibold" style={{ color: GHL.accent }}>Invoices & Payments</span>
          </div>
        </div>
        <InvoicesTab itin={props.itin} agencyProfile={props.agencyProfile} locationId={props.locationId} ghlToken={props.ghlToken} />
      </div>
    );
  }

  // Render ItineraryDetail normally but add Invoices as a tab button after the tab bar
  return (
    <div className="itinerary-detail-with-invoices">
      <ItineraryDetail {...props as any} />
      {/* Inject Invoices tab button via CSS to appear inline with other tabs */}
      <style>{`
        .itinerary-detail-with-invoices > div > div:nth-child(2) > div {
          position: relative;
        }
      `}</style>
      {/* Clickable invoices tab that visually appears as part of the tab bar */}
      <div className="-mt-[3.25rem] ml-auto mr-3 relative z-10 float-right">
        <button onClick={() => setShowInvoices(true)} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap" style={{ color: GHL.accent, background: GHL.accentLight + '60' }}>
          <Icon n="dollar" c="w-3.5 h-3.5" /> Invoices
        </button>
      </div>
      <div className="clear-both" />
    </div>
  );
}
