import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketDetails, addComment, closeTicket } from '../services/ticketService';

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

const CATEGORY_ICONS = {
  HARDWARE: 'memory',
  SOFTWARE: 'apps',
  NETWORK: 'wifi',
  ACCESS_REQUEST: 'lock_open',
  SECURITY: 'shield',
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState(null);
  const commentsEndRef = useRef(null);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTicketDetails(id);
      setTicket(data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError(err.response?.status === 403 ? 'Accès refusé' : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (ticket?.comments?.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.comments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      setSending(true);
      setActionError(null);
      await addComment(id, comment.trim());
      setComment('');
      await fetchTicket();
    } catch (err) {
      console.error('Error adding comment:', err);
      setActionError(err.response?.data?.error || 'Erreur lors de l\'ajout du commentaire');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    try {
      setActionError(null);
      await closeTicket(id);
      await fetchTicket();
    } catch (err) {
      console.error('Error closing ticket:', err);
      setActionError(err.response?.data?.error || 'Erreur lors de la fermeture');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-gray-300">hourglass_empty</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Chargement du ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-red-400">{error === 'Accès refusé' ? 'lock' : 'error'}</span>
        </div>
        <p className="text-sm font-medium text-red-700">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
          Retour
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';

  return (
    <div>
      {/* Breadcrumb + Back */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] font-medium transition-colors mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Retour
        </button>
      </div>

      {/* Ticket Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300 p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#001e40] tracking-tight mb-2">{ticket.title}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[ticket.status]}`}>
                {STATUS_LABELS[ticket.status]}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[ticket.priority]}`}>
                {ticket.priority}
              </span>
              {ticket.category && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
                  <span className="material-symbols-outlined text-sm">{CATEGORY_ICONS[ticket.category] || 'help'}</span>
                  {ticket.category}
                </span>
              )}
            </div>
          </div>

          {/* Close button for creator when RESOLVED */}
          {isResolved && (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Confirmer la fermeture
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed mb-6">{ticket.description}</p>

        {/* Meta info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Créé par</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">person</span>
              {ticket.employeeUsername}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Assigné à</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">support_agent</span>
              {ticket.assignedToUsername || <span className="text-gray-400 italic">Non assigné</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Créé le</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(ticket.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Mis à jour</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(ticket.updatedAt)}</p>
          </div>
        </div>

        {ticket.attachmentUrl && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Pièce jointe</p>
            {ticket.attachmentUrl.startsWith('data:image') ? (
              <a href={ticket.attachmentUrl} download={`ticket-${ticket.id}.jpg`} target="_blank" rel="noopener noreferrer">
                <img
                  src={ticket.attachmentUrl}
                  alt="Pièce jointe"
                  className="max-h-64 rounded-xl border border-gray-200 shadow-sm object-contain hover:shadow-md transition-shadow duration-200 cursor-pointer"
                />
              </a>
            ) : (
              <a href={ticket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#003366] hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">attach_file</span>
                {ticket.attachmentUrl}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-8">
        <h3 className="text-lg font-bold text-[#001e40] mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">forum</span>
          Commentaires ({ticket.comments?.length || 0})
        </h3>

        {actionError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-sm">error</span>
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {ticket.comments && ticket.comments.length > 0 ? (
            ticket.comments.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#003366] text-white flex items-center justify-center text-xs font-bold">
                    {(c.authorUsername || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.authorUsername}</p>
                    <p className="text-xs text-gray-500">{formatDate(c.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 ml-10">{c.message}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Aucun commentaire</p>
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Add comment form */}
        {!isClosed ? (
          <form onSubmit={handleAddComment} className="flex gap-3">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all duration-200"
            />
            <button
              type="submit"
              disabled={sending || !comment.trim()}
              className="px-5 py-3 rounded-xl text-white text-sm font-semibold bg-[#003366] hover:bg-[#002244] shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              Envoyer
            </button>
          </form>
        ) : (
          <div className="text-center py-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">lock</span>
              Ce ticket est fermé, les commentaires sont désactivés
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
