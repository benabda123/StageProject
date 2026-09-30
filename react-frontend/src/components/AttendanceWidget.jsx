import { useState, useEffect } from 'react';
import { checkIn, checkOut, getMyAttendance } from '../services/attendanceService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}
function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

// ─── GPS helper ───────────────────────────────────────────────────────────────
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const msg =
          err.code === 1 ? 'Accès à la position refusé. Autorisez la géolocalisation dans votre navigateur.' :
          err.code === 2 ? 'Position non disponible. Vérifiez votre connexion GPS.' :
          'Timeout : impossible d\'obtenir votre position GPS.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

// ─── Composant StatusBadge ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (!status) return null;
  const cfg = {
    present:      { color: 'bg-green-100 text-green-800 border-green-200',  icon: 'check_circle',  label: 'Présent' },
    checked_out:  { color: 'bg-gray-100 text-gray-600 border-gray-200',     icon: 'logout',        label: 'Sorti' },
  }[status] || { color: 'bg-gray-100 text-gray-500', icon: 'help', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AttendanceWidget() {
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory]         = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage]         = useState(null); // { type: 'success'|'error', text }
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getMyAttendance(30);
      setTodayRecord(res.data.today);
      setHistory(res.data.history);
      setStats(res.data.stats);
    } catch (err) {
      setMessage({ type: 'error', text: 'Impossible de charger les données de pointage.' });
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const { lat, lng } = await getCurrentPosition();
      const res = await checkIn(lat, lng);
      showMsg('success', res.data.message);
      await fetchData();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      let lat = null, lng = null;
      try {
        const pos = await getCurrentPosition();
        lat = pos.lat; lng = pos.lng;
      } catch { /* GPS optionnel au check-out */ }
      const res = await checkOut(lat, lng);
      showMsg('success', res.data.message);
      await fetchData();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Déterminer l'action disponible ─────────────────────────────────────────
  const canCheckIn  = !todayRecord;
  const canCheckOut = todayRecord && todayRecord.status === 'present';
  const alreadyDone = todayRecord && todayRecord.status === 'checked_out';

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mon Pointage</h1>
        <p className="text-sm text-white/50 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${
          message.type === 'success'
            ? 'bg-green-500/15 border-green-400/30 text-green-200'
            : 'bg-red-500/15 border-red-400/30 text-red-300'
        }`}>
          <span className="material-symbols-outlined text-lg shrink-0">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <p>{message.text}</p>
        </div>
      )}

      {/* Carte principale — statut du jour */}
      <div className="bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Aujourd'hui</h2>
          {todayRecord && <StatusBadge status={todayRecord.status} />}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Chargement…</p>
          </div>
        ) : (
          <>
            {/* Infos du pointage du jour */}
            {todayRecord ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <p className="text-xs text-white/40 mb-1">Arrivée</p>
                  <p className="text-lg font-bold text-white">{formatTime(todayRecord.checkInTime)}</p>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <p className="text-xs text-white/40 mb-1">Départ</p>
                  <p className="text-lg font-bold text-white">
                    {todayRecord.checkOutTime ? formatTime(todayRecord.checkOutTime) : '—'}
                  </p>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <p className="text-xs text-white/40 mb-1">Durée</p>
                  <p className="text-lg font-bold text-white">{formatDuration(todayRecord.durationMinutes)}</p>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <p className="text-xs text-white/40 mb-1">Distance bureau</p>
                  <p className="text-lg font-bold text-white">{Math.round(todayRecord.distanceMeters)}m</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-3 mb-6">
                <span className="material-symbols-outlined text-white/30 text-4xl">schedule</span>
                <div>
                  <p className="text-white font-semibold">Pas encore pointé aujourd'hui</p>
                  <p className="text-white/50 text-sm">Cliquez sur "Pointer l'arrivée" pour commencer votre journée</p>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 flex-wrap">
              {canCheckIn && (
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 disabled:bg-green-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-900/30"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined">login</span>
                  )}
                  {actionLoading ? 'Localisation…' : "Pointer l'arrivée"}
                </button>
              )}

              {canCheckOut && (
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-900/30"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined">logout</span>
                  )}
                  {actionLoading ? 'En cours…' : 'Pointer le départ'}
                </button>
              )}

              {alreadyDone && (
                <div className="flex items-center gap-2 px-5 py-3 bg-white/[0.05] text-white/60 font-medium rounded-xl border border-white/10 text-sm">
                  <span className="material-symbols-outlined text-green-400">check_circle</span>
                  Journée complète enregistrée
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stats du mois */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: 'calendar_month', label: 'Jours présents', value: stats.totalDays },
            { icon: 'schedule',       label: 'Durée totale',   value: stats.totalFormatted },
            { icon: 'avg_pace',       label: 'Moy. / jour',    value: stats.avgFormatted },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-white/[0.05] rounded-xl p-4 text-center border border-white/[0.08]">
              <span className="material-symbols-outlined text-white/40 text-2xl">{icon}</span>
              <p className="text-lg font-bold text-white mt-1">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <div className="bg-white/[0.04] rounded-2xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-white/70 hover:bg-white/[0.03] transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">history</span>
              Historique des 30 derniers jours ({history.length} jours)
            </span>
            <span className="material-symbols-outlined text-lg transition-transform duration-200"
              style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>

          {showHistory && (
            <div className="divide-y divide-white/[0.06]">
              {history.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.03]">
                  <div>
                    <p className="text-sm font-medium text-white">{formatDate(rec.workDate)}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {formatTime(rec.checkInTime)} → {rec.checkOutTime ? formatTime(rec.checkOutTime) : 'En cours'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/60">{formatDuration(rec.durationMinutes)}</span>
                    <StatusBadge status={rec.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
