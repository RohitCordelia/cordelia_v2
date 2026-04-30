export interface ParsedFilters {
    months: string[];
    destinations: string[];
    nights: string[];
    origins: string[];
    tripType: string[];
    resetAll?: boolean;
}

const MONTH_MAP: Record<string, string> = {
    january: '01', jan: '01',
    february: '02', feb: '02',
    march: '03', mar: '03',
    april: '04', apr: '04',
    may: '05',
    june: '06', jun: '06',
    july: '07', jul: '07',
    august: '08', aug: '08',
    september: '09', sep: '09', sept: '09',
    october: '10', oct: '10',
    november: '11', nov: '11',
    december: '12', dec: '12',
};

const NIGHT_PATTERNS = [
    /(\d+)\s*(?:night|nite|n)\b/gi,
    /(\d+)\s*(?:day|d)\b/gi,
];

const TRIP_TYPE_KEYWORDS: Record<string, string> = {
    'one way': 'one_way',
    'one-way': 'one_way',
    'oneway': 'one_way',
    'round trip': 'round',
    'round-trip': 'round',
    'roundtrip': 'round',
};

const RESET_KEYWORDS = ['reset', 'clear', 'remove all filters', 'clear all', 'start over', 'show all', 'show everything'];

export function parseCruiseQuery(
    input: string,
    availablePorts: string[],
    availableOrigins: string[],
    availableDates: string[],
    availableNights: number[]
): ParsedFilters {
    const text = input.toLowerCase().trim();

    const result: ParsedFilters = {
        months: [],
        destinations: [],
        nights: [],
        origins: [],
        tripType: [],
    };

    // Check for reset
    if (RESET_KEYWORDS.some(kw => text.includes(kw))) {
        result.resetAll = true;
        return result;
    }

    // Extract months
    const currentYear = new Date().getFullYear();
    for (const [name, mm] of Object.entries(MONTH_MAP)) {
        const regex = new RegExp(`\\b${name}\\b`, 'i');
        if (regex.test(text)) {
            // Try to find matching available dates for this month
            const matchingDates = availableDates?.filter(d => d.startsWith(`${mm}-`)) || [];
            if (matchingDates.length > 0) {
                result.months.push(...matchingDates);
            } else {
                // Default to current year and next year
                const candidate = `${mm}-${currentYear}`;
                const candidateNext = `${mm}-${currentYear + 1}`;
                if (availableDates?.includes(candidate)) {
                    result.months.push(candidate);
                } else if (availableDates?.includes(candidateNext)) {
                    result.months.push(candidateNext);
                } else {
                    result.months.push(candidate);
                }
            }
        }
    }
    // Deduplicate months
    result.months = [...new Set(result.months)];

    // Extract destinations (fuzzy match against available ports)
    const portNames = availablePorts?.map(p => p.toLowerCase()) || [];
    for (let i = 0; i < portNames.length; i++) {
        const portLower = portNames[i];
        const portOriginal = availablePorts[i];
        if (text.includes(portLower)) {
            result.destinations.push(portOriginal);
        }
    }

    // Extract origins - check for "from <port>" pattern
    const originNames = availableOrigins?.map(p => p.toLowerCase()) || [];
    for (let i = 0; i < originNames.length; i++) {
        const originLower = originNames[i];
        const originOriginal = availableOrigins[i];
        const fromPattern = new RegExp(`(?:from|departing|departure|sailing from|depart from)\\s+${originLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
        if (fromPattern.test(text)) {
            result.origins.push(originOriginal);
        } else if (text.includes(originLower) && !result.destinations.includes(originOriginal)) {
            // If origin is mentioned but not as destination, check context
            if (text.includes('from') && text.indexOf(originLower) > text.indexOf('from')) {
                result.origins.push(originOriginal);
            }
        }
    }

    // Extract nights
    for (const pattern of NIGHT_PATTERNS) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(text)) !== null) {
            const nightCount = match[1];
            if (availableNights?.includes(Number(nightCount))) {
                result.nights.push(nightCount);
            } else {
                result.nights.push(nightCount);
            }
        }
    }
    // Also check for "weekend" as 2 nights
    if (/\bweekend\b/i.test(text)) {
        const weekendNights = availableNights?.filter(n => n <= 3) || [2, 3];
        result.nights.push(...weekendNights.map(String));
    }
    result.nights = [...new Set(result.nights)];

    // Extract trip type
    for (const [keyword, value] of Object.entries(TRIP_TYPE_KEYWORDS)) {
        if (text.includes(keyword)) {
            result.tripType.push(value);
        }
    }

    return result;
}

export function hasAnyFilter(filters: ParsedFilters): boolean {
    return (
        filters.months.length > 0 ||
        filters.destinations.length > 0 ||
        filters.nights.length > 0 ||
        filters.origins.length > 0 ||
        filters.tripType.length > 0 ||
        !!filters.resetAll
    );
}

export function buildFilterSummary(filters: ParsedFilters): string {
    const parts: string[] = [];

    if (filters.resetAll) {
        return "I'll clear all filters and show you all available cruises.";
    }

    if (filters.destinations.length > 0) {
        parts.push(`destination: **${filters.destinations.join(', ')}**`);
    }
    if (filters.months.length > 0) {
        const monthNames = filters.months.map(d => {
            const [mm, yyyy] = d.split('-');
            const names: Record<string, string> = {
                '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
                '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
                '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
            };
            return `${names[mm] || mm} ${yyyy}`;
        });
        parts.push(`month: **${monthNames.join(', ')}**`);
    }
    if (filters.nights.length > 0) {
        parts.push(`duration: **${filters.nights.join(', ')} night(s)**`);
    }
    if (filters.origins.length > 0) {
        parts.push(`departure from: **${filters.origins.join(', ')}**`);
    }
    if (filters.tripType.length > 0) {
        const types = filters.tripType.map(t => t === 'one_way' ? 'One Way' : 'Round Trip');
        parts.push(`trip type: **${types.join(', ')}**`);
    }

    if (parts.length === 0) return '';
    return `Searching for cruises with ${parts.join(', ')}. Let me update the results for you!`;
}

// ── Short-circuit assessment ─────────────────────────────────────────────────
// Used by chatRouter to decide whether to skip the LLM for pure filter queries.

export interface FilterAssessment {
    parsed: ParsedFilters;
    /** 0.0–1.0. ≥ 0.75 = high confidence the query is a pure filter/reset intent. */
    confidence: number;
    /** true when confidence is high enough to skip the LLM entirely. */
    shouldShortCircuit: boolean;
}

// Signals that indicate the query needs LLM reasoning, not just filter extraction.
const QUESTION_RE       = /[?]|\b(what|how|tell me|explain|which is better|difference between|why|when does|where is|who)\b/i;
const ORDINAL_REF_RE    = /\b(first|second|third|last|cheapest|most expensive|best value|that one|this one|the one)\b/i;
const BOOKING_INTENT_RE = /\b(book|proceed|cabin|select cabin|choose cabin|next step|continue)\b/i;
const SEARCH_SIGNAL_RE  = /\b(find|search|show|filter|look for|browse|list|display|see all|available|any cruises)\b/i;

/**
 * Runs the deterministic filter parser and assigns a confidence score.
 * If confidence ≥ 0.75 and filters were extracted (or it's a reset), chatRouter
 * can skip the Gemini call and return an APPLY_FILTERS / RESET_FILTERS action directly.
 */
export function assessFilterQuery(
    input: string,
    availablePorts: string[],
    availableOrigins: string[],
    availableDates: string[],
    availableNights: number[],
): FilterAssessment {
    const parsed = parseCruiseQuery(input, availablePorts, availableOrigins, availableDates, availableNights);
    const confidence = scoreConfidence(input, parsed);
    return {
        parsed,
        confidence,
        shouldShortCircuit: confidence >= 0.75 && (hasAnyFilter(parsed) || !!parsed.resetAll),
    };
}

function scoreConfidence(input: string, parsed: ParsedFilters): number {
    // Reset is always deterministic
    if (parsed.resetAll) return 1.0;

    // Hard negatives — these always require LLM understanding
    if (QUESTION_RE.test(input))       return 0.15; // question → needs LLM context
    if (ORDINAL_REF_RE.test(input))    return 0.15; // relative reference → needs list context
    if (BOOKING_INTENT_RE.test(input)) return 0.05; // booking intent → booking assistant

    // No filter extracted → LLM may pick up nuance the parser missed
    if (!hasAnyFilter(parsed)) return 0.30;

    // Base score: parser found at least one filter
    let score = 0.60;

    if (SEARCH_SIGNAL_RE.test(input)) score += 0.20; // explicit search verb

    // Each additional filter dimension adds marginal confidence
    const filterCount = [
        parsed.months.length > 0,
        parsed.destinations.length > 0,
        parsed.nights.length > 0,
        parsed.origins.length > 0,
        parsed.tripType.length > 0,
    ].filter(Boolean).length;
    score += filterCount * 0.05;

    // Multi-filter bonus: ≥2 dimensions together strongly imply search intent
    if (filterCount >= 2) score += 0.05;

    return Math.min(score, 1.0);
}

export function getMissingFilterPrompt(filters: ParsedFilters): string | null {
    const hasMonth = filters.months.length > 0;
    const hasDest = filters.destinations.length > 0;
    const hasNights = filters.nights.length > 0;
    const hasOrigin = filters.origins.length > 0;

    const missing: string[] = [];

    if (!hasMonth && !hasDest && !hasNights && !hasOrigin) {
        return null; // Nothing was parsed, we'll handle this differently
    }

    if (!hasMonth) missing.push('which month');
    if (!hasDest) missing.push('which destination');

    if (missing.length > 0 && missing.length <= 2) {
        return `Got it! Would you also like to specify ${missing.join(' or ')}? Or I can search with what you've told me.`;
    }

    return null;
}
