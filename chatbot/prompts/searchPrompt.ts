// System prompt builder for the search/discovery assistant.
//
// Included sections (all conditional):
//   identity, capabilities, itinerary list, filter rules, view-itinerary rules,
//   tone, knowledge base
//
// NEVER includes itinerary detail or cabin context — those are booking territory.
// Token budget: ~600–900 tokens depending on itinerary count and KB hit.
//
// TO ADD a new search-only section:
//   1. Export a new section function below.
//   2. Add it conditionally in buildSearchPrompt().

import { PromptContext } from '../types';
import { getGlobalKnowledgeCore, getRelevantKnowledgeCapped } from '../knowledgeBase';
import { identitySection, toneSection, globalKnowledgeCoreSection, dataSourcePrioritySection, conversationalContextSection } from './basePrompt';

// ── Signal derivation ────────────────────────────────────────────────────────

interface SearchSignals {
    hasItineraries: boolean;
    hasFilterOptions: boolean;
    hasRelevantKnowledge: boolean;
    relevantKnowledge: string;
}

function deriveSignals(ctx: PromptContext): SearchSignals {
    // When the orchestration layer flags a live-data topic, skip the heavy
    // query-matched KB section — the compact global core is still included.
    if (ctx.skipDetailedKb) {
        return {
            hasItineraries: ctx.itineraries.filter(it => it.id).length > 0,
            hasFilterOptions: ctx.availablePorts.length > 0 || ctx.availableOrigins.length > 0,
            hasRelevantKnowledge: false,
            relevantKnowledge: '',
        };
    }
    const kbQuery = ctx.recentContext ? `${ctx.userMessage} ${ctx.recentContext}` : ctx.userMessage;
    const relevantKnowledge = getRelevantKnowledgeCapped(kbQuery, 400);
    return {
        hasItineraries: ctx.itineraries.filter(it => it.id).length > 0,
        hasFilterOptions: ctx.availablePorts.length > 0 || ctx.availableOrigins.length > 0,
        hasRelevantKnowledge: relevantKnowledge.trim().length > 0,
        relevantKnowledge,
    };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    if (!dateStr) return 'Unknown date';
    const [dd, mm, yyyy] = dateStr.split('/');
    if (!dd || !mm || !yyyy) return dateStr;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
        .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Sections ─────────────────────────────────────────────────────────────────

function capabilitiesSection(signals: SearchSignals): string {
    const items: string[] = [];
    if (signals.hasFilterOptions) {
        items.push('1. **Search & Filter Cruises** — When a user wants to find or search cruises, use the apply_cruise_filters function.');
    }
    if (signals.hasItineraries) {
        items.push('2. **View Itinerary Details** — When a user wants to see full details of a specific cruise, use the view_itinerary_details function. Match the user\'s description (e.g., "first one", "the Goa cruise", "cheapest one") to the correct itinerary from the displayed list.');
    }
    items.push(`3. **Cruise Knowledge** — Answer questions about:
   - Onboard: dining, entertainment, spa, pools, kids activities, nightlife
   - Cabin types: Interior, Ocean View, Balcony, Suite — differences and recommendations
   - Dining: restaurants, buffets, specialty dining, included meals
   - Activities: live shows, casino, water sports, shore excursions, gym, kids club
   - Policies: cancellation, rescheduling, luggage, dress code, ID, pets
   - What's included vs. what's extra`);
    items.push('4. **Destination Info** — Highlights about Goa, Lakshadweep, Kochi, Sri Lanka, Dubai, etc.');
    items.push('5. **General Travel Chat** — Holidays, honeymoon planning, family trips, group bookings, celebrations at sea');
    items.push('6. **Booking Help** — How to book, payment options, group discounts, current offers');
    return `YOUR CAPABILITIES:\n${items.join('\n')}`;
}

// Compact itinerary format — ~20-25 tokens/itinerary vs ~90-100 tokens in prose.
// Format per line: #N Ship: PORT(timing)→PORT(timing) | Nn | DDMmmYYYY | ₹fare/n | OW/RT [offers]
function itineraryContextSection(ctx: PromptContext): string {
    const MONTH = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const valid = ctx.itineraries.filter(it => it.id);

    const lines = valid.map((it, i) => {
        // Compact port chain: NAME(chkHH-HH,dHH:MM) for origin, NAME(aHH:MM,dHH:MM) for stops
        const ports = it.ports?.length
            ? it.ports.map(p => {
                if (p.type === 'ORIGIN') {
                    const chk = p.embarkation_start_time && p.embarkation_end_time
                        ? `chk${p.embarkation_start_time}-${p.embarkation_end_time},` : '';
                    const dep = p.departure ? `d${p.departure}` : '';
                    const info = chk + dep;
                    return info ? `${p.name}(${info})` : p.name;
                }
                const arr = p.arrival  ? `a${p.arrival}`  : '';
                const dep = p.departure ? `d${p.departure}` : '';
                const info = [arr, dep].filter(Boolean).join(',');
                return info ? `${p.name}(${info})` : p.name;
            }).join('→')
            : `${it.origin}→${it.destination}`;

        // Compact date: 15Apr2026
        const [dd, mm, yyyy] = (it.start_date || '').split('/');
        const dateStr = dd && mm && yyyy
            ? `${parseInt(dd)}${MONTH[parseInt(mm)] || mm}${yyyy}`
            : it.start_date;

        // Compact extras: offers + discount
        const extras: string[] = [];
        if (it.offers_available?.length) extras.push(...it.offers_available);
        if (it.discount_pct) extras.push(`${Math.round(it.discount_pct * 100)}%off`);
        const extrasStr = extras.length ? ` [${extras.join(' | ')}]` : '';

        const fare = it.starting_fare ? `₹${it.starting_fare.toLocaleString('en-IN')}/n` : 'N/A';
        const type = it.trip_type === 'one_way' ? 'OW' : 'RT';

        return `#${i + 1} ${it.ship_name}: ${ports} | ${it.nights}n | ${dateStr} | ${fare} | ${type}${extrasStr}`;
    });

    // ID table stays compact: one line, space-separated
    const idTable = valid.map((it, i) => `#${i + 1}=${it.id}`).join(' ');

    return `[LIVE] ITINERARIES ON PAGE (${valid.length}):
${lines.join('\n')}

IDs (tool use only — never show to user): ${idTable}
Match user references ("first one", "13 Apr cruise", "cheapest") to #numbers above.
OFFER RULE: For questions about a specific itinerary's offers, use ONLY its offers listed above.`;
}

function filterRulesSection(ctx: PromptContext): string {
    const year = new Date().getFullYear();
    return `[LIVE] CURRENTLY AVAILABLE OPTIONS (use these, NOT the knowledge base, when the user asks what is available):
- Destinations: ${ctx.availablePorts.length ? ctx.availablePorts.join(', ') : 'none currently'}
- Departure ports: ${ctx.availableOrigins.length ? ctx.availableOrigins.join(', ') : 'none currently'}
- Months: ${ctx.availableDates.length ? ctx.availableDates.join(', ') : 'none currently'}
- Night durations: ${ctx.availableNights.length ? ctx.availableNights.join(', ') : 'none currently'}
- Trip types: One Way, Round Trip

When the user asks "which destinations are available?", "what months?", "how many nights?", etc. — answer from the list above. Do NOT list destinations from the knowledge base that are not in this list.

FILTER FUNCTION (use the exact values from the available options above):

FILTER RULES:
- Call apply_cruise_filters ONLY when the user provides at least one specific preference (destination, month, duration, origin, or trip type).
- If the user says something vague like "find a cruise", "search cruises", "show me cruises", "help me find a cruise", or "I want a cruise" WITHOUT any specific preference — do NOT call apply_cruise_filters at all. Ask ONE short follow-up question: "Any preference on destination, month, or trip duration?"
- NEVER use resetAll: true for generic phrases like "find a cruise" or "show cruises". resetAll must only be used when the user explicitly says "clear filters", "reset filters", "remove filters", or "show everything" — meaning they want to undo filters they have already set.
- Only use values from the available options. Suggest alternatives if not listed.
- Convert month names to MM-YYYY. If no year specified, always use current year (${year}).
- "Weekend cruise" = 2-3 nights. "Short cruise" = 2-3 nights. "Long cruise" = 5+ nights.
- ORIGIN vs DESTINATION: Origins = STARTING/DEPARTURE port. Destinations = ports the cruise VISITS.
  - "Starting from Goa", "from Goa", "sailing from Goa" → origins = ["Goa"]
  - "Cruise to Goa", "going to Goa", "visit Goa" → destinations = ["Goa"]
  - "From Mumbai to Goa" → origins = ["Mumbai"], destinations = ["Goa"]
- Leave arrays empty ([]) for unmentioned categories.`;
}

function viewItineraryRulesSection(): string {
    return `VIEW ITINERARY RULES:
Only call view_itinerary_details when the user clearly wants to OPEN/NAVIGATE to the itinerary page. The test: are they trying to go to the page, or just asking a question about a specific itinerary?

SHOULD trigger (navigation intent):
- "show me the full details of the 13th April cruise"
- "open the itinerary for 15th August"
- "view the second one"
- "take me to the 12 Apr itinerary"
- "I want to book the first one" / "book the one on 13 Apr"
- "see complete details of itinerary #2"

Should NOT trigger (specific question about an itinerary — answer in chat instead):
- "what are the offers on 12 Apr?" → answer the question in chat
- "what's included in the 13 Apr sailing?" → answer in chat
- "how much is the 15 Apr cruise?" → answer in chat
- "tell me about the Goa cruise on April 12" → answer in chat
- "what cabin types are available on the first itinerary?" → answer in chat
- Any question that mentions a date/number BUT has a specific topic (offers, price, inclusions, cabins, dining, etc.)

KEY RULE: A date or itinerary number alone is NOT enough to trigger navigation. There must be explicit navigation/booking intent ("view", "open", "show full details", "take me to", "book"). If the user is asking a topic-specific question (offers, price, food, cabins), answer it directly in chat without redirecting.

ONLY use itinerary IDs from the CURRENTLY DISPLAYED ITINERARIES list.
If a referenced date doesn't match any displayed itinerary, say so and list the available dates.`;
}

function knowledgeSection(knowledge: string): string {
    return `[KB] CORDELIA CRUISES KNOWLEDGE BASE (supplementary — [LIVE] sections above take precedence for pricing, availability, and offers):
${knowledge}
Use the above for general cruise questions. If the answer isn't here or in any [LIVE] section, say so and suggest they call/check the website.`;
}

// Minimal guard included on pages WITHOUT full filter options (e.g., homepage).
// Prevents the model from misusing apply_cruise_filters when it has the tool
// but no filter-rules context.
function filterGuardSection(): string {
    return `FILTER TOOL GUARD:
- NEVER call apply_cruise_filters with resetAll: true unless the user explicitly says "clear filters", "reset", or "show everything".
- If the user says "find a cruise" or "search cruises" without a specific destination, month, or duration, ask what they prefer. Do NOT call apply_cruise_filters.
- When the user does mention a specific destination or month, you may call apply_cruise_filters with that preference filled in.`;
}

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildSearchPrompt(ctx: PromptContext): string {
    const signals = deriveSignals(ctx);
    const sections = [
        identitySection(),
        dataSourcePrioritySection(),                            // always: permission + priority rule first
        conversationalContextSection(),                        // always: pronoun resolution + concierge tone
        capabilitiesSection(signals),
        signals.hasItineraries ? itineraryContextSection(ctx) : null,
        signals.hasFilterOptions ? filterRulesSection(ctx) : filterGuardSection(),
        signals.hasItineraries ? viewItineraryRulesSection() : null,
        toneSection(),
        globalKnowledgeCoreSection(getGlobalKnowledgeCore()),  // always: compact FAQ baseline
        signals.hasRelevantKnowledge ? knowledgeSection(signals.relevantKnowledge) : null, // conditional: deeper hit
    ];
    return sections.filter(Boolean).join('\n\n');
}
