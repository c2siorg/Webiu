import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GsocIdea } from './gsoc-idea.entity';

@Entity('gsoc_programs')
export class GsocProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  year: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ nullable: true })
  heroImageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  introHtml: string | null;

  @Column({ nullable: true })
  slackUrl: string | null;

  @Column({ nullable: true })
  proposalTemplateUrl: string | null;

  @Column({ nullable: true })
  githubOrgUrl: string | null;

  @Column({ type: 'varchar', default: 'DRAFT' })
  status: string; // 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => GsocIdea, (idea) => idea.program)
  ideas: GsocIdea[];
}
