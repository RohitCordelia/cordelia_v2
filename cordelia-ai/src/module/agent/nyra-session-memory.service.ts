import { Injectable } from '@nestjs/common';

const HISTORY_WINDOW = 30; // keep last N messages (tool-call + tool-result count as 2)

@Injectable()
export class NyraSessionMemoryService {
  private readonly store = new Map<string, any[]>();

  getHistory(sessionId: string): any[] {
    const all = this.store.get(sessionId) ?? [];
    return all.length > HISTORY_WINDOW ? all.slice(-HISTORY_WINDOW) : all;
  }

  appendMessages(sessionId: string, messages: any[]): void {
    const current = this.store.get(sessionId) ?? [];
    this.store.set(sessionId, [...current, ...messages]);
  }

  clear(sessionId: string): void {
    this.store.delete(sessionId);
  }
}
