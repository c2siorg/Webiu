import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { GsocProgram } from './gsoc-program.entity';
import { GsocMentor } from './gsoc-mentor.entity';

@Entity('gsoc_ideas')
export class GsocIdea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  programId: string;

  @Column()
  projectNumber: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  explanation: string;

  @Column({ type: 'text', nullable: true })
  expectedResults: string | null;

  @Column({ type: 'text', nullable: true })
  prerequisites: string | null;

  @Column()
  difficulty: string; // 'Easy' | 'Medium' | 'Hard'

  @Column({ default: 350 })
  durationHours: number;

  @Column({ nullable: true })
  slackChannel: string | null;

  @Column({ nullable: true })
  githubUrl: string | null;

  @Column({ type: 'varchar', default: 'DRAFT' })
  status: string; // 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => GsocProgram, (program) => program.ideas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  program: GsocProgram;

  @ManyToMany(() => GsocMentor, (mentor) => mentor.ideas)
  @JoinTable({
    name: 'gsoc_idea_mentors',
    joinColumn: {
      name: 'ideaId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'mentorId',
      referencedColumnName: 'id',
    },
  })
  mentors: GsocMentor[];
}
