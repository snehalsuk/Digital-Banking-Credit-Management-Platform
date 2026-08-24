import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as transactionApi from "../api/transactionApi";
import type { PageResponse, TransactionResponse, TransactionType } from "../types/transaction";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Money } from "../components/common/Money";
import { StatusPill } from "../components/common/StatusPill";
import { EmptyState } from "../components/common/EmptyState";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "../components/common/Table";
import { AlertIcon, ArrowDownRightIcon, ArrowUpRightIcon, ChevronIcon } from "../components/common/Icon";

function txIcon(type: TransactionType) {
  if (type === "DEPOSIT" || type === "TRANSFER_IN") {
    return <ArrowDownRightIcon size={14} className="text-success-600" />;
  }
  return <ArrowUpRightIcon size={14} className="text-danger-600" />;
}

function txLabel(type: TransactionType): string {
  switch (type) {
    case "DEPOSIT":
      return "Deposit";
    case "WITHDRAWAL":
      return "Withdrawal";
    case "TRANSFER_IN":
      return "Transfer in";
    case "TRANSFER_OUT":
      return "Transfer out";
  }
}

function txSign(type: TransactionType): "positive" | "negative" {
  return type === "DEPOSIT" || type === "TRANSFER_IN" ? "positive" : "negative";
}

export function TransactionsPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = Number(id);

  const [page, setPage] = useState<PageResponse<TransactionResponse> | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(accountId)) return;
    setLoading(true);
    transactionApi
      .getTransactions(accountId, pageNumber, 20)
      .then(setPage)
      .catch(() => setError("Could not load transactions."))
      .finally(() => setLoading(false));
  }, [accountId, pageNumber]);

  return (
    <div>
      <PageHeader
        title="Transaction History"
        description={
          <Link to={`/accounts/${accountId}`} className="font-medium text-primary-600 hover:text-primary-700">
            &larr; Back to account
          </Link>
        }
      />

      <Card padded={false}>
        {loading ? (
          <Table>
            <THead>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Balance after</Th>
              <Th>Related account</Th>
              <Th>Description</Th>
              <Th>Status</Th>
            </THead>
            <TableSkeleton cols={7} />
          </Table>
        ) : error ? (
          <div className="p-6">
            <EmptyState icon={<AlertIcon size={22} />} title="Could not load transactions" description={error} />
          </div>
        ) : !page || page.content.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No transactions" description="Nothing has moved through this account yet." />
          </div>
        ) : (
          <>
            <Table>
              <THead>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Balance after</Th>
                <Th>Related account</Th>
                <Th>Description</Th>
                <Th>Status</Th>
              </THead>
              <TBody>
                {page.content.map((tx) => (
                  <Tr key={tx.id}>
                    <Td className="text-neutral-500">{new Date(tx.createdAt).toLocaleString()}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5">
                        {txIcon(tx.type)}
                        {txLabel(tx.type)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <Money amount={tx.amount} sign={txSign(tx.type)} prefix={txSign(tx.type) === "positive" ? "+" : "-"} size="sm" />
                    </Td>
                    <Td className="text-right">
                      <Money amount={tx.balanceAfter} size="sm" />
                    </Td>
                    <Td>{tx.relatedAccountId ?? "-"}</Td>
                    <Td className="max-w-[16rem] truncate">{tx.description || "-"}</Td>
                    <Td>
                      <StatusPill status={tx.status} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>

            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <Button variant="secondary" size="sm" disabled={page.first} onClick={() => setPageNumber((p) => Math.max(0, p - 1))} icon={<ChevronIcon size={14} className="rotate-180" />}>
                Previous
              </Button>
              <span className="text-sm text-neutral-500">
                Page {page.number + 1} of {Math.max(page.totalPages, 1)}
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
