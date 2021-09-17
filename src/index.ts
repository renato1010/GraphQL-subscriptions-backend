import fs from 'fs'
import path from 'path'
import { ApolloServer } from 'apollo-server'
import { resolvers } from './resolvers'
import { connectToDatabase } from './db'
import { ResponseDataSource } from './datasources'

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8')
const port = process.env.SERVER_PORT
const mount = async () => {
  const { collections } = await connectToDatabase()
  const { responses } = collections
  if (!responses) {
    throw new Error('No DB connection available')
  }
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({
      responses: new ResponseDataSource(responses),
    }),
  })
  try {
    const { url } = await server.listen({ port })
    console.log(`GraphQL server running at ${url}`)
  } catch (error) {
    console.error(`GraphQL server error: ${error}`)
  }
}
mount().catch(console.error)
