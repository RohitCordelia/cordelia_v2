import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { KbDocument } from './kb-document.entity';

@Entity({ name: 'kb_chunk' })
@Unique(['document', 'chunkIndex'])
export class KbChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => KbDocument, (doc) => doc.chunks, { onDelete: 'CASCADE' })
  document: KbDocument;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId: string;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  // embedding stored as text — pgvector handles it via raw SQL
  // vector(3072) matches text-embedding-3-large dimensions
  @Column({ type: 'text', nullable: true, select: false })
  embedding: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
