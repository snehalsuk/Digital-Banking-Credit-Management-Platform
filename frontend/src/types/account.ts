export type AccountType = "SAVINGS" | "CURRENT";
export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";

export interface AccountCreateRequest {
  accountType: AccountType;
}

export interface AccountResponse {
  id: number;
  customerId: number;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  openedDate: string;
  createdAt: string;
  updatedAt: string;
}
