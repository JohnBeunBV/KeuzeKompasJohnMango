import request from "supertest";
import { app } from "../server";
import mongoose from "mongoose";
jest.mock("../middleware/auth.middleware", () => ({
    // Mock the functions used in auth.routes.ts
    jwtAuth: (req: any, res: any, next: any) => next(),
    requireUser: (req: any, res: any, next: any) => next(),
    apiKeyAuth: (req: any, res: any, next: any) => next(),
    requireScope: () => (req: any, res: any, next: any) => next(),
    authMiddleware: (req: any, res: any, next: any) => next(),
}));
describe("VKM Controller", () => {
    const VkmModel = mongoose.model("Vkm");

    beforeEach(async () => {
        await VkmModel.create({
            name: "Controller Test VKM",
            location: "Online",
            shortdescription: "desc",
            description: "desc",
            content: "content",
            contact_id: 12,
            level: "Master",
            learningoutcomes: "Outcome",
            module_tags: "testing",
            interests_match_score: 1,
            popularity_score: 1,
            estimated_difficulty: 1,
            available_spots: 1,
            start_date: new Date(),
            studycredit: 15
        });
    });

    it("GET /api/vkms - should return list of vkms", async () => {
        const res = await request(app)
            .get("/api/vkms") // Adjust to your actual route prefix
            .set("Authorization", "Bearer MOCK_TOKEN"); // You might need to mock authMiddleware

        expect(res.status).toBe(200);
        expect(res.body.vkms).toBeDefined();
        expect(Array.isArray(res.body.vkms)).toBe(true);
    });

    it("GET /api/vkms/:id - should return 400 for invalid ID", async () => {
        const res = await request(app).get("/api/vkms/123-not-uuid");
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Ongeldige VKM ID");
    });

    it("GET /api/vkms/:id - should return 404 for non-existent ID", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/vkms/${fakeId}`);
        expect(res.status).toBe(404);
    });
});