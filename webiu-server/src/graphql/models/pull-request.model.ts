import { ObjectType, Field } from '@nestjs/graphql';
import { Repository } from './repository.model';

@ObjectType()
export class PullRequest {
  @Field()
  title: string;

  @Field()
  state: string;

  @Field({ nullable: true })
  mergedAt?: string;

  @Field()
  url: string;

  @Field()
  createdAt: string;

  @Field(() => Repository)
  repository: Repository;
}