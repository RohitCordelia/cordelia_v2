// Chat router — single entry point for all AI calls.
//
// Token-efficiency pipeline (applied in order before every Gemini call):
//
//   1. SHORT-CIRCUIT (search page only)
//      If the deterministic filter parser extracts filters with confidence ≥ 0.75,
//      return APPLY_FILTERS / RESET_FILTERS without calling the LLM.
//      Saves: ~1,400–2,000 tokens (full system prompt + response).
//      Triggers on: "show goa cruises", "find 3-night from mumbai", "reset filters", etc.
//      Does NOT trigger on: questions (?), ordinal references, booking intent.
//
//   2. HISTORY COMPRESSION
//      Older turns (beyond the last MAX_RECENT_TURNS) are summarized into two
//      compact messages instead of being sent verbatim.  Each older turn is
//      truncated to SUMMARY_CHARS_PER_TURN characters — enough to preserve context
//      without the full prose.
//      Saves: ~30–50 tokens per older turn (e.g., 10-turn history → −300 tokens).
//
//   3. ROUTING
//      itineraryDetail or availableCabins present → bookingAssistant
//      otherwise                                  → searchAssistant
//      Each assistant only loads the prompt sections and tool declarations for
//      its page — booking pages skip the filter rules, itinerary list, and
//      knowledge base entirely.

import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import {
    AssistantAction,
    AssistantResponse,
    ConversationMessage,
    PromptContext,
    ItinerarySummary,
    ItineraryDetail,
    AvailableCabin,
} from '../types';
import { assessFilterQuery, buildFilterSummary, hasAnyFilter } from '../cruiseFilterParser';
import { classifyQuerySource } from '../queryClassifier';
import { getSearchAssistantConfig } from './searchAssistantService';
import { getBookingAssistantConfig } from './bookingAssistantService';

// ── Assistant config contract ─────────────────────────────────────────────────

export interface AssistantConfig {
    systemPrompt: string;
    tools: any[];
    mapActions: (parts: any[]) => AssistantAction[];
    fallbackMessage: (actions: AssistantAction[]) => string;
}

// ── Configuration ─────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite'];

/** Number of most-recent turns to send verbatim; older turns are compressed. */
const MAX_RECENT_TURNS = 6; // 3 exchanges

/** Max chars preserved per older turn message (≈ 30 tokens). */
const SUMMARY_CHARS_PER_TURN = 120;

// ── History compression ───────────────────────────────────────────────────────
// Older turns are truncated and collapsed into a synthetic summary pair so the
// model still has prior context without paying full per-token cost for stale text.

function compressHistory(history: ConversationMessage[]): ConversationMessage[] {
    if (history.length <= MAX_RECENT_TURNS) return history;

    const older = history.slice(0, history.length - MAX_RECENT_TURNS);
    const recent = history.slice(-MAX_RECENT_TURNS);

    const summaryText = older
        .map(h => `${h.role === 'user' ? 'U' : 'A'}: ${h.content.slice(0, SUMMARY_CHARS_PER_TURN).replace(/\n/g, ' ')}`)
        .join(' | ');

    return [
        { role: 'user',      content: `[Earlier context summary] ${summaryText}` },
        { role: 'assistant', content: 'Understood, I have the earlier context.' },
        ...recent,
    ];
}

// ── Deterministic short-circuit ───────────────────────────────────────────────
// Only applies on the search/listing page (no itineraryDetail, no cabins).
// Returns a complete AssistantResponse if we can answer without the LLM;
// returns null to fall through to the normal Gemini call.

function tryShortCircuit(ctx: PromptContext): AssistantResponse | null {
    // Booking pages always need the LLM — context is too rich for deterministic parsing
    if (ctx.itineraryDetail || (ctx.availableCabins?.length ?? 0) > 0) return null;

    // No filter data available (e.g. homepage) — the parser has nothing to match against,
    // so all short-circuit checks would produce false results. Let the LLM handle it.
    const hasFilterData = ctx.availablePorts.length > 0 || ctx.availableOrigins.length > 0 || ctx.availableDates.length > 0;
    if (!hasFilterData) return null;

    const assessment = assessFilterQuery(
        ctx.userMessage,
        ctx.availablePorts,
        ctx.availableOrigins,
        ctx.availableDates,
        ctx.availableNights,
    );

    // Generic search phrase with no specific filters (e.g. "find a cruise", "search cruises").
    // Only intercept when the message looks like a search intent — conversational
    // questions like "is this good for my family?" or "which destination is available?" must pass through to the LLM.
    const SEARCH_SIGNAL = /\b(find|search|show|filter|look for|browse|list|display|see all|cruises?|looking for)\b/i;
    const IS_QUESTION = /[?]|\b(what|which|how|where|when|who|tell me|is there|are there|do you have|can you)\b/i;
    if (!assessment.parsed.resetAll && !hasAnyFilter(assessment.parsed) && SEARCH_SIGNAL.test(ctx.userMessage) && !IS_QUESTION.test(ctx.userMessage)) {
        return {
            message: "Any preference on destination, month, or trip duration?",
            actions: [],
            confidence: 0.9,
        };
    }

    if (!assessment.shouldShortCircuit) return null;

    const action: AssistantAction = assessment.parsed.resetAll
        ? { type: 'RESET_FILTERS' }
        : { type: 'APPLY_FILTERS', filters: { ...assessment.parsed, resetAll: false } };

    const message = assessment.parsed.resetAll
        ? "I've cleared all filters. Showing all available cruises."
        : buildFilterSummary(assessment.parsed);

    return {
        message,
        actions: [action],
        confidence: assessment.confidence,
    };
}

// ── Routing ───────────────────────────────────────────────────────────────────

function selectAssistant(ctx: PromptContext): AssistantConfig {
    return (ctx.itineraryDetail || (ctx.availableCabins?.length ?? 0) > 0)
        ? getBookingAssistantConfig(ctx)
        : getSearchAssistantConfig(ctx);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(message: string): AssistantResponse {
    return { message, actions: [], confidence: 0.1 };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getChatbotResponse(
    conversationHistory: ConversationMessage[],
    userMessage: string,
    availablePorts: string[],
    availableOrigins: string[],
    availableDates: string[],
    availableNights: number[],
    itineraries: ItinerarySummary[],
    itineraryDetail?: ItineraryDetail,
    availableCabins?: AvailableCabin[],
): Promise<AssistantResponse> {
    if (!GEMINI_API_KEY) {
        return errorResponse(
            'Nyra is not configured yet. Please add your Gemini API key (REACT_APP_GEMINI_API_KEY) to the .env file and restart the app.',
        );
    }

    // Pull a snippet from the last assistant message so KB retrieval stays
    // on-topic during follow-ups like "what are the charges?" after a wifi answer.
    const lastAssistant = [...conversationHistory].reverse().find(h => h.role === 'assistant');
    const recentContext = lastAssistant?.content.slice(0, 150);

    // ── Stage 0: classify query source priority
    const hasLiveContext =
        itineraries.length > 0 ||
        !!itineraryDetail ||
        (availableCabins?.length ?? 0) > 0;
    const querySource = classifyQuerySource(userMessage, hasLiveContext);

    const ctx: PromptContext = {
        availablePorts, availableOrigins, availableDates, availableNights,
        itineraries, userMessage, itineraryDetail, availableCabins, recentContext,
        skipDetailedKb: querySource === 'live',
    };

    // ── Stage 1: short-circuit (zero LLM cost for high-confidence filter queries)
    const shortCircuit = tryShortCircuit(ctx);
    if (shortCircuit) return shortCircuit;

    // ── Stage 2: select assistant (determines prompt + tool set)
    const assistant = selectAssistant(ctx);

    // ── Stage 3: compress history (reduces token cost for long conversations)
    const compressedHistory = compressHistory(conversationHistory);

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        let candidate: any = null;

        for (const modelName of MODELS) {
            try {
                const model = genAI.getGenerativeModel(
                    { model: modelName, systemInstruction: assistant.systemPrompt, tools: assistant.tools },
                    { apiVersion: 'v1beta' },
                );
                const history: Content[] = compressedHistory.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                }));
                const chat = model.startChat({ history });
                const result = await chat.sendMessage(userMessage);
                candidate = result.response.candidates?.[0];
                if (candidate?.content?.parts) break;
            } catch (modelError: any) {
                console.warn(`Model ${modelName} failed, trying next...`, modelError?.message);
            }
        }

        if (!candidate?.content?.parts) {
            return { message: "I'm sorry, I couldn't process that. Could you try rephrasing?", actions: [], confidence: 0.5 };
        }

        const parts: any[] = candidate.content.parts;
        let textMessage = parts.filter(p => p.text).map((p: any) => p.text).join('');
        const actions = assistant.mapActions(parts);

        if (!textMessage) {
            textMessage = assistant.fallbackMessage(actions);
        }

        const confidence = actions.length > 0 ? 1.0 : 0.9;
        const needsAuth = actions.some(a => a.type === 'PROCEED_TO_BOOKING') || undefined;

        return { message: textMessage, actions, confidence, needsAuth };

    } catch (error: any) {
        console.error('Gemini API error:', error);

        if (error?.message?.includes('API_KEY') || error?.status === 401) {
            return errorResponse('Invalid API key. Please check your REACT_APP_GEMINI_API_KEY in the .env file.');
        }
        if (error?.status === 429 || error?.message?.includes('quota')) {
            return errorResponse('Too many requests. Please wait a moment and try again.');
        }

        return errorResponse("Sorry, I'm having trouble connecting right now. Please try again or use the filters above.");
    }
}
