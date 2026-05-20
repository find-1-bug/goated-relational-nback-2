import {
  RELATIONSHIPS as ALL_RELATIONSHIPS,
  RELATIONSHIP_CATEGORIES,
  SHAPES,
  COLORS,
  MATCH_CHANCE,
  DUAL_MATCH_CHANCE,
  HIER_MATCH_CHANCE,
  DISTRACTOR_CHANCE,
  LURE_RATE,
  NEGATION_RATE,
  RST_OVERLAY_RATE,
  TOTAL_ROUNDS,
  getCategory,
  pickRandom,
  pickRandomExcluding,
  isVerbal,
  isSound,
  getVerbalPair,
  getSoundPair,
  pickTokenType,
  pickTokenWord,
  makeInverseStimulus,
  INVERSE_RELATIONSHIP,
  filterTransitiveRelationships,
} from './gameConstants';
import { generateRSTItem } from './syllogimousAdapter.js';

import { createRINTState, createRINTStates, generateRINTStimulus, isRINTConclusion, RINT_MIN_N } from './relationalIntegration.js';
export { calculateResults, computeNextNLevel } from './gameStats.js';


// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStimulusEntry(rel) {
  const shapeA = pickRandom(SHAPES);
  const shapeB = pickRandomExcluding(SHAPES, shapeA);
  const colorA = pickRandom(COLORS);
  const colorB = pickRandomExcluding(COLORS, colorA);
  const renderMode = Math.floor(Math.random() * 3);
  const shape3DA = pickRandom(['cube', 'sphere', 'pyramid', 'cone', 'torus', 'octahedron']);
  const shape3DB = pickRandomExcluding(['cube', 'sphere', 'pyramid', 'cone', 'torus', 'octahedron'], shape3DA);
  const size3DA = 2 + Math.random() * 1.5;
  const size3DB = 2 + Math.random() * 1.5;
  if (isSound(rel)) {
    const [soundA, soundB] = getSoundPair(rel);
    return { rel, soundA, soundB, wordA: soundA, wordB: soundB, shapeA, shapeB, colorA, colorB, renderMode, shape3DA, shape3DB, size3DA, size3DB };
  }
  if (isVerbal(rel)) {
    let wordA, wordB;
    if (Math.random() < 0.40) {
      [wordA, wordB] = getVerbalPair(rel);
    } else {
      wordA = pickTokenWord(pickTokenType());
      wordB = pickTokenWord(pickTokenType());
    }
    return { rel, wordA, wordB, shapeA, shapeB, colorA, colorB, renderMode, shape3DA, shape3DB, size3DA, size3DB };
  }
  return { rel, shapeA, shapeB, colorA, colorB, renderMode, shape3DA, shape3DB, size3DA, size3DB };
}

function maybeInvertVisual(entry) {
  if (!entry || Math.random() >= 0.25) return entry;
  return { ...entry, shapeA: entry.shapeB, shapeB: entry.shapeA, colorA: entry.colorB, colorB: entry.colorA };
}

function getTypeHistory(typeHistoryMap, rel) {
  const inv = INVERSE_RELATIONSHIP[rel];
  const own = typeHistoryMap.get(rel) || [];
  const invEntries = (inv && inv !== rel) ? (typeHistoryMap.get(inv) || []) : [];
  return [...own, ...invEntries].sort((a, b) => a.trialIndex - b.trialIndex);
}

function pushTypeHistory(typeHistoryMap, rel, entry) {
  const next = new Map(typeHistoryMap);
  const existing = next.get(rel) || [];
  next.set(rel, [...existing, entry]);
  return next;
}

function pickTypeNbackTargetRel(typeHistoryMap, pool, effectiveN) {
  const candidates = pool.filter(rel => getTypeHistory(typeHistoryMap, rel).length >= effectiveN);
  if (candidates.length === 0) return null;
  return pickRandom(candidates);
}

function isTypeNbackMatch(typeHistoryMap, rel, effectiveN) {
  return getTypeHistory(typeHistoryMap, rel).length >= effectiveN;
}

function relationshipMatches(rel, targetRel) {
  return rel === targetRel || INVERSE_RELATIONSHIP[targetRel] === rel || INVERSE_RELATIONSHIP[rel] === targetRel;
}

// Negation-aware logical match: two stims encode the same fact iff their
// relations match AND their negation flags are equal. ("A inside B" ≠
// "NOT A inside B".) When negation mode is off, _negated is always false on
// both sides, so this reduces to plain relationshipMatches.
function logicalFactsMatch(currStim, pastEntry) {
  if (!currStim || !pastEntry) return false;
  if (!relationshipMatches(currStim.rel, pastEntry.rel)) return false;
  return !!currStim._negated === !!pastEntry._negated;
}

// When negation mode is on, each trial is flipped to "¬" with NEGATION_RATE
// probability. Off → always false.
function pickNegationFlag(negationMode) {
  return negationMode ? Math.random() < NEGATION_RATE : false;
}

function evaluateStimulusForMode({ stim, mode, history, typeHistory, rintState, effectiveN, hierHistory }) {
  if (!stim) return false;
  if (mode === 'rint') return isRINTConclusion(rintState, stim, effectiveN);
  if (mode === 'cct') return isCCTTarget(history, stim, effectiveN);
  if (mode === 'nrint') {
    if (history.length < effectiveN) return false;
    const tail = history.slice(-effectiveN).filter(s => s?.rel === 'NRINT_COMPOSITE');
    if (tail.length < effectiveN) return false;
    const enabledFlags = stim?._nrintEnabledFlags || NRINT_DEFAULT_FLAGS;
    return attrsReachableFromSubset(tail, stim.attrs || emptyAttrs(), enabledFlags);
  }
  if (mode === 'type') {
    if (!isTypeNbackMatch(typeHistory, stim.rel, effectiveN)) return false;
    // With negation on, the rel-history-match must also agree on _negated.
    const entries = getTypeHistory(typeHistory, stim.rel);
    const past = entries[entries.length - effectiveN];
    return !!stim._negated === !!past?._negated;
  }
  if (mode === 'hierarchical') {
    const canHier = (hierHistory || []).length >= effectiveN;
    const nBackCat = canHier ? hierHistory[hierHistory.length - effectiveN] : null;
    return canHier && getCategory(stim.rel) === nBackCat;
  }
  const nBackEntry = history.length >= effectiveN ? history[history.length - effectiveN] : null;
  return logicalFactsMatch(stim, nBackEntry);
}

function makeNonTargetRelationship(pool, isAccidentalTarget) {
  const candidates = pool.filter(rel => !isAccidentalTarget(rel));
  return pickRandom(candidates.length > 0 ? candidates : pool);
}

function makeDistractor(targetRelationship, pool) {
  const cat = getCategory(targetRelationship);
  const sameCategory = (RELATIONSHIP_CATEGORIES[cat] || ALL_RELATIONSHIPS).filter(r => pool.includes(r));
  const candidates = sameCategory.length > 1 ? sameCategory : pool;
  return pickRandomExcluding(candidates, targetRelationship);
}

function pickSoundStreamIndexes(candidates) {
  // Accepts either a count (legacy) or a list of candidate stream indexes
  // (current; relation-only streams) and returns up to 2 of them.
  const indexes = Array.isArray(candidates)
    ? [...candidates]
    : Array.from({ length: candidates }, (_, i) => i);
  indexes.sort(() => Math.random() - 0.5);
  return indexes.slice(0, Math.min(2, indexes.length));
}

function pickCubePosition(excludePosition = null) {
  const positions = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) positions.push({ x, y, z });
    }
  }
  const candidates = excludePosition ? positions.filter(p => !sameCubePosition(p, excludePosition)) : positions;
  return pickRandom(candidates.length ? candidates : positions);
}

function pickSquarePosition(excludePosition = null) {
  const positions = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) positions.push({ x, y });
  }
  const candidates = excludePosition ? positions.filter(p => !sameSquarePosition(p, excludePosition)) : positions;
  return pickRandom(candidates.length ? candidates : positions);
}

function pickTesseractPosition(excludePosition = null) {
  const positions = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        for (let w = -1; w <= 1; w += 1) positions.push({ x, y, z, w });
      }
    }
  }
  const candidates = excludePosition ? positions.filter(p => !sameTesseractPosition(p, excludePosition)) : positions;
  return pickRandom(candidates.length ? candidates : positions);
}

function sameCubePosition(a, b) {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.z === b.z;
}

function sameTesseractPosition(a, b) {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w;
}

function sameSquarePosition(a, b) {
  return !!a && !!b && a.x === b.x && a.y === b.y;
}

function resolveAlienSettings(alienSettings = {}) {
  const pickDirection = (direction) => direction === 'random' ? (Math.random() < 0.5 ? 'cw' : 'ccw') : direction;
  const pickSpeed = (speed, mode) => mode === 'random' ? 0.25 + Math.random() * 2.75 : Number(speed || 1);
  return {
    ...alienSettings,
    cubeDirection: pickDirection(alienSettings.cubeDirection || 'cw'),
    cubeSpeed: pickSpeed(alienSettings.cubeSpeed, alienSettings.cubeSpeedMode),
    squareDirection: pickDirection(alienSettings.squareDirection || 'cw'),
    squareSpeed: pickSpeed(alienSettings.squareSpeed, alienSettings.squareSpeedMode),
    tesseractDirection: pickDirection(alienSettings.tesseractDirection || 'cw'),
    tesseractSpeed: pickSpeed(alienSettings.tesseractSpeed, alienSettings.tesseractSpeedMode),
  };
}

function withAlienPosition(stim, { cubePosition, squarePosition, tesseractPosition, alienMode, alienSettings }) {
  if (!stim) return stim;
  const position = alienMode === 'square'
    ? { squarePosition: squarePosition || pickSquarePosition() }
    : alienMode === 'tesseract'
      ? { tesseractPosition: tesseractPosition || pickTesseractPosition() }
      : { cubePosition: cubePosition || pickCubePosition() };
  return {
    ...stim,
    ...position,
    alienMode,
    alienSettings: resolveAlienSettings(alienSettings),
  };
}

// Evaluate binary logic between two boolean signals
// op: 'AND' | 'OR' | 'XOR' | 'AND_NOT'
export function evalBinaryOp(a, b, op) {
  switch (op) {
    case 'AND':     return a && b;
    case 'OR':      return a || b;
    case 'XOR':     return a !== b;
    case 'AND_NOT': return a && !b;
    default:        return a;
  }
}

// Roll a random trial mode for a single stream given the global modes config
// Returns 'normal' | 'type' | 'rint' | 'nrint' | 'cct'
function rollTrialMode(modes, effectiveN) {
  const isImpossible = modes.includes('impossible');
  const isMixedRINT = modes.includes('mixed_rint');
  const isMixed = modes.includes('mixed_nback');
  const isTypeNback = modes.includes('type_nback');
  const isRINT = modes.includes('rint');
  const isNRINT = modes.includes('nonverbal_rint');
  const isCCT = modes.includes('cct');

  if (isImpossible) {
    // Three-way random, RINT only if N>=2
    const r = Math.random();
    if (r < 0.33) return 'normal';
    if (r < 0.66) return 'type';
    return effectiveN >= RINT_MIN_N ? 'rint' : 'type';
  }
  if (isMixedRINT) {
    const r = Math.random();
    if (r < 0.33) return 'normal';
    if (r < 0.66) return 'type';
    return effectiveN >= RINT_MIN_N ? 'rint' : 'normal';
  }
  if (isMixed) {
    return Math.random() < 0.5 ? 'type' : 'normal';
  }
  if (isCCT) return 'cct';
  // NRINT always uses the nrint branch (it gracefully emits non-target stims
  // until enough history accumulates). Without this, N<2 falls into 'normal'
  // and tries to copy a non-existent stim, producing blank panels.
  if (isNRINT) return 'nrint';
  if (isRINT && effectiveN >= RINT_MIN_N) return 'rint';
  if (isTypeNback) return 'type';
  return 'normal';
}

// ─── Cognitive Control Training (arithmetic n-back) ──────────────────────────
// Each trial shows a digit (1–9). From trial N onwards a candidate result is
// also shown. Target fires iff result === current_digit + digit_from_N_back.
// Pure arithmetic working-memory — no relations, no shapes, no positions.
function makeCCTStim(number, result) {
  return {
    rel: 'CCT_NUMERIC',
    cctNumber: number,
    cctResult: result, // null until N-back history exists
    renderMode: 0,
    shapeA: 'circle',
    shapeB: 'square',
    colorA: '#22d3ee',
    colorB: '#fbbf24',
    isCCTStim: true,
  };
}

function generateCCTStimulus(history, effectiveN, matchChance) {
  const num = 1 + Math.floor(Math.random() * 9);
  const canShowResult = history.length >= effectiveN;
  if (!canShowResult) {
    return { stim: makeCCTStim(num, null), isTarget: false };
  }
  const past = history[history.length - effectiveN];
  const pastNum = past?.cctNumber ?? 0;
  const correctSum = num + pastNum;
  if (Math.random() < matchChance) {
    return { stim: makeCCTStim(num, correctSum), isTarget: true };
  }
  // Non-target: pick a near-but-not-equal sum so the player can't just
  // pattern-match on "ridiculously off" numbers.
  let candidate;
  do {
    const delta = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
    candidate = Math.max(0, correctSum + delta);
  } while (candidate === correctSum);
  return { stim: makeCCTStim(num, candidate), isTarget: false };
}

function isCCTTarget(history, stim, effectiveN) {
  if (!stim?.isCCTStim || stim.cctResult == null) return false;
  if (history.length < effectiveN) return false;
  const past = history[history.length - effectiveN];
  if (!past?.isCCTStim) return false;
  return stim.cctResult === stim.cctNumber + past.cctNumber;
}

// CCT *side-task* layer: attaches a digit + candidate-result to any
// relation stim. Used when modes.includes('cct_overlay') so the player can
// dual-task — relation n-back on one axis, arithmetic n-back on the other.
function generateCCTLayer(history, effectiveN, matchChance) {
  const num = 1 + Math.floor(Math.random() * 9);
  // Only count past stims that carry a CCT layer; the result must be
  // current + the digit from N CCT-bearing trials ago.
  const cctHistory = (history || []).filter(s => s?.cctNumber != null);
  if (cctHistory.length < effectiveN) {
    return { number: num, result: null, isTarget: false };
  }
  const past = cctHistory[cctHistory.length - effectiveN];
  const correctSum = num + past.cctNumber;
  if (Math.random() < matchChance) {
    return { number: num, result: correctSum, isTarget: true };
  }
  let candidate;
  do {
    const delta = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
    candidate = Math.max(0, correctSum + delta);
  } while (candidate === correctSum);
  return { number: num, result: candidate, isTarget: false };
}

// ─── Nonverbal cross-attribute RINT helpers ─────────────────────────────────
// Stimulus carries an `attrs` object with independent boolean flags spanning
// visual and auditory modalities. Updated match rule (per Grapist's revised
// feedback): a current stim is a target when its attribute set can be
// expressed as the union of some non-empty subset of the last N stims —
// equivalently, when the union of all "compatible" stims (those whose
// attrs are a subset of current.attrs) in the last N equals current.attrs.
// All-zero current is never a target (would be trivially reachable by the
// empty subset).
//
// Each flag may be enabled or disabled by the player (per-session), letting
// them use 2/3/etc. of the available modalities instead of all of them.
export const NRINT_FLAGS = ['touching', 'hollow', 'size_mismatch', 'rotated', 'audio', 'pitch_high'];
export const NRINT_FLAG_META = {
  touching:       { group: 'visual', label: 'Touching',     desc: 'shapes adjacent vs. apart' },
  hollow:         { group: 'visual', label: 'Hollow',       desc: 'left shape outline vs. filled' },
  size_mismatch:  { group: 'visual', label: 'Size != ',     desc: 'right shape smaller vs. equal' },
  rotated:        { group: 'visual', label: 'Rotated',      desc: 'one shape rotated ~30°' },
  audio:          { group: 'audio',  label: 'Tone',         desc: 'brief sine tone' },
  pitch_high:     { group: 'audio',  label: 'High pitch',   desc: 'higher-pitched chime' },
};
const NRINT_DEFAULT_FLAGS = ['touching', 'hollow', 'size_mismatch', 'audio'];

function emptyAttrs() {
  const o = {};
  NRINT_FLAGS.forEach(f => { o[f] = false; });
  return o;
}

function randomAttrs(enabledFlags = NRINT_FLAGS) {
  const out = emptyAttrs();
  enabledFlags.forEach(f => { out[f] = Math.random() < 0.5; });
  return out;
}

function attrsUnion(stimsTail, enabledFlags = NRINT_FLAGS) {
  const out = emptyAttrs();
  stimsTail.forEach(s => {
    const a = s?.attrs || emptyAttrs();
    enabledFlags.forEach(f => { out[f] = out[f] || !!a[f]; });
  });
  return out;
}

function attrsEqual(a, b, enabledFlags = NRINT_FLAGS) {
  return enabledFlags.every(f => !!a[f] === !!b[f]);
}

// Subset-union match: current is reachable iff every flag ON in current
// appears in at least one "compatible" stim (one whose enabled-flag set is
// a subset of current's), AND current isn't trivially empty.
function attrsReachableFromSubset(tail, currentAttrs, enabledFlags = NRINT_FLAGS) {
  if (enabledFlags.every(f => !currentAttrs[f])) return false; // trivial-empty
  const compatible = tail.filter(s => {
    const a = s?.attrs || emptyAttrs();
    return enabledFlags.every(f => !a[f] || currentAttrs[f]);
  });
  if (compatible.length === 0) return false;
  const union = attrsUnion(compatible, enabledFlags);
  return attrsEqual(union, currentAttrs, enabledFlags);
}

// Pick attrs that ARE reachable as a subset-union of the tail. Strategy:
// take a random non-empty subset of tail and use its union as current.attrs.
function pickReachableAttrs(tail, enabledFlags = NRINT_FLAGS) {
  const usable = (tail || []).filter(s => s?.attrs);
  if (usable.length === 0) return null;
  for (let attempt = 0; attempt < 6; attempt++) {
    let subset = usable.filter(() => Math.random() < 0.55);
    if (subset.length === 0) subset = [usable[Math.floor(Math.random() * usable.length)]];
    const candidate = attrsUnion(subset, enabledFlags);
    if (enabledFlags.some(f => candidate[f])) return candidate;
  }
  // Last resort: copy the freshest stim that has any enabled flag set.
  for (let i = usable.length - 1; i >= 0; i--) {
    const a = usable[i].attrs;
    if (enabledFlags.some(f => a[f])) {
      const out = emptyAttrs();
      enabledFlags.forEach(f => { out[f] = !!a[f]; });
      return out;
    }
  }
  return null;
}

// Pick attrs that are NOT reachable as a subset-union of the tail. The
// engine uses this for non-target trials; we keep candidates within the
// enabled-flag set so disabling a flag really means it's silenced.
function pickNonMatchingAttrs(tail, enabledFlags = NRINT_FLAGS) {
  for (let i = 0; i < 16; i++) {
    const cand = randomAttrs(enabledFlags);
    if (!attrsReachableFromSubset(tail, cand, enabledFlags)) return cand;
  }
  // Force a non-empty unreachable attrs by adding a flag that no tail stim has.
  const out = randomAttrs(enabledFlags);
  for (const f of enabledFlags) {
    const haveAny = (tail || []).some(s => s?.attrs?.[f]);
    if (!haveAny) { out[f] = true; return out; }
  }
  return out;
}

function makeNRINTStim(attrs) {
  const shapeA = pickRandom(SHAPES);
  const colorA = pickRandom(COLORS);
  return {
    rel: 'NRINT_COMPOSITE',
    attrs,
    shapeA,
    shapeB: pickRandomExcluding(SHAPES, shapeA),
    colorA,
    colorB: pickRandomExcluding(COLORS, colorA),
    renderMode: 0,
    isNRINTStim: true,
  };
}

// Generate stimulus for a single stream, given its own history/typeHistory/rintState
// streamConfig: { trialMode, binaryMode, binaryOp, hierHistory } for Hierarchical and Binary Logic
function generateOneStreamStimulus({ history, typeHistory, rintState, pool, effectiveN, trialMode, matchChance, hasDistractors, hasLures = false, negationMode = false, trialIndex, hierHistory, binaryMode, binaryOp, signalOnly = false, baseStim = null, alienCube = false, alienSquare = false, alienTesseract = false, alienSettings = {}, nrintEnabledFlags = NRINT_DEFAULT_FLAGS, nrintHideLegend = false }) {
   let stim, isPrimaryTarget = false, isPositionTarget = false, nextRINTState = rintState;
   const canTarget = history.length >= effectiveN;

   // RINT requires transitive relationships; Type N-Back can use all relationship types
   const isRINTMode = trialMode === 'rint';
   const effectivePool = isRINTMode
     ? filterTransitiveRelationships(pool, true, false)
     : pool;
   const finalPool = effectivePool.length > 0 ? effectivePool : pool;

  if (signalOnly && baseStim) {
    const isSignalTarget = evaluateStimulusForMode({
      stim: baseStim, mode: trialMode, history, typeHistory, rintState, effectiveN, hierHistory,
    });
    return { stim: baseStim, isTarget: isSignalTarget, isPrimaryTarget: isSignalTarget, isHierTarget: isSignalTarget, nextRINTState };
  }

  const nBackEntry = canTarget ? history[history.length - effectiveN] : null;

  if (trialMode === 'rint') {
    const rintResult = generateRINTStimulus(rintState, finalPool, effectiveN, matchChance);
    stim = rintResult.stim;
    isPrimaryTarget = rintResult.isTarget;
    nextRINTState = rintResult.rintState;
  } else if (trialMode === 'cct') {
    // Cognitive Control Training: arithmetic n-back on single digits.
    const cctResult = generateCCTStimulus(history, effectiveN, matchChance);
    stim = cctResult.stim;
    isPrimaryTarget = cctResult.isTarget;
  } else if (trialMode === 'nrint') {
    // Nonverbal cross-attribute RINT: current attrs must be expressible as
    // the union of some non-empty subset of the last N stims (Grapist's
    // revised rule). Per-session enabledFlags controls which attribute
    // dimensions are active.
    const flags = (nrintEnabledFlags && nrintEnabledFlags.length) ? nrintEnabledFlags : NRINT_DEFAULT_FLAGS;
    const tail = history.slice(-effectiveN).filter(s => s?.rel === 'NRINT_COMPOSITE');
    const haveChain = tail.length >= effectiveN;
    let attrs;
    if (haveChain && Math.random() < matchChance) {
      attrs = pickReachableAttrs(tail, flags) || randomAttrs(flags);
      isPrimaryTarget = attrsReachableFromSubset(tail, attrs, flags);
    } else if (haveChain) {
      attrs = pickNonMatchingAttrs(tail, flags);
      isPrimaryTarget = false;
    } else {
      attrs = randomAttrs(flags);
      isPrimaryTarget = false;
    }
    stim = makeNRINTStim(attrs);
    // Carry the per-session config on the stim so evaluators / renderer
    // can honour enabled-flag and hide-legend settings without needing
    // a separate channel.
    stim._nrintEnabledFlags = flags;
    if (nrintHideLegend) stim._nrintHideLegend = true;
  } else if (trialMode === 'type') {
    const forcedRel = Math.random() < matchChance ? pickTypeNbackTargetRel(typeHistory, finalPool, effectiveN) : null;
    if (forcedRel) {
      const entries = getTypeHistory(typeHistory, forcedRel);
      const targetEntry = entries[entries.length - effectiveN];
      stim = isVerbal(forcedRel)
        ? (Math.random() < 0.35 ? makeInverseStimulus(targetEntry) : null) || makeStimulusEntry(forcedRel)
        : maybeInvertVisual(makeStimulusEntry(forcedRel));
      // When negation mode is on, match the past entry's _negated to keep
      // the target intact (since type-match now requires both rel & negation).
      stim._negated = !!targetEntry?._negated;
    } else {
      stim = makeStimulusEntry(makeNonTargetRelationship(finalPool, rel => isTypeNbackMatch(typeHistory, rel, effectiveN)));
      stim._negated = pickNegationFlag(negationMode);
    }
    // Negation lure: if we made a rel-match but flipped negation, it becomes a
    // non-target. Roll this on a fraction of the "target" path under negation
    // mode to keep negation differentiating from rel-matches.
    if (negationMode && forcedRel && Math.random() < NEGATION_RATE) {
      stim._negated = !stim._negated;
    }
    isPrimaryTarget = evaluateStimulusForMode({
      stim, mode: 'type', history, typeHistory, rintState, effectiveN, hierHistory,
    });
  } else if (trialMode === 'hierarchical') {
    const canHier = (hierHistory || []).length >= effectiveN;
    const nBackCat = canHier ? hierHistory[hierHistory.length - effectiveN] : null;
    const rel = canHier && Math.random() < matchChance
      ? pickRandom(finalPool.filter(r => getCategory(r) === nBackCat))
      : makeNonTargetRelationship(finalPool, r => canHier && getCategory(r) === nBackCat);
    stim = makeStimulusEntry(rel);
    isPrimaryTarget = canHier && getCategory(stim.rel) === nBackCat;
  } else {
    let isLure = false;
    let lureOffset = 0;
    if (canTarget && nBackEntry && finalPool.includes(nBackEntry.rel) && Math.random() < matchChance) {
      stim = isVerbal(nBackEntry.rel)
        ? (Math.random() < 0.35 ? makeInverseStimulus(nBackEntry) : null) || { ...nBackEntry }
        : maybeInvertVisual(makeStimulusEntry(nBackEntry.rel));
      // Keep _negated consistent with the past so the rel-match becomes a real
      // target under negation mode. Negation lures are rolled below.
      stim._negated = !!nBackEntry?._negated;
    } else if (hasLures && canTarget && history.length >= effectiveN + 1 && Math.random() < LURE_RATE) {
      // Near-miss lure: pick a stim that would be a target at N-1 or N+1
      // instead of N. The careful counter rejects; the loose counter FAs.
      const candidates = [];
      if (effectiveN >= 2 && history.length >= effectiveN - 1) candidates.push(effectiveN - 1);
      if (history.length >= effectiveN + 1) candidates.push(effectiveN + 1);
      const lureN = candidates.length ? pickRandom(candidates) : effectiveN;
      const lureEntry = history[history.length - lureN];
      if (lureEntry && finalPool.includes(lureEntry.rel) && !relationshipMatches(lureEntry.rel, nBackEntry?.rel)) {
        stim = isVerbal(lureEntry.rel)
          ? (Math.random() < 0.35 ? makeInverseStimulus(lureEntry) : null) || { ...lureEntry }
          : maybeInvertVisual(makeStimulusEntry(lureEntry.rel));
        stim._negated = !!lureEntry._negated;
        isLure = true;
        lureOffset = lureN - effectiveN;
      } else {
        stim = makeStimulusEntry(makeNonTargetRelationship(finalPool, rel => canTarget && relationshipMatches(rel, nBackEntry?.rel)));
        stim._negated = pickNegationFlag(negationMode);
      }
    } else if (hasDistractors && canTarget && nBackEntry && Math.random() < DISTRACTOR_CHANCE) {
      stim = makeStimulusEntry(makeDistractor(nBackEntry.rel, pool));
      stim._negated = pickNegationFlag(negationMode);
    } else {
      stim = makeStimulusEntry(makeNonTargetRelationship(finalPool, rel => canTarget && relationshipMatches(rel, nBackEntry?.rel)));
      stim._negated = pickNegationFlag(negationMode);
    }
    // Negation lure on a would-be target: flip negation so the rel matches but
    // the logical fact doesn't. Player who ignores the ¬ badge FAs.
    if (negationMode && nBackEntry && relationshipMatches(stim.rel, nBackEntry.rel) && Math.random() < NEGATION_RATE) {
      stim._negated = !stim._negated;
    }
    if (isLure) {
      stim._isLure = true;
      stim._lureOffset = lureOffset;
    }
    isPrimaryTarget = logicalFactsMatch(stim, nBackEntry);
  }

  if (alienCube || alienSquare || alienTesseract) {
    const alienMode = alienSquare ? 'square' : alienTesseract ? 'tesseract' : 'cube';
    const targetPosition = alienSquare ? nBackEntry?.squarePosition : alienTesseract ? nBackEntry?.tesseractPosition : nBackEntry?.cubePosition;
    const shouldMatchPosition = canTarget && targetPosition && Math.random() < matchChance;
    stim = withAlienPosition(stim, {
      alienMode,
      alienSettings,
      cubePosition: alienCube ? (shouldMatchPosition ? targetPosition : pickCubePosition(targetPosition)) : null,
      squarePosition: alienSquare ? (shouldMatchPosition ? targetPosition : pickSquarePosition(targetPosition)) : null,
      tesseractPosition: alienTesseract ? (shouldMatchPosition ? targetPosition : pickTesseractPosition(targetPosition)) : null,
    });
    isPositionTarget = canTarget && (alienSquare
      ? sameSquarePosition(stim.squarePosition, targetPosition)
      : alienTesseract
        ? sameTesseractPosition(stim.tesseractPosition, targetPosition)
        : sameCubePosition(stim.cubePosition, targetPosition));
  }

  // Hierarchical signal: is the category of this stim the same as N back?
  let isHierTarget = false;
  const hierH = hierHistory || [];
  if (binaryMode === 'hierarchical' || trialMode === 'hierarchical') {
    const canHier = hierH.length >= effectiveN;
    if (canHier) {
      const nBackCat = hierH[hierH.length - effectiveN];
      isHierTarget = getCategory(stim.rel) === nBackCat;
    }
  }

  // Binary Logic: secondary mode generates its own independent signal
  let isSecondaryTarget = false;
  if (binaryMode && binaryMode !== 'hierarchical' && binaryMode !== 'none') {
    // Generate secondary signal using the same history but different mode
    const secResult = generateOneStreamStimulus({
      history, typeHistory, rintState, pool, effectiveN,
      trialMode: binaryMode, matchChance, hasDistractors, trialIndex,
      hierHistory, signalOnly: true, baseStim: stim,
    });
    isSecondaryTarget = secResult.isPrimaryTarget;
  }

  // Compute final isTarget
  let isTarget;
  if (binaryMode === 'hierarchical') {
    isTarget = evalBinaryOp(isPrimaryTarget, isHierTarget, binaryOp || 'AND');
  } else if (binaryMode && binaryMode !== 'none') {
    isTarget = evalBinaryOp(isPrimaryTarget, isSecondaryTarget, binaryOp || 'AND');
  } else {
    isTarget = isPrimaryTarget;
  }

  return { stim, isTarget, isPrimaryTarget, isPositionTarget, isHierTarget, nextRINTState };
}

// Random binary config for a single stream
const BINARY_MODES = ['normal', 'type', 'rint', 'hierarchical'];
const BINARY_OPS = ['AND', 'OR', 'XOR', 'AND_NOT'];

function randomBinaryConfig(effectiveN) {
  const modes = effectiveN >= RINT_MIN_N ? BINARY_MODES : BINARY_MODES.filter(m => m !== 'rint');
  const primary = pickRandom(modes);
  // secondary must differ from primary
  const secondaryPool = modes.filter(m => m !== primary);
  const secondary = pickRandom(secondaryPool);
  const op = pickRandom(BINARY_OPS);
  return { primaryMode: primary, binaryMode: secondary, binaryOp: op };
}

// ─── State Creation ──────────────────────────────────────────────────────────

export function createGameState({ nLevel, modes, relationshipPool, totalRounds, extraStreams = [], alienSettings = {}, streamA = null, nrintEnabledFlags = null, nrintHideLegend = false }) {
  const numExtra = extraStreams.length;
  const totalStreams = 1 + numExtra;
  // Per-stream type: 'relation' (default) or 'cct'. Falls back to global 'cct'
  // mode for backward compat — if user toggled the legacy global Enhancement
  // Mode "CCT" on but never set per-stream streamTypes, every stream gets cct.
  const defaultType = (modes || []).includes('cct') ? 'cct' : 'relation';
  const streamTypes = [
    streamA?.streamType || defaultType,
    ...extraStreams.map(s => s?.streamType || defaultType),
  ];

  return {
    nLevel,
    modes,
    alienSettings,
    relationshipPool: relationshipPool || ALL_RELATIONSHIPS,
    round: 0,
    totalRounds: totalRounds || TOTAL_ROUNDS,
    numExtraStreams: numExtra,
    streamTypes,
    nrintEnabledFlags: (nrintEnabledFlags && nrintEnabledFlags.length) ? nrintEnabledFlags : NRINT_DEFAULT_FLAGS,
    nrintHideLegend: !!nrintHideLegend,
    // Per-trial randomized binary configs (only used when binary_logic mode is active)
    trialBinaryConfigs: Array(totalStreams).fill(null).map(() => ({ primaryMode: 'normal', binaryMode: null, binaryOp: 'AND' })),
    audioStreamIndexes: [],

    // Per-stream RINT states (index 0 = stream A, 1..N = extra streams)
    rintStates: createRINTStates(Math.max(1, totalStreams)),

    // Per-stream hierarchical category histories
    hierHistories: Array.from({ length: totalStreams }, () => []),

    // Stream A
    historyA: [],
    typeHistoryA: new Map(),
    currentRelationship: null,
    currentStimulusA: null,
    isTargetA: false,
    isPositionTargetA: false,

    // Extra streams
    extraHistories: Array.from({ length: numExtra }, () => []),
    extraTypeHistories: Array.from({ length: numExtra }, () => new Map()),
    extraCurrentRels: Array(numExtra).fill(null),
    extraCurrentStimuli: Array(numExtra).fill(null),
    extraIsTargets: Array(numExtra).fill(false),
    extraPositionTargets: Array(numExtra).fill(false),
    extraResponded: Array(numExtra).fill(false),
    extraPositionResponded: Array(numExtra).fill(false),
    extraHits: Array(numExtra).fill(0),
    extraMisses: Array(numExtra).fill(0),
    extraFalseAlarms: Array(numExtra).fill(0),
    extraCorrectRejections: Array(numExtra).fill(0),
    extraLureFalseAlarms: Array(numExtra).fill(0),
    extraLureCorrectRejections: Array(numExtra).fill(0),

    isDistractor: false,
    respondedA: false,

    hitsA: 0,
    missesA: 0,
    falseAlarmsA: 0,
    correctRejectionsA: 0,
    // Lure-trial sub-counts (subset of FA/CR — lures are always non-targets).
    lureFalseAlarmsA: 0,
    lureCorrectRejectionsA: 0,
    positionHitsA: 0,
    positionMissesA: 0,
    positionFalseAlarmsA: 0,
    positionCorrectRejectionsA: 0,
    extraPositionHits: Array(numExtra).fill(0),
    extraPositionMisses: Array(numExtra).fill(0),
    extraPositionFalseAlarms: Array(numExtra).fill(0),
    extraPositionCorrectRejections: Array(numExtra).fill(0),
    // CCT side-task axis (separate scoring axis when cct_overlay is on)
    isCCTTargetA: false,
    extraCCTTargets: Array(numExtra).fill(false),
    cctRespondedA: false,
    extraCCTResponded: Array(numExtra).fill(false),
    cctHitsA: 0,
    cctMissesA: 0,
    cctFalseAlarmsA: 0,
    cctCorrectRejectionsA: 0,
    // RST (Reasoning Side-Task) axis — single stream A, fires ~25% of trials
    // when modes.includes('rst_overlay'). Each item is a 2-premise transitive
    // chain from the ported Syllogimous Easy generators; target = conclusion
    // is logically valid.
    isRSTTargetA: false,
    rstRespondedA: false,
    rstHitsA: 0,
    rstMissesA: 0,
    rstFalseAlarmsA: 0,
    rstCorrectRejectionsA: 0,
    extraCCTHits: Array(numExtra).fill(0),
    extraCCTMisses: Array(numExtra).fill(0),
    extraCCTFalseAlarms: Array(numExtra).fill(0),
    extraCCTCorrectRejections: Array(numExtra).fill(0),

    trialMode: 'normal',
    extraTrialModes: Array(numExtra).fill('normal'),
    allTrials: [],
    scoredTrialKeys: [],
    finished: false,
  };
}

// ─── Stimulus Generation ──────────────────────────────────────────────────────

export function generateNextStimulus(state) {
  const {
    nLevel, round, historyA, typeHistoryA, modes, relationshipPool,
    extraHistories, extraTypeHistories, rintStates, hierHistories, alienSettings,
    streamTypes,
  } = state;

  const isNRINT = modes.includes('nonverbal_rint');
  // CCT lives per-stream now (see streamTypes). The global pool for relation
  // streams ignores CCT entirely. NRINT still owns the global pool when on.
  const pool = isNRINT
    ? ['NRINT_COMPOSITE']
    : ((relationshipPool && relationshipPool.length > 0) ? relationshipPool : ALL_RELATIONSHIPS);
  const hasDistractors = modes.includes('distractors');
  const hasLures = modes.includes('lures');
  const negationMode = modes.includes('negation');
  const isImpossible = modes.includes('impossible');
  // Modes without 'cct' — used for rollTrialMode on relation streams so a
  // global cct toggle doesn't drag relation streams into cct mode.
  const relationModes = (modes || []).filter(m => m !== 'cct');
  const stypeOf = (idx) => (streamTypes && streamTypes[idx]) || 'relation';

  // Variable N
  const isVariableN = modes.includes('variable_n');
  let effectiveN = nLevel;
  if (isVariableN && round >= nLevel) {
    const delta = Math.random() < 0.5 ? 1 : -1;
    const candidate = nLevel + delta;
    if (candidate >= 1 && historyA.length >= candidate) effectiveN = candidate;
  }

  const trialIndex = round;
  const isBinaryLogic = modes.includes('binary_logic');
  const alienCube = modes.includes('alien_cube');
  const alienSquare = modes.includes('alien_square');
  const alienTesseract = modes.includes('alien_tesseract');
  const totalStreams = 1 + (extraHistories || []).length;
  const soundPool = pool.filter(isSound);
  const nonSoundPool = pool.filter(rel => !isSound(rel));
  const allNonSoundPool = ALL_RELATIONSHIPS.filter(rel => !isSound(rel));
  // Only relation streams compete for the (limited) audio assignment — CCT
  // streams ignore the pool entirely.
  const relationStreamIndexes = Array.from({ length: totalStreams }, (_, i) => i).filter(i => stypeOf(i) === 'relation');
  const audioStreamIndexes = relationStreamIndexes.length >= 2 && soundPool.length > 0 ? pickSoundStreamIndexes(relationStreamIndexes) : [];
  const streamPoolFor = (index) => {
    if (stypeOf(index) === 'cct') return ['CCT_NUMERIC'];
    if (audioStreamIndexes.includes(index)) return soundPool;
    if (audioStreamIndexes.length > 0) return nonSoundPool.length > 0 ? nonSoundPool : allNonSoundPool;
    return pool;
  };

  // Generate per-trial binary configs if binary_logic mode is active
  const trialBinaryConfigs = isBinaryLogic
    ? Array.from({ length: totalStreams }, () => randomBinaryConfig(effectiveN))
    : Array(totalStreams).fill({ primaryMode: 'normal', binaryMode: null, binaryOp: 'AND' });

  // ── Stream A ──
  // Per-stream streamType wins over global modes. A CCT stream always uses
  // cct trialMode; a relation stream uses binary_logic / rollTrialMode based
  // on the relation-only modes (so a stream typed "relation" isn't dragged
  // into cct just because the legacy global cct flag is set).
  const baseTrialModeA = isBinaryLogic
    ? (trialBinaryConfigs[0].primaryMode === 'rint' && effectiveN >= RINT_MIN_N ? 'rint'
        : trialBinaryConfigs[0].primaryMode === 'type' ? 'type'
        : trialBinaryConfigs[0].primaryMode === 'hierarchical' ? 'hierarchical'
        : 'normal')
    : rollTrialMode(relationModes, effectiveN);
  const trialModeA = stypeOf(0) === 'cct' ? 'cct' : baseTrialModeA;

  const rintStateA = (rintStates && rintStates[0]) ? rintStates[0] : createRINTState();
  const cfgA = trialBinaryConfigs[0];

  const nrintEnabledFlags = state.nrintEnabledFlags || NRINT_DEFAULT_FLAGS;
  const nrintHideLegend = !!state.nrintHideLegend;
  const resultA = generateOneStreamStimulus({
    history: historyA,
    typeHistory: typeHistoryA,
    rintState: rintStateA,
    pool: streamPoolFor(0), effectiveN,
    trialMode: trialModeA,
    matchChance: MATCH_CHANCE,
    hasDistractors, hasLures, negationMode, trialIndex,
    hierHistory: (hierHistories || [])[0] || [],
    binaryMode: isBinaryLogic ? cfgA.binaryMode : null,
    binaryOp: cfgA.binaryOp,
    alienCube,
    alienSquare,
    alienTesseract,
    alienSettings,
    nrintEnabledFlags,
    nrintHideLegend,
  });

  const stimA = resultA.stim;
  const categoryA = getCategory(stimA.rel);

  // ── Extra streams ──
  const extraStreamModes = (extraHistories || []).map((_, i) => {
    const idx = 1 + i;
    if (stypeOf(idx) === 'cct') return 'cct';
    if (isBinaryLogic) {
      const pm = trialBinaryConfigs[idx]?.primaryMode;
      return pm === 'rint' && effectiveN >= RINT_MIN_N ? 'rint' : pm === 'type' ? 'type' : pm === 'hierarchical' ? 'hierarchical' : 'normal';
    }
    return isImpossible ? rollTrialMode(relationModes, effectiveN) : baseTrialModeA;
  });

  const extraResults = (extraHistories || []).map((hist, i) => {
    const streamRINTState = (rintStates && rintStates[1 + i]) ? rintStates[1 + i] : createRINTState();
    const cfg = trialBinaryConfigs[1 + i] || { primaryMode: 'normal', binaryMode: null, binaryOp: 'AND' };
    return generateOneStreamStimulus({
      history: hist,
      typeHistory: extraTypeHistories[i] || new Map(),
      rintState: streamRINTState,
      pool: streamPoolFor(1 + i), effectiveN,
      trialMode: extraStreamModes[i],
      matchChance: DUAL_MATCH_CHANCE,
      hasDistractors, hasLures, negationMode, trialIndex,
      hierHistory: (hierHistories || [])[1 + i] || [],
      binaryMode: isBinaryLogic ? cfg.binaryMode : null,
      binaryOp: cfg.binaryOp,
      alienCube,
      alienSquare,
      alienTesseract,
      alienSettings,
      nrintEnabledFlags,
      nrintHideLegend,
    });
  });

  // ── CCT side-task layer ──
  // When the global 'cct_overlay' mode is on, every relation-typed stream
  // gets a (digit + candidate-result) layer painted onto its stim. Pure
  // CCT-typed streams already produce that data natively. The player gets a
  // second response axis per stream (cctKey) — parallel to the position
  // axis used by alien modes.
  const cctOverlay = modes.includes('cct_overlay');
  let isCCTTargetA = false;
  const extraCCTTargets = [];
  if (cctOverlay) {
    if (resultA.stim.rel === 'CCT_NUMERIC') {
      // Pure CCT stream: the relation match IS the CCT match. Mirror.
      isCCTTargetA = resultA.isTarget;
    } else {
      const layer = generateCCTLayer(historyA, effectiveN, MATCH_CHANCE);
      resultA.stim = { ...resultA.stim, cctNumber: layer.number, cctResult: layer.result };
      isCCTTargetA = layer.isTarget;
    }
    extraResults.forEach((r, i) => {
      if (r.stim.rel === 'CCT_NUMERIC') {
        extraCCTTargets.push(r.isTarget);
      } else {
        const layer = generateCCTLayer(extraHistories[i], effectiveN, DUAL_MATCH_CHANCE);
        r.stim = { ...r.stim, cctNumber: layer.number, cctResult: layer.result };
        extraCCTTargets.push(layer.isTarget);
      }
    });
  } else {
    // Pure CCT streams still have isCCTTarget = isTarget for trial records.
    isCCTTargetA = resultA.stim?.rel === 'CCT_NUMERIC' ? resultA.isTarget : false;
    extraResults.forEach((r) => {
      extraCCTTargets.push(r.stim?.rel === 'CCT_NUMERIC' ? r.isTarget : false);
    });
  }

  // ── RST side-task layer (Reasoning Side-Task) ──
  // When 'rst_overlay' is on, ~RST_OVERLAY_RATE of stream-A trials get an
  // attached Syllogimous-style premise/conclusion item. Player presses the
  // RST key (default "R") if the conclusion is logically valid.
  // RST scoring lives on stream A only — adding it per-stream would crowd
  // small screens and dilute the deduction load.
  let isRSTTargetA = false;
  if (modes.includes('rst_overlay') && Math.random() < RST_OVERLAY_RATE) {
    const negationActive = modes.includes('negation');
    const item = generateRSTItem('easy', { negation: negationActive });
    resultA.stim = { ...resultA.stim, _rst: item };
    isRSTTargetA = !!item.isValid;
  }

  // Compute next RINT states array
  const nextRINTStates = (rintStates || []).map((rs, i) => {
    if (i === 0) return resultA.nextRINTState;
    const res = extraResults[i - 1];
    return res ? res.nextRINTState : rs;
  });

  return {
    stimA: resultA.stim,
    relA: resultA.stim.rel,
    isTargetA: resultA.isTarget,
    isPositionTargetA: resultA.isPositionTarget,
    isCCTTargetA,
    isRSTTargetA,
    extraCCTTargets,
    categoryA,
    isDistractor: false,
    effectiveN,
    trialMode: trialModeA,
    extraTrialModes: extraStreamModes,
    extraStimuli: extraResults.map(r => r.stim),
    extraIsTargets: extraResults.map(r => r.isTarget),
    extraPositionTargets: extraResults.map(r => r.isPositionTarget),
    nextRINTStates,
    trialBinaryConfigs,
    audioStreamIndexes,
    // Per-stream categories for hierarchical history update
    allCategories: [categoryA, ...extraResults.map(r => getCategory(r.stim.rel))],
  };
}

// ─── Advance Round ────────────────────────────────────────────────────────────

export function advanceRound(state, stimulus) {
  const {
    stimA, relA, extraStimuli, extraIsTargets, extraPositionTargets,
    isTargetA, isPositionTargetA, isCCTTargetA, isRSTTargetA, extraCCTTargets, categoryA, isDistractor,
    effectiveN, trialMode, extraTrialModes, nextRINTStates, allCategories, trialBinaryConfigs, audioStreamIndexes,
  } = stimulus;
  const trialIndex = state.round;

  const nextTypeHistoryA = pushTypeHistory(state.typeHistoryA, relA, { ...stimA, trialIndex });

  const nextExtraHistories = (state.extraHistories || []).map((hist, i) =>
    extraStimuli[i] ? [...hist, extraStimuli[i]] : hist
  );
  const nextExtraTypeHistories = (state.extraTypeHistories || []).map((th, i) =>
    extraStimuli[i] ? pushTypeHistory(th, extraStimuli[i].rel, { ...extraStimuli[i], trialIndex }) : th
  );

  // Update per-stream hier histories
  const nextHierHistories = (state.hierHistories || []).map((hh, i) => {
    const cat = (allCategories || [])[i];
    return cat ? [...hh, cat] : hh;
  });

  return {
    ...state,
    round: state.round + 1,
    currentEffectiveN: effectiveN ?? state.nLevel,
    historyA: [...state.historyA, stimA],
    typeHistoryA: nextTypeHistoryA,
    extraHistories: nextExtraHistories,
    extraTypeHistories: nextExtraTypeHistories,
    hierHistories: nextHierHistories,
    extraCurrentRels: (extraStimuli || []).map(s => s?.rel ?? null),
    extraCurrentStimuli: extraStimuli || [],
    extraIsTargets: extraIsTargets || [],
    extraPositionTargets: extraPositionTargets || [],
    extraCCTTargets: extraCCTTargets || [],
    extraResponded: Array(state.numExtraStreams).fill(false),
    extraPositionResponded: Array(state.numExtraStreams).fill(false),
    extraCCTResponded: Array(state.numExtraStreams).fill(false),
    extraTrialModes: extraTrialModes || Array(state.numExtraStreams).fill('normal'),
    currentRelationship: relA,
    currentStimulusA: stimA,
    currentCategory: categoryA,
    isTargetA,
    isPositionTargetA,
    isCCTTargetA: !!isCCTTargetA,
    isRSTTargetA: !!isRSTTargetA,
    isDistractor,
    trialMode: trialMode ?? 'normal',
    rintStates: nextRINTStates ?? state.rintStates,
    trialBinaryConfigs: trialBinaryConfigs ?? state.trialBinaryConfigs,
    audioStreamIndexes: audioStreamIndexes ?? [],
    respondedA: false,
    positionRespondedA: false,
    cctRespondedA: false,
    rstRespondedA: false,
    finished: state.round + 1 >= state.totalRounds,
  };
}

// ─── Process Responses ────────────────────────────────────────────────────────

export function processResponses(state, { pressedA, pressedExtra = [], pressedPositionA = false, pressedPositionExtra = [], pressedCCTA = false, pressedCCTExtra = [], pressedRSTA = false }) {
  const trialKey = state.round;
  if ((state.scoredTrialKeys || []).includes(trialKey)) return state;

  const hasAlienPosition = state.modes?.includes('alien_cube') || state.modes?.includes('alien_tesseract') || state.modes?.includes('alien_square');
  const hasCCTOverlay = state.modes?.includes('cct_overlay');
  const hasRSTOverlay = state.modes?.includes('rst_overlay');
  let next = { ...state, scoredTrialKeys: [...(state.scoredTrialKeys || []), trialKey] };
  const trialRecords = [];

  // Stream A relation
  if (state.isTargetA && pressedA) next.hitsA++;
  else if (state.isTargetA && !pressedA) next.missesA++;
  else if (!state.isTargetA && pressedA) next.falseAlarmsA++;
  else next.correctRejectionsA++;
  // Lure-trial sub-tally (lures are never targets, so they only show up in
  // the FA / CR branches). Track them separately so the results screen can
  // surface "lure resistance" — a key Capacity-Gym-style construct.
  if (state.currentStimulusA?._isLure) {
    if (pressedA) next.lureFalseAlarmsA = (next.lureFalseAlarmsA || 0) + 1;
    else next.lureCorrectRejectionsA = (next.lureCorrectRejectionsA || 0) + 1;
  }

  if (hasAlienPosition) {
    if (state.isPositionTargetA && pressedPositionA) next.positionHitsA++;
    else if (state.isPositionTargetA && !pressedPositionA) next.positionMissesA++;
    else if (!state.isPositionTargetA && pressedPositionA) next.positionFalseAlarmsA++;
    else next.positionCorrectRejectionsA++;
  }

  if (hasCCTOverlay) {
    // Only score when the CCT layer was actually shown for this trial
    // (cctResult != null means we had enough history to display one).
    const hasLayer = state.currentStimulusA?.cctResult != null;
    if (hasLayer) {
      if (state.isCCTTargetA && pressedCCTA) next.cctHitsA = (next.cctHitsA || 0) + 1;
      else if (state.isCCTTargetA && !pressedCCTA) next.cctMissesA = (next.cctMissesA || 0) + 1;
      else if (!state.isCCTTargetA && pressedCCTA) next.cctFalseAlarmsA = (next.cctFalseAlarmsA || 0) + 1;
      else next.cctCorrectRejectionsA = (next.cctCorrectRejectionsA || 0) + 1;
    }
  }

  if (hasRSTOverlay && state.currentStimulusA?._rst) {
    // RST scoring fires only on trials where the engine actually attached an
    // item. Off-trials (~75%) contribute nothing — RST density is bounded by
    // RST_OVERLAY_RATE so reading load stays sustainable.
    if (state.isRSTTargetA && pressedRSTA) next.rstHitsA = (next.rstHitsA || 0) + 1;
    else if (state.isRSTTargetA && !pressedRSTA) next.rstMissesA = (next.rstMissesA || 0) + 1;
    else if (!state.isRSTTargetA && pressedRSTA) next.rstFalseAlarmsA = (next.rstFalseAlarmsA || 0) + 1;
    else next.rstCorrectRejectionsA = (next.rstCorrectRejectionsA || 0) + 1;
  }

  trialRecords.push({
    trialNumber: state.round,
    streamLabel: 'A',
    relationship: state.currentRelationship,
    stimulus: state.currentStimulusA,
    trialMode: state.trialMode,
    isTarget: state.isTargetA,
    userResponded: !!pressedA,
    correct: state.isTargetA === !!pressedA,
    responseType: 'relation',
    nBackValue: state.currentEffectiveN ?? state.nLevel,
    isLure: !!state.currentStimulusA?._isLure,
    lureOffset: state.currentStimulusA?._lureOffset || 0,
    negated: !!state.currentStimulusA?._negated,
    binaryLogicPrimary: state.trialBinaryConfigs?.[0]?.primaryMode,
    binaryLogicSecondary: state.trialBinaryConfigs?.[0]?.binaryMode,
    binaryLogicOp: state.trialBinaryConfigs?.[0]?.binaryOp,
  });

  if (hasAlienPosition) {
    trialRecords.push({
      trialNumber: state.round,
      streamLabel: 'A',
      relationship: state.currentRelationship,
      stimulus: state.currentStimulusA,
      trialMode: state.trialMode,
      isTarget: state.isPositionTargetA,
      userResponded: !!pressedPositionA,
      correct: state.isPositionTargetA === !!pressedPositionA,
      responseType: 'position',
      nBackValue: state.currentEffectiveN ?? state.nLevel,
      binaryLogicPrimary: state.trialBinaryConfigs?.[0]?.primaryMode,
      binaryLogicSecondary: state.trialBinaryConfigs?.[0]?.binaryMode,
      binaryLogicOp: state.trialBinaryConfigs?.[0]?.binaryOp,
    });
  }

  if (hasCCTOverlay && state.currentStimulusA?.cctResult != null) {
    trialRecords.push({
      trialNumber: state.round,
      streamLabel: 'A',
      relationship: state.currentRelationship,
      stimulus: state.currentStimulusA,
      trialMode: state.trialMode,
      isTarget: state.isCCTTargetA,
      userResponded: !!pressedCCTA,
      correct: state.isCCTTargetA === !!pressedCCTA,
      responseType: 'cct',
      nBackValue: state.currentEffectiveN ?? state.nLevel,
    });
  }

  if (hasRSTOverlay && state.currentStimulusA?._rst) {
    trialRecords.push({
      trialNumber: state.round,
      streamLabel: 'A',
      relationship: state.currentRelationship,
      stimulus: state.currentStimulusA,
      trialMode: state.trialMode,
      isTarget: state.isRSTTargetA,
      userResponded: !!pressedRSTA,
      correct: state.isRSTTargetA === !!pressedRSTA,
      responseType: 'rst',
      rst: state.currentStimulusA._rst,
      nBackValue: state.currentEffectiveN ?? state.nLevel,
    });
  }

  // Extra streams
  const nextExtraHits = [...(state.extraHits || [])];
  const nextExtraMisses = [...(state.extraMisses || [])];
  const nextExtraFA = [...(state.extraFalseAlarms || [])];
  const nextExtraCR = [...(state.extraCorrectRejections || [])];
  const nextExtraPositionHits = [...(state.extraPositionHits || [])];
  const nextExtraPositionMisses = [...(state.extraPositionMisses || [])];
  const nextExtraPositionFA = [...(state.extraPositionFalseAlarms || [])];
  const nextExtraPositionCR = [...(state.extraPositionCorrectRejections || [])];
  const nextExtraCCTHits = [...(state.extraCCTHits || [])];
  const nextExtraCCTMisses = [...(state.extraCCTMisses || [])];
  const nextExtraCCTFA = [...(state.extraCCTFalseAlarms || [])];
  const nextExtraCCTCR = [...(state.extraCCTCorrectRejections || [])];
  const nextExtraLureFA = [...(state.extraLureFalseAlarms || [])];
  const nextExtraLureCR = [...(state.extraLureCorrectRejections || [])];
  (state.extraIsTargets || []).forEach((isTarget, i) => {
    const pressed = pressedExtra[i] || false;
    if (isTarget && pressed) nextExtraHits[i] = (nextExtraHits[i] || 0) + 1;
    else if (isTarget && !pressed) nextExtraMisses[i] = (nextExtraMisses[i] || 0) + 1;
    else if (!isTarget && pressed) nextExtraFA[i] = (nextExtraFA[i] || 0) + 1;
    else nextExtraCR[i] = (nextExtraCR[i] || 0) + 1;
    if (state.extraCurrentStimuli?.[i]?._isLure) {
      if (pressed) nextExtraLureFA[i] = (nextExtraLureFA[i] || 0) + 1;
      else nextExtraLureCR[i] = (nextExtraLureCR[i] || 0) + 1;
    }

    trialRecords.push({
      trialNumber: state.round,
      streamLabel: String.fromCharCode(66 + i),
      relationship: state.extraCurrentRels?.[i],
      stimulus: state.extraCurrentStimuli?.[i],
      trialMode: state.extraTrialModes?.[i] || 'normal',
      isTarget,
      userResponded: pressed,
      correct: isTarget === pressed,
      responseType: 'relation',
      nBackValue: state.currentEffectiveN ?? state.nLevel,
      isLure: !!state.extraCurrentStimuli?.[i]?._isLure,
      lureOffset: state.extraCurrentStimuli?.[i]?._lureOffset || 0,
      negated: !!state.extraCurrentStimuli?.[i]?._negated,
      binaryLogicPrimary: state.trialBinaryConfigs?.[i + 1]?.primaryMode,
      binaryLogicSecondary: state.trialBinaryConfigs?.[i + 1]?.binaryMode,
      binaryLogicOp: state.trialBinaryConfigs?.[i + 1]?.binaryOp,
    });

    if (hasAlienPosition) {
      const positionTarget = (state.extraPositionTargets || [])[i] || false;
      const positionPressed = pressedPositionExtra[i] || false;
      if (positionTarget && positionPressed) nextExtraPositionHits[i] = (nextExtraPositionHits[i] || 0) + 1;
      else if (positionTarget && !positionPressed) nextExtraPositionMisses[i] = (nextExtraPositionMisses[i] || 0) + 1;
      else if (!positionTarget && positionPressed) nextExtraPositionFA[i] = (nextExtraPositionFA[i] || 0) + 1;
      else nextExtraPositionCR[i] = (nextExtraPositionCR[i] || 0) + 1;

      trialRecords.push({
        trialNumber: state.round,
        streamLabel: String.fromCharCode(66 + i),
        relationship: state.extraCurrentRels?.[i],
        stimulus: state.extraCurrentStimuli?.[i],
        trialMode: state.extraTrialModes?.[i] || 'normal',
        isTarget: positionTarget,
        userResponded: positionPressed,
        correct: positionTarget === positionPressed,
        responseType: 'position',
        nBackValue: state.currentEffectiveN ?? state.nLevel,
        binaryLogicPrimary: state.trialBinaryConfigs?.[i + 1]?.primaryMode,
        binaryLogicSecondary: state.trialBinaryConfigs?.[i + 1]?.binaryMode,
        binaryLogicOp: state.trialBinaryConfigs?.[i + 1]?.binaryOp,
      });
    }

    if (hasCCTOverlay && state.extraCurrentStimuli?.[i]?.cctResult != null) {
      const cctTarget = (state.extraCCTTargets || [])[i] || false;
      const cctPressed = pressedCCTExtra[i] || false;
      if (cctTarget && cctPressed) nextExtraCCTHits[i] = (nextExtraCCTHits[i] || 0) + 1;
      else if (cctTarget && !cctPressed) nextExtraCCTMisses[i] = (nextExtraCCTMisses[i] || 0) + 1;
      else if (!cctTarget && cctPressed) nextExtraCCTFA[i] = (nextExtraCCTFA[i] || 0) + 1;
      else nextExtraCCTCR[i] = (nextExtraCCTCR[i] || 0) + 1;

      trialRecords.push({
        trialNumber: state.round,
        streamLabel: String.fromCharCode(66 + i),
        relationship: state.extraCurrentRels?.[i],
        stimulus: state.extraCurrentStimuli?.[i],
        trialMode: state.extraTrialModes?.[i] || 'normal',
        isTarget: cctTarget,
        userResponded: cctPressed,
        correct: cctTarget === cctPressed,
        responseType: 'cct',
        nBackValue: state.currentEffectiveN ?? state.nLevel,
      });
    }
  });
  next.extraHits = nextExtraHits;
  next.extraMisses = nextExtraMisses;
  next.extraFalseAlarms = nextExtraFA;
  next.extraCorrectRejections = nextExtraCR;
  next.extraLureFalseAlarms = nextExtraLureFA;
  next.extraLureCorrectRejections = nextExtraLureCR;
  next.extraPositionHits = nextExtraPositionHits;
  next.extraPositionMisses = nextExtraPositionMisses;
  next.extraPositionFalseAlarms = nextExtraPositionFA;
  next.extraPositionCorrectRejections = nextExtraPositionCR;
  next.extraCCTHits = nextExtraCCTHits;
  next.extraCCTMisses = nextExtraCCTMisses;
  next.extraCCTFalseAlarms = nextExtraCCTFA;
  next.extraCCTCorrectRejections = nextExtraCCTCR;
  next.allTrials = [...(state.allTrials || []), ...trialRecords];

  return next;
}