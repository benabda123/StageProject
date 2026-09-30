import { useState, useEffect } from 'react';
import { getTodayAttendance, getTeamAttendance } from '../services/attendanceService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color = '#003366' }) {
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

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    present:     { cls: 'bg-green-100 text-green-800', label: '🟢 Présent' },
    checked_out: { cls: 'bg-gray-100 text-gray-600',   label: '⚪ Sorti' },
  }[status] || { cls: 'bg-gray-100 text-gray-400', label: status };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AttendanceDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAttendance(selectedDate || null);
  }, [selectedDate]);

  const fetchAttendance = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const res = date
        ? await getTeamAttendance(date)
        : await getTodayAttendance();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const isToday = !selectedDate || selectedDate === todayStr;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111c2d]">Tableau de Présence</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isToday ? "Présences d'aujourd'hui en temps réel" : `Présences du ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
          </p>
        </div>

        {/* Sélecteur de date */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] bg-white shadow-sm"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Aujourd'hui
            </button>
          )}
          <button
            onClick={() => fetchAttendance(selectedDate || null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm font-semibold rounded-xl hover:bg-[#002244] transition-colors"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Actualiser
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

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement…</p>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard icon="groups" label="Total pointages"  value={data.summary.total}        color="#003366" />
            <KpiCard icon="how_to_reg" label="Présents"     value={data.summary.present}      color="#10b981" />
            <KpiCard icon="logout"  label="Sortis"          value={data.summary.checkedOut}   color="#f59e0b" />
            <KpiCard icon="avg_pace" label="Durée moyenne"  value={data.summary.avgDurationFormatted || '—'} color="#8b5cf6" />
          </div>

          {/* Table des présences */}
          {data.records.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-5xl text-gray-300">event_busy</span>
              <p className="text-gray-400 mt-3 font-medium">Aucun pointage enregistré pour cette date</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Détail des pointages
                </h2>
                <span className="text-xs text-gray-400">{data.records.length} employé{data.records.length > 1 ? 's' : ''}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employé</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Arrivée</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Départ</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durée</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Distance</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#003366]/10 flex items-center justify-center shrink-0">
                              <span className="text-[#003366] font-bold text-xs uppercase">
                                {rec.employeeUsername?.[0] || '?'}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{rec.employeeUsername}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{formatTime(rec.checkInTime)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {rec.checkOutTime ? formatTime(rec.checkOutTime) : (
                            <span className="text-green-600 font-semibold">En cours</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-semibold">{formatDuration(rec.durationMinutes)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${
                            rec.distanceMeters <= 50 ? 'text-green-600' :
                            rec.distanceMeters <= 150 ? 'text-yellow-600' : 'text-orange-600'
                          }`}>
                            {Math.round(rec.distanceMeters)}m
                          </span>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
