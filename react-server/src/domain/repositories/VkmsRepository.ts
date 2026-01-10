// domain/repositories/VkmsRepository.ts
import { Vkm } from "../models/vkm.model";

export interface VkmsRepository {
  getById(id: string): Promise<Vkm | null>;
  getAll(filter?: any, skip?: number, limit?: number): Promise<{ vkms: Vkm[]; total: number }>;
}
