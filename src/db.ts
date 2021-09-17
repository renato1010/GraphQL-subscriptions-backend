import { Collection, Db, MongoClient } from 'mongodb'
import { ResponseDocument } from 'lib'

// get environment variables for database uri and database name

const uri = process.env.MONGO_URI
const dbName = process.env.MONGO_DB_NAME

export interface DbCollections {
  responses: Collection<ResponseDocument> | null
}
// create cache variables so we can cache our connection
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null
let collections: DbCollections = { responses: null }

// database connection function

async function connectToDatabase(): Promise<{
  client: MongoClient
  db: Db
  collections: DbCollections
}> {
  // check for database connection string and db name
  if (!uri || !dbName) {
    throw new Error('No URI available for MongoDB connection')
  }
  // if have cached use it
  if (cachedClient && cachedDb && collections) {
    return { client: cachedClient, db: cachedDb, collections }
  }
  // const client = new MongoClient(uri);
  try {
    const client = await MongoClient.connect(uri)
    // connect to specific database
    const db = await client.db(dbName)
    // set cache
    cachedClient = client
    cachedDb = db
    collections = { responses: db.collection('responses') }
    return { client, db, collections }
  } catch (e: any) {
    throw new Error(e?.message ?? 'error connecting to MongoDB')
  }
}
connectToDatabase().catch(console.error)

export { connectToDatabase }
