import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../services/keycloakUserService';
import { getAllDepartments } from '../services/departmentService';
import { getToken } from '../services/tokenStore';
import { parseCV } from '../services/cvParserService';

// ─── Composant badge "Extrait du CV" ─────────────────────────────────────────
function CvBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-200 ml-2">
      <span className="material-symbols-outlined text-xs" style={{ fontSize: '12px' }}>
        document_scanner
      </span>
      Extrait du CV
    </span>
  );
}

// ─── Zone de scan CV ─────────────────────────────────────────────────────────
function CvScanZone({ onExtracted, onError, onClear, hasExtracted }) {
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Vérification taille côté client (avant même l'envoi)
    if (file.size > 5 * 1024 * 1024) {
      onError('Fichier trop volumineux. La taille maximale est 5 Mo.');
      return;
    }

    // Vérification extension côté client
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      onError(
        ext === 'doc'
          ? 'Format .doc non supporté. Convertissez en .docx et réessayez.'
          : 'Seuls les fichiers .pdf et .docx sont acceptés.'
      );
      return;
    }

    setFileName(file.name);
    setScanning(true);
    onError(null);

    try {
      const result = await parseCV(file);
      onExtracted(result);
    } catch (err) {
      onError(err.message || 'Erreur lors de l\'analyse du CV');
      setFileName(null);
    } finally {
      setScanning(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset l'input pour permettre de re-sélectionner le même fichier
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    setFileName(null);
    onClear();
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
          <span className="material-symbols-outlined">document_scanner</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Scanner un CV</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Déposez un PDF ou DOCX — les champs seront pré-remplis automatiquement via IA
          </p>
        </div>
        {hasExtracted && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            Effacer les données extraites
          </button>
        )}
      </div>

      {/* Zone drag & drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !scanning && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-[#003366] bg-blue-50'
            : scanning
            ? 'border-blue-300 bg-blue-50/50 cursor-wait'
            : hasExtracted
            ? 'border-green-300 bg-green-50/50'
            : 'border-gray-300 hover:border-[#003366] hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleInputChange}
          className="hidden"
        />

        {scanning ? (
          /* État : scan en cours */
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-10 h-10 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-sm font-semibold text-[#003366]">Analyse du CV en cours…</p>
              <p className="text-xs text-gray-500 mt-0.5">{fileName}</p>
            </div>
            <p className="text-xs text-gray-400">Gemini AI extrait les informations</p>
          </div>
        ) : hasExtracted ? (
          /* État : extraction réussie */
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
            <p className="text-sm font-semibold text-green-700">CV analysé avec succès</p>
            <p className="text-xs text-gray-500">{fileName} — Cliquez pour scanner un autre CV</p>
          </div>
        ) : (
          /* État : initial */
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-2xl">upload_file</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Glissez-déposez un CV ici ou{' '}
                <span className="text-[#003366] underline">parcourez</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF ou DOCX · max 5 Mo</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Composant principal EmployeeForm ─────────────────────────────────────────
export default function EmployeeForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    position: '',
    phone: '',
    departmentId: '',
  });

  // Champs pré-remplis par le CV — pour afficher le badge
  const [cvFilledFields, setCvFilledFields] = useState(new Set());

  // Compétences extraites — affichage informatif uniquement
  const [extractedSkills, setExtractedSkills] = useState([]);

  // État scan CV
  const [cvExtracted, setCvExtracted] = useState(false);
  const [cvError, setCvError] = useState(null);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState(null);

  const nameRegex = /^[a-zA-Zà-ÿÀ-Ÿ\s-]+$/;
  const phoneDigitsRegex = /^\d{8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const data = await getAllDepartments();
        setDepartments(data);
        setDepartmentError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des départements:', err);
        setDepartmentError('Impossible de charger les départements. Veuillez réessayer.');
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // ── Callback : extraction CV réussie ────────────────────────────────────────
  const handleCvExtracted = (extracted) => {
    const filled = new Set();

    // Pré-remplir uniquement les champs non-vides retournés par Gemini
    const updates = {};

    if (extracted.firstName) {
      updates.firstName = extracted.firstName;
      filled.add('firstName');
    }
    if (extracted.lastName) {
      updates.lastName = extracted.lastName;
      filled.add('lastName');
    }
    if (extracted.position) {
      updates.position = extracted.position;
      filled.add('position');
    }
    if (extracted.email) {
      updates.email = extracted.email;
      filled.add('email');
    }
    if (extracted.phone) {
      // Nettoyer le numéro : garder uniquement les 8 derniers chiffres pour le champ +216
      const digits = extracted.phone.replace(/\D/g, '');
      const last8 = digits.slice(-8);
      if (last8.length >= 6) {
        updates.phone = last8;
        filled.add('phone');
      }
    }

    setFormData((prev) => ({ ...prev, ...updates }));
    setCvFilledFields(filled);
    setCvExtracted(true);
    setCvError(null);

    // Skills — juste informatif, pas dans le formData
    setExtractedSkills(extracted.skills || []);
  };

  // ── Callback : effacer les données extraites ─────────────────────────────────
  const handleCvClear = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      position: '',
      phone: '',
      departmentId: '',
    });
    setCvFilledFields(new Set());
    setExtractedSkills([]);
    setCvExtracted(false);
    setCvError(null);
    setErrors({});
    setTouched({});
  };

  // ── Quand l'admin modifie manuellement un champ, le badge disparaît ─────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Supprimer le badge "Extrait du CV" pour ce champ si l'admin le modifie
    if (cvFilledFields.has(name)) {
      setCvFilledFields((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }

    if (name === 'phone') {
      const onlyDigits = value.replace(/\D/g, '').slice(0, 8);
      setFormData((prev) => ({ ...prev, phone: onlyDigits }));
      if (touched.phone) {
        setErrors((prev) => ({ ...prev, phone: validateField('phone', onlyDigits) }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'username': {
        const t = value.trim();
        if (!t) error = 'Le username est obligatoire.';
        else if (t.length < 3) error = 'Le username doit contenir au moins 3 caractères.';
        else if (!usernameRegex.test(t)) error = 'Lettres, chiffres et underscores uniquement.';
        break;
      }
      case 'email': {
        const t = value.trim();
        if (!t) error = "L'email est obligatoire.";
        else if (!emailRegex.test(t)) error = 'Email invalide.';
        break;
      }
      case 'password': {
        if (!value) error = 'Le mot de passe est obligatoire.';
        else if (value.length < 6) error = 'Le mot de passe doit contenir au moins 6 caractères.';
        break;
      }
      case 'firstName':
      case 'lastName': {
        const t = value.trim();
        const label = name === 'firstName' ? 'prénom' : 'nom';
        if (!t) error = `Le ${label} est obligatoire.`;
        else if (t.length < 2) error = `Le ${label} doit contenir au moins 2 caractères.`;
        else if (!nameRegex.test(t)) error = `Le ${label} ne doit contenir que des lettres.`;
        break;
      }
      case 'position': {
        const t = value.trim();
        if (!t) error = 'Le poste est obligatoire.';
        else if (t.length < 2) error = 'Le poste doit contenir au moins 2 caractères.';
        break;
      }
      case 'departmentId': {
        if (!value) error = 'Le département est obligatoire.';
        break;
      }
      case 'phone': {
        const t = value.trim();
        if (!t) error = 'Le numéro est obligatoire.';
        else if (!phoneDigitsRegex.test(t)) error = 'Saisissez exactement 8 chiffres après +216.';
        break;
      }
      default: break;
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    const formErrors = validateForm();
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    try {
      const formattedPhone = `+216 ${formData.phone.slice(0, 2)} ${formData.phone.slice(2, 5)} ${formData.phone.slice(5)}`;
      const token = await getToken();
      await createUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        position: formData.position.trim(),
        phone: formattedPhone,
        departmentId: formData.departmentId,
      }, token);
      navigate('/employees');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'employé: " + err.message);
    }
  };

  const getInputStyle = (fieldName) => {
    const hasError = touched[fieldName] && errors[fieldName];
    const isCvFilled = cvFilledFields.has(fieldName);
    const base = 'w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border rounded-lg outline-none text-sm font-normal transition shadow-sm px-4';
    const border = hasError
      ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500'
      : isCvFilled
      ? 'border-blue-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-blue-50/40'
      : 'border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600';
    return `${base} ${border}`;
  };

  const isFormInvalid = Object.keys(validateForm()).length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Employees</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">Add New Employee</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Onboard New Team Member</h2>
        <p className="text-sm text-gray-500 mt-1">
          Scannez un CV pour pré-remplir le formulaire, ou remplissez-le manuellement.
        </p>
      </div>

      {/* Zone scan CV */}
      <CvScanZone
        onExtracted={handleCvExtracted}
        onError={setCvError}
        onClear={handleCvClear}
        hasExtracted={cvExtracted}
      />

      {/* Bandeau d'erreur CV */}
      {cvError && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="material-symbols-outlined text-red-500 shrink-0">error</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Erreur d'analyse</p>
            <p className="text-sm text-red-600 mt-0.5">{cvError}</p>
            <p className="text-xs text-red-500 mt-1">
              Vous pouvez continuer en remplissant le formulaire manuellement.
            </p>
          </div>
          <button onClick={() => setCvError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Encart Skills (affiché si des compétences ont été extraites) */}
      {extractedSkills.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="material-symbols-outlined text-blue-600 text-base">psychology</span>
            <p className="text-sm font-semibold text-blue-800">
              Compétences détectées dans le CV
            </p>
            <span className="text-xs text-blue-500">(informatif — non lié à un champ)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {extractedSkills.map((skill, i) => (
              <span key={i}
                className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-semibold text-blue-700 shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* Section 1: Personal Details */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
              <span className="material-symbols-outlined">person</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Username */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Username</label>
              <input name="username" type="text" placeholder="e.g. alexander_pierce"
                value={formData.username} onChange={handleChange} onBlur={handleBlur}
                className={getInputStyle('username')} />
              {touched.username && errors.username && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>{errors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Email
                {cvFilledFields.has('email') && <CvBadge />}
              </label>
              <input name="email" type="email" placeholder="e.g. alexander@example.com"
                value={formData.email} onChange={handleChange} onBlur={handleBlur}
                className={getInputStyle('email')} />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>{errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Password</label>
              <input name="password" type="password" placeholder="Mot de passe"
                value={formData.password} onChange={handleChange} onBlur={handleBlur}
                className={getInputStyle('password')} />
              {touched.password && errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>{errors.password}
                </p>
              )}
            </div>

            {/* First Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                First Name
                {cvFilledFields.has('firstName') && <CvBadge />}
              </label>
              <input name="firstName" type="text" placeholder="e.g. Alexander"
                value={formData.firstName} onChange={handleChange} onBlur={handleBlur}
                className={getInputStyle('firstName')} />
              {touched.firstName && errors.firstName && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>{errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Last Name
                {cvFilledFields.has('lastName') && <CvBadge />}
              </label>
              <input name="lastName" type="text" placeholder="e.g. Pierce"
                value={formData.lastName} onChange={handleChange} onBlur={handleBlur}
                className={getInputStyle('lastName')} />
              {touched.lastName && errors.lastName && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>{errors.lastName}
                </p>
              )}
            </div>

          </div>
        </section>

        {/* Section 2: Professional Details */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Professional Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Department — TOUJOURS manuel, jamais auto-rempli depuis le CV */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Department
                <span className="ml-2 text-xs font-normal text-gray-400">(à choisir manuellement)</span>
              </label>
              {loadingDepartments ? (
                <div className="w-full py-2.5 bg-gray-50 border border-gray-300 rounded-lg px-4 text-sm text-gray-500">
                  Chargement des départements...
                </div>
              ) : departmentError ? (
                <div className="w-full py-2.5 bg-red-50 border border-red-300 rounded-lg px-4 text-sm text-red-600">
                  {departmentError}
                </div>
              ) : departments.length === 0 ? (
                <div className="w-full py-2.5 bg-yellow-50 border border-yellow-300 rounded-lg px-4 text-sm text-yellow-700">
                  Aucun département disponible.
                </div>
              ) : (
                <select name="departmentId" value={formData.departmentId}
                  onChange={handleChange} onBlur={handleBlur}
                  className={getInputStyle('departmentId')}>
                  <option value="">Sélectionner un département</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              )}
              {touched.departmentId && errors.departmentId && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>{errors.departmentId}
                </p>
              )}
            </div>

            {/* Position */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">
                Position / Job Title
                {cvFilledFields.has('position') && <CvBadge />}
              </label>
              <input name="position" type="text" placeholder="e.g. Senior Software Architect"
                value={formData.position} onChange={handleChange} onBlur={handleBlur}
                className={getInputStyle('position')} />
              {touched.position && errors.position && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>{errors.position}
                </p>
              )}
            </div>

          </div>
        </section>

        {/* Section 3: Contact Info */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
              <span className="material-symbols-outlined">contact_mail</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Contact Info</h3>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600">
              Phone Number
              {cvFilledFields.has('phone') && <CvBadge />}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-semibold text-sm select-none">
                +216
              </span>
              <input name="phone" type="tel" placeholder="12 345 678"
                value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                className={`${getInputStyle('phone')} pl-14`} />
            </div>
            {touched.phone && errors.phone && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">warning</span>{errors.phone}
              </p>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate('/employees')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
            Cancel
          </button>
          <button type="submit"
            disabled={Object.keys(touched).length > 0 && isFormInvalid}
            className={`px-8 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 ${
              Object.keys(touched).length > 0 && isFormInvalid
                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                : 'bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98]'
            }`}>
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add Employee
          </button>
        </div>

      </form>
    </div>
  );
}
