import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Brain, Clock, BarChart3, Play } from 'lucide-react';
import { buildForm, SUBTEST_LABELS } from '@/lib/assessmentItems';
import { scoreForm, indexBand, RI_CAVEAT } from '@/lib/assessmentScoring';
import { getAssessments, addAssessment } from '@/lib/localStorageManager';
import CellCanvas from '@/components/assessment/CellCanvas';

const FORM_META = {
  A: { label: 'Baseline', sub: 'Form A — take before training', tag: 'baseline' },
  B: { label: 'Follow-up', sub: 'Form B — take after a training block', tag: 'followup' },
};

export default function Assessment() {
  const [phase, setPhase] = React.useState('pick'); // 'pick' | 'run' | 'done'
  const [form, setForm] = React.useState('A');
  const [battery, setBattery] = React.useState(null);
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [remainingMs, setRemainingMs] = React.useState(0);
  const [result, setResult] = React.useState(null);
  const [history, setHistory] = React.useState(() => getAssessments());
  const startRef = React.useRef(0);
  const tickRef = React.useRef(null);

  const items = battery?.items || [];
  const item = items[idx];

  const finish = React.useCallback((finalAnswers) => {
    if (tickRef.current) clearInterval(tickRef.current);
    const scored = scoreForm(finalAnswers, items);
    const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
    const meta = FORM_META[form];
    const rec = addAssessment({
      form,
      benchmark: meta.tag,
      rawScore: scored.rawScore,
      total: scored.total,
      reasoningIndex: scored.reasoningIndex,
      accuracy: scored.accuracy,
      subScores: scored.subScores,
      durationSeconds,
    });
    setHistory(getAssessments());
    setResult({ ...scored, record: rec });
    setPhase('done');
  }, [items, form]);

  const advance = React.useCallback((choiceIndex) => {
    setAnswers(prev => {
      const next = [...prev];
      next[idx] = choiceIndex;
      if (idx + 1 >= items.length) {
        finish(next);
      } else {
        setIdx(idx + 1);
      }
      return next;
    });
  }, [idx, items.length, finish]);

  // Per-item countdown.
  React.useEffect(() => {
    if (phase !== 'run' || !item) return;
    const dur = item.timeMs || 25000;
    const itemStart = Date.now();
    setRemainingMs(dur);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const left = dur - (Date.now() - itemStart);
      if (left <= 0) {
        clearInterval(tickRef.current);
        setRemainingMs(0);
        advance(null); // timed out → incorrect
      } else {
        setRemainingMs(left);
      }
    }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase, idx, item, advance]);

  const startForm = (f) => {
    const seed = (Date.now() & 0x7fffffff) >>> 0;
    const built = buildForm(f, seed);
    setForm(f);
    setBattery(built);
    setIdx(0);
    setAnswers([]);
    setResult(null);
    startRef.current = Date.now();
    setPhase('run');
  };

  const lastBaseline = [...history].reverse().find(a => a.benchmark === 'baseline');
  const lastFollowup = [...history].reverse().find(a => a.benchmark === 'followup');
  const delta = (lastFollowup && lastBaseline) ? lastFollowup.reasoningIndex - lastBaseline.reasoningIndex : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background p-3 sm:p-6" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-lg sm:text-xl font-mono font-bold text-foreground tracking-tight">Reasoning Snapshot</h1>
              <p className="text-[10px] font-mono text-muted-foreground">Pre/post fluid-reasoning measure · untrained formats</p>
            </div>
          </div>
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground text-xs font-mono font-semibold transition-colors flex items-center gap-1.5">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        {/* PICK */}
        {phase === 'pick' && (
          <div className="space-y-5">
            <div className="rounded-xl bg-secondary/20 border border-border p-4 font-mono text-[12px] leading-relaxed text-muted-foreground space-y-2">
              <p>A 12-item reasoning check (matrices + number/letter series) — formats the training deliberately never uses, so a gain reflects <strong className="text-cyan-300">transfer</strong>, not practice on the game.</p>
              <p>Take <strong className="text-cyan-300">Baseline (Form A)</strong> before a training block, then <strong className="text-cyan-300">Follow-up (Form B)</strong> after. Form B uses different items, so there's nothing to memorize.</p>
              <p className="text-[11px] text-amber-400/80 border-t border-border/40 pt-2">{RI_CAVEAT}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['A', 'B'].map(f => {
                const meta = FORM_META[f];
                const last = f === 'A' ? lastBaseline : lastFollowup;
                return (
                  <button key={f} onClick={() => startForm(f)}
                    className="rounded-xl bg-secondary/30 border border-border hover:border-cyan-400/60 p-4 text-left transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-bold text-foreground">{meta.label}</span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Form {f}</span>
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground">{meta.sub}</p>
                    <div className="flex items-center gap-2 text-[11px] font-mono pt-1">
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-cyan-300">Start</span>
                      {last && <span className="text-muted-foreground/70 ml-auto">last: {last.reasoningIndex}</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Trajectory + delta */}
            {history.length > 0 && (
              <div className="rounded-xl bg-secondary/20 border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Your Reasoning Index over time</h3>
                </div>
                <Trajectory history={history} />
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <Metric label="Latest baseline" value={lastBaseline?.reasoningIndex ?? '—'} />
                  <Metric label="Latest follow-up" value={lastFollowup?.reasoningIndex ?? '—'} />
                  <Metric label="Δ (transfer)" value={delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}`} highlight={delta != null} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* RUN */}
        {phase === 'run' && item && (
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-muted-foreground">{idx + 1} / {items.length} · <span className="text-cyan-400">{SUBTEST_LABELS[item.subtest]}</span></span>
              <span className="flex items-center gap-1.5 text-amber-400"><Clock className="w-3.5 h-3.5" /> {Math.ceil(remainingMs / 1000)}s</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 transition-[width] duration-100" style={{ width: `${(remainingMs / (item.timeMs || 25000)) * 100}%` }} />
            </div>

            {item.subtest === 'matrix' ? (
              <MatrixItem item={item} onAnswer={advance} />
            ) : (
              <SeriesItem item={item} onAnswer={advance} />
            )}
            <p className="text-center text-[10px] font-mono text-muted-foreground/50">Pick the best answer. No going back — skipped or timed-out counts as incorrect.</p>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && result && (
          <div className="space-y-5">
            <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/30 p-5 text-center space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">{FORM_META[form].label} · Form {form}</p>
              <div className="text-5xl font-mono font-bold text-foreground">{result.reasoningIndex}</div>
              <p className={`text-xs font-mono font-semibold ${indexBand(result.reasoningIndex).color}`}>{indexBand(result.reasoningIndex).label} · Reasoning Index (approx)</p>
              <p className="text-[11px] font-mono text-muted-foreground">{result.rawScore} / {result.total} correct · {result.accuracy}%</p>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              {Object.entries(result.subScores).map(([k, v]) => (
                <Metric key={k} label={SUBTEST_LABELS[k]} value={`${v.correct}/${v.total}`} />
              ))}
            </div>

            {delta != null && (
              <div className="rounded-lg bg-secondary/30 border border-border p-3 text-center font-mono">
                <span className="text-[11px] text-muted-foreground">Baseline {lastBaseline.reasoningIndex} → Follow-up {lastFollowup.reasoningIndex} · </span>
                <span className={`text-sm font-bold ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-foreground'}`}>{delta > 0 ? '+' : ''}{delta}</span>
              </div>
            )}

            {history.length > 1 && (
              <div className="rounded-xl bg-secondary/20 border border-border p-4 space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Trajectory</h3>
                <Trajectory history={history} />
              </div>
            )}

            <p className="text-[11px] font-mono text-amber-400/80 leading-relaxed">{RI_CAVEAT}</p>

            <div className="flex gap-3">
              <button onClick={() => setPhase('pick')} className="flex-1 h-11 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm font-semibold transition-colors">Done</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border p-2">
      <div className={`text-lg font-bold ${highlight ? 'text-cyan-400' : 'text-foreground'}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function MatrixItem({ item, onAnswer }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-secondary/20 border border-border">
          {item.grid.flatMap((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} className="rounded-lg bg-background/40 border border-border/60 flex items-center justify-center" style={{ width: 84, height: 84 }}>
              <CellCanvas cell={cell} size={80} empty={!cell && !(r === 2 && c === 2)} question={r === 2 && c === 2} />
            </div>
          )))}
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-xl mx-auto">
        {item.options.map((opt, i) => (
          <button key={i} onClick={() => onAnswer(i)}
            className="rounded-lg bg-secondary/40 border border-border hover:border-cyan-400 hover:bg-secondary/70 flex items-center justify-center p-1 transition-colors aspect-square">
            <CellCanvas cell={opt} size={70} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SeriesItem({ item, onAnswer }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-secondary/20 border border-border p-8 text-center">
        <div className="text-2xl sm:text-3xl font-mono font-bold text-foreground tracking-wider">{item.prompt}</div>
      </div>
      <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
        {item.options.map((opt, i) => (
          <button key={i} onClick={() => onAnswer(i)}
            className="h-14 rounded-lg bg-secondary/40 border border-border hover:border-cyan-400 hover:bg-secondary/70 font-mono text-lg font-bold text-foreground transition-colors">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// Compact SVG sparkline of reasoningIndex over assessments, baseline vs follow-up coloured.
function Trajectory({ history }) {
  const W = 520, H = 120, pad = 16;
  const pts = history.map((a, i) => ({
    x: pad + (history.length === 1 ? (W - pad * 2) / 2 : (i / (history.length - 1)) * (W - pad * 2)),
    y: H - pad - ((Math.max(40, Math.min(160, a.reasoningIndex)) - 40) / 120) * (H - pad * 2),
    a,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[40, 70, 100, 130, 160].map(v => {
        const y = H - pad - ((v - 40) / 120) * (H - pad * 2);
        return (<g key={v}>
          <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
          <text x={2} y={y + 3} className="fill-muted-foreground" style={{ fontSize: 8, fontFamily: 'monospace' }}>{v}</text>
        </g>);
      })}
      {pts.length > 1 && <path d={path} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4"
          fill={p.a.benchmark === 'followup' ? '#34d399' : '#22d3ee'}
          stroke="#0b1220" strokeWidth="1.5" />
      ))}
    </svg>
  );
}
