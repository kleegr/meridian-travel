// This wrapper adds featureFlags support to ItineraryDetail
// It filters tabs and controls stats bar visibility based on feature flags
import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from '@/lib/types';

// Tab-to-flag mapping
export const TAB_FLAG_MAP: Record<string, keyof FeatureFlags> = {
  destinations: 'destinationInfoEnabled',
  suggestions: 'aiSuggestionsEnabled',
  financials: 'financialsTabEnabled',
  blast: 'blastRadiusEnabled',
  print: 'shareableTripPageEnabled',
  map: 'mapViewEnabled',
};

export function filterTabs(tabs: { id: string; label: string; icon: string; count?: number }[], flags: FeatureFlags) {
  return tabs.filter(t => {
    const flagKey = TAB_FLAG_MAP[t.id];
    if (!flagKey) return true; // No flag = always show
    return (flags as any)[flagKey] !== false;
  });
}

export function shouldShowStatsBar(flags: FeatureFlags): boolean {
  return flags.showStatsBar !== false;
}
