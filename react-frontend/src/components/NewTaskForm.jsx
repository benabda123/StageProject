import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTask, updateTask, getTaskById, getEmployees } from '../services/taskService';

export default function NewTaskForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    employeeId: '',
    priority: 'MEDIUM',
    dueDate: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loading, setLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const data = await getEmployees();
        setEmployees(data);
        setEmployeeError(null);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setEmployeeError('Impossible de charger les employés. Veuillez réessayer.');
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const fetchTask = async () => {
        try {
          setLoading(true);
          const data = await getTaskById(id);
          setFormData({
            title: data.title || '',
            description: data.description || '',
            employeeId: data.employee_id || '',
            priority: data.priority || 'MEDIUM',
            dueDate: data.due_date ? data.due_date.split('T')[0] : ''
          });
        } catch (err) {
          console.error('Error fetching task:', err);
          alert('Erreur lors du chargement de la tâche');
          navigate('/tasks');
        } finally {
          setLoading(false);
        }
      };

      fetchTask();
    }
  }, [id, isEditMode, navigate]);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'title': {
        const trimmed = value.trim();
        if (!trimmed) {
          error = 'Le titre est obligatoire.';
        } else if (trimmed.length < 3) {
          error = 'Le titre doit contenir au moins 3 caractères.';
        }
        break;
      }
      case 'employeeId': {
        if (!value) {
          error = "L'employé assigné est obligatoire.";
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
      setLoading(true);
      
      const selectedEmployee = employees.find(emp => String(emp.id) === String(formData.employeeId));
      const employeeUsername = selectedEmployee ? selectedEmployee.username : '';

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        employeeId: formData.employeeId,
        employeeUsername: employeeUsername,
        priority: formData.priority,
        dueDate: formData.dueDate || null   // null si vide — PostgreSQL rejette les string vides pour une colonne date
      };

      if (isEditMode) {
        await updateTask(id, taskData);
      } else {
        await createTask(taskData);
      }

      navigate('/tasks');
    } catch (err) {
      console.error('Error saving task:', err);
      alert(isEditMode ? 'Erreur lors de la modification de la tâche' : 'Erreur lors de la création de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    const hasError = touched[fieldName] && errors[fieldName];
    const baseStyle = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-[#111c2d] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 transition";
    const borderStyle = hasError
      ? "border-red-500 focus:ring-red-200 focus:border-red-500"
      : "border-gray-200 focus:border-[#003366] focus:ring-[#003366]/10";

    return `${baseStyle} ${borderStyle}`;
  };

  const isFormInvalid = Object.keys(validateForm()).length > 0;

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-gray-300">hourglass_empty</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Chargement de la tâche...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Tasks</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">{isEditMode ? 'Edit Task' : 'Add New Task'}</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">{isEditMode ? 'Edit Task' : 'Create New Task'}</h2>
        <p className="text-sm text-gray-500 mt-1">{isEditMode ? 'Update task details and assignments' : 'Fill in the details to create a new task'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Task Details */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-[#003366] rounded-xl">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Task Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                placeholder="e.g., Complete monthly report"
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle('title')}
                required
              />
              {touched.title && errors.title && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle('priority')}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Assigned To <span className="text-red-500">*</span>
              </label>
              {loadingEmployees ? (
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                  Chargement des employés...
                </div>
              ) : employeeError ? (
                <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {employeeError}
                </div>
              ) : employees.length === 0 ? (
                <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
                  Aucun employé disponible.
                </div>
              ) : (
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputStyle('employeeId')}
                  required
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.username})
                    </option>
                  ))}
                </select>
              )}
              {touched.employeeId && errors.employeeId && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.employeeId}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Due Date
              </label>
              <input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle('dueDate')}
              />
            </div>
          </div>

          <div className="space-y-1 mt-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Task description..."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={4}
              className={getInputStyle('description')}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (Object.keys(touched).length > 0 && isFormInvalid)}
            className={`px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 ${
              loading || (Object.keys(touched).length > 0 && isFormInvalid)
                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                : 'bg-[#003366] hover:bg-[#002244] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  {isEditMode ? 'save' : 'add'}
                </span>
                {isEditMode ? 'Update Task' : 'Create Task'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
