import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Brain, Zap, Layers, Gamepad2, GitBranch, Hash } from 'lucide-react';

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
              <span className="text-accent font-semibold">RST Side-Task (Reasoning):</span> Layered on stream A like CCT, but instead of arithmetic it tests <span className="text-foreground font-semibold">deductive inference</span>. About 1 in 4 trials shows a small box with 2 premises and a conclusion (e.g. "α more than β, β more than γ. ∴ α more than γ?"). Press the <span className="text-violet-400 font-bold">R</span> key (or A · RST button) if the conclusion is <span className="text-foreground">logically valid</span>; ignore it if it isn't. Generators ported from <a href="https://github.com/4skinskywalker/Syllogimous-v3" target="_blank" rel="noreferrer" className="underline text-violet-300">Syllogimous v3</a> (CC BY-NC 3.0). Easy difficulty only for now (Distinction / Comparison / Temporal, 2 premises each).
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
              <div className="text-fuchsia-300 font-semibold mb-2">RST Side-Task (Reasoning)</div>
              <p className="text-muted-foreground mb-2">A premise/conclusion side-task on stream A. Independent from the n-back response.</p>
              <div className="rounded bg-background/60 border border-border p-3 text-xs space-y-1">
                <div>Trial 7 shows the relation visual, plus a violet box at the bottom:</div>
                <div className="text-foreground/85 pl-3">α more than β</div>
                <div className="text-foreground/85 pl-3">β more than γ</div>
                <div className="text-violet-200 font-semibold pl-3">∴ α more than γ ?</div>
                <div>Press <span className="text-primary font-bold">REL</span> if the relation matches trial 5 (the n-back, unchanged).</div>
                <div>Press <span className="text-violet-400 font-bold">R</span> if the conclusion is logically valid (here: yes).</div>
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