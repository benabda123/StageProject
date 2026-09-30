import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requestMeetingChange, cancelMeeting } from '../services/meetingService';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CHANGE_REQUEST_PENDING: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CHANGE_REQUEST_PENDING: 'Changement demandé',
  CANCELLED: 'Annulé',
  REJECTED: 'Refusé'
};

export default function MeetingDetailsModal({ meeting, onClose }) {
  const { tokenParsed } = useAuth();
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [changeData, setChangeData] = useState({
    date: meeting.date,
    start_time: meeting.start_time,
    end_time: meeting.end_time,
    reason: ''
  });
  
  const [cancelReason, setCancelReason] = useState('');

  const isCreator = tokenParsed?.sub === meeting.created_by_id;

  const handleChangeDataChange = (e) => {
    const { name, value } = e.target;
    setChangeData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestChange = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestMeetingChange(meeting.id, changeData);
      onClose();
    } catch (err) {
      console.error('Error requesting change:', err);
      setError(err.response?.data?.error || 'Erreur lors de la demande de changement');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!cancelReason.trim()) {
      setError('Veuillez indiquer une raison');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await cancelMeeting(meeting.id, { reason: cancelReason });
      onClose();
    } catch (err) {
      console.error('Error cancelling meeting:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const location = meeting.type === 'ONLINE' 
    ? meeting.meeting_link 
    : meeting.room_name || 'Salle inconnue';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#001e40]">Détails de la réunion</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[meeting.status]}`}>
              {STATUS_LABELS[meeting.status]}
            </span>
          </div>

          {/* Title */}
          <div>
            <h4 className="text-2xl font-bold text-[#111c2d]">{meeting.title}</h4>
            {meeting.description && (
              <p className="text-gray-600 mt-2">{meeting.description}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span>Date</span>
              </div>
              <p className="font-semibold text-[#111c2d]">{formatDate(meeting.date)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>Horaires</span>
              </div>
              <p className="font-semibold text-[#111c2d]">
                {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
              </p>
            </div>
          </div>

          {/* Type and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <span className="material-symbols-outlined text-sm">
                  {meeting.type === 'ONLINE' ? 'videocam' : 'meeting_room'}
                </span>
                <span>Type</span>
              </div>
              <p className="font-semibold text-[#111c2d]">
                {meeting.type === 'ONLINE' ? 'En ligne' : 'Présentiel'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>Lieu</span>
              </div>
              {meeting.type === 'ONLINE' ? (
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#003366] hover:underline break-all"
                >
                  {meeting.meeting_link}
                </a>
              ) : (
                <p className="font-semibold text-[#111c2d]">{meeting.room_name}</p>
              )}
            </div>
          </div>

          {/* Participants */}
          {meeting.participants && meeting.participants.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <span className="material-symbols-outlined text-sm">people</span>
                <span>Participants</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.map((participant, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {participant}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="material-symbols-outlined text-sm">person</span>
            <span>Créé par {meeting.created_by_username}</span>
          </div>

          {/* Change Request Details */}
          {meeting.status === 'CHANGE_REQUEST_PENDING' && meeting.change_request_data && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Demande de changement en cours</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Nouvelle date:</strong> {formatDate(meeting.change_request_data.proposed_date)}</p>
                <p><strong>Nouveaux horaires:</strong> {formatTime(meeting.change_request_data.proposed_start_time)} - {formatTime(meeting.change_request_data.proposed_end_time)}</p>
                {meeting.change_request_data.reason && (
                  <p><strong>Raison:</strong> {meeting.change_request_data.reason}</p>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          {meeting.status === 'CANCELLED' && meeting.cancellation_reason && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-800 font-semibold mb-2">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Raison d'annulation</span>
              </div>
              <p className="text-sm text-gray-700">{meeting.cancellation_reason}</p>
            </div>
          )}

          {/* Actions for Creator */}
          {isCreator && meeting.status === 'CONFIRMED' && !showChangeForm && !showCancelForm && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowChangeForm(true)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#003366] text-[#003366] font-semibold hover:bg-[#003366] hover:text-white transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">edit</span>
                Demander un changement
              </button>
              <button
                onClick={() => setShowCancelForm(true)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-red-600 text-red-600 font-semibold hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">cancel</span>
                Annuler la réunion
              </button>
            </div>
          )}

          {/* Change Request Form */}
          {showChangeForm && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h5 className="font-semibold text-[#111c2d]">Demander un changement d'horaire</h5>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle date</label>
                  <input
                    type="date"
                    name="date"
                    value={changeData.date}
                    onChange={handleChangeDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau début</label>
                  <input
                    type="time"
                    name="start_time"
                    value={changeData.start_time}
                    onChange={handleChangeDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle fin</label>
                  <input
                    type="time"
                    name="end_time"
                    value={changeData.end_time}
                    onChange={handleChangeDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
                <textarea
                  name="reason"
                  value={changeData.reason}
                  onChange={handleChangeDataChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Expliquez pourquoi vous souhaitez changer l'horaire"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowChangeForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRequestChange}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#003366] text-white font-semibold hover:bg-[#002244] transition disabled:opacity-50"
                >
                  {loading ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </div>
            </div>
          )}

          {/* Cancel Form */}
          {showCancelForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
              <h5 className="font-semibold text-red-800">Annuler la réunion</h5>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">Raison de l'annulation</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Expliquez pourquoi vous annulez cette réunion"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCancelMeeting}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? 'Annulation...' : 'Confirmer l\'annulation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
