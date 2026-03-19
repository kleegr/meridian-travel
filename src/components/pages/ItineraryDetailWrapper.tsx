'use client';

import { useState, useEffect, useRef } from 'react';
import ItineraryDetail from './ItineraryDetail';
import InvoicesTab from './InvoicesTab';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { calcFin, fmt } from '@/lib/utils';
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
  const [overrideTab, setOverrideTab] = useState<'none' | 'invoices'>('none');
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject the Invoices tab button into the tab bar after it renders
  useEffect(() => {
    if (!containerRef.current) return;
    const injectTab = () => {
      const container = containerRef.current;
      if (!container) return;
      // Find the tab bar - it's the second rounded-xl card with flex items
      const tabBars = container.querySelectorAll('.bg-white.rounded-xl.border.shadow-sm');
      let tabBar: Element | null = null;
      tabBars.forEach(el => {
        const inner = el.querySelector('.flex.gap-0.overflow-x-auto');
        if (inner) tabBar = inner;
      });
      if (!tabBar) return;
      // Check if we already injected
      if (tabBar.querySelector('[data-invoice-tab]')) return;
      // Create the Invoices tab button
      const btn = document.createElement('button');
      btn.setAttribute('data-invoice-tab', 'true');
      btn.className = 'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap mx-0.5';
      btn.style.color = overrideTab === 'invoices' ? GHL.accent : (GHL.muted || '#6b7280');
      btn.style.background = overrideTab === 'invoices' ? (GHL.accentLight || '#eff6ff') : 'transparent';
      btn.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg><span>Invoices</span>';
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOverrideTab(prev => prev === 'invoices' ? 'none' : 'invoices');
      };
      tabBar.appendChild(btn);
    };
    // Run after render and on updates
    const timer = setTimeout(injectTab, 100);
    const observer = new MutationObserver(() => setTimeout(injectTab, 50));
    observer.observe(containerRef.current, { childList: true, subtree: true });
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [overrideTab]);

  // When user clicks a native tab, clear our override
  useEffect(() => {
    if (!containerRef.current || overrideTab === 'none') return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      // If they clicked a tab that's NOT our injected one, clear override
      if (target.closest('button') && !target.closest('[data-invoice-tab]')) {
        const tabBar = target.closest('.flex.gap-0.overflow-x-auto');
        if (tabBar) setOverrideTab('none');
      }
    };
    containerRef.current.addEventListener('click', handler, true);
    return () => containerRef.current?.removeEventListener('click', handler, true);
  }, [overrideTab]);

  return (
    <div ref={containerRef}>
      {/* Always render ItineraryDetail but hide tab content when showing invoices */}
      <div style={{ display: overrideTab === 'none' ? 'block' : 'block' }}>
        <ItineraryDetail {...props as any} />
      </div>
      {/* Overlay invoices content when that tab is active */}
      {overrideTab === 'invoices' && (
        <div className="-mt-4">
          <InvoicesTab itin={props.itin} agencyProfile={props.agencyProfile} locationId={props.locationId} ghlToken={props.ghlToken} />
        </div>
      )}
    </div>
  );
}
