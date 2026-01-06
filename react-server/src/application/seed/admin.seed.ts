import {register} from "../auth/auth.service";
import {UserMongoRepository} from "../../infrastructure/repositories/UsermongoRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";

const userRepo: UserRepository = new UserMongoRepository();

export const seedAdminUser = async () => {

    const {
        SEED_ADMIN_EMAIL,
        SEED_ADMIN_PASSWORD,
        SEED_ADMIN_USERNAME,
        SEED_ADMIN_ROLE
    } = process.env;
    console.log("Seed Admin User Email: " + SEED_ADMIN_EMAIL);

    if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || !SEED_ADMIN_USERNAME) {
        console.log("Admin seed skipped (missing env vars)");
        return;
    }

    // Check existence using repo
    const existing = await userRepo.getByEmail(SEED_ADMIN_EMAIL);
    if (existing) {
        console.log("Admin user already exists, skipping seed");
        return;
    }

    // Create user via REGISTER (validations + hashing)
    const user = await register(
        SEED_ADMIN_USERNAME,
        SEED_ADMIN_EMAIL,
        SEED_ADMIN_PASSWORD
    );

    // Promote role if needed
    if (SEED_ADMIN_ROLE) {
        await userRepo.update(user._id!, {
            roles: [SEED_ADMIN_ROLE as any]
        });
    }

    console.log("✅ Admin user seeded");
};
