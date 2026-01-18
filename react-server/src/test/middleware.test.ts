import { apiKeyAuth, jwtAuth } from "../middleware/auth.middleware";
// ... imports ...

describe("Auth Middleware", () => {
    it("should reject invalid API keys", () => {
        const req = { header: jest.fn().mockReturnValue("wrong-key") };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        apiKeyAuth(req as any, res as any, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should reject expired/invalid JWTs", () => {
        const req = { headers: { authorization: "Bearer invalid-token" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        jwtAuth(req as any, res as any, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});