export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER_IN" | "TRANSFER_OUT";
export type TransactionStatus = "COMPLETED" | "FAILED";

export interface DepositRequest {
  amount: number;
  description?: string;
}

export interface WithdrawRequest {
  amount: number;
  description?: string;
}

export interface TransferRequest {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  description?: string;
}

export interface TransactionResponse {
  id: number;
  accountId: number;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  relatedAccountId?: number;
  description?: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
