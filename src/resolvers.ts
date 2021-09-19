import { IResolvers } from '@graphql-tools/utils';
import { ResponseDataSource } from 'datasources/ResponsesDataSource';
import { pubsub } from './index';

export const resolvers: IResolvers = {
  Query: {
    hello: () => 'Hello from GraphQL server',
    allResponses: (
      _parent,
      _args,
      { dataSources }: { dataSources: { responses: ResponseDataSource } }
    ) => {
      const { responses } = dataSources;
      return responses.getAllResponses();
    },
  },
  Mutation: {
    createResponse: async (
      _,
      { input }: { input: { response: string } },
      { dataSources }: { dataSources: { responses: ResponseDataSource } }
    ) => {
      const { response } = input;
      const { responses } = dataSources;
      const id = await responses.createResponse(response);
      const newResponse = await responses.getResponseById(id);
      pubsub.publish('NEW_RESPONSE', { newResponseAdded: newResponse });
      return id;
    },
  },
  Subscription: {
    newResponseAdded: {
      subscribe: () => pubsub.asyncIterator('NEW_RESPONSE'),
    },
  },
};
