// Syllogimous v3 — Multi-family RST adapter
// ----------------------------------------------------------------------------
// Inspired by Syllogimous v3 by 4skinskywalker
//   Original:  https://github.com/4skinskywalker/Syllogimous-v3
//   License:   CC BY-NC 3.0 — non-commercial only
//   This app:  GOATED Relational n-Back — free, non-commercial. Compatible.
// ----------------------------------------------------------------------------
// CCT-style RST: one premise per trial, candidate conclusion from trial N
// onwards. Three families now, gated by `difficulty`:
//
//   distinction (Easy)     — XOR parity over same/opposite chain. Binary
//                            buckets; conclusion derivable from premises.
//   comparison  (Medium)   — Transitive order chain (more/less). Numeric
//                            order indices; conclusion derivable from premises.
//   analogy     (Hard)     — 4-place structural form match. Each trial = a
//                            fresh pair (A, B) with a relation R; conclusion
//                            asks whether current pair stands to N-back pair
//                            in the same role-binding direction. This is the
//                            Halford 4-place rung — the canonical Gf target.
//
// Difficulty maps to family POOL:
//   easy   → distinction only
//   medium → distinction OR comparison (random per session)
//   hard   → distinction OR comparison OR analogy (random per session)

const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ψ', 'ω'];

function greekLabel(i) {
  const base = GREEK[i % GREEK.length];
  const cycle = Math.floor(i / GREEK.length);
  return cycle === 0 ? base : `${base}${cycle + 1}`;
}

export function createRSTChain(family = 'distinction') {
  if (family === 'analogy') {
    return { family, pairs: [], forms: [] };
  }
  return { family, entities: [], values: [] };
}

export const RST_FAMILIES = ['distinction', 'comparison', 'analogy'];
export const RST_DIFFICULTY_POOLS = {
  easy:   ['distinction'],
  medium: ['distinction', 'comparison'],
  hard:   ['distinction', 'comparison', 'analogy'],
};

// Pick a family for the session given a difficulty level. The chain stays in
// one family for a whole session — switching families mid-session would break
// the chain logic (different state shapes) and confuse the player.
export function pickRSTFamily(difficulty = 'easy') {
  const pool = RST_DIFFICULTY_POOLS[difficulty] || RST_DIFFICULTY_POOLS.easy;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Hard difficulty = the analogy family. SOA extension is the engine's call;
// adapter just flags whether the family is "heavy".
export function isHeavyFamily(family) {
  return family === 'analogy';
}

// ─── Distinction (Easy) ──────────────────────────────────────────────────────
// Each entity has a hidden bucket (0/1). Premise: "X same/opposite of Y".
// Truth derivable from XOR parity over the bucket chain.
function nextDistinctionTurn(chain, n, matchChance) {
  const idx = (chain.entities || []).length;
  const entity = greekLabel(idx);
  const bucket = Math.random() < 0.5 ? 0 : 1;
  const nextChain = {
    family: 'distinction',
    entities: [...(chain.entities || []), entity],
    values:   [...(chain.values   || []), bucket],
  };

  let premise = null;
  if (idx > 0) {
    const prevEnt = chain.entities[idx - 1];
    const prevBucket = chain.values[idx - 1];
    premise = { a: entity, rel: bucket === prevBucket ? 'same as' : 'opposite of', b: prevEnt };
  } else {
    premise = { a: entity, rel: 'introduced', b: null };
  }

  let conclusion = null, isValid = null, hasConclusion = false;
  if (idx >= n) {
    hasConclusion = true;
    const startIdx = idx - n;
    const startEnt = nextChain.entities[startIdx];
    const startBucket = nextChain.values[startIdx];
    const trueRel = bucket === startBucket ? 'same as' : 'opposite of';
    const valid = Math.random() < matchChance;
    const showRel = valid ? trueRel : (trueRel === 'same as' ? 'opposite of' : 'same as');
    conclusion = { a: entity, rel: showRel, b: startEnt };
    isValid = valid;
  }
  return { chain: nextChain, premise, conclusion, hasConclusion, isValid, family: 'distinction' };
}

// ─── Comparison (Medium) ─────────────────────────────────────────────────────
// Each entity has a hidden order index (random integer). Premise: "X more
// than Y" / "X less than Y". Conclusion derivable from direct comparison.
function nextComparisonTurn(chain, n, matchChance) {
  const idx = (chain.entities || []).length;
  const entity = greekLabel(idx);
  // Pick an order; avoid ties with the previous entity so the premise is
  // unambiguous.
  const prevOrder = idx > 0 ? chain.values[idx - 1] : 500;
  let order;
  do { order = 1 + Math.floor(Math.random() * 998); } while (order === prevOrder);

  const nextChain = {
    family: 'comparison',
    entities: [...(chain.entities || []), entity],
    values:   [...(chain.values   || []), order],
  };

  let premise = null;
  if (idx > 0) {
    const prevEnt = chain.entities[idx - 1];
    premise = { a: entity, rel: order > prevOrder ? 'more than' : 'less than', b: prevEnt };
  } else {
    premise = { a: entity, rel: 'introduced', b: null };
  }

  let conclusion = null, isValid = null, hasConclusion = false;
  if (idx >= n) {
    hasConclusion = true;
    const startIdx = idx - n;
    const startEnt = nextChain.entities[startIdx];
    const startOrder = nextChain.values[startIdx];
    if (order === startOrder) {
      // Vanishing case (rare). Skip conclusion this trial.
      hasConclusion = false;
    } else {
      const trueRel = order > startOrder ? 'more than' : 'less than';
      const valid = Math.random() < matchChance;
      const showRel = valid ? trueRel : (trueRel === 'more than' ? 'less than' : 'more than');
      conclusion = { a: entity, rel: showRel, b: startEnt };
      isValid = valid;
    }
  }
  return { chain: nextChain, premise, conclusion, hasConclusion, isValid, family: 'comparison' };
}

// ─── Analogy (Hard) — true 4-place ───────────────────────────────────────────
// Each trial introduces a FRESH PAIR (A, B) with a relation R drawn from
// multiple families. The "form" of the pair = (firstDominant, family).
//
// Conclusion at trial t asks: "is the current pair's structure analogous to
// the pair from N back?" — i.e., does the same role-binding hold under the
// same family direction. Match iff (firstDominant_t === firstDominant_{t-N}).
// Family is rotated for variety but match doesn't require same family — we
// test pure structural form. (Stricter mode could require both, but pure
// form is the Halford 4-place test.)
const ANALOGY_FAMILIES = [
  { name: 'comparison', pos: 'more than',    neg: 'less than'    },
  { name: 'temporal',   pos: 'after',        neg: 'before'       },
  { name: 'magnitude',  pos: 'heavier than', neg: 'lighter than' },
  { name: 'hierarchy',  pos: 'above',        neg: 'below'        },
];

function nextAnalogyTurn(chain, n, matchChance) {
  const idx = (chain.pairs || []).length;
  // Each trial uses two fresh entities so the player can't shortcut by
  // identity matching. Pair the indices 2i, 2i+1.
  const ent1 = greekLabel(idx * 2);
  const ent2 = greekLabel(idx * 2 + 1);

  // Decide form. For trials where we can produce a conclusion, bias the
  // form to land on match-chance frequency.
  let firstDominant;
  if (idx >= n) {
    const wantTarget = Math.random() < matchChance;
    const nbForm = chain.forms[idx - n].firstDominant;
    firstDominant = wantTarget ? nbForm : !nbForm;
  } else {
    firstDominant = Math.random() < 0.5;
  }

  const family = ANALOGY_FAMILIES[Math.floor(Math.random() * ANALOGY_FAMILIES.length)];
  const rel = firstDominant ? family.pos : family.neg;

  const premise = { a: ent1, rel, b: ent2 };

  const nextChain = {
    family: 'analogy',
    pairs: [...(chain.pairs || []), [ent1, ent2]],
    forms: [...(chain.forms || []), { firstDominant, family: family.name }],
  };

  let conclusion = null, isValid = null, hasConclusion = false;
  if (idx >= n) {
    hasConclusion = true;
    const nbPair = nextChain.pairs[idx - n];
    const nbForm = nextChain.forms[idx - n];
    const sameForm = nbForm.firstDominant === firstDominant;
    // The "conclusion" claim is always: "the current pair is analogous to
    // the N-back pair." Truth = sameForm. Player presses R if true.
    conclusion = {
      a: ent1, b: ent2,
      rel: 'analogous to',
      // Show the N-back pair in natural-language form so the player can
      // mentally compare structure without flipping back to past trials.
      tgtA: nbPair[0], tgtB: nbPair[1], tgtFamily: nbForm.family,
      tgtFirstDominant: nbForm.firstDominant,
    };
    isValid = sameForm;
  }
  return { chain: nextChain, premise, conclusion, hasConclusion, isValid, family: 'analogy' };
}

// ─── Public dispatch ─────────────────────────────────────────────────────────
// Routes to the right family generator based on chain.family. If chain is
// empty / family-less, falls back to distinction.
export function nextRSTTurn(chain, n, matchChance = 0.4) {
  const family = chain?.family || 'distinction';
  switch (family) {
    case 'comparison': return nextComparisonTurn(chain, n, matchChance);
    case 'analogy':    return nextAnalogyTurn(chain, n, matchChance);
    case 'distinction':
    default:           return nextDistinctionTurn(chain, n, matchChance);
  }
}
