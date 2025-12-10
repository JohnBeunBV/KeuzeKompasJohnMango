// infrastructure/repositories/VkmsMongoRepository.ts
import { VkmModel } from "../modelsinf/vkminf.model";
import { VkmsRepository } from "../../domain/repositories/VkmsRepository";
import { Vkm } from "../../domain/models/vkm.model";

export class VkmsMongoRepository implements VkmsRepository {
  async getById(id: number): Promise<Vkm | null> {
    return VkmModel.findOne({ id }).lean();
  }

  async getAll(filter?: any, skip = 0, limit = 10): Promise<{ vkms: Vkm[]; total: number }> {
    const vkms = await VkmModel.find(filter).skip(skip).limit(limit).lean();
    const total = await VkmModel.countDocuments(filter);
    return { vkms, total };
  }
}
