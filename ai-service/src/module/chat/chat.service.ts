import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AgentService } from '../agent/agent.service';
import { NyraSessionMemoryService } from '../agent/nyra-session-memory.service';
import { ChatDto } from './dto/chat.dto';

export type ChatStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'cards'; items: any[]; summary?: string; resultList?: string; fallback?: boolean; searchedState?: any }
  | { type: 'navigate'; url: string; label: string };

async function* buildStream(
  fullStream: AsyncIterable<any>,
  memoryService: NyraSessionMemoryService,
  sessionId: string,
): AsyncIterable<ChatStreamEvent> {
  let botText = '';
  let hasSentCards = false;

  // Accumulate tool-calls and tool-results to save to server-side history after stream ends
  const assistantToolContent: any[] = []; // tool-call entries for the assistant message
  const toolMessages: any[] = [];         // role:'tool' messages

  try {
    for await (const chunk of fullStream) {
      console.log('[stream chunk]', chunk.type, chunk.toolName ?? '');

      if (chunk.type === 'error') {
        console.error('[stream error chunk]', JSON.stringify(chunk.error ?? chunk));
      }

      if (chunk.type === 'text-delta' && chunk.textDelta) {
        if (hasSentCards) {
          console.log('[suppress post-cards text]', chunk.textDelta);
          continue;
        }
        botText += chunk.textDelta;
        yield { type: 'text' as const, text: chunk.textDelta };

      } else if (chunk.type === 'tool-call') {
        console.log('[tool-call]', chunk.toolName, JSON.stringify(chunk.args ?? {}));
        assistantToolContent.push({
          type: 'tool-call',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: chunk.args,
        });

      } else if (chunk.type === 'tool-result') {
        const result = chunk.result ?? {};

        if (chunk.toolName === 'search_sailings') {
          const itineraries: any[] = result.itineraries ?? [];
          console.log('[search_sailings result]', {
            count: itineraries.length,
            summary: result.summary,
            fallback: result.fallback,
          });

          // Store compact resultList in history (not full itineraries JSON)
          const compactResult = result.resultList ?? result.summary ?? `${itineraries.length} results`;
          toolMessages.push({
            role: 'tool',
            content: [{ type: 'tool-result', toolCallId: chunk.toolCallId, toolName: chunk.toolName, result: compactResult }],
          });

          if (itineraries.length > 0) {
            hasSentCards = true;
            yield {
              type: 'cards' as const,
              items: itineraries,
              summary: result.summary,
              resultList: result.resultList,
              fallback: result.fallback ?? false,
              searchedState: result.searchedState,
            };
          }
        } else if (chunk.toolName === 'build_deeplink') {
          const compactResult = typeof result === 'string' ? result : JSON.stringify(result).slice(0, 500);
          toolMessages.push({
            role: 'tool',
            content: [{ type: 'tool-result', toolCallId: chunk.toolCallId, toolName: chunk.toolName, result: compactResult }],
          });
          if (result.deeplink) {
            yield { type: 'navigate' as const, url: result.deeplink, label: result.label ?? 'Continue' };
          }
        } else {
          // Other tools: store result as string (truncate if large)
          const compactResult = typeof result === 'string'
            ? result
            : JSON.stringify(result).slice(0, 2000);
          toolMessages.push({
            role: 'tool',
            content: [{ type: 'tool-result', toolCallId: chunk.toolCallId, toolName: chunk.toolName, result: compactResult }],
          });
        }
      }
    }
  } catch (err) {
    console.error('[stream THREW]', err);
    throw err;
  } finally {
    // Persist assistant turn to server-side history
    const toSave: any[] = [];

    if (assistantToolContent.length > 0) {
      // Assistant message with tool-calls
      toSave.push({ role: 'assistant', content: assistantToolContent });
      // Paired tool-result messages
      toSave.push(...toolMessages);
    }

    // Text response (bot's final reply)
    if (botText) {
      toSave.push({ role: 'assistant', content: botText });
    }

    if (toSave.length > 0) {
      memoryService.appendMessages(sessionId, toSave);
    }

    console.log('[bot text]', botText || '(none)');
    console.log('[history saved]', toSave.length, 'messages');
  }
}

@Injectable()
export class ChatService {
  constructor(
    private agentService: AgentService,
    private memoryService: NyraSessionMemoryService,
  ) {}

  async streamResponse(dto: ChatDto): Promise<AsyncIterable<ChatStreamEvent>> {
    const sessionId: string = dto.sessionId ?? uuidv4();

    console.log('[user]', dto.query);
    console.log('[sessionId]', sessionId);

    // Load server-side conversation history (windowed to last 30 messages)
    const history = this.memoryService.getHistory(sessionId);
    console.log('[history length]', history.length);

    // Append user message to history before calling LLM
    this.memoryService.appendMessages(sessionId, [{ role: 'user', content: dto.query }]);

    // Build full messages array: history + current user message
    const messages = [...history, { role: 'user', content: dto.query }];

    const { fullStream } = await this.agentService
      .createAgent(dto.jwtToken, sessionId)
      .stream(messages, {
        temperature: 0,
        // Disable Gemini 2.5 Flash extended thinking. Without this, the thinking phase
        // causes the model to "verify state" with an empty search_sailings {} call before
        // making the real call — resulting in duplicate cards every time.
        providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
      } as any);

    return buildStream(fullStream, this.memoryService, sessionId);
  }
}
