'use client';

import { useState, useEffect, useRef } from 'react';
import ItineraryDetail from './ItineraryDetail';
import InvoicesTab from './InvoicesTab';
import { GHL } from '@/lib/constants';
import type { Itinerary, AgencyProfile, Pipeline, ChecklistTemplate, FeatureFlags } from '@/lib/types';

interface Props {
  itin: Itinerary; onBack: () => void; onUpdate: (u: Itinerary) => void; onDelete?: () => void;
  agencyProfile: AgencyProfile; pipelines?: Pipeline[]; checklistTemplates?: ChecklistTemplate[];
  agents?: string[]; featureFlags?: FeatureFlags; locationId?: string | null; ghlToken?: string | null;
}

const COMPACT = `
.itin-compact .space-y-5>*+*{margin-top:10px!important}
.itin-compact .space-y-4>*+*{margin-top:8px!important}
.itin-compact .px-6.py-5{padding:12px 18px!important}
.itin-compact h2.text-xl{font-size:16px!important;line-height:1.3!important}
.itin-compact .grid.border-t>div{padding:6px 10px!important}
.itin-compact .grid.border-t .text-\\[10px\\]{font-size:7px!important;letter-spacing:0.05em!important}
.itin-compact .grid.border-t .font-bold.text-sm{font-size:12px!important}
.itin-compact .flex.gap-0.overflow-x-auto{padding:1px 4px!important}
.itin-compact .flex.gap-0.overflow-x-auto button{padding:5px 10px!important;font-size:10.5px!important}
.itin-compact .rounded-xl.border.p-6.shadow-sm{padding:14px!important}
.itin-compact .rounded-xl.border.p-5.shadow-sm{padding:12px!important}
.itin-compact .text-sm.font-bold.uppercase.tracking-wider{font-size:10px!important;margin-bottom:10px!important}
.itin-compact .grid.grid-cols-2.md\\:grid-cols-4.gap-4{gap:8px!important}
.itin-compact .grid.grid-cols-2.md\\:grid-cols-4.gap-4 .font-semibold{font-size:12.5px!important}
.itin-compact .grid.grid-cols-1.lg\\:grid-cols-3.gap-5{gap:10px!important}
.itin-compact .lg\\:col-span-2.space-y-4>*+*{margin-top:8px!important}
.itin-compact .space-y-4>div>.space-y-1\\.5>div{padding:6px 10px!important}
`;

export default function ItineraryDetailWrapper(props: Props) {
  const [overrideTab, setOverrideTab] = useState<'none' | 'invoices'>('none');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const inject = () => {
      const c = ref.current; if (!c) return;
      let tabBar: Element | null = null;
      c.querySelectorAll('.bg-white.rounded-xl.border.shadow-sm').forEach(el => {
        const inner = el.querySelector('.flex.gap-0.overflow-x-auto');
        if (inner) tabBar = inner;
      });
      if (!tabBar) return;
      tabBar.querySelectorAll('button').forEach(btn => {
        if ((btn.textContent?.trim() || '') === 'Financials') (btn as HTMLElement).style.display = 'none';
      });
      if (tabBar.querySelector('[data-invoice-tab]')) {
        const ex = tabBar.querySelector('[data-invoice-tab]') as HTMLElement;
        ex.style.color = overrideTab === 'invoices' ? GHL.accent : GHL.muted;
        ex.style.background = overrideTab === 'invoices' ? GHL.accentLight : 'transparent';
        ex.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
        return;
      }
      const btn = document.createElement('button');
      btn.setAttribute('data-invoice-tab', 'true');
      btn.className = 'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap mx-0.5';
      btn.style.color = overrideTab === 'invoices' ? GHL.accent : GHL.muted;
      btn.style.background = overrideTab === 'invoices' ? GHL.accentLight : 'transparent';
      btn.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg><span>Invoices</span>';
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); setOverrideTab(p => p === 'invoices' ? 'none' : 'invoices'); };
      tabBar.appendChild(btn);
    };
    const t = setTimeout(inject, 100);
    const obs = new MutationObserver(() => setTimeout(inject, 50));
    obs.observe(ref.current, { childList: true, subtree: true });
    return () => { clearTimeout(t); obs.disconnect(); };
  }, [overrideTab]);

  useEffect(() => {
    if (!ref.current || overrideTab === 'none') return;
    const h = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest('button') && !t.closest('[data-invoice-tab]') && t.closest('.flex.gap-0.overflow-x-auto')) setOverrideTab('none');
    };
    ref.current.addEventListener('click', h, true);
    return () => ref.current?.removeEventListener('click', h, true);
  }, [overrideTab]);

  useEffect(() => {
    if (!ref.current) return;
    const m = ref.current.querySelector('.space-y-5');
    if (!m) return;
    Array.from(m.children).forEach((c, i) => { if (i >= 2) (c as HTMLElement).style.display = overrideTab === 'invoices' ? 'none' : ''; });
  }, [overrideTab]);

  return (
    <div ref={ref} className="itin-compact">
      <style>{COMPACT}</style>
      <ItineraryDetail {...props as any} />
      {overrideTab === 'invoices' && <div className="mt-3"><InvoicesTab itin={props.itin} agencyProfile={props.agencyProfile} locationId={props.locationId} ghlToken={props.ghlToken} /></div>}
    </div>
  );
}
