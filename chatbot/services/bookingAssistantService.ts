// Booking assistant — handles the itinerary detail and cabin selection pages.
//
// Scope: itinerary Q&A, proceed-to-booking intent, cabin + guest configuration.
// Tools: proceed_to_booking, select_cabin_and_guests
//
// TO ADD a new booking-only tool:
//   1. Declare it in tools.ts and add it to BOOKING_TOOLS.
//   2. Add a mapper case in mapBookingActions().
//   3. Add a fallback string in bookingFallbackMessage().
//   4. Handle the new AssistantAction variant in useAssistantActions.ts.

import { PromptContext, AssistantAction } from '../types';
import { buildBookingPrompt } from '../prompts/bookingPrompt';
import { BOOKING_TOOLS } from '../tools';

// Return type is inferred — chatRouter verifies structural compatibility against AssistantConfig.
export function getBookingAssistantConfig(ctx: PromptContext) {
    return {
        systemPrompt: buildBookingPrompt(ctx),
        tools: BOOKING_TOOLS,
        mapActions: mapBookingActions,
        fallbackMessage: bookingFallbackMessage,
    };
}

// ── Action mapper ────────────────────────────────────────────────────────────

function mapBookingActions(parts: any[]): AssistantAction[] {
    const actions: AssistantAction[] = [];
    for (const part of parts) {
        if (!part.functionCall) continue;
        const { name, args } = part.functionCall;
        switch (name) {
            case 'proceed_to_booking':
                actions.push({ type: 'PROCEED_TO_BOOKING' });
                break;
            case 'select_cabin_and_guests':
                actions.push({
                    type: 'UPDATE_CABIN_SELECTION',
                    selection: {
                        cabins: (args.cabins || []).map((c: any) => ({
                            cabin_type: c.cabin_type || '',
                            rooms: (c.rooms || []).map((r: any) => ({
                                adults: r.adults || 1,
                                children: r.children || 0,
                                infants: r.infants || 0,
                            })),
                        })),
                    },
                });
                break;
        }
    }
    return actions;
}

// ── Fallback text ────────────────────────────────────────────────────────────

function bookingFallbackMessage(actions: AssistantAction[]): string {
    for (const action of actions) {
        switch (action.type) {
            case 'PROCEED_TO_BOOKING':
                return 'Taking you to cabin selection now!';
            case 'UPDATE_CABIN_SELECTION': {
                const summary = action.selection.cabins
                    .map(c => `${c.rooms.length} ${c.cabin_type}`)
                    .join(' + ');
                return `Updating your selection: ${summary}. Calculating price...`;
            }
        }
    }
    return "I'm sorry, I didn't understand that. Please describe your cabin preference or booking intent.";
}
