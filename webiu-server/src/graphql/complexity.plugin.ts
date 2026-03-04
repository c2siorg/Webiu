import { ConfigService } from '@nestjs/config';
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';
import { Logger } from '@nestjs/common';

export const createComplexityPlugin = (
  configService: ConfigService,
): ApolloServerPlugin => {
  const logger = new Logger('GraphQLComplexity');
  const maxComplexity =
    configService.get<number>('GRAPHQL_MAX_COMPLEXITY') || 500;
  const defaultCost =
    configService.get<number>('GRAPHQL_DEFAULT_FIELD_COST') || 1;

  return {
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      return {
        async validationDidStart({ schema, document }) {
          return async (errors) => {
            if (errors.length > 0) {
              return;
            }

            const complexity = getComplexity({
              schema,
              query: document,
              estimators: [
                fieldExtensionsEstimator(),
                simpleEstimator({ defaultComplexity: defaultCost }),
              ],
            });

            if (complexity > maxComplexity) {
              logger.warn(
                `Query is too complex: ${complexity}. Max allowed: ${maxComplexity}`,
              );
              throw new GraphQLError(
                `Query is too complex: ${complexity}. Maximum allowed complexity is ${maxComplexity}.`,
                {
                  extensions: {
                    code: 'QUERY_TOO_COMPLEX',
                    complexity,
                    maxComplexity,
                  },
                },
              );
            }

            logger.debug(`Query complexity: ${complexity}`);
          };
        },
      };
    },
  };
};
