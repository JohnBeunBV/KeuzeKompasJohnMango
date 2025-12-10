import { VkmsRepository } from "../../domain/repositories/VkmsRepository";
import { VkmsMongoRepository } from "../../infrastructure/repositories/VkmsmongoRepository";
import { Vkm } from "../../domain/models/vkm.model";

const vkmRepo: VkmsRepository = new VkmsMongoRepository();

export const getAllVkms = async (
  page: number,
  limit: number,
  search?: string,
  location?: string,
  credits?: string
) => {
  const skip = (page - 1) * limit;

  // 🔹 Veilig filter object
  const filter: any = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (location) filter.location = location;
  if (credits) {
    const creditNumber = Number(credits);
    if (!isNaN(creditNumber)) filter.studycredit = creditNumber;
  }

  return vkmRepo.getAll(filter, skip, limit);
};

export const getVkmById = async (id: number): Promise<Vkm | null> => {
  return vkmRepo.getById(id);
};
