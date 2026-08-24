export type LoanStatus = "PENDING" | "ACTIVE" | "CLOSED" | "DEFAULTED";
export type EmiStatus = "PENDING" | "PAID" | "OVERDUE" | "DEFAULTED";

export interface LoanApplicationRequest {
  accountId: number;
  loanType: string;
  principal: number;
  interestRateAnnual: number;
  tenureMonths: number;
}

export interface LoanResponse {
  id: number;
  customerId: number;
  accountId: number;
  loanType: string;
  principal: number;
  interestRateAnnual: number;
  tenureMonths: number;
  emiAmount: number;
  status: LoanStatus;
  disbursedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmiScheduleResponse {
  id: number;
  loanId: number;
  installmentNumber: number;
  dueDate: string;
  principalComponent: number;
  interestComponent: number;
  emiAmount: number;
  paidAmount: number;
  paidDate?: string;
  status: EmiStatus;
  daysOverdue: number;
}

export interface EmiPaymentRequest {
  amount: number;
}
