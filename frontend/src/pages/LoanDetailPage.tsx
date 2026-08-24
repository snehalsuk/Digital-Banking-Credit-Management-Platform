import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as loanApi from "../api/loanApi";
import type { EmiScheduleResponse, LoanResponse } from "../types/loan";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/FormField";
import { StatusPill } from "../components/common/StatusPill";
import { Money } from "../components/common/Money";
import { EmptyState } from "../components/common/EmptyState";
import { Table, THead, Th, TBody, Tr, Td } from "../components/common/Table";
import { AlertIcon, InfoIcon } from "../components/common/Icon";
import { useToast } from "../components/common/ToastContext";

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const loanId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [loan, setLoan] = useState<LoanResponse | null>(null);
  const [schedule, setSchedule] = useState<EmiScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  function loadLoan() {
    if (!Number.isFinite(loanId)) return;
    setLoading(true);
    Promise.all([loanApi.getLoan(loanId), loanApi.getEmiSchedule(loanId)])
      .then(([loanData, scheduleData]) => {
        setLoan(loanData);
        setSchedule(scheduleData);
      })
      .catch(() => setError("Could not load loan."))
      .finally(() => setLoading(false));
  }

  useEffect(loadLoan, [loanId]);

  const nextUnpaid = schedule.find((installment) => installment.status !== "PAID");

  useEffect(() => {
    if (nextUnpaid) {
      setPayAmount(String(nextUnpaid.emiAmount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextUnpaid?.installmentNumber]);

  async function handlePay(event: FormEvent) {
    event.preventDefault();
    if (!nextUnpaid) return;
    setError(null);
    setPaying(true);
    try {
      await loanApi.payEmi(loanId, nextUnpaid.installmentNumber, { amount: Number(payAmount) });
      toast.success(`Installment #${nextUnpaid.installmentNumber} paid.`);
      loadLoan();
    } catch {
      setError("Could not process EMI payment. Check the linked account balance.");
      toast.error("Could not process EMI payment.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Loan" />
        <Card>
          <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
        </Card>
      </div>
    );
  }

  if (!loan) {
    return (
      <EmptyState
        icon={<AlertIcon size={22} />}
        title="Loan not found"
        description="This loan may not exist or you may not have access to it."
        action={
          <Button size="sm" onClick={() => navigate("/loans")}>
            Back to loans
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Loan #${loan.id}`}
        description={
          <span className="flex items-center gap-2">
            {loan.loanType} loan
            <StatusPill status={loan.status} />
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-neutral-500">Principal</p>
          <Money amount={loan.principal} size="lg" className="mt-1 block" />
        </Card>
        <Card>
          <p className="text-xs font-medium text-neutral-500">Interest rate</p>
          <p className="tabular-nums mt-1 text-2xl font-bold text-neutral-900">{loan.interestRateAnnual}%</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-neutral-500">Tenure</p>
          <p className="tabular-nums mt-1 text-2xl font-bold text-neutral-900">{loan.tenureMonths} mo</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-neutral-500">EMI</p>
          <Money amount={loan.emiAmount} size="lg" className="mt-1 block" />
        </Card>
      </div>

      {loan.disbursedDate && <p className="text-sm text-neutral-500">Disbursed on {loan.disbursedDate}</p>}

      {loan.status === "PENDING" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-info-100 bg-info-50 px-4 py-3 text-sm text-info-700">
          <InfoIcon size={17} className="mt-0.5 shrink-0" />
          <span>Awaiting officer/admin approval before an EMI schedule is generated.</span>
        </div>
      )}

      {schedule.length > 0 && (
        <>
          {nextUnpaid && (
            <Card>
              <h2 className="mb-4 text-base font-semibold text-neutral-900">
                Pay next installment (#{nextUnpaid.installmentNumber})
              </h2>
              <form onSubmit={handlePay} className="flex flex-col items-end gap-4 sm:flex-row">
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  wrapperClassName="w-full sm:w-56"
                  startAdornment={<span className="text-sm">&#8377;</span>}
                />
                <Button type="submit" loading={paying}>
                  Pay EMI
                </Button>
              </form>
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
                  <AlertIcon size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </Card>
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">EMI schedule</h2>
            <Card padded={false}>
              <Table>
                <THead>
                  <Th>#</Th>
                  <Th>Due date</Th>
                  <Th className="text-right">Principal</Th>
                  <Th className="text-right">Interest</Th>
                  <Th className="text-right">EMI</Th>
                  <Th className="text-right">Paid</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Days overdue</Th>
                </THead>
                <TBody>
                  {schedule.map((installment) => (
                    <Tr
                      key={installment.id}
                      className={nextUnpaid?.id === installment.id ? "bg-primary-50/40" : undefined}
                    >
                      <Td>{installment.installmentNumber}</Td>
                      <Td>{installment.dueDate}</Td>
                      <Td className="text-right">
                        <Money amount={installment.principalComponent} size="sm" />
                      </Td>
                      <Td className="text-right">
                        <Money amount={installment.interestComponent} size="sm" />
                      </Td>
                      <Td className="text-right">
                        <Money amount={installment.emiAmount} size="sm" />
                      </Td>
                      <Td className="text-right">
                        <Money amount={installment.paidAmount} size="sm" />
                      </Td>
                      <Td>
                        <StatusPill status={installment.status} />
                      </Td>
                      <Td className="text-right">
                        {installment.daysOverdue > 0 ? (
                          <span className="font-medium text-warning-600">{installment.daysOverdue}</span>
                        ) : (
                          "-"
                        )}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
