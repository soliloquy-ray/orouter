import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// We augment the NodeJS global type to include our 'mongoose' property.
// This tells TypeScript what to expect on `global.mongoose`.
declare global {
  var mongoose: {
    promise: Promise<Mongoose> | null;
    conn: Mongoose | null;
  };
}

// Use the existing cache or create a new one.
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectToDB = async () => {
  // If we have a cached connection, return it immediately.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection promise doesn't exist, create one.
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  // Await the connection promise and handle potential errors.
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, reset the promise so we can try again later.
    cached.promise = null;
    throw e;
  }

  // Return the now-established connection.
  return cached.conn;
};

export default connectToDB;

