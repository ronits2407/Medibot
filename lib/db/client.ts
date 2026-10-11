import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medibot";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  offline: boolean;
  lastAttempt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  offline: false,
  lastAttempt: 0,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  // If marked offline and attempted within the last 60 seconds, fail-fast without hanging
  if (cached.offline && Date.now() - cached.lastAttempt < 60000) {
    throw new Error("MongoDB service offline, using in-memory store");
  }

  if (!cached.promise) {
    cached.lastAttempt = Date.now();
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 800,
      connectTimeoutMS: 800,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      cached.offline = false;
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.offline = true;
    throw e;
  }
}

export function isDatabaseConnected(): boolean {
  return !!cached.conn && !cached.offline;
}

export default connectToDatabase;
