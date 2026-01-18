import { UserMongoRepository } from "../../infrastructure/repositories/UsermongoRepository";
import { UserModel } from "../../infrastructure/modelsinf/userinf.model";
import mongoose from "mongoose";
import {VkmModel, VkmSchema} from "../../infrastructure/modelsinf/vkminf.model";

describe("UserMongoRepository", () => {
  let repo: UserMongoRepository;
  let user: any;
  let vkm: any;

  beforeAll(async () => {
    repo = new UserMongoRepository();

    // Ensure VKM model is registered
    if (!mongoose.models.Vkm) {
      mongoose.model("Vkm", VkmSchema);
    }
  });

  beforeEach(async () => {
    // Clean DB
    await UserModel.deleteMany({});
    await VkmModel.deleteMany({});

    // Create VKM
    vkm = await VkmModel.create({
      name: "AI Basics",
      shortdescription: "short",
      description: "desc",
      content: "content",
      studycredit: 5,
      location: "online",
      contact_id: 1,
      level: "Bachelor",
      learningoutcomes: "outcomes",
      module_tags: "tag",
      interests_match_score: 0.5,
      popularity_score: 0.5,
      estimated_difficulty: 2,
      available_spots: 10,
      start_date: "2026-01-01",
    });

    // Create User
    user = await UserModel.create({
      username: "testuser",
      email: "test@example.com",
      password: "pass",
      authMethod: "local",
      roles: ["student"],
    });
  });

  const baseUser = {
    username: "testuser",
    email: "test@test.com",
    password: "secret",
    authMethod: "local" as const,
    roles: ["student"],
  };

  describe("create()", () => {
    it("should create and return a user", async () => {
      const user = await repo.create(baseUser as any);

      expect(user._id).toBeDefined();
      expect(user.email).toBe("test@test.com");
    });
  });

  describe("getByEmail()", () => {
    it("should return user by email", async () => {
      await UserModel.create(baseUser);
      const user = await repo.getByEmail("test@test.com");

      expect(user).not.toBeNull();
      expect(user!.username).toBe("testuser");
    });

    it("should return null if user not found", async () => {
      const user = await repo.getByEmail("nope@test.com");
      expect(user).toBeNull();
    });
  });

  describe("getById()", () => {
    it("should return user by id", async () => {
      const created = await UserModel.create(baseUser);

      const user = await repo.getById(created._id.toString());

      expect(user).not.toBeNull();
      expect(user!.email).toBe("test@test.com");
    });
  });

  describe("update()", () => {
    it("should update user fields", async () => {
      const created = await UserModel.create(baseUser);

      const updated = await repo.update(created._id.toString(), {
        username: "updated",
      });

      expect(updated!.username).toBe("updated");
    });

    it("should update nested profile without overwrite", async () => {
      const created = await UserModel.create({
        ...baseUser,
        profile: { interests: ["a"], values: [], goals: [] },
      });

      const updated = await repo.update(created._id.toString(), {
        profile: { goals: ["b"] },
      });

      expect(updated!.profile!.interests).toEqual(["a"]);
      expect(updated!.profile!.goals).toEqual(["b"]);
    });
  });

  describe("favorites", () => {
    it("should add and remove favorites", async () => {
      const user = await UserModel.create(baseUser);


      const withFav = await repo.addFavorite(user._id.toString(), vkm._id.toString());
      expect(withFav.favorites.length).toBe(1);

      const withoutFav = await repo.removeFavorite(user._id.toString(), vkm._id.toString());
      expect(withoutFav.favorites.length).toBe(0);
    });

    it("should throw on invalid vkm id", async () => {
      const user = await UserModel.create(baseUser);

      await expect(
        repo.addFavorite(user._id.toString(), "invalid")
      ).rejects.toThrow("Invalid VKM id");
    });
  });

  describe("delete()", () => {
    it("should delete user", async () => {
      const user = await UserModel.create(baseUser);

      await repo.delete(user._id.toString());

      const found = await repo.getById(user._id.toString());
      expect(found).toBeNull();
    });
  });
});
