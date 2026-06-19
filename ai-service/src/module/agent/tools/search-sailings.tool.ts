import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { FilterStateService, FacetUpdates, FilterState } from '../filter-state.service';

// ── Offer parser ─────────────────────────────────────────────────────────────
// offers_available is string[] with either plain offer names ("Kids Sail Free*")
// or Ruby hash syntax ('{"offer"=>"Kids Sail Free*", "description"=>"..."}').
// Returns only non-empty real offer names.

function parseRealOffers(offersRaw: any): string[] {
  if (!Array.isArray(offersRaw) || offersRaw.length === 0) return [];
  const result: string[] = [];
  for (const o of offersRaw) {
    if (typeof o !== 'string') continue;
    const trimmed = o.trim();
    if (!trimmed) continue;
    if (trimmed.includes('=>')) {
      // Ruby hash: {"offer"=>"Kids Sail Free*", "description"=>"..."}
      const m = trimmed.match(/"offer"\s*=>\s*"([^"]+)"/);
      if (m?.[1]?.trim()) result.push(m[1].trim());
    } else {
      result.push(trimmed);
    }
  }
  return result;
}

// ── Summary text builder ─────────────────────────────────────────────────────

function buildSummary(
  state: FilterState,
  count: number,
  fallback: boolean,
  fallbackCount: number,
): string {
  const parts: string[] = [];

  if (state.destination.length)
    parts.push(state.destination.join(' & '));
  if (state.origin.length)
    parts.push(`from ${state.origin.join(' & ')}`);
  if (state.monthYear.length) {
    const months = state.monthYear.map(my => {
      const [mm, yyyy] = my.split('-');
      const month = new Date(parseInt(yyyy), parseInt(mm) - 1)
        .toLocaleString('en', { month: 'short' });
      return `${month} ${yyyy}`;
    });
    parts.push(`in ${months.join(' & ')}`);
  }
  if (state.nightCount.length) {
    const n = state.nightCount;
    parts.push(`${n.join('/')} night${n.length > 1 || n[0] !== 1 ? 's' : ''}`);
  }
  if (state.tripType.length)
    parts.push(`(${state.tripType.join('/')})`);

  const filterLabel = parts.length ? ` for ${parts.join(', ')}` : '';

  if (fallback) {
    const exactLabel = parts.length ? parts.join(', ') : 'those filters';
    return `No sailings found for ${exactLabel} — showing all ${state.destination.join(' & ')} sailings (${fallbackCount} found)`;
  }

  if (count === 0) return `No sailings found${filterLabel}`;
  return `${count} sailing${count !== 1 ? 's' : ''} found${filterLabel}`;
}

// ── Numbered result list for LLM history ────────────────────────────────────
// This goes into the tool-result text so the LLM can answer sort/comparison
// questions ("cheapest", "compare 1st and 3rd") without re-calling the tool.

function buildResultList(summary: string, itineraries: any[]): string {
  if (itineraries.length === 0) return summary;
  const lines = itineraries.map((it, i) => {
    const ports: string = Array.isArray(it.ports)
      ? it.ports.map((p: any) => (typeof p === 'string' ? p : p?.name ?? '')).join(' → ')
      : it.alias ?? '';
    const nights   = it.night_count ?? it.nights ?? '?';
    const price    = it.starting_fare != null ? `₹${it.starting_fare.toLocaleString('en-IN')}` : 'N/A';
    const date     = it.start_time ? new Date(it.start_time).toDateString() : '';
    const ship     = it.ship_name ?? it.ship?.name ?? '';
    const trip      = it.trip_type ? ` [${it.trip_type}]` : '';
    const category  = it.type ?? it.cruise_type ?? '';          // DOMESTIC / INTERNATIONAL
    const catLabel  = category ? ` [${category}]` : '';
    const offerNames = parseRealOffers(it.offers_available);
    const offers    = offerNames.length > 0 ? ` [offers: ${offerNames.join(', ')}]` : '';
    const shore     = it.shore_excursion_available ? ' [shore excursion]' : '';
    const id = it.itinerary_id ?? '';
    return `${i + 1}. [id:${id}] ${ports} | ${nights}N | ${price} | ${date} | ${ship}${trip}${catLabel}${offers}${shore}`;
  });
  return `${summary}\n${lines.join('\n')}`;
}

// ── Tool factory ─────────────────────────────────────────────────────────────

export function createSearchSailingsTool(
  apiBaseUrl: string,
  filterStateService: FilterStateService,
  sessionId: string,
) {
  return createTool({
    id: 'search_sailings',
    description:
      'Search for available cruise itineraries matching user preferences. Use when user asks about available cruises, prices, dates, destinations, or ships.',
    inputSchema: z.object({
      destination: z.array(z.string()).optional().describe(
        'Destination port names. Send ALL values you want the filter to have — include previous destinations too if the user said "also". e.g. ["Goa"] or ["Lakshadweep", "Kochi"]',
      ),
      origin: z.array(z.string()).optional().describe(
        'Departure port names, e.g. ["Mumbai", "Chennai"]',
      ),
      monthYear: z.array(z.string()).optional().describe(
        'Month filters — ONLY include if the user explicitly mentions a month. Format: MM-YYYY zero-padded, e.g. ["01-2027"]. Send ALL months if the user wants multiple.',
      ),
      nightCount: z.array(z.number()).optional().describe(
        'Number of nights, e.g. [3] or [2, 3] if user wants either.',
      ),
      tripType: z.array(z.string()).optional().describe(
        'Trip type, e.g. ["one_way"] or ["round"]',
      ),
      startingPrice: z.number().optional().describe(
        'ONLY when user states a minimum budget: "above ₹20000", "at least 15k". NEVER use to find cheapest/most expensive — answer those from history.',
      ),
      maximumPrice: z.number().optional().describe(
        'ONLY when user states a maximum budget: "under ₹10000", "below 20k", "budget under 15k". NEVER use to find cheapest/most expensive — answer those from history.',
      ),
    }),

    execute: async ({ context }) => {
      // 1. Build update from context (only include facets that were provided)
      const updates: FacetUpdates = {};
      if (context.destination !== undefined) updates.destination = context.destination;
      if (context.origin      !== undefined) updates.origin      = context.origin;
      if (context.monthYear   !== undefined) updates.monthYear   = context.monthYear;
      if (context.nightCount  !== undefined) updates.nightCount  = context.nightCount;
      if (context.tripType    !== undefined) updates.tripType    = context.tripType;

      // 2. Merge into session filter state
      const state = filterStateService.merge(sessionId, updates);

      // 3. Build API payload from merged state
      const search = async (body: Record<string, any>): Promise<any[]> => {
        console.log('roh search itinerary', body);
        const { data } = await axios.post(
          `${apiBaseUrl}/b2c/itinerary/upcoming?limit=10&page=1`,
          body,
          { headers: { 'Content-Type': 'application/json' } },
        );
        return data?.result?.itineraries ?? [];
      };

      const fullPayload: Record<string, any> = {};
      if (state.destination.length)                fullPayload.destination   = state.destination;
      if (state.origin.length)                     fullPayload.origin        = state.origin;
      if (state.monthYear.length)                  fullPayload.monthYear     = state.monthYear;
      if (state.nightCount.length)                 fullPayload.nightCount    = state.nightCount;
      if (state.tripType.length)                   fullPayload.tripType      = state.tripType;
      if (context.startingPrice !== undefined)     fullPayload.startingPrice = context.startingPrice;
      if (context.maximumPrice  !== undefined)     fullPayload.maximumPrice  = context.maximumPrice;

      // 4. Primary search
      let itineraries = await search(fullPayload);
      let fallback = false;
      let fallbackCount = 0;

      // 5. Fallback chain when 0 results — progressively relax constraints:
      //    Stage 1: strip monthYear (most common over-constraint)
      //    Stage 2: strip all facets except destination (show "what IS available")
      if (itineraries.length === 0) {
        const hasMonth   = state.monthYear.length > 0;
        const hasOthers  = state.nightCount.length > 0 || state.origin.length > 0 || state.tripType.length > 0;

        if (hasMonth) {
          const noMonthPayload: Record<string, any> = { ...fullPayload };
          delete noMonthPayload.monthYear;
          console.log('roh fallback (no month)', noMonthPayload);
          const fb1 = await search(noMonthPayload);
          if (fb1.length > 0) {
            fallback = true;
            fallbackCount = fb1.length;
            itineraries = fb1;
          }
        }

        // Still 0 — try destination-only
        if (itineraries.length === 0 && (hasMonth || hasOthers) && state.destination.length > 0) {
          const destOnlyPayload: Record<string, any> = { destination: state.destination };
          console.log('roh fallback (destination only)', destOnlyPayload);
          const fb2 = await search(destOnlyPayload);
          if (fb2.length > 0) {
            fallback = true;
            fallbackCount = fb2.length;
            itineraries = fb2;
          }
        }
      }

      // 6. Summary for UI carousel + numbered list for LLM history
      // Sort cheapest-first so position matches "1st", "2nd", "cheapest" references
      itineraries.sort((a, b) => (a.starting_fare ?? 0) - (b.starting_fare ?? 0));
      const summary    = buildSummary(state, itineraries.length, fallback, fallbackCount);
      const resultList = buildResultList(summary, itineraries);

      return { itineraries, summary, resultList, fallback, searchedState: state };
    },
  });
}
