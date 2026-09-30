import { useState, useEffect } from 'react';
import { getAllDepartments, createDepartment, deleteDepartment } from '../services/departmentService';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Fonction réutilisable pour rafraîchir la liste
  const loadData = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments from Kong Gateway.');
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial au montage du composant
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await getAllDepartments();
        if (isMounted) {
          setDepartments(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        if (isMounted) {
          setError('Failed to load departments from Kong Gateway.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Cleanup pour éviter les memory leaks
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createDepartment({ name, description });
      setName('');
      setDescription('');
      loadData();
    } catch (err) {
      console.error('Error creating department:', err);
      alert('Failed to create department');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment(id);
        loadData();
      } catch (err) {
        console.error('Error deleting department:', err);
        alert('Failed to delete department');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-[#001e40] tracking-tight">Departments Directory</h2>
        <p className="text-sm text-gray-500 mt-1">Manage company departments and units</p>
      </div>

      {/* Add Department Card */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300">
        <h3 className="text-base font-bold text-[#111c2d] mb-6">Add New Department</h3>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Widget 1 : Department Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Human Resources"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]"
                required
              />
            </div>

            {/* Widget 2 : Description */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g., Handles recruitment and staff administration"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-[#003366] focus:border-[#003366]"
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-[#003366] hover:bg-[#002244] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              Save Department
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,51,0.08)] transition-shadow duration-300 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-300">hourglass_empty</span>
            </div>
            <p className="text-sm font-medium">Loading departments...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-semibold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-gray-300">domain_disabled</span>
                      </div>
                      No departments found.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">#{dept.id}</td>
                      <td className="px-6 py-4 font-bold text-[#111c2d]">{dept.name}</td>
                      <td className="px-6 py-4 text-gray-500">{dept.description || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentList;