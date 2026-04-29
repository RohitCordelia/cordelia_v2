// Search assistant — handles the cruise listing / discovery page.
//
// Scope: FAQ, destination info, cruise search, filter extraction, itinerary navigation.
// Tools: apply_cruise_filters, view_itinerary_details
//
// TO ADD a new search-only tool:
//   1. Declare it in tools.ts and add it to SEARCH_TOOLS.
//   2. Add a mapper case in mapSearchActions().
//   3. Add a fallback string in searchFallbackMessage().
//   4. Handle the new AssistantAction variant in useAssistantActions.ts.

import { PromptContext, AssistantAction, ExtractedFilters } from '../types';
import { buildSearchPrompt } from '../prompts/searchPrompt';
import { SEARCH_TOOLS } from '../tools';

// Return type is inferred — chatRouter verifies structural compatibility against AssistantConfig.
export function getSearchAssistantConfig(ctx: PromptContext) {
    return {
        systemPrompt: buildSearchPrompt(ctx),
        tools: SEARCH_TOOLS,
        mapActions: mapSearchActions,
        fallbackMessage: searchFallbackMessage,
    };
}

// ── Action mapper ────────────────────────────────────────────────────────────

function mapSearchActions(parts: any[]): AssistantAction[] {
    const actions: AssistantAction[] = [];
    for (const part of parts) {
        if (!part.functionCall) continue;
        const { name, args } = part.functionCall;
        switch (name) {
            case 'apply_cruise_filters': {
                const filters: ExtractedFilters = {
                    months: args.months || [],
                    destinations: args.destinations || [],
                    nights: args.nights || [],
                    origins: args.origins || [],
                    tripType: args.tripType || [],
                    resetAll: args.resetAll || false,
                };
                actions.push(
                    filters.resetAll
                        ? { type: 'RESET_FILTERS' }
                        : { type: 'APPLY_FILTERS', filters },
                );
                break;
            }
            case 'view_itinerary_details':
                if (args.itinerary_id) {
                    actions.push({ type: 'OPEN_ITINERARY', itineraryId: args.itinerary_id });
                }
                break;
        }
    }
    return actions;
}

// ── Fallback text ────────────────────────────────────────────────────────────

function searchFallbackMessage(actions: AssistantAction[]): string {
    for (const action of actions) {
        switch (action.type) {
            case 'APPLY_FILTERS':
                return buildFilterMessage(action.filters);
            case 'RESET_FILTERS':
                return "Sure! I've cleared all filters. You can now browse all available cruises.";
            case 'OPEN_ITINERARY':
                return 'Opening the itinerary details for you!';
        }
    }
    return "I'm sorry, I didn't understand that. Could you tell me about your cruise preferences?";
}

function buildFilterMessage(filters: ExtractedFilters): string {
    const parts: string[] = [];
    if (filters.destinations.length) parts.push(`to ${filters.destinations.join(', ')}`);
    if (filters.months.length) {
        const monthNames: Record<string, string> = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
            '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
            '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
        };
        const names = filters.months.map(d => {
            const [mm, yyyy] = d.split('-');
            return `${monthNames[mm] || mm} ${yyyy}`;
        });
        parts.push(`in ${names.join(', ')}`);
    }
    if (filters.nights.length) parts.push(`for ${filters.nights.join('/')} night(s)`);
    if (filters.origins.length) parts.push(`from ${filters.origins.join(', ')}`);
    if (filters.tripType.length) {
        const types = filters.tripType.map(t => t === 'one_way' ? 'one-way' : 'round trip');
        parts.push(`(${types.join(', ')})`);
    }
    return parts.length > 0
        ? `Searching for cruises ${parts.join(' ')}. Updating results for you!`
        : "Let me search that for you!";
}
