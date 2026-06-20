import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from './module/config/config.module';
import { ConfigService } from './module/config/config.service';
import { DatabaseModule } from './module/database/database.module';
import { RetrievalModule } from './module/retrieval/retrieval.module';
import { AgentModule } from './module/agent/agent.module';
import { ChatModule } from './module/chat/chat.module';
import { IngestionModule } from './module/ingestion/ingestion.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword || undefined,
        },
      }),
    }),
    RetrievalModule,
    AgentModule,
    ChatModule,
    IngestionModule,
  ],
})
export class AppModule {}
