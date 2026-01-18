import request from "supertest";
import app from "../server"; // Your Express app instance
import { UserModel } from "../infrastructure/modelsinf/userinf.model";
import mongoose from "mongoose";
import { jwtAuth } from "../middleware/auth.middleware"; // Import the mocked version
jest.mock("../middleware/auth.middleware", () => {
    const mockMiddleware = (req: any, res: any, next: any) => {
        req.auth = { id: "65a7f9e8d1c2b3a4e5f6a7b8", type: "user" };
        next();
    };
    return {
        jwtAuth: jest.fn(mockMiddleware),
        authMiddleware: jest.fn(mockMiddleware),
        requireUser: (req: any, res: any, next: any) => next(),
        apiKeyAuth: (req: any, res: any, next: any) => next(),
        requireScope: () => (req: any, res: any, next: any) => next(),
    };
});
describe("Auth Controller", () => {
    describe("POST /api/auth/register", () => {
        it("should return 201 on successful registration", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    username: "ControllerUser",
                    email: "ctrl@test.com",
                    password: "Password123!"
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Registratie succesvol");
        });

        it("should return 400 if fields are missing", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({ email: "incomplete@test.com" });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Vul alle velden in.");
        });
    });

    describe("GET /api/auth/me", () => {
        it("should return 401 if no token is provided", async () => {
            // OVERRIDE the global mock just for this one test
            (jwtAuth as jest.Mock).mockImplementationOnce((req, res, next) => {
                return res.status(401).json({ error: "No token" });
            });

            const response = await request(app).get("/api/auth/me");

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("No token");
        });

        it("should return 200 when user exists in DB", async () => {
            const testId = "65a7f9e8d1c2b3a4e5f6a7b8";
            // Create the user so the controller/service actually finds someone
            await UserModel.create({
                _id: new mongoose.Types.ObjectId(testId),
                username: "Test",
                email: "test@test.com",
                password: "hashed",
                authMethod: "local"
            });

            const response = await request(app).get("/api/auth/me")
                .set("Authorization", "Bearer valid-looking-token");

            expect(response.status).toBe(200);
        });
    });
});

describe("Auth Controller - Integration Tests", () => {

    describe("POST /api/auth/login", () => {
        it("should return 400 for wrong credentials", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({ email: "wrong@test.com", password: "Password123!" });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });
    });

    describe("DELETE /api/auth/me", () => {
        it("should delete user account when authenticated", async () => {
            // 1. Create the user that matches our mock ID
            const testId = "65a7f9e8d1c2b3a4e5f6a7b8";
            await UserModel.create({
                _id: new mongoose.Types.ObjectId(testId),
                username: "DeleteMe",
                email: "delete@test.com",
                password: "HashedPassword123!",
                authMethod: "local"
            });

            const response = await request(app)
                .delete("/api/auth/me")
                .set("Authorization", "Bearer mock-token");

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Account verwijderd");

            // 2. Verify it's actually gone from DB
            const check = await UserModel.findById(testId);
            expect(check).toBeNull();
        });
    });

    describe("POST /api/auth/users/favorites/:vkmId", () => {
        it("should return 400 for invalid ObjectId format", async () => {
            const response = await request(app)
                .post("/api/auth/users/favorites/123-not-an-id")
                .set("Authorization", "Bearer mock-token");

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("VKM ID must be a valid ObjectId.");
        });
    });

    describe("PUT /api/auth/profile", () => {
        it("should update profile interests", async () => {
            const testId = "65a7f9e8d1c2b3a4e5f6a7b8"; // Must match your middleware mock ID

            // 1. Create the user first so the Service can find them
            await UserModel.create({
                _id: new mongoose.Types.ObjectId(testId),
                username: "ProfileUser",
                email: "profile@test.com",
                password: "HashedPassword123!",
                authMethod: "local",
                profile: { interests: [], values: [], goals: [] }
            });

            // 2. Now perform the update
            const response = await request(app)
                .put("/api/auth/me/profile")
                .set("Authorization", "Bearer mock-token")
                .send({
                    interests: ["AI", "Data Science"],
                    values: ["Transparency"],
                    goals: ["Mastering TypeScript"]
                });

            // Debug log if it still fails:
            if (response.status !== 200) console.log(response.body);

            expect(response.status).toBe(200);
            expect(response.body.profile.interests).toContain("AI");
        });
    });
});