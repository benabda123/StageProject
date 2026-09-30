import { useState, useEffect } from 'react';
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService';

const TYPE_ICONS = {
  TASK: 'task_alt',
  LEAVE: 'event_available',
  MEETING: 'calendar_month',
  SYSTEM: 'settings',
  EMPLOYEE: 'person',
  ANNOUNCEMENT: 'campaign'
};

const TYPE_COLORS = {
  TASK: 'bg-blue-50 text-blue-700 border-blue-200',
  LEAVE: 'bg-green-50 text-green-700 border-green-200',
  MEETING: 'bg-purple-50 text-purple-700 border-purple-200',
  SYSTEM: 'bg-gray-50 text-gray-700 border-gray-200',
  EMPLOYEE: 'bg-orange-50 text-orange-700 border-orange-200',
  ANNOUNCEMENT: 'bg-red-50 text-red-700 border-red-200'
};

export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, status: 'READ' } : notif
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, status: 'READ' }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.status === 'UNREAD') {
      handleMarkAsRead(notification.id);
    }
  };

  const groupNotificationsByDate = (notifications) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      older: []
    };

    notifications.forEach(notif => {
      const notifDate = new Date(notif.created_at);
      if (notifDate >= today) {
        groups.today.push(notif);
      } else if (notifDate >= yesterday) {
        groups.yesterday.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    return groups;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  const grouped = groupNotificationsByDate(notifications);
  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 px-4 sm:px-6">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,51,0.12)] w-full max-w-md max-h-[600px] overflow-hidden">
        {/* Header */}
        <div className="bg-[#003366] text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-blue-200">{unreadCount} non lue(s)</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="mt-3 text-xs text-blue-200 hover:text-white transition font-medium"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-gray-300">hourglass_empty</span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-gray-300">notifications</span>
              </div>
              <p className="text-sm font-medium text-gray-500">Aucune notification pour le moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {grouped.today.length > 0 && (
                <div>
                  <div className="px-6 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
                    Aujourd'hui
                  </div>
                  {grouped.today.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onClick={() => handleNotificationClick(notif)}
                      onDelete={() => setDeleteConfirm(notif.id)}
                      isDeleting={deleteConfirm === notif.id}
                      onConfirmDelete={() => handleDelete(notif.id)}
                      onCancelDelete={() => setDeleteConfirm(null)}
                      formatTime={formatTime}
                      typeIcons={TYPE_ICONS}
                      typeColors={TYPE_COLORS}
                    />
                  ))}
                </div>
              )}
              {grouped.yesterday.length > 0 && (
                <div>
                  <div className="px-6 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
                    Hier
                  </div>
                  {grouped.yesterday.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onClick={() => handleNotificationClick(notif)}
                      onDelete={() => setDeleteConfirm(notif.id)}
                      isDeleting={deleteConfirm === notif.id}
                      onConfirmDelete={() => handleDelete(notif.id)}
                      onCancelDelete={() => setDeleteConfirm(null)}
                      formatTime={formatTime}
                      typeIcons={TYPE_ICONS}
                      typeColors={TYPE_COLORS}
                    />
                  ))}
                </div>
              )}
              {grouped.older.length > 0 && (
                <div>
                  <div className="px-6 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
                    Plus ancien
                  </div>
                  {grouped.older.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onClick={() => handleNotificationClick(notif)}
                      onDelete={() => setDeleteConfirm(notif.id)}
                      isDeleting={deleteConfirm === notif.id}
                      onConfirmDelete={() => handleDelete(notif.id)}
                      onCancelDelete={() => setDeleteConfirm(null)}
                      formatTime={formatTime}
                      typeIcons={TYPE_ICONS}
                      typeColors={TYPE_COLORS}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onClick, onDelete, isDeleting, onConfirmDelete, onCancelDelete, formatTime, typeIcons, typeColors }) {
  const icon = typeIcons[notification.type] || 'notifications';
  const colorClass = typeColors[notification.type] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div
      className={`px-6 py-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer relative group ${
        notification.status === 'UNREAD' ? 'bg-blue-50/50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${colorClass}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm text-[#111c2d]">{notification.title}</h4>
            {notification.status === 'UNREAD' && (
              <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">{formatTime(notification.created_at)}</p>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isDeleting) {
              onConfirmDelete();
            } else {
              onDelete();
            }
          }}
          className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-red-50 rounded-lg hover:scale-[1.1] active:scale-[0.95] transition-transform duration-150"
        >
          {isDeleting ? (
            <span className="material-symbols-outlined text-red-600 text-sm">check</span>
          ) : (
            <span className="material-symbols-outlined text-gray-400 hover:text-red-600 text-sm">delete</span>
          )}
        </button>
      </div>

      {isDeleting && (
        <div className="mt-2 text-xs text-red-600">
          Confirmer la suppression ?
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancelDelete();
            }}
            className="ml-2 text-gray-600 hover:text-gray-800"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
