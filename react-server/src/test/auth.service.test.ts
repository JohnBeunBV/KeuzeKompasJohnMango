import * as authService from "../application/auth/auth.service";
import {UserModel} from "../infrastructure/modelsinf/userinf.model";
import {VkmModel} from "../infrastructure/modelsinf/vkminf.model";
import {Types} from "mongoose"; // Ensure you have this exported

describe("Auth Service", () => {
    it("should register a new user and hash the password", async () => {
        const user = await authService.register("TestUser", "test@example.com", "Password123!");

        expect(user.username).toBe("TestUser");
        expect(user.password).not.toBe("Password123!"); // Check if hashed

        const dbUser = await UserModel.findOne({email: "test@example.com"});
        expect(dbUser).toBeDefined();
    });

    it("should throw an error if email is already in use", async () => {
        await authService.register("User1", "dup@test.com", "Password123!");
        await expect(
            authService.register("User2", "dup@test.com", "Password123!")
        ).rejects.toThrow("Email al in gebruik");
    });

    it("should login successfully with correct credentials", async () => {
        await authService.register("LoginUser", "login@test.com", "Password123!");
        const result = await authService.login("login@test.com", "Password123!");

        expect(result.token).toBeDefined();
        expect(result.user.username).toBe("LoginUser");
    });

    // Inside your auth.service.test.ts
    it("should manage user favorites correctly", async () => {
        const user = await authService.register("FavUser", "fav@test.com", "Password123!");
        const vkm = await VkmModel.create({
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

        // Use ! to tell TS these definitely exist
        await authService.addFavorite(user._id!.toString(), vkm._id!.toString());

        const updated = await authService.getMe(user._id!.toString());
        const favoriteIds = updated.favorites.map((f: any) => {
            return f._id ? f._id.toString() : f.toString();
        });
        expect(favoriteIds).toContain(vkm._id!.toString());
    });

});

describe("Auth Service - Edge Cases & Unhappy Paths", () => {

    describe("validateUserInput", () => {
        it("should throw error for short usernames", () => {
            expect(() => authService.validateUserInput("ab")).toThrow("Gebruikersnaam moet minstens 3 tekens bevatten.");
        });

        it("should throw error for invalid emails", () => {
            expect(() => authService.validateUserInput("user", "not-an-email")).toThrow("Ongeldig e-mailadres.");
        });

        it("should throw error for weak passwords", () => {
            // Missing symbol and uppercase
            expect(() => authService.validateUserInput("user", "test@test.com", "password123")).toThrow(
                "Wachtwoord moet minstens 8 tekens lang zijn"
            );
        });
    });

    describe("Login Logic", () => {
        it("should throw error if user does not exist", async () => {
            await expect(authService.login("nonexistent@test.com", "Password123!"))
                .rejects.toThrow("User niet gevonden");
        });

        it("should throw error for incorrect password", async () => {
            await authService.register("ValidUser", "valid@test.com", "Password123!");
            await expect(authService.login("valid@test.com", "WrongPassword!"))
                .rejects.toThrow("Ongeldige inloggegevens");
        });
    });

    describe("Favorites Logic", () => {
        it("should throw error when adding a non-existent VKM", async () => {
            const user = await authService.register("UserX", "x@test.com", "Password123!");
            const fakeId = new Types.ObjectId().toString();
            await expect(authService.addFavorite(user._id!.toString(), fakeId))
                .rejects.toThrow("VKM bestaat niet");
        });
    });

    describe("Recommendations Logic", () => {
        it("should return empty array if user has no profile and no favorites", async () => {
            const user = await authService.register("EmptyUser", "empty@test.com", "Password123!");
            const recs = await authService.getRecommendations(user._id!.toString());
            expect(recs).toEqual([]);
        });
    });
});