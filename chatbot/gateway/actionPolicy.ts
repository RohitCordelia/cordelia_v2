// Action policy table — the single source of truth for what each action is
// allowed to do, what gates it, and what risk level it carries.
//
// RULES:
//   allowedForAI: false  → gateway rejects unconditionally; AI can never execute it
//   requiresAuth: true   → blocked unless ExecutionContext.isLoggedIn is true
//   requiresConfirmation → deferred until user explicitly confirms in the UI
//
// TO ADD a new action:
//   1. Add its type to the AssistantAction union in types.ts
//   2. Add a row here — be conservative with risk and gates
//   3. Add a dispatch case in useAssistantActions.ts

import type { AssistantAction } from '../types';

export type RiskLevel =
    | 'low'       // safe UI change, no side-effects beyond the session
    | 'medium'    // navigates to a new page or mutates booking state
    | 'high'      // touches data that has billing or communication impact
    | 'forbidden'; // AI must never execute this regardless of context

export interface ActionPolicy {
    risk: RiskLevel;
    /** If true and user is not logged in, block and return needs_auth status */
    requiresAuth: boolean;
    /** If true, pause execution and surface a confirmation prompt to the user */
    requiresConfirmation: boolean;
    /** Hard gate — false means the action is categorically off-limits for AI */
    allowedForAI: boolean;
    /** Short human-readable label used in audit entries and confirmation prompts */
    label: string;
}

// Every member of the AssistantAction discriminated union must have a row here.
// TypeScript enforces exhaustiveness via the PolicyMap type below.
type PolicyMap = { [K in AssistantAction['type']]: ActionPolicy };

export const ACTION_POLICIES: PolicyMap = {
    // ── No-risk navigation / filter changes ────────────────────────────────
    APPLY_FILTERS: {
        risk: 'low',
        requiresAuth: false,
        requiresConfirmation: false,
        allowedForAI: true,
        label: 'Apply cruise search filters',
    },
    RESET_FILTERS: {
        risk: 'low',
        requiresAuth: false,
        requiresConfirmation: false,
        allowedForAI: true,
        label: 'Reset all search filters',
    },
    OPEN_ITINERARY: {
        risk: 'low',
        requiresAuth: false,
        requiresConfirmation: false,
        allowedForAI: true,
        label: 'Open itinerary detail page',
    },
    HANDOFF_TO_SUPPORT: {
        risk: 'low',
        requiresAuth: false,
        requiresConfirmation: false,
        allowedForAI: true,
        label: 'Transfer to support agent',
    },

    // ── Medium risk: booking flow ───────────────────────────────────────────
    PROCEED_TO_BOOKING: {
        risk: 'medium',
        requiresAuth: true,
        requiresConfirmation: false,
        allowedForAI: true,
        label: 'Proceed to cabin selection',
    },
    UPDATE_CABIN_SELECTION: {
        risk: 'medium',
        requiresAuth: false,   // user is already in the booking flow; auth happened earlier
        requiresConfirmation: false,
        allowedForAI: true,
        label: 'Update cabin and guest selection',
    },
    GO_TO_CHECKOUT: {
        risk: 'medium',
        requiresAuth: true,
        requiresConfirmation: false,
        allowedForAI: true,
        label: 'Navigate to payment checkout',
    },

    // ── High risk: external communication ──────────────────────────────────
    SEND_INVOICE: {
        risk: 'high',
        requiresAuth: true,
        requiresConfirmation: true,   // user must explicitly approve before we send an email
        allowedForAI: true,
        label: 'Send booking invoice by email',
    },

    // ── Forbidden: payment must always be user-initiated ───────────────────
    FINALIZE_PAYMENT: {
        risk: 'forbidden',
        requiresAuth: true,
        requiresConfirmation: true,
        allowedForAI: false,         // hard block regardless of auth or context
        label: 'Finalize payment — AI forbidden',
    },
};

export function getPolicy(type: AssistantAction['type']): ActionPolicy {
    return ACTION_POLICIES[type];
}
