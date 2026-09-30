import { useState, useEffect } from 'react';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../services/meetingService';

const EQUIPMENT_OPTIONS = ['Projecteur', 'Tableau blanc', 'TV', 'Visioconférence', 'Son', 'Microphone'];

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [equipment, setEquipment] = useState([]);

  const loadData = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEquipmentToggle = (item) => {
    setEquipment(prev => {
      if (prev.includes(item)) {
        return prev.filter(e => e !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const resetForm = () => {
    setName('');
    setCapacity('');
    setEquipment([]);
    setEditingRoom(null);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setName(room.name);
    setCapacity(room.capacity);
    setEquipment(room.equipment || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !capacity) return;

    try {
      const roomData = {
        name,
        capacity: parseInt(capacity),
        equipment
      };

      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData);
      } else {
        await createRoom(roomData);
      }

      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving room:', err);
      alert('Failed to save room');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await deleteRoom(id);
        loadData();
      } catch (err) {
        console.error('Error deleting room:', err);
        alert('Failed to delete room');
      }
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#003366] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-gray-500 font-medium">Chargement des salles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
          <span>Meetings</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#003366]">Room Management</span>
        </div>
        <h2 className="text-3xl font-bold text-[#001e40]">Room Management</h2>
        <p className="text-sm text-gray-500 mt-1">Manage meeting rooms and equipment</p>
      </div>

      {/* Add/Edit Room Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-[#111c2d] mb-6">
          {editingRoom ? 'Edit Room' : 'Add New Room'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Room Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Room Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Conference Room A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-[#111c2d] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 transition duration-150"
                required
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 10"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-[#111c2d] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/10 transition duration-150"
                required
              />
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Equipment
            </label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((item) => (
                <label
                  key={item}
                  className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition text-sm font-medium ${
                    equipment.includes(item)
                      ? 'border-blue-400/80 bg-blue-500/35 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                      : 'border-gray-200 bg-white/10 text-gray-700 hover:bg-white/15 hover:border-white/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={equipment.includes(item)}
                    onChange={() => handleEquipmentToggle(item)}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-sm align-middle mr-1">
                    {equipment.includes(item) ? 'check_circle' : 'circle'}
                  </span>
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {editingRoom && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-[#003366] hover:bg-[#002244] text-white font-semibold px-6 py-3 rounded-xl text-sm transition shadow-sm active:scale-[0.98]"
            >
              {editingRoom ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500 font-semibold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                      No rooms found.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">#{room.id}</td>
                      <td className="px-6 py-4 font-bold text-[#111c2d]">{room.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-gray-500">people</span>
                          {room.capacity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {room.equipment && room.equipment.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {room.equipment.map((item, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(room)}
                            className="px-3 py-1.5 text-xs font-medium text-[#003366] hover:bg-blue-50 rounded-lg transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(room.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            Delete
                          </button>
                        </div>
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
}
