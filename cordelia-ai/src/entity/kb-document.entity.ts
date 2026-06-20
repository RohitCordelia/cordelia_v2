import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { KbChunk } from './kb-chunk.entity';

@Entity({ name: 'kb_document' })
export class KbDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Stable logical identity for idempotent re-ingestion. Never changes for a
  // given document; renaming it is treated as delete-old + create-new.
  @Column({ name: 'source_key', type: 'text', unique: true })
  sourceKey: string;

  @Column({ type: 'text' })
  source: string; // faq | policy | cms | call_mined

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', default: 'en' })
  locale: string; // en | hi | hinglish

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>; // topic, ship, entityType, priority, tags

  // Commit marker — set only after chunks are durably written. Hash inputs include
  // the embedding/chunking versions so an algorithm change forces re-index.
  @Column({ name: 'content_hash', type: 'text', nullable: true })
  contentHash: string;

  @Column({ name: 'embedding_version', type: 'int', default: 1 })
  embeddingVersion: number;

  @Column({ name: 'chunking_version', type: 'int', default: 1 })
  chunkingVersion: number;

  @Column({ name: 'last_ingested_at', type: 'timestamptz', nullable: true })
  lastIngestedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => KbChunk, (chunk) => chunk.document, { cascade: true })
  chunks: KbChunk[];
}
