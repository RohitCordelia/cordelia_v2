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

  @Column({ type: 'text' })
  source: string; // faq | policy | cms | call_mined

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', default: 'en' })
  locale: string; // en | hi | hinglish

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>; // route, ship, cabin_category, valid_from, valid_to

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => KbChunk, (chunk) => chunk.document, { cascade: true })
  chunks: KbChunk[];
}
