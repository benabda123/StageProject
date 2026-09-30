import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, analyzeImage } from '../services/ticketService';

const CATEGORIES = [
  { value: 'HARDWARE', label: 'Hardware', icon: 'memory' },
  { value: 'SOFTWARE', label: 'Software', icon: 'apps' },
  { value: 'NETWORK', label: 'Réseau', icon: 'wifi' },
  { value: 'ACCESS_REQUEST', label: "Demande d'accès", icon: 'lock_open' },
  { value: 'SECURITY', label: 'Sécurité', icon: 'shield' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Basse', icon: 'arrow_downward', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'MEDIUM', label: 'Moyenne', icon: 'remove', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
  { value: 'HIGH', label: 'Haute', icon: 'arrow_upward', color: 'bg-red-50 text-red-700 border-red-300' },
];

// Resize image client-side to keep payload small
function resizeImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function NewTicketForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'SOFTWARE',
    priority: 'MEDIUM',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attachmentData, setAttachmentData] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const fileInputRef = useRef(null);

  const getInputStyle = () => {
    return "w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600";
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAnalyzeImage = async () => {
    if (!attachmentData) return;
    setError(null);
    setAiResult(null);
    try {
      setAnalyzing(true);
      const result = await analyzeImage(attachmentData);
      setAiResult(result);
      // Auto-fill form with AI results
      setForm({
        ...form,
        title: result.title || form.title,
        description: result.description || form.description,
        category: result.category || form.category,
        priority: result.priority || form.priority,
      });
    } catch (err) {
      console.error('AI analysis error:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'analyse IA');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.description.trim()) {
      setError('Le titre et la description sont obligatoires');
      return;
    }

    try {
      setSubmitting(true);
      await createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        attachmentUrl: attachmentData || undefined,
      });
      navigate('/my-tickets');
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err.response?.data?.error || 'Erreur lors de la création du ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Support</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">Nouveau Ticket</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Nouvelle demande de support</h2>
        <p className="text-sm text-gray-500 mt-1">Décrivez votre problème IT et un membre du support vous répondra</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section: Ticket Details */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
              <span className="material-symbols-outlined">confirmation_number</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Détails du ticket</h3>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Titre *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: Imprimante bloquée au 3ème étage"
                className={getInputStyle()}
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Catégorie</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.value })}
                    className={`flex flex-col items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                      form.category === cat.value
                        ? 'bg-blue-500/35 border-blue-400/80 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                        : 'bg-white/10 border-gray-300 hover:bg-white/15 hover:border-white/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Priorité</label>
              <div className="flex gap-3">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.value })}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      form.priority === p.value
                        ? 'border-blue-400/80 bg-blue-500/35 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                        : 'border-gray-300 text-gray-500 hover:bg-white/15 hover:border-white/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Décrivez votre problème en détail..."
                className={`${getInputStyle()} resize-none`}
              />
            </div>

            {/* Attachment Image */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Pièce jointe <span className="text-gray-400 font-normal">(image optionnelle)</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    // Show preview immediately
                    const reader = new FileReader();
                    reader.onload = (ev) => setAttachmentPreview(ev.target.result);
                    reader.readAsDataURL(file);
                    // Resize and convert to base64
                    resizeImage(file).then((base64) => setAttachmentData(base64));
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-[#003366] hover:text-[#003366] hover:bg-blue-50 transition-all duration-200 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                  Choisir une image
                </button>
                {attachmentPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentData(null);
                      setAttachmentPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all duration-200 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    Supprimer
                  </button>
                )}
              </div>
              {attachmentPreview && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={attachmentPreview}
                    alt="Aperçu"
                    className="max-h-40 rounded-xl border border-gray-200 shadow-sm object-contain"
                  />
                  <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                    Image prête
                  </div>
                </div>
              )}
              {/* AI Analyze Button */}
              {attachmentData && !analyzing && !aiResult && (
                <button
                  type="button"
                  onClick={handleAnalyzeImage}
                  className="mt-3 ml-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  Analyser avec IA
                </button>
              )}
              {analyzing && (
                <div className="mt-3 ml-4 flex items-center gap-2 text-sm text-purple-700">
                  <span className="material-symbols-outlined animate-spin">autorenew</span>
                  Analyse en cours...
                </div>
              )}
              {aiResult && (
                <div className="mt-3 ml-4 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-600 text-lg mt-0.5">check_circle</span>
                  <div className="text-xs">
                    <p className="font-semibold text-green-800 mb-1">Formulaire rempli automatiquement</p>
                    <p className="text-green-700">Confiance : <span className="font-semibold">{aiResult.confidence}</span></p>
                    <button
                      type="button"
                      onClick={() => setAiResult(null)}
                      className="mt-1 text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/my-tickets')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                : 'bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">send</span>
            {submitting ? 'Envoi en cours...' : 'Soumettre le ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
