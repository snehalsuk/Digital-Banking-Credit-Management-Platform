export type BureauLookupStatus = "SUCCESS" | "NOT_FOUND" | "FORBIDDEN" | "CONSENT_DENIED";

export interface BureauLookupAudit {
  id: number;
  requesterUserId: number;
  customerId: number | null;
  panHash: string;
  purpose: string | null;
  consentConfirmed: boolean;
  bureauProvider: string | null;
  responseStatus: BureauLookupStatus;
  requestedAt: string;
}
