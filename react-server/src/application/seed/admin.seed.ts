import { register } from "../auth/auth.service";
import { UserMongoRepository } from "../../infrastructure/repositories/UsermongoRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { User } from "../../domain/models/user.model";

const userRepo: UserRepository = new UserMongoRepository();

export const seedAdminUser = async () => {
    const {
        SEED_ADMIN_EMAIL,
        SEED_ADMIN_PASSWORD,
        SEED_ADMIN_USERNAME,
        SEED_ADMIN_ROLE,
    } = process.env;

    if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || !SEED_ADMIN_USERNAME) {
        console.log("Admin seed skipped (missing env vars)");
        return;
    }

    const desiredRole = (SEED_ADMIN_ROLE ?? "admin") as User["roles"][number];

    const existing = await userRepo.getByEmail(SEED_ADMIN_EMAIL);

    const needsReset =
        !existing ||
        existing.username !== SEED_ADMIN_USERNAME ||
        existing.authMethod !== "local" ||
        !existing.roles.includes(desiredRole);

    if (!needsReset) {
        console.log("Admin user already in desired state");
        return;
    }

    if (existing?._id) {
        console.warn("Admin user mismatch detected — resetting admin user");
        await userRepo.delete(existing._id);
    }

    // Recreate admin via register (validations + hashing)
    const user = await register(
        SEED_ADMIN_USERNAME,
        SEED_ADMIN_EMAIL,
        SEED_ADMIN_PASSWORD
    );

    // Force correct role
    await userRepo.update(user._id!, {
        roles: [desiredRole],
        authMethod: "local",
    });

    console.log("✅ Admin user enforced from environment");
};
