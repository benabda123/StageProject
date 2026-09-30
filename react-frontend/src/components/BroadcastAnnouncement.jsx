import { useState, useEffect } from 'react';
import { broadcastNotification } from '../services/notificationService';
import { getAllDepartments } from '../services/departmentService';
import { getEmployees } from '../services/api';

export default function BroadcastAnnouncement() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'ALL',
    departmentId: '',
    userId: '',
    type: 'ANNOUNCEMENT'
  });
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDepartments();
    loadEmployees();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        target: formData.target,
        title: formData.title,
        message: formData.message,
        type: formData.type
      };

      if (formData.target === 'DEPARTMENT') {
        payload.departmentId = formData.departmentId;
      } else if (formData.target === 'USER') {
        payload.userId = formData.userId;
      }

      const result = await broadcastNotification(payload);
      const recipientCount = Array.isArray(result) ? result.length : 0;
      setSuccess(`Notification envoyée à ${recipientCount} destinataire(s)`);
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        target: 'ALL',
        departmentId: '',
        userId: '',
        type: 'ANNOUNCEMENT'
      });
    } catch (err) {
      console.error('Error broadcasting notification:', err);
      setError('Erreur lors de l\'envoi de la notification');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getInputStyle = () => {
    return "w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]";
  };

  const getSelectStyle = () => {
    return "w-full py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]";
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Admin</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">Notifications</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40]">Envoyer une annonce</h2>
        <p className="text-sm text-gray-500 mt-1">Diffusez des notifications aux employés</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600">check_circle</span>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600">error</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section: Notification Details */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
              <span className="material-symbols-outlined">campaign</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Détails de la notification</h3>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Titre *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={getInputStyle()}
                placeholder="Titre de la notification"
              />
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className={getInputStyle()}
                placeholder="Contenu de la notification"
              />
            </div>

            {/* Target */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Destinataires *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition ${formData.target === 'ALL' ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 border-gray-300 hover:bg-white/15 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="target"
                    value="ALL"
                    checked={formData.target === 'ALL'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-lg">groups</span>
                  <span className="text-sm font-medium">Tous</span>
                </label>

                <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition ${formData.target === 'DEPARTMENT' ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 border-gray-300 hover:bg-white/15 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="target"
                    value="DEPARTMENT"
                    checked={formData.target === 'DEPARTMENT'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-lg">corporate_fare</span>
                  <span className="text-sm font-medium">Département</span>
                </label>

                <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition ${formData.target === 'USER' ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/10 border-gray-300 hover:bg-white/15 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="target"
                    value="USER"
                    checked={formData.target === 'USER'}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-lg">person</span>
                  <span className="text-sm font-medium">Employé</span>
                </label>
              </div>
            </div>

            {/* Department Select */}
            {formData.target === 'DEPARTMENT' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Département *
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                  className={getSelectStyle()}
                >
                  <option value="">Sélectionner un département</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User Select */}
            {formData.target === 'USER' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600">
                  Employé *
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                  className={getSelectStyle()}
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Type */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Type de notification *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className={getSelectStyle()}
              >
                <option value="ANNOUNCEMENT">Annonce</option>
                <option value="SYSTEM">Système</option>
              </select>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-2.5 rounded-lg text-white text-sm font-semibold shadow-md transition flex items-center gap-2 ${
              loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#003366] hover:bg-[#002244]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">send</span>
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  );
}
