import { useEffect, useState } from 'react';
import { getLeaveStats, getMeetingStats, getTaskStats } from '../services/dashboardService';

// ─── Palettes et labels ───────────────────────────────────────────────────────
const COLORS = ['#003366', '#2563eb', '#0ea5e9', '#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const getColor = (i) => COLORS[i % COLORS.length];

const LEAVE_STATUS_LABELS = { en_attente: 'En attente', accepte: 'Accepté', refuse: 'Refusé' };
const LEAVE_TYPE_LABELS = { annuel: 'Annuel', maladie: 'Maladie', personnel: 'Personnel', sans_solde: 'Sans solde' };
const MEETING_STATUS_LABELS = { pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée', cancelled: 'Annulée', change_requested: 'Modif. demandée' };
const MEETING_TYPE_LABELS = { ONLINE: 'En ligne', PRESENTIEL: 'Présentiel' };
const TASK_STATUS_LABELS = { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminées' };
const TASK_STATUS_COLORS = { TODO: '#94a3b8', IN_PROGRESS: '#f59e0b', DONE: '#10b981' };
const TASK_PRIORITY_LABELS = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Haute' };
const TASK_PRIORITY_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' };

function humanLabel(value, map) { return map[value] || value || 'Inconnu'; }

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data, title, labelMap = {}, colorMap = {} }) {
  const size = 170, radius = 62, cx = size / 2, cy = size / 2;
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{title}</p>
      <div className="flex flex-col items-center justify-center h-28 text-gray-300">
        <span className="material-symbols-outlined text-4xl">donut_large</span>
        <p className="text-sm mt-1">Aucune donnée</p>
      </div>
    </div>
  );

  let cumulative = 0;
  const slices = data.map((d, i) => {
    const start = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += d.count;
    const end = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + radius * Math.cos(start), y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end), y2 = cy + radius * Math.sin(end);
    const color = colorMap[d.label] || getColor(i);
    return {
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`,
      color, label: humanLabel(d.label, labelMap), count: d.count,
      pct: Math.round((d.count / total) * 100),
    };
  });

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{title}</p>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2.5">
            <title>{s.label}: {s.count} ({s.pct}%)</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={radius * 0.52} fill="white" />
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#111c2d">{total}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9" fill="#6b7280">total</text>
      </svg>
      <div className="mt-3 space-y-1.5 w-full">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="text-gray-600">{s.label}</span>
            </div>
            <span className="font-semibold text-gray-700">{s.count} <span className="text-gray-400 font-normal">({s.pct}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Line Chart ────────────────────────────────────────────────────────────────
function LineChart({ data, title, color = '#003366' }) {
  const W = 320, H = 130, pX = 32, pY = 14;
  const iW = W - pX * 2, iH = H - pY * 2;
  const max = Math.max(...data.map((d) => d.count), 1);
  const pts = data.map((d, i) => ({
    x: pX + (i / Math.max(data.length - 1, 1)) * iW,
    y: pY + iH - (d.count / max) * iH, ...d,
  }));
  const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pX},${pY + iH} ${poly} ${pX + iW},${pY + iH}`;
  const hasData = data.some((d) => d.count > 0);

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">{title}</p>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-28 text-gray-300">
          <span className="material-symbols-outlined text-4xl">show_chart</span>
          <p className="text-sm mt-1">Aucune donnée</p>
        </div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => <line key={i} x1={pX} x2={pX + iW} y1={pY + iH - v * iH} y2={pY + iH - v * iH} stroke="#f1f5f9" strokeWidth="1" />)}
          <polygon points={area} fill={color} fillOpacity="0.1" />
          <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2"><title>{p.month}: {p.count}</title></circle>)}
          {pts.map((p, i) => i % 2 === 0 ? <text key={i} x={p.x} y={H - 1} textAnchor="middle" fontSize="8" fill="#94a3b8">{p.month?.slice(5)}</text> : null)}
          <text x={pX - 4} y={pY + 4} textAnchor="end" fontSize="8" fill="#94a3b8">{max}</text>
          <text x={pX - 4} y={pY + iH + 4} textAnchor="end" fontSize="8" fill="#94a3b8">0</text>
        </svg>
      )}
    </div>
  );
}

// ─── Progression Bar (Task completion) ────────────────────────────────────────
function CompletionCard({ completed, total, rate }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Progression des tâches</p>
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl font-bold text-[#111c2d]">
          {completed} <span className="text-lg font-normal text-gray-400">/ {total}</span>
        </span>
        <span className="text-2xl font-bold" style={{ color: rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444' }}>
          {rate}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${rate}%`, background: rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444' }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">Tâches terminées sur le total assigné</p>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = '#003366' }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <span className="material-symbols-outlined text-2xl" style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#111c2d]">{value ?? '—'}</p>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label, color }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
      <span className="inline-flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm" style={{ color }}>{icon}</span>
        {label}
      </span>
    </h2>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function DashboardStats() {
  const [leaveStats, setLeaveStats] = useState(null);
  const [meetingStats, setMeetingStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getLeaveStats(), getMeetingStats(), getTaskStats()])
      .then(([leaveRes, meetingRes, taskRes]) => {
        setLeaveStats(leaveRes.data);
        setMeetingStats(meetingRes.data);
        setTaskStats(taskRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message || 'Erreur inconnue');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Chargement des statistiques…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
        <p className="text-red-600 font-semibold">Erreur de chargement</p>
        <p className="text-gray-500 text-sm text-center max-w-sm">{error}</p>
      </div>
    );
  }

  const pendingLeaves = leaveStats?.byStatus?.find(s => s.label === 'en_attente')?.count ?? 0;
  const approvedMeetings = meetingStats?.byStatus?.find(s => s.label === 'approved')?.count ?? 0;

  return (
    <div className="space-y-8 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111c2d]">Statistics Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Aperçu des congés, réunions et tâches</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon="event" label="Demandes de congé" value={leaveStats?.total}
          sub={`${pendingLeaves} en attente`} color="#f59e0b" />
        <KpiCard icon="event_available" label="Réunions" value={meetingStats?.total}
          sub={`${approvedMeetings} approuvées`} color="#10b981" />
        <KpiCard icon="task_alt" label="Tâches" value={taskStats?.total}
          sub={`${taskStats?.completedCount ?? 0} terminées`} color="#8b5cf6" />
      </div>

      {/* ── Section Tâches ── */}
      <section>
        <SectionHeader icon="task_alt" label="Tâches" color="#8b5cf6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* État des tâches */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <DonutChart
              data={taskStats?.byStatus ?? []}
              title="État des tâches"
              labelMap={TASK_STATUS_LABELS}
              colorMap={TASK_STATUS_COLORS}
            />
          </div>

          {/* Priorités */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <DonutChart
              data={taskStats?.byPriority ?? []}
              title="Par priorité"
              labelMap={TASK_PRIORITY_LABELS}
              colorMap={TASK_PRIORITY_COLORS}
            />
          </div>

          {/* Progression globale */}
          <CompletionCard
            completed={taskStats?.completedCount ?? 0}
            total={taskStats?.total ?? 0}
            rate={taskStats?.completionRate ?? 0}
          />

        </div>
      </section>

      {/* ── Section Congés ── */}
      <section>
        <SectionHeader icon="event" label="Congés" color="#f59e0b" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <DonutChart data={leaveStats?.byStatus ?? []} title="Par statut" labelMap={LEAVE_STATUS_LABELS} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <DonutChart data={leaveStats?.byType ?? []} title="Par type" labelMap={LEAVE_TYPE_LABELS} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <LineChart data={leaveStats?.byMonth ?? []} title="Évolution sur 12 mois" color="#f59e0b" />
          </div>

        </div>
      </section>

      {/* ── Section Réunions ── */}
      <section>
        <SectionHeader icon="event_available" label="Réunions" color="#10b981" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <DonutChart data={meetingStats?.byStatus ?? []} title="Par statut" labelMap={MEETING_STATUS_LABELS} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <DonutChart data={meetingStats?.byType ?? []} title="Par type (Online / Présentiel)" labelMap={MEETING_TYPE_LABELS} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <LineChart data={meetingStats?.byMonth ?? []} title="Évolution sur 12 mois" color="#10b981" />
          </div>

        </div>
      </section>

    </div>
  );
}
