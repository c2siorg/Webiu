import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PullRequestRepository {
  @Field()
  name: string;
}

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

  @Field(() => PullRequestRepository)
  repository: PullRequestRepository;
}
