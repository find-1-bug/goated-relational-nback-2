// Reasoning Snapshot scoring.
//
// Honest by design: with no standardization sample we cannot output a real
// normed IQ. We report raw correct + a PROVISIONAL "Reasoning Index" (100±15
// scaled) for rough placement, but the scientifically meaningful number is the
// within-person pre→post DELTA. Mirrors IQ Mindware's SgS-12 framing.

// Provisional population assumptions for a 12-item battery. Deliberately
// conservative; the index is for tracking change, not clinical placement.
export const RI_MEAN = 6.5;   // assumed mean raw (of 12)
export const RI_SD = 2.2;     // assumed SD of raw

export const RI_CAVEAT =
  'Approximate index for tracking change over time — not a normed or clinical IQ. ' +
  'It uses untrained reasoning formats (matrices + series) on purpose, so improvement ' +
  'reflects transfer rather than practice on the training tasks.';

const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v));

export function rawToReasoningIndex(raw, total = 12) {
  const safeRaw = clamp(0, total, Math.round(Number(raw) || 0));
  const idx = Math.round(100 + 15 * ((safeRaw - RI_MEAN) / RI_SD));
  return clamp(40, 160, idx);
}

// answers: array aligned to items, each = chosen option index (or null/-1 for
// skipped / timed-out → counts as incorrect).
export function scoreForm(answers, items) {
  const subScores = {}; // subtest -> { correct, total }
  let correct = 0;
  items.forEach((item, i) => {
    const sub = item.subtest;
    if (!subScores[sub]) subScores[sub] = { correct: 0, total: 0 };
    subScores[sub].total += 1;
    const a = answers[i];
    const isCorrect = a != null && a === item.correctIndex;
    if (isCorrect) { correct += 1; subScores[sub].correct += 1; }
  });
  const total = items.length;
  return {
    rawScore: correct,
    total,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    reasoningIndex: rawToReasoningIndex(correct, total),
    subScores,
  };
}

export function indexBand(idx) {
  if (idx >= 130) return { label: 'Very High', color: 'text-emerald-400' };
  if (idx >= 115) return { label: 'High', color: 'text-cyan-400' };
  if (idx >= 85) return { label: 'Average', color: 'text-foreground' };
  if (idx >= 70) return { label: 'Low Average', color: 'text-amber-400' };
  return { label: 'Low', color: 'text-rose-400' };
}
