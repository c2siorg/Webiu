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

@Entity('contributors')
export class Contributor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'bigint', unique: true })
  githubUserId: string;

  @Index()
  @Column()
  username: string;

  @Column()
  avatarUrl: string;

  @Column()
  profileUrl: string;

  @Column({ nullable: true })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RepositoryContributor, (rc) => rc.contributor)
  repositoryContributors: RepositoryContributor[];
}
