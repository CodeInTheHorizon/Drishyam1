import { Link, useNavigate } from "react-router-dom";
import { HiBars3 } from "react-icons/hi2";
import { FiSettings, FiSun, FiMoon } from "react-icons/fi";
import { FaUserShield, FaUserCheck, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import NotificationDropdown from "./NotificationDropdown";
import kspLogo from "../../assets/images/ksp-emblem.png";

function Navbar({ onToggleMobileMenu }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header 
      className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950/98 font-inter shadow-sm shadow-black/20 px-4 sm:px-6 md:px-8"
    >

      {/* Left Header Section */}
      <div className="flex items-center gap-4 sm:gap-6">

        {/* Hamburger Menu Toggle for Mobile & Tablet (Hidden on Desktop) */}
        <button
          onClick={onToggleMobileMenu}
          className="flex lg:hidden items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-slate-700/70 bg-slate-900/90 hover:bg-slate-800/90 hover:border-blue-500/60 text-slate-200 hover:text-blue-400 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex-shrink-0"
          title="Toggle Navigation Menu"
        >
          <HiBars3 className="text-xl sm:text-2xl" />
        </button>

        <div className="flex items-center gap-3 sm:gap-4 pl-2 sm:pl-3">
          <img
            src={kspLogo}
            alt="Karnataka State Police Emblem"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
          />
          <div>
            <h1 className="text-sm sm:text-lg font-bold tracking-wider text-white uppercase leading-tight mb-0.5 sm:mb-1.5 font-sans">
              Karnataka State Police
            </h1>
            <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-blue-400 font-sans leading-normal">
              AI Crime Intelligence Platform
            </p>
          </div>
        </div>

      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">

        {/* User Badge Info (Desktop / Tablet) */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-3 bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 h-10 sm:h-11 font-mono text-xs shadow-sm">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-sm font-bold bg-blue-600 text-white flex-shrink-0">
              {isAdmin ? <FaUserShield /> : <FaUserCheck />}
            </div>
            <div className="text-left">
              <div className="font-bold text-white leading-none">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                {currentUser.rank} • <span className="text-blue-400 font-bold">{currentUser.role}</span>
              </div>
            </div>
          </div>
        )}

        {/* Theme Toggle Button (Light/Dark mode) */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-slate-700/70 bg-slate-900/90 hover:border-amber-400/60 hover:bg-slate-800/90 text-amber-400 hover:text-amber-300 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer group"
        >
          {isDark ? (
            <FiSun className="text-lg sm:text-xl transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <FiMoon className="text-lg sm:text-xl text-indigo-500 hover:text-indigo-600 transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </button>

        {/* Interactive Notification Bell Dropdown */}
        <NotificationDropdown />

        {/* Settings Icon Button */}
        <Link
          to="/settings"
          className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-slate-700/70 bg-slate-900/90 hover:border-blue-500/60 text-slate-200 hover:text-blue-400 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 group"
          title="Settings"
        >
          <FiSettings className="text-xl sm:text-2xl group-hover:rotate-90 transition-transform duration-300" />
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 sm:px-4 h-10 sm:h-11 text-xs font-mono font-bold text-rose-300 hover:bg-rose-900/50 hover:border-rose-500/60 hover:text-white transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          title="Sign Out"
        >
          <FaSignOutAlt className="text-xs sm:text-sm" />
          <span className="hidden sm:inline">Logout</span>
        </button>

      </div>

    </header>
  );
}

export default Navbar;