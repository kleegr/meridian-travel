# Meridian Travel — Feature Roadmap

## Priority 1 — Building Now
These are being implemented in the current sprint.

### 1. Reusable Package Templates (Settings-enabled)
- Create itinerary packages/templates that agents can reuse
- Settings toggle to enable/disable packages feature
- Package = saved itinerary template with flights, hotels, activities pre-filled
- Associate any itinerary with a package
- "Create from Package" option in New Itinerary

### 2. Smart Checklist Auto-Items
- When pax count is set (e.g. 5), auto-add "Add Traveler" with 5 sub-items
- Auto-add: "Add Flights", "Add Hotels", "Add Transportation"
- Sub-items can't be marked done until actually added in the system
- Dynamic — adjusts when pax count changes

### 3. Flight Type Organization
- Connection flights grouped under one flight detail
- Flight type: Round Trip, One Way, One Way Connection, Multi-City
- Return flight linked to outbound flight
- Connection segments shown as sub-items under main flight

### 4. Hotel Booking PDF Upload + Auto-fill
- Upload hotel booking confirmation (PDF/image)
- AI extracts: hotel name, dates, room type, confirmation #, price
- Triggers Google Places lookup for photos automatically
- Hotel Information API integration for availability

### 5. Map View per Itinerary
- Full Google Maps embedded in each itinerary
- Shows all destinations, hotels, activities as pins
- Route lines between stops
- Day-by-day color coding

---

## Priority 2 — Next Sprint

### 6. Marketing Graphics Generator (AI-powered)
- Create promotional graphics for packages
- Uses agency logo, colors, brand identity
- AI generates copy + layout suggestions
- Export as image for social media
- Settings toggle to enable/disable
- Templates: Instagram post, Facebook cover, Story, Flyer

### 7. Shareable Trip Page (not just PDF)
- Beautiful web page per itinerary (shareable link)
- Expandable days, maps, media, hotel sections
- Trip summary with photos
- Mobile-responsive
- Optional password protection

### 8. Drag-to-Reorder Days
- Reorder days in itinerary by dragging
- All bookings within a day move together
- Frictionless — agents constantly reshuffle

### 9. In-System Google Maps Search
- Standalone maps page in navigation
- Search hotels, restaurants, attractions
- Pin locations directly to itineraries
- Agent research tool

### 10. AI Destination Suggestions
- Based on itinerary location, suggest nearby attractions
- Based on trip type (honeymoon, family, adventure)
- "What else to visit" recommendations
- Integrates with preferences set in system

---

## Priority 3 — Future

### 11. Trip Graph Builder (Figma for Travel)
- Visual graph: city nodes → hotel nodes → transfer nodes → activity nodes
- Drag to rearrange entire trip structure
- Dependency lines between connected items
- Swap hotels, remove transfers, add stops — structure stays intact

### 12. Blast Radius View
- When changing one item, show all affected items
- Move a hotel → highlights: affected transfers, drive times, attraction sequence
- Check-in/check-out conflicts flagged
- Day pacing issues shown

### 13. Automations Engine
- Automation button on front page
- Rules: IF [trigger] THEN [action]
- Example: Flight delayed → move to "Attention Needed" stage
- Example: All travelers added → mark checklist item done
- Example: 30 days before departure → send reminder
- Visual automation builder

### 14. Hotels Information API
- Real hotel availability search
- Room types with photos from booking APIs
- Price comparison across providers
- Direct booking integration (Booking.com, Expedia)

---

## Architecture Notes
- All features toggle-able via Settings
- GHL handles payments/deposits — we handle itinerary financials only
- No database yet — all in-memory React state
- Vercel deployment with auto-deploy from GitHub
- API routes: /api/ai, /api/flight, /api/places
