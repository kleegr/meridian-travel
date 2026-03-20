'use client';

import type { Itinerary, AgencyProfile } from '@/lib/types';

// These elements use position:fixed in print CSS
// so they repeat on every printed page
export function PrintPageHeader({ itin, agency }: { itin: Itinerary; agency: AgencyProfile }) {
  return (
    <div className="print-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <span style={{ fontWeight: 600, color: '#64748b' }}>{itin.title}</span>
      <span style={{ color: '#94a3b8' }}>{agency.name}</span>
    </div>
  );
}

export function PrintPageFooter({ itin, agency }: { itin: Itinerary; agency: AgencyProfile }) {
  return (
    <div className="print-page-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <span style={{ fontWeight: 700, color: '#374151' }}>{agency.name}</span>
        {agency.phone && <span style={{ color: '#6b7280' }}>{agency.phone}</span>}
        {agency.email && <span style={{ color: '#6b7280' }}>{agency.email}</span>}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <span style={{ color: '#6b7280' }}>Advisor: {itin.agent}</span>
        <span style={{ color: '#94a3b8' }}>Prepared for {itin.client}</span>
      </div>
    </div>
  );
}
