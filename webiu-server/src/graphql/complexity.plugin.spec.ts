import { ConfigService } from '@nestjs/config';
import { createComplexityPlugin } from './complexity.plugin';
import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { buildSchema } from 'graphql';

describe('createComplexityPlugin', () => {
  let configService: ConfigService;
  let plugin: ApolloServerPlugin;

  const mockSchema = buildSchema(`
    type Query {
      simpleField: String
      expensiveField: String
    }
  `);
  // Manually add the extension that fieldExtensionsEstimator looks for
  mockSchema.getQueryType().getFields()['expensiveField'].extensions = {
    complexity: 100,
  };

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'GRAPHQL_MAX_COMPLEXITY') return 50;
        if (key === 'GRAPHQL_DEFAULT_FIELD_COST') return 1;
        return undefined;
      }),
    } as any;

    plugin = createComplexityPlugin(configService);
  });

  it('should be defined', () => {
    expect(plugin).toBeDefined();
  });

  describe('requestDidStart', () => {
    it('should return a listener with validationDidStart', async () => {
      const listener = await (plugin as any).requestDidStart({} as any);
      expect(listener.validationDidStart).toBeDefined();
    });

    it('should allow a simple query under the threshold', async () => {
      const listener = await (plugin as any).requestDidStart({} as any);
      const validationDidStart = await listener.validationDidStart({
        schema: mockSchema,
        document: {
          kind: 'Document',
          definitions: [
            {
              kind: 'OperationDefinition',
              operation: 'query',
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  {
                    kind: 'Field',
                    name: { kind: 'Name', value: 'simpleField' },
                  },
                ],
              },
            },
          ],
        },
      } as any);

      // No errors should be thrown when calling the returned function
      await expect(validationDidStart([])).resolves.toBeUndefined();
    });

    it('should reject an expensive query over the threshold', async () => {
      const listener = await (plugin as any).requestDidStart({} as any);
      const validationDidStart = await listener.validationDidStart({
        schema: mockSchema,
        document: {
          kind: 'Document',
          definitions: [
            {
              kind: 'OperationDefinition',
              operation: 'query',
              selectionSet: {
                kind: 'SelectionSet',
                selections: [
                  {
                    kind: 'Field',
                    name: { kind: 'Name', value: 'expensiveField' },
                  },
                ],
              },
            },
          ],
        },
      } as any);

      try {
        await validationDidStart([]);
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (error.message === 'Should have thrown an error') throw error;
        expect(error).toBeInstanceOf(GraphQLError);
        expect(error.message).toContain('Query is too complex');
        expect(error.extensions.code).toBe('QUERY_TOO_COMPLEX');
        expect(error.extensions.complexity).toBe(100);
      }
    });

    it('should ignore validation if there are already errors', async () => {
      const listener = await (plugin as any).requestDidStart({} as any);
      const validationDidStart = await listener.validationDidStart({
        schema: mockSchema,
        document: {} as any, // Invalid document, but it shouldn't matter
      } as any);

      await expect(
        validationDidStart([{ message: 'Existing error' } as any]),
      ).resolves.toBeUndefined();
    });
  });
});
