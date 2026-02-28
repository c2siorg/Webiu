import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Contributor {
  @Field(() => ID)
  id: string;

  @Field()
  login: string;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field({ nullable: true })
  html_url?: string;

  @Field(() => Int)
  contributions: number;

  @Field(() => [String], { nullable: true })
  repos?: string[];

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  site_admin?: boolean;
}
