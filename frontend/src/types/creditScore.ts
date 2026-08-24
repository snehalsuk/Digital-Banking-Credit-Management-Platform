export type PendingEmiStatus = "PENDING" | "PAID" | "OVERDUE" | "DEFAULTED";

export interface TradeLine {
  lenderName: string;
  accountType: string;
  sanctionedAmount: number;
  currentBalance: number;
  accountStatus: string;
  daysPastDue: number;
}

export interface DelinquencySummary {
  totalOverdueAccounts: number;
  totalOverdueAmount: number;
  worstDpd: number;
}

export interface PendingEmi {
  loanId: number;
  installmentNumber: number;
  emiAmount: number;
  dueDate: string;
  daysOverdue: number;
  status: PendingEmiStatus;
}

export interface CreditScoreLookupRequest {
  pan: string;
  consentConfirmed: boolean;
  purpose: string;
}

export interface CreditScoreLookupResponse {
  bureauScore: number;
  internalScore: number;
  combinedScore: number;
  scoreBand: string;
  tradeLines: TradeLine[];
  delinquencySummary: DelinquencySummary;
  pendingEmis: PendingEmi[];
  dataSource: "MOCK" | "REAL";
  lastUpdated: string;
}
