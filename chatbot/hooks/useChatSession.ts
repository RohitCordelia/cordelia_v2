import { useState, useEffect, useRef, useCallback } from 'react';
import { getChatbotResponse } from '../services/chatRouter';
import {
    ChatMessage,
    ItinerarySummary,
    ItineraryDetail,
    AvailableCabin,
    AssistantResponse,
    ConversationMessage,
    BotPageContext,
} from '../types';

export const CHAT_SESSION_KEY = 'nyra_chat_history';
const SESSION_AI_KEY = 'nyra_ai_history';

const WELCOME_MESSAGE =
    "Hi! I'm Nyra, your personal cruise concierge. Ask me anything about Cordelia Cruises — from finding the right cruise to cabins, dining, destinations, and more.";

// Fallback booking-intent detection for messages where the model didn't fire
// a PROCEED_TO_BOOKING tool call (e.g., user typed a colloquial phrase on the
// itinerary detail page).
const BOOKING_INTENT_RE =
    /\b(book|proceed|continue|next step|select cabin|choose cabin|pick cabin|go ahead|let'?s go|i want this|reserve|confirm booking|take me|go to next)\b/i;

let counter = 0;
const genId = () => `msg_${++counter}_${Date.now()}`;

export interface UseChatSessionOptions {
    /** Structured page context — preferred over individual props. */
    pageContext?: BotPageContext;
    // Legacy individual props — used when pageContext is absent.
    availablePorts?: string[];
    availableOrigins?: string[];
    availableDates?: string[];
    availableNights?: number[];
    itineraries?: ItinerarySummary[];
    itineraryDetail?: ItineraryDetail;
    availableCabins?: AvailableCabin[];
    isLoggedIn?: boolean;
    onResponse: (response: AssistantResponse, botText: string, userMessage: string) => void;
}

export function useChatSession(opts: UseChatSessionOptions) {
    // Resolve from structured pageContext when available, legacy props as fallback
    const pc = opts.pageContext;
    const search = pc?.pageType === 'search' ? pc : undefined;
    const cabin = pc?.pageType === 'cabin-select' ? pc : undefined;
    const itin = pc?.pageType === 'itinerary' ? pc : undefined;

    const availablePorts = search?.filters.ports ?? opts.availablePorts ?? [];
    const availableOrigins = search?.filters.origins ?? opts.availableOrigins ?? [];
    const availableDates = search?.filters.dates ?? opts.availableDates ?? [];
    const availableNights = search?.filters.nights ?? opts.availableNights ?? [];
    const itineraries = search?.results.itineraries ?? opts.itineraries ?? [];
    const itineraryDetail = itin?.itinerary ?? cabin?.itinerary ?? opts.itineraryDetail;
    const availableCabins = cabin?.cabins ?? opts.availableCabins;
    const isLoggedIn = pc ? pc.booking.isLoggedIn : (opts.isLoggedIn ?? false);
    const onResponse = opts.onResponse;
    const initMessages = (): ChatMessage[] => {
        try {
            const saved = sessionStorage.getItem(CHAT_SESSION_KEY);
            return saved ? JSON.parse(saved) : [{ id: genId(), text: WELCOME_MESSAGE, sender: 'bot' as const }];
        } catch {
            return [{ id: genId(), text: WELCOME_MESSAGE, sender: 'bot' as const }];
        }
    };

    const initHistory = (): ConversationMessage[] => {
        try {
            const saved = sessionStorage.getItem(SESSION_AI_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };

    const [messages, setMessages] = useState<ChatMessage[]>(initMessages);
    const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>(initHistory);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Refs for stable async access — updated every render, never in dep arrays
    const itinerariesRef = useRef(itineraries);
    itinerariesRef.current = itineraries;
    const itineraryDetailRef = useRef(itineraryDetail);
    itineraryDetailRef.current = itineraryDetail;
    const isLoggedInRef = useRef(isLoggedIn);
    isLoggedInRef.current = isLoggedIn;
    const onResponseRef = useRef(onResponse);
    onResponseRef.current = onResponse;

    // Only persist once the user has sent at least one message.
    // messages.length <= 1 means only the welcome message exists — welcome screen state
    // should never be written to sessionStorage so the panel always starts fresh.
    useEffect(() => {
        if (messages.length <= 1) return;
        try { sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(messages)); } catch {}
    }, [messages]);

    useEffect(() => {
        if (conversationHistory.length === 0) return;
        try { sessionStorage.setItem(SESSION_AI_KEY, JSON.stringify(conversationHistory)); } catch {}
    }, [conversationHistory]);

    const addBotMessage = useCallback((text: string) => {
        setMessages(prev => [...prev, { id: genId(), text, sender: 'bot' as const }]);
    }, []);

    const startNewChat = useCallback(() => {
        sessionStorage.removeItem(CHAT_SESSION_KEY);
        sessionStorage.removeItem(SESSION_AI_KEY);
        setMessages([{ id: genId(), text: WELCOME_MESSAGE, sender: 'bot' }]);
        setConversationHistory([]);
        setInputValue('');
    }, []);

    const handleSend = useCallback(async (text?: string) => {
        const message = (text !== undefined ? text : inputValue).trim();
        if (!message || isTyping) return;

        setMessages(prev => [...prev, { id: genId(), text: message, sender: 'user' }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await getChatbotResponse(
                conversationHistory,
                message,
                availablePorts,
                availableOrigins,
                availableDates,
                availableNights,
                itinerariesRef.current,
                itineraryDetailRef.current,
                availableCabins,
            );

            setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: message },
                { role: 'assistant', content: response.message },
            ]);

            const currentDetail = itineraryDetailRef.current;
            // needsAuth is set by aiService when PROCEED_TO_BOOKING is present;
            // BOOKING_INTENT_RE catches colloquial phrases on the itinerary detail page.
            const isBookingIntent =
                response.needsAuth === true ||
                (!!currentDetail?.id && BOOKING_INTENT_RE.test(message));

            const botText = isBookingIntent && !isLoggedInRef.current
                ? 'Please log in first to proceed with booking.'
                : isBookingIntent && isLoggedInRef.current && !response.needsAuth
                    ? 'Taking you to cabin selection now!'
                    : response.message;

            setMessages(prev => [...prev, { id: genId(), text: botText, sender: 'bot' }]);
            onResponseRef.current(response, botText, message);
        } catch {
            setMessages(prev => [
                ...prev,
                { id: genId(), text: 'Sorry, something went wrong. Please try again.', sender: 'bot' },
            ]);
        } finally {
            setIsTyping(false);
        }
    }, [inputValue, isTyping, conversationHistory, availablePorts, availableOrigins, availableDates, availableNights, availableCabins]);

    return {
        messages,
        inputValue,
        setInputValue,
        isTyping,
        handleSend,
        startNewChat,
        addBotMessage,
    };
}
