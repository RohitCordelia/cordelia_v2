// Action gateway executor.
//
// runGateway() is the single function that processes every AI-generated action.
// It validates, classifies, and audits — but does NOT perform side-effects.
// Actual execution (navigate, API calls, state mutations) is the caller's job.
//
// Return buckets:
//
//   executed  — approved, safe to run immediately; dispatch in order
//   deferred  — waiting for user confirmation; surface confirmationPrompt in UI,
//               then call the onConfirm/onReject callbacks
//   blocked   — rejected or needs_auth; show validation.message as bot text
//   auditLog  — full trace of every decision; forward to your logging service
//
// HOW THE FRONTEND CONSUMES THIS:
//
//   const { executed, deferred, blocked, auditLog } = runGateway(actions, ctx);
//
//   // 1. Show error messages for blocked actions
//   for (const { validation } of blocked) {
//       addBotMessage(validation.message);
//   }
//
//   // 2. Queue deferred actions for user confirmation
//   if (deferred.length > 0) {
//       setPendingConfirmation(deferred[0]); // show first confirmation
//       // UI should render a Yes/No prompt using deferred[0].confirmationPrompt
//       // On Yes → call deferred[0].onConfirm()
//       // On No  → call deferred[0].onReject()
//   }
//
//   // 3. Dispatch approved actions
//   for (const action of executed) {
//       dispatchAction(action); // your switch/handler
//   }
//
//   // 4. Forward audit log (fire-and-forget)
//   auditLog.filter(e => e.policyRisk !== 'low').forEach(sendToAuditService);

import { AssistantAction } from '../types';
import { ExecutionContext, ValidationResult, validateAction } from './actionValidator';

// ── Public types ──────────────────────────────────────────────────────────────

export interface AuditEntry {
    /** Unique ID for this action invocation, useful for log correlation */
    id: string;
    timestamp: number;
    actionType: string;
    outcome: 'executed' | 'deferred' | 'rejected' | 'needs_auth';
    policyRisk: string;
    /** Present for rejected / needs_auth outcomes */
    reason?: string;
    /** From ExecutionContext — link to user session in your logging service */
    userId?: string;
}

export interface DeferredAction {
    action: AssistantAction;
    validation: ValidationResult;
    /** Surface this string in the chat UI as a Yes/No confirmation prompt */
    confirmationPrompt: string;
    /** Call this when the user approves */
    onConfirm: () => void;
    /** Call this when the user declines */
    onReject: () => void;
}

export interface BlockedAction {
    action: AssistantAction;
    validation: ValidationResult;
}

export interface GatewayResult {
    /** Safe to execute immediately — iterate and dispatch in order */
    executed: AssistantAction[];
    /** Needs user confirmation before execution */
    deferred: DeferredAction[];
    /** Rejected (forbidden or page mismatch) or needs_auth */
    blocked: BlockedAction[];
    /** Full audit trace — every action regardless of outcome */
    auditLog: AuditEntry[];
}

// ── Internal ──────────────────────────────────────────────────────────────────

let _seq = 0;
function newAuditId(): string {
    return `act_${Date.now()}_${(++_seq).toString(36)}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Process every action through the policy gateway.
 *
 * @param actions   AI-generated actions from AssistantResponse
 * @param ctx       Runtime context: auth state, current page, booking IDs, etc.
 * @param onConfirm Optional callback fired when a deferred action is confirmed.
 *                  Receives the approved action so the caller can dispatch it.
 */
export function runGateway(
    actions: AssistantAction[],
    ctx: ExecutionContext,
    onConfirm?: (action: AssistantAction) => void,
): GatewayResult {
    const result: GatewayResult = {
        executed: [],
        deferred: [],
        blocked: [],
        auditLog: [],
    };

    for (const action of actions) {
        const validation = validateAction(action, ctx);

        const entry: AuditEntry = {
            id: newAuditId(),
            timestamp: Date.now(),
            actionType: action.type,
            policyRisk: validation.policy.risk,
            userId: ctx.userId,
        };

        switch (validation.status) {
            case 'approved':
                result.executed.push(action);
                entry.outcome = 'executed';
                break;

            case 'needs_confirmation': {
                // Build the DeferredAction with bound callbacks so the UI
                // doesn't need to know anything about the action internals.
                const capturedAction = action;
                result.deferred.push({
                    action: capturedAction,
                    validation,
                    confirmationPrompt: validation.confirmationPrompt!,
                    onConfirm: () => onConfirm?.(capturedAction),
                    onReject: () => { /* no-op — caller can add telemetry here */ },
                });
                entry.outcome = 'deferred';
                break;
            }

            case 'needs_auth':
                result.blocked.push({ action, validation });
                entry.outcome = 'needs_auth';
                entry.reason = validation.message;
                break;

            case 'rejected':
                result.blocked.push({ action, validation });
                entry.outcome = 'rejected';
                entry.reason = validation.message;
                break;
        }

        result.auditLog.push(entry);
    }

    // Forward medium/high-risk entries to your logging service.
    // Replace console.info with an API call (e.g. POST /api/audit) in production.
    const notable = result.auditLog.filter(e => e.policyRisk !== 'low');
    if (notable.length > 0) {
        console.info('[ActionGateway]', notable);
    }

    return result;
}
