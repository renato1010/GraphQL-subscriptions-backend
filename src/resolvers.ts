import { IResolvers } from '@graphql-tools/utils'
import { ResponseDataSource } from 'datasources/ResponsesDataSource'

export const resolvers: IResolvers = {
  Query: {
    hello: () => 'Hello from GraphQL server',
    allResponses: (
      _parent,
      _args,
      { dataSources }: { dataSources: { responses: ResponseDataSource } }
    ) => {
      const { responses } = dataSources
      return responses.getAllResponses()
    },
  },
  Mutation: {
    createResponse: (
      _,
      { input }: { input: { response: string } },
      { dataSources }: { dataSources: { responses: ResponseDataSource } }
    ) => {
      const { response } = input
      const { responses } = dataSources

      return responses.createResponse(response)
    },
  },
}
