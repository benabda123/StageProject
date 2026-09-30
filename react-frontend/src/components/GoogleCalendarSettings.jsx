import { useState, useEffect } from 'react';
import { getGoogleCalendarStatus } from '../services/meetingService';
import { getToken } from '../services/tokenStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function GoogleCalendarSettings({ onStatusChange }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const status = await getGoogleCalendarStatus();
      setConnected(status.connected);
      onStatusChange?.(status.connected);
    } catch (err) {
      console.error('Error fetching Google Calendar status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    const token = await getToken();
    if (!token) return;
    // Kong n'a pas de JWT sur /connect ; le token passe en query pour l'auth côté service
    window.location.href = `${API_BASE}/meetings/google/connect?access_token=${encodeURIComponent(token)}`;
  };

  if (loading) {
    return (
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <p className="text-sm text-gray-500">Vérification de la connexion Google Calendar…</p>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Google Calendar</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Connectez votre compte pour créer des réunions Google Meet automatiquement
            </p>
          </div>
        </div>

        {connected ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-800 text-sm font-semibold border border-green-200">
            ✅ Google Calendar connecté
          </span>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#003366] text-white text-sm font-semibold hover:bg-[#002244] transition-all duration-200"
          >
            <span className="material-symbols-outlined text-lg">link</span>
            Connecter Google Calendar
          </button>
        )}
      </div>
    </div>
  );
}
