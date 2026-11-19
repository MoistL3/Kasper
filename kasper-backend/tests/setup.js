const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

beforeAll(async () => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1h';
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
    // DB فاضية قبل كل تيست
    for (const collection of Object.values(mongoose.connection.collections)) {
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});