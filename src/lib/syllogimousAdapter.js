// Syllogimous v3 — Easy generator adapter
// ----------------------------------------------------------------------------
// Ported from Syllogimous v3 by 4skinskywalker
//   Original:  https://github.com/4skinskywalker/Syllogimous-v3
//   License:   CC BY-NC 3.0 — non-commercial only
//   This app:  GOATED Relational n-Back — free, non-commercial. Compatible.
// Only the "Easy" subset is ported: 2-premise Distinction (same/opposite),
// 2-premise Comparison (more/less), 2-premise Temporal (before/after). Each
// item is reading-time ~2s, so it fits inside the n-back side-task window
// without changing SOA — analogous to how CCT is layered.
// ----------------------------------------------------------------------------

// Token bank — small, neutral, semantically unloaded so the player isn't
// using world knowledge ("is whale > mouse?"). Single capital letter-ish
// glyphs to keep premises short.
const ENTITY_BANK = [
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ψ', 'ω',
];

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickEntities(n) {
  return shuffle(ENTITY_BANK).slice(0, n);
}

// Distinction: transitive same/opposite chain.
// Premises: A same B, B opposite C → conclusion: A opposite C
// Two buckets. Each "same" merges buckets, each "opposite" splits.
function generateDistinction() {
  const [a, b, c] = pickEntities(3);
  const bucketA = 0;
  const bucketB = Math.random() < 0.5 ? 0 : 1;
  const bucketC = Math.random() < 0.5 ? 0 : 1;
  const rel = (x, y) => x === y ? 'same as' : 'opposite of';
  const premises = [`${a} is ${rel(bucketA, bucketB)} ${b}`, `${b} is ${rel(bucketB, bucketC)} ${c}`];
  const trueConclusionRel = rel(bucketA, bucketC);
  // 50/50: show the true conclusion (isValid=true) or flip it (isValid=false)
  const askValid = Math.random() < 0.5;
  const showRel = askValid ? trueConclusionRel : (trueConclusionRel === 'same as' ? 'opposite of' : 'same as');
  return {
    family: 'distinction',
    premises,
    conclusion: `${a} is ${showRel} ${c}`,
    isValid: askValid,
  };
}

// Comparison: more-than / less-than transitive chain.
// Premises: A > B, B > C  →  A > C. Player decides if conclusion follows.
function generateComparison() {
  const [a, b, c] = pickEntities(3);
  // Place on a line 0,1,2 (random permutation), then derive premises by
  // adjacent comparisons so the chain is consistent.
  const order = shuffle([a, b, c]); // smallest→largest by index
  const idx = (x) => order.indexOf(x);
  const cmp = (x, y) => idx(x) > idx(y) ? 'more than' : 'less than';
  const premises = [`${a} is ${cmp(a, b)} ${b}`, `${b} is ${cmp(b, c)} ${c}`];
  // True relation A vs C
  const trueRel = cmp(a, c);
  const askValid = Math.random() < 0.5;
  const showRel = askValid ? trueRel : (trueRel === 'more than' ? 'less than' : 'more than');
  return {
    family: 'comparison',
    premises,
    conclusion: `${a} is ${showRel} ${c}`,
    isValid: askValid,
  };
}

// Temporal: before/after transitive chain. Same shape as comparison.
function generateTemporal() {
  const [a, b, c] = pickEntities(3);
  const order = shuffle([a, b, c]); // earliest→latest
  const idx = (x) => order.indexOf(x);
  const rel = (x, y) => idx(x) < idx(y) ? 'before' : 'after';
  const premises = [`${a} is ${rel(a, b)} ${b}`, `${b} is ${rel(b, c)} ${c}`];
  const trueRel = rel(a, c);
  const askValid = Math.random() < 0.5;
  const showRel = askValid ? trueRel : (trueRel === 'before' ? 'after' : 'before');
  return {
    family: 'temporal',
    premises,
    conclusion: `${a} is ${showRel} ${c}`,
    isValid: askValid,
  };
}

const GENERATORS = {
  easy: [generateDistinction, generateComparison, generateTemporal],
};

// Public API — pick a generator by difficulty and return one RST item.
//   difficulty: 'easy' (only Easy supported in this round)
//   negation:   if true, occasionally flip the conclusion's relation token
//               to "not X" form. Off by default — adds another logical
//               operation to read which is heavier than the side-task window.
export function generateRSTItem(difficulty = 'easy', { negation = false } = {}) {
  const bucket = GENERATORS[difficulty] || GENERATORS.easy;
  const gen = bucket[Math.floor(Math.random() * bucket.length)];
  const item = gen();
  if (negation && Math.random() < 0.4) {
    // Flip the meaning of the conclusion via explicit "is not". Keeps the
    // truth value consistent: flipping the predicate flips isValid.
    item.conclusion = item.conclusion.replace(' is ', ' is NOT ');
    item.isValid = !item.isValid;
  }
  return item;
}
