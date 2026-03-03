import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ProjectResolver } from './resolvers/project.resolver';
import { ContributorResolver } from './resolvers/contributor.resolver';
import { ProjectModule } from '../project/project.module';
import { ContributorModule } from '../contributor/contributor.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req, res }) => ({ req, res }),
    }),
    ProjectModule,
    ContributorModule,
  ],
  providers: [ProjectResolver, ContributorResolver],
})
export class GraphqlModule {}
