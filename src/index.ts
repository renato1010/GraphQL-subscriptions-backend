import fs from 'fs'
import path from 'path'
import { ApolloServer, gql } from 'apollo-server'
import { resolvers } from './resolvers'

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8')
const port = process.env.SERVER_PORT
const mount = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })
  try {
    const { url } = await server.listen({ port: 4000 })
    console.log(`GraphQL server running at ${url}`)
  } catch (error) {
    console.error(`GraphQL server error: ${error}`)
  }
}
mount().catch(console.error)
