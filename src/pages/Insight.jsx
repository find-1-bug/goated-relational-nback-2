import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Check, X, RotateCcw, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCanvas from '@/components/game/GameCanvas';
import { generateInsightPuzzle } from '@/lib/insightGenerator';
import { Button } from '@/components/ui/button';

// localStorage key for cumulative insight stats — non-blocking, just a counter
const INSIGHT_STATS_KEY = 'goated_insight_stats_v1';

function loadStats() {
  try {
    const raw = localStorage.getItem(INSIGHT_STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { totalSolved: 0, totalAttempted: 0, streak: 0, bestStreak: 0, byType: {} };
}

function saveStats(stats) {
  try { localStorage.setItem(INSIGHT_STATS_KEY, JSON.stringify(stats)); } catch { /* ignore */ }
}

// Small panel that renders a single relation via the existing GameCanvas
function PuzzlePanel({ panel, onClick, state, label }) {
  // state: 'idle' | 'selected_correct' | 'selected_wrong' | 'revealed_correct'
  const border = state === 'selected_correct' || state === 'revealed_correct'
    ? 'border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)]'
    : state === 'selected_wrong'
      ? 'border-red-400 shadow-[0_0_24px_rgba(248,113,113,0.4)]'
      : 'border-border hover:border-primary/60';
  return (
    <button
      onClick={onClick}
      disabled={state !== 'idle' && !onClick}
      className={`relative rounded-xl border-2 bg-secondary/30 overflow-hidden aspect-square transition-all duration-150 ${border} ${onClick && state === 'idle' ? 'cursor-pointer hover:bg-secondary/50' : 'cursor-default'}`}
    >
      {label && (
        <span className="absolute top-2 left-2 z-10 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">{label}</span>
      )}
      <div className="absolute inset-0">
        <GameCanvas relationship={panel.relation} stimulus={panel.stimulus} clearCanvas={false} streamCount={1} />
      </div>
      {state === 'selected_correct' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Check className="w-12 h-12 text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" strokeWidth={3} />
        </div>
      )}
      {state === 'selected_wrong' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <X className="w-12 h-12 text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]" strokeWidth={3} />
        </div>
      )}
      {state === 'revealed_correct' && (
        <div className="absolute bottom-1 left-1 right-1 text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-widest bg-background/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-center">
          ✓ correct answer
        </div>
      )}
    </button>
  );
}

export default function Insight() {
  const [puzzle, setPuzzle] = useState(() => generateInsightPuzzle());
  const [selectedId, setSelectedId] = useState(null);
  const [resolved, setResolved] = useState(false); // true after a guess is locked in
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState(loadStats);
  const [startTime, setStartTime] = useState(() => Date.now());
  const containerRef = useRef(null);

  // Persist stats whenever they change
  useEffect(() => { saveStats(stats); }, [stats]);

  const nextPuzzle = useCallback(() => {
    setPuzzle(generateInsightPuzzle());
    setSelectedId(null);
    setResolved(false);
    setShowHint(false);
    setStartTime(Date.now());
  }, []);

  const handleSelect = useCallback((id) => {
    if (resolved || !puzzle) return;
    setSelectedId(id);
    setResolved(true);
    const correctId = puzzle.type === 'odd_one_out' ? puzzle.correctId : puzzle.candidates[puzzle.correctIndex].id;
    const isCorrect = id === correctId;
    const rt = Date.now() - startTime;
    setStats(prev => {
      const byType = { ...(prev.byType || {}) };
      const tStat = byType[puzzle.type] || { solved: 0, attempted: 0 };
      tStat.attempted += 1;
      if (isCorrect) tStat.solved += 1;
      byType[puzzle.type] = tStat;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        totalSolved: prev.totalSolved + (isCorrect ? 1 : 0),
        totalAttempted: prev.totalAttempted + 1,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak || 0, newStreak),
        byType,
        lastRtMs: rt,
      };
    });
  }, [resolved, puzzle, startTime]);

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-sm font-mono text-muted-foreground">No puzzle available.</p>
      </div>
    );
  }

  const correctId = puzzle.type === 'odd_one_out'
    ? puzzle.correctId
    : puzzle.candidates[puzzle.correctIndex].id;

  const panelState = (id) => {
    if (!resolved) return 'idle';
    if (id === selectedId && id === correctId) return 'selected_correct';
    if (id === selectedId && id !== correctId) return 'selected_wrong';
    if (id === correctId) return 'revealed_correct';
    return 'idle';
  };

  const accuracy = stats.totalAttempted > 0
    ? Math.round((stats.totalSolved / stats.totalAttempted) * 100)
    : 0;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-3 sm:p-6"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-amber-400 animate-pulse" />
            <div>
              <h1 className="text-lg sm:text-xl font-mono font-bold text-foreground tracking-tight">Insight Mode</h1>
              <p className="text-[10px] font-mono text-muted-foreground">Pure relational inference · no working-memory load</p>
            </div>
          </div>
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground text-xs font-mono font-semibold transition-colors flex items-center gap-1.5">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-2 text-center font-mono">
          {[
            { label: 'Streak', value: stats.streak, color: 'text-amber-400' },
            { label: 'Best', value: stats.bestStreak, color: 'text-emerald-400' },
            { label: 'Solved', value: `${stats.totalSolved}/${stats.totalAttempted}`, color: 'text-primary' },
            { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 75 ? 'text-emerald-400' : accuracy >= 50 ? 'text-amber-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-secondary/30 border border-border rounded-lg p-2">
              <div className={`text-base sm:text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Prompt */}
        <div className="text-center">
          <p className="text-xs sm:text-sm font-mono text-foreground/90 px-2">{puzzle.prompt}</p>
        </div>

        {/* Puzzle body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={puzzle.type + (puzzle.sharedClass || '') + (resolved ? '-resolved' : '-fresh')}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {puzzle.type === 'odd_one_out' && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
                {puzzle.panels.map(p => (
                  <PuzzlePanel
                    key={p.id}
                    panel={p}
                    state={panelState(p.id)}
                    onClick={resolved ? null : () => handleSelect(p.id)}
                  />
                ))}
              </div>
            )}

            {puzzle.type === 'analogy_completion' && (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center mb-2">The three shown</div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {puzzle.shown.map((p, i) => (
                      <PuzzlePanel key={p.id} panel={p} state="idle" onClick={null} label={`#${i + 1}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300 text-center mb-2">Pick the candidate that belongs</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {puzzle.candidates.map((p, i) => (
                      <PuzzlePanel
                        key={p.id}
                        panel={p}
                        state={panelState(p.id)}
                        onClick={resolved ? null : () => handleSelect(p.id)}
                        label={`${String.fromCharCode(65 + i)}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Hint + Next */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {!resolved ? (
            <Button
              variant="outline"
              onClick={() => setShowHint(v => !v)}
              className="font-mono text-xs gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5" /> {showHint ? 'Hide hint' : 'Show hint'}
            </Button>
          ) : (
            <div className="text-xs font-mono">
              {selectedId === correctId ? (
                <span className="text-emerald-400 font-bold">✓ Correct — {puzzle.sharedClass.replace(/_/g, ' ')}</span>
              ) : (
                <span className="text-red-400 font-bold">✗ Wrong — answer was {puzzle.sharedClass.replace(/_/g, ' ')}</span>
              )}
            </div>
          )}
          <Button
            onClick={nextPuzzle}
            className="font-mono text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {resolved ? 'Next puzzle' : 'Skip'}
          </Button>
        </div>

        {showHint && !resolved && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/40 p-3 text-xs font-mono text-amber-200">
            💡 {puzzle.hint}
          </div>
        )}

        {/* Foot note */}
        <div className="text-center text-[10px] font-mono text-muted-foreground/60 pt-4 border-t border-border/30 max-w-lg mx-auto leading-relaxed">
          Insight Mode trains relational <strong>inference</strong> in isolation — no n-back chain, no time pressure. The form-class taxonomy is built into the app's relation library; each puzzle is freshly generated from it. <Link to="/tutorial" className="underline hover:text-foreground">Form-class reference</Link>.
        </div>
      </div>
    </motion.div>
  );
}
