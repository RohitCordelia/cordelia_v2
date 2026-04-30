// Deterministic proactive-suggestions engine.
//
// Returns a short list of contextual suggestion chips based on:
//   1. Page type (search / itinerary / cabin-select)
//   2. Live page context (results count, offers, shore excursions, cabin selection state)
//   3. Last user message (suppress redundant suggestions)
//
// All suggestions come from fixed allowlists — no LLM involvement.
// Max 3 chips returned. Rendered above the chat input when the user is idle.

import type { BotPageContext } from './types';

// ── Public type ──────────────────────────────────────────────────────────────

export interface Suggestion {
    label: string;
    query: string;
}

// ── Allowlists ───────────────────────────────────────────────────────────────

const SEARCH_EMPTY: Suggestion[] = [
    { label: 'Find a cruise', query: 'Help me find a cruise' },
    { label: 'What destinations?', query: 'What destinations are available?' },
    { label: 'Weekend getaway', query: 'Show me short weekend cruises' },
];

const SEARCH_WITH_RESULTS: Suggestion[] = [
    { label: 'Cheapest option', query: 'Which is the cheapest cruise?' },
    { label: 'View details', query: 'Show me details of the first cruise' },
    { label: 'Compare options', query: 'Compare these cruise options for me' },
];

const ITINERARY_BOOK: Suggestion = { label: 'Book this cruise', query: 'I want to book this cruise' };
const ITINERARY_INCLUDED: Suggestion = { label: "What's included?", query: "What's included in this cruise?" };
const ITINERARY_EXCURSIONS: Suggestion = { label: 'Shore excursions', query: 'Tell me about the shore excursions' };
const ITINERARY_OFFERS: Suggestion = { label: 'Current offers', query: 'What offers are available on this cruise?' };

const CABIN_NO_SELECTION: Suggestion[] = [
    { label: 'Help me choose', query: 'Help me choose the right cabin' },
    { label: 'Cabin differences', query: "What's the difference between cabin types?" },
    { label: 'Best value', query: 'Which cabin is the best value?' },
];

const CABIN_HAS_SELECTION: Suggestion[] = [
    { label: 'Change selection', query: 'I want to change my cabin selection' },
    { label: 'Add more guests', query: 'I want to add more guests' },
    { label: 'Cabin differences', query: "What's the difference between cabin types?" },
];

// ── Engine ───────────────────────────────────────────────────────────────────

const MAX_SUGGESTIONS = 3;

export function getSuggestions(
    pageContext?: BotPageContext,
    lastUserMessage?: string,
): Suggestion[] {
    let candidates: Suggestion[];

    if (!pageContext) {
        candidates = SEARCH_EMPTY;
    } else {
        switch (pageContext.pageType) {
            case 'search': {
                const hasResults = pageContext.results.itineraries.length > 0;
                candidates = hasResults ? SEARCH_WITH_RESULTS : SEARCH_EMPTY;
                break;
            }
            case 'itinerary': {
                candidates = [ITINERARY_BOOK, ITINERARY_INCLUDED];
                if (pageContext.itinerary?.has_shore_excursions) {
                    candidates.push(ITINERARY_EXCURSIONS);
                }
                if (pageContext.offers?.available?.length) {
                    candidates.push(ITINERARY_OFFERS);
                }
                break;
            }
            case 'cabin-select': {
                const hasSelection = pageContext.cabins.some(c => c.selected_rooms?.length);
                candidates = hasSelection ? CABIN_HAS_SELECTION : CABIN_NO_SELECTION;
                break;
            }
            default:
                candidates = SEARCH_EMPTY;
        }
    }

    // Suppress suggestions that overlap heavily with the last user message
    if (lastUserMessage) {
        const lower = lastUserMessage.toLowerCase();
        candidates = candidates.filter(s => {
            const words = s.label.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            const overlap = words.filter(w => lower.includes(w)).length;
            return overlap < 2;
        });
    }

    return candidates.slice(0, MAX_SUGGESTIONS);
}
