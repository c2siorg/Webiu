import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Contributor {
  @Field()
  login: string;

  @Field(() => Int)
  contributions: number;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field(() => [String])
  repos: string[];
}
