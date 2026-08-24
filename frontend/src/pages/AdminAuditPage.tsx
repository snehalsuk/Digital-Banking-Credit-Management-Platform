import { useEffect, useState, type FormEvent } from "react";
import * as adminAuditApi from "../api/adminAuditApi";
import type { PageResponse } from "../types/transaction";
import type { BureauLookupAudit } from "../types/audit";

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "Success",
  NOT_FOUND: "Not found",
  FORBIDDEN: "Forbidden",
  CONSENT_DENIED: "Consent denied",
};

function StatusBadge({ status }: { status: string }) {
  const className = `audit-status-badge audit-status-${status.toLowerCase()}`;
  return <span className={className}>{STATUS_LABEL[status] ?? status}</span>;
}

export function AdminAuditPage() {
  const [page, setPage] = useState<PageResponse<BureauLookupAudit> | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [panHashFilter, setPanHashFilter] = useState("");
  const [appliedPanHash, setAppliedPanHash] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminAuditApi
      .getBureauLookupAudits({ page: pageNumber, size: 20, panHash: appliedPanHash })
      .then(setPage)
      .catch(() => setError("Could not load the audit trail."))
      .finally(() => setLoading(false));
  }, [pageNumber, appliedPanHash]);

  function handleFilterSubmit(event: FormEvent) {
    event.preventDefault();
    setPageNumber(0);
    setAppliedPanHash(panHashFilter.trim());
  }

  function handleClearFilter() {
    setPanHashFilter("");
    setAppliedPanHash("");
    setPageNumber(0);
  }

  return (
    <div className="admin-audit-page">
      <h1>Bureau Lookup Audit Trail</h1>
      <p>
        Every PAN-based credit bureau lookup attempt — successful, forbidden, consent-denied, or
        not-found — is logged here unconditionally. PANs are never shown; only the deterministic
        hash used for internal lookups.
      </p>

      <form onSubmit={handleFilterSubmit} className="inline-form">
        <label>
          PAN hash
          <input
            value={panHashFilter}
            onChange={(e) => setPanHashFilter(e.target.value)}
            placeholder="Filter by exact pan_hash"
          />
        </label>
        <button type="submit">Filter</button>
        {appliedPanHash && (
          <button type="button" onClick={handleClearFilter}>
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : !page || page.content.length === 0 ? (
        <p>No audit rows found.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Requested at</th>
                <th>Requester user id</th>
                <th>Customer id</th>
                <th>PAN hash</th>
                <th>Purpose</th>
                <th>Consent</th>
                <th>Bureau provider</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {page.content.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.requestedAt).toLocaleString()}</td>
                  <td>{row.requesterUserId}</td>
                  <td>{row.customerId ?? "-"}</td>
                  <td>
                    <code title={row.panHash}>{row.panHash.slice(0, 12)}&hellip;</code>
                  </td>
                  <td>{row.purpose ?? "-"}</td>
                  <td>{row.consentConfirmed ? "Yes" : "No"}</td>
                  <td>{row.bureauProvider ?? "-"}</td>
                  <td>
                    <StatusBadge status={row.responseStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-row">
            <button type="button" disabled={page.first} onClick={() => setPageNumber((p) => Math.max(0, p - 1))}>
              Previous
            </button>
            <span>
              Page {page.number + 1} of {Math.max(page.totalPages, 1)} ({page.totalElements} total)
            </span>
            <button type="button" disabled={page.last} onClick={() => setPageNumber((p) => p + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
