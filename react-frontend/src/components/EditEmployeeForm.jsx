import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, updateUser } from '../services/keycloakUserService';
import { getAllDepartments } from '../services/departmentService';
import { getToken } from '../services/tokenStore';

export default function EditEmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    departmentId: '',
    firstName: '',
    lastName: '',
    position: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState(null);

  const nameRegex = /^[a-zA-Zà-ÿÀ-Ÿ\s-]+$/;
  const phoneDigitsRegex = /^\d{8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Charger les départements au montage
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

  // Charger les données de l'employé au montage
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const token = await getToken();
        const data = await getUser(id, token);

        // Les attributs Keycloak sont renvoyés sous forme de tableaux
        const attrs = data.attributes || {};

        // Extraire uniquement les 8 derniers chiffres si le téléphone contient "+216"
        let cleanPhone = Array.isArray(attrs.phone) ? attrs.phone[0] || '' : attrs.phone || '';
        if (cleanPhone.includes('+216')) {
          cleanPhone = cleanPhone.replace('+216', '').replace(/\s/g, '');
        }

        setFormData({
          departmentId: Array.isArray(attrs.departmentId) ? String(attrs.departmentId[0] || '') : String(attrs.departmentId || ''),
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          position: Array.isArray(attrs.position) ? attrs.position[0] || '' : attrs.position || '',
          phone: cleanPhone,
          email: data.email || '',
        });
      } catch (err) {
        console.error('Erreur chargement employé:', err);
        alert('Impossible de charger les informations de cet employé.');
        navigate('/employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, navigate]);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'firstName':
      case 'lastName': {
        const trimmed = value.trim();
        const label = name === 'firstName' ? 'Prénom' : 'Nom';
        if (!trimmed) {
          error = `Le ${label.toLowerCase()} est obligatoire.`;
        } else if (trimmed.length < 2) {
          error = `Le ${label.toLowerCase()} doit contenir au moins 2 caractères.`;
        } else if (!nameRegex.test(trimmed)) {
          error = `Le ${label.toLowerCase()} ne doit contenir que des lettres, espaces ou tirets.`;
        }
        break;
      }
      case 'position': {
        const trimmed = value.trim();
        if (!trimmed) {
          error = 'Le poste est obligatoire.';
        } else if (trimmed.length < 2) {
          error = 'Le poste doit contenir au moins 2 caractères.';
        }
        break;
      }
      case 'departmentId': {
        if (!value) {
          error = "Le département est obligatoire.";
        }
        break;
      }
      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) {
          error = "L'email est obligatoire.";
        } else if (!emailRegex.test(trimmed)) {
          error = 'Veuillez saisir un email valide.';
        }
        break;
      }
      case 'phone': {
        const trimmed = value.trim();
        if (!trimmed) {
          error = 'Le numéro de téléphone est obligatoire.';
        } else if (!phoneDigitsRegex.test(trimmed)) {
          error = 'Veuillez saisir exactement 8 chiffres après +216.';
        }
        break;
      }
      default:
        break;
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

  const handleChange = (e) => {
    const { name, value } = e.target;

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
      await updateUser(id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        position: formData.position.trim(),
        departmentId: formData.departmentId,
        phone: formattedPhone,
      }, token);

      navigate('/employees');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification de l'employé");
    }
  };

  const getInputStyle = (fieldName) => {
    const hasError = touched[fieldName] && errors[fieldName];
    const baseStyle = 'w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border rounded-lg outline-none text-sm font-normal transition shadow-sm px-4';
    const borderStyle = hasError
      ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500'
      : 'border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600';

    return `${baseStyle} ${borderStyle}`;
  };

  const isFormInvalid = Object.keys(validateForm()).length > 0;

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <span className="material-symbols-outlined text-4xl animate-spin mb-2 text-[#003366]">sync</span>
        <p className="text-sm font-medium">Chargement des données de l'employé...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Employees</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">Edit Employee #{id}</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40]">Edit Employee Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Update the employee information and save changes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section 1: Personal Details */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
              <span className="material-symbols-outlined">person</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">First Name</label>
              <input
                name="firstName"
                type="text"
                placeholder="e.g. Alexander"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle('firstName')}
              />
              {touched.firstName && errors.firstName && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Last Name</label>
              <input
                name="lastName"
                type="text"
                placeholder="e.g. Pierce"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle('lastName')}
              />
              {touched.lastName && errors.lastName && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Professional Details */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Professional Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Department</label>
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
                  Aucun département disponible. Veuillez d'abord créer un département.
                </div>
              ) : (
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputStyle('departmentId')}
                >
                  <option value="">Sélectionner un département</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
              {touched.departmentId && errors.departmentId && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.departmentId}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Position / Job Title</label>
              <input
                name="position"
                type="text"
                placeholder="e.g. Senior Software Architect"
                value={formData.position}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle('position')}
              />
              {touched.position && errors.position && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.position}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Contact Info */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
              <span className="material-symbols-outlined">contact_mail</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Contact Info</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Email</label>
              <input
                name="email"
                type="email"
                placeholder="e.g. alexander@keystone.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle('email')}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-semibold text-sm select-none">
                  +216
                </span>
                <input
                  name="phone"
                  type="tel"
                  placeholder="12 345 678"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${getInputStyle('phone')} pl-14`}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={Object.keys(touched).length > 0 && isFormInvalid}
            className={`px-8 py-2.5 rounded-lg text-white text-sm font-semibold shadow-md transition flex items-center gap-2 ${
              Object.keys(touched).length > 0 && isFormInvalid
                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                : 'bg-[#003366] hover:bg-[#002244]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}