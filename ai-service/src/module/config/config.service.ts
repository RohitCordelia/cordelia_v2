import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

@Injectable()
export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor() {
    const envFile = fs.existsSync('.env') ? '.env' : '.env.example';
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key] ?? process.env[key] ?? '';
  }

  get port(): number { return parseInt(this.get('PORT') || '3001'); }
  get nodeEnv(): string { return this.get('NODE_ENV') || 'development'; }
  get isDev(): boolean { return this.nodeEnv === 'development'; }
  get isProd(): boolean { return this.nodeEnv === 'production'; }

  // Database
  get dbHost(): string { return this.get('DATABASE_HOST'); }
  get dbPort(): number { return parseInt(this.get('DATABASE_PORT') || '5432'); }
  get dbUser(): string { return this.get('DATABASE_USER'); }
  get dbPassword(): string { return this.get('DATABASE_PASSWORD'); }
  get dbName(): string { return this.get('DATABASE_NAME'); }

  // Redis
  get redisHost(): string { return this.get('REDIS_HOST') || 'localhost'; }
  get redisPort(): number { return parseInt(this.get('REDIS_PORT') || '6379'); }
  get redisPassword(): string { return this.get('REDIS_PASSWORD'); }

  // AI keys
  get googleAiKey(): string { return this.get('GOOGLE_GENERATIVE_AI_API_KEY'); }
  get openAiKey(): string { return this.get('OPENAI_API_KEY'); }

  // Vector store — 'pgvector' (default) or 'pinecone'
  get vectorStore(): string { return this.get('VECTOR_STORE') || 'pgvector'; }
  get pineconeApiKey(): string { return this.get('PINECONE_API_KEY'); }
  get pineconeIndex(): string { return this.get('PINECONE_INDEX') || 'cordelia-kb'; }

  // External APIs
  get nestjsApiUrl(): string { return this.get('NESTJS_API_BASE_URL'); }
  get railsApiUrl(): string { return this.get('RAILS_API_BASE_URL'); }
  get railsApiKey(): string { return this.get('RAILS_API_KEY'); }

  // Langfuse
  get langfusePublicKey(): string { return this.get('LANGFUSE_PUBLIC_KEY'); }
  get langfuseSecretKey(): string { return this.get('LANGFUSE_SECRET_KEY'); }
  get langfuseBaseUrl(): string { return this.get('LANGFUSE_BASE_URL'); }

  // CORS
  get corsOrigins(): string[] {
    return (this.get('CORS_ORIGINS') || 'http://localhost:3000').split(',');
  }
}
