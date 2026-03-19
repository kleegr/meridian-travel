'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [overrideTab, setOverrideTab] = useState<'none' | 'invoices'>('none');
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject the Invoices tab and hide the Financials tab
  useEffect(() => {
    if (!containerRef.current) return;
    const injectTab = () => {
      const container = containerRef.current;
      if (!container) return;
      // Find the tab bar
      const tabBars = container.querySelectorAll('.bg-white.rounded-xl.border.shadow-sm');
      let tabBar: Element | null = null;
      tabBars.forEach(el => {
        const inner = el.querySelector('.flex.gap-0.overflow-x-auto');
        if (inner) tabBar = inner;
      });
      if (!tabBar) return;

      // Hide the native Financials tab button
      const tabButtons = tabBar.querySelectorAll('button');
      tabButtons.forEach(btn => {
        const text = btn.textContent?.trim() || '';
        if (text === 'Financials') {
          (btn as HTMLElement).style.display = 'none';
        }
      });

      // Check if we already injected
      if (tabBar.querySelector('[data-invoice-tab]')) {
        // Update style if needed
        const existing = tabBar.querySelector('[data-invoice-tab]') as HTMLElement;
        if (existing) {
          existing.style.color = overrideTab === 'invoices' ? (GHL.accent || '#1e40af') : (GHL.muted || '#6b7280');
          existing.style.background = overrideTab === 'invoices' ? (GHL.accentLight || '#eff6ff') : 'transparent';
          existing.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
        }
        return;
      }

      // Create Invoices tab
      const btn = document.createElement('button');
      btn.setAttribute('data-invoice-tab', 'true');
      btn.className = 'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap mx-0.5';
      btn.style.color = overrideTab === 'invoices' ? (GHL.accent || '#1e40af') : (GHL.muted || '#6b7280');
      btn.style.background = overrideTab === 'invoices' ? (GHL.accentLight || '#eff6ff') : 'transparent';
      btn.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg><span>Invoices</span>';
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); setOverrideTab(prev => prev === 'invoices' ? 'none' : 'invoices'); };
      tabBar.appendChild(btn);
    };
    const timer = setTimeout(injectTab, 100);
    const observer = new MutationObserver(() => setTimeout(injectTab, 50));
    observer.observe(containerRef.current, { childList: true, subtree: true });
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [overrideTab]);

  // Clear override when clicking native tabs
  useEffect(() => {
    if (!containerRef.current || overrideTab === 'none') return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') && !target.closest('[data-invoice-tab]')) {
        const tabBar = target.closest('.flex.gap-0.overflow-x-auto');
        if (tabBar) setOverrideTab('none');
      }
    };
    containerRef.current.addEventListener('click', handler, true);
    return () => containerRef.current?.removeEventListener('click', handler, true);
  }, [overrideTab]);

  // Hide native tab content when invoices is active
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    // The tab content is the 3rd+ child of the main space-y-5 div
    const mainDiv = container.querySelector('.space-y-5');
    if (!mainDiv) return;
    const children = Array.from(mainDiv.children);
    // Children: [0]=header, [1]=tab bar, [2+]=tab content
    children.forEach((child, i) => {
      if (i >= 2) {
        (child as HTMLElement).style.display = overrideTab === 'invoices' ? 'none' : '';
      }
    });
  }, [overrideTab]);

  return (
    <div ref={containerRef}>
      <ItineraryDetail {...props as any} />
      {overrideTab === 'invoices' && (
        <div className="mt-4">
          <InvoicesTab itin={props.itin} agencyProfile={props.agencyProfile} locationId={props.locationId} ghlToken={props.ghlToken} />
        </div>
      )}
    </div>
  );
}
