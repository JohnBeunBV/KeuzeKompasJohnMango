import apiClient from "../infrastructure/ApiClient";
import type {Vkm} from "@domain/models/vkm.model";

export interface VkmsResponse {
    vkms: Vkm[];
    meta: {
        total: number
    };

    totalPages: number;
}

export interface VkmsQuery {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    credits?: string;
}

export const getVkms = async ({
                                  page = 1,
                                  limit = 12,
                                  search = "",
                                  location = "",
                                  credits = "",
                              }: VkmsQuery): Promise<VkmsResponse> => {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (search) params.append("search", search);
    if (location) params.append("location", location);
    if (credits) params.append("credits", credits);

    const response = await apiClient.get<VkmsResponse>(`/vkms?${params.toString()}`);
    return response.data;
};
