import { Outlet, NavLink } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

// Sidebar link definitions per role
const ROLE_LINKS = {
  admin: [
    { to: '/employees',             icon: 'group',                label: 'Employees Directory' },
    { to: '/departments',           icon: 'domain',               label: 'Departments' },
    { to: '/statistics',            icon: 'bar_chart',            label: 'Statistics' },
    { to: '/attendance',            icon: 'fingerprint',          label: 'Attendance' },
    { to: '/anomalies',             icon: 'manage_search',        label: 'Anomaly Detection' },
    { to: '/polls',                 icon: 'how_to_vote',          label: 'Polls' },
    { to: '/leave-requests',        icon: 'event',                label: 'Leave Requests' },
    { to: '/tasks',                 icon: 'task_alt',             label: 'Tasks' },
    { to: '/meeting-requests',      icon: 'event_available',      label: 'Meeting Requests' },
    { to: '/broadcast-announcement',icon: 'campaign',             label: 'Notifications' },
    { to: '/rooms',                 icon: 'meeting_room',         label: 'Rooms' },
    { to: '/support-chat',          icon: 'chat',                 label: 'Support Chat' },
    { to: '/learning',              icon: 'school',               label: 'Learning' },
  ],
  manager: [
    { to: '/tasks',            icon: 'task_alt',        label: 'Tasks' },
    { to: '/attendance',       icon: 'fingerprint',     label: 'Attendance' },
    { to: '/anomalies',        icon: 'manage_search',   label: 'Anomaly Detection' },
    { to: '/polls',            icon: 'how_to_vote',     label: 'Polls' },
    { to: '/meeting-requests', icon: 'event_available', label: 'Meeting Requests' },
    { to: '/rooms',            icon: 'meeting_room',    label: 'Rooms' },
    { to: '/learning',         icon: 'school',          label: 'Learning' },
  ],
  hr: [
    { to: '/employees',    icon: 'group',       label: 'Employees Directory' },
    { to: '/leave-requests', icon: 'event',     label: 'Leave Requests' },
    { to: '/attendance',   icon: 'fingerprint', label: 'Attendance' },
    { to: '/anomalies',   icon: 'manage_search', label: 'Anomaly Detection' },
    { to: '/learning',     icon: 'school',      label: 'Learning' },
  ],
  itsupport: [
    { to: '/tickets', icon: 'confirmation_number', label: 'IT Tickets' },
  ],
};

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 relative ${
          isActive
            ? 'bg-white/15 text-white ring-1 ring-white/15'
            : 'text-white/65 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-300 rounded-r-full" />
          )}
          <span className="material-symbols-outlined">{icon}</span>
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function BackOfficeLayout({ userRole }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const links = ROLE_LINKS[userRole] || [];

  const roleLabels = {
    admin: 'Administrator',
    manager: 'Project Manager',
    hr: 'Human Resources',
    itsupport: 'IT Support',
  };

  return (
    <div className="relative min-h-screen flex font-sans">
      {/* Sidebar */}
      <aside className="relative z-10 hidden lg:flex flex-col w-72 bg-white/[0.04] backdrop-blur-2xl border-r border-white/10 p-8 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#1e5aa8] text-white font-bold flex items-center justify-center text-lg shrink-0 shadow-sm ring-1 ring-white/15">
            K
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">Keystone Admin</h1>
            <p className="text-xs text-white/50 mt-0.5">{roleLabels[userRole] || 'Enterprise Management'}</p>
          </div>
          <NotificationBell />
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <SidebarLink key={link.to} to={link.to} icon={link.icon} label={link.label} />
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-red-300/90 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-auto shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 p-8 md:p-12 max-w-6xl mx-auto overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
