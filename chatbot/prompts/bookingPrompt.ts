// System prompt builder for the booking assistant.
//
// Included sections:
//   identity, booking capabilities, itinerary detail OR cabin selection, tone,
//   knowledge base (query-relevant chunks, capped at ~400 tokens)
//
// Deliberately excludes:
//   - Filter rules section  (no search on these pages)
//   - Full itinerary list   (user is already on a specific itinerary)
//
// Token budget: ~350–800 tokens depending on KB hit.
//
// Two page modes:
//   itineraryDetail present  → view-itinerary page  → booking intent + itinerary Q&A
//   availableCabins present  → cabin-selection page → cabin modification only
//
// TO ADD a new booking-only section:
//   1. Export a section function below.
//   2. Add it conditionally in buildBookingPrompt().

import { PromptContext, ItineraryDetail, AvailableCabin } from '../types';
import { getGlobalKnowledgeCore, getRelevantKnowledgeCapped } from '../knowledgeBase';
import { identitySection, toneSection, globalKnowledgeCoreSection, globalKnowledgeRuleSection, conversationalContextSection } from './basePrompt';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    if (!dateStr) return 'Unknown date';
    const [dd, mm, yyyy] = dateStr.split('/');
    if (!dd || !mm || !yyyy) return dateStr;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
        .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Sections ─────────────────────────────────────────────────────────────────

function bookingCapabilitiesSection(ctx: PromptContext): string {
    if ((ctx.availableCabins?.length ?? 0) > 0) {
        return `YOUR CAPABILITIES:
1. **Select Cabin & Guests** — Help the user choose cabin types and configure guest counts for each room.
2. **Answer cabin questions** — pricing, capacity, what's included.
3. **General cruise FAQ** — answer any general question about Cordelia Cruises (wifi, dining, policies, destinations, etc.) using the knowledge sections below.`;
    }
    return `YOUR CAPABILITIES:
1. **Answer questions** about this specific itinerary — ports, timings, shore excursions, pricing, policies.
2. **Proceed to booking** — when the user is ready to select a cabin, call proceed_to_booking.
3. **General cruise FAQ** — answer any general question about Cordelia Cruises (wifi, cabin types, dining, policies, etc.) using the knowledge sections below.`;
}

export function itineraryDetailSection(detail: ItineraryDetail): string {
    const portsBlock = detail.ports.map(p => {
        const lines: string[] = [`  Day ${p.day} — ${p.name} (${p.type})`];
        if (p.type === 'ORIGIN') {
            if (p.embarkation_start_time && p.embarkation_end_time)
                lines.push(`    Check-in: ${p.embarkation_start_time} – ${p.embarkation_end_time}`);
            if (p.departure) lines.push(`    Departure: ${p.departure}`);
        } else {
            if (p.arrival) lines.push(`    Arrives: ${p.arrival}`);
            if (p.departure) lines.push(`    Departs: ${p.departure}`);
        }
        if (p.description) lines.push(`    About: ${p.description.slice(0, 120)}...`);
        if (p.shore_excursions?.length) {
            lines.push('    Shore Excursions:');
            p.shore_excursions
                .filter(s => s.active)
                .forEach(s => lines.push(`      - ${s.title}: ${s.description.slice(0, 100)}...`));
        }
        return lines.join('\n');
    }).join('\n');

    const discountLine = detail.discount_pct
        ? `\nDiscount: ${Math.round(detail.discount_pct * 100)}% off (was ₹${detail.actual_starting_fare?.toLocaleString('en-IN')})`
        : '';
    const offersLine = detail.offers_available?.length
        ? `\nOffers: ${detail.offers_available.join(' | ')}`
        : '';
    const flagsLine = [
        detail.is_tender_port ? 'Tender port (guests reach shore via tender boats)' : null,
        detail.is_international ? 'International sailing — passport & visa required' : 'Domestic sailing',
        detail.has_shore_excursions ? 'Shore excursions available' : null,
    ].filter(Boolean).join(' | ');

    return `THIS ITINERARY (user is currently on the view itinerary page for this specific sailing):

BOOKING INTENT RULE (HIGHEST PRIORITY): You MUST call proceed_to_booking — do NOT respond with text only — whenever the user expresses any intent to move forward with this booking. This includes:
- "book", "book this", "I want to book"
- "next step", "take me to next step", "go to next step"
- "continue", "proceed", "go ahead", "let's go"
- "select cabin", "choose cabin", "pick a cabin"
- "I want this", "confirm", "reserve"
- Any variation of wanting to move forward in the booking process
Call proceed_to_booking INSTEAD of answering with text. The function will handle the navigation.


Ship: ${detail.ship_name}
Route: ${detail.route_name}
Dates: ${formatDate(detail.start_date)} → ${formatDate(detail.end_date)} (${detail.nights} nights)
Trip type: ${detail.trip_type === 'one_way' ? 'One Way' : 'Round Trip'}
From: ${detail.starting_port} → To: ${detail.destination_port}
Starting fare: ₹${detail.starting_fare?.toLocaleString('en-IN')} per guest per night${discountLine}${offersLine}
${flagsLine}

PORT DETAILS:
${portsBlock}

Answer all questions about this itinerary using the data above. For shore excursion questions, use the excursion details listed under each port.`;
}

export function cabinSelectionSection(cabins: AvailableCabin[]): string {
    const available = cabins.filter(c => !c.is_sold);
    const cabinList = available.map(c => {
        const currentStr = c.selected_rooms?.length
            ? ` | CURRENTLY SELECTED: ${c.selected_rooms.length} room(s) — ${c.selected_rooms.map((r, i) => `room${i + 1}: ${r.adults}A/${r.children}C/${r.infants}I`).join(', ')}`
            : '';
        return `- ${c.name} | ₹${c.per_guest?.toLocaleString('en-IN')}/guest | max ${c.max_capacity} guests${currentStr}`;
    }).join('\n');

    const currentSelection = cabins.filter(c => c.selected_rooms?.length);
    const currentStr = currentSelection.length
        ? `\nCURRENT SELECTION:\n${currentSelection.map(c => `- ${c.name}: ${c.selected_rooms!.length} room(s) — ${c.selected_rooms!.map((r, i) => `room${i + 1}: ${r.adults} adult(s), ${r.children} child(ren), ${r.infants} infant(s)`).join(' | ')}`).join('\n')}`
        : '\nCURRENT SELECTION: None yet.';

    return `USER IS ON THE CABIN SELECTION PAGE.
${currentStr}

AVAILABLE CABINS:
${cabinList}

CABIN SELECTION RULES:
- Call select_cabin_and_guests when user adds, removes, or modifies any cabin or guest count.
- The "cabins" array must contain the COMPLETE desired state — ALL cabin types the user wants, not just the changed one.
- When user says "add 1 more adult to Interior Premier": take the current Interior Premier rooms, update adults, include all other selected cabins unchanged.
- When user says "add 1 Ocean View Standard": keep existing selections, add the new cabin type.
- rooms array: one object per room of that cabin type. Each must have adults (min 1), children, infants.
- If cabin type is sold out, tell the user and suggest alternatives.
- Do NOT call select_cabin_and_guests if the user is just asking a question.

EXAMPLES:
- "1 Interior Premier, 2 adults" → cabins: [{cabin_type:"Interior Premier", rooms:[{adults:2,children:0,infants:0}]}]
- "add 1 Ocean View Standard with 2 adults" (Interior Premier already selected) → cabins: [{cabin_type:"Interior Premier", rooms:[existing]}, {cabin_type:"Ocean View Standard", rooms:[{adults:2,children:0,infants:0}]}]
- "add 1 more adult to the Interior Premier" → cabins: [{cabin_type:"Interior Premier", rooms:[{adults:updated_count,...}]}, ...all other selected cabins]`;
}

function knowledgeSection(knowledge: string): string {
    return `CORDELIA CRUISES KNOWLEDGE BASE:\n${knowledge}\nUse the above knowledge to answer general questions. If the answer isn't here, say so briefly and suggest they check the website.`;
}

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildBookingPrompt(ctx: PromptContext): string {
    const kbQuery = ctx.recentContext ? `${ctx.userMessage} ${ctx.recentContext}` : ctx.userMessage;
    const relevantKnowledge = getRelevantKnowledgeCapped(kbQuery, 400);
    const sections = [
        identitySection(),
        globalKnowledgeRuleSection(),                          // always: permission rule first
        conversationalContextSection(),                        // always: pronoun resolution + concierge tone
        bookingCapabilitiesSection(ctx),
        ctx.itineraryDetail ? itineraryDetailSection(ctx.itineraryDetail) : null,
        (ctx.availableCabins?.length ?? 0) > 0 ? cabinSelectionSection(ctx.availableCabins!) : null,
        toneSection(),
        globalKnowledgeCoreSection(getGlobalKnowledgeCore()),  // always: compact FAQ baseline
        relevantKnowledge ? knowledgeSection(relevantKnowledge) : null, // conditional: deeper hit
    ];
    return sections.filter(Boolean).join('\n\n');
}
