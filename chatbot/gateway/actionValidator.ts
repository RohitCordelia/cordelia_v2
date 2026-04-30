// Stateless action validator.
//
// validateAction() runs a single AssistantAction through three gates in order:
//
//   Gate 1 — AI permission  (allowedForAI: false → immediate reject)
//   Gate 2 — Auth           (requiresAuth + !isLoggedIn → needs_auth)
//   Gate 3 — Page context   (action only valid on certain pages / with certain data)
//   Gate 4 — Confirmation   (requiresConfirmation → deferred, surfaces prompt to user)
//
// All gates are pure functions: no state, no side-effects.

import { AssistantAction } from '../types';
import { ActionPolicy, getPolicy } from './actionPolicy';

// ── Context passed by the caller (the hook or component) ─────────────────────

export type PageContext = 'search' | 'itinerary' | 'cabin' | 'checkout' | 'unknown';

export interface ExecutionContext {
    isLoggedIn: boolean;
    page: PageContext;
    /** Present when user is on an itinerary detail page */
    itineraryId?: string;
    /** Present when a booking has been created (needed for invoice actions) */
    bookingId?: string;
    /** For audit correlation — set from your auth/session layer */
    userId?: string;
    /** True when itinerary detail data has finished loading */
    hasItineraryDetail?: boolean;
    /** True when cabin options are loaded on the cabin-select page */
    hasCabinData?: boolean;
    /** IDs of itineraries currently displayed on the search page */
    availableItineraryIds?: string[];
}

// ── Validation result ─────────────────────────────────────────────────────────

export type ValidationStatus =
    | 'approved'            // run the action immediately
    | 'needs_auth'          // blocked; tell user to log in
    | 'needs_confirmation'  // deferred; surface confirmationPrompt in the UI
    | 'rejected';           // hard block; tell user it cannot be done

export interface ValidationResult {
    status: ValidationStatus;
    policy: ActionPolicy;
    /**
     * Human-facing message.
     * - needs_auth / rejected: shown as a bot message in the chat
     * - needs_confirmation:    NOT shown; use confirmationPrompt instead
     * - approved:              empty string
     */
    message: string;
    /** Only set when status === 'needs_confirmation' */
    confirmationPrompt?: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function validateAction(
    action: AssistantAction,
    ctx: ExecutionContext,
): ValidationResult {
    const policy = getPolicy(action.type);

    // Gate 1: AI permission ───────────────────────────────────────────────────
    if (!policy.allowedForAI) {
        return {
            status: 'rejected',
            policy,
            message:
                'This action cannot be performed automatically. Please complete this step yourself.',
        };
    }

    // Gate 2: Auth ────────────────────────────────────────────────────────────
    if (policy.requiresAuth && !ctx.isLoggedIn) {
        return {
            status: 'needs_auth',
            policy,
            message: `Please log in to continue — ${policy.label.toLowerCase()} requires an account.`,
        };
    }

    // Gate 3: Page context ────────────────────────────────────────────────────
    const contextError = validatePageContext(action, ctx);
    if (contextError) {
        return { status: 'rejected', policy, message: contextError };
    }

    // Gate 4: Confirmation ────────────────────────────────────────────────────
    if (policy.requiresConfirmation) {
        return {
            status: 'needs_confirmation',
            policy,
            message: '',
            confirmationPrompt: buildConfirmationPrompt(action, policy),
        };
    }

    return { status: 'approved', policy, message: '' };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function validatePageContext(action: AssistantAction, ctx: ExecutionContext): string | null {
    switch (action.type) {
        case 'PROCEED_TO_BOOKING':
            if (ctx.page !== 'itinerary' || !ctx.itineraryId) {
                return 'Booking can only be started from an itinerary page.';
            }
            if (!ctx.hasItineraryDetail) {
                return 'Itinerary details are still loading. Please wait a moment and try again.';
            }
            break;

        case 'UPDATE_CABIN_SELECTION':
            if (ctx.page !== 'cabin') {
                return 'Cabin selection is only available on the cabin selection page.';
            }
            if (!ctx.hasCabinData) {
                return 'Cabin options are still loading. Please wait a moment and try again.';
            }
            break;

        case 'OPEN_ITINERARY':
            if (ctx.availableItineraryIds?.length && !ctx.availableItineraryIds.includes(action.itineraryId)) {
                return 'That itinerary is not currently displayed. Please try a different selection.';
            }
            break;

        case 'SEND_INVOICE':
            if (!ctx.bookingId) {
                return 'No active booking found to send an invoice for.';
            }
            break;

        case 'GO_TO_CHECKOUT':
            if (!action.itineraryId) {
                return 'Cannot proceed to checkout without a selected itinerary.';
            }
            break;
    }
    return null;
}

function buildConfirmationPrompt(action: AssistantAction, policy: ActionPolicy): string {
    switch (action.type) {
        case 'SEND_INVOICE':
            return `Send the booking invoice to ${action.recipientEmail}?`;
        case 'GO_TO_CHECKOUT':
            return `Proceed to the payment page now?`;
        case 'FINALIZE_PAYMENT':
            // This branch is unreachable in practice (blocked by Gate 1)
            return `Complete payment of ${action.currency} ${action.amount}? This cannot be undone.`;
        default:
            return `Confirm: ${policy.label}?`;
    }
}
