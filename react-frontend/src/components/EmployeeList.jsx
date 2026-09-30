import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllUsers, deleteUser } from '../services/keycloakUserService';
import { getAllDepartments } from '../services/departmentService';
import { getToken } from "../services/tokenStore";

export default function EmployeeList() {
  console.log('EmployeeList monté');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      console.log('Chargement des employés depuis auth-service...');
      const token = await getToken();
      const users = await getAllUsers(token);
      console.log('Employés chargés:', users);
      setEmployees(users);
    } catch (err) {
      console.error("Erreur de chargement des employés:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        console.log('Début du chargement des données...');
        const token = await getToken();
        const [users, departmentsData] = await Promise.all([
          getAllUsers(token),
          getAllDepartments()
        ]);
        console.log('Données reçues:', { users, departments: departmentsData });
        if (isMounted) {
          setEmployees(users);
          setDepartments(departmentsData);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Erreur de chargement des données:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : `Dept #${departmentId}`;
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      try {
        const token = await getToken();
        await deleteUser(userId, token);
        fetchEmployees();
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la suppression de l\'employé');
      }
    }
  };

  return (
    <div>
      {/* Header avec Bouton Ajouter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Employee Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and view all active team members in your organization.</p>
        </div>
        <Link
          to="/add-employee"
          className="px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 w-fit hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Employee
        </Link>
      </div>

      {/* Tableau des Employés */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-300">hourglass_empty</span>
            </div>
            <p className="text-sm font-medium">Chargement...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-300">group_off</span>
            </div>
            <p className="text-sm font-medium">Aucun employé trouvé pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Username</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Position</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-all duration-200">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{emp.username}</td>
                    <td className="py-4 px-6 text-gray-600">{emp.email}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {emp.attributes?.position?.[0] || '-'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {emp.attributes?.phone?.[0] || '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/edit-employee/${emp.id}`)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:scale-[1.1] active:scale-[0.95] transition-transform duration-150"
                          title="Edit employee"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-[1.1] active:scale-[0.95] transition-transform duration-150"
                          title="Delete employee"
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