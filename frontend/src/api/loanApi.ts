import { apiClient } from "./apiClient";
import type {
  EmiPaymentRequest,
  EmiScheduleResponse,
  LoanApplicationRequest,
  LoanResponse,
  LoanStatus,
} from "../types/loan";

export async function applyForLoan(request: LoanApplicationRequest): Promise<LoanResponse> {
  const response = await apiClient.post<LoanResponse>("/loans/apply", request);
  return response.data;
}

export async function approveLoan(id: number): Promise<LoanResponse> {
  const response = await apiClient.post<LoanResponse>(`/loans/${id}/approve`);
  return response.data;
}

export async function getLoans(params?: { customerId?: number; status?: LoanStatus }): Promise<LoanResponse[]> {
  const response = await apiClient.get<LoanResponse[]>("/loans", { params });
  return response.data;
}

export async function getLoan(id: number): Promise<LoanResponse> {
  const response = await apiClient.get<LoanResponse>(`/loans/${id}`);
  return response.data;
}

export async function getEmiSchedule(loanId: number): Promise<EmiScheduleResponse[]> {
  const response = await apiClient.get<EmiScheduleResponse[]>(`/loans/${loanId}/emi-schedule`);
  return response.data;
}

export async function payEmi(
  loanId: number,
  installmentNumber: number,
  request: EmiPaymentRequest
): Promise<EmiScheduleResponse> {
  const response = await apiClient.post<EmiScheduleResponse>(
    `/loans/${loanId}/emi/${installmentNumber}/pay`,
    request
  );
  return response.data;
}

export async function runOverdueCheck(): Promise<{ updatedCount: number }> {
  const response = await apiClient.post<{ updatedCount: number }>("/admin/loans/run-overdue-check");
  return response.data;
}
