'use client';

import { useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import { GHL } from '@/lib/constants';
import type { Itinerary, Passenger } from '@/lib/types';

interface HeaderProps {
  page: string;
  pageTitle: string;
  globalSearch: string;
  setGlobalSearch: (v: string) => void;
  itineraries: Itinerary[];
  onSelectItinerary: (id: number) => void;
  onNavigate: (page: string) => void;
  onNewItinerary: () => void;
  onOpenSidebar: () => void;
}

export default function Header({
  pageTitle,
  globalSearch,
  setGlobalSearch,
  itineraries,
  onSelectItinerary,
  onNavigate,
  onNewItinerary,
  onOpenSidebar,
}: HeaderProps) {
  const searchResults = useMemo(() => {
    if (!globalSearch || globalSearch.length < 2) return null;
    const q = globalSearch.toLowerCase();
    const trips = itineraries.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.client.toLowerCase().includes(q) ||
        i.destination.toLowerCase().includes(q)
    );
    const travelers: Passenger[] = [];
    itineraries.forEach((i) =>
      i.passengerList.forEach((p) => {
        if (
          p.name.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
        )
          travelers.push(p);
      })
    );
    return { trips, travelers };
  }, [globalSearch, itineraries]);

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <Icon n="list" c="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 hidden md:block">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon n="search" c="w-4 h-4" />
          </span>
          <input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onBlur={() => setTimeout(() => setGlobalSearch(''), 200)}
            placeholder="Search trips, travelers..."
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          {searchResults && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 z-50 max-h-80 overflow-auto">
              {searchResults.trips.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50">
                    Itineraries
                  </p>
                  {searchResults.trips.slice(0, 5).map((i) => (
                    <div
                      key={i.id}
                      onMouseDown={() => {
                        onSelectItinerary(i.id);
                        setGlobalSearch('');
                      }}
                      className="px-4 py-2.5 hover:bg-teal-50 cursor-pointer text-sm"
                    >
                      <p className="font-medium text-gray-900">{i.title}</p>
                      <p className="text-xs text-gray-400">
                        {i.client} · {i.destination}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.travelers.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50">
                    Travelers
                  </p>
                  {searchResults.travelers.slice(0, 5).map((p) => (
                    <div
                      key={p.name}
                      onMouseDown={() => {
                        onNavigate('travelers');
                        setGlobalSearch('');
                      }}
                      className="px-4 py-2.5 hover:bg-teal-50 cursor-pointer text-sm"
                    >
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.email} · {p.nationality}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.trips.length === 0 &&
                searchResults.travelers.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">
                    No results found
                  </p>
                )}
            </div>
          )}
        </div>

        {/* New Itinerary Button */}
        <button
          onClick={onNewItinerary}
          className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: GHL.accent }}
        >
          <Icon n="plus" c="w-4 h-4" />
          <span className="hidden sm:inline">New Itinerary</span>
        </button>
      </div>
    </header>
  );
}
