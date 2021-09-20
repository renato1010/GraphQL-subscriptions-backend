"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pubsub = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const apollo_server_express_1 = require("apollo-server-express");
const express_1 = __importDefault(require("express"));
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const schema_1 = require("@graphql-tools/schema");
const cors_1 = __importDefault(require("cors"));
const resolvers_1 = require("./resolvers");
const db_1 = require("./db");
const datasources_1 = require("./datasources");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' }));
const httpServer = (0, http_1.createServer)(app);
const typeDefs = fs_1.default.readFileSync(path_1.default.join(__dirname, 'schema.graphql'), 'utf-8');
const PORT = process.env.PORT || 4000; // setted by Heroku
const schema = (0, schema_1.makeExecutableSchema)({ typeDefs, resolvers: resolvers_1.resolvers });
exports.pubsub = new graphql_subscriptions_1.PubSub();
const mount = async () => {
    const { collections } = await (0, db_1.connectToDatabase)();
    const { responses } = collections;
    if (!responses) {
        throw new Error('No DB connection available');
    }
    let subscriptionServer;
    const server = new apollo_server_express_1.ApolloServer({
        schema,
        context: () => ({ pubsub: exports.pubsub }),
        dataSources: () => ({
            responses: new datasources_1.ResponseDataSource(responses),
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
        subscriptionServer = subscriptions_transport_ws_1.SubscriptionServer.create({ schema, execute: graphql_1.execute, subscribe: graphql_1.subscribe }, { server: httpServer, path: server.graphqlPath });
        // Start the server
        httpServer.listen(PORT, () => {
            // eslint-disable-next-line no-console
            console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
            console.log(`🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`);
        });
    }
    catch (error) {
        console.error(`GraphQL server error: ${error}`);
    }
};
if (process.env.NODE_ENV !== 'test') {
    mount().catch(console.error);
}
