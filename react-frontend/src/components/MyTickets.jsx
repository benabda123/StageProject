import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyTickets } from '../services/ticketService';

const STATUS_COLORS = {
  OPEN: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
  ASSIGNED: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
  IN_PROGRESS: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
  RESOLVED: 'bg-green-500/15 text-green-300 border-green-400/30',
  CLOSED: 'bg-white/10 text-white/70 border-white/15',
};

const STATUS_LABELS = {
  OPEN: 'Ouvert',
  ASSIGNED: 'Assigné',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const PRIORITY_COLORS = {
  HIGH: 'bg-red-500/15 text-red-300 border-red-400/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
  LOW: 'bg-white/10 text-white/70 border-white/15',
};

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">hourglass_empty</span>
          </div>
          <p className="text-sm text-white/60 font-medium">Chargement des tickets...</p>
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
        <button onClick={fetchTickets} className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
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
          <span>Support</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-violet-300">Mes Tickets</span>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Mes Tickets IT</h2>
          <Link
            to="/new-ticket"
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nouveau ticket
          </Link>
        </div>
        <p className="text-sm text-white/70 mt-1">Suivez vos demandes de support IT et leur résolution</p>
      </div>

      {tickets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">confirmation_number</span>
          </div>
          <p className="text-sm font-medium text-white/70">Aucun ticket pour le moment</p>
          <Link to="/new-ticket" className="inline-block mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            Créer un ticket
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Titre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Priorité</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Assigné à</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-white/[0.04] transition-all duration-200 cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <td className="px-6 py-4 font-medium text-white">{ticket.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">{ticket.category || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.LOW}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN}`}>
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {ticket.assignedToUsername || <span className="text-white/40 italic">Non assigné</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">{formatDate(ticket.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-blue-200 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 transition-all duration-200 flex items-center gap-1 hover:scale-[1.05] active:scale-[0.95]"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Détails
                      </button>
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
