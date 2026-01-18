import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { VkmSchema } from "../infrastructure/modelsinf/vkminf.model";
import { UserModel } from "../infrastructure/modelsinf/userinf.model";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    if (!mongoose.models.Vkm) {
        mongoose.model("Vkm", VkmSchema);
    }
});

afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});
