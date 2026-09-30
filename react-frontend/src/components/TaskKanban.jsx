import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getMyTasks, updateTaskStatus } from '../services/taskService';

const COLUMNS = {
  TODO: { id: 'TODO', title: 'À faire' },
  IN_PROGRESS: { id: 'IN_PROGRESS', title: 'En cours' },
  DONE: { id: 'DONE', title: 'Terminée' }
};

const PRIORITY_COLORS = {
  HIGH: 'bg-red-500/15 text-red-300 border-red-400/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
  LOW: 'bg-white/10 text-white/70 border-white/15'
};

export default function TaskKanban() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragError, setDragError] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyTasks();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Si drop hors d'une colonne ou même colonne
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic update
    const taskToUpdate = tasks.find(t => t.id === taskId);
    const oldStatus = taskToUpdate.status;

    // Mettre à jour localement d'abord
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    setDragError(null);

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert sur erreur
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: oldStatus } : task
        )
      );
      setDragError('Failed to update task status. Please try again.');
      setTimeout(() => setDragError(null), 3000);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const truncateDescription = (description, maxLength = 100) => {
    if (!description) return '—';
    return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">hourglass_empty</span>
          </div>
          <p className="text-sm text-white/60 font-medium">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-red-300">error</span>
        </div>
        <p className="text-sm font-medium text-red-200">{error}</p>
        <button
          onClick={fetchTasks}
          className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Mes Tâches</h2>
        <p className="text-sm text-white/70 mt-1">Gérez vos tâches assignées avec le tableau Kanban</p>
      </div>

      {/* Error Banner */}
      {dragError && (
        <div className="mb-4 bg-red-500/10 border border-red-400/30 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-300">error</span>
          <p className="text-sm text-red-200">{dragError}</p>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">task_alt</span>
          </div>
          <p className="text-sm font-medium text-white/70">Aucune tâche assignée pour le moment.</p>
        </div>
      )}

      {/* Kanban Board */}
      {tasks.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(COLUMNS).map((column) => (
              <div key={column.id} className="glass-board p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm">{column.title}</h3>
                  <span className="bg-white/10 px-2.5 py-1 rounded-full text-xs font-semibold text-white/80 border border-white/15">
                    {getTasksByStatus(column.id).length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-3 ${
                        snapshot.isDraggingOver ? 'bg-white/10 rounded-lg' : ''
                      }`}
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`glass-board p-4 cursor-move transition-all duration-200 ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-white/30 scale-[1.02]' : 'hover:shadow-md hover:scale-[1.01]'
                              }`}
                            >
                              {/* Priority Badge */}
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.LOW}`}>
                                  {task.priority || 'LOW'}
                                </span>
                                {task.due_date && (
                                  <span className="text-xs text-white/50 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                    {formatDate(task.due_date)}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h4 className="font-semibold text-white text-sm mb-2">{task.title}</h4>

                              {/* Description */}
                              <p className="text-xs text-white/70 mb-3">{truncateDescription(task.description)}</p>

                              {/* Created By */}
                              <div className="flex items-center gap-1 text-xs text-white/50">
                                <span className="material-symbols-outlined text-sm">person</span>
                                <span>Créée par {task.created_by || 'Admin'}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
