import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as loanApi from "../api/loanApi";
import { useAuth } from "../auth/AuthContext";
import type { LoanResponse } from "../types/loan";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/FormField";
import { StatusPill } from "../components/common/StatusPill";
import { Money } from "../components/common/Money";
import { EmptyState } from "../components/common/EmptyState";
import { Table, THead, Th, TBody, Tr, Td, TableSkeleton } from "../components/common/Table";
import { BankIcon, ChevronIcon, PlusIcon } from "../components/common/Icon";
import { useToast } from "../components/common/ToastContext";

const emptyForm = {
  accountId: "",
  loanType: "PERSONAL",
  principal: "",
  interestRateAnnual: "",
  tenureMonths: "",
};

export function LoansPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isOfficerOrAdmin = user?.role === "LOAN_OFFICER" || user?.role === "ADMIN";

  const [loans, setLoans] = useState<LoanResponse[]>([]);
  const [pendingLoans, setPendingLoans] = useState<LoanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [applying, setApplying] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);

  function loadLoans() {
    setLoading(true);
    const requests = [loanApi.getLoans()];
    if (isOfficerOrAdmin) {
      requests.push(loanApi.getLoans({ status: "PENDING" }));
    }
    Promise.all(requests)
      .then(([all, pending]) => {
        setLoans(all);
        setPendingLoans(pending ?? []);
      })
      .catch(() => setError("Could not load loans."))
      .finally(() => setLoading(false));
  }

  useEffect(loadLoans, [isOfficerOrAdmin]);

  async function handleApply(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setApplying(true);
    try {
      await loanApi.applyForLoan({
        accountId: Number(form.accountId),
        loanType: form.loanType,
        principal: Number(form.principal),
        interestRateAnnual: Number(form.interestRateAnnual),
        tenureMonths: Number(form.tenureMonths),
      });
      setForm(emptyForm);
      setShowApplyForm(false);
      toast.success("Loan application submitted.");
      loadLoans();
    } catch {
      setError("Could not submit loan application. Check that the account id belongs to you.");
      toast.error("Could not submit loan application.");
    } finally {
      setApplying(false);
    }
  }

  async function handleApprove(loanId: number) {
    setApprovingId(loanId);
    setError(null);
    try {
      await loanApi.approveLoan(loanId);
      toast.success(`Loan #${loanId} approved and disbursed.`);
      loadLoans();
    } catch {
      setError("Could not approve loan.");
      toast.error("Could not approve loan.");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Loans"
        description={isOfficerOrAdmin ? "Review pending applications and monitor every loan." : "Track your loans and apply for new credit."}
        action={
          !isOfficerOrAdmin && (
            <Button icon={<PlusIcon size={16} />} onClick={() => setShowApplyForm((v) => !v)}>
              Apply for a loan
            </Button>
          )
        }
      />

      {isOfficerOrAdmin && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Pending approval</h2>
          <Card padded={false}>
            {loading ? (
              <Table>
                <THead>
                  <Th>Loan</Th>
                  <Th>Customer</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Principal</Th>
                  <Th>Rate</Th>
                  <Th>Tenure</Th>
                  <Th />
                </THead>
                <TableSkeleton cols={7} />
              </Table>
            ) : pendingLoans.length === 0 ? (
              <div className="p-6">
                <EmptyState positive title="You're all caught up" description="No loans are awaiting approval right now." />
              </div>
            ) : (
              <Table>
                <THead>
                  <Th>Loan</Th>
                  <Th>Customer</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Principal</Th>
                  <Th>Rate</Th>
                  <Th>Tenure</Th>
                  <Th />
                </THead>
                <TBody>
                  {pendingLoans.map((loan) => (
                    <Tr key={loan.id}>
                      <Td>#{loan.id}</Td>
                      <Td>{loan.customerId}</Td>
                      <Td>{loan.loanType}</Td>
                      <Td className="text-right">
                        <Money amount={loan.principal} size="sm" />
                      </Td>
                      <Td>{loan.interestRateAnnual}%</Td>
                      <Td>{loan.tenureMonths} mo</Td>
                      <Td className="text-right">
                        <Button
                          size="sm"
                          loading={approvingId === loan.id}
                          onClick={() => handleApprove(loan.id)}
                        >
                          Approve &amp; disburse
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {!isOfficerOrAdmin && showApplyForm && (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Apply for a loan</h2>
          <form onSubmit={handleApply} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Account ID"
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              required
              helperText="The account your loan will be disbursed to."
            />
            <Select label="Loan type" value={form.loanType} onChange={(e) => setForm({ ...form, loanType: e.target.value })}>
              <option value="PERSONAL">Personal</option>
              <option value="HOME">Home</option>
              <option value="AUTO">Auto</option>
            </Select>
            <Input
              label="Principal"
              type="number"
              step="0.01"
              min="1"
              value={form.principal}
              onChange={(e) => setForm({ ...form, principal: e.target.value })}
              required
            />
            <Input
              label="Annual interest rate (%)"
              type="number"
              step="0.01"
              min="0.01"
              max="99.99"
              value={form.interestRateAnnual}
              onChange={(e) => setForm({ ...form, interestRateAnnual: e.target.value })}
              required
            />
            <Input
              label="Tenure (months)"
              type="number"
              min="1"
              max="480"
              value={form.tenureMonths}
              onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })}
              required
            />
            <div className="flex items-end">
              <Button type="submit" loading={applying} fullWidth>
                Submit application
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-sm font-medium text-danger-600">{error}</p>}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {isOfficerOrAdmin ? "All loans" : "Your loans"}
        </h2>
        <Card padded={false}>
          {loading ? (
            <Table>
              <THead>
                <Th>Loan</Th>
                <Th>Type</Th>
                <Th className="text-right">Principal</Th>
                <Th className="text-right">EMI</Th>
                <Th>Status</Th>
                <Th />
              </THead>
              <TableSkeleton cols={6} />
            </Table>
          ) : loans.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<BankIcon size={22} />}
                title="No loans yet"
                description={isOfficerOrAdmin ? "No loans have been created yet." : "Apply for a personal, home, or auto loan whenever you're ready."}
              />
            </div>
          ) : (
            <Table>
              <THead>
                <Th>Loan</Th>
                <Th>Type</Th>
                <Th className="text-right">Principal</Th>
                <Th className="text-right">EMI</Th>
                <Th>Status</Th>
                <Th />
              </THead>
              <TBody>
                {loans.map((loan) => (
                  <Tr key={loan.id}>
                    <Td>#{loan.id}</Td>
                    <Td>{loan.loanType}</Td>
                    <Td className="text-right">
                      <Money amount={loan.principal} size="sm" />
                    </Td>
                    <Td className="text-right">
                      <Money amount={loan.emiAmount} size="sm" />
                    </Td>
                    <Td>
                      <StatusPill status={loan.status} />
                    </Td>
                    <Td className="text-right">
                      <Link
                        to={`/loans/${loan.id}`}
                        className="inline-flex items-center gap-0.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        View <ChevronIcon size={14} />
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
