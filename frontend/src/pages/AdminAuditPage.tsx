import { useEffect, useState, type FormEvent } from "react";
import * as adminAuditApi from "../api/adminAuditApi";
import type { PageResponse } from "../types/transaction";
import type { BureauLookupAudit } from "../types/audit";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/FormField";
import { StatusPill } from "../components/common/StatusPill";
import { EmptyState } from "../components/common/EmptyState";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "../components/common/Table";
import { AlertIcon, ChevronIcon, ShieldIcon } from "../components/common/Icon";

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bureau Lookup Audit Trail"
        description="Every PAN-based credit bureau lookup attempt — successful, forbidden, consent-denied, or not-found — is logged here unconditionally. PANs are never shown; only the deterministic hash used for internal lookups."
      />

      <Card>
        <form onSubmit={handleFilterSubmit} className="flex flex-col items-end gap-4 sm:flex-row">
          <Input
            label="PAN hash"
            value={panHashFilter}
            onChange={(e) => setPanHashFilter(e.target.value)}
            placeholder="Filter by exact pan_hash"
            wrapperClassName="w-full sm:max-w-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="secondary">
              Filter
            </Button>
            {appliedPanHash && (
              <Button type="button" variant="ghost" onClick={handleClearFilter}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card padded={false}>
        {loading ? (
          <Table>
            <THead>
              <Th>Requested at</Th>
              <Th>Requester user id</Th>
              <Th>Customer id</Th>
              <Th>PAN hash</Th>
              <Th>Purpose</Th>
              <Th>Consent</Th>
              <Th>Bureau provider</Th>
              <Th>Status</Th>
            </THead>
            <TableSkeleton cols={8} />
          </Table>
        ) : error ? (
          <div className="p-6">
            <EmptyState icon={<AlertIcon size={22} />} title="Could not load the audit trail" description={error} />
          </div>
        ) : !page || page.content.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<ShieldIcon size={22} />} title="No audit rows found" description="Try adjusting or clearing the PAN hash filter." />
          </div>
        ) : (
          <>
            <Table>
              <THead>
                <Th>Requested at</Th>
                <Th>Requester user id</Th>
                <Th>Customer id</Th>
                <Th>PAN hash</Th>
                <Th>Purpose</Th>
                <Th>Consent</Th>
                <Th>Bureau provider</Th>
                <Th>Status</Th>
              </THead>
              <TBody>
                {page.content.map((row) => (
                  <Tr key={row.id}>
                    <Td className="text-neutral-500">{new Date(row.requestedAt).toLocaleString()}</Td>
                    <Td>{row.requesterUserId}</Td>
                    <Td>{row.customerId ?? "-"}</Td>
                    <Td>
                      <code title={row.panHash} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                        {row.panHash.slice(0, 12)}&hellip;
                      </code>
                    </Td>
                    <Td>{row.purpose ?? "-"}</Td>
                    <Td>{row.consentConfirmed ? "Yes" : "No"}</Td>
                    <Td>{row.bureauProvider ?? "-"}</Td>
                    <Td>
                      <StatusPill status={row.responseStatus} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>

            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page.first}
                onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                icon={<ChevronIcon size={14} className="rotate-180" />}
              >
                Previous
              </Button>
              <span className="text-sm text-neutral-500">
                Page {page.number + 1} of {Math.max(page.totalPages, 1)} ({page.totalElements} total)
              </span>
              <Button variant="secondary" size="sm" disabled={page.last} onClick={() => setPageNumber((p) => p + 1)}>
                Next
                <ChevronIcon size={14} />
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
