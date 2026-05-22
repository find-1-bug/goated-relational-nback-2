import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, Brain, Zap, Layers, Gamepad2, 
  GitBranch, Hash, Eye, Volume2, ShieldAlert, 
  Sparkles, Menu, X, Play, Settings2 
} from 'lucide-react';
import { COACH_PHASES } from '@/lib/gameConstants';

const TABS = [
  { id: 'intro',     label: 'Core Basics',     icon: Brain,        desc: 'N-Back introduction, play guide, and controls' },
  { id: 'settings',  label: 'Settings Guide',  icon: Settings2,    desc: 'Parameters, symbols, and custom token styles' },
  { id: 'modes',     label: 'Cognitive Modes', icon: Layers,       desc: 'Deep dive into transitive, nonverbal, and CCT logic' },
  { id: 'features',  label: 'Special Tech',    icon: Sparkles,     desc: 'Synaesthesia maps, audiobeats, and stressors' },
  { id: 'autopilot', label: 'Autopilot Prep',  icon: Zap,          desc: 'Scientific 20-level progressive curriculum grid' },
  { id: 'examples',  label: 'Step Walkthroughs',icon: GitBranch,    desc: 'Worked trial examples for complex rules' },
];

export default function Tutorial() {
  const [activeTab, setActiveTab] = React.useState('intro');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile menu on tab switch
  const selectTab = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const activeTabMeta = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-[#090d16] text-foreground font-mono flex flex-col md:flex-row"
    >
      {/* SIDEBAR NAVIGATION (Desktop) / TOP MENU BAR (Mobile) */}
      <div className="w-full md:w-64 md:min-h-screen bg-[#0d1527] border-b md:border-b-0 md:border-r border-border/80 flex flex-col shrink-0 z-20">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-bold text-xs uppercase tracking-widest text-foreground">Academy</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex flex-col flex-1 p-3 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2.5 font-medium
                  ${active 
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold shadow-[0_0_12px_rgba(34,211,238,0.1)]' 
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground border border-transparent'}`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-muted-foreground/80'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          
          <div className="pt-4 mt-auto">
            <Link to="/" className="block">
              <Button className="w-full bg-[#1e293b] hover:bg-[#334155] border border-border text-foreground text-xs gap-1.5 h-9">
                <ChevronLeft className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-b border-border/60 bg-[#0d1527] overflow-hidden flex flex-col p-3 space-y-1"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2.5
                      ${active 
                        ? 'bg-primary/20 text-primary border border-primary/30 font-bold' 
                        : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground border border-transparent'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              <div className="pt-2 border-t border-border/40 mt-1">
                <Link to="/" className="block">
                  <Button className="w-full bg-secondary text-foreground text-xs gap-1.5 h-9">
                    <ChevronLeft className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN CONTENT DISPLAY AREA */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header Breadcrumb */}
        <div className="mb-6 pb-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary/80">
              <Brain className="w-3.5 h-3.5" />
              <span>Training Academy</span>
              <span>&middot;</span>
              <span className="text-muted-foreground">{activeTabMeta.label}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground mt-1 uppercase tracking-wider">{activeTabMeta.label}</h1>
          </div>
          <Link to="/" className="self-start sm:self-auto hidden md:block">
            <Button className="bg-[#22d3ee]/10 hover:bg-[#22d3ee]/20 text-[#22d3ee] border border-[#22d3ee]/40 text-xs font-semibold px-4 py-1.5 h-8">
              Launch Game
            </Button>
          </Link>
        </div>

        {/* Tab Subpage Content Switcher */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* CORE BASICS TAB */}
              {activeTab === 'intro' && (
                <div className="space-y-6">
                  {/* Quick Start Card */}
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 sm:p-6 shadow-inner">
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                      <Play className="w-4 h-4 fill-primary text-primary" /> Training Loop Quickstart
                    </h2>
                    <ol className="space-y-2.5 text-xs sm:text-sm font-mono text-foreground/90">
                      <li className="flex gap-2"><span className="text-primary font-bold">1.</span> <span>Choose your target <strong>N-Level</strong> (memory depth).</span></li>
                      <li className="flex gap-2"><span className="text-primary font-bold">2.</span> <span>Pick visual and acoustic categories (Spatial, Quantitative, Complex, Verbal, Sound).</span></li>
                      <li className="flex gap-2"><span className="text-primary font-bold">3.</span> <span>Bind <strong>Streams</strong> and customize response buttons (REL, POS, or CCT math).</span></li>
                      <li className="flex gap-2"><span className="text-primary font-bold">4.</span> <span>A stimulus appears. If its current property matches the one from <strong>N steps ago</strong>, trigger the key immediately.</span></li>
                      <li className="flex gap-2"><span className="text-primary font-bold">5.</span> <span>Analyze immediate trial feedback verdicts (HIT, MISS, LURE FA) to adapt.</span></li>
                    </ol>
                  </div>

                  {/* Core Concepts */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4.5 h-4.5 text-emerald-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">What is N-Back?</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                        A scientifically verified memory-updating test. You track a moving chain of relations. A match occurs when the current relationship matches the relationship that was shown exactly <strong>N trials ago</strong>.
                      </p>
                    </div>

                    <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-4.5 h-4.5 text-cyan-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">How to Play</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                        Train focal attention. As each box updates, compare it to the one at N-distance back. Trigger matching keys rapidly before the next card rotates into the frame.
                      </p>
                    </div>

                    <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4.5 h-4.5 text-amber-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Independent Scored Axes</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                        If multi-task layers are enabled, a single stimulus can trigger multiple match types simultaneously (e.g., both a relationship match and an alien cell position match). Press all matching keys on the keyboard — each axis compiles its score completely independently!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS GUIDE TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-4">
                    <h2 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2">Primary Controls</h2>
                    
                    <div className="space-y-3.5 text-xs leading-relaxed">
                      <div>
                        <strong className="text-primary block font-mono">N-Level (Memory Depth):</strong>
                        <span>How many steps back to retain. N=1 is immediate; N=3 represents a steep working memory challenge.</span>
                      </div>
                      <div>
                        <strong className="text-primary block font-mono">Relationship Types:</strong>
                        <span>Enable spatial relative matrices, 3D orbits, character traits, scans for quantitative ratios, sound frequencies, or verbal concepts.</span>
                      </div>
                      <div>
                        <strong className="text-primary block font-mono">Custom Stimuli Weighting Mix:</strong>
                        <span>Sliders on the main panel let you configure the percentage frequency of each category (e.g. training 80% Spatial 3D and 20% Sound).</span>
                      </div>
                      <div>
                        <strong className="text-primary block font-mono">Interactive Multi-Streams:</strong>
                        <span>Add up to 20 separate simultaneous sequences, assigning customizable keybind trigger buttons for each feed.</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-4">
                    <h2 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2">Visual &amp; Representation Settings</h2>
                    
                    <div className="space-y-3.5 text-xs leading-relaxed">
                      <div>
                        <strong className="text-emerald-400 block font-mono">Relation Symbol Randomization:</strong>
                        <span>Stimuli toggle per-trial between <strong>normal</strong> written descriptions (e.g. "occurs before", "is heavier than") and <strong>minimal</strong> mathematical/directional symbols (e.g. "t &lt;", "▲"). Randomization blocks visual rote-verbalization and forces abstract cognitive parsing!</span>
                      </div>
                      <div>
                        <strong className="text-cyan-400 block font-mono">Junk-Journal / Scrap Collages:</strong>
                        <span>A custom procedurally-drawn token style modeling hand-torn physical scrap collage clippings (junk journaling), complete with jagged edges, exposures, shadow drops, and carbon outlines for maximum high-contrast character reading. Each scrap token carries a unique serialized code starting with <strong>S:</strong> (e.g. <span className="text-cyan-300 font-bold">S:13231</span>) which acts as a seed for the canvas rendering generator to draw the identical collage clipping every time that trial is shown again.</span>
                      </div>
                      <div>
                        <strong className="text-amber-400 block font-mono">Automated Carousel:</strong>
                        <span>Timely slides multiple active feeds when viewport bounds are packed. Carousel speed dictates slide transitions separately.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COGNITIVE MODES TAB */}
              {activeTab === 'modes' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-4">
                    <h2 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border/40 pb-2">Enhancement Modes Breakdown</h2>
                    
                    <div className="space-y-4 text-xs leading-relaxed">
                      <div>
                        <strong className="text-accent block font-mono uppercase tracking-wider">Type N-Back</strong>
                        <span>Match matches by relationship <strong>category</strong> instead of exact string (e.g., matching any "inside" relation to any prior "inside" relation). Constrained to transitive rules to maintain logic. Challenges semantic storage.</span>
                      </div>
                      <div>
                        <strong className="text-accent block font-mono uppercase tracking-wider">RINT (Relational Integration)</strong>
                        <span>Chains facts logically using transitive deductions (e.g., Trial 1: "A &gt; B", Trial 2: "B &gt; C" proving "A &gt; C" matches). Forces inference mapping in working memory. Requires N&ge;2.</span>
                      </div>
                      <div>
                        <strong className="text-accent block font-mono uppercase tracking-wider">Nonverbal RINT</strong>
                        <span>Stimuli carry a composite set of binary attributes across two modalities (Visual: touching, hollow, size-mismatch, rotated; Audio: Tone rhythm). Matches occur when the current composite can be resolved from the <strong>union of a subset</strong> of the last N trials. Disable individual flags under the custom nonverbal configurations drawer.</span>
                      </div>
                      <div>
                        <strong className="text-accent block font-mono uppercase tracking-wider">CCT (Cognitive Control arithmetic)</strong>
                        <span>Pure arithmetic n-back. From trial N onwards, a candidate result appears. Press REL if <strong>result == current_digit + N-back_digit</strong>. Pure mathematical working memory updating.</span>
                      </div>
                      <div>
                        <strong className="text-accent block font-mono uppercase tracking-wider">Binary Logic</strong>
                        <span>Combines dual conditions per trial using boolean algebra gates (AND, OR, XOR, AND_NOT). Relational encoding requires both to resolve to true.</span>
                      </div>
                      <div>
                        <strong className="text-primary block font-mono uppercase tracking-wider">Wrapper Morphing Mode</strong>
                        <span>A premium visual and logical set-shifting distractor. Mid-session, the interface dynamically morphs both visually (shifting between Cyberpunk, Stark, Glassmorphic Frost, Sunset, and Matrix themes) and logically (rotating the active relationship categories either trial-by-trial or in blocks of 5). Tests rapid mental flexibility!</span>
                      </div>
                      <div>
                        <strong className="text-fuchsia-400 block font-mono uppercase tracking-wider">Cross-Modal Token Blending</strong>
                        <span>Blends verbal text, alphanumeric characters, and graphic emojis directly inside other relationship grids (like Spatial matrices, Orbiting 3D shapes, or Trait pairings). Blocks superficial shortcuts and overloads the episodic buffer.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIAL TECH TAB */}
              {activeTab === 'features' && (
                <div className="space-y-4">
                  {/* Synaesthesia */}
                  <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Grapheme-Color Synaesthesia Mode</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                      Experience customized letter-digit sensory coupling. Every alphanumeric character drawn in verbal tokens, CCT math grids, and 3D WebGL orbiters gets painted in its own distinct, custom-color preset. Custom-mapped graphemes use a heavy high-contrast mask outline to ensure perfect, instant legibility across all backgrounds.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                      Toggle the option and expand the interactive swatch panel directly under "Token Style Mix" on the setup dashboard to set your custom letter color mappings.
                    </p>
                  </div>

                  {/* Audiobeats */}
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Multi-Channel Spatial Beats</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                      Acoustic streams are completely abstract pitch beats, rather than spoken codes. Audio channels are isolated into left/right ears with green spatial status badges. Speaker playback separates signals in time to remain clean.
                    </p>
                  </div>

                  {/* Stressors */}
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">GPU Glitch Engines &amp; Panic Stressors</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                      Enable the premium visual stressor filters to build extreme attention resistance: visual GPU glitched card skews, violent canvas screen-shaking, and the countdown Timer Panic Heatbar that transitions color dynamically.
                    </p>
                  </div>
                </div>
              )}

              {/* AUTOPILOT CURRICULUM TAB */}
              {activeTab === 'autopilot' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                      <Brain className="w-4 h-4 text-emerald-400 animate-pulse" /> Autopilot Calibration Loop
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                      The Coach Autopilot maps your cognitive progression across 20 stages:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground font-mono">
                      <li>Maintain <strong className="text-foreground">&ge; 75% accuracy</strong> over 2 consecutive sessions to Level Up.</li>
                      <li>Drop below <strong className="text-foreground">55% accuracy</strong> over 2 consecutive sessions to trigger auto-fallback easing.</li>
                    </ul>
                  </div>

                  {/* Phase Table */}
                  <div className="border border-border/80 rounded-xl overflow-hidden bg-[#0d1527]">
                    <div className="overflow-x-auto max-h-[350px] scrollbar-thin">
                      <table className="w-full text-[10px] sm:text-xs font-mono text-left border-collapse">
                        <thead className="sticky top-0 bg-[#16223b] z-10">
                          <tr className="border-b border-border/60 text-primary font-bold">
                            <th className="p-2 sm:p-3">LVL</th>
                            <th className="p-2 sm:p-3">PHASE</th>
                            <th className="p-2 sm:p-3 text-center">N</th>
                            <th className="p-2 sm:p-3 text-center">SPEED</th>
                            <th className="p-2 sm:p-3 text-center">ROUNDS</th>
                            <th className="p-2 sm:p-3">MODES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {COACH_PHASES.map((p, idx) => {
                            let phaseColor = "text-emerald-400";
                            if (idx >= 4 && idx < 8) phaseColor = "text-cyan-400";
                            if (idx >= 8 && idx < 12) phaseColor = "text-fuchsia-400";
                            if (idx >= 12 && idx < 17) phaseColor = "text-amber-400";
                            if (idx >= 17) phaseColor = "text-rose-400";
                            
                            return (
                              <tr key={idx} className="hover:bg-secondary/15 transition-colors">
                                <td className="p-2 sm:p-3 font-semibold text-foreground/80">{idx + 1}</td>
                                <td className={`p-2 sm:p-3 font-bold ${phaseColor}`}>{p.title}</td>
                                <td className="p-2 sm:p-3 text-center font-bold text-foreground">{p.nLevel}</td>
                                <td className="p-2 sm:p-3 text-center text-muted-foreground">{p.speedMs}ms</td>
                                <td className="p-2 sm:p-3 text-center text-muted-foreground">{p.rounds}</td>
                                <td className="p-2 sm:p-3 text-[10px] text-muted-foreground/80 leading-tight">
                                  {p.modes.length > 0 ? p.modes.map(m => m.replace(/_/g, ' ')).join(', ') : 'normal relations'}
                                  {p.streamsCount && p.streamsCount > 1 ? ` (${p.streamsCount} streams)` : ''}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* WORKED EXAMPLES TAB */}
              {activeTab === 'examples' && (
                <div className="space-y-4">
                  <div className="space-y-4 text-xs">
                    {/* Ex 1 */}
                    <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-2">
                      <strong className="text-fuchsia-300 block font-mono">Nonverbal RINT Subset-Union Rule (N = 2)</strong>
                      <p className="text-muted-foreground leading-relaxed">
                        Match is true when current flags equal the union of a subset of the previous 2 stims.
                      </p>
                      <div className="rounded bg-background/50 border border-border p-3 space-y-1 font-mono text-[11px]">
                        <div>Trial 1: <span className="text-cyan-300">touching ✓</span> · <span className="text-emerald-300">audioBeat ✓</span></div>
                        <div>Trial 2: <span className="text-violet-300">hollow ✓</span></div>
                        <div>Trial 3: <span className="text-cyan-300">touching ✓</span> · <span className="text-violet-300">hollow ✓</span> · <span className="text-emerald-300">audioBeat ✓</span> &rarr; <span className="text-emerald-400 font-bold">TARGET</span> (combined Trial 1 + Trial 2)</div>
                      </div>
                    </div>

                    {/* Ex 2 */}
                    <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-2">
                      <strong className="text-fuchsia-300 block font-mono">CCT Arithmetic updating (N = 2)</strong>
                      <p className="text-muted-foreground leading-relaxed">
                        Match when candidate result matches current digit plus the digit from 2 steps back.
                      </p>
                      <div className="rounded bg-background/50 border border-border p-3 space-y-1 font-mono text-[11px]">
                        <div>Trial 1: digit <span className="text-cyan-300 font-bold">3</span></div>
                        <div>Trial 2: digit <span className="text-cyan-300 font-bold">5</span></div>
                        <div>Trial 3: digit <span className="text-cyan-300 font-bold">4</span>, candidate result <span className="text-amber-300 font-bold">7</span> &rarr; 4 + 3 = 7 &rarr; <span className="text-emerald-400 font-bold">TARGET</span></div>
                      </div>
                    </div>

                    {/* Ex 3 */}
                    <div className="rounded-lg bg-secondary/20 border border-border/80 p-5 space-y-2">
                      <strong className="text-fuchsia-300 block font-mono">Negation Operators (¬)</strong>
                      <p className="text-muted-foreground leading-relaxed">
                        A ¬ icon flips visual logic. Matches require both visual type AND negation flags to align exactly.
                      </p>
                      <div className="rounded bg-background/50 border border-border p-3 space-y-1 font-mono text-[11px]">
                        <div>Trial 1: <span className="text-primary font-bold">Inside</span> (no ¬)</div>
                        <div>Trial 2: <span className="text-primary font-bold">Above</span> (no ¬)</div>
                        <div>Trial 3: <span className="text-primary font-bold">Inside</span> with <span className="text-rose-400 font-bold">¬</span> &rarr; <span className="text-rose-400 font-bold">NOT A MATCH</span> (negation mismatch)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions inside the main display */}
        <div className="pt-6 border-t border-border/40 mt-8 shrink-0 flex items-center justify-between gap-4">
          <Link to="/">
            <Button className="bg-[#1e293b] hover:bg-[#334155] border border-border text-foreground text-xs gap-1.5 h-10 px-4">
              <ChevronLeft className="w-4 h-4" /> Back to Setup
            </Button>
          </Link>
          <Link to="/">
            <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold gap-1.5 h-10 px-5 shadow-lg shadow-emerald-500/10">
              <Play className="w-4 h-4 fill-white text-white" /> Train Now
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}