export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface CustomerProfileRequest {
  fullName: string;
  dob: string; // ISO date, e.g. "1990-05-20"
  pan: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  consentGiven: boolean;
}

export interface CustomerProfileResponse {
  id: number;
  userId: number;
  fullName: string;
  dob: string;
  pan: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  kycStatus: KycStatus;
  consentGiven: boolean;
  consentTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}
