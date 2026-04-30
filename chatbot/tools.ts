// Gemini tool (function calling) declarations.
//
// HOW TO ADD A NEW INTENT / FLOW:
//   1. Add a new FunctionDeclaration export below.
//   2. Add it to ALL_TOOLS so the model knows it exists.
//   3. Add a new AssistantAction variant + mapper case in aiService.ts → mapFunctionCallsToActions.
//   4. Update executeActions in useAssistantActions.ts to handle the new action type.
//
// Example for a future booking flow:
//   export const selectCabinDeclaration: FunctionDeclaration = { name: 'select_cabin', ... }

import { SchemaType, FunctionDeclaration, Schema } from '@google/generative-ai';

export const filterDeclaration: FunctionDeclaration = {
    name: 'apply_cruise_filters',
    description: 'Apply search filters to find matching cruise itineraries based on user preferences. Call this whenever the user expresses a cruise preference.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            months: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Month filters in MM-YYYY format (e.g., ["08-2026"]). Convert month names to this format using the nearest available future date.',
            } as Schema,
            destinations: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Destination port names (e.g., ["Goa"]). Must match exactly from the available ports list.',
            } as Schema,
            nights: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Number of nights as strings (e.g., ["2", "3"]). For "weekend" use ["2", "3"].',
            } as Schema,
            origins: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Departure/origin port names (e.g., ["Mumbai"]). Must match from available origins.',
            } as Schema,
            tripType: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'Trip type: "one_way" or "round".',
            } as Schema,
            resetAll: {
                type: SchemaType.BOOLEAN,
                description: 'Set true to clear/reset all filters.',
            } as Schema,
        },
        required: ['months', 'destinations', 'nights', 'origins', 'tripType', 'resetAll'],
    },
};

export const viewItineraryDeclaration: FunctionDeclaration = {
    name: 'view_itinerary_details',
    description: 'Open the full details page of a specific cruise itinerary. Call this when the user wants to see more details, view, or book a specific itinerary from the current results.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            itinerary_id: {
                type: SchemaType.STRING,
                description: 'The unique ID of the itinerary to view. Must be from the CURRENTLY DISPLAYED ITINERARIES list.',
            } as Schema,
        },
        required: ['itinerary_id'],
    },
};

export const proceedToBookingDeclaration: FunctionDeclaration = {
    name: 'proceed_to_booking',
    description: 'Navigate the user to the cabin selection / booking page for the current itinerary. Call this when the user wants to book, continue, proceed, or select a cabin for the itinerary they are currently viewing.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: [],
    },
};

export const selectCabinDeclaration: FunctionDeclaration = {
    name: 'select_cabin_and_guests',
    description: 'Set the COMPLETE cabin selection state. Call this whenever the user adds, removes, or modifies any cabin or guest count. Always include ALL cabins the user wants — not just the new/changed one. This replaces the entire current selection.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            cabins: {
                type: SchemaType.ARRAY,
                description: 'Complete list of all cabin types the user wants. One entry per cabin TYPE (not per room). Each entry has the cabin type name and all rooms for that type.',
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        cabin_type: {
                            type: SchemaType.STRING,
                            description: 'Cabin type name (e.g., "Interior Premier", "Ocean View Standard"). Match from the available cabins list.',
                        } as Schema,
                        rooms: {
                            type: SchemaType.ARRAY,
                            description: 'One entry per room of this cabin type.',
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    adults: { type: SchemaType.NUMBER, description: 'Number of adults (min 2).' } as Schema,
                                    children: { type: SchemaType.NUMBER, description: 'Number of children.' } as Schema,
                                    infants: { type: SchemaType.NUMBER, description: 'Number of infants.' } as Schema,
                                },
                                required: ['adults', 'children', 'infants'],
                            } as Schema,
                        } as Schema,
                    },
                    required: ['cabin_type', 'rooms'],
                } as Schema,
            } as Schema,
        },
        required: ['cabins'],
    },
};

// ADD NEW DECLARATIONS ABOVE THIS LINE.

// Search assistant: cruise discovery, filter application, itinerary navigation.
export const SEARCH_TOOLS = [
    { functionDeclarations: [filterDeclaration, viewItineraryDeclaration] },
];

// Booking assistant: itinerary detail page + cabin selection page.
export const BOOKING_TOOLS = [
    { functionDeclarations: [proceedToBookingDeclaration, selectCabinDeclaration] },
];

// Legacy export kept for any code still importing ALL_TOOLS directly.
export const ALL_TOOLS = [
    { functionDeclarations: [filterDeclaration, viewItineraryDeclaration, proceedToBookingDeclaration, selectCabinDeclaration] },
];
