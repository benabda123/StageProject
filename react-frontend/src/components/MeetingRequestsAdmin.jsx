import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllMeetings, approveMeeting, rejectMeeting, resolveMeetingChange } from '../services/meetingService';
import GoogleCalendarSettings from './GoogleCalendarSettings';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-800 border-green-200',
  CHANGE_REQUEST_PENDING: 'bg-blue-50 text-blue-800 border-blue-200',
  CANCELLED: 'bg-gray-50 text-gray-800 border-gray-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200'
};

const STATUS_LABELS = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CHANGE_REQUEST_PENDING: 'Changement demandé',
  CANCELLED: 'Annulé',
  REJECTED: 'Refusé'
};

export default function MeetingRequestsAdmin() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const googleConnected = searchParams.get('google_connected') === 'true';

  useEffect(() => {
    fetchAllMeetings();
  }, [statusFilter]);

  useEffect(() => {
    if (googleConnected) {
      const timer = setTimeout(() => {
        searchParams.delete('google_connected');
        searchParams.delete('google_error');
        setSearchParams(searchParams, { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [googleConnected, searchParams, setSearchParams]);

  const fetchAllMeetings = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await getAllMeetings(params);
      setMeetings(data);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveMeeting(id);
      fetchAllMeetings();
    } catch (err) {
      console.error('Error approving meeting:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectMeeting(id);
      fetchAllMeetings();
    } catch (err) {
      console.error('Error rejecting meeting:', err);
    }
  };

  const handleResolveChange = async (id, accept) => {
    try {
      const payload = { accept };
      console.log('Payload resolveMeetingChange:', JSON.stringify(payload, null, 2));
      await resolveMeetingChange(id, payload);
      fetchAllMeetings();
    } catch (err) {
      console.error('Error resolving change:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const getLocation = (meeting) => {
    if (meeting.type === 'ONLINE') {
      return meeting.meeting_link ? 'Online' : '—';
    }
    return meeting.room_name || 'Salle inconnue';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-gray-300">hourglass_empty</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Chargement des réunions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Meetings</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">Manage Requests</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Meeting Requests Management</h2>
        <p className="text-sm text-gray-500 mt-1">Review and approve or reject employee meeting requests.</p>
      </div>

      {googleConnected && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600">check_circle</span>
          <p className="text-sm text-green-700">Google Calendar connecté avec succès.</p>
        </div>
      )}

      <GoogleCalendarSettings />

      {/* Filter Section */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
            <span className="material-symbols-outlined">filter_list</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Filter Requests</h3>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-600">Filtrer par statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]"
          >
            <option value="">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmé</option>
            <option value="CHANGE_REQUEST_PENDING">Changement demandé</option>
            <option value="CANCELLED">Annulé</option>
            <option value="REJECTED">Refusé</option>
          </select>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-gray-300">event_busy</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Aucune demande de réunion</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Créateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Heure
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Salle / Lien
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {meetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-[#111c2d]">
                      {meeting.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {meeting.created_by_username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(meeting.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {meeting.type === 'ONLINE' ? 'En ligne' : 'Présentiel'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getLocation(meeting)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[meeting.status]}`}>
                        {STATUS_LABELS[meeting.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {meeting.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(meeting.id)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                            Accepter
                          </button>
                          <button
                            onClick={() => handleReject(meeting.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                            Refuser
                          </button>
                        </div>
                      )}
                    {meeting.status === 'CHANGE_REQUEST_PENDING' && meeting.change_request_data && (
                      <div className="space-y-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                          <p className="font-semibold text-blue-800">Changement demandé:</p>
                          <p className="text-blue-700">
                            {formatDate(meeting.change_request_data.proposed_date)} | 
                            {formatTime(meeting.change_request_data.proposed_start_time)} - {formatTime(meeting.change_request_data.proposed_end_time)}
                          </p>
                          {meeting.change_request_data.reason && (
                            <p className="text-blue-600 italic">"{meeting.change_request_data.reason}"</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResolveChange(meeting.id, true)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                            Accepter
                          </button>
                          <button
                            onClick={() => handleResolveChange(meeting.id, false)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                            Refuser
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
