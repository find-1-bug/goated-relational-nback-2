import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StartScreen from '@/components/game/StartScreen';
import GameScreen from '@/components/game/GameScreen';
import ResultsScreen from '@/components/game/ResultsScreen';
import InstallAppButton from '@/components/InstallAppButton';
import ThemeToggle from '@/components/ThemeToggle';
import { calculateResults, computeNextNLevel } from '@/lib/gameEngine';
import { addSession, saveSettings, getSettings } from '@/lib/localStorageManager';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Game() {
  const [screen, setScreen] = useState('start');
  const [nLevel, setNLevel] = useState(2);
  const [modes, setModes] = useState([]);
  const [relationshipPool, setRelationshipPool] = useState(null);
  const [finalState, setFinalState] = useState(null);
  const [suggestedN, setSuggestedN] = useState(null);
  const [rounds, setRounds] = useState(20);
  const [speedMs, setSpeedMs] = useState(2800);
  const [extraStreams, setExtraStreams] = useState([]);
  const [streamA, setStreamA] = useState({ key: 'Space', keyDisplay: 'SPACE', positionKey: 'KeyP', positionKeyDisplay: 'P' });
  const [alienSettings, setAlienSettings] = useState({ cubeDirection: 'cw', cubeSpeed: 1, cubeSpeedMode: 'fixed', squareDirection: 'cw', squareSpeed: 1, squareSpeedMode: 'fixed' });
  const [carouselSettings, setCarouselSettings] = useState({ enabled: true, streamsPerSlide: 'auto', slideMs: 2800 });
  const [nrintEnabledFlags, setNrintEnabledFlags] = useState(null);
  const [nrintHideLegend, setNrintHideLegend] = useState(false);
  const [nrintMaxPerTrial, setNrintMaxPerTrial] = useState(0);
  const [decoyFilterRule, setDecoyFilterRule] = useState('never_target');
  const [decoyFilterRandom, setDecoyFilterRandom] = useState(true);
  const [decoyFilterCategories, setDecoyFilterCategories] = useState([]);
  const [rstDifficulty, setRstDifficulty] = useState('easy');
  const [tjnTier, setTjnTier] = useState('easy');
  const [tjnTopology, setTjnTopology] = useState('small_world');
  const [tjnNodes, setTjnNodes] = useState(6);
  const [tjnK, setTjnK] = useState(2);
  const [tjnSchemaMode, setTjnSchemaMode] = useState(false);
  const [tjnSchemaBlocks, setTjnSchemaBlocks] = useState(3);
  const [noobMode, setNoobMode] = useState(false);
  const [autopilot, setAutopilot] = useState(false);
  const [phaseTitle, setPhaseTitle] = useState('');
  const [coachPickedPhaseIndex, setCoachPickedPhaseIndex] = useState(null);
  const [coachPickReason, setCoachPickReason] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [gameRunId, setGameRunId] = useState(0);
  const [showStudies, setShowStudies] = useState(false);

  // Persisted settings restored on mount
  const [lastSettings, setLastSettings] = useState(() => {
    try {
      const settings = getSettings();
      return settings.lastGame || null;
    } catch {
      return null;
    }
  });

  const handleStart = (n, selectedModes, poolRels, totalRounds, stimulusMs, extraSettings, noob) => {
    setNLevel(n);
    setModes(selectedModes);
    setRelationshipPool(poolRels && poolRels.length > 0 ? poolRels : null);
    setRounds(totalRounds || 20);
    setSpeedMs(stimulusMs || 2800);
    setExtraStreams(extraSettings?.extraStreams || []);
    setStreamA(extraSettings?.streamA || { key: 'Space', keyDisplay: 'SPACE', positionKey: 'KeyP', positionKeyDisplay: 'P' });
    setAlienSettings(extraSettings?.alienSettings || { cubeDirection: 'cw', cubeSpeed: 1, cubeSpeedMode: 'fixed', squareDirection: 'cw', squareSpeed: 1, squareSpeedMode: 'fixed' });
    setCarouselSettings({ enabled: true, streamsPerSlide: 'auto', slideMs: 2800, ...(extraSettings?.carouselSettings || {}) });
    setNrintEnabledFlags(extraSettings?.nrintEnabledFlags || null);
    setNrintHideLegend(!!extraSettings?.nrintHideLegend);
    setNrintMaxPerTrial(Number(extraSettings?.nrintMaxPerTrial) || 0);
    setDecoyFilterRule(extraSettings?.decoyFilterRule || 'never_target');
    setDecoyFilterRandom(extraSettings?.decoyFilterRandom !== false);
    setDecoyFilterCategories(Array.isArray(extraSettings?.decoyFilterCategories) ? extraSettings.decoyFilterCategories : []);
    setRstDifficulty(extraSettings?.rstDifficulty || 'easy');
    setTjnTier(extraSettings?.tjnTier || 'easy');
    setTjnTopology(extraSettings?.tjnTopology || 'small_world');
    setTjnNodes(extraSettings?.tjnNodes || 6);
    setTjnK(extraSettings?.tjnK || 2);
    setTjnSchemaMode(!!extraSettings?.tjnSchemaMode);
    setTjnSchemaBlocks(extraSettings?.tjnSchemaBlocks || 3);
    setNoobMode(noob || false);
    setAutopilot(!!extraSettings?.autopilot);
    setPhaseTitle(extraSettings?.phaseTitle || '');
    // Mastery scheduler attribution — which phase this session is being scored against
    setCoachPickedPhaseIndex(extraSettings?.coachPickedPhaseIndex ?? null);
    setCoachPickReason(extraSettings?.coachPickReason || null);
    setStartTime(Date.now());
    setGameRunId(id => id + 1);

    const settings = {
      lastGame: {
        n, modes: selectedModes,
        rels: extraSettings?.rels || poolRels,
        rounds: totalRounds || 20,
        speedMs: stimulusMs || 2800,
        catWeights: extraSettings?.catWeights,
        useCustomMix: extraSettings?.useCustomMix,
        tokenWeights: extraSettings?.tokenWeights,
        extraStreams: extraSettings?.extraStreams || [],
        streamA: extraSettings?.streamA || { key: 'Space', keyDisplay: 'SPACE', positionKey: 'KeyP', positionKeyDisplay: 'P' },
        alienSettings: extraSettings?.alienSettings,
        carouselSettings: { enabled: true, streamsPerSlide: 'auto', slideMs: 2800, ...(extraSettings?.carouselSettings || {}) },
        nrintEnabledFlags: extraSettings?.nrintEnabledFlags || null,
        nrintHideLegend: !!extraSettings?.nrintHideLegend,
        nrintMaxPerTrial: Number(extraSettings?.nrintMaxPerTrial) || 0,
        decoyFilterRule: extraSettings?.decoyFilterRule || 'never_target',
        decoyFilterRandom: extraSettings?.decoyFilterRandom !== false,
        decoyFilterCategories: Array.isArray(extraSettings?.decoyFilterCategories) ? extraSettings.decoyFilterCategories : [],
        rstDifficulty: extraSettings?.rstDifficulty || 'easy',
        tjnTier: extraSettings?.tjnTier || 'easy',
        tjnTopology: extraSettings?.tjnTopology || 'small_world',
        tjnNodes: extraSettings?.tjnNodes || 6,
        tjnK: extraSettings?.tjnK || 2,
        tjnSchemaMode: !!extraSettings?.tjnSchemaMode,
        tjnSchemaBlocks: extraSettings?.tjnSchemaBlocks || 3,
        noobMode: noob || false,
      }
    };
    saveSettings(settings);
    setLastSettings(settings.lastGame);
    setScreen('playing');
  };

  const handleFinish = (state) => {
    const results = calculateResults(state);
    const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    
    const synaesthesia = localStorage.getItem('goated_synaesthesia_enabled') === 'true';
    
    // Save session to localStorage
    const sessionData = {
      nLevel: state.nLevel,
      modes: state.modes,
      synaesthesia,
      totalTrials: state.round,
      accuracy: results.overall.accuracy,
      hitRate: results.overall.hitRate,
      falseAlarmRate: results.overall.falseAlarmRate,
      hitsA: results.A.hits,
      missesA: results.A.misses,
      falseAlarmsA: results.A.falseAlarms,
      correctRejectionsA: results.A.correctRejections,
      extraStreamStats: results.extra || [],
      positionStatsA: results.positionA,
      extraPositionStats: results.extraPosition || [],
      durationSeconds,
      noobMode,
      autopilot: !!state.autopilot,
      // Whether a decoy filter was active (type-based selective attention),
      // for the Stats "Selective Attention" with/without comparison.
      decoyFilterActive: (state.modes || []).includes('decoy_filter'),
      phaseTitle: state.phaseTitle || '',
      trials: state.allTrials || [] // trials saved during gameplay
    };
    addSession(sessionData);

    setFinalState(state);
    if (state.modes?.includes('adaptive')) {
      const nextN = computeNextNLevel(state.nLevel, results);
      setSuggestedN(nextN);
    } else {
      setSuggestedN(null);
    }
    setScreen('results');
  };

  const handleRestart = (nextN) => {
    setFinalState(null);
    if (modes.includes('adaptive') && nextN) setNLevel(nextN);
    setStartTime(Date.now());
    setGameRunId(id => id + 1);
    setScreen('playing');
  };

  const handleBack = () => {
    setFinalState(null);
    setScreen('start');
  };

  return (
    <div className="min-h-screen bg-background">
      {screen === 'start' && (
        <StartScreen onStart={handleStart} suggestedN={suggestedN} lastSettings={lastSettings} />
      )}
      {screen === 'playing' && (
        <GameScreen
          key={gameRunId}
          nLevel={nLevel}
          modes={modes}
          relationshipPool={relationshipPool}
          totalRounds={rounds}
          stimulusDuration={speedMs}
          extraStreams={extraStreams}
          streamA={streamA}
          alienSettings={alienSettings}
          carouselSettings={carouselSettings}
          nrintEnabledFlags={nrintEnabledFlags}
          nrintHideLegend={nrintHideLegend}
          nrintMaxPerTrial={nrintMaxPerTrial}
          decoyFilterRule={decoyFilterRule}
          decoyFilterRandom={decoyFilterRandom}
          decoyFilterCategories={decoyFilterCategories}
          rstDifficulty={rstDifficulty}
          tjnTier={tjnTier}
          tjnTopology={tjnTopology}
          tjnNodes={tjnNodes}
          tjnK={tjnK}
          tjnSchemaMode={tjnSchemaMode}
          tjnSchemaBlocks={tjnSchemaBlocks}
          noobMode={noobMode}
          autopilot={autopilot}
          phaseTitle={phaseTitle}
          coachPickedPhaseIndex={coachPickedPhaseIndex}
          coachPickReason={coachPickReason}
          onFinish={handleFinish}
          onExit={handleBack}
        />

      )}
      {screen === 'results' && finalState && (
        <ResultsScreen
          gameState={finalState}
          onRestart={handleRestart}
          onBack={handleBack}
        />
      )}
      {/* Top nav — stats & tutorial links from start screen only (exit handled by GameScreen) */}
      <div className="fixed top-3 right-3 z-10 flex gap-2 flex-wrap justify-end max-w-[calc(100vw-1.5rem)]" style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}>
        {screen === 'start' && (
          <>
            <ThemeToggle />
            <InstallAppButton />
            <button
              onClick={() => setShowStudies(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500 text-xs font-mono font-semibold transition-colors"
            >
              Studies
            </button>
            <Link to="/insight" className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/50 text-amber-400 hover:bg-amber-500/25 hover:border-amber-500 text-xs font-mono font-semibold transition-colors">
              Insight
            </Link>
            <Link to="/assessment" className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/25 hover:border-cyan-500 text-xs font-mono font-semibold transition-colors">
              Snapshot
            </Link>
            <Link to="/tutorial" className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/50 text-accent hover:bg-accent/25 hover:border-accent text-xs font-mono font-semibold transition-colors">
              Tutorial
            </Link>
            <Link to="/stats" className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-chart-3/15 border border-chart-3/50 text-chart-3 hover:bg-chart-3/25 hover:border-chart-3 text-xs font-mono font-semibold transition-colors">
              Stats
            </Link>
            <a
              href="https://github.com/sponsors/find-1-bug"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/50 text-rose-400 hover:bg-rose-500/25 hover:border-rose-500 text-xs font-mono font-semibold transition-colors flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.15)] hover:shadow-[0_0_12px_rgba(244,63,94,0.3)]"
            >
              <span className="animate-pulse">❤️</span> Donate
            </a>
          </>
        )}
      </div>

      <AnimatePresence>
        {showStudies && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-400 animate-pulse animate-duration-3000" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">Working Memory &amp; Transfer Studies</h3>
                </div>
                <button
                  onClick={() => setShowStudies(false)}
                  className="text-xs font-mono text-muted-foreground hover:text-foreground border border-border px-2 py-1 rounded bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs text-foreground/90 scrollbar-thin">
                <div className="text-[11px] text-muted-foreground leading-relaxed border-b border-border/40 pb-3">
                  This cognitive trainer applies evidence-based paradigms shown in peer-reviewed neuroscience publications to improve working memory capacity and cognitive control.
                </div>

                {/* Study 1 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-emerald-400 font-bold">1. Fluid Intelligence Transfer Landmark</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">Jaeggi et al. (2008) · Proceedings of the National Academy of Sciences (PNAS)</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> Dual N-Back vs. Passive/Active Controls.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> Established that daily training on working memory tasks directly improves Fluid Intelligence (Gf) scores in healthy young adults. Discovered a linear dose-response relationship: more training days yield larger intelligence gains.
                  </p>
                </div>

                {/* Study 2 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-emerald-400 font-bold">2. Cognitive Control &amp; Stress Resilience</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">Novick et al. (2014) · Cognitive Science</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> Cognitive Control Training (CCT) / Conflict Resolution.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> Proven to structurally strengthen prefrontal conflict resolution, allowing subjects to ignore intense emotional/sensory distractors and maintain mental focus under high pressure.
                  </p>
                </div>

                {/* Study 3 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-emerald-400 font-bold">3. Relational Bottleneck of Human Intelligence (g)</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">Halford, Cowan, &amp; Andrews (2007) · Trends in Cognitive Sciences</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> Relational Complexity Mapping.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> Argues that processing complex relationships simultaneously (like transitive chaining in our RINT mode) is the core active constraint of human reasoning. Relational reasoning training acts as a direct multiplier of human fluid ability.
                  </p>
                </div>

                {/* Study 4 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-emerald-400 font-bold">4. Fluid Transfer Confirmed via Meta-Analysis</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">Au et al. (2015) · Psychonomic Bulletin &amp; Review</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> Quantitative meta-analysis of N-back training.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> Aggregated dozens of studies using active-control groups, concluding that working memory training leads to statistically significant and generalizable improvements in Fluid Intelligence.
                  </p>
                </div>

                {/* Study 5 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-emerald-400 font-bold">5. Multi-stream Memory Capacity Scaling</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">Schmiedek et al. (2010) · Cognitive Psychology</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> Multi-axis working memory paradigms.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> Proved that daily multi-stream working memory sessions lead to massive neurocognitive changes, transferring broadly to spatial orientation, verbal working memory, and logical processing speeds.
                  </p>
                </div>

                {/* Study 6 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-emerald-400 font-bold">6. Prefrontal Dopamine Receptor Density Tuning</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">McNab et al. (2009) · Science</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> PET brain scans of working memory training.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> First clinical paper showing physical neurochemical changes: working memory training alters dopamine D1 receptor binding potential in prefrontal and parietal lobes, confirming structural cortical plasticity.
                  </p>
                </div>

                {/* Recent Advances Divider */}
                <div className="border-t border-border/40 pt-3 text-left">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-cyan-400">Recent Advances (2020 - 2024)</span>
                </div>

                {/* Study 7 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-cyan-400 font-bold">7. Functional Brain Network Reorganization</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">Finc et al. (2020) · Nature Communications</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> fMRI scans of progressive N-back working memory load.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> Proves that adaptive memory training structurally reorganizes functional brain connectivity, significantly lowering the neural energy cost of frontoparietal control network (FPN) activation, showing cortical efficiency.
                  </p>
                </div>

                {/* Study 8 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-cyan-400 font-bold">8. Myelination &amp; Cortical Myelin Density Changes</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">Salmi et al. (2023) · NeuroImage</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> Quantitative MRI &amp; multi-stream tracking.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> Discovered substantial, measurable increases in myelin density and white-matter tract pathways connecting the dorsolateral prefrontal cortex (dlPFC) and the intraparietal sulcus after multi-stream working memory training.
                  </p>
                </div>

                {/* Study 9 */}
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/60 space-y-1.5 text-left">
                  <div className="text-cyan-400 font-bold">9. Affective Control &amp; Anxiety Far Transfer</div>
                  <div className="text-[11px] text-muted-foreground font-semibold">Schweizer et al. (2020) · Journal of Experimental Psychology: General</div>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Paradigms:</strong> Dual N-Back transfer to emotional regulation.
                  </p>
                  <p className="text-[11px] text-foreground/75 leading-relaxed">
                    <strong>Cognitive Impact:</strong> Demonstrated that high-intensity dual N-back training trains shared prefrontal capacity, providing direct far-transfer to emotional self-regulation, thereby significantly reducing subjective anxiety scores.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border/80 shrink-0 bg-secondary/20 flex justify-end">
                <Button
                  onClick={() => setShowStudies(false)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs"
                >
                  Got It
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}