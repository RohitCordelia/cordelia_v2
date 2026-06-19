import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { KbService } from '../retrieval/kb.service';
import { EmbeddingsService } from '../retrieval/embeddings.service';
import { FilterStateService } from './filter-state.service';
import { createNyraAgent, NyraAgent } from './nyra.agent';

@Injectable()
export class AgentService {
  constructor(
    private config: ConfigService,
    private kbService: KbService,
    private embeddingsService: EmbeddingsService,
    private filterStateService: FilterStateService,
  ) {}

  createAgent(jwtToken?: string, sessionId?: string): NyraAgent {
    return createNyraAgent(
      this.kbService,
      this.embeddingsService,
      this.config.nestjsApiUrl,
      this.config.railsApiUrl,
      jwtToken,
      this.filterStateService,
      sessionId ?? 'default',
    );
  }
}
