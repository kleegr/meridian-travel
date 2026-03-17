'use client';

// This wrapper receives featureFlags from page.tsx and passes them through
// Since ItineraryDetail is 40KB, we inject feature flag behavior here
import ItineraryDetail from './ItineraryDetail';
import type { Itinerary, AgencyProfile, Pipeline, ChecklistTemplate, FeatureFlags } from '@/lib/types';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/types';

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
}

export default function ItineraryDetailWrapper(props: Props) {
  // featureFlags is passed but ItineraryDetail's Props doesn't type it yet
  // TypeScript will still pass it through to the component via spread
  // The flags will be accessible as (props as any).featureFlags inside ItineraryDetail
  return <ItineraryDetail {...props as any} />;
}
