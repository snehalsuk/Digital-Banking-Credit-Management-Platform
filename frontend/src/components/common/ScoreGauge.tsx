const SCORE_MIN = 300;
const SCORE_MAX = 900;

const BANDS = [
  { max: 650, label: "Poor", color: "#e11d48", track: "#fecdd3" },
  { max: 700, label: "Fair", color: "#d97706", track: "#fde68a" },
  { max: 750, label: "Good", color: "#ca8a04", track: "#fef08a" },
  { max: 800, label: "Very Good", color: "#65a30d", track: "#d9f99d" },
  { max: Infinity, label: "Excellent", color: "#059669", track: "#a7f3d0" },
];

function bandForScore(score: number) {
  return BANDS.find((b) => score < b.max) ?? BANDS[BANDS.length - 1];
}

/**
 * Semi-circular arc gauge for a 300-900 credit score. Band thresholds mirror
 * the backend's ScoreBandUtil. Uses the `pathLength` trick so the stroke
 * dash math is expressed in clean percentage units.
 */
export function ScoreGauge({ score, band, size = 220 }: { score: number; band?: string; size?: number }) {
  const clamped = Math.min(SCORE_MAX, Math.max(SCORE_MIN, score));
  const percent = ((clamped - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  const active = bandForScore(score);
  const label = band ?? active.label;

  const height = size * 0.62;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height }}>
        <svg viewBox="0 0 200 124" width={size} height={height} className="overflow-visible">
          <path
            d="M16,112 A84,84 0 0 1 184,112"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={16}
            strokeLinecap="round"
            pathLength={100}
          />
          <path
            d="M16,112 A84,84 0 0 1 184,112"
            fill="none"
            stroke={active.color}
            strokeWidth={16}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${percent} ${100 - percent}`}
            style={{ transition: "stroke-dasharray 0.6s ease-out" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="tabular-nums text-4xl font-bold" style={{ color: active.color }}>
            {score}
          </span>
          <span className="text-xs font-medium text-neutral-400">of {SCORE_MAX}</span>
        </div>
      </div>
      <span
        className="mt-1 rounded-full px-3 py-1 text-sm font-semibold"
        style={{ color: active.color, background: active.track + "80" }}
      >
        {label}
      </span>
    </div>
  );
}
