import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpportunityController } from './opportunity.controller';
import { OpportunityService } from './opportunity.service';
import { Opportunity, OpportunitySchema } from './schemas/opportunity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Opportunity.name, schema: OpportunitySchema },
    ]),
  ],
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}
