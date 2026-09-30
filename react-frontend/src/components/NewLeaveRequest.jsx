import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from "../services/tokenStore";

const API_URL = 'http://localhost:8000/leaves';

export default function NewLeaveRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'annuel',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation basique
    if (!formData.startDate || !formData.endDate) {
      setError('Les dates de début et de fin sont requises');
      setLoading(false);
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('La date de fin doit être supérieure ou égale à la date de début');
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate('/my-leaves');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la création de la demande');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = () => {
    return "w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600";
  };

  const getSelectStyle = () => {
    return "w-full py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600";
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Leaves</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">New Leave Request</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Submit Leave Request</h2>
        <p className="text-sm text-gray-500 mt-1">Fill in the details to submit your leave request for approval.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Section: Leave Details */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
              <span className="material-symbols-outlined">event</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Leave Details</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Type de congé</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className={`flex items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 ${formData.type === 'annuel' ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 border-gray-300 hover:bg-white/15 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="type"
                    value="annuel"
                    checked={formData.type === 'annuel'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-lg">beach_access</span>
                  <span className="text-sm font-medium">Annuel</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 ${formData.type === 'maladie' ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 border-gray-300 hover:bg-white/15 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="type"
                    value="maladie"
                    checked={formData.type === 'maladie'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-lg">medical_services</span>
                  <span className="text-sm font-medium">Maladie</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 ${formData.type === 'personnel' ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 border-gray-300 hover:bg-white/15 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="type"
                    value="personnel"
                    checked={formData.type === 'personnel'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-lg">person</span>
                  <span className="text-sm font-medium">Personnel</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 ${formData.type === 'sans_solde' ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 border-gray-300 hover:bg-white/15 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="type"
                    value="sans_solde"
                    checked={formData.type === 'sans_solde'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-lg">money_off</span>
                  <span className="text-sm font-medium">Sans solde</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">Date de début</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={getInputStyle()}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">Date de fin</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={getInputStyle()}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Motif (optionnel)</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="3"
                className={getInputStyle()}
                placeholder="Raison de votre demande..."
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/my-leaves')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 ${
              loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150'
            }`}
          >
            <span className="material-symbols-outlined text-lg">send</span>
            {loading ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </div>
      </form>
    </div>
  );
}
