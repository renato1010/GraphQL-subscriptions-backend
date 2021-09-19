"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const index_1 = require("./index");
exports.resolvers = {
    Query: {
        hello: () => 'Hello from GraphQL server',
        allResponses: (_parent, _args, { dataSources }) => {
            const { responses } = dataSources;
            return responses.getAllResponses();
        },
    },
    Mutation: {
        createResponse: async (_, { input }, { dataSources }) => {
            const { response } = input;
            const { responses } = dataSources;
            const id = await responses.createResponse(response);
            const newResponse = await responses.getResponseById(id);
            index_1.pubsub.publish('NEW_RESPONSE', { newResponseAdded: newResponse });
            return id;
        },
    },
    Subscription: {
        newResponseAdded: {
            subscribe: () => index_1.pubsub.asyncIterator('NEW_RESPONSE'),
        },
    },
};
