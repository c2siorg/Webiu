import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Repository } from './repository.entity';
import { Contributor } from './contributor.entity';

@Entity('repository_contributors')
export class RepositoryContributor {
  @PrimaryColumn()
  repositoryId: string;

  @PrimaryColumn()
  contributorId: string;

  @Column({ default: 0 })
  contributionCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastContributedAt: Date | null;

  @ManyToOne(
    () => Repository,
    (repository) => repository.repositoryContributors,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @ManyToOne(
    () => Contributor,
    (contributor) => contributor.repositoryContributors,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'contributorId' })
  contributor: Contributor;
}
