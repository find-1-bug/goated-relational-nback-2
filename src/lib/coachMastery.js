// ─── Coach Mastery + Spaced-Repetition Scheduler ────────────────────────────
//
// Replaces the old linear consecutive-success/failure model with per-phase
// mastery tracking + Leitner-style spaced repetition.
//
// Per-phase tracking shape:
//   phaseMastery[i] = {
//     attempts: 4,           // total times this phase has been played
//     successes: 3,          // sessions ≥ pass threshold (75% acc)
//     masteryLevel: 3,       // 0..5 (Leitner box)
//     lastSessionN: 12,      // session count when last played
//     nextReviewN: 23,       // session count when next due for review
//   }
//
// Mastery levels (SR intervals — in "sessions until next review"):
//   0 = never attempted / just failed     → review immediately (next session)
//   1 = 1 success                          → review in 2 sessions
//   2 = 2 successes                        → review in 5
//   3 = 3 successes                        → review in 11
//   4 = 4 successes                        → review in 25  (considered mastered)
//   5 = 5+ successes                       → review in 60  (maintenance only)
//
// A failure (< 55% accuracy) drops mastery by one level for that phase.
//
// Session picker logic (pickNextPhase):
//   1. If any mastered phase (level ≥ 2) is due for review, 40% chance to pick it.
//   2. Otherwise pick the lowest-index phase that isn't yet at mastery level 2.
//   3. If all phases up to phaseIndex are mastered, advance phaseIndex by 1.
//   4. If at the max phase and all mastered, do a maintenance review.
//
// This breaks the linear-grind feel of the old model. Players who plateau
// on Phase 7 don't just see Phase 7 forever — they cycle back through
// earlier phases at growing intervals, which both keeps the chain warm
// and surfaces forgotten material.

export const MASTERY_INTERVALS = [1, 2, 5, 11, 25, 60];
export const MASTERY_LEVELS = MASTERY_INTERVALS.length; // = 6 (0..5)
export const MASTERY_PASS_THRESHOLD = 75;
export const MASTERY_FAIL_THRESHOLD = 55;
export const REVIEW_PICK_CHANCE = 0.40;

// Default per-phase mastery record.
export function blankMastery() {
  return { attempts: 0, successes: 0, masteryLevel: 0, lastSessionN: 0, nextReviewN: 0 };
}

// Migrate a legacy coachState (no phaseMastery / no sessionCount) to the new
// shape. Treats phases 0..phaseIndex-1 as "already mastered at level 2" so
// users don't get reset back to phase 1 on first session under the new model.
export function migrateCoachState(state) {
  if (!state || typeof state !== 'object') {
    return {
      phaseIndex: 0,
      sessionCount: 0,
      phaseMastery: {},
      rankName: 'Initiate (Rank I)',
    };
  }
  const out = { ...state };
  if (typeof out.phaseIndex !== 'number') out.phaseIndex = 0;
  if (typeof out.sessionCount !== 'number') out.sessionCount = 0;
  if (!out.phaseMastery || typeof out.phaseMastery !== 'object') {
    out.phaseMastery = {};
    // Mark phases before the current frontier as level-2 mastered so they
    // qualify for review rotation rather than being treated as untried.
    for (let i = 0; i < out.phaseIndex; i++) {
      out.phaseMastery[i] = { ...blankMastery(), masteryLevel: 2, successes: 2, attempts: 2 };
    }
  }
  // Strip legacy fields so the migrated record is clean
  delete out.consecutiveSuccesses;
  delete out.consecutiveFailures;
  return out;
}

// Decide which phase the next Coach Autopilot session should play.
// Returns { phaseIndex, reason } where reason ∈ 'frontier' | 'review' |
// 'advance' | 'maintenance'.
//
// `totalPhases` is COACH_PHASES.length (passed in to avoid circular import).
export function pickNextPhase(state, totalPhases) {
  const sessionN = state.sessionCount || 0;
  const mastery = state.phaseMastery || {};
  const phaseIndex = state.phaseIndex || 0;

  // 1. Any mastered phase (level ≥ 2) due for review?
  const dueReviews = [];
  for (let i = 0; i < totalPhases; i++) {
    const m = mastery[i];
    if (m && m.masteryLevel >= 2 && (m.nextReviewN || 0) <= sessionN) {
      dueReviews.push(i);
    }
  }
  if (dueReviews.length > 0 && Math.random() < REVIEW_PICK_CHANCE) {
    return { phaseIndex: dueReviews[Math.floor(Math.random() * dueReviews.length)], reason: 'review' };
  }

  // 2. Lowest-index phase up through the frontier that isn't level-2 mastered
  for (let i = 0; i <= Math.min(phaseIndex, totalPhases - 1); i++) {
    const m = mastery[i];
    if (!m || m.masteryLevel < 2) {
      return { phaseIndex: i, reason: 'frontier' };
    }
  }

  // 3. All up-to-frontier mastered → push frontier forward
  if (phaseIndex < totalPhases - 1) {
    return { phaseIndex: phaseIndex + 1, reason: 'advance' };
  }

  // 4. Max frontier + everything mastered → maintenance pick (random level≥2 phase)
  const candidates = [];
  for (let i = 0; i < totalPhases; i++) {
    if ((mastery[i]?.masteryLevel || 0) >= 2) candidates.push(i);
  }
  return {
    phaseIndex: candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : phaseIndex,
    reason: 'maintenance',
  };
}

// Apply a session result to the mastery record for the played phase and
// advance the global session counter. Returns the new state.
export function updateMastery(state, playedPhaseIndex, accuracy, totalPhases) {
  const next = { ...state, phaseMastery: { ...(state.phaseMastery || {}) }, sessionCount: (state.sessionCount || 0) + 1 };
  const cur = next.phaseMastery[playedPhaseIndex] || blankMastery();
  const m = { ...cur, attempts: cur.attempts + 1, lastSessionN: next.sessionCount };
  if (accuracy >= MASTERY_PASS_THRESHOLD) {
    m.successes = cur.successes + 1;
    m.masteryLevel = Math.min(MASTERY_LEVELS - 1, cur.masteryLevel + 1);
  } else if (accuracy < MASTERY_FAIL_THRESHOLD) {
    m.masteryLevel = Math.max(0, cur.masteryLevel - 1);
  }
  m.nextReviewN = next.sessionCount + MASTERY_INTERVALS[m.masteryLevel];
  next.phaseMastery[playedPhaseIndex] = m;
  // Advance frontier when the played phase is the current frontier AND now level-2 mastered
  if (playedPhaseIndex === (state.phaseIndex || 0) && m.masteryLevel >= 2 && playedPhaseIndex < totalPhases - 1) {
    next.phaseIndex = playedPhaseIndex + 1;
  }
  return next;
}

// Compact summary string for UI ("Lvl 3 · review in 7" or "Not attempted").
export function masteryLabel(masteryEntry, currentSessionN) {
  if (!masteryEntry || masteryEntry.attempts === 0) return 'Not attempted';
  const lvl = masteryEntry.masteryLevel;
  const due = (masteryEntry.nextReviewN || 0) - (currentSessionN || 0);
  const dueStr = due <= 0 ? 'due now' : `in ${due}`;
  return `Lvl ${lvl} · review ${dueStr}`;
}
