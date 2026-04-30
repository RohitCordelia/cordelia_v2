/**
 * Lightweight query classifier — decides whether the model should prioritise
 * live page context ([LIVE] sections) over the static knowledge base ([KB]).
 *
 * Used by the chat router to set `skipDetailedKb` on the prompt context so
 * booking-related questions are answered from real-time data, not stale KB.
 *
 * Rules:
 *   query matches LIVE_TOPIC + live context exists  → 'live'   (skip detailed KB)
 *   query matches LIVE_TOPIC + NO live context       → 'both'   (KB is needed)
 *   query does NOT match any live topic              → 'both'   (general FAQ)
 */

export type QuerySource = 'live' | 'both';

/**
 * Topics that should be answered from live page data when available.
 * Covers: filters, itinerary list, itinerary detail, pricing, offers, cabins.
 */
const LIVE_TOPIC_RE =
    /\b(price|pricing|cost|fare|how much|rate|offer|discount|deal|promo|cabin|room|suite|balcony|interior|ocean view|filter|search cruises?|find cruise|show cruise|availab|itinerar|port|destination|schedule|date|night|embark|depart|arrive|sailing|book|reserve|proceed|checkout|select cabin|choose cabin|pick cabin|sold out|cheapest|expensive|budget)\b/i;

export function classifyQuerySource(
    userMessage: string,
    hasLiveContext: boolean,
): QuerySource {
    if (hasLiveContext && LIVE_TOPIC_RE.test(userMessage)) return 'live';
    return 'both';
}
