// Backward-compatibility re-export.
// This file exists so any code that previously imported from aiService.ts continues to work.
// New code should import getChatbotResponse from './services/chatRouter' directly.

export { getChatbotResponse } from './services/chatRouter';
export type {
    ExtractedFilters,
    AssistantResponse,
    AssistantAction,
    ItinerarySummary,
    ConversationMessage,
} from './types';
