import { useRef, useState } from 'react';
import { getMyProfile, updateMyProfile, uploadMyAvatar } from '../services/profileService';

const isValidUrl = (value) => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function ProfileSettings({ profile, onClose, onProfileUpdate }) {
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const initials = (
    ((profile?.firstName || '')[0] || '') + ((profile?.lastName || '')[0] || '')
  ).toUpperCase() || (profile?.username || 'U')[0];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    setUploading(true);
    try {
      const res = await uploadMyAvatar(file);
      setAvatarUrl(res.data.avatarUrl);
      onProfileUpdate?.({ ...profile, avatarUrl: res.data.avatarUrl });
      setSuccess('Photo de profil mise à jour');
    } catch (err) {
      console.error('Upload avatar error:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const github = githubUrl.trim();
    const linkedin = linkedinUrl.trim();

    if (github && !isValidUrl(github)) {
      setError('Le lien GitHub doit être une URL valide (http:// ou https://)');
      return;
    }
    if (linkedin && !isValidUrl(linkedin)) {
      setError('Le lien LinkedIn doit être une URL valide (http:// ou https://)');
      return;
    }

    setSaving(true);
    try {
      const res = await updateMyProfile({ githubUrl: github, linkedinUrl: linkedin });
      onProfileUpdate?.(res.data);
      setSuccess('Profil enregistré');
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement du profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#001e40]">Mon profil</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-[#003366]/10 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#003366] to-[#00509e] text-white text-3xl font-bold flex items-center justify-center uppercase shadow-md">
                {initials}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-[#003366] hover:text-[#003366] hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">{uploading ? 'hourglass_top' : 'photo_camera'}</span>
              {uploading ? 'Upload en cours...' : 'Changer la photo'}
            </button>
            <p className="text-xs text-gray-400">JPG, PNG ou WEBP — 2 Mo maximum</p>
          </div>

          {/* Links */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Lien GitHub</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-lg">code</span>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/votre-nom"
                  className="w-full py-2.5 pl-10 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm pr-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Lien LinkedIn</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-lg">work</span>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/votre-nom"
                  className="w-full py-2.5 pl-10 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm pr-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#003366] text-white font-semibold hover:bg-[#002244] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
