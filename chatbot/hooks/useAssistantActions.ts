import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AssistantResponse, AssistantAction, ItineraryDetail, CabinSelection, ExtractedFilters } from '../types';
import { runGateway, DeferredAction } from '../gateway/actionExecutor';
import type { ExecutionContext, PageContext } from '../gateway/actionValidator';

// Builds the /upcoming-cruises URL with chatbot filter params so the listing
// page picks them up on mount when navigating from another page.
function buildCruiseFilterUrl(filters: import('../types').ExtractedFilters): string {
    const p = new URLSearchParams();
    if (filters.destinations.length) p.set('destinationPorts', filters.destinations.join(','));
    if (filters.origins.length)      p.set('start',            filters.origins.join(','));
    if (filters.months.length)       p.set('dates',            filters.months.join(','));
    if (filters.nights.length)       p.set('n',                filters.nights.join(','));
    if (filters.tripType.length)     p.set('trip_type',        filters.tripType.join(','));
    const qs = p.toString();
    return `/upcoming-cruises${qs ? `?${qs}` : ''}`;
}

// Fallback booking-intent detection for colloquial phrases on the itinerary
// detail page when the model doesn't fire a PROCEED_TO_BOOKING tool call.
const BOOKING_INTENT_RE =
    /\b(book|proceed|continue|next step|select cabin|choose cabin|pick cabin|go ahead|let'?s go|i want this|reserve|confirm booking|take me|go to next)\b/i;

export interface UseAssistantActionsOptions {
    onApplyFilters: (filters: ExtractedFilters) => void;
    onResetFilters: () => void;
    isLoggedIn: boolean;
    itineraryDetail?: ItineraryDetail;
    onSelectCabin?: (selection: CabinSelection) => void;
    isLoading: boolean;
    itineraryCount: number;
    addBotMessage: (text: string) => void;
    speakText: (text: string) => void;
    /** Optional: set from your auth layer for audit correlation */
    userId?: string;
}

export function useAssistantActions({
    onApplyFilters,
    onResetFilters,
    isLoggedIn,
    itineraryDetail,
    onSelectCabin,
    isLoading,
    itineraryCount,
    addBotMessage,
    speakText,
    userId,
}: UseAssistantActionsOptions) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isOnCruisePageRef = useRef(pathname === '/upcoming-cruises');
    isOnCruisePageRef.current = pathname === '/upcoming-cruises';
    const [waitingForResults, setWaitingForResults] = useState(false);

    // pendingConfirmation: the first deferred action awaiting user Yes/No.
    // The UI should render a confirmation prompt using pendingConfirmation.confirmationPrompt
    // and call confirmDeferred() / rejectDeferred() on user input.
    const [pendingConfirmation, setPendingConfirmation] = useState<DeferredAction | null>(null);

    // ── Stable refs (updated each render, never in dep arrays) ───────────────
    const isLoggedInRef = useRef(isLoggedIn);
    isLoggedInRef.current = isLoggedIn;
    const itineraryDetailRef = useRef(itineraryDetail);
    itineraryDetailRef.current = itineraryDetail;
    const onSelectCabinRef = useRef(onSelectCabin);
    onSelectCabinRef.current = onSelectCabin;
    const onApplyFiltersRef = useRef(onApplyFilters);
    onApplyFiltersRef.current = onApplyFilters;
    const onResetFiltersRef = useRef(onResetFilters);
    onResetFiltersRef.current = onResetFilters;
    const addBotMessageRef = useRef(addBotMessage);
    addBotMessageRef.current = addBotMessage;
    const speakTextRef = useRef(speakText);
    speakTextRef.current = speakText;
    const userIdRef = useRef(userId);
    userIdRef.current = userId;

    // ── Zero-results feedback after a filter action ───────────────────────────
    useEffect(() => {
        if (waitingForResults && !isLoading) {
            if (itineraryCount === 0) {
                const msg =
                    'There are no itineraries available for this date or destination. Please try selecting a different option or adjust your preferences!';
                addBotMessageRef.current(msg);
                speakTextRef.current(msg);
            }
            setWaitingForResults(false);
        }
    }, [isLoading, waitingForResults, itineraryCount]);

    // ── Context builder ───────────────────────────────────────────────────────

    const buildContext = useCallback((): ExecutionContext => {
        const currentDetail = itineraryDetailRef.current;
        const page: PageContext = currentDetail?.id
            ? 'itinerary'
            : onSelectCabinRef.current
                ? 'cabin'
                : 'search';
        return {
            isLoggedIn: isLoggedInRef.current,
            page,
            itineraryId: currentDetail?.id,
            userId: userIdRef.current,
        };
    }, []);

    // ── Dispatcher: runs a single already-approved action ────────────────────
    // Only called for actions that have already passed the gateway.

    const dispatchAction = useCallback((action: AssistantAction) => {
        switch (action.type) {
            case 'APPLY_FILTERS':
                if (!isOnCruisePageRef.current) {
                    setTimeout(() => navigate(buildCruiseFilterUrl(action.filters)), 1000);
                } else {
                    onApplyFiltersRef.current(action.filters);
                    setWaitingForResults(true);
                }
                break;

            case 'RESET_FILTERS':
                if (!isOnCruisePageRef.current) {
                    setTimeout(() => navigate('/upcoming-cruises'), 1000);
                } else {
                    onResetFiltersRef.current();
                }
                break;

            case 'OPEN_ITINERARY':
                setTimeout(() => {
                    navigate(`/upcoming-cruises/itinerary?id=${action.itineraryId}`);
                }, 1000);
                break;

            case 'PROCEED_TO_BOOKING': {
                const detail = itineraryDetailRef.current;
                if (detail?.id) {
                    setTimeout(() => {
                        navigate(`/upcoming-cruises/selectcabin?id=${detail.id}`);
                    }, 1000);
                }
                break;
            }

            case 'UPDATE_CABIN_SELECTION':
                onSelectCabinRef.current?.(action.selection);
                break;

            case 'GO_TO_CHECKOUT':
                setTimeout(() => {
                    navigate(`/upcoming-cruises/checkout?id=${action.itineraryId}`);
                }, 1000);
                break;

            case 'SEND_INVOICE':
                // TODO: call invoicing API — POST /api/bookings/:bookingId/invoice
                // fetch(`/api/bookings/${action.bookingId}/invoice`, { method: 'POST', body: JSON.stringify({ email: action.recipientEmail }) })
                addBotMessageRef.current(`Invoice sent to ${action.recipientEmail}.`);
                break;

            case 'HANDOFF_TO_SUPPORT':
                // No-op — placeholder for future support widget integration
                break;

            case 'FINALIZE_PAYMENT':
                // Unreachable: the gateway rejects this before it reaches here.
                break;
        }
    }, [navigate]);

    // ── Confirmation callbacks ────────────────────────────────────────────────

    const confirmDeferred = useCallback(() => {
        if (!pendingConfirmation) return;
        pendingConfirmation.onConfirm();
        dispatchAction(pendingConfirmation.action);
        setPendingConfirmation(null);
    }, [pendingConfirmation, dispatchAction]);

    const rejectDeferred = useCallback(() => {
        if (!pendingConfirmation) return;
        pendingConfirmation.onReject();
        setPendingConfirmation(null);
    }, [pendingConfirmation]);

    // ── Main entry point ──────────────────────────────────────────────────────

    const executeActions = useCallback((response: AssistantResponse, userMessage: string) => {
        const ctx = buildContext();
        const currentDetail = itineraryDetailRef.current;

        const { executed, deferred, blocked } = runGateway(
            response.actions,
            ctx,
            (confirmedAction) => dispatchAction(confirmedAction),
        );

        // ── Surface messages for blocked actions ──────────────────────────────
        for (const { validation } of blocked) {
            // Don't show a message for FINALIZE_PAYMENT — the AI should never
            // generate it; if it does, silently swallow to avoid confusing the user.
            if (validation.policy.risk !== 'forbidden') {
                addBotMessageRef.current(validation.message);
            }
        }

        // ── Queue first deferred action for confirmation ──────────────────────
        // Only one confirmation dialog at a time. Subsequent deferred actions in
        // the same response are dropped — in practice the model rarely fires more
        // than one confirmation-requiring action per turn.
        if (deferred.length > 0 && !pendingConfirmation) {
            setPendingConfirmation(deferred[0]);
        }

        // ── Dispatch all approved actions ─────────────────────────────────────
        for (const action of executed) {
            dispatchAction(action);
        }

        // ── Implicit booking intent fallback ──────────────────────────────────
        // When the user types a booking phrase but the model doesn't fire the
        // PROCEED_TO_BOOKING tool (e.g., model returned only text), treat it as
        // an implicit booking intent and navigate if auth + page context allows.
        const hasExplicitProceed = response.actions.some(a => a.type === 'PROCEED_TO_BOOKING');
        const isImplicitBookingIntent =
            !hasExplicitProceed &&
            !!currentDetail?.id &&
            BOOKING_INTENT_RE.test(userMessage);

        if (isImplicitBookingIntent) {
            if (!isLoggedInRef.current) {
                addBotMessageRef.current('Please log in first to proceed with booking.');
            } else {
                setTimeout(() => {
                    navigate(`/upcoming-cruises/selectcabin?id=${currentDetail.id}`);
                }, 1000);
            }
        }
    }, [buildContext, dispatchAction, pendingConfirmation, navigate]);

    const resetWaiting = useCallback(() => setWaitingForResults(false), []);

    return {
        executeActions,
        waitingForResults,
        resetWaiting,
        /**
         * Non-null when the gateway has deferred an action for user confirmation.
         * Render pendingConfirmation.confirmationPrompt as a Yes/No prompt in the chat.
         * Call confirmDeferred() on Yes, rejectDeferred() on No.
         */
        pendingConfirmation,
        confirmDeferred,
        rejectDeferred,
    };
}
