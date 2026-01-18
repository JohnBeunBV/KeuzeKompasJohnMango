// infrastructure/repositories/VkmsMongoRepository.ts
import { VkmModel } from "../modelsinf/vkminf.model";
import { VkmsRepository } from "../../domain/repositories/VkmsRepository";
import { Vkm } from "../../domain/models/vkm.model";
import { Types } from "mongoose";

export class VkmsMongoRepository implements VkmsRepository {

    async getById(id: string): Promise<Vkm | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        const vkm = await VkmModel.findById(id).lean();
        if (!vkm) return null;

        return { ...vkm, _id: vkm._id.toString() } as any;
    }

    async getAll(
        filter: Record<string, unknown> = {},
        skip = 0,
        limit = 10
    ): Promise<{ vkms: Vkm[]; total: number }> {
        const [vkms, total] = await Promise.all([
            VkmModel.find(filter).skip(skip).limit(limit).lean(),
            VkmModel.countDocuments(filter),
        ]);

        return {
            vkms: vkms.map(v => ({ ...v, _id: v._id.toString() } as any)),
            total,
        };
    }
}
