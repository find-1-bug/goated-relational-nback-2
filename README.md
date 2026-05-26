# GOATED Relational n-Back

**A free, open-source, PWA-installable working-memory & relational-reasoning trainer.**

Live at: https://find-1-bug.github.io/goated-relational-nback-2/

Single-user, client-side only, no backend, no accounts, no tracking. Sessions and settings live in your browser's `localStorage`. Built with React 18 + Vite + Three.js, deployed to GitHub Pages on every push to `main`.

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # outputs to dist/
npm run preview      # serve the built bundle
npm run lint         # eslint
```

Relative `base: './'` means the build works on any host path — GitHub Pages user site, project site, custom domain, file:// — with no rebuild. HashRouter for deep-link compatibility.

---

# What it is, in one sentence

A working-memory trainer that, instead of asking you to remember which letter or position appeared N trials ago, asks you to remember the *abstract relationship* between two stimuli — and then layers ~30 modes, side-tasks, and stressors on top to push the cognitive content as close as it can get to what fluid intelligence (Gf) actually measures.

---

# Pages (7 routes, all HashRouter)

| Route | Purpose |
|---|---|
| `/` | **Game** — StartScreen → GameScreen → ResultsScreen |
| `/insight` | **Insight Mode** — Raven-style puzzles with no WM load |
| `/tutorial` | **Tutorial** — 6-tab Academy |
| `/stats` | **Stats** — neuro-analytics dashboard |
| `/framework` | **Framework** — worked-example reference per mode |
| `/diagnostics` | **Diagnostics** — pre-release 600-case engine validation suite |
| `/review/:sessionId` | **Review** — trial-by-trial session playback |

---

# Game Modes (33 total, organised into 4 phases)

`MODE_OPTIONS` in [src/components/game/StartScreen.jsx](src/components/game/StartScreen.jsx). Players toggle these on/off freely; mutually-exclusive modes block each other in the UI.

### Phase A — Foundational Support & Interference Control
- **feedback_per_trial** — HIT/MISS/FA/CR verdict tag + one-line italic *hint* on errors (e.g. "lure at N+1 — not N", "different form class", "rel matched but ¬ flag differs"). HITs and CRs stay verdict-only — desirable-difficulty framing (Bjork: teach without telling).
- **distractors** — same-category near-match interference.
- **lures** (N≥2) — ~22% of non-targets match at **N±1** instead of N. Loose counting = false alarms. Separate **Lure Resistance %** tracked.
- **negation** (N≥2) — ~30% of trials flipped to **¬** (red badge). Match requires *both* the relation *and* the negation flag to agree.

### Phase B — Working-Memory & Logic Layers
- **cct** (Cognitive Control Training) — pure arithmetic: target when `candidate = current digit + N-back digit`.
- **cct_overlay** — CCT layered as a separate response axis on every relation stream.
- **rst_overlay** (N≥2) — Reasoning Side-Task with **Easy / Medium / Hard / Extreme** ladder (see below).
- **variable_n** — N shifts ±1 each trial.
- **adaptive** — N auto-adjusts between sessions (≥80% → up, ≤50% → down).
- **adaptive_closed_loop** — speed + lure rate + negation rate scale mid-session based on real-time accuracy.

### Phase C — Memory Integration & Dynamic Rules
- **type_nback** — match by relation **type**, not trial distance. Each rel has its own n-back queue.
- **rint** (N≥2) — Relational Integration. Persistent entities (α, β, γ…); target = current is a valid transitive conclusion from chaining the N most-recent facts. **Now with mixed direction within a chain** — e.g. `α > β`, `γ < β` requires mentally inverting to chain. Conclusions render in either direction (`A > C` or `C < A`).
- **nonverbal_rint** (N≥2) — composite attributes across **10 flags** (visual: touching, hollow, size_mismatch, rotated, dashed_border, glow, mirrored, striped + audio: audio, pitch_high). Subset-union rule: current is a target iff its attrs equal the union of some non-empty subset of the last N stims.
- **mixed_nback** — per-trial random: Normal or Type.
- **mixed_rint** (N≥2) — per-trial random: Normal / Type / RINT.
- **wrapper_morph** — visual theme + token category rotate mid-session.
- **token_blending** — verbal/alphanumeric/emoji tokens blend into relation grids.
- **binary_logic** (N≥2) — per-trial random `<NBack> <OP> <NBack>` pair (AND/OR/XOR/AND_NOT).
- **analogy_nback** (N≥2) — 4-place visual analogy: target fires when current and N-back share a **form class** (12 classes — directional-asymmetric, containment, identity, opposition, etc.). Same-token = **not** a match. Halford 4-place rung in visual form.

### Phase D — Spatial Overloads & Stress Resilience
- **alien_square** — relations rendered inside a 3×3 rotating square.
- **alien_cube** — 3×3×3 rotating cube; position is a 2nd answerable axis.
- **alien_tesseract** — 4D tesseract with inner/outer hyperspace layer.
- **stress_glitch** — visual glitch filter fires ~25% of trials.
- **stress_shake** — screen-shake animation fires ~35% of trials.
- **timer_panic** — shrinking countdown bar above each stream.
- **impossible** (N≥2, ≥2 streams) — each stream independently picks Normal/Type/RINT per trial.

---

# RST Side-Task (Reasoning) — full ladder

| Difficulty | Family | Description |
|---|---|---|
| **Easy** | Distinction | XOR parity over `same as`/`opposite of` chain. Each entity has a hidden binary bucket; truth derives from parity. |
| **Medium** | Comparison | Transitive order chain (`more than`/`less than`). Hidden order indices. |
| **Hard** | Analogy (4-place) | Fresh entity pair each trial. Conclusion: "is current pair structurally analogous to N-back pair?" The **canonical Gf target** per Halford. |
| **Extreme** | Meta-Relation (5-place) | Conclusion is a **boolean** (∧, ∨, ∧¬, ↔) of TWO analogy claims spanning 5+ entities. Player must hold both sub-analogies + the connective in working memory simultaneously. **Pushes past the 4-place rung into meta-knowledge**. |

Hard + Extreme auto-extend stimulus duration by 60% on heavy trials so the reading load is sustainable.

Generators inspired by [Syllogimous v3 by 4skinskywalker](https://github.com/4skinskywalker/Syllogimous-v3) (CC BY-NC 3.0). See [src/lib/syllogimousAdapter.js](src/lib/syllogimousAdapter.js).

---

# Coach Autopilot — Mastery-Scaled Spaced Repetition

26 curated phases in [COACH_PHASES](src/lib/gameConstants.js). The Coach no longer marches you linearly through them. Instead:

- Each phase has its own **mastery level (0–5)** tracked across attempts.
- A success (≥75% accuracy) bumps the level by 1; a fail (<55%) drops it by 1.
- Higher mastery = longer wait until that phase resurfaces. **Leitner intervals** in sessions: `1 · 2 · 5 · 11 · 25 · 60`.
- When a mastered phase (L≥2) is due for review, the Coach has a **40% chance** to pick it instead of the frontier — keeping earlier skills warm.
- All else equal: lowest-index not-yet-mastered phase, otherwise advance the frontier.

The card shows the next pick + reason tag (**FRONTIER / REVIEW / ADVANCE / MAINTAIN / TEST**). Stats Coach tab color-codes phases by mastery level with a legend; phases due for review get a violet ring.

Implementation: [src/lib/coachMastery.js](src/lib/coachMastery.js). Legacy `consecutiveSuccesses/Failures` state migrated transparently — phases before your old frontier seed as L2-mastered so you don't get reset.

### Phase highlights
- **Phases A–D**: warm-ups (N=1)
- **1–10**: distractors → lures → negation → CCT → RST → adaptive → type → RINT → NRINT
- **11–14**: rule flexibility, set-shifting, episodic buffer
- **15–20**: 3D alien rotations, stress, dual-stream
- **21**: quantum focus (2 streams, N=3, impossible mode, all stressors)
- **22**: tesseract (4D)
- **22.5**: Analogy Crucible (pure 4-place visual analogy)
- **23**: Relational Supercomputer (RINT + RST Hard + CCT overlay)
- **24**: Grandmaster (3 streams, N=3)
- **25**: Infinite Singularity (3 streams, N=4, tesseract, max chaos)

You can also **test any phase** without disturbing real curriculum progress via the Test Phase dropdown in the Coach card.

---

# Insight Mode (`/insight`)

Pure relational inference, **no n-back chain, no WM load, no time pressure**. Four puzzle types rotate randomly so the surface format isn't a Raven's-clone signature:

- **Odd-One-Out** — 3–6 panels (count varies); pick the one that doesn't share the form class. Layout varies grid / linear / scatter.
- **Reverse Sort** — given a form-class label, multi-select all panels matching it from a 6-pool.
- **Analogy Completion** — 3 panels share a form; pick the 4th candidate that belongs.
- **Verbal Analogy** — text-only, no rendered shapes: `α inside β :: γ ? δ` + 4 candidate relation labels.

Cumulative stats in localStorage. Optional hint button. Direct response to the *WM-strain vs direct-logic* critique — isolates the relational inference operation from working-memory overhead.

---

# Other systems

- **Relation library**: 92+ relations across 7 categories — SPATIAL · SPATIAL_3D · TRAIT · QUANT · VERBAL · SOUND (10: pitch / rhythm / volume / duration / timbre — all pair-asymmetric except timbre which is opposition) · COMPLEX. 67 marked as transitive (used by RINT). Full inverse mapping (`BIGGER_THAN ↔ SMALLER_THAN` etc.) — see [src/lib/gameConstants.js](src/lib/gameConstants.js).
- **Form-class taxonomy** for Analogy N-Back & Insight: 12 abstract structural classes covering ~150 relations.
- **NRINT**: 10 attribute flags across visual + audio modalities; per-flag enable picker; hide-legend toggle for truly nonverbal play.
- **Hint-shaped feedback**: per-trial diagnostic on MISS/FA names the misjudged dimension (e.g. "same-token isn't analogy", "different form class") without giving away the answer.
- **Pre-session rule briefing**: collapsible panel listing plain-English rules for currently-active modes before launch.
- **Multi-stream**: 1–20 streams; carousel pagination when too many for one viewport; each stream has its own REL/CCT type + key bindings.
- **3D rendering**: real Three.js scenes for alien-cube/square/tesseract + decorated SPATIAL_3D relations (orbit rings, tethers, shadows, fog, ground planes).
- **5 wrapper themes**: Cyberpunk Neon · Minimal Stark · Glassmorphic Frost · Sunset Glow · Matrix Terminal.
- **Synaesthesia engine**: per-character color map (A–Z, 0–9) applied to verbal tokens, CCT digits, 3D text sprites. Custom color picker, persisted in localStorage.
- **Token blending**: 8 token types — meaningful · nonsense · garbage · emoji · voronoi_emoji · random_string · voronoi · scrap (junk-journal procedural clipart).
- **Stats dashboard**: Overview / Coach / Stressors tabs. SVG accuracy trend chart; mastery-color-coded phase ladder; JSON export/import.
- **Per-stream scoring axes**: REL · POS · CCT · RST — tracked independently with hit/miss/FA/CR + Lure subcounts + RST family breakdown.

---

# Storage (localStorage keys)

| Key | What |
|---|---|
| `nback_sessions` | Full session array with every trial recorded |
| `nback_settings` | Last-used config (modes, N, stream layout, RST difficulty, etc.) |
| `goated_coach_state` | Coach progress: `phaseIndex`, `sessionCount`, `phaseMastery{}`, `rankName` |
| `nback_theme` | Light/dark |
| `goated_synaesthesia_enabled` + `goated_synaesthesia_map` | Synaesthesia config |
| `goated_insight_stats_v1` | Insight Mode cumulative stats |
| `goated_transfer_ledger` | Optional user journal |

Use **Stats → Export** for JSON backup, **Import** to restore.

---

# What's NOT in the app (intentionally absent)

- **No formal transfer measurement** — no built-in Gf proxy / matrix pre-post. Each session is independent. *This is the biggest open gap if you care about scientifically defensible transfer claims; "demonstrate transfer experimentally" remains the most impactful missing feature.*
- **No account / cloud sync / leaderboard / social** — single-user, local-only by design.
- **No formal logic instruction layer** — discovery-based learning only. Rules are pre-flight briefings, not during-play teaching.
- **No commercial monetization** — free, GitHub Sponsors funded only; compatible with CC BY-NC dependencies.

---

# Deploy to GitHub Pages

This repo ships with a GitHub Actions workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml) that builds + publishes on every push to `main`.

1. Create the repo, push this project to it.
2. **Settings → Pages → Source: GitHub Actions**.
3. Push to `main`. Workflow auto-runs.

If Pages was disabled / re-enabled and the workflow errors with `Create Pages site failed: Resource not accessible by integration`, manually re-enable via API:

```bash
gh api -X POST repos/<user>/<repo>/pages -f build_type=workflow
gh run rerun <last-run-id> --repo <user>/<repo>
```

---

# Tech stack

- React 18.2 + Vite 6.1 + Tailwind 3.4 + framer-motion 11.16
- HashRouter (react-router-dom 6.26) for static-host compatibility
- Three.js 0.171 for 3D scenes
- Canvas 2D for all 2D relation rendering
- Radix-UI primitives, lucide-react icons
- recharts 2.15 for Stats charts
- jspdf 4.0 + html2canvas 1.4 for export utilities
- Web Audio API for sound-relation playback + NRINT cues + CCT/RST press tones
- PWA installable (service worker + manifest)
- ESLint flat config; CI green on lint + build before push

---

# Credits

**Built by [Stefanos (find-1-bug)](https://github.com/find-1-bug)** with [Claude Code (Opus)](https://www.anthropic.com/claude-code) and Gemini Flash 3.5 as coding partners.

**Community contributors (Mindbuilding Discord):**
- [@Grapist (AchvQdlty)](https://discord.com/invite/brain) — drove the original Nonverbal RINT design (subset-union rule), the RINT direction-cycling expansion, complex composite relations, per-trial feedback request, and the alien-cube panel bug report.
- [@sokuichi](https://discord.com/invite/brain) — sharp critique of WM-strain-with-relations vs direct-logic training; led directly to Insight Mode, hint-shaped feedback, pre-session rule briefing, and the diversification of Insight to 4 puzzle types ("distant similarity to matrix tests").
- [@davidbreneisen](https://discord.com/invite/brain) — community contributor on the relational-reasoning thread.
- [@Dark](https://discord.com/invite/brain) — critique on the WM vs reasoning blending tradeoff that informed how RINT/RST stacking was designed.

**Mindbuilding Discord**: https://discord.com/invite/brain
**Forum thread for this app**: https://discord.com/channels/1200540503654010910/1497601580797657269

**External influences:**
- [Syllogimous v3](https://github.com/4skinskywalker/Syllogimous-v3) by 4skinskywalker (CC BY-NC 3.0) — RST premise generator content ported with attribution.
- [Capacity Gym v2](https://github.com/Mindware-Lab/trident-g-platform) by Dr Mark Ashton Smith — inspiration for Lures, Coach family rotation, and transfer-score concepts.
- [Dr Mark Ashton Smith](https://iqmindware.substack.com) — IQ Mindware Substack, "demonstrate transfer experimentally" guidance.
- Halford / Christoff / Bunge — rostrolateral PFC relational complexity literature that drove the 4-place + 5-place RST design.
- Bjork — "desirable difficulties" framing for the hint-shaped feedback.

**Cognitive-science studies cited in the in-app Studies drawer:**
Jaeggi et al. 2008 (PNAS) · Novick et al. 2014 · Halford/Cowan/Andrews 2007 · Au et al. 2015 · Schmiedek et al. 2010 · McNab et al. 2009 · Finc et al. 2020 · Salmi et al. 2023 · Schweizer et al. 2020.

---

# License

App code: original work, free for any non-commercial use. RST generator content is derivative of Syllogimous v3 and therefore inherits **CC BY-NC 3.0**.
