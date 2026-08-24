import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, InfoIcon } from "./Icon";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

interface StatusConfig {
  tone: Tone;
  label?: string;
}

// Covers every status enum value surfaced anywhere in the app: AccountStatus,
// LoanStatus, EmiStatus/PendingEmiStatus, TransactionStatus, KycStatus, and
// BureauLookupStatus. Unknown values fall back to a neutral pill with the
// raw text so nothing silently disappears.
const STATUS_MAP: Record<string, StatusConfig> = {
  ACTIVE: { tone: "success" },
  VERIFIED: { tone: "success" },
  SUCCESS: { tone: "success" },
  COMPLETED: { tone: "success" },
  PAID: { tone: "success" },

  PENDING: { tone: "warning" },
  FROZEN: { tone: "warning" },
  OVERDUE: { tone: "warning", label: "Overdue" },
  CONSENT_DENIED: { tone: "warning", label: "Consent denied" },

  DEFAULTED: { tone: "danger" },
  REJECTED: { tone: "danger" },
  FAILED: { tone: "danger" },
  FORBIDDEN: { tone: "danger" },
  NOT_FOUND: { tone: "danger", label: "Not found" },

  CLOSED: { tone: "neutral" },
};

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-200",
  warning: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-200",
  danger: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-200",
  neutral: "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200",
  info: "bg-info-50 text-info-700 ring-1 ring-inset ring-sky-200",
};

const TONE_ICON: Record<Tone, ReactNode> = {
  success: <CheckIcon size={11} strokeWidth={2.5} />,
  warning: <AlertIcon size={11} strokeWidth={2.5} />,
  danger: <AlertIcon size={11} strokeWidth={2.5} />,
  neutral: <InfoIcon size={11} strokeWidth={2.5} />,
  info: <InfoIcon size={11} strokeWidth={2.5} />,
};

function humanize(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function StatusPill({ status, className = "" }: { status: string; className?: string }) {
  const config = STATUS_MAP[status] ?? { tone: "neutral" as Tone };
  const label = config.label ?? humanize(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[config.tone]} ${className}`}
    >
      {TONE_ICON[config.tone]}
      {label}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  );
}
