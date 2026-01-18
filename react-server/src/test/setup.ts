import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { VkmSchema } from "../infrastructure/modelsinf/vkminf.model";
import { UserModel } from "../infrastructure/modelsinf/userinf.model";

process.env.PYTHON_API_KEY = "test_dummy_key";
process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    if (!mongoose.models.Vkm) {
        mongoose.model("Vkm", VkmSchema);
    }
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});
