import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, Download, Upload, Trash2, Eye, TrendingUp, Zap, Activity, Award, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSessions, deleteSession, exportData, importData } from '@/lib/localStorageManager';
import { COACH_PHASES } from '@/lib/gameConstants';
import { migrateCoachState } from '@/lib/coachMastery';

export default function Stats() {
  const [sessions, setSessions] = useState([]);
  const [importError, setImportError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'coach', 'stressors'
  const [chartSessionsCount, setChartSessionsCount] = useState(15);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [coachState, setCoachState] = useState({ phaseIndex: 0, rankName: 'Initiate' });

  useEffect(() => {
    setSessions(getSessions());
    // Recover coach state
    try {
      const saved = localStorage.getItem('goated_coach_state');
      const parsed = saved ? JSON.parse(saved) : {};
      setCoachState(migrateCoachState(parsed));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nback-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importData(data);
      setSessions(getSessions());
    } catch (err) {
      setImportError('Failed to import data. Invalid file format.');
    }
  };

  const handleDelete = (sessionId) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    deleteSession(sessionId);
    setSessions(getSessions());
  };

  // Base metrics
  const totalSessions = sessions.length;
  const avgAccuracy = totalSessions > 0 ? Math.round(sessions.reduce((s, x) => s + (x.accuracy || 0), 0) / totalSessions) : 0;
  const totalTrials = sessions.reduce((s, x) => s + (x.totalTrials || 0), 0);
  const highestAccuracy = totalSessions > 0 ? Math.max(...sessions.map(s => s.accuracy || 0)) : 0;

  // Breakdown by N-level
  const nLevels = [...new Set(sessions.map(s => s.nLevel))].sort((a, b) => a - b);
  const nStats = nLevels.map(n => {
    const filtered = sessions.filter(s => s.nLevel === n);
    const avg = Math.round(filtered.reduce((s, x) => s + (x.accuracy || 0), 0) / filtered.length);
    return { nLevel: n, count: filtered.length, avgAccuracy: avg };
  });

  // Autopilot specific sessions
  const autopilotSessions = sessions.filter(s => s.autopilot);
  const manualSessions = sessions.filter(s => !s.autopilot);
  const autopilotAvgAccuracy = autopilotSessions.length > 0
    ? Math.round(autopilotSessions.reduce((s, x) => s + (x.accuracy || 0), 0) / autopilotSessions.length)
    : 0;

  // Stressors/Modes Performance Analysis
  const modeStats = [];
  const uniqueModes = [...new Set(sessions.flatMap(s => s.modes || []))];
  uniqueModes.forEach(modeId => {
    const matching = sessions.filter(s => s.modes?.includes(modeId));
    if (matching.length > 0) {
      const avg = Math.round(matching.reduce((s, x) => s + (x.accuracy || 0), 0) / matching.length);
      modeStats.push({ id: modeId, count: matching.length, avgAccuracy: avg });
    }
  });
  modeStats.sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  // Synaesthesia analytics
  const synaesthesiaSessions = sessions.filter(s => s.synaesthesia);
  const synaesthesiaCount = synaesthesiaSessions.length;
  const synaesthesiaAvgAccuracy = synaesthesiaCount > 0
    ? Math.round(synaesthesiaSessions.reduce((s, x) => s + (x.accuracy || 0), 0) / synaesthesiaCount)
    : 0;

  // SVG Trend Line Chart Configuration
  const trendSessions = [...sessions]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-chartSessionsCount);

  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 30;
  const paddingY = 20;

  let svgPath = '';
  let fillPath = '';
  const points = [];

  if (trendSessions.length > 1) {
    trendSessions.forEach((s, idx) => {
      const x = paddingX + (idx / (trendSessions.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((s.accuracy || 0) / 100) * (chartHeight - paddingY * 2);
      points.push({ x, y, session: s, index: idx });
    });

    // Build line path
    svgPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      svgPath += ` L ${points[i].x} ${points[i].y}`;
    }

    // Build area fill path
    fillPath = `${svgPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background py-6 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary animate-pulse" />
            <div>
              <h1 className="text-xl sm:text-2xl font-mono font-bold text-foreground tracking-tight">Neuro-Analytics Dashboard</h1>
              <p className="text-[10px] font-mono text-muted-foreground">Quantified memory optimization &amp; transfer tracking</p>
            </div>
          </div>
          <Link to="/" className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground text-xs font-mono font-semibold transition-colors">
            Dashboard
          </Link>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex bg-secondary/30 border border-border/80 rounded-xl p-1 shrink-0 font-mono text-xs gap-1">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: Activity },
            { id: 'coach', label: 'Coach Autopilot', icon: Zap },
            { id: 'stressors', label: 'Stressor Analytics', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors font-semibold ${active ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* TAB A: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
              {[
                { label: 'Total Sessions', value: totalSessions, sub: `${autopilotSessions.length} autopilot`, color: 'text-primary' },
                { label: 'Average Accuracy', value: `${avgAccuracy}%`, sub: `Overall performance`, color: 'text-emerald-400' },
                { label: 'Peak Accuracy', value: `${highestAccuracy}%`, sub: 'Record session', color: 'text-accent' },
                { label: 'Total Trials', value: totalTrials, sub: 'Active repetitions', color: 'text-cyan-400' }
              ].map((stat, i) => (
                <div key={i} className="rounded-xl bg-secondary/35 border border-border/80 p-4 text-center shadow-inner relative overflow-hidden">
                  <div className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[11px] font-mono text-foreground font-semibold mt-1">{stat.label}</div>
                  <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Performance Trend Chart */}
            <div className="rounded-xl bg-secondary/35 border border-border/80 p-4 shadow-lg flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-4 shrink-0 font-mono">
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Chronological Accuracy Trend</h3>
                  <p className="text-[10px] text-muted-foreground">Demonstrating progression over recent trials</p>
                </div>
                <div className="flex border border-border rounded overflow-hidden text-[9px] font-semibold">
                  {[10, 15, 30].map(cnt => (
                    <button
                      key={cnt}
                      onClick={() => setChartSessionsCount(cnt)}
                      className={`px-2 py-1 transition-colors ${chartSessionsCount === cnt ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary/40 text-muted-foreground'}`}
                    >
                      {cnt} runs
                    </button>
                  ))}
                </div>
              </div>

              {trendSessions.length < 2 ? (
                <div className="h-40 rounded-lg border border-dashed border-border flex items-center justify-center shrink-0 font-mono text-xs text-muted-foreground">
                  Play at least 2 sessions to plot neural progression trend lines.
                </div>
              ) : (
                <div className="relative shrink-0 select-none bg-background/20 rounded-lg p-2 border border-border/40">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis guide lines */}
                    {[25, 50, 75, 100].map(lvl => {
                      const y = chartHeight - paddingY - (lvl / 100) * (chartHeight - paddingY * 2);
                      return (
                        <g key={lvl} className="opacity-20">
                          <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                          <text x={paddingX - 5} y={y + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[8px] font-semibold">{lvl}%</text>
                        </g>
                      );
                    })}

                    {/* Area fill */}
                    <path d={fillPath} fill="url(#chartGradient)" />

                    {/* Line path */}
                    <path d={svgPath} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Interaction Points */}
                    {points.map(pt => (
                      <circle
                        key={pt.index}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.index === pt.index ? 6 : 4}
                        className={`transition-all duration-150 cursor-pointer ${hoveredPoint?.index === pt.index ? 'fill-accent' : 'fill-primary'} stroke-background stroke-2`}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </svg>

                  {/* Interactive Chart Tooltip */}
                  <AnimatePresence>
                    {hoveredPoint && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-2 left-1/2 -translate-x-1/2 bg-card border border-border/90 px-3 py-1.5 rounded-lg shadow-xl font-mono text-[10px] space-y-0.5 text-center pointer-events-none"
                      >
                        <div className="font-bold text-foreground">
                          Accuracy: <span className="text-emerald-400">{hoveredPoint.session.accuracy}%</span>
                        </div>
                        <div className="text-muted-foreground font-medium">
                          N={hoveredPoint.session.nLevel} · {hoveredPoint.session.totalTrials} trials
                        </div>
                        <div className="text-[8px] text-muted-foreground/80">
                          {new Date(hoveredPoint.session.created_date).toLocaleDateString()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB B: COACH AUTOPILOT */}
        {activeTab === 'coach' && (
          <div className="space-y-6">
            {/* Coach Rank Status Banner */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 p-5 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shrink-0">
              <div className="p-3 bg-secondary/50 rounded-full border border-border flex items-center justify-center shrink-0">
                <Award className="w-10 h-10 text-emerald-400 animate-bounce" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-400">Current Coach Auto-Curriculum Rank</div>
                <h3 className="text-lg font-mono font-bold text-foreground">Level {coachState.phaseIndex + 1}: {COACH_PHASES[coachState.phaseIndex]?.title || 'Initiate'}</h3>
                <p className="text-[11px] font-mono text-muted-foreground leading-relaxed max-w-lg">
                  {COACH_PHASES[coachState.phaseIndex]?.desc || 'Start Coach Autopilot training to elevate cognitive baseline parameters.'}
                </p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-secondary/80 border border-border text-center shrink-0 font-mono">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Autopilot Runs</div>
                <div className="text-lg font-bold text-primary mt-0.5">{autopilotSessions.length}</div>
              </div>
            </div>

            {/* Curriculum ladder progress */}
            <div className="rounded-xl bg-secondary/35 border border-border/80 p-4 shadow-inner space-y-3 shrink-0">
              <div className="flex items-center justify-between font-mono text-xs font-bold text-foreground border-b border-border/40 pb-2">
                <span>STAGE BASICS PROGRESSION</span>
                <span className="text-cyan-400">{Math.round(((coachState.phaseIndex + 1) / COACH_PHASES.length) * 100)}% COMPLETE</span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {Array.from({ length: COACH_PHASES.length }).map((_, idx) => {
                  // Color by MASTERY LEVEL (0–5) instead of binary
                  // before/at/after. Pre-frontier untouched phases stay grey;
                  // frontier highlighted; mastery levels fade through cyan→
                  // emerald→gold; phases due for review get a violet ring.
                  const m = coachState.phaseMastery?.[idx];
                  const isCurrent = (coachState.phaseIndex || 0) === idx;
                  const lvl = m?.masteryLevel || 0;
                  const sessionN = coachState.sessionCount || 0;
                  const reviewDue = m && m.masteryLevel >= 2 && (m.nextReviewN || 0) <= sessionN;

                  let color;
                  if (!m || m.attempts === 0) {
                    color = 'bg-secondary/40 border-border/50 text-muted-foreground';
                  } else if (lvl === 0) {
                    color = 'bg-red-500/20 border-red-400/50 text-red-300';
                  } else if (lvl === 1) {
                    color = 'bg-amber-500/20 border-amber-400/50 text-amber-300';
                  } else if (lvl === 2) {
                    color = 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300';
                  } else if (lvl === 3) {
                    color = 'bg-emerald-500/25 border-emerald-400/60 text-emerald-300';
                  } else { // 4–5 mastered
                    color = 'bg-yellow-500/30 border-yellow-400/70 text-yellow-200 font-bold';
                  }
                  if (isCurrent) color += ' ring-2 ring-accent/40';
                  if (reviewDue) color += ' ring-2 ring-violet-400/70';

                  const tip = `${COACH_PHASES[idx]?.title || ''}\n${m && m.attempts > 0 ? `Lvl ${lvl} · ${m.attempts} attempts · ${m.successes} successes` + (reviewDue ? ' · REVIEW DUE' : (m.nextReviewN ? ` · review in ${Math.max(0, m.nextReviewN - sessionN)}` : '')) : 'Not attempted'}`;

                  return (
                    <div
                      key={idx}
                      className={`py-2 text-center rounded border font-mono text-[10px] flex flex-col justify-center items-center h-10 transition-colors ${color}`}
                      title={tip}
                    >
                      <span className="font-semibold block">{idx + 1}</span>
                      <span className="text-[7px] font-medium block truncate max-w-full px-0.5">{m && m.attempts > 0 ? `L${lvl}` : `N=${COACH_PHASES[idx]?.nLevel || 2}`}</span>
                    </div>
                  );
                })}
              </div>
              {/* Mastery legend */}
              <div className="flex items-center gap-2 flex-wrap text-[9px] font-mono pt-2 border-t border-border/40">
                <span className="text-muted-foreground">Mastery:</span>
                <span className="px-1.5 py-0.5 rounded bg-secondary/40 border border-border/50 text-muted-foreground">none</span>
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-400/50 text-red-300">L0 fail</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300">L1</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">L2</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/60 text-emerald-300">L3</span>
                <span className="px-1.5 py-0.5 rounded bg-yellow-500/30 border border-yellow-400/70 text-yellow-200 font-bold">L4–5</span>
                <span className="px-1.5 py-0.5 rounded ring-1 ring-violet-400/70 text-violet-300">review due</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground/70">
                Sessions played: <strong className="text-foreground">{coachState.sessionCount || 0}</strong> · Frontier: Phase <strong className="text-primary">{(coachState.phaseIndex || 0) + 1}</strong> · Phases mastered (L≥2): <strong className="text-emerald-400">{Object.values(coachState.phaseMastery || {}).filter(m => m.masteryLevel >= 2).length}</strong>
              </div>
            </div>

            {/* Autopilot vs Manual performance split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-secondary/35 border border-border/80 p-4 shadow-lg space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Autopilot Sessions
                </h4>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Sessions Tracked</span>
                    <span className="font-bold text-foreground">{autopilotSessions.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Average Accuracy</span>
                    <span className="font-bold text-emerald-400">{autopilotAvgAccuracy}%</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span className="text-muted-foreground">Rank Progression Ratio</span>
                    <span className="font-bold text-foreground">
                      {autopilotSessions.filter(s => s.accuracy >= 75).length} Up / {autopilotSessions.filter(s => s.accuracy < 55).length} Down
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-secondary/35 border border-border/80 p-4 shadow-lg space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Manual Sessions
                </h4>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Sessions Tracked</span>
                    <span className="font-bold text-foreground">{manualSessions.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Average Accuracy</span>
                    <span className="font-bold text-cyan-400">
                      {manualSessions.length > 0 ? Math.round(manualSessions.reduce((s, x) => s + (x.accuracy || 0), 0) / manualSessions.length) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span className="text-muted-foreground">Average N-Level</span>
                    <span className="font-bold text-foreground">
                      {manualSessions.length > 0 ? (manualSessions.reduce((s, x) => s + x.nLevel, 0) / manualSessions.length).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB C: STRESSOR ANALYTICS */}
        {activeTab === 'stressors' && (
          <div className="space-y-6">
            {/* N-Level Accuracy Breakdown Bar Chart */}
            <div className="rounded-xl bg-secondary/35 border border-border/80 p-4 shadow-lg space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">N-Level Performance Breakdown</h3>
                <p className="text-[10px] font-mono text-muted-foreground">Accuracy averages relative to target memory capacity</p>
              </div>

              {nStats.length === 0 ? (
                <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                  No sessions on record to compute capacity metrics.
                </div>
              ) : (
                <div className="space-y-3 shrink-0 font-mono text-xs">
                  {nStats.map(stat => (
                    <div key={stat.nLevel} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-foreground">N={stat.nLevel} Training (capacity)</span>
                        <span className="text-primary font-bold">{stat.avgAccuracy}% accuracy <span className="text-[10px] text-muted-foreground font-normal">({stat.count} runs)</span></span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/30">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${stat.avgAccuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stressors Accuracy Comparison Panel */}
            <div className="rounded-xl bg-secondary/35 border border-border/80 p-4 shadow-lg space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Active Stressors Impact Profile</h3>
                <p className="text-[10px] font-mono text-muted-foreground">Mean accuracy under explicit difficulty combinations</p>
              </div>

              {modeStats.length === 0 ? (
                <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center font-mono text-xs text-muted-foreground">
                  Activate special enhancement modes in your baseline configs to view stressor performance.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 font-mono text-xs">
                  {modeStats.map(stat => (
                    <div key={stat.id} className="p-3 bg-secondary/35 border border-border/80 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground capitalize">{stat.id.replace(/_/g, ' ')}</span>
                        <span className="block text-[9px] text-muted-foreground font-medium">{stat.count} sessions completed</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${stat.avgAccuracy >= 75 ? 'text-emerald-400' : stat.avgAccuracy >= 55 ? 'text-cyan-400' : 'text-red-400'}`}>
                          {stat.avgAccuracy}%
                        </span>
                        <span className="block text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">Avg Acc</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Synaesthesia Training Performance Card */}
            <div className="rounded-xl bg-gradient-to-br from-indigo-900/10 to-indigo-950/20 border border-indigo-500/20 p-4 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 animate-pulse" /> Synaesthesia training metrics
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground">Progression trends using custom grapheme-color mappings</p>
                </div>
                {synaesthesiaCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                    ACTIVE SESSIONS: {synaesthesiaCount}
                  </span>
                )}
              </div>

              {synaesthesiaCount === 0 ? (
                <div className="h-24 rounded-lg border border-dashed border-indigo-500/20 flex items-center justify-center font-mono text-xs text-muted-foreground/60 text-center px-4">
                  Launch a session with Synaesthesia Mode toggled on to capture your character-color associative working memory charts here!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 font-mono text-xs">
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-300">Synaesthesia Memory Accuracy</span>
                      <span className="block text-[9px] text-muted-foreground font-medium">Mean target detection correctness</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${synaesthesiaAvgAccuracy >= 75 ? 'text-emerald-400' : synaesthesiaAvgAccuracy >= 55 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {synaesthesiaAvgAccuracy}%
                      </span>
                      <span className="block text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">Avg Acc</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-300">Associated Grapheme Capacity</span>
                      <span className="block text-[9px] text-muted-foreground font-medium">Derived fluid retention rating</span>
                    </div>
                    <div className="text-right font-mono font-bold text-indigo-300 text-sm">
                      {synaesthesiaAvgAccuracy >= 85 ? 'ELITE' : synaesthesiaAvgAccuracy >= 70 ? 'ADVANCED' : 'BUILDING'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export/Import Controls */}
        <div className="flex gap-2 flex-wrap shrink-0">
          <Button onClick={handleExport} className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 font-mono text-xs">
            <Download className="w-3.5 h-3.5" /> Export Data
          </Button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 cursor-pointer transition-colors font-mono text-xs font-semibold">
            <Upload className="w-3.5 h-3.5" /> Import Data
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {importError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-xs font-mono shrink-0">
            {importError}
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-3 shrink-0">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Detailed Session History</h2>

          {sessions.length === 0 ? (
            <div className="rounded-xl bg-secondary/35 border border-border/80 p-6 text-center">
              <p className="text-xs font-mono text-muted-foreground">No cognitive training sessions detected. Launch a training run to load analytics.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin">
              {[...sessions]
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .map((session, idx) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(10, idx) * 0.03 }}
                    className="rounded-lg bg-secondary/30 border border-border p-3.5 flex items-center justify-between gap-3 text-left hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5 flex-wrap">
                        <span>N={session.nLevel}</span>
                        {session.autopilot ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Zap className="w-2 h-2 animate-pulse" /> {session.phaseTitle || 'Autopilot'}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-[8px] font-bold text-cyan-400">
                            Manual
                          </span>
                        )}
                        {session.noobMode && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[8px] font-bold text-amber-400">
                            NOOB
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>{new Date(session.created_date).toLocaleString()}</span>
                        <span>·</span>
                        <span>{session.totalTrials} trials</span>
                        {session.modes && session.modes.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-primary truncate max-w-[200px]" title={session.modes.join(', ')}>
                              {session.modes.map(m => m.replace(/_/g, ' ')).join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                      {/* RST family micro-row — only if this session had any
                          RST trials with a recorded family. Each chip shows
                          accuracy% on that family. Helps spot whether Hard
                          (Analogy) accuracy lags Easy (Distinction). */}
                      {(() => {
                        const trials = session.trials || [];
                        const rstTrials = trials.filter(t => t.responseType === 'rst');
                        if (rstTrials.length === 0) return null;
                        const families = { distinction: { c: 0, t: 0 }, comparison: { c: 0, t: 0 }, analogy: { c: 0, t: 0 } };
                        rstTrials.forEach(t => {
                          const fam = t.rst?.family || 'distinction';
                          if (!families[fam]) return;
                          families[fam].t++;
                          if (t.correct) families[fam].c++;
                        });
                        const chips = Object.entries(families).filter(([, v]) => v.t > 0);
                        if (chips.length === 0) return null;
                        const famLabel = { distinction: 'DIST', comparison: 'COMP', analogy: 'ANLG' };
                        return (
                          <div className="text-[10px] font-mono text-violet-300/80 flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-violet-400/60 uppercase">RST</span>
                            {chips.map(([fam, v]) => {
                              const acc = Math.round((v.c / v.t) * 100);
                              const cls = acc >= 75 ? 'text-emerald-400' : acc >= 50 ? 'text-amber-400' : 'text-red-400';
                              return (
                                <span key={fam} className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/30">
                                  {famLabel[fam]}: <span className={cls + ' font-bold'}>{acc}%</span> <span className="text-muted-foreground/60">({v.t})</span>
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-base font-mono font-bold ${session.accuracy >= 75 ? 'text-emerald-400' : session.accuracy >= 55 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {session.accuracy}%
                      </div>
                      <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Acc</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Link to={`/review/${session.id}`}>
                        <button className="w-7 h-7 rounded bg-secondary/80 border border-border text-muted-foreground hover:text-primary transition-colors flex items-center justify-center" title="Review trials">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="w-7 h-7 rounded bg-secondary/80 border border-border text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}