// Insight puzzle generator — no WM load
// ----------------------------------------------------------------------------
// Single-puzzle, no-n-back tasks for the Insight Mode. Each puzzle isolates
// relational inference from working memory: the player has all the panels
// in front of them and unlimited time. Closer to Raven-style matrix reasoning
// than to n-back paradigm.
//
// Per the response to sokuichi's critique: relational training apps usually
// stress WM with relational content. Insight Mode isolates the relational
// inference operation itself, no chaining required. The "discovery" framing
// stays — the player still has to abstract the form class from examples.

import { RELATION_FORM_CLASS, RELATIONSHIPS, SHAPES, COLORS } from './gameConstants';

// Build an index from form-class → member relations so we can pick a class
// and then sample relations from it.
const CLASS_TO_RELATIONS = (() => {
  const out = {};
  Object.entries(RELATION_FORM_CLASS).forEach(([rel, cls]) => {
    if (!out[cls]) out[cls] = [];
    out[cls].push(rel);
  });
  return out;
})();

export const FORM_CLASSES = Object.keys(CLASS_TO_RELATIONS);

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomExcluding(arr, exclude) {
  const filtered = arr.filter(x => !exclude.includes(x));
  return pickRandom(filtered.length > 0 ? filtered : arr);
}

function pickShuffle(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Build a minimal stimulus object for a relation — enough for the existing
// renderRelationship pipeline to draw it. Avoids the engine's heavier
// makeStimulusEntry which carries n-back / RINT metadata.
function makeInsightStimulus(rel) {
  const shapeA = pickRandom(SHAPES);
  const shapeB = pickRandomExcluding(SHAPES, [shapeA]);
  const colorA = pickRandom(COLORS);
  const colorB = pickRandomExcluding(COLORS, [colorA]);
  return {
    rel,
    shapeA, shapeB,
    colorA, colorB,
    renderMode: Math.floor(Math.random() * 3),
    shape3DA: pickRandom(['cube', 'sphere', 'pyramid', 'cone', 'torus', 'octahedron']),
    shape3DB: pickRandom(['cube', 'sphere', 'pyramid', 'cone', 'torus', 'octahedron']),
    size3DA: 2 + Math.random() * 1.5,
    size3DB: 2 + Math.random() * 1.5,
    // Words / sounds may be used by verbal/sound renderers — generic fillers
    wordA: 'α', wordB: 'β',
    soundA: 'X', soundB: 'Y',
  };
}

// Filter form classes by minimum member count so we always have enough
// distinct relations for a puzzle.
function eligibleClasses(minMembers = 3, excludeRels = []) {
  return FORM_CLASSES.filter(cls => {
    const members = CLASS_TO_RELATIONS[cls].filter(r => !excludeRels.includes(r));
    return members.length >= minMembers;
  });
}

// ─── Odd-one-out puzzle ──────────────────────────────────────────────────────
// 4 panels. 3 share a form class (e.g. containment), 1 is from a different
// form class. Player clicks the odd one.
//
// Difficulty knobs (passed via opts):
//   - excludeRels: relations to avoid (player can rule out specific tokens)
//   - hard: if true, picks the odd-out from a "near" form class (one the
//     player might confuse with the target). v1 just picks any other class.
export function generateOddOneOut({ excludeRels = [] } = {}) {
  const classes = eligibleClasses(3, excludeRels);
  if (classes.length < 2) return null;
  const sharedClass = pickRandom(classes);
  const oddClass = pickRandomExcluding(classes, [sharedClass]);
  const sharedPool = CLASS_TO_RELATIONS[sharedClass].filter(r => !excludeRels.includes(r));
  const oddPool = CLASS_TO_RELATIONS[oddClass].filter(r => !excludeRels.includes(r));
  const sharedRels = pickShuffle(sharedPool, 3);
  const oddRel = pickRandom(oddPool);

  // 4 panels in random positions; track which one is the odd out
  const panels = sharedRels.map((rel, i) => ({
    id: i,
    relation: rel,
    stimulus: makeInsightStimulus(rel),
    isOdd: false,
    formClass: sharedClass,
  }));
  panels.push({
    id: 3,
    relation: oddRel,
    stimulus: makeInsightStimulus(oddRel),
    isOdd: true,
    formClass: oddClass,
  });
  // Shuffle so the odd is in a random slot
  for (let i = panels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [panels[i], panels[j]] = [panels[j], panels[i]];
  }
  // Reassign ids in new positions for stable UI keys
  panels.forEach((p, i) => { p.id = i; });
  const correctId = panels.findIndex(p => p.isOdd);

  return {
    type: 'odd_one_out',
    prompt: 'Three of these panels share a structural form. Pick the ODD one out.',
    panels,
    correctId,
    sharedClass,
    oddClass,
    hint: `Three are ${sharedClass.replace(/_/g, ' ')}; one is ${oddClass.replace(/_/g, ' ')}.`,
  };
}

// ─── Analogy completion puzzle ───────────────────────────────────────────────
// "Three panels share a form class. From 4 candidates, pick the one that
// belongs with them." Effectively a Raven-style matrix completion: player
// abstracts the form class from the 3 shown, then picks the candidate that
// fits — must distinguish from 3 distractors of different form classes.
export function generateAnalogyCompletion({ excludeRels = [] } = {}) {
  const classes = eligibleClasses(4, excludeRels); // need 4 from same class (3 shown + 1 candidate)
  if (classes.length < 4) return null;
  const sharedClass = pickRandom(classes);
  const sharedPool = CLASS_TO_RELATIONS[sharedClass].filter(r => !excludeRels.includes(r));
  const sharedRels = pickShuffle(sharedPool, 4);
  const shown = sharedRels.slice(0, 3);
  const correctCandidate = sharedRels[3];

  // 3 distractors from 3 different other classes
  const otherClasses = classes.filter(c => c !== sharedClass);
  const distractorClasses = pickShuffle(otherClasses, 3);
  const distractors = distractorClasses.map(cls => pickRandom(CLASS_TO_RELATIONS[cls]));

  const shownPanels = shown.map((rel, i) => ({
    id: `shown-${i}`,
    relation: rel,
    stimulus: makeInsightStimulus(rel),
    formClass: sharedClass,
  }));

  const candidates = [
    { id: 'c-0', relation: correctCandidate, stimulus: makeInsightStimulus(correctCandidate), isCorrect: true, formClass: sharedClass },
    ...distractors.map((rel, i) => ({
      id: `c-${i + 1}`,
      relation: rel,
      stimulus: makeInsightStimulus(rel),
      isCorrect: false,
      formClass: distractorClasses[i],
    })),
  ];
  // Shuffle candidates so correct isn't always first
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const correctIndex = candidates.findIndex(c => c.isCorrect);

  return {
    type: 'analogy_completion',
    prompt: 'These three share a structural form. Pick the candidate that BELONGS with them.',
    shown: shownPanels,
    candidates,
    correctIndex,
    sharedClass,
    hint: `All three share the ${sharedClass.replace(/_/g, ' ')} form. Find another one.`,
  };
}

// Public: pick a random puzzle type and generate it.
export function generateInsightPuzzle({ type = 'random', excludeRels = [] } = {}) {
  const t = type === 'random'
    ? (Math.random() < 0.5 ? 'odd_one_out' : 'analogy_completion')
    : type;
  if (t === 'odd_one_out') return generateOddOneOut({ excludeRels });
  return generateAnalogyCompletion({ excludeRels });
}
