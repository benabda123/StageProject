import { useState, useEffect } from 'react';
import { getToken } from "../services/tokenStore";

const API_URL = 'http://localhost:8000/leaves';

export default function LeaveRequestsAdmin() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAllLeaves();
  }, [statusFilter]);

  const fetchAllLeaves = async () => {
    try {
      const token = await getToken();
      let url = API_URL;
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error('Erreur chargement demandes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchAllLeaves();
      }
    } catch (err) {
      console.error('Erreur approbation:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/${id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchAllLeaves();
      }
    } catch (err) {
      console.error('Erreur rejet:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'accepte': return 'bg-green-100 text-green-800';
      case 'refuse': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Leave Requests</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">Manage Requests</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40]">Leave Requests Management</h2>
        <p className="text-sm text-gray-500 mt-1">Review and approve or reject employee leave requests.</p>
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
            <span className="material-symbols-outlined">filter_list</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Filter Requests</h3>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-600">Filtrer par statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
          </select>
        </div>
      </div>

      {leaves.length === 0 ? (
        <div className="text-gray-500">Aucune demande de congé</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leave.employeeUsername}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {leave.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(leave.startDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                      {getStatusLabel(leave.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {leave.reason || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leave.status === 'en_attente' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(leave.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleReject(leave.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
