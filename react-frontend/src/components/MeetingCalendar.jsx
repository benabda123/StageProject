import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getMyMeetings } from '../services/meetingService';
import MeetingDetailsModal from './MeetingDetailsModal';

const localizer = momentLocalizer(moment);

const STATUS_COLORS = {
  PENDING: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  CONFIRMED: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  CHANGE_REQUEST_PENDING: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280', border: '#9ca3af' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' }
};

const STATUS_LABELS = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CHANGE_REQUEST_PENDING: 'Changement demandé',
  CANCELLED: 'Annulé',
  REJECTED: 'Refusé'
};

export default function MeetingCalendar() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyMeetings();
      console.log('Meetings reçues de l API:', data);
      if (data.length > 0) {
        console.log('Première réunion brute:', JSON.stringify(data[0], null, 2));
        console.log('Date brute:', data[0].date, 'Type:', typeof data[0].date);
        console.log('Start_time brut:', data[0].start_time, 'Type:', typeof data[0].start_time);
      }
      setMeetings(data);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const formatMeetingsForCalendar = () => {
    const formatted = meetings.map(meeting => {
      // Extraire la date YYYY-MM-DD de la chaîne ISO
      const dateOnly = meeting.date.split('T')[0];
      const startDate = new Date(`${dateOnly}T${meeting.start_time}`);
      const endDate = new Date(`${dateOnly}T${meeting.end_time}`);
      const location = meeting.type === 'ONLINE' ? 'Online' : meeting.room_name || 'Salle inconnue';
      
      return {
        id: meeting.id,
        title: `${meeting.title} - ${location}`,
        start: startDate,
        end: endDate,
        resource: meeting
      };
    });
    console.log('Événements formatés pour le calendrier:', formatted);
    return formatted;
  };

  const eventStyleGetter = (event) => {
    const status = event.resource.status;
    const colors = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
    
    return {
      style: {
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: '500'
      }
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedMeeting(event.resource);
  };

  const handleCloseModal = () => {
    setSelectedMeeting(null);
    fetchMeetings();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">hourglass_empty</span>
          </div>
          <p className="text-sm text-white/60 font-medium">Chargement des réunions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-red-300">error</span>
        </div>
        <p className="text-sm font-medium text-red-200">{error}</p>
        <button
          onClick={fetchMeetings}
          className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-2">
          <span>Meetings</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-violet-300">My Meetings</span>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Mes Réunions</h2>
          <Link
            to="/new-meeting"
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nouvelle réunion
          </Link>
        </div>
        <p className="text-sm text-white/70 mt-1">Gérez vos réunions avec le calendrier interactif</p>
      </div>

      {/* Calendar */}
      <div className="glass-calendar p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setView(Views.MONTH)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                view === Views.MONTH
                  ? 'bg-[#003366] text-white shadow-sm'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setView(Views.WEEK)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                view === Views.WEEK
                  ? 'bg-[#003366] text-white shadow-sm'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setView(Views.DAY)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                view === Views.DAY
                  ? 'bg-[#003366] text-white shadow-sm'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Jour
            </button>
          </div>
        </div>

        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={formatMeetingsForCalendar()}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            messages={{
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              today: "Aujourd'hui",
              previous: 'Précédent',
              next: 'Suivant',
              noEvents: 'Aucune réunion'
            }}
          />
        </div>
      </div>

      {/* Status Legend */}
      <div className="mt-6 flex flex-wrap gap-4">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`
              }}
            />
            <span className="text-xs text-white/70 font-medium">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <MeetingDetailsModal
          meeting={selectedMeeting}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
