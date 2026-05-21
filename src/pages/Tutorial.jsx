import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Brain, Zap, Layers, Gamepad2, GitBranch, Hash } from 'lucide-react';
import { COACH_PHASES } from '@/lib/gameConstants';

export default function Tutorial() {
  const sections = [
    {
      icon: Brain,
      title: 'What is N-Back?',
      description: 'A cognitive training task where you match a relationship from N steps back in a sequence. For N=2, you match what appeared 2 trials ago.'
    },
    {
      icon: Gamepad2,
      title: 'How to Play',
      description: 'Watch the stimulus appear. If it matches the relationship from N trials ago, press the key for that stream. React quickly but accurately.'
    },
    {
      icon: Zap,
      title: 'Controls',
      description: 'Each stream has dedicated keys: REL for relationship matches, POS when an alien mode adds a position axis, and CCT when the CCT side-task or a CCT stream is in play. Press all axes that fire on a given trial — they\'re scored independently.'
    },
    {
      icon: Layers,
      title: 'Enhancement Modes',
      description: 'Type N-Back matches by relationship type only. RINT uses logical reasoning across transitive relations. Nonverbal RINT uses cross-modal attribute composites. CCT is arithmetic n-back. Mixed/Impossible randomize rules; Binary Logic combines two conditions per trial.'
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-mono font-bold text-foreground">How to Train</h1>
        </div>

        {/* Quick Start */}
        <div className="rounded-lg bg-primary/10 border border-primary/30 p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-primary mb-3">Quick Start</h2>
          <ol className="space-y-2 text-sm font-mono text-foreground/90">
            <li><span className="text-primary font-bold">1.</span> Choose N-level (how many trials back to remember)</li>
            <li><span className="text-primary font-bold">2.</span> Pick relationship types (spatial, trait, quantitative, complex, verbal, sound) — ignored when Nonverbal RINT or pure-CCT streams are in play</li>
            <li><span className="text-primary font-bold">3.</span> Add streams; toggle each stream's REL / CCT type, or layer on alien-position and CCT-side-task axes for dual/triple-task training</li>
            <li><span className="text-primary font-bold">4.</span> Set trial count, trial speed, and optional carousel speed</li>
            <li><span className="text-primary font-bold">5.</span> Press the matching key when you see a target — every axis is scored independently</li>
            <li><span className="text-primary font-bold">6.</span> Review feedback after each trial (if Per-Trial Feedback is on), or check the session-end summary &amp; Stats page</li>
          </ol>
        </div>

        {/* Core Concepts */}
        <div className="grid gap-4 mb-8">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-lg bg-secondary/40 border border-border p-5"
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-mono font-semibold text-foreground mb-2">{section.title}</h3>
                    <p className="text-sm font-mono text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Settings Guide */}
        <div className="rounded-lg bg-secondary/40 border border-border p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-foreground mb-4">Settings Explained</h2>
          <div className="space-y-4 text-sm font-mono text-muted-foreground">
            <div>
              <span className="text-primary font-semibold">N-Level:</span> How many trials back to match (1 = easiest, higher = harder)
            </div>
            <div>
              <span className="text-primary font-semibold">Relationship Types:</span> Categories of visual/verbal relationships to include — Spatial, Spatial 3D, Trait, Quantitative, <span className="text-foreground">Complex</span> (scan-for-difference composites), Verbal, Sound. <span className="text-foreground/60">Ignored when Nonverbal RINT is the active mode.</span>
            </div>
            <div>
              <span className="text-primary font-semibold">Stimuli Mix:</span> Balance category distribution (equal or custom weights). Lets you focus a session on, e.g., 70% Spatial 3D + 30% Complex.
            </div>
            <div>
              <span className="text-primary font-semibold">Streams:</span> Multiple simultaneous sequences (Stream A, B, C, etc.). Up to 20 streams. Each row has a <span className="text-foreground">REL / CCT</span> pill — switch a stream to <span className="text-foreground">CCT</span> to make it a pure arithmetic stream while others run relations.
            </div>
            <div>
              <span className="text-primary font-semibold">Automated Carousel:</span> When many streams cannot fit comfortably, the game splits them into timed slides. Watch all slides first, then responses unlock for the response window. Carousel Speed controls slide timing separately from Trial Speed.
            </div>
            <div>
              <span className="text-primary font-semibold">Speed:</span> How long each trial stays active before disappearing. Random speed varies the display time each trial; Alien Cube and Tesseract keep a small minimum display time so 3D scenes can render reliably.
            </div>
            <div>
              <span className="text-primary font-semibold">Noob Mode:</span> Manual trial navigation with Prev/Next buttons
            </div>
          </div>
        </div>

        {/* New Audio-Visual Features */}
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-emerald-400 mb-3">New Audio-Visual Features</h2>
          <div className="space-y-3 text-sm font-mono text-foreground/90">
            <p>
              Sound relationships are now fully non-verbal: instead of spoken words, letters, or numbers, the game uses pure pitch and rhythm cues such as higher/lower tones and faster/slower beats.
            </p>
            <p>
              In multi-stream sessions, the game can play up to two sound streams at once. Active sound streams glow green and show an <span className="text-emerald-300 font-semibold">L</span> or <span className="text-emerald-300 font-semibold">R</span> badge so you know which visual stream belongs to each ear.
            </p>
            <p>
              For speaker users, the right-side sound plays slightly after the left-side sound, making the two streams easier to distinguish even without headphones. Sound-only multi-stream sessions are blocked so the task remains meaningful.
            </p>
          </div>
        </div>

        {/* Enhancement Modes Deep Dive */}
        <div className="rounded-lg bg-accent/10 border border-accent/30 p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-accent mb-4">Enhancement Modes</h2>
          <div className="space-y-4 text-sm font-mono text-foreground/90">
            <div>
              <span className="text-accent font-semibold">Type N-Back:</span> Match by <span className="text-foreground font-semibold">relationship category only</span>, not trial distance. If you've seen "Inside" relationships 3 times, all "Inside" entries count as matches, regardless of when they appeared. In this mode, only <span className="text-foreground">transitive relationships</span> are used to ensure logical consistency. Tests <span className="text-foreground">semantic memory & categorization</span>.
            </div>
            <div>
              <span className="text-accent font-semibold">RINT (Relational Integration):</span> Use <span className="text-foreground font-semibold">logical reasoning</span> to chain facts. E.g., "A &gt; B" + "B &gt; C" logically proves "A &gt; C"—that's a match. Only uses <span className="text-foreground">transitive relationships</span> (comparisons, directions, temporal) to ensure valid logical chains. Tests <span className="text-foreground">transitive reasoning & working memory</span>. Requires N≥2.
            </div>
            <div>
              <span className="text-accent font-semibold">Nonverbal RINT:</span> Each stim carries a configurable set of <span className="text-foreground font-semibold">independent attribute flags</span> across two modalities: visual (<span className="text-foreground">touching</span>, <span className="text-foreground">hollow</span>, <span className="text-foreground">size-mismatch</span>, <span className="text-foreground">rotated</span>) and audio (<span className="text-foreground">tone</span>, <span className="text-foreground">high pitch</span>). A target fires when the current stim's attribute set equals the <span className="text-foreground">union of some non-empty subset</span> of the last N stims (i.e., current can be "added together" from a few of the recent trials, not necessarily all). A dedicated <span className="text-foreground">Nonverbal RINT Settings</span> panel appears on the dashboard when this mode is on — pick which 2/3/4/all attributes to use, and toggle <span className="text-foreground">Hide legend labels</span> for a truly nonverbal display. Replaces the entire relationship pool. Requires N≥2.
            </div>
            <div>
              <span className="text-accent font-semibold">CCT (Cognitive Control Training):</span> Pure arithmetic n-back. Each trial shows a digit (1–9); from trial N onwards a candidate result also appears. Press REL when <span className="text-foreground font-semibold">result == current_digit + digit_from_N-back</span>. Replaces the entire relationship pool for that stream. No relations, no shapes — just numbers + working memory. Available as a global mode (all streams CCT) or as a per-stream type via the row's REL/CCT toggle.
            </div>
            <div>
              <span className="text-accent font-semibold">CCT Side-Task:</span> Layers CCT onto every relation stream as a <span className="text-foreground font-semibold">separate response axis</span> (mirrors how Alien modes add a position axis). Each stream then has REL (relation), POS (if alien is on), and CCT (digit+result) keys. All three axes score independently — true dual/triple-task training.
            </div>
            <div>
              <span className="text-accent font-semibold">Mixed N-Back:</span> Randomly <span className="text-foreground font-semibold">switches between Normal and Type</span> each trial. You never know which rule applies, forcing <span className="text-foreground">cognitive flexibility</span>.
            </div>
            <div>
              <span className="text-accent font-semibold">Mixed RINT:</span> Three-way random per trial: <span className="text-foreground font-semibold">Normal / Type / RINT</span>. Maximum unpredictability. Tests <span className="text-foreground">rapid rule switching &amp; reasoning</span>. Requires N≥2.
            </div>
            <div>
              <span className="text-accent font-semibold">Impossible Mode:</span> On multi-stream sessions, each stream <span className="text-foreground font-semibold">independently randomizes</span> between Normal, Type, and RINT every trial—different rules per stream simultaneously. <span className="text-foreground">Extreme multitasking demand</span>. Requires ≥2 streams & N≥2.
            </div>
            <div>
              <span className="text-accent font-semibold">Binary Logic:</span> Each trial assigns <span className="text-foreground font-semibold">two conditions per stream</span> (e.g., "Normal AND RINT", "Type OR Normal") combined with logic operators (AND, OR, XOR, AND_NOT). A match fires only when the combined condition is true. Tests <span className="text-foreground">boolean reasoning & dual tracking</span>. Requires N≥2.
            </div>
            <div>
              <span className="text-accent font-semibold">Alien Cube Mode:</span> Each stream appears inside a <span className="text-foreground font-semibold">continuously rotating transparent 3×3×3 cube</span>. A trial can match by relationship and separately by cube-cell position, using the stream's REL and POS keys.
            </div>
            <div>
              <span className="text-accent font-semibold">Alien Tesseract Mode:</span> Each stream appears inside a <span className="text-foreground font-semibold">projected 4D tesseract</span>. POS targets track both the visible cube cell and an inner/mid/outer hyperspace layer.
            </div>
            <div>
              <span className="text-accent font-semibold">Alien Square Mode:</span> A 2D <span className="text-foreground font-semibold">rotating 3×3 square grid</span> tracks position targets. The selected cell is enlarged and highlighted so you can see which position to remember.
            </div>
            <div>
              <span className="text-accent font-semibold">Alien Rotation Settings:</span> Cube, Tesseract, and Square modes support fixed or random rotation speed plus clockwise, counter-clockwise, or random direction. Rotation continues until the trial changes.
            </div>
            <div>
              <span className="text-accent font-semibold">Variable N:</span> N <span className="text-foreground font-semibold">randomly shifts ±1</span> each trial around your chosen N. Tests <span className="text-foreground">flexible working memory updating</span>.
            </div>
            <div>
              <span className="text-accent font-semibold">Adaptive N:</span> N <span className="text-foreground font-semibold">auto-adjusts between sessions</span> based on accuracy: ≥80% → increase N, ≤50% → decrease N. Keeps you <span className="text-foreground">at the sweet spot of challenge</span>.
            </div>
            <div>
              <span className="text-accent font-semibold">Distractors:</span> Near-match stimuli from the same category appear as <span className="text-foreground font-semibold">interference</span>. Tests <span className="text-foreground">selective attention & resistance to confusion</span>.
            </div>
            <div>
              <span className="text-accent font-semibold">Per-Trial Feedback:</span> After every trial, each stream briefly flashes a verdict tag — <span className="text-foreground">HIT</span> · <span className="text-foreground">MISS</span> · <span className="text-foreground">FALSE ALARM</span> · <span className="text-foreground">CORRECT REJECTION</span> — alongside the relation name. Slows the session slightly but dramatically accelerates rule learning. Turn it on while you're new to a mode; turn it off once you can sight-read the visuals.
            </div>
            <div>
              <span className="text-accent font-semibold">Lure Trials:</span> About 1 in 5 non-target trials becomes a <span className="text-foreground font-semibold">near-miss</span> — a stim that would have been a target at <span className="text-foreground">N-1 or N+1</span> instead of N. The careful counter rejects; the loose counter false-alarms. Results show a separate <span className="text-foreground">Lure Resistance</span> percentage so you can track interference resistance over time. Idea adapted from Capacity Gym v2.
            </div>
            <div>
              <span className="text-accent font-semibold">Negation:</span> About 30 % of trials are flipped to <span className="text-red-400 font-bold">¬</span> (red badge top-right of the stim). The visual stays the same but its <span className="text-foreground font-semibold">logical fact is inverted</span>. An n-back match requires both the relation AND the negation flag to agree, so two visually-identical relations with different ¬ states are <em>not</em> a match. Trains explicit logical inversion alongside relational encoding.
            </div>
            <div>
              <span className="text-accent font-semibold">RST Side-Task (Reasoning):</span> Layered on stream A exactly the way <span className="text-foreground">CCT</span> is, but with deductive inference instead of arithmetic. <span className="text-foreground font-semibold">One premise per trial</span> at the top of the panel (e.g. "β same as α"). From trial N onwards a <span className="text-foreground">candidate conclusion</span> also appears (e.g. "∴≟ δ opposite of β"). Press <span className="text-violet-400 font-bold">R</span> if the conclusion is logically valid given the last N premises; otherwise hold. Built on the Distinction family (same/opposite parity), inspired by <a href="https://github.com/4skinskywalker/Syllogimous-v3" target="_blank" rel="noreferrer" className="underline text-violet-300">Syllogimous v3</a> (CC BY-NC 3.0).
            </div>
          </div>
        </div>

        {/* Worked Examples for the new modes */}
        <div className="rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-fuchsia-400 mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> Worked Examples (N = 2)
          </h2>

          <div className="space-y-5 text-sm font-mono text-foreground/90">
            <div>
              <div className="text-fuchsia-300 font-semibold mb-2">Nonverbal RINT (subset-union rule)</div>
              <p className="text-muted-foreground mb-2">Target = current attrs equal the union of <span className="text-foreground">some non-empty subset</span> of the last N stims. So you don't have to combine <em>all</em> the recent trials — just any few of them that "add up" to the current.</p>
              <div className="rounded bg-background/60 border border-border p-3 text-xs space-y-1">
                <div>Trial 1: <span className="text-cyan-300">touching ✓</span> · <span className="text-emerald-300">audio ✓</span></div>
                <div>Trial 2: <span className="text-violet-300">hollow ✓</span> · <span className="text-amber-300">size!= ✓</span></div>
                <div>Trial 3a shows <span className="text-cyan-300">touching ✓</span> · <span className="text-emerald-300">audio ✓</span> → subset = {`{trial 1}`} → <span className="text-emerald-400 font-bold">TARGET</span></div>
                <div>Trial 3b shows <span className="text-cyan-300">touching ✓</span> · <span className="text-violet-300">hollow ✓</span> · <span className="text-emerald-300">audio ✓</span> → subset = {`{trial 1, trial 2 (only hollow)}`}… but trial 2 also has size!=, which trial 3b lacks → trial 2 isn't compatible → <span className="text-red-400 font-bold">not a target</span></div>
                <div>Trial 3c shows all 4 flags ON → subset = {`{trial 1, trial 2}`} → <span className="text-emerald-400 font-bold">TARGET</span></div>
              </div>
              <p className="text-muted-foreground/70 text-[11px] mt-2">A stim is "compatible" with the current if none of its flags is ON where the current is OFF. The current is a target iff the union of all compatible stims in the last N equals the current's attribute set.</p>
            </div>

            <div>
              <div className="text-fuchsia-300 font-semibold mb-2 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> CCT (arithmetic)
              </div>
              <p className="text-muted-foreground mb-2">Target = candidate <span className="text-foreground">equals</span> current digit + digit from 2 trials ago.</p>
              <div className="rounded bg-background/60 border border-border p-3 text-xs space-y-1">
                <div>Trial 1: digit <span className="text-cyan-300 font-bold">3</span> (observe)</div>
                <div>Trial 2: digit <span className="text-cyan-300 font-bold">5</span> (observe)</div>
                <div>Trial 3: digit <span className="text-cyan-300 font-bold">4</span>, candidate <span className="text-amber-300 font-bold">7</span> → 4 + 3 = 7 → <span className="text-emerald-400 font-bold">TARGET</span></div>
                <div>Trial 4: digit <span className="text-cyan-300 font-bold">2</span>, candidate <span className="text-amber-300 font-bold">9</span> → 2 + 5 = 7 ≠ 9 → <span className="text-red-400 font-bold">not a target</span></div>
              </div>
            </div>

            <div>
              <div className="text-fuchsia-300 font-semibold mb-2">CCT Side-Task on a relation stream</div>
              <p className="text-muted-foreground mb-2">Same arithmetic rule, but it runs <span className="text-foreground">alongside</span> the relation n-back on the same stream. Two response axes:</p>
              <div className="rounded bg-background/60 border border-border p-3 text-xs space-y-1">
                <div>Trial 5 shows: <span className="text-primary">Inside</span> relation + <span className="text-cyan-300">CCT 6 ≟ <span className="text-amber-300">11</span></span></div>
                <div>Press <span className="text-primary font-bold">REL</span> if Inside matches the relation from trial 3 (independent of CCT)</div>
                <div>Press <span className="text-rose-300 font-bold">CCT</span> if 6 + (trial 3's digit) equals 11 (independent of relation)</div>
                <div className="text-muted-foreground/70">Each axis scores its own hit / miss / FA / CR.</div>
              </div>
            </div>

            <div>
              <div className="text-fuchsia-300 font-semibold mb-2">Complex relations</div>
              <p className="text-muted-foreground">Five new scan-for-difference relations live in their own <span className="text-foreground">Complex</span> category — e.g. "3 Pairs · 1 Different" shows three pairs of shapes where two pairs are touching and one has a gap. You play them like any normal n-back relation, except the visual content forces you to scan multiple groups rather than just compare two shapes. Try the Stimuli Mix slider with Complex weighted at 30–50% for a focused session.</p>
            </div>

            <div>
              <div className="text-fuchsia-300 font-semibold mb-2">Lure trials (N = 2)</div>
              <p className="text-muted-foreground mb-2">Lures match at the wrong N-offset. Tempting if you're counting loose.</p>
              <div className="rounded bg-background/60 border border-border p-3 text-xs space-y-1">
                <div>Trial 1: <span className="text-primary">Inside</span></div>
                <div>Trial 2: <span className="text-primary">Above/Below</span></div>
                <div>Trial 3: <span className="text-primary">Touching</span> → not a match (≠ Inside), <span className="text-red-400 font-bold">don't press</span></div>
                <div>Trial 4 (lure): <span className="text-primary">Above/Below</span> → matches <span className="text-foreground">N=2</span>… but engine flagged it as a <span className="text-amber-300">lure at offset +1</span>: it really matches trial 3 distance, not trial 2 → <span className="text-red-400 font-bold">non-target</span>. Pressing here = lure FA.</div>
                <div className="text-muted-foreground/70 mt-1">Results screen shows Lure Resistance = % of lure trials you correctly rejected.</div>
              </div>
            </div>

            <div>
              <div className="text-fuchsia-300 font-semibold mb-2">RST Side-Task (Reasoning) — N = 2</div>
              <p className="text-muted-foreground mb-2">CCT-style: one premise per trial, a candidate conclusion from trial N onwards. Independent from the n-back response.</p>
              <div className="rounded bg-background/60 border border-border p-3 text-xs space-y-1">
                <div>Trial 1: <span className="text-cyan-300">α</span> (introduced — observe)</div>
                <div>Trial 2: <span className="text-cyan-300">β same as α</span> (one premise — observe)</div>
                <div>Trial 3: <span className="text-cyan-300">γ opposite of β</span> + conclusion <span className="text-amber-300">∴≟ γ opposite of α</span></div>
                <div>The chain: α≡β, β≠γ → so γ≠α → conclusion VALID → press <span className="text-violet-400 font-bold">R</span></div>
                <div>Trial 4: <span className="text-cyan-300">δ same as γ</span> + conclusion <span className="text-amber-300">∴≟ δ same as β</span></div>
                <div>The chain (last 2): β≠γ, γ≡δ → so δ≠β → "δ same as β" is INVALID → don't press</div>
                <div className="text-muted-foreground/70">RST scores its own hit/miss/FA/CR pile, separate from REL.</div>
              </div>
            </div>

            <div>
              <div className="text-fuchsia-300 font-semibold mb-2">Negation</div>
              <p className="text-muted-foreground mb-2">¬ on the corner = "this visual means the OPPOSITE". The match has to agree on negation, not just relation.</p>
              <div className="rounded bg-background/60 border border-border p-3 text-xs space-y-1">
                <div>Trial 1: <span className="text-primary">Inside</span> (no ¬)</div>
                <div>Trial 2: <span className="text-primary">Above/Below</span> (no ¬)</div>
                <div>Trial 3a: <span className="text-primary">Inside</span> (no ¬) → matches trial 1 fully → <span className="text-emerald-400 font-bold">TARGET</span></div>
                <div>Trial 3b: <span className="text-primary">Inside</span> with <span className="text-red-400 font-bold">¬</span> → same relation but opposite logical fact → <span className="text-red-400 font-bold">non-target</span> (negation lure)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cognitive Forge v2.0 Upgrades */}
        <div className="rounded-lg bg-gradient-to-r from-fuchsia-500/10 to-amber-500/10 border border-fuchsia-500/30 p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-fuchsia-400 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-fuchsia-400 animate-pulse" /> Cognitive Forge Upgrade Features
          </h2>
          <div className="space-y-4 text-sm font-mono text-foreground/90">
            <div>
              <span className="text-fuchsia-300 font-semibold">Closed-Loop Adaptivity:</span> 
              Dynamically scales speeds, lure rates, and negation levels continuously inside a single session based on your real-time accuracy over a 4-trial sliding window. Relational accuracy &ge; 80% speeds up stimulus duration and spikes lure/negation difficulty; drop below 60% accuracy and the speed relaxes, easing complexity.
            </div>
            <div>
              <span className="text-fuchsia-300 font-semibold">Stress &amp; Arousal Distractors:</span>
              Engage high-intensity stressors to build cognitive stress resilience:
              <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Visual Glitch Engine:</strong> Injects random GPU-accelerated visual distortions and skewing into cards to test focal isolation.</li>
                <li><strong className="text-foreground">Screen Shake Distractor:</strong> Shakes the structural canvas at random points to challenge focus.</li>
                <li><strong className="text-foreground">Timer Panic Heatbar:</strong> Displays a countdown bar corresponding to the active trial duration, shifting colors from emerald to red as time expires to create visual urgency.</li>
              </ul>
            </div>
            <div>
              <span className="text-fuchsia-300 font-semibold">Transfer Ledger &amp; Daily Warm-up:</span>
              Use the <strong className="text-foreground">Daily Warm-up</strong> preset for an instantaneous peak challenge (N=3, 30 rounds, ultra-fast 2000ms speed, with Closed-Loop, Lures, Negation, Timer Panic, and RST reasoning all active). At session completion, record your subjective metacognitive arousal state (Too Hot, In Band, Too Cold, or Shaky) and log real-world cognitive transfer operators directly to your persistent <strong className="text-foreground">Transfer Ledger</strong>.
            </div>
          </div>
        </div>

        {/* Cognitive Coach & Autopilot Curriculum */}
        <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400 animate-pulse" /> Cognitive Coach Autopilot Curriculum
          </h2>
          <p className="text-sm font-mono text-muted-foreground mb-4">
            Struggling to find the right balance of parameters? The <strong className="text-foreground">Cognitive Coach Autopilot</strong> handles the complexity for you. It locks your training settings into a progressive 24-stage scientifically designed curriculum. By demonstrating steady performance, the coach automatically unlocks new challenges:
          </p>
          <div className="space-y-3 text-xs font-mono text-foreground/90 font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-border/40 pb-3">
              <div>
                <span className="text-emerald-300 font-semibold">Phase A: Classic Warm-up</span>
                <p className="text-muted-foreground mt-0.5">Phases A-D. Simple entry points modeled after the classic trainer (N=1 focus, auditory/visual switching, bind tasks, and N=2 slow training).</p>
              </div>
              <div>
                <span className="text-cyan-300 font-semibold">Phase 1: Foundational Support</span>
                <p className="text-muted-foreground mt-0.5">Levels 1-4. Focuses on base relational matching, selective visual filters, lure protection, and negation operators under helpful trial-by-trial diagnostic feedback.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-border/40 pb-3">
              <div>
                <span className="text-fuchsia-300 font-semibold">Phase 2: Dual-Tasking &amp; Logic</span>
                <p className="text-muted-foreground mt-0.5">Levels 5-8. Introduces pure arithmetic calculations, dual-task overlay matching, deductive syllogisms, and adaptive closed-loop pacing.</p>
              </div>
              <div>
                <span className="text-amber-300 font-semibold">Phase 3: Memory Integration</span>
                <p className="text-muted-foreground mt-0.5">Levels 9-13. Engages advanced semantic queues, Relational Chaining (RINT), subset-unions, rule flexibility, and Boolean logic operations.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-border/40 pb-3">
              <div className="sm:col-span-2">
                <span className="text-rose-300 font-semibold">Phase 4: Spatial Rotations &amp; Glitches</span>
                <p className="text-muted-foreground mt-0.5">Levels 14-20. Forces 2D spatial matrices, transparent 3D rotations, 4D tesseracts, GPU skews, and parallel dual-stream multitasking.</p>
              </div>
            </div>

            {/* Dynamic Training Phases Table */}
            <div className="border border-border/80 rounded-xl overflow-hidden mt-4 shrink-0 bg-background/50">
              <div className="overflow-x-auto max-h-[400px] scrollbar-thin">
                <table className="w-full text-[10px] sm:text-xs font-mono text-left border-collapse">
                  <thead className="sticky top-0 bg-secondary z-10">
                    <tr className="border-b border-border/60 text-primary font-bold">
                      <th className="p-2 sm:p-3">LVL</th>
                      <th className="p-2 sm:p-3">PHASE TITLE</th>
                      <th className="p-2 sm:p-3 text-center">N</th>
                      <th className="p-2 sm:p-3 text-center">SPEED</th>
                      <th className="p-2 sm:p-3 text-center">ROUNDS</th>
                      <th className="p-2 sm:p-3">MODES INCLUDED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {COACH_PHASES.map((p, idx) => {
                      let phaseBadgeColor = "text-emerald-400";
                      if (idx >= 4 && idx < 8) phaseBadgeColor = "text-cyan-400";
                      if (idx >= 8 && idx < 12) phaseBadgeColor = "text-fuchsia-400";
                      if (idx >= 12 && idx < 17) phaseBadgeColor = "text-amber-400";
                      if (idx >= 17) phaseBadgeColor = "text-rose-400";
                      
                      return (
                        <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-2 sm:p-3 font-semibold text-foreground/80">{idx + 1}</td>
                          <td className={`p-2 sm:p-3 font-bold ${phaseBadgeColor}`}>{p.title}</td>
                          <td className="p-2 sm:p-3 text-center font-bold text-foreground">{p.nLevel}</td>
                          <td className="p-2 sm:p-3 text-center text-muted-foreground">{p.speedMs}ms</td>
                          <td className="p-2 sm:p-3 text-center text-muted-foreground">{p.rounds}</td>
                          <td className="p-2 sm:p-3 text-[10px] text-muted-foreground/90 leading-tight">
                            {p.modes.length > 0 ? p.modes.map(m => m.replace(/_/g, ' ')).join(', ') : 'normal relation matching'}
                            {p.streamsCount && p.streamsCount > 1 ? ` (${p.streamsCount} streams)` : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-secondary/40 border border-border rounded-lg p-3">
              <span className="text-emerald-400 font-bold block mb-1">Rank Progression Rules:</span>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Demonstrating <strong className="text-foreground">&ge; 75% accuracy</strong> over 2 consecutive sessions triggers a <strong className="text-foreground">Phase Level Up</strong>, unlocking advanced cognitive stressors.</li>
                <li>Dropping below <strong className="text-foreground">55% accuracy</strong> over 2 consecutive sessions signals the coach to de-escalate you by one phase to keep you in the flow zone.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Accuracy Tips */}
        <div className="rounded-lg bg-accent/10 border border-accent/30 p-6 mb-8">
          <h2 className="text-lg font-mono font-semibold text-accent mb-3">Tips for Better Accuracy</h2>
          <ul className="space-y-2 text-sm font-mono text-foreground/90">
            <li>• <span className="text-accent">Focus:</span> Concentrate on the current stimulus and N-back relationship; in Carousel mode, watch every slide first, then answer once responses unlock</li>
            <li>• <span className="text-accent">Consistent Pacing:</span> Start slow, increase speed as you improve; use Random speed when you want unpredictable timing</li>
            <li>• <span className="text-accent">Review Sessions:</span> Check your performance in Stats to identify weak modes</li>
            <li>• <span className="text-accent">Progressive Difficulty:</span> Use Adaptive Mode to auto-adjust N-level</li>
          </ul>
        </div>

        {/* Install hint */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-5 mb-8">
          <h2 className="text-base font-mono font-semibold text-primary mb-2">Install as an app</h2>
          <p className="text-sm font-mono text-muted-foreground">
            On Chrome / Edge / Android the dashboard shows an <span className="text-primary">Install app</span> button — one tap installs a home-screen icon and runs the trainer full-screen with no browser chrome. On iOS Safari, tap <span className="text-foreground">Share → Add to Home Screen</span>. The app also works offline after the first load — all sessions live in your browser.
          </p>
        </div>

        {/* Back Button */}
        <Link to="/" className="flex justify-center">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}