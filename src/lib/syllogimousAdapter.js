// Syllogimous v3 — Easy generator adapter
// ----------------------------------------------------------------------------
// Inspired by Syllogimous v3 by 4skinskywalker
//   Original:  https://github.com/4skinskywalker/Syllogimous-v3
//   License:   CC BY-NC 3.0 — non-commercial only
//   This app:  GOATED Relational n-Back — free, non-commercial. Compatible.
// ----------------------------------------------------------------------------
// CCT-style RST: one premise per trial, candidate conclusion from trial N
// onwards. Uses the Distinction family (same / opposite buckets) — the only
// Syllogimous family whose conclusion is fully derivable from the chain of
// premises alone (no missing-information ambiguity), which is what we need
// for n-back style "press if valid".
//
// Truth model: each entity has a bucket (0 or 1). A premise "X is same as Y"
// holds iff bucket(X) === bucket(Y). The conclusion at trial t about E_t
// vs E_{t-N} is derivable from the chain of N premises in between — players
// who track the parity of "opposite" predicates over the window can decide.

const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ψ', 'ω'];

function greekLabel(i) {
  const base = GREEK[i % GREEK.length];
  const cycle = Math.floor(i / GREEK.length);
  return cycle === 0 ? base : `${base}${cycle + 1}`;
}

export function createRSTChain() {
  return { entities: [], buckets: [] };
}

// Advance the RST chain by one trial. Returns the data the engine attaches
// to stream A's stim plus the new chain to persist into next-round state.
//
//   chain         — { entities, buckets } from the previous trial (or empty)
//   n             — current effective N
//   matchChance   — P(conclusion is valid) when a conclusion is shown
//
// hasConclusion is false on trials 0..N-1 (not enough chain depth), true
// from trial N onwards. When hasConclusion is true, isValid is the ground
// truth the engine scores against.
export function nextRSTTurn(chain, n, matchChance = 0.4) {
  const idx = chain.entities.length;
  const entity = greekLabel(idx);
  const bucket = Math.random() < 0.5 ? 0 : 1;

  const nextChain = {
    entities: [...chain.entities, entity],
    buckets: [...chain.buckets, bucket],
  };

  // Premise for this trial: this entity vs. the immediately previous one.
  // Trial 1 has no previous entity, so the "premise" just introduces the
  // first token. CCT does the same — trial 1 shows the digit, no result.
  let premise = null;
  if (idx > 0) {
    const prevEnt = chain.entities[idx - 1];
    const prevBucket = chain.buckets[idx - 1];
    premise = {
      a: entity,
      rel: bucket === prevBucket ? 'same as' : 'opposite of',
      b: prevEnt,
    };
  } else {
    premise = { a: entity, rel: 'introduced', b: null };
  }

  // Conclusion shown from trial N onwards: this entity vs. the entity N
  // trials back. Truth = derived from buckets. With matchChance probability
  // we show the true relation; otherwise we flip it (negative trial).
  let conclusion = null;
  let isValid = null;
  let hasConclusion = false;
  if (idx >= n) {
    hasConclusion = true;
    const startIdx = idx - n;
    const startEnt = nextChain.entities[startIdx];
    const startBucket = nextChain.buckets[startIdx];
    const trueRel = bucket === startBucket ? 'same as' : 'opposite of';
    const valid = Math.random() < matchChance;
    const showRel = valid
      ? trueRel
      : (trueRel === 'same as' ? 'opposite of' : 'same as');
    conclusion = { a: entity, rel: showRel, b: startEnt };
    isValid = valid;
  }

  return {
    chain: nextChain,
    premise,
    conclusion,
    isValid,
    hasConclusion,
    family: 'distinction',
  };
}
