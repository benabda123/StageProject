import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateLeavePDF } from "../utils/leavePDFGenerator";
import { getToken } from "../services/tokenStore";
import { useAuth } from "../contexts/AuthContext";

const API_URL = 'http://localhost:8000/leaves';

export default function MyLeaves() {
  console.log('MyLeaves component mounted');
  const { tokenParsed } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Fetching leaves...');
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error('Erreur chargement congés:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente': return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
      case 'accepte': return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
      case 'refuse': return 'bg-red-500/15 text-red-300 border-red-400/30';
      default: return 'bg-white/10 text-white/70 border-white/15';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'accepte': return 'Accepté';
      case 'refuse': return 'Refusé';
      default: return status;
    }
  };

  const handleDownloadPDF = (leave) => {
    const employeeInfo = {
      firstName: tokenParsed?.given_name || 'Employé',
      lastName: tokenParsed?.family_name || '',
      username: tokenParsed?.preferred_username || tokenParsed?.sub || 'user'
    };
    
    generateLeavePDF(leave, employeeInfo);
  };


  if (loading) {
    return (
      <div className="p-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-white/40">hourglass_empty</span>
        </div>
        <p className="text-sm text-white/60 font-medium text-center">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-2">
          <span>Leaves</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-violet-300">My Leaves</span>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">My Leave Requests</h2>
          <Link
            to="/new-leave"
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nouvelle demande
          </Link>
        </div>
        <p className="text-sm text-white/60 mt-1">View and manage your leave request history.</p>
      </div>

      {leaves.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">event_busy</span>
          </div>
          <p className="text-sm font-medium text-white/70">Aucune demande de congé</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Date de début
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Date de fin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-white/[0.04] transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap capitalize font-medium text-white">
                      {leave.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/70">
                      {new Date(leave.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/70">
                      {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.status)}`}>
                        {getStatusLabel(leave.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                      {leave.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          console.log('Bouton PDF cliqué pour leave:', leave);
                          handleDownloadPDF(leave);
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200 flex items-center gap-1 hover:scale-[1.05] active:scale-[0.95] transition-transform duration-150"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Télécharger
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
