import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AssistantResponse, ItinerarySummary, ItineraryDetail, AvailableCabin, CabinSelection, ExtractedFilters, BotPageContext } from './types';
import { useChatSession, CHAT_SESSION_KEY } from './hooks/useChatSession';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { useAssistantActions } from './hooks/useAssistantActions';
import { getSuggestions } from './suggestions';
import { ChatWindow } from './components/chat/ChatWindow';
import { GetContact } from '../../utils/store/store';
import './chatbot.css';

// TEMP: restrict chatbot to these test phone numbers — remove after testing
const TEMP_TEST_PHONES = ['7004814010', '8097465602'];

interface CruiseChatbotProps {
    /** Structured page context — preferred over individual props when provided. */
    pageContext?: BotPageContext;
    // Legacy individual props — accepted for pages not yet migrated to pageContext.
    availablePorts?: string[];
    availableOrigins?: string[];
    availableDates?: string[];
    availableNights?: number[];
    itineraryCount?: number;
    isLoading?: boolean;
    itineraries?: ItinerarySummary[];
    onApplyFilters?: (filters: ExtractedFilters) => void;
    onResetFilters?: () => void;
    itineraryDetail?: ItineraryDetail;
    isLoggedIn?: boolean;
    availableCabins?: AvailableCabin[];
    onSelectCabin?: (selection: CabinSelection) => void;
}

export default function CruiseChatbot(props: CruiseChatbotProps) {
    // TEMP: only show chatbot for test phone numbers — remove after testing
    const contact = GetContact();
    const phone = typeof contact === 'string' ? contact : contact?.phone;
    const isTestUser = TEMP_TEST_PHONES.includes(phone);

    const [isOpen, setIsOpen] = useState(() => !!sessionStorage.getItem(CHAT_SESSION_KEY));
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isInitialMount = useRef(true);

    // Ref-based bridge so onResponse can reference voice/actions without circular hook deps
    const speakRef = useRef<(t: string) => void>(() => { });
    const execActionsRef = useRef<(r: AssistantResponse, msg: string) => void>(() => { });

    const handleResponse = useCallback(
        (aiResponse: AssistantResponse, botText: string, userMessage: string) => {
            speakRef.current(botText);
            execActionsRef.current(aiResponse, userMessage);
        },
        [],
    );

    const session = useChatSession({
        pageContext: props.pageContext,
        availablePorts: props.availablePorts,
        availableOrigins: props.availableOrigins,
        availableDates: props.availableDates,
        availableNights: props.availableNights,
        itineraries: props.itineraries,
        itineraryDetail: props.itineraryDetail,
        availableCabins: props.availableCabins,
        isLoggedIn: props.isLoggedIn,
        onResponse: handleResponse,
    });

    const voice = useVoiceAssistant({
        onTranscript: session.handleSend,
        onInterimResult: session.setInputValue,
        onError: session.addBotMessage,
    });

    const actions = useAssistantActions({
        pageContext: props.pageContext,
        onApplyFilters: props.onApplyFilters,
        onResetFilters: props.onResetFilters,
        isLoggedIn: props.isLoggedIn,
        itineraryDetail: props.itineraryDetail,
        onSelectCabin: props.onSelectCabin,
        isLoading: props.isLoading,
        itineraryCount: props.itineraryCount,
        addBotMessage: session.addBotMessage,
        speakText: voice.speakText,
    });

    // ── Proactive suggestions (deterministic, no LLM) ──────────────────────
    const lastUserMsg = session.messages.filter(m => m.sender === 'user').pop()?.text;
    const suggestions = useMemo(
        () => getSuggestions(props.pageContext, lastUserMsg),
        [props.pageContext, lastUserMsg],
    );

    // Keep bridge refs current on every render
    speakRef.current = voice.speakText;
    execActionsRef.current = actions.executeActions;

    const scrollToBottom = useCallback((instant?: boolean) => {
        messagesEndRef.current?.scrollIntoView({
            behavior: instant ? ('instant' as ScrollBehavior) : 'smooth',
        });
    }, []);

    useEffect(() => {
        if (isInitialMount.current) return;
        scrollToBottom();
    }, [session.messages, session.isTyping, scrollToBottom]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
                scrollToBottom(true);
                isInitialMount.current = false;
            }, 50);
        }
    }, [isOpen]);

    const startNewChat = useCallback(() => {
        voice.stopSpeaking();
        session.startNewChat();
        actions.resetWaiting();
    }, [voice.stopSpeaking, session.startNewChat, actions.resetWaiting]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        voice.stopSpeaking();
    }, [voice.stopSpeaking]);

    // TEMP: hide chatbot for non-test users — remove after testing
    if (!isTestUser) return null;

    return (
        <>
            {!isOpen && (
                <div className='chatbot-fab' onClick={() => setIsOpen(prev => !prev)}>
                    <div className="orb " aria-label="Animated orb">
                        <img className="orb__logo" src="https://images.cordeliacruises.com/cordelia_v2/public/assets/cordelia_onlylogo.svg" alt="" />
                    </div>
                </div>
            )}
            {isOpen && (
                <ChatWindow
                    messages={session.messages}
                    isTyping={session.isTyping}
                    isListening={voice.isListening}
                    voiceEnabled={voice.voiceEnabled}
                    inputValue={session.inputValue}
                    suggestions={suggestions}
                    onInputChange={session.setInputValue}
                    onSend={session.handleSend}
                    onStartListening={voice.startListening}
                    onStopListening={voice.stopListening}
                    onToggleVoice={voice.toggleVoice}
                    onNewChat={startNewChat}
                    onClose={handleClose}
                    messagesEndRef={messagesEndRef}
                    inputRef={inputRef}
                />
            )}
        </>
    );
}
