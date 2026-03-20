# Patch instructions for ItineraryDetail.tsx

## 1. Add import at the top (after BlastRadius import):
import WeatherForecast from './WeatherForecast';

## 2. In the bookings tab, add before the first Accordion:
<WeatherForecast itin={itin} />

## 3. In the overview tab right column, after the Financial Summary gradient box:
<WeatherForecast itin={itin} />

These changes wire the weather forecast into the admin view.
