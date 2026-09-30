import { useState, useEffect } from 'react';
import { generateReport, getLatestReport, getHistory } from '../services/anomalyService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY = {
  CRITICAL: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-800',    icon: 'dangerous',      emoji: '🔴' },
  WARNING:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-800', icon: 'warning',        emoji: '🟡' },
  NORMAL:   { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800', icon: 'check_circle',   emoji: '✅' },
};

const ANOMALY_LABELS = {
  ROBOTIC_CHECKIN:          { label: 'Pointage robotique',       icon: 'smart_toy' },
  REPEATED_WEEKDAY_ABSENCE: { label: 'Absence répétée',          icon: 'event_busy' },
  DURATION_TOO_SHORT:       { label: 'Durée trop courte',        icon: 'timer_off' },
  DURATION_TOO_LONG:        { label: 'Durée trop longue',        icon: 'more_time' },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <span className="material-symbols-outlined text-2xl" style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#111c2d]">{value ?? '—'}</p>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Employee Anomaly Card ────────────────────────────────────────────────────
function EmployeeCard({ emp }) {
  const [expanded, setExpanded] = useState(emp.globalSeverity !== 'NORMAL');
  const cfg = SEVERITY[emp.globalSeverity] || SEVERITY.NORMAL;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center shrink-0 font-bold text-sm uppercase border border-white/80">
            {emp.employeeUsername?.[0] || '?'}
          </div>
          <div>
            <p className={`text-sm font-bold ${cfg.text}`}>{emp.employeeUsername}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {emp.anomalyCount === 0
                ? 'Aucune anomalie'
                : `${emp.anomalyCount} anomalie${emp.anomalyCount > 1 ? 's' : ''} détectée${emp.anomalyCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
            {cfg.emoji} {emp.globalSeverity}
          </span>
          <span className="material-symbols-outlined text-gray-400 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
            expand_more
          </span>
        </div>
      </button>

      {expanded && emp.anomalies?.length > 0 && (
        <div className="px-5 pb-4 space-y-3">
          {emp.anomalies.map((a, i) => {
            const aInfo = ANOMALY_LABELS[a.type] || { label: a.type, icon: 'info' };
            const sCfg = SEVERITY[a.severity] || SEVERITY.WARNING;
            return (
              <div key={i} className="bg-white/70 rounded-xl p-4 border border-white/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-base" style={{ color: a.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>
                    {aInfo.icon}
                  </span>
                  <span className="text-sm font-bold text-gray-800">{aInfo.label}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${sCfg.badge}`}>
                    {a.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{a.description}</p>
                <p className="text-xs text-blue-600 italic">💡 {a.recommendation}</p>

                {/* Détails spécifiques selon le type */}
                {a.type === 'ROBOTIC_CHECKIN' && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Écart-type : <strong>{a.stdDevSeconds}s</strong> sur {a.samplesCount} jours (seuil: {a.threshold}s)
                  </p>
                )}
                {a.type === 'REPEATED_WEEKDAY_ABSENCE' && a.suspiciousDays?.map((d, j) => (
                  <p key={j} className="text-xs text-gray-400 mt-1">
                    {d.weekdayName} : présent {d.presenceRate}% ({d.presenceCount}/{d.totalOpportunities} semaines)
                  </p>
                ))}
                {(a.type === 'DURATION_TOO_SHORT' || a.type === 'DURATION_TOO_LONG') && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Durée moy. : <strong>{a.avgDurationFormatted}</strong> — équipe : {a.teamAvgFormatted} — Z-score : {a.zScore}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {expanded && emp.anomalies?.length === 0 && (
        <p className="px-5 pb-4 text-xs text-green-600">✅ Comportement normal sur la période analysée.</p>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AnomalyDashboard() {
  const [report, setReport]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]       = useState(null);
  const [days, setDays]         = useState(30);
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'history'

  useEffect(() => { fetchLatest(); }, []);

  const fetchLatest = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLatestReport();
      setReport(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setReport(null); // Pas encore de rapport
      } else {
        setError(err.response?.data?.error || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await getHistory(10);
      setHistory(res.data.reports || []);
    } catch (err) {
      console.error('History error:', err);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await generateReport(days);
      setReport(res.data);
      setActiveTab('report');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') fetchHistory();
  };

  // Trier : CRITICAL > WARNING > NORMAL
  const sortedEmployees = report?.employeeResults
    ? [...report.employeeResults].sort((a, b) => {
        const order = { CRITICAL: 0, WARNING: 1, NORMAL: 2 };
        return (order[a.globalSeverity] ?? 3) - (order[b.globalSeverity] ?? 3);
      })
    : [];

  const criticalCount = sortedEmployees.filter(e => e.globalSeverity === 'CRITICAL').length;
  const warningCount  = sortedEmployees.filter(e => e.globalSeverity === 'WARNING').length;
  const normalCount   = sortedEmployees.filter(e => e.globalSeverity === 'NORMAL').length;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111c2d]">Détection d'Anomalies</h1>
          <p className="text-sm text-gray-400 mt-1">
            Analyse IA des comportements suspects de pointage
          </p>
        </div>

        {/* Contrôles analyse */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
          >
            <option value={7}>7 jours</option>
            <option value={14}>14 jours</option>
            <option value={30}>30 jours</option>
            <option value={60}>60 jours</option>
          </select>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white text-sm font-semibold rounded-xl hover:bg-[#002244] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">psychology</span>
                Lancer l'analyse IA
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'report',  label: 'Rapport actuel', icon: 'analytics' },
          { key: 'history', label: 'Historique',      icon: 'history' },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-[#003366] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Rapport actuel ── */}
      {activeTab === 'report' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3">
              <div className="w-8 h-8 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Chargement…</p>
            </div>
          ) : !report ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-5xl text-gray-300">psychology</span>
              <p className="text-gray-500 font-semibold mt-3">Aucun rapport disponible</p>
              <p className="text-gray-400 text-sm mt-1">Cliquez sur "Lancer l'analyse IA" pour générer le premier rapport</p>
            </div>
          ) : (
            <>
              {/* Meta info */}
              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Généré le {formatDate(report.generatedAt)}
                <span className="mx-1">·</span>
                <span className="material-symbols-outlined text-sm">date_range</span>
                Période : {report.periodDays} jours
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard icon="group" label="Employés analysés" value={report.totalEmployees} color="#003366" />
                <KpiCard icon="dangerous" label="Anomalies" value={report.anomalyCount} color="#ef4444" />
                <KpiCard icon="warning" label="Critique" value={criticalCount} color="#ef4444" />
                <KpiCard icon="check_circle" label="Normal" value={normalCount} color="#10b981" />
              </div>

              {/* Rapport AI Gemini */}
              {report.aiReport && (
                <div className="bg-gradient-to-br from-[#003366]/5 to-[#003366]/10 rounded-2xl border border-[#003366]/20 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#003366]">auto_awesome</span>
                    <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wide">Rapport IA — Gemini</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed text-sm">
                    {report.aiReport}
                  </div>
                </div>
              )}

              {/* Liste employés */}
              {sortedEmployees.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Détail par employé ({sortedEmployees.length})
                  </h2>
                  <div className="space-y-3">
                    {sortedEmployees.map(emp => (
                      <EmployeeCard key={emp.employeeId} emp={emp} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB: Historique ── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300">history</span>
              <p className="text-gray-400 mt-3">Aucun historique disponible</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employés</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Anomalies</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lancé par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(r.generatedAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.periodDays} jours</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">{r.totalEmployees}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.anomalyCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {r.anomalyCount === 0 ? '✅ 0' : `⚠️ ${r.anomalyCount}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{r.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
