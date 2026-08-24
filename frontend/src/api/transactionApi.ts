import { apiClient } from "./apiClient";
import type {
  DepositRequest,
  PageResponse,
  TransactionResponse,
  TransferRequest,
  WithdrawRequest,
} from "../types/transaction";

export async function deposit(accountId: number, request: DepositRequest): Promise<TransactionResponse> {
  const response = await apiClient.post<TransactionResponse>(`/accounts/${accountId}/deposit`, request);
  return response.data;
}

export async function withdraw(accountId: number, request: WithdrawRequest): Promise<TransactionResponse> {
  const response = await apiClient.post<TransactionResponse>(`/accounts/${accountId}/withdraw`, request);
  return response.data;
}

export async function transfer(request: TransferRequest): Promise<TransactionResponse[]> {
  const response = await apiClient.post<TransactionResponse[]>("/transfers", request);
  return response.data;
}

export async function getTransactions(
  accountId: number,
  page = 0,
  size = 20
): Promise<PageResponse<TransactionResponse>> {
  const response = await apiClient.get<PageResponse<TransactionResponse>>(`/accounts/${accountId}/transactions`, {
    params: { page, size },
  });
  return response.data;
}
