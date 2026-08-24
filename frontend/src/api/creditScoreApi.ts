import { apiClient } from "./apiClient";
import type { CreditScoreLookupRequest, CreditScoreLookupResponse } from "../types/creditScore";

export async function lookupCreditScore(request: CreditScoreLookupRequest): Promise<CreditScoreLookupResponse> {
  const response = await apiClient.post<CreditScoreLookupResponse>("/credit-score/lookup", request);
  return response.data;
}
