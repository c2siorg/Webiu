import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  stars: number;

  @Field(() => Int)
  forks: number;

  @Field({ nullable: true })
  language?: string;

  @Field(() => [String], { nullable: true })
  topics?: string[];

  @Field()
  url: string;

  @Field({ nullable: true })
  html_url?: string;

  @Field(() => Int, { nullable: true })
  open_issues?: number;

  @Field(() => Int, { nullable: true })
  pull_requests?: number;

  @Field({ nullable: true })
  owner?: string;

  @Field({ nullable: true })
  created_at?: string;

  @Field({ nullable: true })
  updated_at?: string;
}

@ObjectType()
export class ProjectConnection {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => [Project])
  repositories: Project[];
}
