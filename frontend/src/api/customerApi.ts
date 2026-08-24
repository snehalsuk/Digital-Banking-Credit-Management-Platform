import { apiClient } from "./apiClient";
import type { CustomerProfileRequest, CustomerProfileResponse } from "../types/customer";

export async function getMyProfile(): Promise<CustomerProfileResponse> {
  const response = await apiClient.get<CustomerProfileResponse>("/customers/me");
  return response.data;
}

export async function updateMyProfile(request: CustomerProfileRequest): Promise<CustomerProfileResponse> {
  const response = await apiClient.put<CustomerProfileResponse>("/customers/me", request);
  return response.data;
}
