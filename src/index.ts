import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { execute, subscribe } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers';
import { connectToDatabase } from './db';
import { ResponseDataSource } from './datasources';

const app = express();
const httpServer = createServer(app);
const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');
const PORT = process.env.PORT || 4000; // setted by Heroku
const schema = makeExecutableSchema({ typeDefs, resolvers });
export const pubsub = new PubSub();

const mount = async () => {
  const { collections } = await connectToDatabase();
  const { responses } = collections;
  if (!responses) {
    throw new Error('No DB connection available');
  }
  let subscriptionServer: SubscriptionServer;

  const server = new ApolloServer({
    schema,
    context: () => ({ pubsub }),
    dataSources: () => ({
      responses: new ResponseDataSource(responses),
    }),
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
  });

  try {
    await server.start();
    server.applyMiddleware({ app, path: '/' });
    subscriptionServer = SubscriptionServer.create(
      { schema, execute, subscribe },
      { server: httpServer, path: server.graphqlPath }
    );
    // Start the server
    httpServer.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
      console.log(`🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error(`GraphQL server error: ${error}`);
  }
};
if (process.env.NODE_ENV !== 'test') {
  mount().catch(console.error);
}
