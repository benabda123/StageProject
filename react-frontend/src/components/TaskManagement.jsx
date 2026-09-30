import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTasks, deleteTask, getEmployees } from '../services/taskService';

const STATUS_COLORS = {
  TODO: 'bg-gray-50 text-gray-700 border-gray-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  DONE: 'bg-green-50 text-green-700 border-green-200'
};

const PRIORITY_COLORS = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  LOW: 'bg-gray-50 text-gray-700 border-gray-200'
};

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', employeeId: '' });
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.employeeId) params.employeeId = filters.employeeId;
      const data = await getAllTasks(params);
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [filters]);

  const handleDelete = async (taskId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await deleteTask(taskId);
        fetchTasks();
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Erreur lors de la suppression de la tâche');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
  };

  return (
    <div>
      {/* Header avec Bouton Ajouter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Task Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and view all tasks in your organization</p>
        </div>
        <button
          onClick={() => navigate('/add-task')}
          className="px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 w-fit hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Filter by Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]"
            >
              <option value="">All Statuses</option>
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="DONE">Terminée</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Filter by Employee
            </label>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="w-full py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des Tâches */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-300">hourglass_empty</span>
            </div>
            <p className="text-sm font-medium">Chargement...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-red-300">error</span>
            </div>
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-300">task_alt</span>
            </div>
            <p className="text-sm font-medium">Aucune tâche trouvée pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Assigned To</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Priority</th>
                  <th className="py-4 px-6">Due Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-all duration-200">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {task.title}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {getEmployeeName(task.employee_id)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[task.status] || STATUS_COLORS.TODO}`}>
                        {task.status === 'TODO' ? 'À faire' : task.status === 'IN_PROGRESS' ? 'En cours' : 'Terminée'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.LOW}`}>
                        {task.priority || 'LOW'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {formatDate(task.due_date)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-[1.1] active:scale-[0.95] transition-transform duration-150"
                          title="Delete task"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
