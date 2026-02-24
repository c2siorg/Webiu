import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Repository {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  html_url?: string;

  @Field({ nullable: true })
  language?: string;

  @Field(() => Int)
  stargazers_count: number;

  @Field(() => Int)
  forks_count: number;

  @Field(() => Int)
  pull_requests: number;
}
