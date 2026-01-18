import { VkmsMongoRepository } from "../../infrastructure/repositories/VkmsmongoRepository";
import { VkmModel } from "../../infrastructure/modelsinf/vkminf.model";
import mongoose from "mongoose";

describe("VkmsMongoRepository", () => {
    let repo: VkmsMongoRepository;

    beforeEach(() => {
        repo = new VkmsMongoRepository();
    });

    const baseVkm = {
        name: "AI Basics",
        shortdescription: "Intro",
        description: "Full description",
        content: "Lots of content",
        studycredit: 5,
        location: "Online",
        contact_id: 1,
        level: "Bachelor",
        learningoutcomes: "Learn stuff",
        module_tags: "AI",
        interests_match_score: 0.8,
        popularity_score: 0.9,
        estimated_difficulty: 2,
        available_spots: 20,
        start_date: "2026-01-01",
    };

    describe("getById()", () => {
        it("returns vkm by id", async () => {
            const created = await VkmModel.create(baseVkm);

            const found = await repo.getById(created._id.toString());

            expect(found).not.toBeNull();
            expect(found!.name).toBe("AI Basics");
        });

        it("returns null for invalid id", async () => {
            const found = await repo.getById("invalid");
            expect(found).toBeNull();
        });
    });

    describe("getAll()", () => {
        it("returns paginated results", async () => {
            await VkmModel.create(baseVkm);
            await VkmModel.create({ ...baseVkm, name: "Advanced AI" });

            const result = await repo.getAll({}, 0, 10);

            expect(result.total).toBe(2);
            expect(result.vkms.length).toBe(2);
        });

        it("supports filtering", async () => {
            await VkmModel.create(baseVkm);
            await VkmModel.create({ ...baseVkm, level: "Master" });

            const result = await repo.getAll({ level: "Bachelor" });

            expect(result.total).toBe(1);
            expect(result.vkms[0].level).toBe("Bachelor");
        });
    });
});
