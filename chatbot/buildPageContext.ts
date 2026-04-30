/**
 * Pure helper functions that build typed BotPageContext from raw page / API state.
 *
 * Each builder mirrors the mapping logic that currently lives in useMemo blocks
 * inside the three host pages. When wired up, the pages can call a single builder
 * instead of spreading 13+ props.
 *
 * No side-effects, no hooks, no DOM access.
 */

import type {
    ItinerarySummary,
    ItineraryPort,
    ItineraryDetail,
    ItineraryDetailPort,
    ShoreExcursion,
    AvailableCabin,
    AvailableCabinRoom,
    ExtractedFilters,
    CabinSelection,
    SelectedSailing,
    PricingSummary,
    OffersInfo,
    SearchPageContext,
    ItineraryPageContext,
    CabinSelectPageContext,
} from './types';

// ── Raw API shapes (only fields the adapters read) ─────────────────────────

interface RawShoreExcursion {
    title?: string;
    description?: string;
    active?: boolean;
}

interface RawPort {
    name?: string;
    origin?: boolean;
    day?: string;
    type?: string;
    arrival?: string;
    departure?: string;
    embarkation_start_time?: string;
    embarkation_end_time?: string;
    title?: string;
    description?: string;
    country?: string;
    shore_excursions?: RawShoreExcursion[];
}

interface RawOffer {
    offer?: string;
}

interface RawItinerary {
    itinerary_id?: string;
    id?: string;
    ship?: { name?: string };
    destination_port?: { name?: string };
    starting_port?: { name?: string };
    route?: { name?: string };
    ports?: RawPort[];
    nights?: number;
    start_date?: string;
    end_date?: string;
    starting_fare?: number;
    actual_starting_fare?: number;
    trip_type?: string;
    offers_available?: (string | RawOffer)[];
    tags?: string[];
    discount_pct?: number;
    is_tender_port?: boolean;
    is_international?: boolean;
    shore_excursions?: boolean;
}

interface RawCabinRoom {
    adults?: number;
    children?: number;
    infants?: number;
}

interface RawCabin {
    name?: string;
    code?: string;
    per_guest?: number;
    max_capacity?: number;
    is_sold?: boolean;
    rooms?: RawCabinRoom[];
}

// ── Internal mappers ───────────────────────────────────────────────────────

function normalizeOffers(raw: (string | RawOffer)[] | undefined): string[] {
    return (raw || [])
        .map((o) => (typeof o === 'string' ? o : o?.offer))
        .filter((v): v is string => !!v);
}

function mapPort(p: RawPort): ItineraryPort {
    return {
        name: p.name || '',
        day: p.day || '',
        type: p.type || '',
        arrival: p.arrival || '',
        departure: p.departure || '',
        embarkation_start_time: p.embarkation_start_time || '',
        embarkation_end_time: p.embarkation_end_time || '',
    };
}

function mapDetailPort(p: RawPort): ItineraryDetailPort {
    return {
        day: p.day || '',
        name: p.name || '',
        title: p.title || '',
        description: p.description || '',
        type: p.type || '',
        arrival: p.arrival || '',
        departure: p.departure || '',
        embarkation_start_time: p.embarkation_start_time || '',
        embarkation_end_time: p.embarkation_end_time || '',
        country: p.country || '',
        shore_excursions: (p.shore_excursions || [])
            .filter((s) => s.active)
            .map(
                (s): ShoreExcursion => ({
                    title: s.title || '',
                    description: s.description || '',
                    active: true,
                }),
            ),
    };
}

function filterPorts<T>(ports: RawPort[] | undefined, mapper: (p: RawPort) => T): T[] {
    return (ports || [])
        .filter((p) => p.name && p.name !== 'At Sea')
        .map(mapper);
}

// ── Reusable single-record mappers ─────────────────────────────────────────

export function mapRawToSummary(raw: RawItinerary): ItinerarySummary {
    return {
        id: raw.itinerary_id || raw.id || '',
        ship_name: raw.ship?.name || '',
        destination:
            raw.destination_port?.name ||
            raw.ports?.find((p) => !p.origin)?.name ||
            '',
        origin: raw.ports?.find((p) => p.origin)?.name || '',
        nights: raw.nights || 0,
        start_date: raw.start_date || '',
        starting_fare: raw.starting_fare || 0,
        trip_type: raw.trip_type || '',
        offers_available: normalizeOffers(raw.offers_available),
        tags: raw.tags || [],
        discount_pct: raw.discount_pct || 0,
        ports: filterPorts(raw.ports, mapPort),
    };
}

export function mapRawToDetail(raw: RawItinerary): ItineraryDetail {
    return {
        id: raw.itinerary_id || raw.id || '',
        nights: raw.nights || 0,
        trip_type: raw.trip_type || '',
        start_date: raw.start_date || '',
        end_date: raw.end_date || '',
        ship_name: raw.ship?.name || '',
        route_name: raw.route?.name || '',
        starting_fare: raw.starting_fare || 0,
        actual_starting_fare: raw.actual_starting_fare || 0,
        discount_pct: raw.discount_pct || 0,
        offers_available: normalizeOffers(raw.offers_available),
        tags: raw.tags || [],
        starting_port: raw.starting_port?.name || '',
        destination_port: raw.destination_port?.name || '',
        ports: filterPorts(raw.ports, mapDetailPort),
        is_tender_port: !!raw.is_tender_port,
        is_international: !!raw.is_international,
        has_shore_excursions: !!raw.shore_excursions,
    };
}

export function mapRawToCabin(raw: RawCabin): AvailableCabin {
    return {
        name: raw.name || '',
        code: raw.code || '',
        per_guest: raw.per_guest || 0,
        max_capacity: raw.max_capacity || 0,
        is_sold: !!raw.is_sold,
        selected_rooms: raw.rooms
            ? raw.rooms.map(
                  (r): AvailableCabinRoom => ({
                      adults: r.adults || 0,
                      children: r.children || 0,
                      infants: r.infants || 0,
                  }),
              )
            : undefined,
    };
}

// ── Derived extractors ─────────────────────────────────────────────────────

export function extractSailing(detail: ItineraryDetail): SelectedSailing {
    return {
        itineraryId: detail.id,
        shipName: detail.ship_name,
        startDate: detail.start_date,
        endDate: detail.end_date,
        nights: detail.nights,
        tripType: detail.trip_type,
        startingPort: detail.starting_port,
        destinationPort: detail.destination_port,
        routeName: detail.route_name,
    };
}

export function extractPricing(detail: ItineraryDetail): PricingSummary {
    return {
        startingFare: detail.starting_fare,
        actualStartingFare: detail.actual_starting_fare,
        discountPct: detail.discount_pct,
    };
}

export function extractOffers(detail: ItineraryDetail): OffersInfo {
    return {
        available: detail.offers_available,
        tags: detail.tags,
    };
}

// ── Page-level builders ────────────────────────────────────────────────────

/** Max itineraries passed to the chatbot prompt context. */
const MAX_ITINERARIES = 5;

export interface SearchPageInput {
    portNames: string[];
    originNames: string[];
    dates: string[];
    nights: number[];
    itineraryData: RawItinerary[] | null | undefined;
    isLoading: boolean;
    isLoggedIn: boolean;
    onApplyFilters: (filters: ExtractedFilters) => void;
    onResetFilters: () => void;
}

export function buildSearchPageContext(input: SearchPageInput): SearchPageContext {
    const itineraries = (input.itineraryData || [])
        .slice(0, MAX_ITINERARIES)
        .map(mapRawToSummary);

    return {
        pageType: 'search',
        filters: {
            ports: input.portNames || [],
            origins: input.originNames || [],
            dates: input.dates || [],
            nights: input.nights || [],
        },
        results: {
            itineraries,
            totalCount: (input.itineraryData || []).length,
            isLoading: !!input.isLoading,
        },
        booking: { isLoggedIn: !!input.isLoggedIn },
        onApplyFilters: input.onApplyFilters,
        onResetFilters: input.onResetFilters,
    };
}

export interface ItineraryPageInput {
    itineraryData: RawItinerary | null | undefined;
    isLoggedIn: boolean;
}

export function buildItineraryPageContext(input: ItineraryPageInput): ItineraryPageContext {
    if (!input.itineraryData) {
        return {
            pageType: 'itinerary',
            booking: { isLoggedIn: !!input.isLoggedIn },
        };
    }

    const detail = mapRawToDetail(input.itineraryData);

    return {
        pageType: 'itinerary',
        itinerary: detail,
        sailing: extractSailing(detail),
        pricing: extractPricing(detail),
        offers: extractOffers(detail),
        booking: { isLoggedIn: !!input.isLoggedIn },
    };
}

export interface CabinSelectPageInput {
    itineraryData: RawItinerary | null | undefined;
    cabinData: RawCabin[] | null | undefined;
    isLoggedIn: boolean;
    onSelectCabin: (selection: CabinSelection) => void;
}

export function buildCabinSelectPageContext(input: CabinSelectPageInput): CabinSelectPageContext {
    const detail = input.itineraryData
        ? mapRawToDetail(input.itineraryData)
        : undefined;

    return {
        pageType: 'cabin-select',
        itinerary: detail,
        sailing: detail ? extractSailing(detail) : undefined,
        pricing: detail ? extractPricing(detail) : undefined,
        offers: detail ? extractOffers(detail) : undefined,
        cabins: (input.cabinData || []).map(mapRawToCabin),
        booking: { isLoggedIn: !!input.isLoggedIn },
        onSelectCabin: input.onSelectCabin,
    };
}
