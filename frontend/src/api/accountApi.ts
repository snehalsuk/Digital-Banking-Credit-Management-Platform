import { apiClient } from "./apiClient";
import type { AccountCreateRequest, AccountResponse } from "../types/account";

export async function openAccount(request: AccountCreateRequest): Promise<AccountResponse> {
  const response = await apiClient.post<AccountResponse>("/accounts", request);
  return response.data;
}

export async function getMyAccounts(): Promise<AccountResponse[]> {
  const response = await apiClient.get<AccountResponse[]>("/accounts");
  return response.data;
}

export async function getAccountsForCustomer(customerId: number): Promise<AccountResponse[]> {
  const response = await apiClient.get<AccountResponse[]>("/accounts", { params: { customerId } });
  return response.data;
}

export async function getAccount(id: number): Promise<AccountResponse> {
  const response = await apiClient.get<AccountResponse>(`/accounts/${id}`);
  return response.data;
}
