import * as vkmService from "../application/vkms/vkm.service";
import mongoose from "mongoose";

// 🔹 Factory to satisfy Mongoose 'required' fields
const createValidVkmData = (overrides = {}) => ({
    name: "Default VKM",
    location: "Breda",
    shortdescription: "Short desc",
    description: "Long desc",
    content: "Content",
    contact_id: 12,
    level: "Bachelor",
    learningoutcomes: "Outcome",
    module_tags: "Tag1",
    interests_match_score: 0.5,
    popularity_score: 10,
    estimated_difficulty: 3,
    available_spots: 20,
    start_date: new Date(),
    studycredit: 5,
    ...overrides
});

describe("VKM Service", () => {
    const VkmModel = mongoose.model("Vkm");

    it("should cover search, location, and credits filtering (Full Coverage)", async () => {
        // Create diverse data to test all filter branches
        await VkmModel.create([
            createValidVkmData({ name: "React Course", module_tags: "frontend", location: "Breda", studycredit: 5 }),
            createValidVkmData({ name: "Java Backend", module_tags: "backend", location: "Amsterdam", studycredit: 10 }),
        ]);

        // Test Search
        const searchRes = await vkmService.getAllVkms(1, 10, "React");
        expect(searchRes.vkms).toHaveLength(1);

        // Test Location
        const locRes = await vkmService.getAllVkms(1, 10, undefined, "Amsterdam");
        expect(locRes.vkms).toHaveLength(1);

        // Test Credits
        const credRes = await vkmService.getAllVkms(1, 10, undefined, undefined, "10");
        expect(credRes.vkms).toHaveLength(1);
    });

    it("should return null for non-existent ID", async () => {
        const id = new mongoose.Types.ObjectId().toString();
        const res = await vkmService.getVkmById(id);
        expect(res).toBeNull();
    });
});