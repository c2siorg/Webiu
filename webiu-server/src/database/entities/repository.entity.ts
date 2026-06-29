import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RepositoryContributor } from './repository-contributor.entity';

@Entity('repositories')
export class Repository {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'bigint', unique: true })
  githubRepoId: string;

  @Index({ unique: true })
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ nullable: true })
  homepage: string | null;

  @Column({ type: 'simple-array', nullable: true })
  topics: string[] | null;

  @Column({ default: 0 })
  stars: number;

  @Column({ default: 0 })
  forks: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'pending' })
  syncStatus: string;

  @Column({ type: 'text', nullable: true })
  syncError: string | null;

  @Column({ nullable: true })
  reconciliationSource: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastWebhookAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastReconciliationAt: Date | null;

  @Column({ default: 'public' })
  visibility: string;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  language: string | null;

  @OneToMany(() => RepositoryContributor, (rc) => rc.repository)
  repositoryContributors: RepositoryContributor[];
}
