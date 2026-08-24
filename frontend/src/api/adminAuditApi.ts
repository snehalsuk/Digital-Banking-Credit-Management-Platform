import { apiClient } from "./apiClient";
import type { PageResponse } from "../types/transaction";
import type { BureauLookupAudit } from "../types/audit";

export interface BureauLookupAuditQuery {
  page?: number;
  size?: number;
  panHash?: string;
}

export async function getBureauLookupAudits(
  query: BureauLookupAuditQuery = {}
): Promise<PageResponse<BureauLookupAudit>> {
  const response = await apiClient.get<PageResponse<BureauLookupAudit>>("/admin/audit/bureau-lookups", {
    params: {
      page: query.page ?? 0,
      size: query.size ?? 20,
      panHash: query.panHash || undefined,
    },
  });
  return response.data;
}
