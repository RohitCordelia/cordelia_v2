import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { FilterStateService } from './filter-state.service';
import { NyraSessionMemoryService } from './nyra-session-memory.service';
import { RetrievalModule } from '../retrieval/retrieval.module';

@Module({
  imports: [RetrievalModule],
  providers: [AgentService, FilterStateService, NyraSessionMemoryService],
  exports: [AgentService, FilterStateService, NyraSessionMemoryService],
})
export class AgentModule {}
