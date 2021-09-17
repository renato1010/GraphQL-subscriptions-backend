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
const port = process.env.SERVER_PORT;
const schema = makeExecutableSchema({ typeDefs, resolvers });
const pubsub = new PubSub();

const mount = async () => {
  const { collections } = await connectToDatabase();
  const { responses } = collections;
  if (!responses) {
    throw new Error('No DB connection available');
  }
  const server = new ApolloServer({
    schema,
    dataSources: () => ({
      responses: new ResponseDataSource(responses),
    }),
  });
  try {
    await server.start();
    server.applyMiddleware({ app, path: '/' });
    SubscriptionServer.create(
      { schema, execute, subscribe },
      { server: httpServer, path: server.graphqlPath }
    );
    // Start the server
    httpServer.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
      console.log(`🚀 Subscription endpoint ready at ws://localhost:${port}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error(`GraphQL server error: ${error}`);
  }
};
if (process.env.NODE_ENV !== 'test') {
  mount().catch(console.error);
}
