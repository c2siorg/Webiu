import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { ContributorModule } from '../contributor/contributor.module';
import { ProjectResolver } from './project.resolver';
import { ContributorResolver } from './contributor.resolver';

@Module({
  imports: [ProjectModule, ContributorModule],
  providers: [ProjectResolver, ContributorResolver],
})
export class GraphqlModule {}
