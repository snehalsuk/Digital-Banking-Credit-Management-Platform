import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as transactionApi from "../api/transactionApi";
import type { PageResponse, TransactionResponse } from "../types/transaction";

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
    <div className="transactions-page">
      <h1>Transaction History</h1>
      <p>
        <Link to={`/accounts/${accountId}`}>Back to account</Link>
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : !page || page.content.length === 0 ? (
        <p>No transactions.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance after</th>
                <th>Related account</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {page.content.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  <td>{tx.type}</td>
                  <td>{tx.amount.toFixed(2)}</td>
                  <td>{tx.balanceAfter.toFixed(2)}</td>
                  <td>{tx.relatedAccountId ?? "-"}</td>
                  <td>{tx.description}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-row">
            <button type="button" disabled={page.first} onClick={() => setPageNumber((p) => Math.max(0, p - 1))}>
              Previous
            </button>
            <span>
              Page {page.number + 1} of {Math.max(page.totalPages, 1)}
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
