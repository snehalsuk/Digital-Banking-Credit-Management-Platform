import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import * as creditScoreApi from "../api/creditScoreApi";
import * as customerApi from "../api/customerApi";
import { ScoreGauge } from "../components/common/ScoreGauge";
import type { CreditScoreLookupResponse } from "../types/creditScore";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Checkbox, Input, Select } from "../components/common/FormField";
import { StatusPill } from "../components/common/StatusPill";
import { Money } from "../components/common/Money";
import { EmptyState } from "../components/common/EmptyState";
import { Table, THead, Th, TBody, Tr, Td } from "../components/common/Table";
import { AlertIcon, CheckIcon, GaugeIcon, InfoIcon } from "../components/common/Icon";

const OFFICER_PURPOSES = ["Loan underwriting", "KYC verification", "Periodic review"];

export function CreditScorePage() {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const isOfficerOrAdmin = user?.role === "LOAN_OFFICER" || user?.role === "ADMIN";

  const [pan, setPan] = useState("");
  const [panLoading, setPanLoading] = useState(isCustomer);
  const [purpose, setPurpose] = useState(OFFICER_PURPOSES[0]);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [result, setResult] = useState<CreditScoreLookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customers look up only their own PAN — pre-fill and lock it from their KYC profile.
  useEffect(() => {
    if (!isCustomer) return;
    let cancelled = false;
    customerApi
      .getMyProfile()
      .then((profile) => {
        if (!cancelled) setPan(profile.pan);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your PAN. Complete your KYC profile first.");
      })
      .finally(() => {
        if (!cancelled) setPanLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCustomer]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!consentConfirmed) {
      setError("You must confirm consent before running a credit score lookup.");
      return;
    }

    setLoading(true);
    try {
      const response = await creditScoreApi.lookupCreditScore({
        pan,
        consentConfirmed,
        purpose: isCustomer ? "Self credit check" : purpose,
      });
      setResult(response);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 404) {
        setError("No customer found for the given PAN.");
      } else if (status === 403) {
        setError("You are not authorized to look up this PAN.");
      } else if (message?.toLowerCase().includes("consent")) {
        setError("Consent must be confirmed before a credit bureau lookup can proceed.");
      } else {
        setError(message ?? "Could not complete the credit score lookup.");
      }
    } finally {
      setLoading(false);
    }
  }

  const delinquentTradeLines = result?.tradeLines.filter((t) => t.daysPastDue > 0) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Credit Score Lookup"
        description={
          isCustomer
            ? "Check your combined credit score and repayment history."
            : "Look up a customer's credit score with their confirmed consent."
        }
      />

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="PAN"
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            disabled={isCustomer}
            pattern="^[A-Z]{5}[0-9]{4}[A-Z]$"
            maxLength={10}
            placeholder="AAAAA9999A"
            required
          />

          {isOfficerOrAdmin && (
            <Select label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {OFFICER_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          )}

          <div className={`flex items-center ${isOfficerOrAdmin ? "lg:col-span-2" : "sm:col-span-2 lg:col-span-2"}`}>
            <Checkbox
              label={
                isCustomer
                  ? "I consent to my credit score and EMI history being checked."
                  : "I confirm consent has been obtained from the customer for this bureau lookup."
              }
              checked={consentConfirmed}
              onChange={(e) => setConsentConfirmed(e.target.checked)}
              required
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button type="submit" loading={loading} disabled={panLoading || !pan} fullWidth icon={<GaugeIcon size={16} />}>
              {isCustomer ? "Check my score" : "Look up score"}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {result && (
        <div className="animate-fade-in flex flex-col gap-6">
          {result.dataSource === "MOCK" && (
            <div className="flex items-start gap-3 rounded-xl border border-info-100 bg-info-50 px-4 py-3.5 text-sm text-info-700">
              <InfoIcon size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Simulated bureau data</p>
                <p className="mt-0.5 text-info-700/90">
                  This lookup used mock bureau data for development. A live bureau integration requires a
                  commercial agreement with a credit bureau.
                </p>
              </div>
            </div>
          )}

          <Card className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-between">
            <div className="flex items-center justify-center">
              <ScoreGauge score={result.combinedScore} band={result.scoreBand} />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-1 sm:content-center">
              <StatTile label="Bureau score" value={result.bureauScore} />
              <StatTile label="Internal score" value={result.internalScore} />
              <StatTile label="Combined score" value={result.combinedScore} emphasize />
            </div>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Pending / overdue EMIs</h2>
            <Card padded={false}>
              {result.pendingEmis.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    positive
                    icon={<CheckIcon size={22} />}
                    title="You're all caught up"
                    description="No pending or overdue EMIs on the bank's own book."
                  />
                </div>
              ) : (
                <Table>
                  <THead>
                    <Th>Loan ID</Th>
                    <Th>Installment #</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Due date</Th>
                    <Th className="text-right">Days overdue</Th>
                    <Th>Status</Th>
                  </THead>
                  <TBody>
                    {result.pendingEmis.map((emi) => (
                      <Tr key={`${emi.loanId}-${emi.installmentNumber}`}>
                        <Td>#{emi.loanId}</Td>
                        <Td>{emi.installmentNumber}</Td>
                        <Td className="text-right">
                          <Money amount={emi.emiAmount} size="sm" />
                        </Td>
                        <Td>{emi.dueDate}</Td>
                        <Td className="text-right">
                          {emi.daysOverdue > 0 ? (
                            <span className="font-medium text-warning-600">{emi.daysOverdue}</span>
                          ) : (
                            "-"
                          )}
                        </Td>
                        <Td>
                          <StatusPill status={emi.status} />
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          </div>

          {delinquentTradeLines.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Bureau-reported delinquencies
                <span className="ml-2 text-xs font-normal normal-case text-neutral-400">as reported by credit bureau</span>
              </h2>
              <Card padded={false}>
                <Table>
                  <THead>
                    <Th>Lender</Th>
                    <Th>Account type</Th>
                    <Th className="text-right">Sanctioned</Th>
                    <Th className="text-right">Balance</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Days past due</Th>
                  </THead>
                  <TBody>
                    {delinquentTradeLines.map((t, idx) => (
                      <Tr key={`${t.lenderName}-${idx}`}>
                        <Td>{t.lenderName}</Td>
                        <Td>{t.accountType}</Td>
                        <Td className="text-right">
                          <Money amount={t.sanctionedAmount} size="sm" />
                        </Td>
                        <Td className="text-right">
                          <Money amount={t.currentBalance} size="sm" />
                        </Td>
                        <Td>{t.accountStatus}</Td>
                        <Td className="text-right">
                          <span className="font-medium text-warning-600">{t.daysPastDue}</span>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </Card>
            </div>
          )}

          <p className="text-xs text-neutral-400">Last updated: {new Date(result.lastUpdated).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, emphasize = false }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
        emphasize ? "border-primary-200 bg-primary-50" : "border-neutral-200 bg-neutral-50"
      }`}
    >
      <span className={`text-sm font-medium ${emphasize ? "text-primary-700" : "text-neutral-500"}`}>{label}</span>
      <span className={`tabular-nums text-xl font-bold ${emphasize ? "text-primary-700" : "text-neutral-900"}`}>
        {value}
      </span>
    </div>
  );
}
