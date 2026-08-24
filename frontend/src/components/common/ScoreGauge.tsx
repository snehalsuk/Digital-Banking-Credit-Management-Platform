const SCORE_MIN = 300;
const SCORE_MAX = 900;

const BANDS = [
  { max: 650, label: "Poor", color: "#d33" },
  { max: 700, label: "Fair", color: "#e08a00" },
  { max: 750, label: "Good", color: "#c9a800" },
  { max: 800, label: "Very Good", color: "#7cb342" },
  { max: Infinity, label: "Excellent", color: "#2a8f2a" },
];

function colorForScore(score: number): string {
  const band = BANDS.find((b) => score < b.max);
  return (band ?? BANDS[BANDS.length - 1]).color;
}

function labelForScore(score: number): string {
  const band = BANDS.find((b) => score < b.max);
  return (band ?? BANDS[BANDS.length - 1]).label;
}

/** Color-banded gauge for a 300-900 credit score. Band thresholds mirror the backend's ScoreBandUtil. */
export function ScoreGauge({ score, band }: { score: number; band?: string }) {
  const clamped = Math.min(SCORE_MAX, Math.max(SCORE_MIN, score));
  const percent = ((clamped - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  const color = colorForScore(score);

  return (
    <div className="score-gauge">
      <div className="score-gauge-track">
        <div className="score-gauge-segment segment-poor" />
        <div className="score-gauge-segment segment-fair" />
        <div className="score-gauge-segment segment-good" />
        <div className="score-gauge-segment segment-verygood" />
        <div className="score-gauge-segment segment-excellent" />
        <div className="score-gauge-marker" style={{ left: `${percent}%` }} />
      </div>
      <div className="score-gauge-value" style={{ color }}>
        {score}
      </div>
      <div className="score-gauge-band" style={{ color }}>
        {band ?? labelForScore(score)}
      </div>
    </div>
  );
}
