import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdb';

export async function connectMongo(): Promise<typeof mongoose> {
    mongoose.set('strictQuery', true);
    mongoose.connection.on('connected', () => console.log('[db] connected'));
    mongoose.connection.on('error', (err) => console.error('[db] error', err));
    mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));

    return mongoose.connect(MONGODB_URI, {
        // options can be added here
    });
}
