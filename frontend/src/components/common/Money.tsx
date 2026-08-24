const formatter = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(amount: number): string {
  return formatter.format(amount);
}

type Sign = "positive" | "negative" | "neutral";

const SIGN_CLASSES: Record<Sign, string> = {
  positive: "text-success-600",
  negative: "text-danger-600",
  neutral: "text-neutral-900",
};

export function Money({
  amount,
  sign = "neutral",
  prefix = "",
  className = "",
  size = "md",
}: {
  amount: number;
  sign?: Sign;
  prefix?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass =
    size === "xl" ? "text-4xl font-bold" : size === "lg" ? "text-2xl font-bold" : size === "md" ? "text-base font-semibold" : "text-sm font-medium";
  return (
    <span className={`tabular-nums ${sizeClass} ${SIGN_CLASSES[sign]} ${className}`}>
      {prefix}
      {formatMoney(amount)}
    </span>
  );
}
