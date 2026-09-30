import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMeeting, getRooms, getGoogleCalendarStatus } from '../services/meetingService';
import { getEmployees } from '../services/api';
import GoogleCalendarSettings from './GoogleCalendarSettings';

export default function NewMeetingRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [googleConnected, setGoogleConnected] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    type: 'PRESENTIEL',
    room_id: '',
    meeting_link: '',
    meeting_platform: null,   // null | 'GOOGLE_MEET'
    participants: [],
  });

  const [participantIds, setParticipantIds] = useState([]);

  useEffect(() => {
    fetchRooms();
    fetchEmployees();
    fetchGoogleStatus();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const status = await getGoogleCalendarStatus();
      setGoogleConnected(status.connected);
    } catch (err) {
      console.error('Error fetching Google status:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      room_id: type === 'ONLINE' ? '' : prev.room_id,
      meeting_link: type === 'PRESENTIEL' ? '' : prev.meeting_link,
      // Réinitialiser la plateforme si on revient en présentiel
      meeting_platform: type === 'PRESENTIEL' ? null : prev.meeting_platform,
    }));
  };

  const handlePlatformChange = (platform) => {
    setFormData(prev => ({
      ...prev,
      meeting_platform: platform,
      // Vider le lien manuel si on choisit Google Meet (le lien sera généré)
      meeting_link: platform === 'GOOGLE_MEET' ? '' : prev.meeting_link,
    }));
  };

  const handleParticipantToggle = (employeeId) => {
    setParticipantIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const getInputStyle = () =>
    'w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]';

  const getSelectStyle = () =>
    'w-full py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]';

  const validateForm = () => {
    if (!formData.title.trim()) { setError('Le titre est requis'); return false; }
    if (!formData.date) { setError('La date est requise'); return false; }
    if (!formData.start_time) { setError("L'heure de début est requise"); return false; }
    if (!formData.end_time) { setError("L'heure de fin est requise"); return false; }
    if (formData.end_time <= formData.start_time) {
      setError("L'heure de fin doit être après l'heure de début"); return false;
    }
    if (formData.type === 'ONLINE') {
      if (formData.meeting_platform === 'GOOGLE_MEET') {
        if (!googleConnected) {
          setError('Connectez d\'abord votre compte Google Calendar (bouton ci-dessus)');
          return false;
        }
      } else {
        // Lien manuel requis
        if (!formData.meeting_link.trim()) {
          setError('Le lien de réunion est requis pour les réunions en ligne');
          return false;
        }
        try { new URL(formData.meeting_link); } catch {
          setError('Le lien de réunion doit être une URL valide'); return false;
        }
      }
    }
    if (formData.type === 'PRESENTIEL' && !formData.room_id) {
      setError('La salle est requise pour les réunions en présentiel'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        participants: participantIds,
        // Pour Google Meet : pas de lien manuel, le backend le génère
        meeting_link: formData.meeting_platform === 'GOOGLE_MEET' ? null : formData.meeting_link || null,
        room_id: formData.room_id ? parseInt(formData.room_id, 10) : null,
      };

      await createMeeting(submissionData);
      navigate('/meetings');
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError(err.response?.data?.error || err.message || 'Erreur lors de la création de la réunion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Meetings</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">New Meeting</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Nouvelle Réunion</h2>
        <p className="text-sm text-gray-500 mt-1">Créez une demande de réunion</p>
      </div>

      {/* Google Calendar Settings banner */}
      <GoogleCalendarSettings onStatusChange={setGoogleConnected} />

      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600">error</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
              <span className="material-symbols-outlined">event</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Détails de la réunion</h3>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Titre <span className="text-red-500">*</span>
              </label>
              <input type="text" name="title" value={formData.title}
                onChange={handleChange} className={getInputStyle()}
                placeholder="Titre de la réunion" required />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Description</label>
              <textarea name="description" value={formData.description}
                onChange={handleChange} rows="3" className={getInputStyle()}
                placeholder="Description de la réunion" />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Date <span className="text-red-500">*</span>
                </label>
                <input type="date" name="date" value={formData.date}
                  onChange={handleChange} className={getInputStyle()} required />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Heure début <span className="text-red-500">*</span>
                </label>
                <input type="time" name="start_time" value={formData.start_time}
                  onChange={handleChange} className={getInputStyle()} required />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Heure fin <span className="text-red-500">*</span>
                </label>
                <input type="time" name="end_time" value={formData.end_time}
                  onChange={handleChange} className={getInputStyle()} required />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'PRESENTIEL', icon: 'meeting_room', label: 'Présentiel' },
                  { value: 'ONLINE', icon: 'videocam', label: 'En ligne' },
                ].map(({ value, icon, label }) => (
                  <button key={value} type="button" onClick={() => handleTypeChange(value)}
                    className={`flex items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.type === value
                        ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                        : 'bg-white/10 border-gray-300 hover:bg-white/15'
                    }`}>
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ONLINE: plateforme */}
            {formData.type === 'ONLINE' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-600">
                  Plateforme <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Google Meet */}
                  <button type="button" onClick={() => handlePlatformChange('GOOGLE_MEET')}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all duration-200 ${
                      formData.meeting_platform === 'GOOGLE_MEET'
                        ? 'bg-green-50 border-green-400 text-green-800'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                    {/* Google Meet icon SVG */}
                    <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                      <path fill="#00BCD4" d="M27 24l5 5v-10z"/>
                      <path fill="#4CAF50" d="M32 17l-5 5v-6h-16v16h16v-6l5 5v-14z"/>
                      <path fill="#1976D2" d="M11 22v4h3v-4zm5 0v4h3v-4z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Google Meet</p>
                      <p className="text-xs text-gray-500">Lien généré automatiquement</p>
                    </div>
                    {formData.meeting_platform === 'GOOGLE_MEET' && (
                      <span className="material-symbols-outlined text-green-600 ml-auto text-lg">check_circle</span>
                    )}
                  </button>

                  {/* Lien manuel */}
                  <button type="button" onClick={() => handlePlatformChange(null)}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all duration-200 ${
                      formData.meeting_platform === null
                        ? 'bg-blue-50 border-blue-400 text-blue-800'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                    <span className="material-symbols-outlined text-xl shrink-0">link</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Lien manuel</p>
                      <p className="text-xs text-gray-500">Zoom, Teams, autre…</p>
                    </div>
                    {formData.meeting_platform === null && (
                      <span className="material-symbols-outlined text-blue-600 ml-auto text-lg">check_circle</span>
                    )}
                  </button>
                </div>

                {/* Avertissement Google non connecté */}
                {formData.meeting_platform === 'GOOGLE_MEET' && !googleConnected && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-amber-600 text-base">warning</span>
                    <p className="text-xs text-amber-700 font-medium">
                      Connectez votre Google Calendar en haut de page pour utiliser Google Meet.
                    </p>
                  </div>
                )}

                {/* Confirmation Google connecté */}
                {formData.meeting_platform === 'GOOGLE_MEET' && googleConnected && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
                    <p className="text-xs text-green-700 font-medium">
                      Le lien Google Meet sera généré automatiquement à la création.
                    </p>
                  </div>
                )}

                {/* Lien manuel si plateforme non Google Meet */}
                {formData.meeting_platform !== 'GOOGLE_MEET' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-600">
                      Lien de réunion <span className="text-red-500">*</span>
                    </label>
                    <input type="url" name="meeting_link" value={formData.meeting_link}
                      onChange={handleChange} className={getInputStyle()}
                      placeholder="https://zoom.us/j/..." required />
                  </div>
                )}
              </div>
            )}

            {/* PRESENTIEL: salle */}
            {formData.type === 'PRESENTIEL' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Salle <span className="text-red-500">*</span>
                </label>
                <select name="room_id" value={formData.room_id}
                  onChange={handleChange} className={getSelectStyle()} required>
                  <option value="">Sélectionnez une salle</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Capacité : {room.capacity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Participants — sélection depuis la liste des employés */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600">
                Participants
                {participantIds.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {participantIds.length} sélectionné{participantIds.length > 1 ? 's' : ''}
                  </span>
                )}
              </label>
              {employees.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Chargement des employés…</p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-50">
                  {employees.map(emp => {
                    const empId = emp.userId || emp.id;
                    const selected = participantIds.includes(empId);
                    return (
                      <label key={empId}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}>
                        <input type="checkbox" checked={selected}
                          onChange={() => handleParticipantToggle(empId)}
                          className="w-4 h-4 accent-[#003366] rounded" />
                        <span className="text-sm text-gray-700 font-medium">
                          {emp.firstName} {emp.lastName}
                        </span>
                        {emp.position && (
                          <span className="text-xs text-gray-400 ml-auto">{emp.position}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/meetings')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all duration-200">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            className={`px-8 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 ${
              loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98]'
            }`}>
            <span className="material-symbols-outlined text-lg">
              {formData.meeting_platform === 'GOOGLE_MEET' ? 'video_call' : 'check'}
            </span>
            {loading ? 'Création…' : formData.meeting_platform === 'GOOGLE_MEET' ? 'Créer avec Google Meet' : 'Créer la réunion'}
          </button>
        </div>
      </form>
    </div>
  );
}
