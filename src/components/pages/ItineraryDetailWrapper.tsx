'use client';

import { useState, useEffect, useRef } from 'react';
import ItineraryDetail from './ItineraryDetail';
import InvoicesTab from './InvoicesTab';
import { Icon } from '@/components/ui';
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
.itin-compact .px-6.py-5{padding:10px 16px!important}
.itin-compact h2.text-xl{font-size:15px!important;line-height:1.2!important}
.itin-compact .grid.border-t>div{padding:5px 8px!important}
.itin-compact .grid.border-t .text-\\[10px\\]{font-size:7px!important}
.itin-compact .grid.border-t .font-bold.text-sm{font-size:11px!important}
.itin-compact .flex.gap-0.overflow-x-auto{padding:1px 4px!important}
.itin-compact .flex.gap-0.overflow-x-auto button{padding:4px 9px!important;font-size:10px!important}
.itin-compact .rounded-xl.border.p-6.shadow-sm{padding:12px!important}
.itin-compact .rounded-xl.border.p-5.shadow-sm{padding:10px!important}
.itin-compact .text-sm.font-bold.uppercase.tracking-wider{font-size:10px!important;margin-bottom:8px!important}
.itin-compact .grid.grid-cols-2.md\\:grid-cols-4.gap-4{gap:6px!important}
.itin-compact .grid.grid-cols-2.md\\:grid-cols-4.gap-4 .text-\\[10px\\]{font-size:8px!important}
.itin-compact .grid.grid-cols-2.md\\:grid-cols-4.gap-4 .font-semibold{font-size:12px!important}
.itin-compact .grid.grid-cols-1.lg\\:grid-cols-3.gap-5{gap:8px!important}
.itin-compact .lg\\:col-span-2.space-y-4>*+*{margin-top:6px!important}
/* Compact client contact section - inline instead of stacked */
.itin-compact [class*="CLIENT CONTACT"],.itin-compact div:has(>p:first-child) {  }
.itin-compact .space-y-3>div>.grid.grid-cols-1.md\\:grid-cols-2{gap:4px!important}
.itin-compact .space-y-3>div>.grid.grid-cols-1.md\\:grid-cols-2 input{padding:4px 8px!important;font-size:11px!important}
.itin-compact .space-y-3>div label{font-size:9px!important}
.itin-compact .space-y-3 .text-sm.font-bold{font-size:10px!important}
/* Compact VIP badge */
.itin-compact .bg-gradient-to-r.from-amber-50{padding:6px 10px!important;margin-bottom:4px!important}
.itin-compact .bg-gradient-to-r.from-amber-50 .text-lg{font-size:12px!important}
.itin-compact .bg-gradient-to-r.from-amber-50 .text-sm{font-size:10px!important}
.itin-compact .bg-gradient-to-r.from-amber-50 .text-xs{font-size:9px!important}
.itin-compact .bg-gradient-to-r.from-amber-50 .w-10{width:28px!important;height:28px!important}
/* Compact financial summary sidebar */
.itin-compact .bg-gradient-to-br{padding:10px!important}
.itin-compact .bg-gradient-to-br .text-sm{font-size:10px!important}
.itin-compact .bg-gradient-to-br .text-lg{font-size:13px!important}
/* Compact component list */
.itin-compact .space-y-1\\.5>div{padding:4px 8px!important}
.itin-compact .space-y-1\\.5>div .text-sm{font-size:11px!important}
`;

export default function ItineraryDetailWrapper(props: Props) {
  const [overrideTab, setOverrideTab] = useState<'none' | 'invoices'>('none');
  const ref = useRef<HTMLDivElement>(null);

  // Inject Invoices tab + hide Financials + add GHL Conversations button
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

      // Hide Financials tab
      tabBar.querySelectorAll('button').forEach(btn => {
        if ((btn.textContent?.trim() || '') === 'Financials') (btn as HTMLElement).style.display = 'none';
      });

      // Inject Invoices tab
      if (tabBar.querySelector('[data-invoice-tab]')) {
        const ex = tabBar.querySelector('[data-invoice-tab]') as HTMLElement;
        ex.style.color = overrideTab === 'invoices' ? GHL.accent : GHL.muted;
        ex.style.background = overrideTab === 'invoices' ? GHL.accentLight : 'transparent';
        ex.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
      } else {
        const btn = document.createElement('button');
        btn.setAttribute('data-invoice-tab', 'true');
        btn.className = 'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap mx-0.5';
        btn.style.color = overrideTab === 'invoices' ? GHL.accent : GHL.muted;
        btn.style.background = overrideTab === 'invoices' ? GHL.accentLight : 'transparent';
        btn.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg><span>Invoices</span>';
        btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); setOverrideTab(p => p === 'invoices' ? 'none' : 'invoices'); };
        tabBar.appendChild(btn);
      }

      // Inject GHL Conversations button in the header area (next to edit/copy/delete buttons)
      const headerBtns = c.querySelector('.flex.items-center.gap-1\\.5');
      if (headerBtns && !headerBtns.querySelector('[data-convo-btn]')) {
        const convoBtn = document.createElement('button');
        convoBtn.setAttribute('data-convo-btn', 'true');
        convoBtn.className = 'p-2 rounded-lg border hover:bg-blue-50 transition-colors';
        convoBtn.style.borderColor = GHL.border;
        convoBtn.style.color = GHL.accent;
        convoBtn.title = 'GHL Conversations';
        convoBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
        convoBtn.onclick = () => {
          // Open GHL conversations for this contact
          const contactName = encodeURIComponent(props.itin.client || '');
          const ghlUrl = props.locationId
            ? `https://app.gohighlevel.com/v2/location/${props.locationId}/conversations?query=${contactName}`
            : `https://app.gohighlevel.com/conversations?query=${contactName}`;
          window.open(ghlUrl, '_blank');
        };
        headerBtns.insertBefore(convoBtn, headerBtns.firstChild);
      }
    };
    const t = setTimeout(inject, 100);
    const obs = new MutationObserver(() => setTimeout(inject, 50));
    obs.observe(ref.current, { childList: true, subtree: true });
    return () => { clearTimeout(t); obs.disconnect(); };
  }, [overrideTab, props.itin.client, props.locationId]);

  // Clear override when clicking native tabs
  useEffect(() => {
    if (!ref.current || overrideTab === 'none') return;
    const h = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest('button') && !t.closest('[data-invoice-tab]') && t.closest('.flex.gap-0.overflow-x-auto')) setOverrideTab('none');
    };
    ref.current.addEventListener('click', h, true);
    return () => ref.current?.removeEventListener('click', h, true);
  }, [overrideTab]);

  // Hide/show native tab content
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
