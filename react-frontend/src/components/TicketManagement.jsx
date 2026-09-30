import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTickets, assignTicket, updateTicketStatus } from '../services/ticketService';

const STATUS_COLORS = {
  OPEN: 'bg-blue-50 text-blue-800 border-blue-200',
  ASSIGNED: 'bg-purple-50 text-purple-800 border-purple-200',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  RESOLVED: 'bg-green-50 text-green-800 border-green-200',
  CLOSED: 'bg-gray-50 text-gray-800 border-gray-200',
};

const STATUS_LABELS = {
  OPEN: 'Ouvert',
  ASSIGNED: 'Assigné',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const PRIORITY_COLORS = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  LOW: 'bg-gray-50 text-gray-700 border-gray-200',
};

const STATUS_TRANSITIONS = {
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: [],
  CLOSED: [],
};

export default function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [actionError, setActionError] = useState(null);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      const data = await getAllTickets(params);
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
  }, [filterStatus, filterCategory]);

  const handleAssign = async (ticketId) => {
    try {
      setActionError(null);
      await assignTicket(ticketId);
      await fetchTickets();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Erreur lors de l\'assignation');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setActionError(null);
      await updateTicketStatus(ticketId, newStatus);
      await fetchTickets();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Erreur lors du changement de statut');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getNextStatus = (currentStatus) => {
    const transitions = STATUS_TRANSITIONS[currentStatus];
    return transitions && transitions.length > 0 ? transitions[0] : null;
  };

  const stats = {
    open: tickets.filter((t) => t.status === 'OPEN').length,
    assigned: tickets.filter((t) => t.status === 'ASSIGNED').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-gray-300">hourglass_empty</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Chargement des tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Tickets IT Support</h2>
        <p className="text-sm text-gray-500 mt-1">Gérez et traitez les demandes de support IT</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">Ouverts</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
        </div>
        <div className="bg-purple-50 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="text-sm font-semibold text-purple-800 mb-1">Assignés</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.assigned}</p>
        </div>
        <div className="bg-yellow-50 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="text-sm font-semibold text-yellow-800 mb-1">En cours</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-green-50 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="text-sm font-semibold text-green-800 mb-1">Résolus</h3>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
        >
          <option value="">Tous les statuts</option>
          <option value="OPEN">Ouvert</option>
          <option value="ASSIGNED">Assigné</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="RESOLVED">Résolu</option>
          <option value="CLOSED">Fermé</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
        >
          <option value="">Toutes les catégories</option>
          <option value="HARDWARE">Hardware</option>
          <option value="SOFTWARE">Software</option>
          <option value="NETWORK">Réseau</option>
          <option value="ACCESS_REQUEST">Demande d'accès</option>
          <option value="SECURITY">Sécurité</option>
        </select>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600 text-sm">error</span>
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-6">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button onClick={fetchTickets} className="mt-3 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            Réessayer
          </button>
        </div>
      )}

      {/* Ticket Table */}
      {tickets.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-gray-300">confirmation_number</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Aucun ticket trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Titre</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cat.</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priorité</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employé</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigné</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => {
                  const nextStatus = getNextStatus(ticket.status);
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="font-medium text-gray-900 hover:text-[#003366] transition-colors text-left"
                        >
                          {ticket.title}
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{ticket.category || '—'}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[ticket.status]}`}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{ticket.employeeUsername}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ticket.assignedToUsername || <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {ticket.status === 'OPEN' && (
                            <button
                              onClick={() => handleAssign(ticket.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#003366] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
                            >
                              S'assigner
                            </button>
                          )}
                          {nextStatus && (
                            <button
                              onClick={() => handleStatusChange(ticket.id, nextStatus)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#003366] hover:bg-[#002244] transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
                            >
                              → {STATUS_LABELS[nextStatus]}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
