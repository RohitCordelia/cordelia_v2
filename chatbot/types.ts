// Shared types for the Nyra chatbot.
// Import from here in any new file — avoids circular deps between aiService / promptSections / tools.

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'bot' | 'user';
}

export interface ExtractedFilters {
    months: string[];
    destinations: string[];
    nights: string[];
    origins: string[];
    tripType: string[];
    resetAll: boolean;
}

export interface CabinRoomSelection {
    adults: number;
    children: number;
    infants: number;
}

export interface CabinTypeSelection {
    cabin_type: string;
    rooms: CabinRoomSelection[];
}

export interface CabinSelection {
    cabins: CabinTypeSelection[];
}

// ── Assistant actions (discriminated union) ──────────────────────────────────
// Each variant maps 1-to-1 with a tool declared in tools.ts.
// ADD NEW VARIANTS HERE when a new tool is added.

export interface ApplyFiltersAction {
    type: 'APPLY_FILTERS';
    filters: ExtractedFilters;
}

export interface ResetFiltersAction {
    type: 'RESET_FILTERS';
}

export interface OpenItineraryAction {
    type: 'OPEN_ITINERARY';
    itineraryId: string;
}

export interface ProceedToBookingAction {
    type: 'PROCEED_TO_BOOKING';
}

export interface UpdateCabinSelectionAction {
    type: 'UPDATE_CABIN_SELECTION';
    selection: CabinSelection;
}

export interface HandoffToSupportAction {
    type: 'HANDOFF_TO_SUPPORT';
}

/** Medium-high risk. Requires auth + user confirmation before execution. */
export interface SendInvoiceAction {
    type: 'SEND_INVOICE';
    bookingId: string;
    recipientEmail: string;
}

/** Medium risk. Requires auth. Navigates user to the payment checkout page. */
export interface GoToCheckoutAction {
    type: 'GO_TO_CHECKOUT';
    itineraryId: string;
}

/**
 * FORBIDDEN for AI execution.
 * This type exists so the gateway can catch and reject it if the model ever
 * generates it. Payment must always be initiated by the user directly.
 */
export interface FinalizePaymentAction {
    type: 'FINALIZE_PAYMENT';
    amount: number;
    currency: string;
}

export type AssistantAction =
    | ApplyFiltersAction
    | ResetFiltersAction
    | OpenItineraryAction
    | ProceedToBookingAction
    | UpdateCabinSelectionAction
    | HandoffToSupportAction
    | SendInvoiceAction
    | GoToCheckoutAction
    | FinalizePaymentAction;

// ── Normalized response shape ────────────────────────────────────────────────

export interface AssistantResponse {
    message: string;
    actions: AssistantAction[];
    /** 0.0–1.0 derived from whether the model produced tool calls */
    confidence: number;
    /** true when PROCEED_TO_BOOKING is present — caller must gate on isLoggedIn */
    needsAuth?: boolean;
    /** reserved for flows that require explicit user confirmation before executing */
    needsConfirmation?: boolean;
}

// ── Conversation & prompt types ──────────────────────────────────────────────

export interface ItineraryPort {
    name: string;
    day: string;
    type: string;
    arrival: string;
    departure: string;
    embarkation_start_time: string;
    embarkation_end_time: string;
}

export interface ItinerarySummary {
    id: string;
    ship_name: string;
    destination: string;
    origin: string;
    nights: number;
    start_date: string;
    starting_fare: number;
    trip_type: string;
    offers_available: string[];
    tags: string[];
    discount_pct: number;
    ports: ItineraryPort[];
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ShoreExcursion {
    title: string;
    description: string;
    active: boolean;
}

export interface ItineraryDetailPort {
    day: string;
    name: string;
    title: string;
    description: string;
    type: string;
    arrival: string;
    departure: string;
    embarkation_start_time: string;
    embarkation_end_time: string;
    country: string;
    shore_excursions: ShoreExcursion[];
}

export interface ItineraryDetail {
    id: string;
    nights: number;
    trip_type: string;
    start_date: string;
    end_date: string;
    ship_name: string;
    route_name: string;
    starting_fare: number;
    actual_starting_fare: number;
    discount_pct: number;
    offers_available: string[];
    tags: string[];
    starting_port: string;
    destination_port: string;
    ports: ItineraryDetailPort[];
    is_tender_port: boolean;
    is_international: boolean;
    has_shore_excursions: boolean;
}

export interface AvailableCabinRoom {
    adults: number;
    children: number;
    infants: number;
}

export interface AvailableCabin {
    name: string;
    code: string;
    per_guest: number;
    max_capacity: number;
    is_sold: boolean;
    selected_rooms?: AvailableCabinRoom[];
}

export interface PromptContext {
    availablePorts: string[];
    availableOrigins: string[];
    availableDates: string[];
    availableNights: number[];
    itineraries: ItinerarySummary[];
    userMessage: string;
    itineraryDetail?: ItineraryDetail;
    availableCabins?: AvailableCabin[];
    /** Snippet from the last assistant message — used to improve KB retrieval for follow-up questions. */
    recentContext?: string;
    /** When true, skip query-matched KB — live page context is sufficient for this query. */
    skipDetailedKb?: boolean;
}

// ── Bot Page Context ───────────────────────────────────────────────────────
// Typed context the chatbot receives from its host page.
// Discriminated on `pageType` so the router / prompts can narrow safely.

export type BotPageType = 'search' | 'itinerary' | 'cabin-select';

/** Available filter values on the search listing page. */
export interface SearchFilterOptions {
    ports: string[];
    origins: string[];
    dates: string[];          // MM-YYYY
    nights: number[];
}

/** Summary of current search results. */
export interface SearchResultsSummary {
    itineraries: ItinerarySummary[];
    totalCount: number;
    isLoading: boolean;
}

/** The specific sailing the user is viewing. Derived from ItineraryDetail. */
export interface SelectedSailing {
    itineraryId: string;
    shipName: string;
    startDate: string;        // DD/MM/YYYY
    endDate: string;          // DD/MM/YYYY
    nights: number;
    tripType: string;
    startingPort: string;
    destinationPort: string;
    routeName: string;
}

/** Pricing snapshot for an itinerary. */
export interface PricingSummary {
    startingFare: number;
    actualStartingFare: number;
    discountPct: number;
}

/** Offers and promotional tags on an itinerary. */
export interface OffersInfo {
    available: string[];
    tags: string[];
}

/** User auth and booking-readiness state. */
export interface BookingState {
    isLoggedIn: boolean;
}

// ── Per-page context variants ──────────────────────────────────────────────

export interface SearchPageContext {
    pageType: 'search';
    filters: SearchFilterOptions;
    results: SearchResultsSummary;
    booking: BookingState;
    onApplyFilters: (filters: ExtractedFilters) => void;
    onResetFilters: () => void;
}

export interface ItineraryPageContext {
    pageType: 'itinerary';
    itinerary?: ItineraryDetail;
    sailing?: SelectedSailing;
    pricing?: PricingSummary;
    offers?: OffersInfo;
    booking: BookingState;
}

export interface CabinSelectPageContext {
    pageType: 'cabin-select';
    itinerary?: ItineraryDetail;
    sailing?: SelectedSailing;
    pricing?: PricingSummary;
    offers?: OffersInfo;
    cabins: AvailableCabin[];
    booking: BookingState;
    onSelectCabin: (selection: CabinSelection) => void;
}

export type BotPageContext =
    | SearchPageContext
    | ItineraryPageContext
    | CabinSelectPageContext;
