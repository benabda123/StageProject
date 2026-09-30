import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import ContactAdminWidget from '../components/ContactAdminWidget';
import ProfileSettings from '../components/ProfileSettings';
import { getMyProfile } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { to: '/attendance', icon: 'fingerprint',       label: 'Pointage' },
  { to: '/my-leaves',  icon: 'event',             label: 'Mes congés' },
  { to: '/my-tasks',   icon: 'task_alt',          label: 'Mes tâches' },
  { to: '/meetings',   icon: 'event_available',   label: 'Mes réunions' },
  { to: '/polls',     icon: 'how_to_vote',       label: 'Sondages' },
  { to: '/learning',   icon: 'school',            label: 'Learning' },
  { to: '/my-tickets', icon: 'confirmation_number', label: 'Mes tickets' },
];

export default function FrontOfficeLayout() {
  const { logout, tokenParsed } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    getMyProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => console.error('Erreur chargement profil:', err));
  }, []);

  const token = tokenParsed || {};
  const firstName = token.given_name || '';
  const lastName = token.family_name || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || token.preferred_username || 'Employé';
  const initials = (firstName?.[0] || '') + (lastName?.[0] || '') || (displayName || 'E')[0];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
      isActive
        ? 'bg-white/15 text-white border-white/20'
        : 'text-white/70 hover:bg-white/10 hover:text-white border-transparent'
    }`;

  return (
    <div className="relative min-h-screen font-sans">
      {/* Navbar (fond Vanta plein écran fourni par #vanta-canvas) */}
      <nav className="glass-nav">
        {/* a) Gauche : Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#0d1f3c] ring-1 ring-white/15 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md">
            K
          </div>
          <span className="hidden md:block font-bold text-white text-[15px] tracking-tight whitespace-nowrap">
            Keystone
          </span>
        </div>

        {/* b) Centre : Liens */}
        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* c) Droite : Notifications + Avatar + Déconnexion */}
        <div className="flex items-center gap-5">
          <NotificationBell />
          <div className="hidden md:block w-px h-8 bg-white/15" />
          <button
            onClick={() => setProfileOpen(true)}
            title="Mon profil"
            className="hidden md:block rounded-full hover:ring-2 hover:ring-white/30 transition-all duration-200"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003366] to-[#1e5aa8] text-white text-sm font-bold flex items-center justify-center uppercase shadow-sm ring-1 ring-white/10">
                {initials}
              </div>
            )}
          </button>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-300/90 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="hidden lg:inline">Déconnexion</span>
          </button>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            title="Menu"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white/70 hover:bg-white/10 transition-all duration-200"
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile nav links */}
      {mobileOpen && (
        <div className="lg:hidden sticky top-16 z-10 border-b border-white/10 px-6 py-4 space-y-1 bg-[#0a1428]/90 backdrop-blur-xl">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-white/15 text-white border-white/20'
                    : 'text-white/70 hover:bg-white/10 hover:text-white border-transparent'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Zone de contenu principale */}
      <main className="relative z-10 max-w-screen-2xl mx-auto px-6 py-12">
        <Outlet />
      </main>

      {/* Floating Support Chat Widget for Employees */}
      <ContactAdminWidget />

      {/* Profile settings modal */}
      {profileOpen && (
        <ProfileSettings
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onProfileUpdate={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}
